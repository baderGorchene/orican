'use client';

import { useEffect, useMemo, useRef } from 'react';
import * as THREE from 'three';
import { ThreeEvent } from '@react-three/fiber';
import { getAsset } from '@/lib/configurator/assets';
import { getRibNormalMap, makeFabricMaterial, makeGarmentNormalMap } from '@/lib/configurator/fabric';
import type { GarmentBuild } from '@/lib/configurator/garment-geometry';
import type { Garment3D } from '@/lib/configurator/garments';
import { interaction } from '@/lib/configurator/placement';
import { sceneRefs } from '@/lib/configurator/scene-refs';
import { DEFAULT_CLEARANCE, newId, useStudio } from '@/lib/configurator/store';
import { interpolatedNormal, toVec3 } from '@/lib/configurator/surface';

const noRaycast = () => null;

export const clayMaterial = new THREE.MeshStandardMaterial({ color: '#d9d9d9', roughness: 0.75, metalness: 0 });
const clayBodyMaterial = new THREE.MeshStandardMaterial({ color: '#d9d9d9', roughness: 0.75, metalness: 0, vertexColors: true });

interface Props {
  garment: Garment3D;
  build: GarmentBuild;
  children?: React.ReactNode;
}

export function GarmentMesh({ garment, build, children }: Props) {
  const color = useStudio((s) => s.garmentColor);
  const viewMode = useStudio((s) => s.viewMode);

  const normalMap = useMemo(() => makeGarmentNormalMap(garment), [garment]);
  const fabric = useMemo(() => makeFabricMaterial('#ffffff', normalMap), [normalMap]);
  const collarFabric = useMemo(() => {
    const m = makeFabricMaterial('#ffffff', getRibNormalMap());
    m.vertexColors = false;
    m.normalScale.set(0.8, 0.8);
    return m;
  }, []);

  useEffect(() => () => {
    normalMap.dispose();
    fabric.dispose();
  }, [normalMap, fabric]);

  useEffect(() => {
    fabric.color.set(color);
    collarFabric.color.set(color);
  }, [color, fabric, collarFabric]);

  useEffect(() => {
    fabric.wireframe = viewMode === 'wireframe';
  }, [viewMode, fabric]);

  const bodyRef = useRef<THREE.Mesh>(null);

  const updateHover = (e: ThreeEvent<PointerEvent>) => {
    const root = sceneRefs.root;
    // Events bubble up from child decals; always use the garment's own intersection.
    const hit = e.object === bodyRef.current ? e : e.intersections.find((i) => i.object === bodyRef.current);
    if (!root || !hit?.face) {
      interaction.hover.valid = false;
      return false;
    }
    const local = root.worldToLocal(hit.point.clone());
    interaction.hover.valid = true;
    interaction.hover.point.copy(local);
    interpolatedNormal(build.body, hit.face, local, interaction.hover.normal);
    return true;
  };

  const onPointerMove = (e: ThreeEvent<PointerEvent>) => {
    if (!updateHover(e)) return;
    const drag = interaction.drag;
    if (drag) {
      const store = useStudio.getState();
      if (!drag.moved) {
        store.checkpoint();
        drag.moved = true;
      }
      store.updatePlacement(drag.id, {
        position: toVec3(interaction.hover.point),
        normal: toVec3(interaction.hover.normal),
      });
    }
  };

  const onClick = (e: ThreeEvent<MouseEvent>) => {
    if (e.delta > 4) return; // it was an orbit drag
    const store = useStudio.getState();
    if (store.placingKey && updateHover(e as unknown as ThreeEvent<PointerEvent>)) {
      const asset = getAsset(store.placingKey);
      if (!asset) return;
      const keepPlacing = e.nativeEvent.shiftKey;
      store.addItem({
        id: newId(),
        kind: 'accessory',
        name: asset.name,
        assetKey: asset.key,
        visible: true,
        locked: false,
        placement: {
          position: toVec3(interaction.hover.point),
          normal: toVec3(interaction.hover.normal),
          yaw: 0,
          scale: 1,
          offset: DEFAULT_CLEARANCE,
        },
      }, !keepPlacing);
      if (!keepPlacing) store.setPlacing(null);
      return;
    }
    store.select(null);
  };

  return (
    <>
      <mesh
        ref={bodyRef}
        geometry={build.body}
        material={viewMode === 'clay' ? clayBodyMaterial : fabric}
        onPointerMove={onPointerMove}
        onPointerLeave={() => (interaction.hover.valid = false)}
        onClick={onClick}
      >
        {children}
      </mesh>
      {build.collar && (
        <mesh geometry={build.collar} material={viewMode === 'clay' ? clayMaterial : collarFabric} raycast={noRaycast} />
      )}
    </>
  );
}
