import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { DRACOLoader } from 'three/examples/jsm/loaders/DRACOLoader.js';
import { KTX2Loader } from 'three/examples/jsm/loaders/KTX2Loader.js';
import { MeshoptDecoder } from 'three/examples/jsm/libs/meshopt_decoder.module.js';
import { countTriangles, normalizeAttachment, registerAsset, AssetEntry } from './assets';

/**
 * Upload ingestion for user attachments (.glb / self-contained .gltf):
 * size + triangle limits, scene-graph stripping, transform baking,
 * texture downscaling, and normalization to the mounting convention.
 */

export const MAX_FILE_BYTES = 15 * 1024 * 1024;
export const MAX_TRIANGLES = 20_000;
export const MAX_TEXTURE_SIZE = 2048;
export const UPLOAD_TARGET_SIZE = 0.05; // 5 cm largest dimension

const DRACO_PATH = 'https://www.gstatic.com/draco/versioned/decoders/1.5.7/';
const BASIS_PATH = 'https://cdn.jsdelivr.net/npm/three@0.173.0/examples/jsm/libs/basis/';

export interface IngestResult {
  asset: AssetEntry;
  notices: string[];
}

export class IngestError extends Error {}

let loader: GLTFLoader | null = null;

function getLoader(renderer: THREE.WebGLRenderer): GLTFLoader {
  if (loader) return loader;
  loader = new GLTFLoader();
  loader.setDRACOLoader(new DRACOLoader().setDecoderPath(DRACO_PATH));
  loader.setKTX2Loader(new KTX2Loader().setTranscoderPath(BASIS_PATH).detectSupport(renderer));
  loader.setMeshoptDecoder(MeshoptDecoder);
  return loader;
}

function downscaleTexture(tex: THREE.Texture): boolean {
  const img = tex.image as { width?: number; height?: number } | undefined;
  if (!img?.width || !img.height) return false;
  const max = Math.max(img.width, img.height);
  if (max <= MAX_TEXTURE_SIZE) return false;
  const k = MAX_TEXTURE_SIZE / max;
  const canvas = document.createElement('canvas');
  canvas.width = Math.round(img.width * k);
  canvas.height = Math.round(img.height * k);
  canvas.getContext('2d')!.drawImage(tex.image as CanvasImageSource, 0, 0, canvas.width, canvas.height);
  tex.image = canvas;
  tex.needsUpdate = true;
  return true;
}

function assertSelfContainedGltf(buffer: ArrayBuffer) {
  let json: { buffers?: { uri?: string }[]; images?: { uri?: string }[] };
  try {
    json = JSON.parse(new TextDecoder().decode(buffer));
  } catch {
    throw new IngestError('This .gltf file is not valid JSON.');
  }
  const external = [...(json.buffers ?? []), ...(json.images ?? [])].some(
    (r) => r.uri && !r.uri.startsWith('data:'),
  );
  if (external) {
    throw new IngestError('This .gltf references external .bin/texture files. Export it as a single .glb instead.');
  }
}

export async function ingestModelFile(file: File, renderer: THREE.WebGLRenderer): Promise<IngestResult> {
  const ext = file.name.toLowerCase().split('.').pop();
  if (ext !== 'glb' && ext !== 'gltf') throw new IngestError('Only .glb and .gltf models are supported.');
  if (file.size > MAX_FILE_BYTES) {
    throw new IngestError(`File is ${(file.size / 1024 / 1024).toFixed(1)} MB; the limit is 15 MB.`);
  }

  const buffer = await file.arrayBuffer();
  if (ext === 'gltf') assertSelfContainedGltf(buffer);

  let gltf;
  try {
    gltf = await getLoader(renderer).parseAsync(buffer, '');
  } catch (err) {
    throw new IngestError(`Could not read this model (${err instanceof Error ? err.message : 'parse error'}).`);
  }

  const notices: string[] = [];
  let stripped = 0;
  let skinned = false;
  let downscaled = 0;
  gltf.scene.traverse((o) => {
    const obj = o as THREE.Object3D & { isLight?: boolean; isCamera?: boolean; isSkinnedMesh?: boolean };
    if (obj.isLight || obj.isCamera) stripped++;
    if (obj.isSkinnedMesh) skinned = true;
    const mesh = o as THREE.Mesh;
    if (!mesh.isMesh) return;
    const mats = Array.isArray(mesh.material) ? mesh.material : [mesh.material];
    for (const m of mats) {
      for (const value of Object.values(m)) {
        if (value instanceof THREE.Texture && downscaleTexture(value)) downscaled++;
      }
    }
  });
  if (stripped) notices.push(`Removed ${stripped} light/camera node${stripped > 1 ? 's' : ''}`);
  if (gltf.animations.length) notices.push(`Ignored ${gltf.animations.length} animation track${gltf.animations.length > 1 ? 's' : ''}`);
  if (skinned) notices.push('Skinned mesh frozen in its bind pose');
  if (downscaled) notices.push(`Downscaled ${downscaled} texture${downscaled > 1 ? 's' : ''} to ${MAX_TEXTURE_SIZE}px`);

  const triangles = countTriangles(gltf.scene);
  if (triangles === 0) throw new IngestError('This model contains no meshes.');
  if (triangles > MAX_TRIANGLES) {
    throw new IngestError(
      `${triangles.toLocaleString()} triangles exceeds the ${MAX_TRIANGLES.toLocaleString()} limit. Decimate the model and try again.`,
    );
  }

  const { group, notices: normNotices } = normalizeAttachment(gltf.scene, UPLOAD_TARGET_SIZE, { reorient: true });
  notices.push(...normNotices);

  const key = `upload:${crypto.randomUUID()}`;
  const name = file.name.replace(/\.(glb|gltf)$/i, '');
  return { asset: registerAsset(key, name, group), notices };
}
