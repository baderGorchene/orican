'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import * as THREE from 'three';
import { GarmentColor, GarmentModel, ShirtViewerInstance } from '@/lib/types';
import { createGarmentViewer } from '@/lib/three-shirt-engine';
import { parseOBJ } from '@/lib/obj-parser';

interface UseGarmentViewerOptions {
  initialColor: GarmentColor;
  initialModel: GarmentModel;
}

export function useGarmentViewer({ initialColor, initialModel }: UseGarmentViewerOptions) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const viewerRef = useRef<ShirtViewerInstance | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const textureInputRef = useRef<HTMLInputElement | null>(null);

  const [loadedModelName, setLoadedModelName] = useState<string | null>(null);
  const [loadedTextureName, setLoadedTextureName] = useState<string | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [isExporting, setIsExporting] = useState(false);
  const [scaleValue, setScaleValue] = useState(50);

  // Toast helper
  const showToast = useCallback((msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage((current) => (current === msg ? null : current));
    }, 2400);
  }, []);

  // Initialize WebGL viewer once refs are ready
  useEffect(() => {
    if (!canvasRef.current || !containerRef.current) return;

    const viewer = createGarmentViewer(canvasRef.current, {
      color: initialColor.hex,
      model: initialModel,
      exportable: true,
      maskContainer: containerRef.current,
    });

    viewerRef.current = viewer;

    // Load sample diamond mesh by default
    fetch('/samples/sample-diamond.obj')
      .then((res) => (res.ok ? res.text() : Promise.reject()))
      .then((objText) => {
        const parsed = parseOBJ(objText);
        viewer.setDesignGeometry(parsed.geometry, '#DD0072');
        setLoadedModelName('Diamond Crest Mesh');
      })
      .catch(() => {
        const fallbackGeo = new THREE.OctahedronGeometry(0.8, 0);
        viewer.setDesignGeometry(fallbackGeo, '#DD0072');
        setLoadedModelName('Geometric Crest');
      });

    return () => {
      viewer.destroy();
      viewerRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // --- Viewer Controls ---
  const handleColorSelect = useCallback((color: GarmentColor) => {
    viewerRef.current?.setColor(color.hex);
  }, []);

  const handleModelSelect = useCallback((model: GarmentModel) => {
    viewerRef.current?.setGarmentModel?.(model);
  }, []);

  const handleScaleChange = useCallback((val: number) => {
    setScaleValue(val);
    viewerRef.current?.setDesignSize(val / 100);
  }, []);

  const handleMove = useCallback((dx: number, dy: number) => {
    viewerRef.current?.moveDesign(dx, dy);
  }, []);

  const handleResetPosition = useCallback(() => {
    viewerRef.current?.resetPosition();
    setScaleValue(50);
    viewerRef.current?.setDesignSize(0.5);
    showToast('Reset position to center');
  }, [showToast]);

  // --- File Uploads ---
  const handleOBJUpload = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (!file) return;
      const reader = new FileReader();
      reader.onload = (event) => {
        try {
          const text = event.target?.result as string;
          const parsed = parseOBJ(text);
          viewerRef.current?.setDesignGeometry(parsed.geometry, '#6592C5');
          setLoadedModelName(file.name);
          showToast(`Loaded 3D Mesh: ${file.name}`);
        } catch {
          showToast('Error parsing .OBJ mesh');
        }
      };
      reader.readAsText(file);
      e.target.value = '';
    },
    [showToast],
  );

  const handleTextureUpload = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (!file) return;
      const reader = new FileReader();
      reader.onload = (event) => {
        const img = new Image();
        img.onload = () => {
          viewerRef.current?.setDesignTexture(img);
          setLoadedTextureName(file.name);
          showToast(`Applied Texture: ${file.name}`);
        };
        img.src = event.target?.result as string;
      };
      reader.readAsDataURL(file);
      e.target.value = '';
    },
    [showToast],
  );

  // --- Exports ---
  const handleExportMockup = useCallback(
    (modelId: string) => {
      if (!viewerRef.current) return;
      setIsExporting(true);
      setTimeout(() => {
        try {
          const url = viewerRef.current!.exportMockupJPG();
          const a = document.createElement('a');
          a.href = url;
          a.download = `ORICAN_${modelId}_mockup.jpg`;
          a.click();
          showToast('3D Composite Mockup Downloaded');
        } catch {
          showToast('Failed to export mockup');
        } finally {
          setIsExporting(false);
        }
      }, 100);
    },
    [showToast],
  );

  const handleExportPrintFile = useCallback(
    (modelId: string) => {
      if (!viewerRef.current) return;
      setIsExporting(true);
      setTimeout(() => {
        try {
          const url = viewerRef.current!.exportPrintFileCrop();
          const a = document.createElement('a');
          a.href = url;
          a.download = `ORICAN_${modelId}_print_rip.png`;
          a.click();
          showToast('Lossless Print RIP File Downloaded');
        } catch {
          showToast('Failed to export print file');
        } finally {
          setIsExporting(false);
        }
      }, 100);
    },
    [showToast],
  );

  return {
    // DOM refs
    canvasRef,
    containerRef,
    fileInputRef,
    textureInputRef,
    // State
    loadedModelName,
    loadedTextureName,
    toastMessage,
    isExporting,
    scaleValue,
    // Handlers
    showToast,
    handleColorSelect,
    handleModelSelect,
    handleScaleChange,
    handleMove,
    handleResetPosition,
    handleOBJUpload,
    handleTextureUpload,
    handleExportMockup,
    handleExportPrintFile,
  };
}
