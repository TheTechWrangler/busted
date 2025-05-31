// File: src/main.ts

import * as THREE from 'three';
import { scene, camera, renderer } from './scene';
import { world } from './physics';
import './ground';              // side‐effect: adds groundMesh + groundBody
import { loadTreeAt } from './treeLoader';
import { Player } from './entities/Player';
import { GUI } from 'dat.gui';
import Stats from 'stats.js';

// ───────────────────────────────────────────────────────────────────────────────
// Scroll-to-Zoom Listener
// ───────────────────────────────────────────────────────────────────────────────
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

// ───────────────────────────────────────────────────────────────────────────────
// Player & Pointer-Lock Setup
// ───────────────────────────────────────────────────────────────────────────────
const player = new Player(camera, world, scene);
const blocker = document.getElementById('blocker')!;
const instructions = document.getElementById('instructions')!;

instructions.addEventListener('click', () => {
  player.controls.lock();
});
;(player.controls as any).addEventListener('lock', () => {
  blocker.style.display = 'none';
});
;(player.controls as any).addEventListener('unlock', () => {
  blocker.style.display = 'flex';
});

// ───────────────────────────────────────────────────────────────────────────────
// Place trees around the 100×100 ground border
// ───────────────────────────────────────────────────────────────────────────────
const step = 20; // spacing between trees
const halfSize = 50; // since plane is 100×100 centered at (0,0)
const positions: [number, number][] = [];

// Bottom border (z = -halfSize)
for (let x = -halfSize; x <= halfSize; x += step) {
  positions.push([x, -halfSize]);
}
// Right border (x = halfSize)
for (let z = -halfSize + step; z <= halfSize; z += step) {
  positions.push([halfSize, z]);
}
// Top border (z = halfSize)
for (let x = halfSize - step; x >= -halfSize; x -= step) {
  positions.push([x, halfSize]);
}
// Left border (x = -halfSize)
for (let z = halfSize - step; z > -halfSize; z -= step) {
  positions.push([-halfSize, z]);
}

// Load a tree at each border position
positions.forEach(([x, z]) => {
  loadTreeAt(x, z);
});

// ───────────────────────────────────────────────────────────────────────────────
// Stats.js (FPS) & dat.GUI
// ───────────────────────────────────────────────────────────────────────────────
const stats = new Stats();
stats.showPanel(0);
document.body.appendChild(stats.dom);

const gui = new GUI({ width: 300 });
const debugSettings = { showStats: true, showPhysics: false };
gui
  .add(debugSettings, 'showStats')
  .name('Show Stats')
  .onChange((value) => {
    stats.dom.style.display = value ? 'block' : 'none';
  });
gui
  .add(debugSettings, 'showPhysics')
  .name('Show Physics')
  .onChange((value) => {
    player.setPhysicsDebug(value, scene);
  });

// ───────────────────────────────────────────────────────────────────────────────
// Animation Loop
// ───────────────────────────────────────────────────────────────────────────────
const clock = new THREE.Clock();

function animate() {
  stats.begin();

  world.fixedStep();
  player.update(clock.getDelta());
  renderer.render(scene, camera);

  stats.end();
  requestAnimationFrame(animate);
}

animate();
