import * as THREE from 'three';
import { scene, camera, renderer, inventory } from './scene';
import { world } from './physics';
import './ground';
import { loadTreeAt } from './treeLoader';
import { Hoverbike } from './entities/hoverbike';
import { Player } from './entities/Player';
import { GUI } from 'dat.gui';
import Stats from 'stats.js';
import { controls, registerMountCallback } from './controls';
import { InventoryUI } from './ui/InventoryUI';

// ✅ Use shared inventory instance from scene.ts
const inventoryUI = new InventoryUI(inventory);

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
// Player Setup
// ───────────────────────────────────────────────────────────────────────────────
const player = new Player(camera, scene);

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
// Place trees around the 100×100 border
// ───────────────────────────────────────────────────────────────────────────────
const step = 20;
const halfSize = 50;
const positions: [number, number][] = [];
for (let x = -halfSize; x <= halfSize; x += step) {
  positions.push([x, -halfSize]);
}
for (let z = -halfSize + step; z <= halfSize; z += step) {
  positions.push([halfSize, z]);
}
for (let x = halfSize - step; x >= -halfSize; x -= step) {
  positions.push([x, halfSize]);
}
for (let z = halfSize - step; z > -halfSize; z -= step) {
  positions.push([-halfSize, z]);
}
positions.forEach(([x, z]) => loadTreeAt(x, z));

// ───────────────────────────────────────────────────────────────────────────────
// Create a single Hoverbike (all orientation/scale now in hoverbike.ts)
// ───────────────────────────────────────────────────────────────────────────────
const hoverbike = new Hoverbike({
  scene,
  world,
  controls,
  spawnX: 5,
  spawnZ: 0,
  baseHeight: .8,
  hoverSpeed: 1.5,
  hoverAmplitude: 0.4,
  scale: 0.005,
});

// ───────────────────────────────────────────────────────────────────────────────
// Centralized Mount/Dismount Handler (moved into controls.ts)
// ───────────────────────────────────────────────────────────────────────────────
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

// ───────────────────────────────────────────────────────────────────────────────
// Stats.js & dat.GUI
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
  hoverbike.update(clock.getDelta());

  renderer.render(scene, camera);
  stats.end();

  requestAnimationFrame(animate);
}

animate();
