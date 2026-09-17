'use client';

import React, { useEffect, useRef } from 'react';
import { Box, Image as ImageIcon, Sparkles } from 'lucide-react';
import { ShirtViewerInstance } from '@/lib/types';
import { createShirtViewer } from '@/lib/three-shirt-engine';
import { parseOBJ } from '@/lib/obj-parser';

interface ThreeViewerProps {
  colorHex: string;
  onViewerReady: (viewer: ShirtViewerInstance) => void;
  onToast: (msg: string) => void;
  onModelLoaded: (name: string) => void;
  onTextureLoaded: (name: string) => void;
}

export const ThreeViewer: React.FC<ThreeViewerProps> = ({
  colorHex,
  onViewerReady,
  onToast,
  onModelLoaded,
  onTextureLoaded,
}) => {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const viewerRef = useRef<ShirtViewerInstance | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const textureInputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    if (!canvasRef.current || !containerRef.current) return;

    const viewer = createShirtViewer(canvasRef.current, {
      color: colorHex,
      exportable: true,
      maskContainer: containerRef.current,
    });

    viewerRef.current = viewer;
    onViewerReady(viewer);

    return () => {
      viewer.destroy();
      viewerRef.current = null;
    };
  }, []);

  // Sync color changes from props
  useEffect(() => {
    viewerRef.current?.setColor(colorHex);
  }, [colorHex]);

  // Load OBJ File
  const handleOBJUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const text = event.target?.result as string;
        const result = parseOBJ(text);
        viewerRef.current?.setDesignGeometry(result.geometry.clone());
        onModelLoaded(file.name);
        onToast(`3D model "${file.name}" placed on proof`);
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : 'Invalid 3D OBJ file';
        onToast(`Could not read .obj file: ${msg}`);
      }
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  // Load Sample 3D Model
  const handleLoadSample = async () => {
    try {
      const res = await fetch('/samples/sample-diamond.obj');
      if (!res.ok) throw new Error('Sample model file not found');
      const text = await res.text();
      const result = parseOBJ(text);
      viewerRef.current?.setDesignGeometry(result.geometry.clone(), '#6592C5');
      onModelLoaded('ORICAN Star Crest (Sample)');
      onToast('Sample 3D crest placed on proof');
    } catch (err: unknown) {
      onToast('Could not load sample 3D model.');
    }
  };

  // Load Texture Image
  const handleTextureUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const img = new Image();
    img.onload = () => {
      viewerRef.current?.setDesignTexture(img);
      onTextureLoaded(file.name);
      onToast(`Texture "${file.name}" mapped onto 3D design`);
    };
    img.onerror = () => {
      onToast("Couldn't decode that image format");
    };
    img.src = URL.createObjectURL(file);
    e.target.value = '';
  };

  return (
    <div ref={containerRef} className="studio-viewport" style={{ position: 'relative' }}>
      {/* Quick Action Floating Controls */}
      <div className="corner-actions">
        {/* Upload OBJ */}
        <button
          className="corner-btn"
          title="Upload your 3D design (.obj)"
          onClick={() => fileInputRef.current?.click()}
          aria-label="Upload 3D OBJ file"
        >
          <Box size={20} />
        </button>
        <input
          ref={fileInputRef}
          type="file"
          accept=".obj"
          style={{ display: 'none' }}
          onChange={handleOBJUpload}
        />

        {/* Upload Texture */}
        <button
          className="corner-btn secondary"
          title="Map texture image onto design"
          onClick={() => textureInputRef.current?.click()}
          aria-label="Map image texture"
        >
          <ImageIcon size={20} />
        </button>
        <input
          ref={textureInputRef}
          type="file"
          accept="image/*"
          style={{ display: 'none' }}
          onChange={handleTextureUpload}
        />

        {/* Load Sample Model */}
        <button
          className="corner-btn secondary"
          title="Load pre-built sample 3D design"
          onClick={handleLoadSample}
          aria-label="Load sample 3D model"
          style={{ background: '#F0EEE6', borderColor: '#6592C5' }}
        >
          <Sparkles size={18} color="#6592C5" />
        </button>
      </div>

      <canvas ref={canvasRef} id="main-studio-canvas" />

      <div className="viewport-hint">
        Drag design to rotate &bull; Middle-drag to pan &bull; Blue tint highlights print boundary
      </div>
    </div>
  );
};
