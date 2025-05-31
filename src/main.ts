// File: src/main.ts

import * as THREE from 'three';            // ← Add this import
import { scene, camera, renderer } from './scene';
import { world } from './physics';
import './ground';             // side-effect: adds groundMesh + groundBody
import { loadTree } from './treeLoader';
import { Player } from './entities/Player';
import { GUI } from 'dat.gui';
import Stats from 'stats.js';

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
// Load Oak Tree into Scene
// ───────────────────────────────────────────────────────────────────────────────
loadTree();

// ───────────────────────────────────────────────────────────────────────────────
// Stats.js (FPS) & dat.GUI
// ───────────────────────────────────────────────────────────────────────────────
const stats = new Stats();
stats.showPanel(0); // 0 = FPS
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
const clock = new THREE.Clock();   // ← Now THREE is defined

function animate() {
  stats.begin();

  // Step physics
  world.fixedStep();

  // Update player (movement, jump, camera sync)
  player.update(clock.getDelta());

  // Render the scene
  renderer.render(scene, camera);

  stats.end();
  requestAnimationFrame(animate);
}

animate();
