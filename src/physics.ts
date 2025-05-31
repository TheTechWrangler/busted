// File: src/physics.ts

import * as CANNON from 'cannon-es';

export const world = new CANNON.World({
  gravity: new CANNON.Vec3(0, -9.82, 0),
});
world.broadphase = new CANNON.SAPBroadphase(world);
// Allow a few solver iterations for stability
;(world.solver as any).iterations = 10;
