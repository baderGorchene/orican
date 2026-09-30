import * as THREE from 'three';
import type { MeshBVH } from 'three-mesh-bvh';

/**
 * Surface placement math. All values are in garment-local space.
 *
 * Mounting convention (shared with asset ingestion): an attachment's mounting
 * base lies on its local XY plane at z = 0 and it faces +Z. Placing it means
 * aligning local +Z with the surface normal; local +Y is aligned with the
 * garment's "up" projected onto the tangent plane, so yaw is stable and 0°
 * always means upright.
 */

export type Vec3 = [number, number, number];

export interface Placement {
  position: Vec3;
  normal: Vec3;
  /** Rotation around the surface normal, radians. */
  yaw: number;
  /** Uniform scale multiplier. */
  scale: number;
  /** Clearance along the normal, meters. */
  offset: number;
}

export interface SurfaceHit {
  point: THREE.Vector3;
  normal: THREE.Vector3;
}

const UP = new THREE.Vector3(0, 1, 0);
const Z = new THREE.Vector3(0, 0, 1);

/** Normal interpolated from vertex normals at `point` (smoother than the face normal). */
export function interpolatedNormal(
  geometry: THREE.BufferGeometry,
  face: { a: number; b: number; c: number },
  point: THREE.Vector3,
  target = new THREE.Vector3(),
): THREE.Vector3 {
  const pos = geometry.attributes.position as THREE.BufferAttribute;
  const nor = geometry.attributes.normal as THREE.BufferAttribute;
  const pa = new THREE.Vector3().fromBufferAttribute(pos, face.a);
  const pb = new THREE.Vector3().fromBufferAttribute(pos, face.b);
  const pc = new THREE.Vector3().fromBufferAttribute(pos, face.c);
  const bary = new THREE.Vector3();
  if (!THREE.Triangle.getBarycoord(point, pa, pb, pc, bary)) {
    return THREE.Triangle.getNormal(pa, pb, pc, target);
  }
  const na = new THREE.Vector3().fromBufferAttribute(nor, face.a);
  const nb = new THREE.Vector3().fromBufferAttribute(nor, face.b);
  const nc = new THREE.Vector3().fromBufferAttribute(nor, face.c);
  return target
    .set(0, 0, 0)
    .addScaledVector(na, bary.x)
    .addScaledVector(nb, bary.y)
    .addScaledVector(nc, bary.z)
    .normalize();
}

/** Orientation whose +Z is the surface normal and whose +Y points "up the garment", then yawed. */
export function surfaceFrame(normal: THREE.Vector3, yaw: number, target = new THREE.Quaternion()): THREE.Quaternion {
  const n = normal.clone().normalize();
  const t = UP.clone().addScaledVector(n, -UP.dot(n));
  if (t.lengthSq() < 1e-4) {
    // Normal is (anti)parallel to up, e.g. top of a shoulder: point "up" toward the back.
    t.set(0, 0, n.y > 0 ? -1 : 1).addScaledVector(n, -t.dot(n));
  }
  t.normalize();
  const x = new THREE.Vector3().crossVectors(t, n).normalize();
  const m = new THREE.Matrix4().makeBasis(x, t, n);
  target.setFromRotationMatrix(m);
  if (yaw) target.multiply(new THREE.Quaternion().setFromAxisAngle(Z, yaw));
  return target;
}

export function raycastSurface(
  bvh: MeshBVH,
  geometry: THREE.BufferGeometry,
  origin: THREE.Vector3,
  direction: THREE.Vector3,
  far = Infinity,
): SurfaceHit | null {
  const ray = new THREE.Ray(origin, direction.clone().normalize());
  const hit = bvh.raycastFirst(ray, THREE.DoubleSide, 0, far);
  if (!hit || !hit.face) return null;
  return { point: hit.point.clone(), normal: interpolatedNormal(geometry, hit.face, hit.point) };
}

export interface Pose {
  position: THREE.Vector3;
  quaternion: THREE.Quaternion;
}

/**
 * Fits a rigid attachment with a rectangular footprint (half extents, meters,
 * already scaled) to the surface around `placement.position`:
 * samples the surface under each footprint corner, averages the normals, and
 * lifts the attachment so no corner sinks into the fabric.
 */
export function fitAttachment(
  bvh: MeshBVH,
  geometry: THREE.BufferGeometry,
  placement: Placement,
  footprint: { hx: number; hy: number },
): Pose {
  const p = new THREE.Vector3(...placement.position);
  const n = new THREE.Vector3(...placement.normal).normalize();
  const q = surfaceFrame(n, placement.yaw);
  const ax = new THREE.Vector3(1, 0, 0).applyQuaternion(q);
  const ay = new THREE.Vector3(0, 1, 0).applyQuaternion(q);

  const hits: SurfaceHit[] = [];
  const probe = Math.max(footprint.hx, footprint.hy) * 1.5 + 0.02;
  for (const [sx, sy] of [[1, 1], [-1, 1], [1, -1], [-1, -1]]) {
    const origin = p
      .clone()
      .addScaledVector(ax, sx * footprint.hx)
      .addScaledVector(ay, sy * footprint.hy)
      .addScaledVector(n, probe);
    const hit = raycastSurface(bvh, geometry, origin, n.clone().negate(), probe * 2);
    if (hit) hits.push(hit);
  }

  const avg = n.clone();
  for (const h of hits) avg.add(h.normal);
  avg.normalize();

  let lift = 0;
  for (const h of hits) lift = Math.max(lift, h.point.clone().sub(p).dot(avg));

  return {
    position: p.addScaledVector(avg, lift + placement.offset),
    quaternion: surfaceFrame(avg, placement.yaw),
  };
}

/** Pose for a projected print (decal): no footprint fitting, only clearance. */
export function decalPose(placement: Placement): Pose {
  const n = new THREE.Vector3(...placement.normal).normalize();
  return {
    position: new THREE.Vector3(...placement.position),
    quaternion: surfaceFrame(n, placement.yaw),
  };
}

export const toVec3 = (v: THREE.Vector3): Vec3 => [v.x, v.y, v.z];
