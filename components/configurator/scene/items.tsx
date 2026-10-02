'use client';

import { memo, useEffect, useMemo, useState } from 'react';
import * as THREE from 'three';
import { ThreeEvent } from '@react-three/fiber';
import { buildDecalGeometry, designSize } from '@/lib/configurator/decal';
import { makeKnitNormalMap } from '@/lib/configurator/fabric';
import type { GarmentBuild } from '@/lib/configurator/garment-geometry';
import { disposeFilteredObject, makeFilteredObject, updateFilterUniforms } from '@/lib/configurator/model-edit';
import { accessoryLayout, interaction } from '@/lib/configurator/placement';
import { AccessoryItem, DesignItem, PrintFinish, StudioItem, useStudio } from '@/lib/configurator/store';
import { clayMaterial } from './GarmentMesh';

/** Select on press; start a surface drag unless the item is locked. */
function itemPointerHandlers(item: StudioItem) {
  return {
    onPointerDown: (e: ThreeEvent<PointerEvent>) => {
      if (e.button !== 0 || useStudio.getState().placingKey) return;
      e.stopPropagation();
      const store = useStudio.getState();
      store.select(item.id);
      if (item.locked) return;
      interaction.drag = { id: item.id, moved: false };
      store.setInteracting(true);
    },
    onClick: (e: ThreeEvent<MouseEvent>) => e.stopPropagation(),
    onPointerOver: () => (document.body.style.cursor = item.locked ? 'pointer' : 'grab'),
    onPointerOut: () => (document.body.style.cursor = ''),
  };
}

// ---------------------------------------------------------------------------
// Prints
// ---------------------------------------------------------------------------

function useImageTexture(src: string) {
  const [texture, setTexture] = useState<THREE.Texture | null>(null);
  useEffect(() => {
    let disposed = false;
    const t = new THREE.TextureLoader().load(src, () => !disposed && setTexture(t));
    t.colorSpace = THREE.SRGBColorSpace;
    t.anisotropy = 8;
    return () => {
      disposed = true;
      t.dispose();
    };
  }, [src]);
  return texture;
}

/** Knit size in meters: the print shows the fabric's knit through the ink. */
const KNIT_TILE_M = 0.006;
let knitBase: THREE.Texture | null = null;

/** Soft height map from the artwork's alpha, for raised (puff) prints. */
function alphaBumpMap(texture: THREE.Texture): THREE.Texture | null {
  const img = texture.image as HTMLImageElement | undefined;
  if (!img?.width) return null;
  const k = Math.min(1, 1024 / Math.max(img.width, img.height));
  const canvas = document.createElement('canvas');
  canvas.width = Math.round(img.width * k);
  canvas.height = Math.round(img.height * k);
  const ctx = canvas.getContext('2d')!;
  ctx.fillStyle = '#000';
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  ctx.filter = 'blur(3px) brightness(0) invert(1)';
  ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.NoColorSpace;
  return tex;
}

const FINISH: Record<PrintFinish, { roughness: number; metalness: number; knit: number; envMapIntensity: number }> = {
  dtg: { roughness: 0.92, metalness: 0, knit: 0.55, envMapIntensity: 1 },
  screen: { roughness: 0.7, metalness: 0, knit: 0.3, envMapIntensity: 1 },
  puff: { roughness: 0.85, metalness: 0, knit: 0, envMapIntensity: 1 },
  foil: { roughness: 0.22, metalness: 1, knit: 0.15, envMapIntensity: 1.8 },
  vinyl: { roughness: 0.32, metalness: 0, knit: 0.08, envMapIntensity: 1.2 },
};

export const DesignDecal = memo(function DesignDecal({ item, build }: { item: DesignItem; build: GarmentBuild }) {
  const texture = useImageTexture(item.src);
  const { position, normal, yaw, scale } = item.placement;

  const geometry = useMemo(
    () => buildDecalGeometry(build, { ...item.placement, position, normal, yaw, scale }, item.aspect),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [build, position, normal, yaw, scale, item.aspect],
  );
  useEffect(() => () => geometry.dispose(), [geometry]);

  const { w, h } = designSize(item.placement, item.aspect);
  const finish = item.finish ?? 'dtg';

  const material = useMemo(() => {
    if (!texture) return null;
    const f = FINISH[finish];
    const m = new THREE.MeshStandardMaterial({
      map: texture,
      transparent: true,
      depthWrite: false,
      polygonOffset: true,
      polygonOffsetFactor: -4,
      roughness: f.roughness,
      metalness: f.metalness,
      envMapIntensity: f.envMapIntensity,
    });
    if (finish === 'puff') {
      const bump = alphaBumpMap(texture);
      if (bump) {
        m.bumpMap = bump;
        m.bumpScale = 6;
      }
    } else if (f.knit > 0) {
      if (!knitBase) knitBase = makeKnitNormalMap(1);
      const knit = knitBase.clone();
      knit.needsUpdate = true;
      m.normalMap = knit;
      m.normalScale.set(f.knit, f.knit);
    }
    return m;
  }, [texture, finish]);

  // Keep the knit at its physical size as the print is resized.
  useEffect(() => {
    material?.normalMap?.repeat.set(w / KNIT_TILE_M, h / KNIT_TILE_M);
  }, [material, w, h]);

  useEffect(
    () => () => {
      material?.bumpMap?.dispose();
      material?.normalMap?.dispose();
      material?.dispose();
    },
    [material],
  );

  if (!material) return null;
  return (
    <mesh geometry={geometry} material={material} visible={item.visible} renderOrder={2} {...itemPointerHandlers(item)} />
  );
});

// ---------------------------------------------------------------------------
// 3D attachments
// ---------------------------------------------------------------------------

export const AccessoryNode = memo(function AccessoryNode({ item, build }: { item: AccessoryItem; build: GarmentBuild }) {
  const clay = useStudio((s) => s.viewMode === 'clay');
  const fit = useMemo(() => accessoryLayout(build, item), [build, item]);
  const asset = fit?.asset;
  const materialMode = item.filters.material;

  const object = useMemo(() => {
    if (!asset) return null;
    if (clay) {
      const copy = asset.object.clone(true);
      copy.traverse((o) => {
        const mesh = o as THREE.Mesh;
        if (mesh.isMesh) mesh.material = clayMaterial;
      });
      return copy;
    }
    return makeFilteredObject(asset.object, { ...item.filters, material: materialMode });
    // Filter values are pushed as uniforms below; only the material mode needs new clones.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [asset, clay, materialMode]);

  useEffect(() => {
    if (object) updateFilterUniforms(object, item.filters);
  }, [object, item.filters]);

  useEffect(() => () => {
    if (object && !clay) disposeFilteredObject(object);
  }, [object, clay]);

  if (!object || !fit) return null;
  return (
    <group
      position={fit.pose.position}
      quaternion={fit.pose.quaternion}
      scale={item.placement.scale}
      visible={item.visible}
      {...itemPointerHandlers(item)}
    >
      <group matrix={fit.layout.matrix} matrixAutoUpdate={false}>
        <primitive object={object} />
      </group>
    </group>
  );
});
