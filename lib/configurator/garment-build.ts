import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { MeshoptDecoder } from 'three/examples/jsm/libs/meshopt_decoder.module.js';
import { mergeGeometries } from 'three/examples/jsm/utils/BufferGeometryUtils.js';
import { MeshBVH } from 'three-mesh-bvh';
import type { GarmentBuild } from './garment-geometry';
import { buildGarmentGeometry } from './garment-geometry';
import type { Garment3D, ModelGarment } from './garments';

/**
 * Resolves a garment to a GarmentBuild. Model garments load a prepared .glb
 * (see public/models/README.md) into the same shape the procedural generator
 * produces: one merged, centered
 * body geometry in garment-local meters with a BVH. Builds are cached per
 * garment, so switching back and forth doesn't reload or rebuild.
 */

let loader: GLTFLoader | null = null;
function getLoader() {
  if (!loader) loader = new GLTFLoader().setMeshoptDecoder(MeshoptDecoder);
  return loader;
}

/** Quantized (KHR_mesh_quantization) attributes can't be transformed in place; expand to Float32. */
function toFloat32(attr: THREE.BufferAttribute | THREE.InterleavedBufferAttribute): THREE.BufferAttribute {
  const { count, itemSize } = attr;
  const out = new Float32Array(count * itemSize);
  for (let i = 0; i < count; i++) {
    for (let c = 0; c < itemSize; c++) out[i * itemSize + c] = attr.getComponent(i, c);
  }
  return new THREE.BufferAttribute(out, itemSize);
}

async function loadModelGarment(g: ModelGarment): Promise<GarmentBuild> {
  const gltf = await getLoader().loadAsync(g.url);
  gltf.scene.updateMatrixWorld(true);

  const parts: THREE.BufferGeometry[] = [];
  gltf.scene.traverse((o) => {
    const mesh = o as THREE.Mesh;
    if (!mesh.isMesh) return;
    const src = mesh.geometry;
    const geo = new THREE.BufferGeometry();
    for (const name of ['position', 'normal', 'uv']) {
      const attr = src.getAttribute(name);
      if (attr) geo.setAttribute(name, toFloat32(attr));
    }
    geo.setIndex(src.index ? Array.from(src.index.array) : null);
    geo.applyMatrix4(mesh.matrixWorld);
    parts.push(geo);
  });
  if (!parts.length) throw new Error(`${g.url} contains no meshes`);

  const body = parts.length === 1 ? parts[0] : mergeGeometries(parts, false);
  if (!body) throw new Error(`${g.url}: meshes have incompatible attributes`);
  if (!body.getAttribute('normal')) body.computeVertexNormals();
  body.normalizeNormals();

  body.computeBoundingBox();
  const center = body.boundingBox!.getCenter(new THREE.Vector3());
  body.translate(-center.x, -center.y, -center.z);
  body.computeBoundingBox();
  body.computeBoundingSphere();

  const bvh = new MeshBVH(body);
  body.boundsTree = bvh;

  return {
    body,
    collar: null,
    bvh,
    toLocal: (x, y) => new THREE.Vector2(x, y), // model hotspots are already in local meters
    triangles: (body.index ? body.index.count : body.attributes.position.count) / 3,
    size: body.boundingBox!.getSize(new THREE.Vector3()),
  };
}

const cache = new Map<string, Promise<GarmentBuild>>();

export function loadGarmentBuild(g: Garment3D): Promise<GarmentBuild> {
  let build = cache.get(g.id);
  if (!build) {
    build = g.source === 'model' ? loadModelGarment(g) : Promise.resolve().then(() => buildGarmentGeometry(g));
    build.catch(() => cache.delete(g.id));
    cache.set(g.id, build);
  }
  return build;
}
