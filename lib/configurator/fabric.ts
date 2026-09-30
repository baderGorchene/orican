import * as THREE from 'three';
import { Garment3D } from './garments';

/**
 * Fabric detail textures, generated at runtime:
 * - a garment-specific normal map (knit ribs + seams + double-needle stitching)
 *   painted in the garment's UV layout (front panel u∈[0,.5], back u∈[.5,1]);
 * - a small tiling rib normal map for collars and cuffs.
 */

const PANEL = 1024;

/** Converts a grayscale height canvas into a tangent-space normal map canvas. */
function heightToNormal(src: HTMLCanvasElement, strength: number): HTMLCanvasElement {
  const { width: w, height: h } = src;
  const sctx = src.getContext('2d')!;
  const data = sctx.getImageData(0, 0, w, h).data;
  const out = document.createElement('canvas');
  out.width = w;
  out.height = h;
  const octx = out.getContext('2d')!;
  const img = octx.createImageData(w, h);
  const o = img.data;
  const hAt = (x: number, y: number) => {
    const cx = x < 0 ? 0 : x >= w ? w - 1 : x;
    const cy = y < 0 ? 0 : y >= h ? h - 1 : y;
    return data[(cy * w + cx) * 4] / 255;
  };
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      const dx = (hAt(x + 1, y) - hAt(x - 1, y)) * strength;
      const dy = (hAt(x, y + 1) - hAt(x, y - 1)) * strength;
      // canvas y runs opposite to v, hence +dy for the green channel
      let nx = -dx, ny = dy, nz = 1;
      const len = Math.hypot(nx, ny, nz);
      nx /= len; ny /= len; nz /= len;
      const i = (y * w + x) * 4;
      o[i] = (nx * 0.5 + 0.5) * 255;
      o[i + 1] = (ny * 0.5 + 0.5) * 255;
      o[i + 2] = (nz * 0.5 + 0.5) * 255;
      o[i + 3] = 255;
    }
  }
  octx.putImageData(img, 0, 0);
  return out;
}

function paintRibs(ctx: CanvasRenderingContext2D, w: number, h: number, period: number, amp: number) {
  for (let x = 0; x < w; x++) {
    const v = 128 + amp * Math.sin((x / period) * Math.PI * 2);
    ctx.fillStyle = `rgb(${v},${v},${v})`;
    ctx.fillRect(x, 0, 1, h);
  }
}

export function makeGarmentNormalMap(g: Garment3D): THREE.Texture {
  const height = document.createElement('canvas');
  height.width = PANEL * 2;
  height.height = PANEL;
  const ctx = height.getContext('2d')!;
  paintRibs(ctx, height.width, height.height, 3.2, 26);

  const panels: [number, string[], string[]][] = [
    [0, g.stitches.front, g.seams.front],
    [PANEL, g.stitches.back, g.seams.back],
  ];
  for (const [offsetX, stitches, seams] of panels) {
    ctx.save();
    ctx.setTransform(PANEL / g.outline.w, 0, 0, PANEL / g.outline.h, offsetX, 0);
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';

    // Seams: soft indent with a raised edge beside it
    for (const d of seams) {
      const p = new Path2D(d);
      ctx.setLineDash([]);
      ctx.strokeStyle = 'rgb(175,175,175)';
      ctx.lineWidth = 7;
      ctx.stroke(p);
      ctx.strokeStyle = 'rgb(40,40,40)';
      ctx.lineWidth = 2.2;
      ctx.stroke(p);
    }

    // Double-needle stitching: two dashed indents
    for (const d of stitches) {
      const p = new Path2D(d);
      ctx.strokeStyle = 'rgb(30,30,30)';
      ctx.lineWidth = 1.5;
      ctx.setLineDash([4, 2.6]);
      ctx.stroke(p);
      ctx.save();
      ctx.translate(0, 5);
      ctx.stroke(p);
      ctx.restore();
    }
    ctx.restore();
  }

  const normal = heightToNormal(height, 2.2);
  const tex = new THREE.CanvasTexture(normal);
  tex.colorSpace = THREE.NoColorSpace;
  tex.anisotropy = 8;
  tex.wrapS = THREE.ClampToEdgeWrapping;
  tex.wrapT = THREE.ClampToEdgeWrapping;
  return tex;
}

let ribCache: THREE.Texture | null = null;

/** Tiling rib texture for collars and cuffs: ribs run across the band. */
export function getRibNormalMap(): THREE.Texture {
  if (ribCache) return ribCache;
  const height = document.createElement('canvas');
  height.width = 64;
  height.height = 64;
  paintRibs(height.getContext('2d')!, 64, 64, 8, 90);
  const tex = new THREE.CanvasTexture(heightToNormal(height, 3));
  tex.colorSpace = THREE.NoColorSpace;
  tex.wrapS = THREE.RepeatWrapping;
  tex.wrapT = THREE.RepeatWrapping;
  tex.repeat.set(90, 1);
  ribCache = tex;
  return tex;
}

export function makeFabricMaterial(color: string, normalMap: THREE.Texture): THREE.MeshPhysicalMaterial {
  return new THREE.MeshPhysicalMaterial({
    color,
    roughness: 0.88,
    metalness: 0,
    sheen: 1,
    sheenRoughness: 0.5,
    sheenColor: new THREE.Color('#ffffff'),
    normalMap,
    normalScale: new THREE.Vector2(0.55, 0.55),
    vertexColors: true,
  });
}
