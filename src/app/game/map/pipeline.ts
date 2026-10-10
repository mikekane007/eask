// The part of the game's map code that the OpenStreetMap build script also uses. The script bundles this file with esbuild.
export { flatten, lineLength, makeProjector, polygonArea, r1, simplify } from './geo';
export { pickAnchors } from './anchors';
