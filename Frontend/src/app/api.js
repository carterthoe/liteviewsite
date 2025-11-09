const API_URL = '/api/satcat';

/**
 * Fetches satellite catalog data from the API
 * @returns {Promise<Array>} Array of parsed satellite objects
 * @throws {Error} If the fetch fails or response is invalid
 */
export async function fetchSatelliteData() {
  try {
    console.log('Fetching satellite data from API...');
    
    const response = await fetch(API_URL);
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status} - ${response.statusText}`);
    }
    
    const data = await response.json();
    
    // Validate response structure
    if (!data || !data.satcat_data) {
      throw new Error('Invalid API response: missing satcat_data');
    }
    
    console.log(`Received ${data.satcat_data.length} satellites from API`);
    
    const parsedData = parseSatelliteData(data);
    console.log(`Successfully parsed ${parsedData.length} satellites`);
    
    return parsedData;
    
  } catch (error) {
    console.error('Error fetching satellite data:', error);
    throw new Error(`Failed to fetch satellite data: ${error.message}`);
  }
}


/**
 * Parses raw satellite data from the API into a format suitable for visualization
 * @param {Object} rawData - Raw data object from the API
 * @param {boolean} onlyWithOrbitalData - If true, only include satellites with complete orbital data (default: false)
 * @returns {Array} Array of parsed satellite objects formatted for 3D position calculation
 */
function parseSatelliteData(rawData) {
  // Extract the satellite array from the response
  const satellites = rawData.satcat_data || [];
  
  if (!Array.isArray(satellites)) {
    console.error('satcat_data is not an array:', satellites);
    return [];
  }
  
  // Map and parse each satellite
  const parsed = satellites.map((sat, index) => {
    try {
      // Parse orbital parameters
      const period = parseFloat(sat.PERIOD) || null;
      const inclination = parseFloat(sat.INCLINATION) || null;
      const apogee = parseFloat(sat.APOGEE) || null;
      const perigee = parseFloat(sat.PERIGEE) || null;
      
      // Skip satellites with null orbital parameters if requested
    if (period === null || inclination === null || apogee === null || perigee === null) {
        return null;
    }
      
      return {
        launchDate: sat.LAUNCH ? new Date(sat.LAUNCH) : null,
        period: period,              // Orbital period in minutes
        inclination: inclination,    // Orbital inclination in degrees
        apogee: apogee,             // Apogee altitude in km (above Earth's surface)
        perigee: perigee,
        scale: 0.001,               // Scale factor for Three.js units


        // Validation flag - true if satellite has all data needed for 3D positioning
        hasOrbitalData: (
          period !== null && 
          inclination !== null && 
          apogee !== null && 
          perigee !== null
        ),
        
        // Raw data reference (useful for debugging)
        _raw: sat
      };
    } catch (error) {
      console.error(`Error parsing satellite at index ${index}:`, error, sat);
      return null;
    }
  }).filter(sat => sat !== null); // Remove any failed parses
  
  return parsed;
}


// Export all functions as default object
export default {
  fetchSatelliteData
};
