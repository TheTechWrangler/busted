// File: src/controls.ts

import { PointerLockControls as _PointerLockControls } from 'three/examples/jsm/controls/PointerLockControls.js';
import * as THREE from 'three';
import { inventory } from './scene'; // ✅ Import inventory for KeyR clearing
import { hotbar } from './scene';    // ✅ Make sure this is exported from scene.ts

// ─────────────────────────────────────────────────────────────────────────────
// Build Mode Flag (just track if menu is open; does NOT disable movement)
// ─────────────────────────────────────────────────────────────────────────────
let buildModeEnabled = false;
export function setBuildMode(enabled: boolean) {
  buildModeEnabled = enabled;
}
export function isBuildModeEnabled(): boolean {
  return buildModeEnabled;
}

// ─────────────────────────────────────────────────────────────────────────────
// 1) Create a single “controls” object for movement logic
// ─────────────────────────────────────────────────────────────────────────────
export const controls = {
  forward:  false,
  backward: false,
  left:     false,
  right:    false,
  jump:     false,
  descend:  false,
};

// ─────────────────────────────────────────────────────────────────────────────
// 2) PointerLockControls instance (used in Player.ts)
// ─────────────────────────────────────────────────────────────────────────────
export const PointerLockControls = _PointerLockControls;

// ─────────────────────────────────────────────────────────────────────────────
// 3) Mount callback array — for hoverbike and future mounts
// ─────────────────────────────────────────────────────────────────────────────
const mountCallbacks: Array<() => void> = [];
export function registerMountCallback(fn: () => void) {
  mountCallbacks.push(fn);
}

// ─────────────────────────────────────────────────────────────────────────────
// 4) Player movement toggling (for mounting logic)
// ─────────────────────────────────────────────────────────────────────────────
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

// ─────────────────────────────────────────────────────────────────────────────
// 5) Keyboard event listeners
// ─────────────────────────────────────────────────────────────────────────────
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
      mountCallbacks.forEach((fn) => fn());
      break;
    case 'KeyR':
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
    case 'Digit1':
    case 'Digit2':
    case 'Digit3':
    case 'Digit4':
    case 'Digit5':
    case 'Digit6':
    case 'Digit7':
    case 'Digit8':
    case 'Digit9':
    case 'Digit0': {
      const index = (parseInt(e.code.replace('Digit', '')) + 9) % 10; // 1-0 maps to 0-9
      const item = hotbar.getSlots()[index];
      if (item) {
        console.log(`[Hotbar] Using item in slot ${index}:`, item);
        // TODO: Hook up item usage here
      } else {
        console.log(`[Hotbar] Slot ${index} is empty`);
      }

      // 🔶 Highlight selected slot using CSS class
      document.querySelectorAll('.hotbar-slot').forEach(slot => {
        (slot as HTMLElement).classList.remove('selected');
      });

      const selectedSlot = document.querySelector(`.hotbar-slot[data-index="${index}"]`) as HTMLElement;
      if (selectedSlot) {
        selectedSlot.classList.add('selected');
      }

      break;
    }
  }
});
