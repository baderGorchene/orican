import * as THREE from 'three';
import { DecalGeometry } from 'three/examples/jsm/geometries/DecalGeometry.js';
import type { GarmentBuild } from './garment-geometry';
import { decalPose, Placement } from './surface';
import { DESIGN_BASE_WIDTH } from './store';

export const DECAL_DEPTH = 0.06;

export function designSize(placement: Placement, aspect: number): { w: number; h: number } {
  const w = DESIGN_BASE_WIDTH * placement.scale;
  return { w, h: w / Math.max(0.05, aspect) };
}

/**
 * Projects a print onto the garment. Instead of clipping every garment
 * triangle (slow while dragging), the BVH collects only the front-facing
 * triangles inside the projector box, and DecalGeometry clips that subset.
 */
export function buildDecalGeometry(build: GarmentBuild, placement: Placement, aspect: number): THREE.BufferGeometry {
  const { position, quaternion } = decalPose(placement);
  const { w, h } = designSize(placement, aspect);
  const n = new THREE.Vector3(...placement.normal).normalize();

  const r = Math.hypot(w, h, DECAL_DEPTH) / 2;
  const query = new THREE.Box3().setFromCenterAndSize(position, new THREE.Vector3(r * 2, r * 2, r * 2));
  const sphere = new THREE.Sphere(position, r);

  const geo = build.body;
  const index = geo.index!;
  const pos = geo.attributes.position as THREE.BufferAttribute;
  const nor = geo.attributes.normal as THREE.BufferAttribute;
  const outPos: number[] = [];
  const outNor: number[] = [];
  const triNormal = new THREE.Vector3();

  build.bvh.shapecast({
    intersectsBounds: (box) => box.intersectsBox(query),
    intersectsTriangle: (tri, triIndex) => {
      if (!tri.intersectsSphere(sphere)) return false;
      tri.getNormal(triNormal);
      if (triNormal.dot(n) < 0.05) return false;
      for (let k = 0; k < 3; k++) {
        const vi = index.getX(triIndex * 3 + k);
        outPos.push(pos.getX(vi), pos.getY(vi), pos.getZ(vi));
        outNor.push(nor.getX(vi), nor.getY(vi), nor.getZ(vi));
      }
      return false;
    },
  });

  const subset = new THREE.BufferGeometry();
  subset.setAttribute('position', new THREE.Float32BufferAttribute(outPos, 3));
  subset.setAttribute('normal', new THREE.Float32BufferAttribute(outNor, 3));
  const proxy = new THREE.Mesh(subset);
  proxy.updateMatrixWorld();

  const decal = new DecalGeometry(proxy, position, new THREE.Euler().setFromQuaternion(quaternion), new THREE.Vector3(w, h, DECAL_DEPTH));
  subset.dispose();
  return decal;
}
