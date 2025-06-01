import * as THREE from 'three';
import { PickupItem } from './entities/PickupItem';
import { InventorySystem } from './systems/InventorySystem';
import { InventoryItem } from './types/InventoryItems';
import { world } from './physics';

export const scene = new THREE.Scene();
scene.background = new THREE.Color(0xaaaaaa);

export const camera = new THREE.PerspectiveCamera(
  75,
  window.innerWidth / window.innerHeight,
  0.1,
  1000
);
camera.position.set(0, 2, 5);

export const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.shadowMap.enabled = true;
document.body.appendChild(renderer.domElement);

window.addEventListener('resize', () => {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
});

// Lights
const hemiLight = new THREE.HemisphereLight(0xffffff, 0x444444, 0.6);
hemiLight.position.set(0, 50, 0);
scene.add(hemiLight);

const dirLight = new THREE.DirectionalLight(0xffffff, 0.8);
dirLight.position.set(-5, 10, -5);
dirLight.castShadow = true;
dirLight.shadow.camera.top = 10;
dirLight.shadow.camera.bottom = -10;
dirLight.shadow.camera.left = -10;
dirLight.shadow.camera.right = 10;
dirLight.shadow.mapSize.set(1024, 1024);
scene.add(dirLight);

// ———————————————————————
// ✅ Inventory + Pickups Setup
// ———————————————————————
export const inventory = new InventorySystem();
const pickups: PickupItem[] = [];

const potion: InventoryItem = {
  id: 'potion',
  name: 'Health Potion',
  quantity: 1,
  icon: 'https://i.imgur.com/3mKkLNM.png'
};

const item = new PickupItem(
  scene,
  world,
  potion,
  inventory,
  new THREE.Vector3(3, 1, 3)
);

pickups.push(item);

// ———————————————————————
// ✅ “E” Key to Collect Nearby
// ———————————————————————
window.addEventListener('keydown', (e) => {
  if (e.code === 'KeyE') {
    pickups.forEach(p => p.tryCollect(camera.position));
  }
});
