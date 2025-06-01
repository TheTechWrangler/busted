// File: src/controls.ts

import { PointerLockControls as _PointerLockControls } from 'three/examples/jsm/controls/PointerLockControls.js';
import * as THREE from 'three';
import { inventory } from './scene'; // ✅ Import inventory for KeyR clearing

// ──────────────────────────────────────────────────────────────────────────────────────────────────────────────────
// Build Mode Flag (just track if menu is open; does NOT disable movement)
// ──────────────────────────────────────────────────────────────────────────────────────────────────────────────────
let buildModeEnabled = false;
export function setBuildMode(enabled: boolean) {
  buildModeEnabled = enabled;
}
export function isBuildModeEnabled(): boolean {
  return buildModeEnabled;
}

// ──────────────────────────────────────────────────────────────────────────────────────────────────────────────────
// 1) Create a single “controls” object whose boolean flags we’ll read in Hoverbike.update()
// ──────────────────────────────────────────────────────────────────────────────────────────────────────────────────
export const controls = {
  forward:  false,
  backward: false,
  left:     false,
  right:    false,
  jump:     false,
  descend:  false,
};

// ──────────────────────────────────────────────────────────────────────────────────────────────────────────────────
// 2) Create a real PointerLockControls instance for the Player’s camera.
//    Use this in Player.ts to lock/unlock the camera.
// ──────────────────────────────────────────────────────────────────────────────────────────────────────────────────
export const PointerLockControls = _PointerLockControls;

// ──────────────────────────────────────────────────────────────────────────────────────────────────────────────────
// 3) This array will hold all “mount” callbacks (called when user presses “E”). Hoverbike mounting logic lives in main.ts.
// ──────────────────────────────────────────────────────────────────────────────────────────────────────────────────
const mountCallbacks: Array<() => void> = [];
export function registerMountCallback(fn: () => void) {
  mountCallbacks.push(fn);
}

// ──────────────────────────────────────────────────────────────────────────────────────────────────────────────────
// 4) Player‐movement toggles: if you want to disable the Player’s own WASD while on bike, use disablePlayer() / enablePlayer().
// ──────────────────────────────────────────────────────────────────────────────────────────────────────────────────
let playerMovementEnabled = true;
export function disablePlayer() {
  playerMovementEnabled = false;
}
export function enablePlayer() {
  playerMovementEnabled = true;
}
export function isPlayerMovementEnabled() {
  return playerMovementEnabled;
}

// ──────────────────────────────────────────────────────────────────────────────────────────────────────────────────
// 5) Listen for keydown/keyup to flip the above boolean flags + call mount callbacks on “E” + clear inventory on “R”.
//    We do NOT short‐circuit when buildModeEnabled is true, so movement always works.
// ──────────────────────────────────────────────────────────────────────────────────────────────────────────────────
document.addEventListener('keydown', (e) => {
  switch (e.code) {
    case 'KeyW':
      controls.forward = true;
      break;
    case 'KeyS':
      controls.backward = true;
      break;
    case 'KeyA':
      controls.left = true;
      break;
    case 'KeyD':
      controls.right = true;
      break;
    case 'Space':
      controls.jump = true;
      break;
    case 'ControlLeft':
    case 'ControlRight':
      controls.descend = true;
      break;
    case 'KeyE':
      // “E” toggles mount/dismount
      mountCallbacks.forEach((fn) => fn());
      break;
    case 'KeyR':
      // “R” clears the inventory
      inventory.clear();
      break;
  }
});

document.addEventListener('keyup', (e) => {
  switch (e.code) {
    case 'KeyW':
      controls.forward = false;
      break;
    case 'KeyS':
      controls.backward = false;
      break;
    case 'KeyA':
      controls.left = false;
      break;
    case 'KeyD':
      controls.right = false;
      break;
    case 'Space':
      controls.jump = false;
      break;
    case 'ControlLeft':
    case 'ControlRight':
      controls.descend = false;
      break;
  }
});
