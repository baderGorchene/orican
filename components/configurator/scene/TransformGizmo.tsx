'use client';

import { useMemo } from 'react';
import * as THREE from 'three';
import { ThreeEvent, useThree } from '@react-three/fiber';
import { designSize } from '@/lib/configurator/decal';
import type { GarmentBuild } from '@/lib/configurator/garment-geometry';
import { accessoryLayout } from '@/lib/configurator/placement';
import { NO_EXPORT, sceneRefs } from '@/lib/configurator/scene-refs';
import { ACCESSORY_SCALE_RANGE, DESIGN_SCALE_RANGE, StudioItem, useStudio } from '@/lib/configurator/store';
import { decalPose, fitAttachment, surfaceFrame } from '@/lib/configurator/surface';

const ACCENT = '#5B5BD6';
const noRaycast = () => null;

/**
 * On-canvas handles for the selected item: drag the ring to yaw around the
 * surface normal, drag the knob to scale uniformly (clamped).
 */
export function TransformGizmo({ item, build }: { item: StudioItem; build: GarmentBuild }) {
  const { camera, gl } = useThree();

  const layout = useMemo(() => {
    const p = item.placement;
    if (item.kind === 'design') {
      const { w, h } = designSize(p, item.aspect);
      return { pose: decalPose(p), radius: Math.hypot(w, h) / 2 + 0.01, rect: { w, h } };
    }
    const fit = accessoryLayout(build, item);
    const fp = fit?.layout.footprint ?? { hx: 0.01, hy: 0.01 };
    const pose = fit?.pose ?? fitAttachment(build.bvh, build.body, p, { hx: fp.hx * p.scale, hy: fp.hy * p.scale });
    return { pose, radius: Math.max(fp.hx, fp.hy) * p.scale * 1.4 + 0.006, rect: null };
  }, [item, build]);

  const tube = Math.max(0.0009, layout.radius * 0.022);

  const rectLine = useMemo(() => {
    if (!layout.rect) return null;
    const { w, h } = layout.rect;
    const g = new THREE.BufferGeometry().setFromPoints([
      new THREE.Vector3(-w / 2, -h / 2, 0),
      new THREE.Vector3(w / 2, -h / 2, 0),
      new THREE.Vector3(w / 2, h / 2, 0),
      new THREE.Vector3(-w / 2, h / 2, 0),
    ]);
    return new THREE.LineLoop(g, new THREE.LineDashedMaterial({ color: '#ffffff', dashSize: 0.006, gapSize: 0.004, depthTest: false, transparent: true, opacity: 0.8 }));
  }, [layout.rect]);
  if (rectLine) rectLine.computeLineDistances();

  const startDrag = (mode: 'yaw' | 'scale') => (e: ThreeEvent<PointerEvent>) => {
    if (e.button !== 0) return;
    e.stopPropagation();
    const root = sceneRefs.root;
    if (!root) return;
    const store = useStudio.getState();
    store.checkpoint();
    store.setInteracting(true);

    const start = item.placement;
    const n = new THREE.Vector3(...start.normal).normalize();
    const frame = surfaceFrame(n, 0);
    const toWorld = new THREE.Quaternion().setFromRotationMatrix(root.matrixWorld);
    const axisX = new THREE.Vector3(1, 0, 0).applyQuaternion(frame).applyQuaternion(toWorld);
    const axisY = new THREE.Vector3(0, 1, 0).applyQuaternion(frame).applyQuaternion(toWorld);
    const center = root.localToWorld(layout.pose.position.clone());
    const plane = new THREE.Plane().setFromNormalAndCoplanarPoint(n.clone().applyQuaternion(toWorld), center);
    const raycaster = new THREE.Raycaster();
    const hit = new THREE.Vector3();

    const project = (clientX: number, clientY: number) => {
      const rect = gl.domElement.getBoundingClientRect();
      const ndc = new THREE.Vector2(((clientX - rect.left) / rect.width) * 2 - 1, -((clientY - rect.top) / rect.height) * 2 + 1);
      raycaster.setFromCamera(ndc, camera);
      if (!raycaster.ray.intersectPlane(plane, hit)) return null;
      const v = hit.clone().sub(center);
      return { angle: Math.atan2(v.dot(axisY), v.dot(axisX)), dist: v.length() };
    };

    const first = project(e.nativeEvent.clientX, e.nativeEvent.clientY);
    if (!first) return;
    const range = item.kind === 'design' ? DESIGN_SCALE_RANGE : ACCESSORY_SCALE_RANGE;

    const onMove = (ev: PointerEvent) => {
      const cur = project(ev.clientX, ev.clientY);
      if (!cur) return;
      if (mode === 'yaw') {
        const tau = Math.PI * 2;
        const yaw = (((start.yaw + cur.angle - first.angle) % tau) + tau) % tau;
        useStudio.getState().updatePlacement(item.id, { yaw });
      } else {
        const scale = THREE.MathUtils.clamp((start.scale * cur.dist) / Math.max(1e-4, first.dist), range[0], range[1]);
        useStudio.getState().updatePlacement(item.id, { scale });
      }
    };
    const onUp = () => {
      window.removeEventListener('pointermove', onMove);
      window.removeEventListener('pointerup', onUp);
      useStudio.getState().setInteracting(false);
    };
    window.addEventListener('pointermove', onMove);
    window.addEventListener('pointerup', onUp);
  };

  const cursor = (c: string) => () => (document.body.style.cursor = c);

  return (
    <group
      position={layout.pose.position.clone().add(new THREE.Vector3(...item.placement.normal).multiplyScalar(0.003))}
      quaternion={layout.pose.quaternion}
      userData={{ [NO_EXPORT]: true }}
    >
      <mesh renderOrder={10} raycast={noRaycast}>
        <torusGeometry args={[layout.radius, tube, 8, 96]} />
        <meshBasicMaterial color={ACCENT} depthTest={false} transparent opacity={0.95} />
      </mesh>
      {/* wider invisible grab area for the ring */}
      <mesh onPointerDown={startDrag('yaw')} onPointerOver={cursor('alias')} onPointerOut={cursor('')}>
        <torusGeometry args={[layout.radius, tube * 5, 6, 64]} />
        <meshBasicMaterial transparent opacity={0} depthWrite={false} />
      </mesh>
      {/* "up" tick so the rotation reads at a glance */}
      <mesh position={[0, layout.radius, 0]} renderOrder={11} raycast={noRaycast}>
        <circleGeometry args={[tube * 2.2, 16]} />
        <meshBasicMaterial color="#ffffff" depthTest={false} transparent />
      </mesh>
      <mesh
        position={[layout.radius * Math.SQRT1_2, -layout.radius * Math.SQRT1_2, 0]}
        renderOrder={11}
        onPointerDown={startDrag('scale')}
        onPointerOver={cursor('nwse-resize')}
        onPointerOut={cursor('')}
      >
        <circleGeometry args={[tube * 4.5, 24]} />
        <meshBasicMaterial color="#ffffff" depthTest={false} transparent />
      </mesh>
      {rectLine && <primitive object={rectLine} raycast={noRaycast} renderOrder={10} />}
    </group>
  );
}
