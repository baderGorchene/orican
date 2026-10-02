import * as THREE from 'three';

/**
 * Loaded artwork textures keyed by image src, shared by the garment's print
 * layer and the GLB export. `retain()` disposes textures no longer in use.
 */

const cache = new Map<string, { texture: THREE.Texture; loaded: boolean }>();

export function requestPrintTexture(src: string, onLoad: () => void): THREE.Texture | null {
  const hit = cache.get(src);
  if (hit) return hit.loaded ? hit.texture : null;
  const entry = { texture: null as unknown as THREE.Texture, loaded: false };
  entry.texture = new THREE.TextureLoader().load(src, () => {
    entry.loaded = true;
    onLoad();
  });
  entry.texture.colorSpace = THREE.SRGBColorSpace;
  entry.texture.anisotropy = 8;
  // Clamp so the projection doesn't smear edge pixels outside the artwork.
  entry.texture.wrapS = THREE.ClampToEdgeWrapping;
  entry.texture.wrapT = THREE.ClampToEdgeWrapping;
  cache.set(src, entry);
  return null;
}

export function peekPrintTexture(src: string): THREE.Texture | null {
  const hit = cache.get(src);
  return hit?.loaded ? hit.texture : null;
}

/** Disposes cached textures whose src is not in `keep`. */
export function retainPrintTextures(keep: Set<string>) {
  for (const [src, entry] of cache) {
    if (!keep.has(src)) {
      entry.texture.dispose();
      cache.delete(src);
    }
  }
}
