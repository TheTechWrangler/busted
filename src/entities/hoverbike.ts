// File: src/entities/Hoverbike.ts

import * as THREE from 'three';
import * as CANNON from 'cannon-es';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { scene } from '../scene';
import { world } from '../physics';
import { controls } from '../controls';
import type { PointerLockControls } from 'three/examples/jsm/controls/PointerLockControls.js';

import MODEL_URL from '/src/assets/hoverbike.glb?url';

type HoverbikeOptions = {
  x?: number;
  z?: number;
  baseHeight?: number;
  hoverSpeed?: number;
  hoverAmplitude?: number;
  scale?: number;
};

export class Hoverbike {
  public object3d: THREE.Object3D = new THREE.Group();
  private gltfLoader = new GLTFLoader();
  private meshReady = false;

  private body: CANNON.Body | null = null;
  private elapsed = 0;

  private opts: Required<HoverbikeOptions> = {
    x: 5,                // keeps it away from player’s spawn
    z: 0,
    baseHeight: 2,
    hoverSpeed: 1.5,
    hoverAmplitude: 0.4,
    scale: 0.015,        // 1.5% of original
  };

  public isMounted = false;
  private cameraOriginalParent: THREE.Object3D | null = null;
  private playerObjectOriginalPosition: THREE.Vector3 | null = null;
  private controlsObject: PointerLockControls | null = null;

  constructor(options?: HoverbikeOptions) {
    if (options) this.opts = { ...this.opts, ...options };

    this.gltfLoader.load(
      MODEL_URL,
      (gltf) => {
        this.object3d = gltf.scene;
        this.object3d.traverse((child) => {
          if ((child as THREE.Mesh).isMesh) {
            const mesh = child as THREE.Mesh;
            mesh.castShadow = true;
            mesh.receiveShadow = true;
          }
        });

        // ─── Scale = 1.5% of original ───────────────────────────────────────
        this.object3d.scale.set(
          this.opts.scale,
          this.opts.scale,
          this.opts.scale
        );

        // ─── Rotate model so it sits upright (fix left‐side down) ──────────
        // First: convert Z-up → Y-up
        this.object3d.rotation.x = -Math.PI / 2;
        // Then: roll it 90° so its left side is no longer down
        this.object3d.rotation.z = -Math.PI / 2;
        // Leave rotation.y = 0 for now; bike faces +Z by default

        // ─── Place it at (5, 0, 0); Y will be set in update() ─────────────
        this.object3d.position.set(this.opts.x, 0, this.opts.z);

        scene.add(this.object3d);

        // ─── Create simple cylinder collider ────────────────────────────────
        const cylRadius = 0.5 * this.opts.scale;
        const cylHeight = 2 * this.opts.scale;
        const shape = new CANNON.Cylinder(cylRadius, cylRadius, cylHeight, 12);
        const body = new CANNON.Body({ mass: 1 });
        body.addShape(shape);
        body.position.set(this.opts.x, this.opts.baseHeight, this.opts.z);
        world.addBody(body);
        this.body = body;

        this.meshReady = true;
      },
      (xhr) => {
        console.log(`Hoverbike ${(xhr.loaded / xhr.total) * 100}% loaded`);
      },
      (err) => {
        console.error('Error loading Hoverbike GLB:', err);
      }
    );
  }

  /**
   * Mount: parent PointerLockControls.getObject() under the bike,
   * move camera up + behind, and disable player movement (pointer-lock stays).
   */
  public mount(
    controlsObject: PointerLockControls,
    playerControlsDisable: () => void
  ) {
    if (!this.meshReady || this.isMounted || !this.body) return;

    this.controlsObject = controlsObject;
    this.cameraOriginalParent = controlsObject.getObject().parent!;
    this.playerObjectOriginalPosition = controlsObject.getObject().position.clone();

    // Reparent the whole controls‐pivot under the bike:
    this.object3d.add(controlsObject.getObject());
    // Lift camera up + a bit behind so you’re not staring at the bottom:
    controlsObject.getObject().position.set(0, 1.0, -0.5);
    controlsObject.getObject().lookAt(this.object3d.position);

    playerControlsDisable();
    this.isMounted = true;
  }

  /**
   * Dismount: reattach controls pivot to its original parent & position,
   * then re-enable player movement (pointer-lock remains).
   */
  public dismount(
    controlsObject: PointerLockControls,
    playerControlsEnable: () => void
  ) {
    if (
      !this.isMounted ||
      !this.body ||
      !this.cameraOriginalParent ||
      !this.playerObjectOriginalPosition
    )
      return;

    this.object3d.remove(controlsObject.getObject());
    this.cameraOriginalParent.add(controlsObject.getObject());
    controlsObject.getObject().position.copy(this.playerObjectOriginalPosition);

    playerControlsEnable();
    this.isMounted = false;
    this.controlsObject = null;
  }

  public update(deltaTime: number) {
    if (!this.meshReady || !this.body) return;

    // ─── Hover bob (sine wave) ───────────────────────────────────────────────
    this.elapsed += deltaTime;
    const hoverY =
      Math.sin(this.elapsed * this.opts.hoverSpeed) * this.opts.hoverAmplitude;

    // Only apply Space/Ctrl vertical offsets when mounted
    const extraY =
      this.isMounted && controls.jump
        ? 0.1
        : this.isMounted && controls.descend
        ? -0.1
        : 0;

    const targetY = this.opts.baseHeight + hoverY + extraY;
    this.body.position.y = targetY;

    // ─── Drive when Mounted ────────────────────────────────────────────────
    if (this.isMounted && this.controlsObject) {
      // Extract yaw from the camera pivot
      const yaw = this.controlsObject.getObject().rotation.y;

      // Build bike‐local forward (−Z) + right (+X) in world
      const forwardVec = new THREE.Vector3(0, 0, -1)
        .applyEuler(new THREE.Euler(0, yaw, 0))
        .normalize();
      const rightVec = new THREE.Vector3(1, 0, 0)
        .applyEuler(new THREE.Euler(0, yaw, 0))
        .normalize();

      let move = new THREE.Vector3();
      if (controls.forward) move.add(forwardVec);
      if (controls.backward) move.sub(forwardVec);
      if (controls.right) move.add(rightVec);
      if (controls.left) move.sub(rightVec);

      if (move.lengthSq() > 0) {
        move.normalize();
        const speed = 5;
        const deltaMove = move.multiplyScalar(speed * deltaTime);
        this.body.position.x += deltaMove.x;
        this.body.position.z += deltaMove.z;

        // Rotate bike to face the movement direction
        const targetPos = this.object3d.position.clone().add(move);
        this.object3d.lookAt(targetPos);
      }
    }

    // ─── Sync Mesh to Body ────────────────────────────────────────────────
    this.object3d.position.set(
      this.body.position.x,
      this.body.position.y,
      this.body.position.z
    );
  }
}
