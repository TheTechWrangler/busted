// File: src/main.ts

import * as THREE from 'three';
import { GUI } from 'dat.gui';
import Stats from 'stats.js';
import * as CANNON from 'cannon-es';
import { Player } from './entities/Player';

// ----------------------------------------------------------------
//  Scene & Camera Setup (unchanged)
// ----------------------------------------------------------------
const scene = new THREE.Scene();
scene.background = new THREE.Color(0xaaaaaa);

const camera = new THREE.PerspectiveCamera(
  75,
  window.innerWidth / window.innerHeight,
  0.1,
  1000
);
camera.position.set(0, 2, 5);

// ----------------------------------------------------------------
//  Scroll-to-Zoom Listener (unchanged)
// ----------------------------------------------------------------
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

// ----------------------------------------------------------------
//  Renderer & Resize (unchanged)
// ----------------------------------------------------------------
const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(window.innerWidth, window.innerHeight);
document.body.appendChild(renderer.domElement);

window.addEventListener('resize', () => {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
});

// ----------------------------------------------------------------
//  Lights (unchanged)
// ----------------------------------------------------------------
const hemiLight = new THREE.HemisphereLight(0xffffff, 0x444444, 0.6);
hemiLight.position.set(0, 50, 0);
scene.add(hemiLight);

const dirLight = new THREE.DirectionalLight(0xffffff, 0.8);
dirLight.position.set(-5, 10, -5);
scene.add(dirLight);

// ----------------------------------------------------------------
//  Physics World (unchanged)
// ----------------------------------------------------------------
const world = new CANNON.World({
  gravity: new CANNON.Vec3(0, -9.82, 0),
});
world.broadphase = new CANNON.SAPBroadphase(world);
;(world.solver as any).iterations = 10;

// ----------------------------------------------------------------
//  Ground (100×100 Plane with Grass Texture)
// ----------------------------------------------------------------

// 1. Import your grass texture from the assets folder:
import grassTextureUrl from '/src/assets/grass.jpg';

// 2. Load it with Three.js’s TextureLoader:
const loader = new THREE.TextureLoader();
const grassTexture = loader.load(grassTextureUrl, (tex) => {
  // As soon as the texture is loaded, set these properties:
  tex.wrapS = THREE.RepeatWrapping;
  tex.wrapT = THREE.RepeatWrapping;
  // repeat 10×10 over a 100×100 plane (each tile = 10×10 units)
  tex.repeat.set(10, 10);
});

// 3. Create the plane geometry & material using that texture:
const groundGeom = new THREE.PlaneGeometry(100, 100);
const groundMat = new THREE.MeshLambertMaterial({
  map: grassTexture,
});
const groundMesh = new THREE.Mesh(groundGeom, groundMat);

// 4. Rotate & add it to the scene:
groundMesh.rotation.x = -Math.PI / 2;
scene.add(groundMesh);

// 5. Create the static physics body for the plane:
const groundBody = new CANNON.Body({
  mass: 0, // static
  shape: new CANNON.Plane(),
  quaternion: new CANNON.Quaternion().setFromEuler(-Math.PI / 2, 0, 0),
});
world.addBody(groundBody);

// (Optional) If you still want the grid helper for debugging, you can keep it or comment it out:
// const grid = new THREE.GridHelper(100, 100, 0x444444, 0x444444);
// grid.position.y = 0.01;
// scene.add(grid);

// ----------------------------------------------------------------
//  Player Setup (unchanged)
// ----------------------------------------------------------------
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

// ----------------------------------------------------------------
//  Stats & Debug GUI (unchanged)
// ----------------------------------------------------------------
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

// ----------------------------------------------------------------
//  Animation Loop (unchanged)
// ----------------------------------------------------------------
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
