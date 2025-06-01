// src/woodTextures.ts
import * as THREE from 'three';
  
// 1) List all filenames exactly as they appear under public/textures/wood
const woodFiles = [
  "Wood.jpg",
  "Wood_01.jpg",
  "Wood_1.jpg",
  "Wood_2.jpg",
  "Wood_5.jpg",
  "Wood_6.jpg",
  "Wood_09.jpg",
  "Wood_14.jpg"
];

// 2) Load each texture into a THREE.Texture and store in an array
export const woodTextures: THREE.Texture[] = woodFiles.map(filename => {
  const loader = new THREE.TextureLoader();
  const tex = loader.load(`/textures/wood/${filename}`, () => {
    tex.encoding = THREE.sRGBEncoding;
    tex.wrapS = THREE.RepeatWrapping;
    tex.wrapT = THREE.RepeatWrapping;
  });
  return tex;
});

// 3) Helper to pick a random wood texture (in case you want variety)
export function getRandomWoodTexture(): THREE.Texture {
  const idx = Math.floor(Math.random() * woodTextures.length);
  return woodTextures[idx];
}
