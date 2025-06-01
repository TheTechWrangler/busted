// src/modelLoader.ts
import * as THREE from 'three';
import { FBXLoader } from 'three/examples/jsm/loaders/FBXLoader.js'; // or use ColladaLoader if .dae
import { buildCatalog } from './buildCatalog';
import { getRandomWoodTexture } from './woodTextures';
import { scene } from './scene';

// Keep track of loaded models so we don’t load the same FBX multiple times
const fbxCache: Record<string, THREE.Group> = {};

// 1) Call this to load a tree model, apply a random (or specified) bark, and return a clone
export function spawnTree(itemId: string, position: THREE.Vector3, rotation?: THREE.Euler) {
  const catalogItem = buildCatalog.find(i => i.id === itemId);
  if (!catalogItem || catalogItem.type !== "model" || !catalogItem.modelPath) return null;

  const path = catalogItem.modelPath;
  const scale = catalogItem.scale ?? 1;

  // If we’ve already loaded this FBX once, reuse its cached Group
  if (fbxCache[path]) {
    const original = fbxCache[path];
    const clone = original.clone(true);
    
    // Apply bark texture (if specified) or random fallback
    let barkTex: THREE.Texture;
    if (catalogItem.barkTexturePath) {
      barkTex = new THREE.TextureLoader().load(catalogItem.barkTexturePath);
    } else {
      barkTex = getRandomWoodTexture();
    }
    clone.traverse(node => {
      if ((node as THREE.Mesh).isMesh) {
        const mesh = node as THREE.Mesh;
        mesh.material = new THREE.MeshStandardMaterial({ map: barkTex });
        mesh.castShadow = true;
        mesh.receiveShadow = true;
      }
    });

    // Set position, rotation, and scale
    clone.position.copy(position);
    if (rotation) clone.rotation.copy(rotation);
    clone.scale.set(scale, scale, scale);

    scene.add(clone);
    return clone;
  }

  // Otherwise, load the FBX from disk
  const loader = new FBXLoader();
  loader.load(path,
    (object) => {
      // Cache the loaded object (so subsequent calls reuse it)
      fbxCache[path] = object;

      // Now that it’s loaded, call spawnTree again to handle cloning/applying texture
      spawnTree(itemId, position, rotation);
    },
    undefined,
    (err) => {
      console.error(`Error loading model ${path}:`, err);
    }
  );
  return null; // actual object will appear when loadCallback runs
}
