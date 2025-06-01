// src/buildCatalog.ts

export interface BuildItem {
  id: string;              // unique identifier
  type: "billboard" | "model";
  name: string;            // display name in the menu
  imagePath?: string;      // for billboards: PNG path under /branches/
  modelPath?: string;      // for models: FBX/DAE under /models/
  barkTexturePath?: string;// optional: bark JPEG under /textures/wood/
  scale?: number;          // world-unit scale for the mesh or sprite
}

// 1) List each branch-PNG as a “billboard”:
export const buildCatalog: BuildItem[] = [
  {
    id: "branch01",
    type: "billboard",
    name: "Green Branch A",
    imagePath: "/branches/Branch.png",
    scale: 1
  },
  {
    id: "branch02",
    type: "billboard",
    name: "Green Branch B",
    imagePath: "/branches/Branch_1.png",
    scale: 1
  },
  {
    id: "branch03",
    type: "billboard",
    name: "Leaf Cluster C",
    imagePath: "/branches/Branch_11.png",
    scale: 1.2
  },
  // …add more billboards as needed…

  // 2) List your tree model with various bark textures:
  {
    id: "oakTree1",
    type: "model",
    name: "Oak Tree (Bark 5)",
    modelPath: "/models/Trees.fbx",
    barkTexturePath: "/textures/wood/Wood_05.jpg",
    scale: 0.03
  },
  {
    id: "oakTree2",
    type: "model",
    name: "Oak Tree (Bark 09)",
    modelPath: "/models/Trees.fbx",
    barkTexturePath: "/textures/wood/Wood_09.jpg",
    scale: 0.03
  },
  // …add more model variants as needed…
];
