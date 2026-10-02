import * as THREE from 'three';
import { RoomEnvironment } from 'three/examples/jsm/environments/RoomEnvironment.js';
import { getAsset } from './assets';
import type { GarmentBuild } from './garment-geometry';
import { attachmentLayout, DEFAULT_FILTERS, DEFAULT_TRANSFORM, disposeFilteredObject, makeFilteredObject } from './model-edit';
import { sceneRefs } from './scene-refs';
import { AccessoryItem, DESIGN_BASE_WIDTH, DesignItem, newId, useStudio } from './store';
import { raycastSurface, surfaceFrame, toVec3 } from './surface';

/**
 * "Confirm & print": turns a 3D attachment into a print on the fabric.
 *
 * The model (with its tilt/stretch/mirror, scale and filters, but without yaw)
 * is rendered straight down the surface normal with an orthographic camera
 * into a transparent image. That image becomes a DesignItem decal centered on
 * the model's projected footprint, with the item's yaw — so the print covers
 * exactly the area the 3D model covered and follows the fabric folds.
 */

const MAX_PX = 1600;

export function bakeAccessoryToPrint(item: AccessoryItem, build: GarmentBuild): DesignItem | null {
  const asset = getAsset(item.assetKey);
  if (!asset) return null;

  // Model in frame space (yaw is applied to the decal instead).
  const { matrix } = attachmentLayout(asset, item.transform);
  const holder = new THREE.Group();
  holder.matrixAutoUpdate = false;
  holder.matrix.copy(new THREE.Matrix4().makeScale(item.placement.scale, item.placement.scale, item.placement.scale).multiply(matrix));
  const model = makeFilteredObject(asset.object, item.filters);
  holder.add(model);
  holder.updateMatrixWorld(true);

  const box = new THREE.Box3().setFromObject(holder);
  const size = box.getSize(new THREE.Vector3());
  const pad = Math.max(size.x, size.y) * 0.04;
  const w = size.x + pad * 2;
  const h = size.y + pad * 2;
  const cx = (box.min.x + box.max.x) / 2;
  const cy = (box.min.y + box.max.y) / 2;

  const k = MAX_PX / Math.max(w, h);
  const pxW = Math.max(8, Math.round(w * k));
  const pxH = Math.max(8, Math.round(h * k));

  const canvas = document.createElement('canvas');
  const renderer = new THREE.WebGLRenderer({ canvas, alpha: true, antialias: true, preserveDrawingBuffer: true });
  renderer.setPixelRatio(1);
  renderer.setSize(pxW, pxH, false);
  renderer.setClearColor(0x000000, 0);
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.outputColorSpace = THREE.SRGBColorSpace;

  const scene = new THREE.Scene();
  const pmrem = new THREE.PMREMGenerator(renderer);
  const room = new RoomEnvironment();
  const env = pmrem.fromScene(room, 0.04).texture;
  // Softer than the studio view: the print gets lit a second time on the fabric,
  // so the baked image should hold the model's colors and form, not bright highlights.
  scene.environment = env;
  scene.environmentIntensity = 0.35;
  const key = new THREE.DirectionalLight(0xffffff, 1.5);
  key.position.set(-1, 1.2, 2);
  scene.add(key);
  const fill = new THREE.DirectionalLight(0xffffff, 0.45);
  fill.position.set(1.5, -0.5, 1.5);
  scene.add(fill);
  scene.add(holder);

  const camera = new THREE.OrthographicCamera(-w / 2, w / 2, h / 2, -h / 2, 0.001, 10);
  camera.position.set(cx, cy, box.max.z + 1);
  camera.lookAt(cx, cy, 0);

  renderer.render(scene, camera);
  const src = canvas.toDataURL('image/png');

  disposeFilteredObject(model);
  env.dispose();
  pmrem.dispose();
  room.traverse((o) => {
    const mesh = o as THREE.Mesh;
    if (mesh.isMesh) {
      mesh.geometry.dispose();
      (mesh.material as THREE.Material).dispose();
    }
  });
  renderer.dispose();
  renderer.forceContextLoss();

  // Center the print on the model's projected footprint (offset rotated by yaw).
  const n = new THREE.Vector3(...item.placement.normal).normalize();
  const q = surfaceFrame(n, item.placement.yaw);
  const target = new THREE.Vector3(...item.placement.position)
    .addScaledVector(new THREE.Vector3(1, 0, 0).applyQuaternion(q), cx)
    .addScaledVector(new THREE.Vector3(0, 1, 0).applyQuaternion(q), cy);
  const hit = raycastSurface(build.bvh, build.body, target.clone().addScaledVector(n, 0.05), n.clone().negate(), 0.15);

  return {
    id: newId(),
    kind: 'design',
    name: item.name,
    src,
    aspect: w / h,
    finish: 'dtg',
    visible: item.visible,
    locked: false,
    placement: {
      position: hit ? toVec3(hit.point) : item.placement.position,
      normal: hit ? toVec3(hit.normal) : item.placement.normal,
      yaw: item.placement.yaw,
      scale: w / DESIGN_BASE_WIDTH,
      offset: 0,
    },
    baked: {
      assetKey: item.assetKey,
      name: item.name,
      placement: item.placement,
      transform: item.transform,
      filters: item.filters,
    },
  };
}

/** Restores the 3D attachment a print was baked from. */
export function unbakePrint(design: DesignItem): AccessoryItem | null {
  if (!design.baked || !getAsset(design.baked.assetKey)) return null;
  return {
    id: newId(),
    kind: 'accessory',
    name: design.baked.name,
    assetKey: design.baked.assetKey,
    transform: design.baked.transform ?? DEFAULT_TRANSFORM,
    filters: design.baked.filters ?? DEFAULT_FILTERS,
    placement: design.baked.placement,
    visible: true,
    locked: false,
  };
}

/** Confirms an attachment's position and prints it onto the garment (one undo step). */
export function printAccessory(id: string): boolean {
  const store = useStudio.getState();
  const item = store.items.find((i) => i.id === id);
  const build = sceneRefs.garment;
  if (!item || item.kind !== 'accessory' || !build) return false;
  const design = bakeAccessoryToPrint(item, build);
  if (!design) return false;
  store.replaceItem(id, design);
  store.showToast(`${item.name} is now printed on the garment. Pick a print finish, or use “Edit as 3D model” to change it.`);
  return true;
}

/** Turns a baked print back into the editable 3D attachment (one undo step). */
export function editPrintAs3D(id: string): boolean {
  const store = useStudio.getState();
  const item = store.items.find((i) => i.id === id);
  if (!item || item.kind !== 'design') return false;
  const accessory = unbakePrint(item);
  if (!accessory) {
    store.showToast('The original 3D model is no longer loaded. Upload it again to edit it.');
    return false;
  }
  store.replaceItem(id, accessory);
  return true;
}
