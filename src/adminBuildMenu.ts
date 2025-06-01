// src/adminBuildMenu.ts
import * as THREE from 'three';
import { buildCatalog, BuildItem } from './buildCatalog';
import { spawnTree } from './modelLoader';
import { scene, camera, renderer } from './scene';

// State variables
let inBuildMode = false;
let selectedItem: BuildItem | null = null;
let ghostObject: THREE.Object3D | null = null;
let placing = false;
const placedObjects: any[] = []; // Will hold { id, position: {x,y,z}, rotation: {x,y,z} }

// 1) Create a hidden HTML menu container under the canvas
const menuDiv = document.createElement('div');
menuDiv.id = "buildMenu";
menuDiv.style.position = "absolute";
menuDiv.style.top = "10px";
menuDiv.style.left = "10px";
menuDiv.style.background = "rgba(0,0,0,0.8)";
menuDiv.style.color = "#fff";
menuDiv.style.padding = "10px";
menuDiv.style.display = "none";
menuDiv.style.zIndex = "1000";
document.body.appendChild(menuDiv);

// 2) Populate menu with buttons for each catalog item
function populateMenu() {
  buildCatalog.forEach(item => {
    const btn = document.createElement('button');
    btn.textContent = item.name;
    btn.style.display = "block";
    btn.style.margin = "5px 0";
    btn.onclick = () => selectBuildItem(item.id);
    menuDiv.appendChild(btn);
  });
}
populateMenu();

// 3) Toggle build mode when user presses '\'
window.addEventListener('keydown', (evt) => {
  if (evt.key === "\\") {
    inBuildMode = !inBuildMode;
    if (inBuildMode) {
      enterBuildMode();
    } else {
      exitBuildMode();
    }
  }
});

function enterBuildMode() {
  // 3a) Show menu and unlock pointer
  menuDiv.style.display = "block";
  document.exitPointerLock?.(); // if pointerLockControls were active, release them
  // 3b) Disable normal controls (you might set a flag or disable PointerLockControls here)
}

function exitBuildMode() {
  // 3c) Hide menu, remove ghost if any, re-enable normal controls
  menuDiv.style.display = "none";
  cancelPlacement();
  // Re-lock pointer for normal gameplay if desired:
  renderer.domElement.requestPointerLock();
}

// 4) When an item is clicked in the menu
function selectBuildItem(itemId: string) {
  const item = buildCatalog.find(i => i.id === itemId);
  if (!item) return;
  selectedItem = item;
  menuDiv.style.display = "none"; // hide menu while placing
  startPlacement(item);
}

// 5) Start placement (create ghost preview)
const raycaster = new THREE.Raycaster();
const mouse = new THREE.Vector2();
function startPlacement(item: BuildItem) {
  placing = true;

  // 5a) Create a ghost preview based on item.type
  if (item.type === "billboard" && item.imagePath) {
    const tex = new THREE.TextureLoader().load(item.imagePath);
    tex.encoding = THREE.sRGBEncoding;
    const mat = new THREE.MeshBasicMaterial({ map: tex, transparent: true, opacity: 0.7, depthWrite: false });
    const size = item.scale ?? 1;
    const geo = new THREE.PlaneGeometry(size, size);
    ghostObject = new THREE.Mesh(geo, mat);
  } else if (item.type === "model" && item.modelPath) {
    // spawnTree clones the real model with opaque materials, so for ghost we fetch a clone and make it semi-transparent
    const baseModel = scene.getObjectByName(item.id); // assume we preloaded base model under a name
    if (baseModel) {
      ghostObject = baseModel.clone(true);
      ghostObject.traverse(node => {
        if ((node as THREE.Mesh).isMesh) {
          const mesh = node as THREE.Mesh;
          mesh.material = (mesh.material as THREE.Material).clone();
          (mesh.material as THREE.MeshStandardMaterial).transparent = true;
          (mesh.material as THREE.MeshStandardMaterial).opacity = 0.5;
        }
      });
      const s = item.scale ?? 1;
      ghostObject.scale.set(s, s, s);
    }
  }
  if (ghostObject) {
    ghostObject.name = "ghost";
    scene.add(ghostObject);
  }
}

// 6) Cancel placement (remove ghost, clear state)
function cancelPlacement() {
  placing = false;
  selectedItem = null;
  if (ghostObject) {
    scene.remove(ghostObject);
    ghostObject = null;
  }
}

// 7) Track mouse movement to move ghost
window.addEventListener('mousemove', (evt) => {
  mouse.x = (evt.clientX / window.innerWidth) * 2 - 1;
  mouse.y = - (evt.clientY / window.innerHeight) * 2 + 1;
});

function updateGhostPosition() {
  if (!placing || !ghostObject) return;
  raycaster.setFromCamera(mouse, camera);
  // Raycast against your terrain or ground mesh (assume `groundMesh` exists in scene)
  const groundMesh = scene.getObjectByName("ground") as THREE.Mesh;
  if (!groundMesh) return;
  const hits = raycaster.intersectObject(groundMesh);
  if (hits.length > 0) {
    const pt = hits[0].point;
    ghostObject.position.copy(pt);
    // Keep tree upright; optionally face camera for a billboard
    if (selectedItem?.type === "billboard") {
      ghostObject.lookAt(camera.position);
    }
  }
}

// 8) Place the object on click
window.addEventListener('click', (evt) => {
  if (!placing || !selectedItem || !ghostObject) return;
  // 8a) Raycast again to confirm precise placement position
  raycaster.setFromCamera(mouse, camera);
  const groundMesh = scene.getObjectByName("ground") as THREE.Mesh;
  const hits = raycaster.intersectObject(groundMesh);
  if (hits.length === 0) return;
  const pt = hits[0].point;

  // 8b) Instantiate a permanent object based on selectedItem
  if (selectedItem.type === "billboard") {
    const tex = new THREE.TextureLoader().load(selectedItem.imagePath!);
    tex.encoding = THREE.sRGBEncoding;
    const mat = new THREE.MeshBasicMaterial({ map: tex, transparent: true });
    const size = selectedItem.scale ?? 1;
    const geo = new THREE.PlaneGeometry(size, size);
    const newSprite = new THREE.Mesh(geo, mat);
    newSprite.position.copy(pt);
    newSprite.lookAt(camera.position);
    scene.add(newSprite);
    // Save placement
    placedObjects.push({
      id: selectedItem.id,
      position: { x: pt.x, y: pt.y, z: pt.z },
      rotation: { x: newSprite.rotation.x, y: newSprite.rotation.y, z: newSprite.rotation.z }
    });
  } else if (selectedItem.type === "model") {
    const newTree = spawnTree(selectedItem.id, pt, ghostObject.rotation.clone());
    // spawnTree already added it to scene and applied bark
    if (newTree) {
      placedObjects.push({
        id: selectedItem.id,
        position: { x: pt.x, y: pt.y, z: pt.z },
        rotation: { x: ghostObject.rotation.x, y: ghostObject.rotation.y, z: ghostObject.rotation.z }
      });
    }
  }

  // 8c) Persist the updated placedObjects array to localStorage
  localStorage.setItem("placedObjects", JSON.stringify(placedObjects));
});

// 9) In your render/animation loop, call updateGhostPosition()
export function animateBuildMenu() {
  if (placing) {
    updateGhostPosition();
  }
}

// 10) On game start, load saved placements from localStorage
export function loadSavedPlacements() {
  const data = localStorage.getItem("placedObjects");
  if (!data) return;
  const saved = JSON.parse(data);
  saved.forEach((obj: any) => {
    const item = buildCatalog.find(i => i.id === obj.id);
    if (!item) return;
    const pos = new THREE.Vector3(obj.position.x, obj.position.y, obj.position.z);
    const rot = new THREE.Euler(obj.rotation.x, obj.rotation.y, obj.rotation.z);
    if (item.type === "billboard") {
      const tex = new THREE.TextureLoader().load(item.imagePath!);
      tex.encoding = THREE.sRGBEncoding;
      const mat = new THREE.MeshBasicMaterial({ map: tex, transparent: true });
      const size = item.scale ?? 1;
      const geo = new THREE.PlaneGeometry(size, size);
      const sprite = new THREE.Mesh(geo, mat);
      sprite.position.copy(pos);
      sprite.rotation.copy(rot);
      scene.add(sprite);
    } else if (item.type === "model") {
      spawnTree(item.id, pos, rot);
    }
  });
}
