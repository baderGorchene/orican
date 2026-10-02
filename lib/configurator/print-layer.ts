import * as THREE from 'three';
import { designSize } from './decal';
import type { DesignItem, PrintFinish } from './store';
import type { GarmentBuild } from './garment-geometry';
import { decalPose, raycastSurface } from './surface';

/**
 * Prints as part of the garment's own texture.
 *
 * Instead of separate decal meshes, every print is projected inside the
 * garment's fabric shader: each fragment's garment-local position is
 * transformed into each print's projector box and the artwork is blended into
 * the fabric's base color. The fabric's lighting, folds, vertex AO, sheen and
 * knit normal map therefore apply to the ink exactly as to the cloth. Finishes
 * adjust roughness / metalness / knit visibility / sheen / puff height under
 * the ink only.
 *
 * Which surface receives the ink is decided like a shadow map: each print
 * renders the garment's depth as seen from its projector into one tile of a
 * shared depth atlas, and a fragment is inked only if it is the first surface
 * along the projection. That covers deep folds and curved sides completely
 * (a thin projector box used to cut them off) while never bleeding through to
 * the back panel or surfaces hidden behind the front.
 */

const ATLAS_COLS = 4;
const ATLAS_ROWS = 2;
const TILE = 512;
export const MAX_PRINTS = ATLAS_COLS * ATLAS_ROWS;

/** Projector depth (meters): deep enough for any garment; occlusion picks the first surface. */
export const PROJECTOR_DEPTH = 0.6;
/** Depth tolerance (meters) for "is this the first surface", grown on steep walls in the shader. */
const DEPTH_BIAS = 0.004;

export interface FinishParams {
  roughness: number;
  metalness: number;
  /** Raised-ink height for puff prints (bump strength). */
  puff: number;
  /** 0 = fabric knit fully visible through the ink, 1 = ink is perfectly smooth. */
  smooth: number;
  /** How much of the fabric's sheen the ink removes. */
  sheenCut: number;
}

export const FINISHES: Record<PrintFinish, FinishParams> = {
  dtg: { roughness: 0.93, metalness: 0, puff: 0, smooth: 0.1, sheenCut: 0.55 },
  screen: { roughness: 0.7, metalness: 0, puff: 0, smooth: 0.45, sheenCut: 0.75 },
  puff: { roughness: 0.82, metalness: 0, puff: 1, smooth: 0.8, sheenCut: 0.85 },
  foil: { roughness: 0.22, metalness: 1, puff: 0, smooth: 0.7, sheenCut: 1 },
  vinyl: { roughness: 0.3, metalness: 0, puff: 0, smooth: 0.9, sheenCut: 1 },
};

interface Slot {
  map: { value: THREE.Texture | null };
  /** garment-local → projector box space ([-0.5, 0.5]³) */
  mat: { value: THREE.Matrix4 };
  dir: { value: THREE.Vector3 };
  /** roughness, metalness, puff, opacity */
  a: { value: THREE.Vector4 };
  /** smooth, sheenCut */
  b: { value: THREE.Vector4 };
  /** depth atlas tile: offset.xy, scale.zw (uv) */
  tile: { value: THREE.Vector4 };
}

export interface PrintInput {
  item: DesignItem;
  texture: THREE.Texture;
}

const PARS_VERTEX = /* glsl */ `
varying vec3 vPrintPos;
varying vec3 vPrintNormal;
`;

function parsFragment(n: number) {
  let s = `
varying vec3 vPrintPos;
varying vec3 vPrintNormal;
vec3 printPerturbNormal( vec3 surf_pos, vec3 surf_norm, vec2 dHdxy, float faceDir ) {
  vec3 vSigmaX = normalize( dFdx( surf_pos ) );
  vec3 vSigmaY = normalize( dFdy( surf_pos ) );
  vec3 R1 = cross( vSigmaY, surf_norm );
  vec3 R2 = cross( surf_norm, vSigmaX );
  float fDet = dot( vSigmaX, R1 ) * faceDir;
  vec3 vGrad = sign( fDet ) * ( dHdxy.x * R1 + dHdxy.y * R2 );
  return normalize( abs( fDet ) * surf_norm - vGrad );
}
`;
  s += 'uniform sampler2D uPrintDepth; uniform float uPrintBias;\n';
  for (let i = 0; i < n; i++) {
    s += `uniform sampler2D uPrintMap${i}; uniform mat4 uPrintMat${i}; uniform vec3 uPrintDir${i}; uniform vec4 uPrintA${i}; uniform vec4 uPrintB${i}; uniform vec4 uPrintTile${i};\n`;
  }
  return s;
}

function blendFragment(n: number) {
  // Branch-free so texture derivatives (mipmaps, puff bump) stay well defined.
  let s = `
float printMask = 0.0;
float printRough = 0.0;
float printMetal = 0.0;
float printSmooth = 0.0;
float printSheenCut = 0.0;
float printHeight = 0.0;
vec3 printN = normalize( vPrintNormal );
`;
  for (let i = 0; i < n; i++) {
    s += `
{
  vec3 pp = ( uPrintMat${i} * vec4( vPrintPos, 1.0 ) ).xyz;
  vec2 puv = pp.xy + 0.5;
  vec3 inside = step( abs( pp ), vec3( 0.5 ) );
  float nd = dot( printN, uPrintDir${i} );
  // first surface along the projection (projector sits at the box top, pp.z = +0.5)
  float surf = texture2D( uPrintDepth, uPrintTile${i}.xy + clamp( puv, 0.001, 0.999 ) * uPrintTile${i}.zw ).r;
  float visible = step( 0.5 - pp.z, surf + uPrintBias * ( 1.0 + 6.0 * ( 1.0 - clamp( nd, 0.0, 1.0 ) ) ) );
  float facing = smoothstep( -0.05, 0.05, nd ) * ( gl_FrontFacing ? 1.0 : 0.0 );
  vec4 ink = texture2D( uPrintMap${i}, puv );
  float a = ink.a * inside.x * inside.y * inside.z * visible * facing * uPrintA${i}.w;
  diffuseColor.rgb = mix( diffuseColor.rgb, ink.rgb, a );
  printRough = mix( printRough, uPrintA${i}.x, a );
  printMetal = mix( printMetal, uPrintA${i}.y, a );
  printSmooth = mix( printSmooth, uPrintB${i}.x, a );
  printSheenCut = mix( printSheenCut, uPrintB${i}.y, a );
  printHeight += a * uPrintA${i}.z;
  printMask = max( printMask, a );
}
`;
  }
  return s;
}

const ROUGHNESS = /* glsl */ `
roughnessFactor = mix( roughnessFactor, printRough, printMask );
`;
const METALNESS = /* glsl */ `
metalnessFactor = mix( metalnessFactor, printMetal, printMask );
`;
const NORMAL_BEFORE = /* glsl */ `
vec3 printBaseNormal = normal;
`;
const NORMAL_AFTER = /* glsl */ `
normal = normalize( mix( normal, printBaseNormal, printMask * printSmooth ) );
if ( printHeight > 0.0 ) {
  vec2 dH = vec2( dFdx( printHeight ), dFdy( printHeight ) ) * 1.6;
  normal = printPerturbNormal( - vViewPosition, normal, dH, faceDirection );
}
`;
const SHEEN = /* glsl */ `
#ifdef USE_SHEEN
material.sheenColor *= 1.0 - printMask * printSheenCut;
#endif
`;

export class PrintLayer {
  private slots: Slot[] = Array.from({ length: MAX_PRINTS }, () => ({
    map: { value: null },
    mat: { value: new THREE.Matrix4() },
    dir: { value: new THREE.Vector3(0, 0, 1) },
    a: { value: new THREE.Vector4() },
    b: { value: new THREE.Vector4() },
    tile: { value: new THREE.Vector4() },
  }));
  private count = 0;
  private materials = new Set<THREE.Material>();

  private atlas = new THREE.WebGLRenderTarget(TILE * ATLAS_COLS, TILE * ATLAS_ROWS, {
    depthBuffer: true,
    depthTexture: new THREE.DepthTexture(TILE * ATLAS_COLS, TILE * ATLAS_ROWS),
  });
  private depthUniform = { value: this.atlas.depthTexture };
  private biasUniform = { value: DEPTH_BIAS / PROJECTOR_DEPTH };
  private depthScene = new THREE.Scene();
  private depthMesh = new THREE.Mesh(
    undefined,
    new THREE.MeshBasicMaterial({ side: THREE.DoubleSide, colorWrite: false }),
  );
  private depthCamera = new THREE.OrthographicCamera(-0.5, 0.5, 0.5, -0.5, 0, PROJECTOR_DEPTH);
  /** What each atlas tile currently holds, to skip re-rendering unchanged prints. */
  private tileKeys: string[] = [];
  private placed: { item: DesignItem; key: string }[] = [];

  constructor() {
    this.atlas.depthTexture!.minFilter = THREE.NearestFilter;
    this.atlas.depthTexture!.magFilter = THREE.NearestFilter;
    this.depthScene.add(this.depthMesh);
    this.depthScene.matrixWorldAutoUpdate = true;
    this.slots.forEach((slot, i) => {
      const col = i % ATLAS_COLS;
      const row = Math.floor(i / ATLAS_COLS);
      slot.tile.value.set(col / ATLAS_COLS, row / ATLAS_ROWS, 1 / ATLAS_COLS, 1 / ATLAS_ROWS);
    });
  }

  /** Installs the print projection into a MeshStandard/MeshPhysical material. */
  attach(material: THREE.MeshStandardMaterial) {
    this.materials.add(material);
    material.onBeforeCompile = (shader) => {
      const n = this.count;
      shader.uniforms.uPrintDepth = this.depthUniform;
      shader.uniforms.uPrintBias = this.biasUniform;
      for (let i = 0; i < n; i++) {
        const slot = this.slots[i];
        shader.uniforms[`uPrintTile${i}`] = slot.tile;
        shader.uniforms[`uPrintMap${i}`] = slot.map;
        shader.uniforms[`uPrintMat${i}`] = slot.mat;
        shader.uniforms[`uPrintDir${i}`] = slot.dir;
        shader.uniforms[`uPrintA${i}`] = slot.a;
        shader.uniforms[`uPrintB${i}`] = slot.b;
      }
      shader.vertexShader = shader.vertexShader
        .replace('#include <common>', `#include <common>\n${PARS_VERTEX}`)
        .replace('#include <beginnormal_vertex>', '#include <beginnormal_vertex>\nvPrintNormal = objectNormal;')
        .replace('#include <begin_vertex>', '#include <begin_vertex>\nvPrintPos = transformed;');
      if (n === 0) return;
      shader.fragmentShader = shader.fragmentShader
        .replace('#include <common>', `#include <common>\n${parsFragment(n)}`)
        .replace('#include <map_fragment>', `#include <map_fragment>\n${blendFragment(n)}`)
        .replace('#include <roughnessmap_fragment>', `#include <roughnessmap_fragment>\n${ROUGHNESS}`)
        .replace('#include <metalnessmap_fragment>', `#include <metalnessmap_fragment>\n${METALNESS}`)
        .replace('#include <normal_fragment_maps>', `${NORMAL_BEFORE}\n#include <normal_fragment_maps>\n${NORMAL_AFTER}`)
        .replace('#include <lights_physical_fragment>', `#include <lights_physical_fragment>\n${SHEEN}`);
    };
    material.customProgramCacheKey = () => `orican-prints-${this.count}`;
    material.needsUpdate = true;
  }

  detach(material: THREE.Material) {
    this.materials.delete(material);
  }

  /** Updates the projected prints (bottom → top). Recompiles only when the print count changes. */
  update(prints: PrintInput[]) {
    const list = prints.slice(-MAX_PRINTS);
    this.placed = list.map(({ item }) => ({
      item,
      key: JSON.stringify([item.placement.position, item.placement.normal, item.placement.yaw, item.placement.scale, item.aspect]),
    }));
    list.forEach(({ item, texture }, i) => {
      const slot = this.slots[i];
      const { w, h } = designSize(item.placement, item.aspect);
      const { position, quaternion } = decalPose(item.placement);
      slot.mat.value
        .compose(position, quaternion, new THREE.Vector3(w, h, PROJECTOR_DEPTH))
        .invert();
      slot.dir.value.set(...item.placement.normal).normalize();
      slot.map.value = texture;
      const f = FINISHES[item.finish ?? 'dtg'];
      slot.a.value.set(f.roughness, f.metalness, f.puff, item.visible ? 1 : 0);
      slot.b.value.set(f.smooth, f.sheenCut, 0, 0);
    });
    if (list.length !== this.count) {
      this.count = list.length;
      this.materials.forEach((m) => (m.needsUpdate = true));
    }
  }

  /**
   * Renders each changed print's view of the garment into its depth-atlas tile
   * (garment-local space, so the turntable rotation doesn't matter).
   */
  renderDepth(gl: THREE.WebGLRenderer, geometry: THREE.BufferGeometry) {
    if (this.depthMesh.geometry !== geometry) {
      this.depthMesh.geometry = geometry;
      this.tileKeys = [];
    }
    const prevTarget = gl.getRenderTarget();
    const prevAutoClear = gl.autoClear;
    gl.autoClear = true;
    let rendered = false;
    this.placed.forEach(({ item, key }, i) => {
      if (this.tileKeys[i] === key) return;
      this.tileKeys[i] = key;
      const { w, h } = designSize(item.placement, item.aspect);
      const { position, quaternion } = decalPose(item.placement);
      const cam = this.depthCamera;
      cam.left = -w / 2;
      cam.right = w / 2;
      cam.top = h / 2;
      cam.bottom = -h / 2;
      cam.updateProjectionMatrix();
      const n = new THREE.Vector3(...item.placement.normal).normalize();
      cam.position.copy(position).addScaledVector(n, PROJECTOR_DEPTH / 2);
      cam.quaternion.copy(quaternion);
      cam.updateMatrixWorld(true);
      const x = (i % ATLAS_COLS) * TILE;
      const y = Math.floor(i / ATLAS_COLS) * TILE;
      this.atlas.viewport.set(x, y, TILE, TILE);
      this.atlas.scissor.set(x, y, TILE, TILE);
      this.atlas.scissorTest = true;
      gl.setRenderTarget(this.atlas);
      gl.render(this.depthScene, cam);
      rendered = true;
    });
    if (rendered) gl.setRenderTarget(prevTarget);
    gl.autoClear = prevAutoClear;
  }

  dispose() {
    this.atlas.depthTexture?.dispose();
    this.atlas.dispose();
    (this.depthMesh.material as THREE.Material).dispose();
  }
}

/**
 * CPU twin of the shader's projection: the topmost visible print whose
 * projector rectangle contains `point` (garment-local) and for which `point`
 * is the first garment surface along the projection.
 */
export function printAtPoint(
  designs: DesignItem[],
  point: THREE.Vector3,
  normal: THREE.Vector3,
  build: GarmentBuild,
): DesignItem | null {
  const inv = new THREE.Matrix4();
  const p = new THREE.Vector3();
  for (let i = designs.length - 1; i >= 0; i--) {
    const item = designs[i];
    if (!item.visible) continue;
    const dir = new THREE.Vector3(...item.placement.normal).normalize();
    if (dir.dot(normal) < -0.05) continue;
    const { w, h } = designSize(item.placement, item.aspect);
    const { position, quaternion } = decalPose(item.placement);
    inv.compose(position, quaternion, new THREE.Vector3(w, h, PROJECTOR_DEPTH)).invert();
    p.copy(point).applyMatrix4(inv);
    if (Math.abs(p.x) > 0.5 || Math.abs(p.y) > 0.5 || Math.abs(p.z) > 0.5) continue;
    // Is `point` the first surface the projector hits at this spot?
    const origin = point.clone().addScaledVector(dir, (0.5 - p.z) * PROJECTOR_DEPTH);
    const hit = raycastSurface(build.bvh, build.body, origin, dir.clone().negate(), PROJECTOR_DEPTH);
    if (hit && hit.point.distanceTo(point) < 0.01) return item;
  }
  return null;
}
