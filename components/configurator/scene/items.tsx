'use client';

import { memo, useEffect, useMemo, useState } from 'react';
import * as THREE from 'three';
import { ThreeEvent } from '@react-three/fiber';
import { getAsset } from '@/lib/configurator/assets';
import { buildDecalGeometry } from '@/lib/configurator/decal';
import type { GarmentBuild } from '@/lib/configurator/garment-geometry';
import { interaction } from '@/lib/configurator/placement';
import { AccessoryItem, DesignItem, StudioItem, useStudio } from '@/lib/configurator/store';
import { fitAttachment } from '@/lib/configurator/surface';
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

export const DesignDecal = memo(function DesignDecal({ item, build }: { item: DesignItem; build: GarmentBuild }) {
  const texture = useImageTexture(item.src);
  const { position, normal, yaw, scale } = item.placement;

  const geometry = useMemo(
    () => buildDecalGeometry(build, { ...item.placement, position, normal, yaw, scale }, item.aspect),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [build, position, normal, yaw, scale, item.aspect],
  );
  useEffect(() => () => geometry.dispose(), [geometry]);

  const material = useMemo(
    () =>
      texture &&
      new THREE.MeshStandardMaterial({
        map: texture,
        transparent: true,
        depthWrite: false,
        polygonOffset: true,
        polygonOffsetFactor: -4,
        roughness: 0.82,
        metalness: 0,
      }),
    [texture],
  );
  useEffect(() => () => material?.dispose(), [material]);

  if (!material) return null;
  return (
    <mesh geometry={geometry} material={material} visible={item.visible} renderOrder={2} {...itemPointerHandlers(item)} />
  );
});

// ---------------------------------------------------------------------------

function cloneAsset(source: THREE.Object3D, clay: boolean): THREE.Object3D {
  const copy = source.clone(true);
  if (clay) {
    copy.traverse((o) => {
      const mesh = o as THREE.Mesh;
      if (mesh.isMesh) mesh.material = clayMaterial;
    });
  }
  return copy;
}

export const AccessoryNode = memo(function AccessoryNode({ item, build }: { item: AccessoryItem; build: GarmentBuild }) {
  const clay = useStudio((s) => s.viewMode === 'clay');
  const asset = getAsset(item.assetKey);
  const object = useMemo(() => (asset ? cloneAsset(asset.object, clay) : null), [asset, clay]);

  const pose = useMemo(() => {
    if (!asset) return null;
    const { hx, hy } = asset.footprint;
    const s = item.placement.scale;
    return fitAttachment(build.bvh, build.body, item.placement, { hx: hx * s, hy: hy * s });
  }, [asset, build, item.placement]);

  if (!object || !pose) return null;
  return (
    <group
      position={pose.position}
      quaternion={pose.quaternion}
      scale={item.placement.scale}
      visible={item.visible}
      {...itemPointerHandlers(item)}
    >
      <primitive object={object} />
    </group>
  );
});
