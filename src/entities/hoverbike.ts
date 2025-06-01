// File: src/entities/hoverbike.ts

import * as THREE from 'three';
import * as CANNON from 'cannon-es';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { scene } from '../scene';
import { world } from '../physics';
import { controls } from '../controls';
import type { PointerLockControls } from 'three/examples/jsm/controls/PointerLockControls.js';

import MODEL_URL from '/src/assets/hoverbike.glb?url';

type HoverbikeOptions = {
  scene: THREE.Scene;
  world: CANNON.World;
  controls: {
    forward: boolean;
    backward: boolean;
    left: boolean;
    right: boolean;
    jump: boolean;
    descend: boolean;
  };
  spawnX?: number;
  spawnZ?: number;
  baseHeight?: number;
  hoverSpeed?: number;
  hoverAmplitude?: number;
  scale?: number;
};

export class Hoverbike {
  public parent: THREE.Group = new THREE.Group();
  public object3d: THREE.Object3D = this.parent;

  private gltfLoader = new GLTFLoader();
  private meshReady = false;

  private body: CANNON.Body | null = null;
  private elapsed = 0;

  private opts: Required<HoverbikeOptions> = {
    scene:      scene,      // will be overridden by constructor
    world:      world,      // will be overridden by constructor
    controls:   controls,   // will be overridden by constructor
    spawnX:     5,
    spawnZ:     0,
    baseHeight: 0.8,
    hoverSpeed: 1.5,
    hoverAmplitude: 0.4,
    scale:      0.005,
  };

  public isMounted = false;
  private cameraOriginalParent: THREE.Object3D | null = null;
  private playerObjectOriginalPosition: THREE.Vector3 | null = null;
  private controlsObject: PointerLockControls | null = null;

  constructor(options: HoverbikeOptions) {
    // Merge passed‐in options with defaults
    this.opts = {
      ...this.opts,
      ...options,
    };

    // 1) Create a parent group and add it to the scene
    this.parent = new THREE.Group();
    this.object3d = this.parent;
    this.opts.scene.add(this.parent);

    // 2) Load the GLTF model
    this.gltfLoader.load(
      MODEL_URL,
      (gltf) => {
        const rawModel = gltf.scene;

        rawModel.traverse((child) => {
          if ((child as THREE.Mesh).isMesh) {
            const mesh = child as THREE.Mesh;
            mesh.castShadow = true;
            mesh.receiveShadow = true;
          }
        });

        const wrapper = new THREE.Group();
        wrapper.add(rawModel);

        // 2a) Scale down to 0.5%
        wrapper.scale.set(
          this.opts.scale,
          this.opts.scale,
          this.opts.scale
        );

        // 2b) **Rotate so the bike is fully upright**:
        //     • rotation.x = –90° (–π/2) to convert “Z-up” → Three.js’s “Y-up”
        //     • rotation.y = 0   (no yaw)
        //     • rotation.z = 0   (no roll)
        wrapper.rotation.set(-Math.PI / 2, 0, 0);

        // 2c) Place wrapper at (spawnX, 0, spawnZ). Y will be driven by physics.
        wrapper.position.set(
          this.opts.spawnX,
          0,
          this.opts.spawnZ
        );

        this.parent.add(wrapper);

        // 3) Initialize physics body
        this._initPhysicsBody();
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

  private _initPhysicsBody() {
    // Use a simple cylinder shape for collisions
    const r = 0.5 * this.opts.scale;
    const h = 2 * this.opts.scale;
    const cylShape = new CANNON.Cylinder(r, r, h, 12);

    // Initially STATIC (mass = 0), at (spawnX, baseHeight, spawnZ)
    this.body = new CANNON.Body({
      mass: 0,
      position: new CANNON.Vec3(
        this.opts.spawnX,
        this.opts.baseHeight,
        this.opts.spawnZ
      ),
    });
    this.body.addShape(cylShape);
    this.opts.world.addBody(this.body);
  }

  public mount(
    controlsObject: PointerLockControls,
    playerControlsDisable: () => void
  ) {
    if (!this.meshReady || this.isMounted || !this.body) return;
    this.isMounted = true;

    this.cameraOriginalParent = controlsObject.getObject().parent!;
    this.playerObjectOriginalPosition = controlsObject
      .getObject()
      .position.clone();

    this.parent.add(controlsObject.getObject());
    controlsObject.getObject().position.set(0, 1.0, -0.5);
    controlsObject.getObject().lookAt(this.parent.position);

    // Make physics body dynamic so it can move and hover
    this.body.mass = 50;
    this.body.type = CANNON.Body.DYNAMIC;
    this.body.updateMassProperties();
    this.body.wakeUp();
    this.body.velocity.set(0, 0, 0);
    this.body.angularVelocity.set(0, 0, 0);

    playerControlsDisable();
  }

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

    this.parent.remove(controlsObject.getObject());
    this.cameraOriginalParent.add(controlsObject.getObject());
    controlsObject.getObject().position.copy(this.playerObjectOriginalPosition);

    // Freeze the bike (back to static)
    this.body.velocity.set(0, 0, 0);
    this.body.angularVelocity.set(0, 0, 0);
    this.body.type = CANNON.Body.STATIC;
    this.body.mass = 0;
    this.body.updateMassProperties();
    this.body.position.y = this.opts.baseHeight;

    playerControlsEnable();
    this.isMounted = false;
    this.controlsObject = null;
  }

  public update(deltaTime: number) {
    if (!this.meshReady || !this.body) return;

    if (this.isMounted) {
      // 1) Hover (sine‐wave bob) + extra for jump/descend
      this.elapsed += deltaTime;
      const bob =
        Math.sin(this.elapsed * this.opts.hoverSpeed) *
        this.opts.hoverAmplitude;

      const extraY = this.opts.controls.jump
        ? 0.1
        : this.opts.controls.descend
        ? -0.1
        : 0;
      this.body.position.y = this.opts.baseHeight + bob + extraY;

      // 2) Driving via WASD (in camera’s forward direction)
      const yaw = (this.cameraOriginalParent as THREE.Object3D).rotation.y;
      const forwardVec = new THREE.Vector3(0, 0, -1)
        .applyEuler(new THREE.Euler(0, yaw, 0))
        .normalize();
      const rightVec = new THREE.Vector3(1, 0, 0)
        .applyEuler(new THREE.Euler(0, yaw, 0))
        .normalize();

      const moveVec = new THREE.Vector3();
      if (this.opts.controls.forward) moveVec.add(forwardVec);
      if (this.opts.controls.backward) moveVec.sub(forwardVec);
      if (this.opts.controls.right) moveVec.add(rightVec);
      if (this.opts.controls.left) moveVec.sub(rightVec);

      if (moveVec.lengthSq() > 0) {
        moveVec.normalize();
        const speed = 5;
        const dist = speed * deltaTime;
        this.body.position.x += moveVec.x * dist;
        this.body.position.z += moveVec.z * dist;

        // Rotate bike so its “nose” faces movement direction
        const target = new THREE.Vector3(
          this.body.position.x + moveVec.x,
          this.body.position.y,
          this.body.position.z + moveVec.z
        );
        this.parent.lookAt(target);
      }
    } else {
      // If unmounted, lock Y to baseHeight (no bobbing)
      this.body.position.y = this.opts.baseHeight;
    }

    // 3) Sync Three.js mesh to physics body
    this.parent.position.set(
      this.body.position.x,
      this.body.position.y,
      this.body.position.z
    );
    this.parent.quaternion.set(
      this.body.quaternion.x,
      this.body.quaternion.y,
      this.body.quaternion.z,
      this.body.quaternion.w
    );
  }
}
