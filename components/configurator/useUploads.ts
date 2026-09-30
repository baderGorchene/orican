'use client';

import { useCallback } from 'react';
import { IngestError, ingestModelFile } from '@/lib/configurator/ingest';
import { defaultSpot } from '@/lib/configurator/placement';
import { sceneRefs } from '@/lib/configurator/scene-refs';
import { newId, useStudio } from '@/lib/configurator/store';

export const UPLOAD_ACCEPT = 'image/png,image/jpeg,image/webp,image/svg+xml,.glb,.gltf';
const MAX_IMAGE_BYTES = 20 * 1024 * 1024;
const MAX_IMAGE_EDGE = 2048;

/** Decodes an image (incl. SVG without intrinsic size) and re-encodes it as a PNG ≤ 2048px. */
async function rasterizeImage(file: File): Promise<{ src: string; aspect: number }> {
  const url = URL.createObjectURL(file);
  try {
    const img = new Image();
    img.decoding = 'async';
    img.src = url;
    await img.decode();
    const w0 = img.naturalWidth || 1024;
    const h0 = img.naturalHeight || 1024;
    const k = Math.min(1, MAX_IMAGE_EDGE / Math.max(w0, h0));
    const canvas = document.createElement('canvas');
    canvas.width = Math.max(1, Math.round(w0 * k));
    canvas.height = Math.max(1, Math.round(h0 * k));
    canvas.getContext('2d')!.drawImage(img, 0, 0, canvas.width, canvas.height);
    return { src: canvas.toDataURL('image/png'), aspect: canvas.width / canvas.height };
  } finally {
    URL.revokeObjectURL(url);
  }
}

export function useUploads() {
  return useCallback(async (file: File) => {
    const store = useStudio.getState();
    const name = file.name.toLowerCase();

    if (name.endsWith('.glb') || name.endsWith('.gltf')) {
      if (!sceneRefs.gl) return;
      store.showToast(`Checking ${file.name}…`);
      try {
        const { asset, notices } = await ingestModelFile(file, sceneRefs.gl);
        useStudio.getState().setPlacing(asset.key);
        useStudio
          .getState()
          .showToast(
            `${asset.name}: ${asset.triangles.toLocaleString()} triangles. ${notices.length ? notices.join(' · ') + '. ' : ''}Click the garment to place it.`,
          );
      } catch (err) {
        useStudio.getState().showToast(err instanceof IngestError ? err.message : 'Could not load this model.');
      }
      return;
    }

    if (!file.type.startsWith('image/')) {
      store.showToast('Upload a PNG, JPG, WebP or SVG design, or a .glb/.gltf model.');
      return;
    }
    if (file.size > MAX_IMAGE_BYTES) {
      store.showToast('Images must be under 20 MB.');
      return;
    }
    try {
      const { src, aspect } = await rasterizeImage(file);
      const spot = defaultSpot();
      useStudio.getState().addItem({
        id: newId(),
        kind: 'design',
        name: file.name,
        src,
        aspect,
        visible: true,
        locked: false,
        placement: { ...spot, yaw: 0, scale: 1, offset: 0 },
      });
      useStudio.getState().showToast('Design placed. Drag it to move; use the ring to rotate and the knob to scale.');
    } catch {
      useStudio.getState().showToast('Could not read this image.');
    }
  }, []);
}
