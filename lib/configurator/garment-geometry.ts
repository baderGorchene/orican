import * as THREE from 'three';
import { MeshBVH } from 'three-mesh-bvh';
import { Garment3D } from './garments';

/**
 * Procedural placeholder garments: a 2D outline is sampled on a grid, a
 * distance field gives each interior point its distance to the edge, and that
 * distance drives the thickness of a front and a back shell. The two shells are
 * stitched along the outline so the result is a closed, raycastable surface.
 *
 * Output is in meters, garment-local space: y up, front facing +z, centered.
 *
 * UV layout: the front shell maps to u ∈ [0, 0.5], the back shell to
 * u ∈ [0.5, 1], both planar in path space, so stitch/seam detail textures can
 * be painted directly in path units (see fabric.ts).
 */

export interface GarmentBuild {
  body: THREE.BufferGeometry;
  collar: THREE.BufferGeometry | null;
  bvh: MeshBVH;
  /** Path units → garment-local meters. */
  toLocal: (px: number, py: number) => THREE.Vector2;
  triangles: number;
  size: THREE.Vector3;
}

const RIM_HALF = 0.005;
const GRID_ROWS = 170;

function profile(t: number): number {
  if (t >= 1) return 1;
  const k = 1 - Math.max(0, t);
  return Math.sqrt(1 - k * k);
}

function smooth01(t: number): number {
  const c = Math.min(1, Math.max(0, t));
  return c * c * (3 - 2 * c);
}

// Small deterministic value noise, used for drape folds.
function hash(ix: number, iy: number, seed: number): number {
  let n = Math.imul(ix, 374761393) + Math.imul(iy, 668265263) + Math.imul(seed, 2147483647);
  n = Math.imul(n ^ (n >>> 13), 1274126177);
  n ^= n >>> 16;
  return (n & 0xffff) / 0xffff;
}

function valueNoise(x: number, y: number, seed: number): number {
  const ix = Math.floor(x);
  const iy = Math.floor(y);
  const fx = x - ix;
  const fy = y - iy;
  const sx = fx * fx * (3 - 2 * fx);
  const sy = fy * fy * (3 - 2 * fy);
  const a = hash(ix, iy, seed);
  const b = hash(ix + 1, iy, seed);
  const c = hash(ix, iy + 1, seed);
  const d = hash(ix + 1, iy + 1, seed);
  return a + (b - a) * sx + (c - a) * sy + (a - b - c + d) * sx * sy;
}

/** Mostly-vertical folds, like fabric hanging from the shoulders. Meters in, meters out. */
function drape(xm: number, ym: number, seed: number): number {
  const n =
    (valueNoise(xm * 14, ym * 2.6, seed) - 0.5) * 0.6 +
    (valueNoise(xm * 34, ym * 6, seed + 7) - 0.5) * 0.4;
  return n * 0.011;
}

export function buildGarmentGeometry(g: Garment3D): GarmentBuild {
  const { w, h } = g.outline;
  const s = g.heightM / h; // meters per path unit
  const step = h / GRID_ROWS;
  const cols = Math.ceil(w / step);
  const W = cols + 1;
  const H = GRID_ROWS + 1;

  const ctx = document.createElement('canvas').getContext('2d')!;
  const path = new Path2D(g.outline.d);

  // 1. Inside mask
  const inside = new Uint8Array(W * H);
  for (let j = 0; j < H; j++) {
    for (let i = 0; i < W; i++) {
      inside[j * W + i] = ctx.isPointInPath(path, i * step, j * step) ? 1 : 0;
    }
  }

  // 2. Chamfer distance transform (grid units) of the inside region
  const dist = new Float32Array(W * H);
  for (let k = 0; k < W * H; k++) dist[k] = inside[k] ? 1e9 : 0;
  const at = (i: number, j: number) => (i < 0 || j < 0 || i >= W || j >= H ? 0 : dist[j * W + i]);
  for (let j = 0; j < H; j++) {
    for (let i = 0; i < W; i++) {
      const k = j * W + i;
      if (!inside[k]) continue;
      dist[k] = Math.min(dist[k], at(i - 1, j) + 1, at(i, j - 1) + 1, at(i - 1, j - 1) + 1.414, at(i + 1, j - 1) + 1.414);
    }
  }
  for (let j = H - 1; j >= 0; j--) {
    for (let i = W - 1; i >= 0; i--) {
      const k = j * W + i;
      if (!inside[k]) continue;
      dist[k] = Math.min(dist[k], at(i + 1, j) + 1, at(i, j + 1) + 1, at(i + 1, j + 1) + 1.414, at(i - 1, j + 1) + 1.414);
    }
  }

  // 3. Vertex ids for interior grid points
  const vid = new Int32Array(W * H).fill(-1);
  let n = 0;
  let minX = Infinity, maxX = -Infinity, minY = Infinity, maxY = -Infinity;
  for (let j = 0; j < H; j++) {
    for (let i = 0; i < W; i++) {
      const k = j * W + i;
      if (!inside[k]) continue;
      vid[k] = n++;
      const px = i * step, py = j * step;
      minX = Math.min(minX, px); maxX = Math.max(maxX, px);
      minY = Math.min(minY, py); maxY = Math.max(maxY, py);
    }
  }
  const pcx = (minX + maxX) / 2;
  const pcy = (minY + maxY) / 2;
  const toLocal = (px: number, py: number) => new THREE.Vector2((px - pcx) * s, (pcy - py) * s);

  // Path-space coordinates per vertex (boundary gets smoothed below)
  const px = new Float32Array(n);
  const py = new Float32Array(n);
  const dm = new Float32Array(n); // meters to the outline
  for (let j = 0; j < H; j++) {
    for (let i = 0; i < W; i++) {
      const v = vid[j * W + i];
      if (v < 0) continue;
      px[v] = i * step;
      py[v] = j * step;
      dm[v] = Math.max(0, dist[j * W + i] - 1) * step * s;
    }
  }

  // 4. Front triangles (CCW seen from +z)
  const front: number[] = [];
  const addTri = (a: number, b: number, c: number) => {
    // path space is y-down, so CCW in 3D means negative cross in path space
    const cross = (px[b] - px[a]) * (py[c] - py[a]) - (py[b] - py[a]) * (px[c] - px[a]);
    if (cross < 0) front.push(a, b, c);
    else front.push(a, c, b);
  };
  for (let j = 0; j < H - 1; j++) {
    for (let i = 0; i < W - 1; i++) {
      const a = vid[j * W + i], b = vid[j * W + i + 1], c = vid[(j + 1) * W + i], d = vid[(j + 1) * W + i + 1];
      const count = +(a >= 0) + +(b >= 0) + +(c >= 0) + +(d >= 0);
      if (count === 4) {
        addTri(a, c, b);
        addTri(b, c, d);
      } else if (count === 3) {
        const q = [a, b, d, c].filter((x) => x >= 0);
        addTri(q[0], q[1], q[2]);
      }
    }
  }

  // 5. Boundary edges (used by exactly one front triangle), kept in triangle order
  const edgeCount = new Map<number, number>();
  const edgeKey = (a: number, b: number) => (a < b ? a * n + b : b * n + a);
  for (let t = 0; t < front.length; t += 3) {
    for (let e = 0; e < 3; e++) {
      const key = edgeKey(front[t + e], front[t + ((e + 1) % 3)]);
      edgeCount.set(key, (edgeCount.get(key) ?? 0) + 1);
    }
  }
  const boundary: [number, number][] = [];
  const neighbors = new Map<number, number[]>();
  for (let t = 0; t < front.length; t += 3) {
    for (let e = 0; e < 3; e++) {
      const a = front[t + e], b = front[t + ((e + 1) % 3)];
      if (edgeCount.get(edgeKey(a, b)) === 1) {
        boundary.push([a, b]);
        (neighbors.get(a) ?? neighbors.set(a, []).get(a)!).push(b);
        (neighbors.get(b) ?? neighbors.set(b, []).get(b)!).push(a);
      }
    }
  }

  // Smooth the stair-stepped outline (boundary vertices only)
  for (let iter = 0; iter < 4; iter++) {
    const nx = new Map<number, [number, number]>();
    neighbors.forEach((nb, v) => {
      if (nb.length !== 2) return;
      nx.set(v, [
        px[v] * 0.5 + (px[nb[0]] + px[nb[1]]) * 0.25,
        py[v] * 0.5 + (py[nb[0]] + py[nb[1]]) * 0.25,
      ]);
    });
    nx.forEach(([x, y], v) => {
      px[v] = x;
      py[v] = y;
    });
  }

  // 6. Vertex attributes: front shell [0, n), back shell [n, 2n)
  const positions = new Float32Array(n * 2 * 3);
  const uvs = new Float32Array(n * 2 * 2);
  const colors = new Float32Array(n * 2 * 3);
  const neck = g.neck;

  const frontZ = (v: number, xm: number, ym: number) => {
    const p = profile(dm[v] / g.falloff);
    return RIM_HALF + (g.depth - RIM_HALF) * p + drape(xm, ym, 1) * p;
  };
  const backZ = (v: number, xm: number, ym: number) => {
    const p = profile(dm[v] / g.falloff);
    return -(RIM_HALF + (g.depth * g.backScale - RIM_HALF) * p) + drape(xm, ym, 5) * p * 0.6;
  };

  for (let v = 0; v < n; v++) {
    const xm = (px[v] - pcx) * s;
    const ym = (pcy - py[v]) * s;
    let zf = frontZ(v, xm, ym);
    const zb = backZ(v, xm, ym);

    // Edge darkening as cheap ambient occlusion
    let ao = 1 - 0.22 * (1 - profile(dm[v] / (g.falloff * 0.5)));
    let aoBack = ao;

    // Neck / hood opening: sink the front shell toward the back shell
    if (neck) {
      const ex = (px[v] - neck.cx) / neck.rx;
      const ey = (py[v] - neck.cy) / neck.ry;
      const e = ex * ex + ey * ey;
      if (e < 1) {
        const wgt = smooth01((1 - e) / 0.18);
        zf = zf + (zb + 0.006 - zf) * wgt;
        ao *= 1 - (neck.type === 'hood' ? 0.8 : 0.55) * wgt;
      }
    }

    positions.set([xm, ym, zf], v * 3);
    positions.set([xm, ym, zb], (n + v) * 3);
    const u = px[v] / w;
    const vv = 1 - py[v] / h;
    uvs.set([u * 0.5, vv], v * 2);
    uvs.set([0.5 + u * 0.5, vv], (n + v) * 2);
    colors.set([ao, ao, ao], v * 3);
    colors.set([aoBack, aoBack, aoBack], (n + v) * 3);
  }

  // 7. Index: front, back (reversed), rim quads
  const index: number[] = front.slice();
  for (let t = 0; t < front.length; t += 3) {
    index.push(front[t] + n, front[t + 2] + n, front[t + 1] + n);
  }
  for (const [a, b] of boundary) {
    index.push(a, a + n, b, b, a + n, b + n);
  }

  const body = new THREE.BufferGeometry();
  body.setAttribute('position', new THREE.BufferAttribute(positions, 3));
  body.setAttribute('uv', new THREE.BufferAttribute(uvs, 2));
  body.setAttribute('color', new THREE.BufferAttribute(colors, 3));
  body.setIndex(index);
  body.computeVertexNormals();
  body.computeBoundingBox();
  body.computeBoundingSphere();

  const bvh = new MeshBVH(body);
  body.boundsTree = bvh;

  // 8. Collar / hood rim tube following the neck opening
  let collar: THREE.BufferGeometry | null = null;
  if (neck) {
    const sampleFrontZ = (qx: number, qy: number) => {
      const i = Math.min(W - 1, Math.max(0, Math.round(qx / step)));
      const j = Math.min(H - 1, Math.max(0, Math.round(qy / step)));
      const v = vid[j * W + i];
      if (v < 0) return RIM_HALF;
      const xm = (qx - pcx) * s;
      const ym = (pcy - qy) * s;
      return frontZ(v, xm, ym);
    };
    const pts: THREE.Vector3[] = [];
    const tubeR = neck.type === 'hood' ? 0.011 : 0.008;
    const addPt = (qx: number, qy: number, z: number) => {
      const l = toLocal(qx, qy);
      pts.push(new THREE.Vector3(l.x, l.y, z));
    };
    if (neck.type === 'hood') {
      for (let k = 0; k < 64; k++) {
        const a = (k / 64) * Math.PI * 2;
        const qx = neck.cx + Math.cos(a) * neck.rx;
        const qy = neck.cy + Math.sin(a) * neck.ry;
        addPt(qx, qy, sampleFrontZ(qx, qy) - tubeR * 0.4);
      }
    } else {
      // Front scoop (lower half of the ellipse), then back neckline along the top edge.
      const arcN = 40;
      for (let k = 0; k <= arcN; k++) {
        const a = (k / arcN) * Math.PI; // 0..π, y-down so this is the lower half
        const qx = neck.cx + Math.cos(a) * neck.rx;
        const qy = neck.cy + Math.sin(a) * neck.ry;
        addPt(qx, qy, Math.max(0, sampleFrontZ(qx, qy) - tubeR * 0.6));
      }
      const topN = 12;
      for (let k = 1; k < topN; k++) {
        const qx = neck.cx - neck.rx + (k / topN) * neck.rx * 2;
        // find the first interior row at this x
        const i = Math.round(qx / step);
        let j = 0;
        while (j < H - 1 && !inside[j * W + i]) j++;
        addPt(qx, j * step + 3, -tubeR * 0.3);
      }
    }
    const curve = new THREE.CatmullRomCurve3(pts, true, 'centripetal');
    collar = new THREE.TubeGeometry(curve, 180, tubeR, 12, true);
  }

  const size = new THREE.Vector3();
  body.boundingBox!.getSize(size);

  return {
    body,
    collar,
    bvh,
    toLocal,
    triangles: index.length / 3 + (collar ? (collar.index?.count ?? 0) / 3 : 0),
    size,
  };
}
