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

export function loadTreeAt(x: number, z: number) {
  const mtlLoader = new MTLLoader();
  const objLoader = new OBJLoader();

  console.log(`Loading OakTree.mtl from: ${MTL_URL}`);
  console.log(`Loading OakTree.obj from: ${OBJ_URL}`);

  // 1) Load the .mtl (materials & texture references)
  mtlLoader.load(
    MTL_URL,
    (materials) => {
      materials.preload();
      objLoader.setMaterials(materials);

      // 2) Load the .obj
      objLoader.load(
        OBJ_URL,
        (object) => {
          // Flip the model upright: convert Z-up → Y-up
          object.rotation.x = -Math.PI / 2;

          // Scale the tree to 12% of its original size
          object.scale.set(0.12, 0.12, 0.12);

          // Enable shadows on each mesh
          object.traverse((child) => {
            if ((child as THREE.Mesh).isMesh) {
              const mesh = child as THREE.Mesh;
              mesh.castShadow = true;
              mesh.receiveShadow = true;
            }
          });

          // Recompute bounding box & sink the base slightly below y=0
          object.updateMatrixWorld(true);
          const bbox = new THREE.Box3().setFromObject(object);
          const minY = bbox.min.y;
          const sinkAmount = 0.05;
          object.position.y -= (minY + sinkAmount);

          // Position horizontally at (x, z)
          object.position.x = x;
          object.position.z = z;
          scene.add(object);

          // Optional: add a simple cylinder collider for the trunk
          const trunkRadius = 0.5 * 0.12;
          const trunkHeight = 5 * 0.5 * 0.12;
          const trunkShape = new CANNON.Cylinder(
            trunkRadius,
            trunkRadius,
            trunkHeight,
            16
          );
          const trunkBody = new CANNON.Body({ mass: 0 });
          trunkBody.addShape(trunkShape);
          trunkBody.position.set(x, trunkHeight / 2 - sinkAmount, z);
          world.addBody(trunkBody);
        },
        undefined,
        (err) => {
          console.error('Error loading OakTree OBJ:', err);
        }
      );
    },
    undefined,
    (err) => {
      console.error('Error loading OakTree MTL:', err);
    }
  );
}
