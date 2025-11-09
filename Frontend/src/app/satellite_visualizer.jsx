import { useEffect, useRef } from 'react';
import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { DRACOLoader } from 'three/addons/loaders/DRACOLoader.js';
import { calculateSatellitePosition, createOrbitPath, ISS_PARAMS } from './sat_placer';

export default function SatelliteVisualizer() {
  const mountRef = useRef(null);

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
        geometry.scale(1, 1, 1); // Invert the sphere to see inside
        const material = new THREE.MeshStandardMaterial({
          map: texture,
          side: THREE.BackSide
        });


        const skybox = new THREE.Mesh(geometry, material);
        scene.add(skybox);
        
      },
      // Progress callback (optional)
      (xhr) => {
        console.log((xhr.loaded / xhr.total * 100) + '% loaded');
      },
      // Error callback
      (error) => {
        console.error('Error loading background texture:', error);
      }
    );

    // ---------- Add Fog ----------
    scene.fog = new THREE.Fog(0x000000, 100, 500);

    // ---------- OrbitControls ----------
    const controls = new OrbitControls(camera, renderer.domElement);
    controls.minDistance = 1.5;
    controls.maxDistance = 50;
    controls.enablePan = false;
    controls.target.set(0, 0, 0);
    controls.update();


    // ---------- Load Globe ----------
    let globe;
    let center;
    loader.load(
      '/Globe.glb',
      (gltf) => {
        globe = gltf.scene;
        globe.position.set(0, 0, 0);
        globe.scale.set(.8, .8, .8);

        // Update world matrix after scaling
        globe.updateMatrixWorld(true);
        globe.rotation.y = THREE.MathUtils.degToRad(30); // Rotate to align texture properly
        // Calculate bounding box to find the model's center
        const box = new THREE.Box3().setFromObject(globe);
        const center = box.getCenter(new THREE.Vector3());

        // Offset the globe position to center it at origin
        globe.position.x = -center.x;
        globe.position.y = -center.y;
        globe.position.z = -center.z;



        scene.add(globe);
      },
      undefined,
      (error) => console.error(error)
    );



    // ---------- Load ISS ----------
    let ISS;
    loader.load(
      '/ISS.glb',
      (gltf) => {
        ISS = gltf.scene;
        ISS.position.set(0, 0, 0);
        ISS.scale.set(.05, .05, .05);

        ISS.traverse((child) => {
          if (child.isMesh) {
            if (child.material.map) child.material.map.minFilter = THREE.LinearFilter;
            child.frustumCulled = true;
          }
        });
        const { position } = calculateSatellitePosition(ISS_PARAMS);
        ISS.position.set(position.x, position.y, position.z);
        ISS.rotation.x= Math.PI / 2;
        

        scene.add(ISS);
      },
      undefined,
      (error) => console.error(error)
    );


    // ---------- Animate ----------
    const animate = () => {
      if (ISS) {

        ISS.lookAt(new THREE.Vector3(0, 0, 0));


      }
      renderer.render(scene, camera);
      requestAnimationFrame(animate);
    };
    animate();

    // ---------- Handle resize ----------
    const handleResize = () => {
      camera.aspect = window.innerWidth / window.innerHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(window.innerWidth, window.innerHeight);
    };
    window.addEventListener('resize', handleResize);

  }, []);

  return (
    <div ref={mountRef} style={{ width: '100vw', height: '100vh' }}>
    </div>);
}
