'use client';

import { memo, useEffect, useMemo } from 'react';
import * as THREE from 'three';
import { ThreeEvent } from '@react-three/fiber';
import type { GarmentBuild } from '@/lib/configurator/garment-geometry';
import { disposeFilteredObject, makeFilteredObject, updateFilterUniforms } from '@/lib/configurator/model-edit';
import { accessoryLayout, interaction } from '@/lib/configurator/placement';
import { AccessoryItem, StudioItem, useStudio } from '@/lib/configurator/store';
import { clayMaterial } from './GarmentMesh';

/** Select on press; start a surface drag unless the item is locked. (Prints are picked in GarmentMesh.) */
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
