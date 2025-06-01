
// src/assets.d.ts

// Tell TypeScript “any import ending in .obj?url is a string URL”
declare module '*.obj?url';
declare module '*.mtl?url';
declare module '*.jpg';
declare module '*.png';
declare module '*.glb?url';   // if you ever use .glb?url
