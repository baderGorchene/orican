import * as THREE from 'three';
import { getGarment, Hotspot } from './garments';
import { sceneRefs } from './scene-refs';
import { getAsset } from './assets';
import type { GarmentBuild } from './garment-geometry';
import { attachmentLayout } from './model-edit';
import { fitAttachment, raycastSurface, surfaceFrame, SurfaceHit, toVec3, Vec3 } from './surface';
import { AccessoryItem, useStudio } from './store';

/**
 * Transient pointer state shared by the scene components. Kept outside React
 * so hover updates don't re-render the tree every pointer move.
 */
export const interaction = {
  hover: { valid: false, point: new THREE.Vector3(), normal: new THREE.Vector3(0, 0, 1) },
  drag: null as null | { id: string; moved: boolean },
};

export function hotspotHit(h: Hotspot): SurfaceHit | null {
  const b = sceneRefs.garment;
  if (!b) return null;
  const l = b.toLocal(h.x, h.y);
  const side = h.side === 'front' ? 1 : -1;
  return raycastSurface(b.bvh, b.body, new THREE.Vector3(l.x, l.y, side), new THREE.Vector3(0, 0, -side));
}

/** Where a newly added item lands: the garment's center-chest hotspot (or its first front hotspot). */
export function defaultSpot(): { position: Vec3; normal: Vec3 } {
  const g = getGarment(useStudio.getState().garmentId);
  const h = g.hotspots.find((x) => x.id === 'center-chest') ?? g.hotspots.find((x) => x.side === 'front') ?? g.hotspots[0];
  const hit = h ? hotspotHit(h) : null;
  if (hit) return { position: toVec3(hit.point), normal: toVec3(hit.normal) };
  const front = sceneRefs.garment ? sceneRefs.garment.size.z / 2 : 0.1;
  return { position: [0, 0.1, front], normal: [0, 0, 1] };
}

/** Re-projects every item onto the current garment (after a garment switch). */
export function resnapItems() {
  const b = sceneRefs.garment;
  if (!b) return;
  const { items } = useStudio.getState();
  const next = items.map((item) => {
    const [x, y, z] = item.placement.position;
    const side = (item.placement.normal[2] || z) >= 0 ? 1 : -1;
    const hit = raycastSurface(b.bvh, b.body, new THREE.Vector3(x, y, side), new THREE.Vector3(0, 0, -side));
    // Missed the garment, or landed on a steep edge (e.g. between trouser legs): fall back to the chest.
    if (!hit || Math.abs(hit.normal.z) < 0.45) return { ...item, placement: { ...item.placement, ...defaultSpot() } };
    return { ...item, placement: { ...item.placement, position: toVec3(hit.point), normal: toVec3(hit.normal) } };
  });
  useStudio.setState({ items: next });
}

/** Pose + local layout for an attachment item (shared by the scene node, gizmo and bake). */
export function accessoryLayout(build: GarmentBuild, item: AccessoryItem) {
  const asset = getAsset(item.assetKey);
  if (!asset) return null;
  const layout = attachmentLayout(asset, item.transform);
  const s = item.placement.scale;
  const pose = fitAttachment(build.bvh, build.body, item.placement, {
    hx: layout.footprint.hx * s,
    hy: layout.footprint.hy * s,
  });
  return { asset, layout, pose };
}

/** Slides an item along the fabric by (dx, dy) meters in garment right/up, re-snapping to the surface. */
export function nudgeItem(id: string, dx: number, dy: number): boolean {
  const b = sceneRefs.garment;
  const item = useStudio.getState().items.find((i) => i.id === id);
  if (!b || !item) return false;
  const p = new THREE.Vector3(...item.placement.position);
  const n = new THREE.Vector3(...item.placement.normal).normalize();
  const q = surfaceFrame(n, 0);
  const target = p
    .addScaledVector(new THREE.Vector3(1, 0, 0).applyQuaternion(q), dx)
    .addScaledVector(new THREE.Vector3(0, 1, 0).applyQuaternion(q), dy);
  const hit = raycastSurface(b.bvh, b.body, target.clone().addScaledVector(n, 0.05), n.clone().negate(), 0.15);
  if (!hit) return false;
  useStudio.getState().updatePlacement(id, { position: toVec3(hit.point), normal: toVec3(hit.normal) });
  return true;
}
