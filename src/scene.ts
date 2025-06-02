import {
  Scene,
  Color,
  PerspectiveCamera,
  WebGLRenderer,
  HemisphereLight,
  DirectionalLight,
  PlaneGeometry,
  MeshStandardMaterial,
  Mesh,
  TextureLoader,
  Texture,
  MeshBasicMaterial,
  DoubleSide,
  LinearEncoding
} from 'three';

import { PickupItem } from './entities/PickupItem';
import { InventorySystem } from './systems/InventorySystem';
import { InventoryItem } from './types/InventoryItems';
import { world } from './physics';
import { HotbarUI } from './ui/HotbarUI';

export const scene = new Scene();
scene.background = new Color(0xaaaaaa);

export const hotbar = new HotbarUI();


// ─────────────────────────────────────────────────────────
// Camera Setup
// ─────────────────────────────────────────────────────────
export const camera = new PerspectiveCamera(
  75,
  window.innerWidth / window.innerHeight,
  0.1,
  1000
);
camera.position.set(0, 2, 5);

// ─────────────────────────────────────────────────────────
// Renderer Setup
// ─────────────────────────────────────────────────────────
export const renderer = new WebGLRenderer({ antialias: true });
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.shadowMap.enabled = true;
document.body.appendChild(renderer.domElement);

window.addEventListener('resize', () => {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
});

// ─────────────────────────────────────────────────────────
// Lights
// ─────────────────────────────────────────────────────────
const hemiLight = new HemisphereLight(0xffffff, 0x444444, 0.6);
hemiLight.position.set(0, 50, 0);
scene.add(hemiLight);

const dirLight = new DirectionalLight(0xffffff, 0.8);
dirLight.position.set(-5, 10, -5);
dirLight.castShadow = true;
dirLight.shadow.camera.top = 10;
dirLight.shadow.camera.bottom = -10;
dirLight.shadow.camera.left = -10;
dirLight.shadow.camera.right = 10;
dirLight.shadow.mapSize.set(1024, 1024);
scene.add(dirLight);

// ─────────────────────────────────────────────────────────
// Inventory + Pickups Setup
// ─────────────────────────────────────────────────────────
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
  new Mesh(new PlaneGeometry(), new MeshStandardMaterial()).position.set(3, 1, 3)
);

pickups.push(item);

// ─────────────────────────────────────────────────────────
// “E” Key to Collect Nearby
// ─────────────────────────────────────────────────────────
window.addEventListener('keydown', (e) => {
  if (e.code === 'KeyE') {
    pickups.forEach(p => p.tryCollect(camera.position));
  }
});

// ─────────────────────────────────────────────────────────
// Ground Plane
// ─────────────────────────────────────────────────────────
export const ground = new Mesh(
  new PlaneGeometry(200, 200),
  new MeshStandardMaterial({ color: 0x556644 })
);
ground.rotation.x = -Math.PI / 2;
ground.name = "ground";
ground.receiveShadow = true;
scene.add(ground);

// ─────────────────────────────────────────────────────────
// Billboard Meshes Array
// ─────────────────────────────────────────────────────────
export const billboardMeshes: Array<InstanceType<typeof Mesh>> = [];

// ─────────────────────────────────────────────────────────
// Helper to Scatter Billboards
// ─────────────────────────────────────────────────────────
export function scatterBranches(imagePath: string, count: number, radius: number) {
  const loader = new TextureLoader();
  const texture = loader.load(imagePath);
  texture.encoding = LinearEncoding;

  for (let i = 0; i < count; i++) {
    const size = 5;
    const mat = new MeshBasicMaterial({
      map: texture,
      transparent: true,
      depthWrite: false,
      side: DoubleSide
    });
    const geo = new PlaneGeometry(size, size);
    const mesh = new Mesh(geo, mat);

    const angle = Math.random() * Math.PI * 2;
    const r = Math.random() * radius;
    mesh.position.set(Math.cos(angle) * r, 2, Math.sin(angle) * r);

    mesh.lookAt(camera.position);

    scene.add(mesh);
    billboardMeshes.push(mesh);
  }
}
