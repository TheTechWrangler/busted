// File: src/controls/FirstPersonControls.ts

import {
  EventDispatcher,
  PerspectiveCamera,
  Object3D,
  Vector3
} from 'three';
import * as CANNON from 'cannon-es';

declare global {
  interface HTMLElementEventMap {
    pointerlockchange: Event;
  }
}

export class FirstPersonControls extends EventDispatcher {
  private camera: PerspectiveCamera;
  public enabled = false;
  private yawObject: Object3D;
  private pitchObject: Object3D;
  private domElement: HTMLElement = document.body;

  private moveForward = false;
  private moveBackward = false;
  private moveLeft = false;
  private moveRight = false;
  private wantJump = false; // track a jump request

  // Tweakable speeds
  private movementSpeed = 10;
  private mouseSensitivity = 0.002;
  private jumpSpeed = 8;

  constructor(camera: PerspectiveCamera) {
    super();
    this.camera = camera;

    // Create yaw/pitch hierarchy so we can separate horizontal vs vertical rotation
    this.yawObject = new Object3D();
    this.pitchObject = new Object3D();
    this.yawObject.add(this.pitchObject);
    this.pitchObject.add(this.camera);

    // Attach pointer‐lock / mouse / keyboard listeners
    document.addEventListener('pointerlockchange', this.onPointerLockChange);
    document.addEventListener('mousemove', this.onMouseMove);
    document.addEventListener('keydown', this.onKeyDown);
    document.addEventListener('keyup', this.onKeyUp);
  }

  /** Used by Player.ts to add the yawObject (with camera) into the scene */
  public getObject() {
    return this.yawObject;
  }

  public lock() {
    this.domElement.requestPointerLock();
  }

  public unlock() {
    document.exitPointerLock();
  }

  private onPointerLockChange = () => {
    if (document.pointerLockElement === this.domElement) {
      this.enabled = true;
      // Cast to any so TS won’t complain that 'lock' is not a known event type
      this.dispatchEvent({ type: 'lock' } as any);
    } else {
      this.enabled = false;
      this.dispatchEvent({ type: 'unlock' } as any);
    }
  };

  private onMouseMove = (event: MouseEvent) => {
    if (!this.enabled) return;
    const movementX = event.movementX || 0;
    const movementY = event.movementY || 0;

    this.yawObject.rotation.y -= movementX * this.mouseSensitivity;
    this.pitchObject.rotation.x -= movementY * this.mouseSensitivity;
    this.pitchObject.rotation.x = Math.max(
      -Math.PI / 2,
      Math.min(Math.PI / 2, this.pitchObject.rotation.x)
    );
  };

  private onKeyDown = (event: KeyboardEvent) => {
    switch (event.code) {
      case 'KeyW':
        this.moveForward = true;
        break;
      case 'KeyS':
        this.moveBackward = true;
        break;
      case 'KeyA':
        this.moveLeft = true;
        break;
      case 'KeyD':
        this.moveRight = true;
        break;
      case 'Space':
        this.wantJump = true;
        break;
    }
  };

  private onKeyUp = (event: KeyboardEvent) => {
    switch (event.code) {
      case 'KeyW':
        this.moveForward = false;
        break;
      case 'KeyS':
        this.moveBackward = false;
        break;
      case 'KeyA':
        this.moveLeft = false;
        break;
      case 'KeyD':
        this.moveRight = false;
        break;
    }
  };

  /**
   * Called each frame by Player.update().
   * - delta: time since last frame (unused here but could drive smoothing)
   * - body: the Cannon-es Body for the player
   */
  public update(delta: number, body: CANNON.Body) {
    if (!this.enabled) return;

    // 1) Horizontal movement (WASD → x/z velocity)
    const inputVelocity = { x: 0, y: 0, z: 0 };
    if (this.moveForward) inputVelocity.z -= 1;
    if (this.moveBackward) inputVelocity.z += 1;
    if (this.moveLeft) inputVelocity.x -= 1;
    if (this.moveRight) inputVelocity.x += 1;

    const velocity = body.velocity;
    const currentY = velocity.y; // preserve vertical velocity

    if (inputVelocity.x !== 0 || inputVelocity.z !== 0) {
      const vector = new Vector3(inputVelocity.x, 0, inputVelocity.z);
      vector.normalize();
      vector.applyQuaternion(this.yawObject.quaternion);
      vector.multiplyScalar(this.movementSpeed);
      body.velocity.set(vector.x, currentY, vector.z);
    } else {
      body.velocity.set(0, currentY, 0);
    }

    // 2) Jump logic (Space)
    const RADIUS = 1.0;
    const EPSILON = 0.05;
    const onGround = body.position.y <= RADIUS + EPSILON;

    if (this.wantJump && onGround) {
      body.velocity.set(velocity.x, this.jumpSpeed, velocity.z);
    }
    this.wantJump = false;

    // 3) Sync camera container position to physics body
    this.yawObject.position.set(
      body.position.x,
      body.position.y,
      body.position.z
    );
  }
}
