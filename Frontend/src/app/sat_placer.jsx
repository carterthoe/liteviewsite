// SatPlacer.jsx
import * as THREE from 'three';

// Constants
const EARTH_RADIUS_KM = 6371;
const EARTH_ROTATION_RATE = 360 / (23.9344696 * 60); // degrees per minute (sidereal day)

/**
 * Calculate the current position of a satellite in 3D space
 * @param {Object} params - Orbital parameters
 * @param {number} params.period - Orbital period in minutes
 * @param {number} params.inclination - Orbital inclination in degrees
 * @param {number} params.apogee - Apogee altitude in km (above Earth's surface)
 * @param {number} params.perigee - Perigee altitude in km (above Earth's surface)
 * @param {Date|string} params.launchDate - Launch date of the satellite
 * @param {number} params.scale - Scale factor for Three.js units (default 0.001)
 * @param {Date} params.currentTime - Current time to calculate position for (default: now)
 * @param {number} params.ascendingNode - Right ascension of ascending node in degrees (default: 0)
 * @param {number} params.argumentOfPerigee - Argument of perigee in degrees (default: 0)
 * @returns {Object} Position {x, y, z} and additional orbital data
 */
export function calculateSatellitePosition(params) {
  const {
    period,
    inclination,
    apogee,
    perigee,
    launchDate,
    scale = 0.001,
    currentTime = new Date(),
    ascendingNode = 0,
    argumentOfPerigee = 0
  } = params;

  // Convert launch date to Date object if string
  const launch = typeof launchDate === 'string' ? new Date(launchDate) : launchDate;
  
  // Calculate time elapsed since launch in minutes
  const elapsedMs = currentTime - launch;
  let elapsedMinutes = (elapsedMs / (1000 * 60));

  
  // Calculate orbital parameters
  const semiMajorAxis = EARTH_RADIUS_KM + (apogee + perigee) / 2;
  const eccentricity = (apogee - perigee) / (apogee + perigee + 2 * EARTH_RADIUS_KM);
  
  // Calculate mean motion (revolutions per minute)
  const meanMotion = 1 / period;
  
  // Calculate mean anomaly (how far through the orbit we are)
  const orbitsCompleted = elapsedMinutes / period;
  const meanAnomaly = (orbitsCompleted % 1) * 360; // in degrees
  
  // For small eccentricity, we can approximate true anomaly ≈ mean anomaly
  // For more accuracy, you'd solve Kepler's equation
  let trueAnomaly = meanAnomaly;
  
  // For elliptical orbits, apply first-order correction
  if (eccentricity > 0.01) {
    const E = meanAnomaly + eccentricity * Math.sin(THREE.MathUtils.degToRad(meanAnomaly));
    trueAnomaly = 2 * Math.atan2(
      Math.sqrt(1 + eccentricity) * Math.sin(E / 2),
      Math.sqrt(1 - eccentricity) * Math.cos(E / 2)
    );
    trueAnomaly = THREE.MathUtils.radToDeg(trueAnomaly);
  }
  
  // Calculate distance from Earth's center
  const radius = semiMajorAxis * (1 - eccentricity * eccentricity) / 
                 (1 + eccentricity * Math.cos(THREE.MathUtils.degToRad(trueAnomaly)));
  
  // Convert to radians
  const incRad = THREE.MathUtils.degToRad(inclination);
  const nodeRad = THREE.MathUtils.degToRad(ascendingNode);
  const argPerRad = THREE.MathUtils.degToRad(argumentOfPerigee);
  const trueAnomalyRad = THREE.MathUtils.degToRad(trueAnomaly);
  
  // Calculate position in orbital plane
  const argOfLatitude = argPerRad + trueAnomalyRad;
  
  // Earth rotation adjustment (simplified)
  const earthRotation = EARTH_ROTATION_RATE * elapsedMinutes;
  const adjustedNode = nodeRad + THREE.MathUtils.degToRad(earthRotation);
  
  // Convert to 3D Cartesian coordinates
  const x = radius * (
    Math.cos(adjustedNode) * Math.cos(argOfLatitude) -
    Math.sin(adjustedNode) * Math.sin(argOfLatitude) * Math.cos(incRad)
  );
  
  const y = radius * (
    Math.sin(adjustedNode) * Math.cos(argOfLatitude) +
    Math.cos(adjustedNode) * Math.sin(argOfLatitude) * Math.cos(incRad)
  );
  
  const z = radius * Math.sin(argOfLatitude) * Math.sin(incRad);
  
  // Apply scale factor for Three.js
  const scaledPosition = {
    x: x * scale,
    y: y * scale,
    z: z * scale
  };
  
  return {
    position: scaledPosition,
    orbitalData: {
      altitude: radius - EARTH_RADIUS_KM,
      velocity: calculateOrbitalVelocity(radius),
      orbitsCompleted: Math.floor(orbitsCompleted),
      percentageComplete: (orbitsCompleted % 1) * 100,
      trueAnomaly,
      radius
    }
  };
}

/**
 * Calculate orbital velocity at a given radius
 * @param {number} radius - Distance from Earth's center in km
 * @returns {number} Velocity in km/s
 */
function calculateOrbitalVelocity(radius) {
  const GM = 398600.4418; // Earth's gravitational parameter (km³/s²)
  return Math.sqrt(GM / radius);
}

/**
 * Create an orbital path for visualization
 * @param {Object} params - Same parameters as calculateSatellitePosition
 * @param {number} segments - Number of segments for the orbit path (default: 100)
 * @returns {THREE.BufferGeometry} Geometry for the orbital path
 */
export function createOrbitPath(params, segments = 100) {
  const points = [];
  const { period, inclination, apogee, perigee, scale = 0.001, ascendingNode = 0 } = params;
  
  const semiMajorAxis = EARTH_RADIUS_KM + (apogee + perigee) / 2;
  const scaledRadius = semiMajorAxis * scale;
  
  for (let i = 0; i <= segments; i++) {
    const angle = (i / segments) * Math.PI * 2;
    
    // Create points in orbital plane
    let x = Math.cos(angle) * scaledRadius;
    let y = 0;
    let z = Math.sin(angle) * scaledRadius;
    
    // Apply inclination rotation
    const incRad = THREE.MathUtils.degToRad(inclination);
    const nodeRad = THREE.MathUtils.degToRad(ascendingNode);
    
    // Rotate for inclination
    const tempY = y * Math.cos(incRad) - z * Math.sin(incRad);
    const tempZ = y * Math.sin(incRad) + z * Math.cos(incRad);
    y = tempY;
    z = tempZ;
    
    // Rotate for ascending node
    const tempX = x * Math.cos(nodeRad) - y * Math.sin(nodeRad);
    const tempY2 = x * Math.sin(nodeRad) + y * Math.cos(nodeRad);
    x = tempX;
    y = tempY2;
    
    points.push(new THREE.Vector3(x, y, z));
  }
  
  return new THREE.BufferGeometry().setFromPoints(points);
}

/**
 * Helper function to update satellite position in real-time
 * @param {THREE.Object3D} satelliteObject - The Three.js object to update
 * @param {Object} orbitalParams - Orbital parameters
 */
export function updateSatellitePosition(satelliteObject, orbitalParams) {
  const { position, orbitalData } = calculateSatellitePosition(orbitalParams);
  
  satelliteObject.position.set(position.x, position.y, position.z);
  
  satelliteObject.lookAt(new THREE.Vector3(0, 0, 0));
  satelliteObject.rotateY(Math.PI/-2); 


  console.log(satelliteObject.position);
  
  return orbitalData;
}

// Example usage for ISS
export const ISS_PARAMS = {
  period: 92.9,           // minutes
  inclination: 51.634,    // degrees
  apogee: 421,           // km
  perigee: 416,          // km
  launchDate: '1998-11-20',
  scale: 0.001           // Adjust based on your scene scale
};