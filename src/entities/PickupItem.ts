// src/entities/PickupItem.ts
import * as THREE from 'three';
import * as CANNON from 'cannon-es';
import { InventoryItem } from '../types/InventoryItems';
import { InventorySystem } from '../systems/InventorySystem';
import { Vector3 } from 'three/src/math/Vector3.js';

export class PickupItem {
  public mesh: ReturnType<typeof THREE.Mesh>;
  public body: CANNON.Body;
  public collected = false;

  constructor(
    private scene: ReturnType<typeof THREE.Scene>,
    private world: CANNON.World,
    public itemData: InventoryItem,
    public inventory: InventorySystem,
    position: Vector3
  ) {
    const geometry = new THREE.SphereGeometry(0.3, 16, 16);
    const material = new THREE.MeshStandardMaterial({ color: 0x00ff88 });
    this.mesh = new THREE.Mesh(geometry, material);
    this.mesh.position.copy(position);
    scene.add(this.mesh);

    const shape = new CANNON.Sphere(0.3);
    this.body = new CANNON.Body({ mass: 0 });
    this.body.addShape(shape);
    this.body.position.set(position.x, position.y, position.z);
    world.addBody(this.body);
  }

  update() {
    if (this.collected) return;
    this.mesh.rotation.y += 0.01;
    this.mesh.position.y =
      this.body.position.y + Math.sin(Date.now() * 0.005) * 0.05;
  }

  tryCollect(playerPosition: Vector3) {
    if (this.collected) return;
    const distance = this.mesh.position.distanceTo(playerPosition);
    const pickupRange = 1.5;
    if (distance <= pickupRange) this.collect();
  }

  private collect() {
    this.collected = true;
    this.mesh.visible = false;
    this.body.collisionResponse = false;
    this.body.type = CANNON.Body.STATIC;

    console.log("[PickupItem] Adding item to inventory instance:", this.inventory);
    this.inventory.addItem({ ...this.itemData });
  }
}
