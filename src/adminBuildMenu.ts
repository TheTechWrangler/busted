// File: src/adminBuildMenu.ts

import * as THREE from 'three';
import { scene, camera, renderer } from './scene';
import { buildCatalog, BuildItem } from './buildCatalog';
import { spawnTree } from './modelLoader';
import { setBuildMode, isBuildModeEnabled } from './controls';

interface PlacedData {
  id: string;
  position: { x: number; y: number; z: number };
  rotation: { x: number; y: number; z: number };
}

// ——————————————————————————————————————————————————————————————————————————————————————————————————————————————
// State & Helpers
// ——————————————————————————————————————————————————————————————————————————————————————————————————————————————
let placing = false;
let selectedItem: BuildItem | null = null;
let ghostObject: THREE.Object3D | null = null;
const raycaster = new THREE.Raycaster();
const mouse = new THREE.Vector2();
const placedObjects: PlacedData[] = [];

// ——————————————————————————————————————————————————————————————————————————————————————————————————————————————
// Create & Populate the Build Menu UI (HTML overlay at top-left)
// ——————————————————————————————————————————————————————————————————————————————————————————————————————————————
const menuDiv = document.createElement('div');
menuDiv.id = "buildMenu";
menuDiv.style.position = "absolute";
menuDiv.style.top = "10px";
menuDiv.style.left = "10px";
menuDiv.style.background = "rgba(0, 0, 0, 0.8)";
menuDiv.style.color = "#fff";
menuDiv.style.padding = "10px";
menuDiv.style.display = "none";
menuDiv.style.zIndex = "1000";
menuDiv.style.maxHeight = "90vh";
menuDiv.style.overflowY = "auto";
menuDiv.style.fontFamily = "sans-serif";
document.body.appendChild(menuDiv);

// Populate one button per catalog item
function populateMenu() {
  buildCatalog.forEach(item => {
    const btn = document.createElement('button');
    btn.textContent = item.name;
    btn.style.display = "block";
    btn.style.margin = "5px 0";
    btn.style.padding = "8px";
    btn.style.background = "#333";
    btn.style.color = "#fff";
    btn.style.border = "none";
    btn.style.cursor = "pointer";
    btn.onclick = () => selectBuildItem(item.id);
    menuDiv.appendChild(btn);
  });
}
populateMenu();

// ——————————————————————————————————————————————————————————————————————————————————————————————————————————————
// Show & Hide Build Menu
// ——————————————————————————————————————————————————————————————————————————————————————————————————————————————
export function show() {
  menuDiv.style.display = "block";
}

export function hide() {
  menuDiv.style.display = "none";
  cancelPlacement();
}

// ——————————————————————————————————————————————————————————————————————————————————————————————————————————————
// Selecting an Item from Menu: Start Placement
// ——————————————————————————————————————————————————————————————————————————————————————————————————————————————
function selectBuildItem(itemId: string) {
  const item = buildCatalog.find(i => i.id === itemId);
  if (!item) return;
  selectedItem = item;
  menuDiv.style.display = "none"; // hide menu while placing
  startPlacement(item);
}

/** Create a semi-transparent “ghost” of the selected item and add to scene. */
function startPlacement(item: BuildItem) {
  placing = true;

  if (item.type === "billboard" && item.imagePath) {
    const tex = new THREE.TextureLoader().load(item.imagePath, (loaded) => {
      // no type errors: cast to any
      (loaded as any).encoding = (THREE as any).sRGBEncoding;
    });
    const mat = new THREE.MeshBasicMaterial({
      map: tex,
      transparent: true,
      opacity: 0.6,
      depthWrite: false,
      side: THREE.DoubleSide
    });
    const size = item.scale ?? 1;
    const geo = new THREE.PlaneGeometry(size, size);
    ghostObject = new THREE.Mesh(geo, mat);
    ghostObject.rotation.x = -Math.PI / 2; // lie flat
  } 
  else if (item.type === "model" && item.modelPath) {
    // spawn a hidden copy below ground so we can clone it
    const original = spawnTree(item.id, new THREE.Vector3(0, -1000, 0), new THREE.Euler());
    if (!original) return;
    // clone for ghost
    ghostObject = original.clone(true);
    ghostObject.traverse(node => {
      if ((node as THREE.Mesh).isMesh) {
        const mesh = node as THREE.Mesh;
        mesh.material = (mesh.material as THREE.MeshStandardMaterial).clone();
        (mesh.material as any).transparent = true;
        (mesh.material as any).opacity = 0.4;
      }
    });
    const s = item.scale ?? 1;
    ghostObject.scale.set(s, s, s);
  }

  if (ghostObject) {
    ghostObject.name = "ghost";
    scene.add(ghostObject);
  }
}

/** Cancel any placement: remove the ghost and reset state. */
function cancelPlacement() {
  placing = false;
  selectedItem = null;
  if (ghostObject) {
    scene.remove(ghostObject);
    ghostObject = null;
  }
}

// ——————————————————————————————————————————————————————————————————————————————————————————————————————————————
// Track Mouse Move to Update Ghost Position
// ——————————————————————————————————————————————————————————————————————————————————————————————————————————————
window.addEventListener('mousemove', (evt) => {
  mouse.x = (evt.clientX / window.innerWidth) * 2 - 1;
  mouse.y = - (evt.clientY / window.innerHeight) * 2 + 1;
});

function updateGhostPosition() {
  if (!placing || !ghostObject) return;
  raycaster.setFromCamera(mouse, camera);
  // Raycast against the ground plane (which you added in scene.ts)
  const hits = raycaster.intersectObject(scene.getObjectByName("ground")!);
  if (hits.length > 0) {
    const pt = hits[0].point;
    ghostObject.position.set(pt.x, pt.y + 0.01, pt.z);
    if (selectedItem?.type === "billboard") {
      ghostObject.lookAt(camera.position.x, camera.position.y, camera.position.z);
    }
  }
}

// ——————————————————————————————————————————————————————————————————————————————————————————————————————————————
// Place Object on Mouse Click
// ——————————————————————————————————————————————————————————————————————————————————————————————————————————————
export function onMouseDown() {
  if (!placing || !selectedItem || !ghostObject) return;
  raycaster.setFromCamera(mouse, camera);
  const hits = raycaster.intersectObject(scene.getObjectByName("ground")!);
  if (hits.length === 0) return;
  const pt = hits[0].point;

  if (selectedItem.type === "billboard") {
    const tex = new THREE.TextureLoader().load(selectedItem.imagePath!, (loaded) => {
      (loaded as any).encoding = (THREE as any).sRGBEncoding;
    });
    const mat = new THREE.MeshBasicMaterial({
      map: tex,
      transparent: true,
      side: THREE.DoubleSide
    });
    const size = selectedItem.scale ?? 1;
    const geo = new THREE.PlaneGeometry(size, size);
    const sprite = new THREE.Mesh(geo, mat);
    sprite.position.set(pt.x, pt.y + 0.01, pt.z);
    sprite.lookAt(camera.position.x, camera.position.y, camera.position.z);
    scene.add(sprite);

    placedObjects.push({
      id: selectedItem.id,
      position: { x: pt.x, y: pt.y, z: pt.z },
      rotation: { x: sprite.rotation.x, y: sprite.rotation.y, z: sprite.rotation.z },
    });
  } 
  else if (selectedItem.type === "model") {
    const newTree = spawnTree(selectedItem.id, pt, ghostObject.rotation.clone());
    if (newTree) {
      placedObjects.push({
        id: selectedItem.id,
        position: { x: pt.x, y: pt.y, z: pt.z },
        rotation: { x: ghostObject.rotation.x, y: ghostObject.rotation.y, z: ghostObject.rotation.z },
      });
    }
  }

  // Save placements to localStorage
  localStorage.setItem("placedObjects", JSON.stringify(placedObjects));

  // After placing one, keep placing mode active so you can click multiple times
}

// ——————————————————————————————————————————————————————————————————————————————————————————————————————————————
// Animate Loop → Update Ghost Position Every Frame
// ——————————————————————————————————————————————————————————————————————————————————————————————————————————————
export function animateBuildMenu() {
  if (placing) {
    updateGhostPosition();
  }
}

// ——————————————————————————————————————————————————————————————————————————————————————————————————————————————
// Load Previously Saved Placements (call once on startup)
// ——————————————————————————————————————————————————————————————————————————————————————————————————————————————
export function loadSavedPlacements() {
  const data = localStorage.getItem("placedObjects");
  if (!data) return;
  const saved: PlacedData[] = JSON.parse(data);
  saved.forEach(obj => {
    const item = buildCatalog.find(i => i.id === obj.id);
    if (!item) return;
    const pos = new THREE.Vector3(obj.position.x, obj.position.y, obj.position.z);
    const rot = new THREE.Euler(obj.rotation.x, obj.rotation.y, obj.rotation.z);

    if (item.type === "billboard") {
      const tex = new THREE.TextureLoader().load(item.imagePath!, (loaded) => {
        (loaded as any).encoding = (THREE as any).sRGBEncoding;
      });
      const mat = new THREE.MeshBasicMaterial({
        map: tex,
        transparent: true,
        side: THREE.DoubleSide
      });
      const size = item.scale ?? 1;
      const geo = new THREE.PlaneGeometry(size, size);
      const sprite = new THREE.Mesh(geo, mat);
      sprite.position.copy(pos);
      sprite.rotation.copy(rot);
      scene.add(sprite);
    } 
    else if (item.type === "model") {
      spawnTree(item.id, pos, rot);
    }
  });
}
