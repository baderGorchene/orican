'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import * as THREE from 'three';
import { ThreeEvent } from '@react-three/fiber';
import { getAsset } from '@/lib/configurator/assets';
import { getRibNormalMap, makeFabricMaterial, makeGarmentNormalMap, makeKnitNormalMap } from '@/lib/configurator/fabric';
import type { GarmentBuild } from '@/lib/configurator/garment-geometry';
import type { Garment3D } from '@/lib/configurator/garments';
import { interaction } from '@/lib/configurator/placement';
import { PrintInput, PrintLayer, printAtPoint } from '@/lib/configurator/print-layer';
import { requestPrintTexture, retainPrintTextures } from '@/lib/configurator/print-textures';
import { sceneRefs } from '@/lib/configurator/scene-refs';
import { DEFAULT_FILTERS, DEFAULT_TRANSFORM } from '@/lib/configurator/model-edit';
import { DEFAULT_CLEARANCE, DesignItem, newId, useStudio } from '@/lib/configurator/store';
import { interpolatedNormal, toVec3 } from '@/lib/configurator/surface';

const noRaycast = () => null;
const WHITE = new THREE.Color('#ffffff');

export const clayMaterial = new THREE.MeshStandardMaterial({ color: '#d9d9d9', roughness: 0.75, metalness: 0 });

/** Prints are projected inside the garment material, so they need the garment's own hit point to be picked. */
function useGarmentPrints(materials: THREE.MeshStandardMaterial[]) {
  const items = useStudio((s) => s.items);
  const designs = useMemo(() => items.filter((i): i is DesignItem => i.kind === 'design'), [items]);
  const layer = useMemo(() => new PrintLayer(), []);
  const [loadedVersion, setLoadedVersion] = useState(0);

  useEffect(() => {
    materials.forEach((m) => layer.attach(m));
    return () => materials.forEach((m) => layer.detach(m));
  }, [layer, materials]);

  useEffect(() => {
    const inputs: PrintInput[] = [];
    for (const item of designs) {
      const texture = requestPrintTexture(item.src, () => setLoadedVersion((v) => v + 1));
      if (texture) inputs.push({ item, texture });
    }
    layer.update(inputs);
  }, [layer, designs, loadedVersion]);

  // Free artwork no longer used by any print (undo history keeps srcs alive via the snapshots it restores).
  useEffect(() => {
    const keep = new Set<string>();
    const { past, future } = useStudio.getState();
    for (const snap of [{ items }, ...past, ...future]) {
      for (const i of snap.items) if (i.kind === 'design') keep.add(i.src);
    }
    retainPrintTextures(keep);
  }, [items]);

  return designs;
}

interface Props {
  garment: Garment3D;
  build: GarmentBuild;
  children?: React.ReactNode;
}

export function GarmentMesh({ garment, build, children }: Props) {
  const color = useStudio((s) => s.garmentColor);
  const viewMode = useStudio((s) => s.viewMode);

  const normalMap = useMemo(
    () => (garment.source === 'model' ? makeKnitNormalMap(garment.knitTile) : makeGarmentNormalMap(garment)),
    [garment],
  );
  const fabric = useMemo(
    () =>
      garment.source === 'model'
        ? makeFabricMaterial('#ffffff', normalMap, { vertexColors: false, doubleSided: true })
        : makeFabricMaterial('#ffffff', normalMap),
    [garment, normalMap],
  );
  // Procedural garments carry baked edge occlusion in vertex colors; model garments render double-sided.
  const clayBody = useMemo(
    () =>
      new THREE.MeshStandardMaterial({
        color: '#d9d9d9',
        roughness: 0.75,
        metalness: 0,
        vertexColors: garment.source === 'procedural',
        side: garment.source === 'model' ? THREE.DoubleSide : THREE.FrontSide,
      }),
    [garment],
  );
  const printMaterials = useMemo(() => [fabric, clayBody], [fabric, clayBody]);
  const designs = useGarmentPrints(printMaterials);
  const collarFabric = useMemo(() => {
    const m = makeFabricMaterial('#ffffff', getRibNormalMap());
    m.vertexColors = false;
    m.normalScale.set(0.8, 0.8);
    return m;
  }, []);

  useEffect(() => () => {
    normalMap.dispose();
    fabric.dispose();
    clayBody.dispose();
  }, [normalMap, fabric, clayBody]);

  useEffect(() => {
    fabric.color.set(color);
    collarFabric.color.set(color);
    // A pure-white sheen washes dark fabrics out to gray; tint it toward the garment color.
    for (const m of [fabric, collarFabric]) m.sheenColor.set(color).lerp(WHITE, 0.4);
  }, [color, fabric, collarFabric]);

  useEffect(() => {
    fabric.wireframe = viewMode === 'wireframe';
  }, [viewMode, fabric]);

  const bodyRef = useRef<THREE.Mesh>(null);

  const updateHover = (e: ThreeEvent<PointerEvent>) => {
    const root = sceneRefs.root;
    // Events can bubble up from children; always use the garment's own intersection.
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

  const onPointerDown = (e: ThreeEvent<PointerEvent>) => {
    const store = useStudio.getState();
    if (e.button !== 0 || store.placingKey || !updateHover(e)) return;
    const print = printAtPoint(designs, interaction.hover.point, interaction.hover.normal);
    if (!print) return;
    e.stopPropagation();
    store.select(print.id);
    if (print.locked) return;
    interaction.drag = { id: print.id, moved: false };
    store.setInteracting(true);
  };

  const onPointerMove = (e: ThreeEvent<PointerEvent>) => {
    if (!updateHover(e)) return;
    if (!interaction.drag && !useStudio.getState().placingKey) {
      const over = printAtPoint(designs, interaction.hover.point, interaction.hover.normal);
      document.body.style.cursor = over ? (over.locked ? 'pointer' : 'grab') : '';
    }
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
    if (!store.placingKey && updateHover(e as unknown as ThreeEvent<PointerEvent>)) {
      if (printAtPoint(designs, interaction.hover.point, interaction.hover.normal)) return; // selected on press
    }
    if (store.placingKey && updateHover(e as unknown as ThreeEvent<PointerEvent>)) {
      const asset = getAsset(store.placingKey);
      if (!asset) return;
      const keepPlacing = e.nativeEvent.shiftKey;
      store.addItem({
        id: newId(),
        kind: 'accessory',
        name: asset.name,
        assetKey: asset.key,
        transform: DEFAULT_TRANSFORM,
        filters: DEFAULT_FILTERS,
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
      // Uploaded models go straight into the model editor.
      if (!keepPlacing && asset.key.startsWith('upload:')) store.setAdvancedOpen(true);
      return;
    }
    store.select(null);
  };

  return (
    <>
      <mesh
        ref={bodyRef}
        geometry={build.body}
        material={viewMode === 'clay' ? clayBody : fabric}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerLeave={() => {
          interaction.hover.valid = false;
          if (!interaction.drag) document.body.style.cursor = '';
        }}
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
