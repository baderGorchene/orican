'use client';

import { useMemo, useRef } from 'react';
import * as THREE from 'three';
import { useFrame } from '@react-three/fiber';
import { getAsset } from '@/lib/configurator/assets';
import type { GarmentBuild } from '@/lib/configurator/garment-geometry';
import { interaction } from '@/lib/configurator/placement';
import { NO_EXPORT } from '@/lib/configurator/scene-refs';
import { DEFAULT_CLEARANCE, useStudio } from '@/lib/configurator/store';
import { fitAttachment, toVec3 } from '@/lib/configurator/surface';

const ghostMaterial = new THREE.MeshStandardMaterial({
  color: '#8f9cff',
  transparent: true,
  opacity: 0.55,
  depthWrite: false,
  metalness: 0.2,
  roughness: 0.4,
});

/** Semi-transparent preview of the asset being placed; snaps to the surface under the cursor. */
export function PlacementGhost({ build }: { build: GarmentBuild }) {
  const placingKey = useStudio((s) => s.placingKey);
  const group = useRef<THREE.Group>(null);
  const asset = placingKey ? getAsset(placingKey) : undefined;

  const object = useMemo(() => {
    if (!asset) return null;
    const copy = asset.object.clone(true);
    copy.traverse((o) => {
      const mesh = o as THREE.Mesh;
      if (mesh.isMesh) {
        mesh.material = ghostMaterial;
        mesh.raycast = () => null;
      }
    });
    return copy;
  }, [asset]);

  const reticleRadius = asset ? Math.max(asset.footprint.hx, asset.footprint.hy) * 1.35 + 0.004 : 0.01;

  useFrame(() => {
    const g = group.current;
    if (!g) return;
    const hover = interaction.hover;
    g.visible = hover.valid && !!asset;
    if (!g.visible || !asset) return;
    const pose = fitAttachment(
      build.bvh,
      build.body,
      { position: toVec3(hover.point), normal: toVec3(hover.normal), yaw: 0, scale: 1, offset: DEFAULT_CLEARANCE },
      asset.footprint,
    );
    g.position.copy(pose.position);
    // Smooth out normal jitter on curved/folded areas.
    if (g.userData.placed) g.quaternion.slerp(pose.quaternion, 0.35);
    else g.quaternion.copy(pose.quaternion);
    g.userData.placed = true;
  });

  if (!object) return null;
  return (
    <group ref={group} userData={{ [NO_EXPORT]: true }} visible={false}>
      <primitive object={object} />
      <mesh raycast={() => null} position={[0, 0, 0.0008]} renderOrder={5}>
        <ringGeometry args={[reticleRadius * 0.92, reticleRadius, 48]} />
        <meshBasicMaterial color="#ffffff" transparent opacity={0.85} depthTest={false} />
      </mesh>
    </group>
  );
}
