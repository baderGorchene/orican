import * as THREE from 'three';
import { GLTFExporter } from 'three/examples/jsm/exporters/GLTFExporter.js';
import { paintBackground } from './backgrounds';
import { buildDecalGeometry } from './decal';
import { FINISHES } from './print-layer';
import { peekPrintTexture } from './print-textures';
import { NO_EXPORT, sceneRefs } from './scene-refs';
import { useStudio } from './store';

/** Shared clock for the video turntable (read by the scene's animation loop). */
export const recordClock = { start: 0, duration: 6000, baseRotation: 0 };

function download(href: string, filename: string) {
  const a = document.createElement('a');
  a.href = href;
  a.download = filename;
  a.click();
}

function withHelpersHidden<T>(fn: () => T): T {
  const hidden: THREE.Object3D[] = [];
  sceneRefs.scene?.traverse((o) => {
    if (o.userData[NO_EXPORT] && o.visible) {
      o.visible = false;
      hidden.push(o);
    }
  });
  try {
    return fn();
  } finally {
    hidden.forEach((o) => (o.visible = true));
  }
}

function baseName() {
  return `ORICAN_${useStudio.getState().garmentId}`;
}

export function exportPNG() {
  const { gl, scene, camera } = sceneRefs;
  if (!gl || !scene || !camera) throw new Error('Viewport not ready');
  const { background, customBackground } = useStudio.getState();
  const src = gl.domElement;
  const out = document.createElement('canvas');
  out.width = src.width;
  out.height = src.height;
  const ctx = out.getContext('2d')!;
  paintBackground(ctx, out.width, out.height, background, customBackground);
  withHelpersHidden(() => {
    gl.render(scene, camera);
    ctx.drawImage(src, 0, 0);
  });
  download(out.toDataURL('image/png'), `${baseName()}_render.png`);
}

/**
 * Prints live inside the garment shader, which glTF can't carry; for export
 * they become real decal meshes with standard materials, removed afterwards.
 */
function addExportDecals(root: THREE.Group): THREE.Mesh[] {
  const build = sceneRefs.garment;
  if (!build) return [];
  const meshes: THREE.Mesh[] = [];
  for (const item of useStudio.getState().items) {
    if (item.kind !== 'design' || !item.visible) continue;
    const texture = peekPrintTexture(item.src);
    if (!texture) continue;
    const f = FINISHES[item.finish ?? 'dtg'];
    const mesh = new THREE.Mesh(
      buildDecalGeometry(build, item.placement, item.aspect),
      new THREE.MeshStandardMaterial({
        map: texture,
        transparent: true,
        roughness: f.roughness,
        metalness: f.metalness,
        polygonOffset: true,
        polygonOffsetFactor: -4,
      }),
    );
    mesh.name = `Print: ${item.name}`;
    root.add(mesh);
    meshes.push(mesh);
  }
  return meshes;
}

export async function exportGLB() {
  const { root } = sceneRefs;
  if (!root) throw new Error('Viewport not ready');
  const rotation = root.rotation.y;
  root.rotation.y = 0;
  const decals = addExportDecals(root);
  root.updateMatrixWorld(true);
  try {
    const result = await withHelpersHidden(() =>
      new GLTFExporter().parseAsync(root, { binary: true, onlyVisible: true }),
    );
    const blob = new Blob([result as ArrayBuffer], { type: 'model/gltf-binary' });
    const url = URL.createObjectURL(blob);
    download(url, `${baseName()}.glb`);
    setTimeout(() => URL.revokeObjectURL(url), 5000);
  } finally {
    root.rotation.y = rotation;
    for (const d of decals) {
      root.remove(d);
      d.geometry.dispose();
      (d.material as THREE.Material).dispose();
    }
  }
}

/** Records one full turntable rotation of the garment as a WebM video. */
export function exportTurntableVideo(durationMs = 6000): Promise<void> {
  const { gl, root } = sceneRefs;
  if (!gl || !root) return Promise.reject(new Error('Viewport not ready'));
  if (typeof MediaRecorder === 'undefined') return Promise.reject(new Error('Video recording is not supported in this browser'));

  const src = gl.domElement;
  const out = document.createElement('canvas');
  out.width = src.width - (src.width % 2);
  out.height = src.height - (src.height % 2);
  const ctx = out.getContext('2d')!;
  const stream = out.captureStream(30);
  const mime = ['video/webm;codecs=vp9', 'video/webm;codecs=vp8', 'video/webm'].find((m) => MediaRecorder.isTypeSupported(m));
  const recorder = new MediaRecorder(stream, { mimeType: mime, videoBitsPerSecond: 8_000_000 });
  const chunks: Blob[] = [];
  recorder.ondataavailable = (e) => e.data.size && chunks.push(e.data);

  const store = useStudio.getState();
  recordClock.start = performance.now();
  recordClock.duration = durationMs;
  recordClock.baseRotation = root.rotation.y;
  store.setRecording(true);

  let raf = 0;
  const draw = () => {
    const { background, customBackground } = useStudio.getState();
    ctx.clearRect(0, 0, out.width, out.height);
    paintBackground(ctx, out.width, out.height, background, customBackground);
    ctx.drawImage(src, 0, 0, out.width, out.height);
    raf = requestAnimationFrame(draw);
  };
  draw();
  recorder.start(250);

  return new Promise((resolve) => {
    setTimeout(() => {
      recorder.onstop = () => {
        cancelAnimationFrame(raf);
        useStudio.getState().setRecording(false);
        const url = URL.createObjectURL(new Blob(chunks, { type: 'video/webm' }));
        download(url, `${baseName()}_turntable.webm`);
        setTimeout(() => URL.revokeObjectURL(url), 5000);
        resolve();
      };
      recorder.stop();
    }, durationMs + 100);
  });
}
