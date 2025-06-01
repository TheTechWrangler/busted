// File: src/entities/Player.ts

import * as THREE from 'three';
import { PointerLockControls } from 'three/examples/jsm/controls/PointerLockControls.js';
import { controls } from '../controls';

export class Player {
  public controls: PointerLockControls;
  private enabled = false;

  private velocityY = 0;
  private gravity = 9.8;
  private onGround = true;

  constructor(
    private camera: THREE.PerspectiveCamera,
    scene: THREE.Scene
  ) {
    this.controls = new PointerLockControls(camera, document.body);

    this.controls.addEventListener('lock', () => {
      this.enabled = true;
    });
    this.controls.addEventListener('unlock', () => {
      this.enabled = false;
    });

    // Start camera ~1.6 units above ground
    this.controls.getObject().position.set(0, 1.6, 0);
    scene.add(this.controls.getObject());
  }

  public update(deltaTime: number) {
    if (!this.enabled) return;

    // Jump
    if (controls.jump && this.onGround) {
      this.velocityY = 5;
      this.onGround = false;
    }

    // Gravity
    if (!this.onGround) {
      this.velocityY -= this.gravity * deltaTime;
      const newY = this.controls.getObject().position.y + this.velocityY * deltaTime;
      if (newY <= 1.6) {
        this.controls.getObject().position.y = 1.6;
        this.velocityY = 0;
        this.onGround = true;
      } else {
        this.controls.getObject().position.y = newY;
      }
    }

    // Camera‐relative movement
    const direction = new THREE.Vector3();
    this.camera.getWorldDirection(direction);
    direction.y = 0;
    direction.normalize();

    const right = new THREE.Vector3();
    right.crossVectors(direction, new THREE.Vector3(0, 1, 0)).normalize();

    let move = new THREE.Vector3();
    if (controls.forward) move.add(direction);
    if (controls.backward) move.sub(direction);
    if (controls.right) move.add(right);
    if (controls.left) move.sub(right);

    if (move.lengthSq() > 0) {
      move.normalize();
      const speed = 5;
      const deltaMove = move.multiplyScalar(speed * deltaTime);
      this.controls.getObject().position.add(deltaMove);
    }
  }

  public disableControls() {
    this.enabled = false;
  }

  public enableControls() {
    this.enabled = true;
  }

  public setPhysicsDebug(_show: boolean, _scene: THREE.Scene) {
    // no-op
  }
}
