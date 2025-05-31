import { PerspectiveCamera, Scene } from 'three';
import * as CANNON from 'cannon-es';
import { FirstPersonControls } from '../controls/FirstPersonControls';
import CannonDebugger from 'cannon-es-debugger';

export class Player {
  public body: CANNON.Body;
  public controls: FirstPersonControls;
  private debugMesh: any = null;

  constructor(
    private camera: PerspectiveCamera,
    private world: CANNON.World,
    private scene: Scene
  ) {
    // Create physics body (sphere)
    const radius = 1.0;
    const sphereShape = new CANNON.Sphere(radius);
    this.body = new CANNON.Body({
      mass: 1,
      shape: sphereShape,
      fixedRotation: true
    });
    this.body.position.set(0, radius * 3, 10);
    this.body.linearDamping = 0.3;
    this.world.addBody(this.body);

    // Setup controls
    this.controls = new FirstPersonControls(this.camera);
    this.controls.getObject().position.set(0, radius * 3, 10);
    this.scene.add(this.controls.getObject());
  }

  public update(delta: number) {
    this.controls.update(delta, this.body);
    if (this.debugMesh) {
      (this.debugMesh as any).update();
    }
  }

  public setPhysicsDebug(enable: boolean, scene: Scene) {
    if (enable && !this.debugMesh) {
      this.debugMesh = new CannonDebugger(scene, this.world, {
        color: 0x00ff00,
        scale: 1.0,
      });
    }
    if (!enable && this.debugMesh) {
      scene.remove(this.debugMesh.getMeshes());
      this.debugMesh = null;
    }
  }
}