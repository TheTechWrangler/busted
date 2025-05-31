// File: src/treeLoader.ts

import * as THREE from 'three';
import * as CANNON from 'cannon-es';
import { MTLLoader } from 'three/examples/jsm/loaders/MTLLoader.js';
import { OBJLoader } from 'three/examples/jsm/loaders/OBJLoader.js';
import { scene } from './scene';
import { world } from './physics';

// Vite’s “?url” trick so these assets are served at runtime
import OBJ_URL from '/src/assets/tree/OakTree.obj?url';
import MTL_URL from '/src/assets/tree/OakTree.mtl?url';

export function loadTree() {
  const mtlLoader = new MTLLoader();
  const objLoader = new OBJLoader();

  console.log('Loading OakTree.mtl from:', MTL_URL);
  console.log('Loading OakTree.obj from:', OBJ_URL);

  // Step 1: load the .mtl (materials & texture references)
  mtlLoader.load(
    MTL_URL,
    (materials) => {
      console.log('MTL loaded successfully');
      materials.preload();
      objLoader.setMaterials(materials);

      // Step 2: load the .obj
      objLoader.load(
        OBJ_URL,
        (object) => {
          console.log('OBJ loaded successfully');

          // Fix orientation: flip around Z‐axis so tree stands upright
          object.rotation.z = Math.PI;

          // Scale down to 40% of original (a bit smaller)
          object.scale.set(0.4, 0.4, 0.4);

          // Enable shadows on each mesh
          object.traverse((child) => {
            if ((child as THREE.Mesh).isMesh) {
              const mesh = child as THREE.Mesh;
              mesh.castShadow = true;
              mesh.receiveShadow = true;
            }
          });

          // Recompute bounding box & lift so bottom of trunk sits at y=0
          object.updateMatrixWorld(true);
          const bbox = new THREE.Box3().setFromObject(object);
          const minY = bbox.min.y;
          object.position.y -= minY;

          // Position horizontally (x=10, z=-5)
          object.position.x = 10;
          object.position.z = -5;
          scene.add(object);

          // Step 3: add a simple cylinder collider for the trunk
          // (Approximate trunk radius=0.5, height=5 → scaled by 0.4)
          const trunkRadius = 0.5 * 0.4;
          const trunkHeight = 5 * 0.5 * 0.4;
          const trunkShape = new CANNON.Cylinder(
            trunkRadius,
            trunkRadius,
            trunkHeight,
            16
          );
          const trunkBody = new CANNON.Body({ mass: 0 });
          trunkBody.addShape(trunkShape);
          trunkBody.position.set(10, trunkHeight / 2, -5);
          world.addBody(trunkBody);
        },
        (xhr) => {
          console.log(`Tree ${(xhr.loaded / xhr.total) * 100}% loaded`);
        },
        (err) => {
          console.error('Error loading OakTree OBJ:', err);
        }
      );
    },
    (xhr) => {
      console.log(`MTL ${(xhr.loaded / xhr.total) * 100}% loaded`);
    },
    (err) => {
      console.error('Error loading OakTree MTL:', err);
    }
  );
}
