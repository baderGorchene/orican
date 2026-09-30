'use client';

import { useEffect, useMemo, useRef } from 'react';
import * as THREE from 'three';
import { useFrame, useThree } from '@react-three/fiber';
import { Environment, Lightformer } from '@react-three/drei';
import { recordClock } from '@/lib/configurator/export';
import { buildGarmentGeometry } from '@/lib/configurator/garment-geometry';
import { getGarment } from '@/lib/configurator/garments';
import { interaction, resnapItems } from '@/lib/configurator/placement';
import { sceneRefs } from '@/lib/configurator/scene-refs';
import { useStudio } from '@/lib/configurator/store';
import { CameraRig } from './CameraRig';
import { GarmentMesh } from './GarmentMesh';
import { AccessoryNode, DesignDecal } from './items';
import { PlacementGhost } from './PlacementGhost';
import { TransformGizmo } from './TransformGizmo';

function StudioLights() {
  return (
    <>
      <ambientLight intensity={0.08} />
      <directionalLight position={[-2.4, 2.2, 2.6]} intensity={2.8} />
      <directionalLight position={[2.6, 1.2, -2]} intensity={1.1} />
      <directionalLight position={[1.8, -0.6, 2]} intensity={0.25} />
      <Environment resolution={256} frames={1} environmentIntensity={0.7}>
        <Lightformer form="rect" intensity={2.2} position={[-3, 2, 3]} scale={[4, 5, 1]} target={[0, 0, 0]} />
        <Lightformer form="rect" intensity={1.1} position={[3, 1, 2.5]} scale={[3, 5, 1]} target={[0, 0, 0]} />
        <Lightformer form="rect" intensity={0.8} position={[0, 3, -3]} scale={[6, 2, 1]} target={[0, 0, 0]} />
        <Lightformer form="rect" intensity={0.35} position={[0, -3, 1]} scale={[6, 6, 1]} target={[0, 0, 0]} />
      </Environment>
    </>
  );
}

/** Reports FPS and rendered triangles to the status bar twice a second. */
function StatsProbe() {
  const acc = useRef({ frames: 0, time: 0 });
  const { gl } = useThree();
  useFrame((_, dt) => {
    acc.current.frames++;
    acc.current.time += dt;
    if (acc.current.time >= 0.5) {
      useStudio.getState().setStats({
        fps: Math.round(acc.current.frames / acc.current.time),
        triangles: gl.info.render.triangles,
      });
      acc.current = { frames: 0, time: 0 };
    }
  });
  return null;
}

export function StudioScene() {
  const { gl, scene, camera } = useThree();
  const garmentId = useStudio((s) => s.garmentId);
  const items = useStudio((s) => s.items);
  const selectedId = useStudio((s) => s.selectedId);
  const recording = useStudio((s) => s.recording);
  const placing = useStudio((s) => s.placingKey !== null);
  const root = useRef<THREE.Group>(null);

  const garment = getGarment(garmentId);
  const build = useMemo(() => buildGarmentGeometry(garment), [garment]);

  useEffect(() => {
    sceneRefs.gl = gl;
    sceneRefs.scene = scene;
    sceneRefs.camera = camera;
  }, [gl, scene, camera]);

  useEffect(() => {
    sceneRefs.root = root.current;
    sceneRefs.garment = build;
    resnapItems();
    return () => {
      build.body.dispose();
      build.collar?.dispose();
    };
  }, [build]);

  // End item drags even when the pointer is released off the garment.
  useEffect(() => {
    const onUp = () => {
      if (!interaction.drag) return;
      interaction.drag = null;
      useStudio.getState().setInteracting(false);
    };
    window.addEventListener('pointerup', onUp);
    return () => window.removeEventListener('pointerup', onUp);
  }, []);

  useFrame((_, dt) => {
    const g = root.current;
    if (!g) return;
    const s = useStudio.getState();
    if (s.recording) {
      const t = Math.min(1, (performance.now() - recordClock.start) / recordClock.duration);
      g.rotation.y = recordClock.baseRotation + t * Math.PI * 2;
    } else if (s.turntable.enabled && !s.interacting) {
      g.rotation.y += dt * s.turntable.speed;
    }
  });

  const selected = items.find((i) => i.id === selectedId);

  return (
    <>
      <StudioLights />
      <group ref={root}>
        <GarmentMesh garment={garment} build={build}>
          {items.map((item) => (item.kind === 'design' ? <DesignDecal key={item.id} item={item} build={build} /> : null))}
        </GarmentMesh>
        {items.map((item) => (item.kind === 'accessory' ? <AccessoryNode key={item.id} item={item} build={build} /> : null))}
        <PlacementGhost build={build} />
        {selected && selected.visible && !selected.locked && !recording && !placing && <TransformGizmo item={selected} build={build} />}
      </group>
      <CameraRig garmentSize={build.size} />
      <StatsProbe />
    </>
  );
}
