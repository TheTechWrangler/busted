// File: src/main.ts

import * as THREE from 'three';
import { scene, camera, renderer, inventory } from './scene';
import { world } from './physics';
import './ground';
import { loadTreeAt } from './treeLoader';
import { Hoverbike } from './entities/hoverbike';
import { Player } from './entities/Player';
import { GUI } from 'dat.gui';
import Stats from 'stats.js';
import { controls, registerMountCallback, setBuildMode, isBuildModeEnabled } from './controls';
import InventoryUI from './ui/InventoryUI';
import { HotbarUI } from './ui/HotbarUI';
import {
  animateBuildMenu,
  loadSavedPlacements,
  show as showBuildMenu,
  hide as hideBuildMenu,
  onMouseDown,
} from './adminBuildMenu';

// ─────────────────────────────────────────────
// Init UI
// ─────────────────────────────────────────────
const inventoryUI = new InventoryUI(inventory);
const hotbarUI = new HotbarUI();

// ✅ Listen for changes to Hotbar and sync Inventory
document.querySelectorAll('.hotbar-slot').forEach((slot) => {
  slot.addEventListener('drop', (e) => {
    const event = e as DragEvent;
    const data = event.dataTransfer?.getData('text/plain');
    if (data) {
      try {
        const dropped = JSON.parse(data);
        inventory.removeItem(dropped.id, 1);
        inventoryUI.update(); // 🔄 Force real-time UI refresh if open
      } catch (err) {
        console.warn('[main] Failed to remove inventory item:', err);
      }
    }
  });
});

// ─────────────────────────────────────────────
// Camera Zoom
// ─────────────────────────────────────────────
const MIN_FOV = 30;
const MAX_FOV = 100;
window.addEventListener('wheel', (event) => {
  camera.fov = THREE.MathUtils.clamp(
    camera.fov + event.deltaY * 0.05,
    MIN_FOV,
    MAX_FOV
  );
  camera.updateProjectionMatrix();
});

// ─────────────────────────────────────────────
// Player Setup
// ─────────────────────────────────────────────
const player = new Player(camera, scene);
const blocker = document.getElementById('blocker')!;
const instructions = document.getElementById('instructions')!;
let hasClickedPlay = false;

instructions.addEventListener('click', () => {
  player.controls.lock();
  hasClickedPlay = true;
});
;(player.controls as any).addEventListener('lock', () => {
  blocker.style.display = 'none';
});
;(player.controls as any).addEventListener('unlock', () => {
  if (!hasClickedPlay) {
    blocker.style.display = 'flex';
  }
});

// ─────────────────────────────────────────────
// Tree Border
// ─────────────────────────────────────────────
const step = 20;
const halfSize = 50;
const positions: [number, number][] = [];
for (let x = -halfSize; x <= halfSize; x += step) positions.push([x, -halfSize]);
for (let z = -halfSize + step; z <= halfSize; z += step) positions.push([halfSize, z]);
for (let x = halfSize - step; x >= -halfSize; x -= step) positions.push([x, halfSize]);
for (let z = halfSize - step; z > -halfSize; z -= step) positions.push([-halfSize, z]);
positions.forEach(([x, z]) => loadTreeAt(x, z));

// ─────────────────────────────────────────────
// Hoverbike
// ─────────────────────────────────────────────
const hoverbike = new Hoverbike({
  scene,
  world,
  controls,
  spawnX: 5,
  spawnZ: 0,
  baseHeight: 0.8,
  hoverSpeed: 1.5,
  hoverAmplitude: 0.4,
  scale: 0.005,
});

// ─────────────────────────────────────────────
// Mount/Dismount Logic
// ─────────────────────────────────────────────
registerMountCallback(() => {
  const bikePos = hoverbike.object3d.position;
  const playerPos = player.controls.getObject().position;
  const dist = bikePos.distanceTo(playerPos);

  if (!hoverbike.isMounted && dist < 2) {
    hoverbike.mount(player.controls, () => player.disableControls());
  } else if (hoverbike.isMounted) {
    hoverbike.dismount(player.controls, () => player.enableControls());
  }
});

// ─────────────────────────────────────────────
// Stats & Debug GUI
// ─────────────────────────────────────────────
const stats = new Stats();
stats.showPanel(0);
document.body.appendChild(stats.dom);

const gui = new GUI({ width: 300 });
const debugSettings = { showStats: true, showPhysics: false };
gui.add(debugSettings, 'showStats').name('Show Stats').onChange((value) => {
  stats.dom.style.display = value ? 'block' : 'none';
});
gui.add(debugSettings, 'showPhysics').name('Show Physics').onChange((value) => {
  player.setPhysicsDebug(value, scene);
});

// ─────────────────────────────────────────────
// Build Mode Toggle
// ─────────────────────────────────────────────
loadSavedPlacements();
window.addEventListener('keydown', (e) => {
  if (e.key === 'Tab') {
    e.preventDefault();
    const nowBuild = !isBuildModeEnabled();
    setBuildMode(nowBuild);

    if (nowBuild) {
      showBuildMenu();
    } else {
      hideBuildMenu();
      player.controls.lock();
    }
  }
});

window.addEventListener('mousedown', (event) => {
  if (event.button === 0) {
    onMouseDown();
  }
});

// ─────────────────────────────────────────────
// Animation Loop
// ─────────────────────────────────────────────
const clock = new THREE.Clock();

function animate() {
  stats.begin();
  world.fixedStep();
  player.update(clock.getDelta());
  hoverbike.update(clock.getDelta());
  animateBuildMenu();
  renderer.render(scene, camera);
  stats.end();
  requestAnimationFrame(animate);
}

animate();
