import * as THREE from 'three';

/**
 * Attachment assets (built-in hardware and user uploads).
 *
 * Every asset is normalized to the mounting convention in surface.ts: the
 * thinnest axis becomes local Z, the mounting base sits on z = 0, the part
 * faces +Z, XY is centered, and the largest dimension is a real-world size in
 * meters. Three.js objects are not serializable, so they live in this module
 * registry and the store only keeps `assetKey` strings.
 */

export interface AssetEntry {
  key: string;
  name: string;
  object: THREE.Group;
  /** Half extents of the footprint on the mounting plane, meters at scale 1. */
  footprint: { hx: number; hy: number };
  triangles: number;
}

const registry = new Map<string, AssetEntry>();

export function countTriangles(root: THREE.Object3D): number {
  let tris = 0;
  root.traverse((o) => {
    const mesh = o as THREE.Mesh;
    if (!mesh.isMesh) return;
    const g = mesh.geometry;
    tris += (g.index ? g.index.count : g.attributes.position.count) / 3;
  });
  return Math.round(tris);
}

/**
 * Bakes world transforms into geometry (fixing winding for mirrored nodes),
 * optionally rotates the thinnest axis onto Z, then centers and scales.
 * Returns notices describing what was changed.
 */
export function normalizeAttachment(
  root: THREE.Object3D,
  targetMaxDim: number,
  opts: { reorient: boolean },
): { group: THREE.Group; notices: string[] } {
  const notices: string[] = [];
  const group = new THREE.Group();
  root.updateMatrixWorld(true);

  let mirrored = 0;
  root.traverse((o) => {
    const mesh = o as THREE.Mesh;
    if (!mesh.isMesh) return;
    const geometry = mesh.geometry.clone();
    geometry.morphAttributes = {};
    geometry.applyMatrix4(mesh.matrixWorld);
    if (mesh.matrixWorld.determinant() < 0) {
      mirrored++;
      if (!geometry.index) {
        const count = geometry.attributes.position.count;
        geometry.setIndex(Array.from({ length: count }, (_, i) => i));
      }
      const idx = geometry.index!;
      for (let i = 0; i < idx.count; i += 3) {
        const b = idx.getX(i + 1);
        idx.setX(i + 1, idx.getX(i + 2));
        idx.setX(i + 2, b);
      }
      idx.needsUpdate = true;
    }
    if (!geometry.attributes.normal) geometry.computeVertexNormals();
    const out = new THREE.Mesh(geometry, mesh.material);
    out.name = mesh.name;
    group.add(out);
  });
  if (mirrored) notices.push(`Fixed inverted scale on ${mirrored} mesh${mirrored > 1 ? 'es' : ''}`);

  const box = new THREE.Box3().setFromObject(group);
  const size = box.getSize(new THREE.Vector3());

  if (opts.reorient) {
    const thinnest = size.x <= size.y && size.x <= size.z ? 'x' : size.y <= size.z ? 'y' : 'z';
    // Only reorient when the part is clearly flat along another axis.
    if (thinnest !== 'z' && size[thinnest] < size.z * 0.6) {
      const m =
        thinnest === 'y'
          ? new THREE.Matrix4().makeRotationX(Math.PI / 2) // +Y → +Z
          : new THREE.Matrix4().makeRotationY(-Math.PI / 2); // +X → +Z
      group.children.forEach((c) => (c as THREE.Mesh).geometry.applyMatrix4(m));
      notices.push(`Re-oriented: thinnest axis (${thinnest.toUpperCase()}) now faces out of the fabric`);
    }
  }

  box.setFromObject(group);
  box.getSize(size);
  const center = box.getCenter(new THREE.Vector3());
  const maxDim = Math.max(size.x, size.y, size.z) || 1;
  const k = targetMaxDim / maxDim;
  const m = new THREE.Matrix4()
    .makeScale(k, k, k)
    .multiply(new THREE.Matrix4().makeTranslation(-center.x, -center.y, -box.min.z));
  group.children.forEach((c) => {
    const g = (c as THREE.Mesh).geometry;
    g.applyMatrix4(m);
    g.computeBoundingBox();
    g.computeBoundingSphere();
  });
  if (Math.abs(maxDim - targetMaxDim) / targetMaxDim > 0.05) {
    notices.push(`Scaled to ${(targetMaxDim * 100).toFixed(1)} cm`);
  }
  return { group, notices };
}

function makeEntry(key: string, name: string, group: THREE.Group): AssetEntry {
  const box = new THREE.Box3().setFromObject(group);
  const size = box.getSize(new THREE.Vector3());
  return { key, name, object: group, footprint: { hx: size.x / 2, hy: size.y / 2 }, triangles: countTriangles(group) };
}

export function registerAsset(key: string, name: string, group: THREE.Group): AssetEntry {
  const entry = makeEntry(key, name, group);
  registry.set(key, entry);
  return entry;
}

// ---------------------------------------------------------------------------
// Built-in hardware library (procedural, authored facing +Z)
// ---------------------------------------------------------------------------

const silver = () => new THREE.MeshStandardMaterial({ color: '#e4e7eb', metalness: 1, roughness: 0.22, envMapIntensity: 1.8 });
const brass = () => new THREE.MeshStandardMaterial({ color: '#d4ae62', metalness: 1, roughness: 0.28, envMapIntensity: 1.8 });
const blackMetal = () => new THREE.MeshStandardMaterial({ color: '#2a2b2e', metalness: 0.9, roughness: 0.35, envMapIntensity: 1.5 });

function facingZ(geometry: THREE.BufferGeometry): THREE.BufferGeometry {
  // Cylinders/cones/lathes are built around +Y; turn them to face +Z.
  return geometry.rotateX(Math.PI / 2);
}

function tubeAlong(points: [number, number][], radius: number, closed: boolean): THREE.TubeGeometry {
  const curve = new THREE.CatmullRomCurve3(
    points.map(([x, y]) => new THREE.Vector3(x, y, radius)),
    closed,
    'centripetal',
  );
  return new THREE.TubeGeometry(curve, closed ? 160 : 120, radius, 12, closed);
}

interface BuiltinDef {
  key: string;
  name: string;
  /** Largest dimension, meters. */
  size: number;
  build: () => THREE.Group;
}

export const BUILTIN_HARDWARE: BuiltinDef[] = [
  {
    key: 'builtin:pyramid-stud',
    name: 'Pyramid Stud',
    size: 0.012,
    build: () => {
      const g = new THREE.Group();
      const cone = facingZ(new THREE.ConeGeometry(0.5, 0.42, 4, 1)).rotateZ(Math.PI / 4).translate(0, 0, 0.21);
      g.add(new THREE.Mesh(cone, silver()));
      return g;
    },
  },
  {
    key: 'builtin:dome-stud',
    name: 'Dome Stud',
    size: 0.011,
    build: () => {
      const g = new THREE.Group();
      const dome = new THREE.SphereGeometry(0.5, 32, 16, 0, Math.PI * 2, 0, Math.PI / 2).rotateX(Math.PI / 2);
      g.add(new THREE.Mesh(dome, brass()));
      return g;
    },
  },
  {
    key: 'builtin:eyelet',
    name: 'Eyelet',
    size: 0.014,
    build: () => {
      const g = new THREE.Group();
      g.add(new THREE.Mesh(new THREE.TorusGeometry(0.38, 0.12, 16, 48).translate(0, 0, 0.12), silver()));
      return g;
    },
  },
  {
    key: 'builtin:pin-badge',
    name: 'Enamel Pin',
    size: 0.032,
    build: () => {
      const g = new THREE.Group();
      g.add(new THREE.Mesh(facingZ(new THREE.CylinderGeometry(0.5, 0.5, 0.06, 64)).translate(0, 0, 0.03), brass()));
      const star = new THREE.Shape();
      for (let i = 0; i < 10; i++) {
        const r = i % 2 === 0 ? 0.36 : 0.15;
        const a = Math.PI / 2 + (i / 10) * Math.PI * 2;
        if (i === 0) star.moveTo(Math.cos(a) * r, Math.sin(a) * r);
        else star.lineTo(Math.cos(a) * r, Math.sin(a) * r);
      }
      const enamel = new THREE.MeshStandardMaterial({ color: '#DD0072', roughness: 0.25, metalness: 0.1 });
      const face = new THREE.Mesh(facingZ(new THREE.CylinderGeometry(0.44, 0.44, 0.03, 64)).translate(0, 0, 0.07), enamel.clone());
      (face.material as THREE.MeshStandardMaterial).color.set('#242C47');
      g.add(face);
      const starGeo = new THREE.ExtrudeGeometry(star, { depth: 0.04, bevelEnabled: false }).translate(0, 0, 0.08);
      g.add(new THREE.Mesh(starGeo, enamel));
      return g;
    },
  },
  {
    key: 'builtin:button',
    name: 'Four-Hole Button',
    size: 0.02,
    build: () => {
      const s = new THREE.Shape();
      s.absarc(0, 0, 0.5, 0, Math.PI * 2, false);
      for (const [x, y] of [[0.13, 0.13], [-0.13, 0.13], [0.13, -0.13], [-0.13, -0.13]]) {
        const hole = new THREE.Path();
        hole.absarc(x, y, 0.06, 0, Math.PI * 2, true);
        s.holes.push(hole);
      }
      const geo = new THREE.ExtrudeGeometry(s, { depth: 0.08, bevelEnabled: true, bevelSize: 0.04, bevelThickness: 0.04, bevelSegments: 4, curveSegments: 48 });
      geo.translate(0, 0, 0.04);
      const g = new THREE.Group();
      g.add(new THREE.Mesh(geo, new THREE.MeshStandardMaterial({ color: '#3b2f28', roughness: 0.35 })));
      return g;
    },
  },
  {
    key: 'builtin:safety-pin',
    name: 'Safety Pin',
    size: 0.045,
    build: () => {
      const g = new THREE.Group();
      const r = 0.025;
      // Bar and pin with a coil loop at the left end
      const pts: [number, number][] = [[0.42, 0.06], [-0.3, 0.07], [-0.42, 0.02], [-0.44, -0.06], [-0.36, -0.1], [-0.3, -0.06], [-0.3, 0]];
      g.add(new THREE.Mesh(tubeAlong(pts, r, false), silver()));
      const pin: [number, number][] = [[-0.3, 0], [0.0, -0.02], [0.4, -0.05]];
      g.add(new THREE.Mesh(tubeAlong(pin, r * 0.8, false), silver()));
      const head = new THREE.Mesh(new THREE.BoxGeometry(0.12, 0.18, 0.08).translate(0.44, 0.02, 0.04), silver());
      g.add(head);
      return g;
    },
  },
  {
    key: 'builtin:carabiner',
    name: 'Carabiner',
    size: 0.05,
    build: () => {
      const g = new THREE.Group();
      const pts: [number, number][] = [];
      for (let i = 0; i < 24; i++) {
        const a = (i / 24) * Math.PI * 2;
        const rx = 0.5;
        const ry = Math.cos(a) > 0 ? 0.3 : 0.22; // D-shape
        pts.push([Math.cos(a) * rx, Math.sin(a) * ry]);
      }
      g.add(new THREE.Mesh(tubeAlong(pts, 0.05, true), blackMetal()));
      return g;
    },
  },
  {
    key: 'builtin:zipper-pull',
    name: 'Zipper Pull',
    size: 0.035,
    build: () => {
      const s = new THREE.Shape();
      s.moveTo(-0.14, 0.5);
      s.lineTo(0.14, 0.5);
      s.quadraticCurveTo(0.2, -0.3, 0.12, -0.46);
      s.quadraticCurveTo(0, -0.54, -0.12, -0.46);
      s.quadraticCurveTo(-0.2, -0.3, -0.14, 0.5);
      const hole = new THREE.Path();
      hole.absellipse(0, -0.28, 0.06, 0.1, 0, Math.PI * 2, true, 0);
      s.holes.push(hole);
      const geo = new THREE.ExtrudeGeometry(s, { depth: 0.06, bevelEnabled: true, bevelSize: 0.02, bevelThickness: 0.02, bevelSegments: 3 });
      geo.translate(0, 0, 0.02);
      const g = new THREE.Group();
      g.add(new THREE.Mesh(geo, silver()));
      return g;
    },
  },
];

export function getAsset(key: string): AssetEntry | undefined {
  const existing = registry.get(key);
  if (existing) return existing;
  const def = BUILTIN_HARDWARE.find((b) => b.key === key);
  if (!def) return undefined;
  const { group } = normalizeAttachment(def.build(), def.size, { reorient: false });
  return registerAsset(def.key, def.name, group);
}
