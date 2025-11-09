import { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { DRACOLoader } from 'three/addons/loaders/DRACOLoader.js';
import { calculateSatellitePosition, createOrbitPath, updateSatellitePosition, ISS_PARAMS } from './Sat_placer.jsx';
import { fetchSatelliteData } from './api.js';
import React from 'react'


export default function SatelliteVisualizer() {
  const mountRef = useRef(null);
  const [loadingStatus, setLoadingStatus] = useState({
    globe: false,
    iss: false,
    background: false,
    progress: 0
  });

  // Calculate overall loading progress
  const isFullyLoaded = loadingStatus.globe && loadingStatus.iss && loadingStatus.background;
  const loadingProgress = Math.round(
    ((loadingStatus.globe ? 33 : 0) + 
     (loadingStatus.iss ? 33 : 0) + 
     (loadingStatus.background ? 34 : 0))
  );

  useEffect(() => {
    const mount = mountRef.current;
    if (!mount) return;

    // ---------- Scene ----------
    const scene = new THREE.Scene();

    // ---------- Camera ----------
    const camera = new THREE.PerspectiveCamera(
      75,
      window.innerWidth / window.innerHeight,
      0.1,
      1000
    );

    // ---------- Renderer ----------
    const renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.localClippingEnabled = true;
    mount.appendChild(renderer.domElement);

    // Hide canvas initially
    renderer.domElement.style.opacity = '0';
    renderer.domElement.style.transition = 'opacity 0.5s ease-in';

    // ---------- Lights ----------
    const sun = new THREE.DirectionalLight(0xffffff, 1);
    sun.position.set(4, 4, 4);
    scene.add(sun);

    const ambient = new THREE.AmbientLight(0xffffff, 0.6);
    scene.add(ambient);

    // ---------- Loaders ----------
    const dracoLoader = new DRACOLoader();
    dracoLoader.setDecoderPath('https://www.gstatic.com/draco/v1/decoders/');
    dracoLoader.setDecoderConfig({ type: 'js' });

    const loader = new GLTFLoader();
    loader.setDRACOLoader(dracoLoader);

    // ------Load Star Background------
    const textureLoader = new THREE.TextureLoader();
    let skybox;

    textureLoader.load(
      '/SpaceBackground.jpg',
      (texture) => {
        const geometry = new THREE.SphereGeometry(500, 60, 40);
        geometry.scale(1, 1, 1);
        const material = new THREE.MeshStandardMaterial({
          map: texture,
          side: THREE.BackSide
        });

        const skybox = new THREE.Mesh(geometry, material);
        scene.add(skybox);
        
        // Update loading status
        setLoadingStatus(prev => ({ ...prev, background: true }));
      },
      // Progress callback
      (xhr) => {
        const percentComplete = (xhr.loaded / xhr.total * 100);
        console.log('Background: ' + percentComplete + '% loaded');
      },
      // Error callback
      (error) => {
        console.error('Error loading background texture:', error);
        // Still mark as loaded to not block the app
        setLoadingStatus(prev => ({ ...prev, background: true }));
      }
    );

    // ---------- Add Fog ----------
    scene.fog = new THREE.Fog(0x000000, 100, 500);

    // ---------- OrbitControls ----------
    const controls = new OrbitControls(camera, renderer.domElement);
    controls.minDistance = 7;
    controls.maxDistance = 50;
    controls.enablePan = false;
    controls.target.set(0, 0, 0);
    camera.position.set(15, 0, 0);
    controls.update();

    // ---------- Load Globe ----------
    let globe;
    loader.load(
      '/Globe.glb',
      (gltf) => {
        globe = gltf.scene;
        globe.position.set(0, 0, 0);
        globe.scale.set(.8, .8, .8);

        globe.updateMatrixWorld(true);
        globe.rotation.y = THREE.MathUtils.degToRad(180);
        
        const box = new THREE.Box3().setFromObject(globe);
        const center = box.getCenter(new THREE.Vector3());

        globe.position.x = -center.x;
        globe.position.y = -center.y;
        globe.position.z = -center.z;

        scene.add(globe);
        
        // Update loading status
        setLoadingStatus(prev => ({ ...prev, globe: true }));
      },
      // Progress callback
      (xhr) => {
        const percentComplete = (xhr.loaded / xhr.total * 100);
        console.log('Globe: ' + percentComplete + '% loaded');
      },
      (error) => {
        console.error('Error loading Globe:', error);
        // You might want to show an error message here
      }
    );

    // ---------- Load ISS ----------
    let ISS;
    loader.load(
      '/ISSc.glb',
      (gltf) => {
        ISS = gltf.scene;
        ISS.position.set(0, 0, 0);
        ISS.scale.set(.06, .06, .06);

        ISS.traverse((child) => {
          if (child.isMesh) {
            if (child.material.map) child.material.map.minFilter = THREE.LinearFilter;
            child.frustumCulled = true;
          }
        });
        
        const { position } = calculateSatellitePosition(ISS_PARAMS);
        ISS.position.set(position.x, position.y, position.z);

        scene.add(ISS);
        
        // Update loading status
        setLoadingStatus(prev => ({ ...prev, iss: true }));
      },
      // Progress callback
      (xhr) => {
        const percentComplete = (xhr.loaded / xhr.total * 100);
        console.log('ISS: ' + percentComplete + '% loaded');
      },
      (error) => {
        console.error('Error loading ISS:', error);
        // You might want to show an error message here
      }
    );

    // ---------- Load Other Satellites ----------
    let satsdata = [];
    let sats=[];
    const loadSatellites = async () => {

      try {
        satsdata = await fetchSatelliteData();
        for (const satdata of satsdata) {
          const satelliteGeo = new THREE.SphereGeometry(0.1);
          const material = new THREE.MeshBasicMaterial({ color: 0xff0000 });
          const satellite = new THREE.Mesh(satelliteGeo, material);
          sats=[...sats,satellite];
          updateSatellitePosition(satellite, satdata);
          console.log(satellite.position);
          scene.add(satellite);
        }
      } catch (error) {
        console.log('Error loading satellite data:', error);
      }
    };
    
    // Start loading satellites
    loadSatellites();
    // ---------- Animate ----------
    let animationId;
    const animate = () => {
      if (ISS) {
        updateSatellitePosition(ISS, ISS_PARAMS);
      }
      if (sats) {
        for (let a = 0; a < sats.length; a++) {
          updateSatellitePosition(sats[a], satsdata[a]);
        }
      }

      // Only render if everything is loaded
      if (isFullyLoaded) {
        renderer.render(scene, camera);
      }
      
      animationId = requestAnimationFrame(animate);
    };

    // Start animation but only show when loaded
    animate();

    // Show canvas when everything is loaded
    if (isFullyLoaded) {
      setTimeout(() => {
        renderer.domElement.style.opacity = '1';
      }, 100);
    }

    // ---------- Handle resize ----------
    const handleResize = () => {
      camera.aspect = window.innerWidth / window.innerHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(window.innerWidth, window.innerHeight);
    };
    window.addEventListener('resize', handleResize);

    // Cleanup
    return () => {
      window.removeEventListener('resize', handleResize);
      if (animationId) {
        cancelAnimationFrame(animationId);
      }
      mount.removeChild(renderer.domElement);
      renderer.dispose();
    };
  }, [isFullyLoaded]);

  return (
    <>
      {/* Loading Screen */}
      {!isFullyLoaded && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          width: '100vw',
          height: '100vh',
          backgroundColor: '#000814',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          alignItems: 'center',
          zIndex: 9999,
          color: 'white',
          fontFamily: 'Arial, sans-serif'
        }}>
          {/* Logo/Title */}
          <div style={{
            fontSize: '2.5rem',
            fontWeight: 'bold',
            marginBottom: '1rem',
            background: 'linear-gradient(45deg, #00b4d8, #90e0ef)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            textAlign: 'center'
          }}>
            🛸 Satellite Visualizer
          </div>
          
          {/* Loading Status Text */}
          <div style={{
            fontSize: '1rem',
            marginBottom: '2rem',
            color: '#90e0ef',
            textAlign: 'center'
          }}>
            Loading Space Environment...
          </div>

          {/* Progress Bar Container */}
          <div style={{
            width: '300px',
            height: '6px',
            backgroundColor: 'rgba(255, 255, 255, 0.1)',
            borderRadius: '3px',
            overflow: 'hidden',
            marginBottom: '1rem'
          }}>
            {/* Progress Bar Fill */}
            <div style={{
              width: `${loadingProgress}%`,
              height: '100%',
              background: 'linear-gradient(90deg, #00b4d8, #90e0ef)',
              borderRadius: '3px',
              transition: 'width 0.3s ease',
              boxShadow: '0 0 10px rgba(0, 180, 216, 0.5)'
            }} />
          </div>

          {/* Percentage */}
          <div style={{
            fontSize: '1.5rem',
            fontWeight: 'bold',
            marginBottom: '2rem',
            color: '#00b4d8'
          }}>
            {loadingProgress}%
          </div>

          {/* Individual Item Status */}
          <div style={{
            display: 'flex',
            gap: '2rem',
            fontSize: '0.9rem'
          }}>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
              opacity: loadingStatus.globe ? 1 : 0.5
            }}>
              {loadingStatus.globe ? '✅' : '⏳'} Earth
            </div>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
              opacity: loadingStatus.iss ? 1 : 0.5
            }}>
              {loadingStatus.iss ? '✅' : '⏳'} ISS
            </div>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
              opacity: loadingStatus.background ? 1 : 0.5
            }}>
              {loadingStatus.background ? '✅' : '⏳'} Stars
            </div>
          </div>

          {/* Animated Loading Dots */}
          <div style={{
            marginTop: '2rem',
            fontSize: '2rem',
            display: 'flex',
            gap: '0.3rem'
          }}>
            <span style={{
              animation: 'pulse 1.4s infinite',
              animationDelay: '0s'
            }}>.</span>
            <span style={{
              animation: 'pulse 1.4s infinite',
              animationDelay: '0.2s'
            }}>.</span>
            <span style={{
              animation: 'pulse 1.4s infinite',
              animationDelay: '0.4s'
            }}>.</span>
          </div>

          {/* CSS for animations */}
          <style>{`
            @keyframes pulse {
              0%, 60%, 100% {
                opacity: 0.3;
                transform: scale(1);
              }
              30% {
                opacity: 1;
                transform: scale(1.2);
              }
            }
          `}</style>
        </div>
      )}

      {/* Three.js Canvas Container */}
      <div ref={mountRef} style={{ width: '100vw', height: '100vh' }} />
    </>
  );
}