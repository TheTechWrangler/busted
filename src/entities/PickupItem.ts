// src/entities/PickupItem.ts
import * as THREE from 'three';
import * as CANNON from 'cannon-es';
import { InventoryItem } from '../types/InventoryItems';
import { InventorySystem } from '../systems/InventorySystem';

export class PickupItem {
  public mesh: THREE.Mesh;
  public body: CANNON.Body;
  public collected = false;

  constructor(
    private scene: THREE.Scene,
    private world: CANNON.World,
    public itemData: InventoryItem,
    public inventory: InventorySystem,
    position: THREE.Vector3
  ) {
    // Create mesh (placeholder geometry/material)
    const geometry = new THREE.SphereGeometry(0.3, 16, 16);
    const material = new THREE.MeshStandardMaterial({ color: 0x00ff88 });
    this.mesh = new THREE.Mesh(geometry, material);
    this.mesh.position.copy(position);
    scene.add(this.mesh);

    // Create physics body (static, no mass)
    const shape = new CANNON.Sphere(0.3);
    this.body = new CANNON.Body({ mass: 0 });
    this.body.addShape(shape);
    this.body.position.set(position.x, position.y, position.z);
    world.addBody(this.body);
  }

  update() {
    if (this.collected) return;
    this.mesh.rotation.y += 0.01;
    this.mesh.position.y = this.body.position.y + Math.sin(Date.now() * 0.005) * 0.05;
  }

  tryCollect(playerPosition: THREE.Vector3) {
    if (this.collected) return;

    const distance = this.mesh.position.distanceTo(playerPosition);
    const pickupRange = 1.5;

    if (distance <= pickupRange) {
      this.collect();
    }
  }

  private collect() {
    this.collected = true;
    this.mesh.visible = false;
    this.body.collisionResponse = false;
    this.body.type = CANNON.Body.STATIC;
    this.inventory.addItem({ ...this.itemData });
  }
}
