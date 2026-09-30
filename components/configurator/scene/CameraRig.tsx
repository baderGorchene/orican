'use client';

import { useEffect, useRef } from 'react';
import * as THREE from 'three';
import { useFrame, useThree } from '@react-three/fiber';
import { OrbitControls } from '@react-three/drei';
import type { OrbitControls as OrbitControlsImpl } from 'three-stdlib';
import { CameraView, useStudio } from '@/lib/configurator/store';

const TARGET = new THREE.Vector3(0, 0.035, 0);

const VIEW_DIRS: Record<CameraView, [number, number, number]> = {
  front: [0, 0.04, 1],
  back: [0, 0.04, -1],
  left: [1, 0.04, 0],
  right: [-1, 0.04, 0],
  'three-quarter': [0.72, 0.12, 0.72],
};

/** Orbit controls + framing, view presets and camera animation. */
export function CameraRig({ garmentSize }: { garmentSize: THREE.Vector3 }) {
  const controls = useRef<OrbitControlsImpl>(null);
  const { camera, size } = useThree();
  const interacting = useStudio((s) => s.interacting);
  const cameraMotion = useStudio((s) => s.cameraMotion);
  const cameraRequest = useStudio((s) => s.cameraRequest);
  const flight = useRef<{ to: THREE.Vector3 } | null>(null);
  const sweepT = useRef(0);

  const fitDistance = () => {
    const cam = camera as THREE.PerspectiveCamera;
    const vFov = THREE.MathUtils.degToRad(cam.fov);
    const hFov = 2 * Math.atan(Math.tan(vFov / 2) * (size.width / Math.max(1, size.height)));
    const byHeight = (garmentSize.y * 0.5 * 1.62) / Math.tan(vFov / 2);
    const byWidth = (garmentSize.x * 0.5 * 1.45) / Math.tan(hFov / 2);
    return Math.max(byHeight, byWidth) + garmentSize.z / 2;
  };

  const flyTo = (view: CameraView) => {
    const dir = new THREE.Vector3(...VIEW_DIRS[view]).normalize();
    flight.current = { to: dir.multiplyScalar(fitDistance()).add(TARGET) };
  };

  // Re-frame when the garment or viewport changes
  useEffect(() => {
    flyTo('front');
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [garmentSize.x, garmentSize.y, size.width, size.height]);

  useEffect(() => {
    if (cameraRequest) flyTo(cameraRequest.view);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [cameraRequest]);

  useFrame((_, dt) => {
    const c = controls.current;
    if (!c) return;
    if (flight.current) {
      const k = 1 - Math.pow(0.001, dt);
      camera.position.lerp(flight.current.to, k);
      c.target.lerp(TARGET, k);
      if (camera.position.distanceTo(flight.current.to) < 0.002) flight.current = null;
    } else if (cameraMotion === 'sweep') {
      sweepT.current += dt;
      const r = Math.hypot(camera.position.x, camera.position.z);
      const a = Math.sin(sweepT.current * 0.45) * 0.65;
      camera.position.x = Math.sin(a) * r;
      camera.position.z = Math.cos(a) * r;
    }
    c.update();
  });

  return (
    <OrbitControls
      ref={controls}
      makeDefault
      enabled={!interacting}
      enableDamping
      dampingFactor={0.08}
      autoRotate={cameraMotion === 'orbit'}
      autoRotateSpeed={1.2}
      minDistance={0.35}
      maxDistance={4}
      minPolarAngle={Math.PI * 0.18}
      maxPolarAngle={Math.PI * 0.82}
      onStart={() => (flight.current = null)}
    />
  );
}
