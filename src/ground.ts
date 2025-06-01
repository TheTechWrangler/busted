// File: src/ground.ts

import * as THREE from 'three';
import * as CANNON from 'cannon-es';
import { scene } from './scene';
import { world } from './physics';

// Import the grass texture as a URL so Vite can serve it
import grassTextureUrl from '/src/assets/grass.jpg';

const texLoader = new THREE.TextureLoader();
const grassTexture = texLoader.load(grassTextureUrl, (tex) => {
  tex.wrapS = THREE.RepeatWrapping;
  tex.wrapT = THREE.RepeatWrapping;
  tex.repeat.set(10, 10);
});

const groundGeom = new THREE.PlaneGeometry(100, 100);

// Use a Lambert (or Standard) material—no transparency needed since grass.jpg is opaque
const groundMat = new THREE.MeshLambertMaterial({ map: grassTexture });

export const groundMesh = new THREE.Mesh(groundGeom, groundMat);

// Rotate to lie flat
groundMesh.rotation.x = -Math.PI / 2;

// *** Lift the grass just above y=0 to avoid z-fighting ***
groundMesh.position.y = 0.01;

groundMesh.receiveShadow = true;
scene.add(groundMesh);

// Create a static Cannon-es plane for collision at y=0
export const groundBody = new CANNON.Body({
  mass: 0,
  shape: new CANNON.Plane(),
  quaternion: new CANNON.Quaternion().setFromEuler(-Math.PI / 2, 0, 0),
});
world.addBody(groundBody);
