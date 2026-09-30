'use client';

import '@/lib/configurator/bvh-setup';
import { useEffect, useRef, useState } from 'react';
import { Canvas } from '@react-three/fiber';
import { Expand, Shrink } from 'lucide-react';
import { getAsset } from '@/lib/configurator/assets';
import { backgroundCss, isDarkBackground } from '@/lib/configurator/backgrounds';
import { getGarment } from '@/lib/configurator/garments';
import { useStudio } from '@/lib/configurator/store';
import { StudioScene } from './scene/StudioScene';
import styles from './configurator.module.css';
import { useUploads } from './useUploads';

function StatusBar({ dark }: { dark: boolean }) {
  const garmentId = useStudio((s) => s.garmentId);
  const stats = useStudio((s) => s.stats);
  return (
    <div className={`${styles.statusBar} ${dark ? styles.statusDark : styles.statusLight}`}>
      <span>Garment: {getGarment(garmentId).name}</span>
      <span>Polycount: {(stats.triangles / 1000).toFixed(1)}k</span>
      <span>FPS: {stats.fps}</span>
    </div>
  );
}

function Toast() {
  const toast = useStudio((s) => s.toast);
  const [visible, setVisible] = useState(false);
  useEffect(() => {
    if (!toast) return;
    setVisible(true);
    const t = setTimeout(() => setVisible(false), Math.min(7000, 2200 + toast.message.length * 35));
    return () => clearTimeout(t);
  }, [toast]);
  if (!toast || !visible) return null;
  return (
    <div className={styles.toast} role="status">
      {toast.message}
    </div>
  );
}

function PlacingHint() {
  const placingKey = useStudio((s) => s.placingKey);
  if (!placingKey) return null;
  const asset = getAsset(placingKey);
  return (
    <div className={styles.hintPill}>
      Click the garment to place {asset?.name ?? 'the part'} · Shift-click to place several
      <button onClick={() => useStudio.getState().setPlacing(null)}>Cancel</button>
    </div>
  );
}

export function Viewport() {
  const container = useRef<HTMLDivElement>(null);
  const background = useStudio((s) => s.background);
  const customBackground = useStudio((s) => s.customBackground);
  const [fullscreen, setFullscreen] = useState(false);
  const [dragOver, setDragOver] = useState(false);
  const upload = useUploads();

  useEffect(() => {
    const onChange = () => setFullscreen(document.fullscreenElement === container.current);
    document.addEventListener('fullscreenchange', onChange);
    return () => document.removeEventListener('fullscreenchange', onChange);
  }, []);

  const toggleFullscreen = () => {
    if (document.fullscreenElement) document.exitFullscreen();
    else container.current?.requestFullscreen?.();
  };

  const dark = isDarkBackground(background, customBackground);

  return (
    <div
      ref={container}
      className={styles.viewport}
      style={{ background: backgroundCss(background, customBackground) }}
      onDragOver={(e) => {
        e.preventDefault();
        setDragOver(true);
      }}
      onDragLeave={() => setDragOver(false)}
      onDrop={(e) => {
        e.preventDefault();
        setDragOver(false);
        Array.from(e.dataTransfer.files).forEach((f) => upload(f));
      }}
    >
      <Canvas
        className={styles.canvas}
        dpr={[1, 2]}
        gl={{ preserveDrawingBuffer: true, antialias: true, alpha: true }}
        camera={{ fov: 30, near: 0.01, far: 50, position: [0, 0.04, 2.2] }}
        raycaster={{ firstHitOnly: true }}
        onPointerMissed={() => {
          const s = useStudio.getState();
          if (!s.placingKey) s.select(null);
        }}
      >
        <StudioScene />
      </Canvas>

      <button className={styles.iconBtn} onClick={toggleFullscreen} aria-label={fullscreen ? 'Exit fullscreen' : 'Fullscreen'}>
        {fullscreen ? <Shrink size={20} /> : <Expand size={20} />}
      </button>

      <PlacingHint />
      <StatusBar dark={dark} />
      <Toast />
      {dragOver && <div className={styles.dropOverlay}>Drop an image to print it, or a .glb to attach it</div>}
    </div>
  );
}
