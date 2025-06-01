// src/utils/grid.ts

import * as THREE from 'three';

/**
 * Convert integer grid indices (i, j) into world coordinates (x, 0, z).
 * - gridSize: total width/depth of the grid (e.g. 200)
 * - cellSize: size of each cell (gridSize / gridDivisions)
 */
export function worldCoordsFromCell(
  i: number,
  j: number,
  cellSize: number,
  gridSize: number
): THREE.Vector3 {
  const half = gridSize / 2;
  const x = i * cellSize - half + cellSize / 2;
  const z = j * cellSize - half + cellSize / 2;
  return new THREE.Vector3(x, 0, z);
}

/**
 * (Optional) Snap an arbitrary world position back to the nearest cell center.
 */
export function snapToGrid(
  worldX: number,
  worldZ: number,
  cellSize: number,
  gridSize: number
): THREE.Vector3 {
  const half = gridSize / 2;
  const i = Math.round((worldX + half - cellSize / 2) / cellSize);
  const j = Math.round((worldZ + half - cellSize / 2) / cellSize);

  const divisions = gridSize / cellSize;
  const clampedI = Math.max(0, Math.min(divisions - 1, i));
  const clampedJ = Math.max(0, Math.min(divisions - 1, j));

  const x = clampedI * cellSize - half + cellSize / 2;
  const z = clampedJ * cellSize - half + cellSize / 2;
  return new THREE.Vector3(x, 0, z);
}
