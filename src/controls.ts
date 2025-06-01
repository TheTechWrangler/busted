// File: src/controls.ts

/**
 * Centralized controls module. Tracks WASD, Space, Ctrl, and mount key (E).
 * Other modules read `controls` for movement flags and register a mount callback.
 */

type ControlsState = {
  forward: boolean;
  backward: boolean;
  left: boolean;
  right: boolean;
  sprint: boolean;
  jump: boolean;
  descend: boolean;
};

const controls: ControlsState = {
  forward: false,
  backward: false,
  left: false,
  right: false,
  sprint: false,
  jump: false,
  descend: false,
};

// Callback to invoke when the user presses “E”
let mountCallback: (() => void) | null = null;

/** Register a function to call on “E” key press */
function registerMountCallback(cb: () => void) {
  mountCallback = cb;
}

function onKeyDown(e: KeyboardEvent) {
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
    case 'ShiftLeft':
    case 'ShiftRight':
      controls.sprint = true;
      break;
    case 'Space':
      controls.jump = true;
      break;
    case 'ControlLeft':
    case 'ControlRight':
      controls.descend = true;
      break;
    case 'KeyE':
      if (mountCallback) mountCallback();
      break;
  }
}

function onKeyUp(e: KeyboardEvent) {
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
    case 'ShiftLeft':
    case 'ShiftRight':
      controls.sprint = false;
      break;
    case 'Space':
      controls.jump = false;
      break;
    case 'ControlLeft':
    case 'ControlRight':
      controls.descend = false;
      break;
  }
}

window.addEventListener('keydown', onKeyDown);
window.addEventListener('keyup', onKeyUp);

export { controls, registerMountCallback };
export type { ControlsState };
