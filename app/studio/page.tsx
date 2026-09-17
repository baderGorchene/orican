'use client';

import React, { useEffect, useRef, useState, useMemo } from 'react';
import Link from 'next/link';
import * as THREE from 'three';
import {
  ArrowLeft,
  Box,
  CheckCircle2,
  ChevronRight,
  Download,
  FileImage,
  FolderOpen,
  Info,
  Maximize2,
  Move,
  RefreshCcw,
  RotateCcw,
  Search,
  Share2,
  ShieldCheck,
  Sliders,
  Sparkles,
  Upload,
} from 'lucide-react';
import {
  GARMENT_MODELS,
  PRINT_FEE,
  STANDARD_COLORS,
} from '@/lib/constants';
import {
  GarmentCategory,
  GarmentColor,
  GarmentModel,
  GarmentSize,
  ModelTier,
  ShirtViewerInstance,
} from '@/lib/types';
import { createGarmentViewer } from '@/lib/three-shirt-engine';
import { parseOBJ } from '@/lib/obj-parser';

export default function StudioPage() {
  // Active Garment State
  const [selectedModel, setSelectedModel] = useState<GarmentModel>(GARMENT_MODELS[0]);
  const [selectedColor, setSelectedColor] = useState<GarmentColor>(STANDARD_COLORS[0]);
  const [selectedSize, setSelectedSize] = useState<GarmentSize>('L');
  const [printTechnique, setPrintTechnique] = useState<'dtg' | 'screen' | 'embroidery'>('dtg');

  // Filter States
  const [searchQuery, setSearchQuery] = useState('');
  const [tierFilter, setTierFilter] = useState<'all' | ModelTier>('all');
  const [categoryFilter, setCategoryFilter] = useState<'all' | GarmentCategory>('all');

  // Viewer and Design State
  const [scaleValue, setScaleValue] = useState(50);
  const [loadedModelName, setLoadedModelName] = useState<string | null>(null);
  const [loadedTextureName, setLoadedTextureName] = useState<string | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [isExporting, setIsExporting] = useState(false);

  // References
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const viewerRef = useRef<ShirtViewerInstance | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const textureInputRef = useRef<HTMLInputElement | null>(null);

  // Toast Helper
  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage((current) => (current === msg ? null : current));
    }, 2400);
  };

  // Preload garment model and color from URL parameters if launched from Landing Page
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const params = new URLSearchParams(window.location.search);
    const modelParam = params.get('model');
    const colorParam = params.get('color');

    if (modelParam) {
      const found = GARMENT_MODELS.find((m) => m.id === modelParam);
      if (found) {
        setSelectedModel(found);
        viewerRef.current?.setGarmentModel?.(found);
      }
    }
    if (colorParam) {
      const foundColor = STANDARD_COLORS.find(
        (c) => c.hex.toLowerCase() === colorParam.toLowerCase()
      );
      if (foundColor) {
        setSelectedColor(foundColor);
        viewerRef.current?.setColor(foundColor.hex);
      }
    }
  }, []);

  // Initialize WebGL Garment Viewer
  useEffect(() => {
    if (!canvasRef.current || !containerRef.current) return;

    const viewer = createGarmentViewer(canvasRef.current, {
      color: selectedColor.hex,
      model: selectedModel,
      exportable: true,
      maskContainer: containerRef.current,
    });

    viewerRef.current = viewer;

    // Load sample diamond mesh by default for instant feedback
    fetch('/samples/sample-diamond.obj')
      .then((res) => (res.ok ? res.text() : Promise.reject()))
      .then((objText) => {
        const parsed = parseOBJ(objText);
        viewer.setDesignGeometry(parsed.geometry, '#DD0072');
        setLoadedModelName('Diamond Crest Mesh');
      })
      .catch(() => {
        // Fallback procedural geometry if sample file missing
        const fallbackGeo = new THREE.OctahedronGeometry(0.8, 0);
        viewer.setDesignGeometry(fallbackGeo, '#DD0072');
        setLoadedModelName('Geometric Crest');
      });

    return () => {
      viewer.destroy();
      viewerRef.current = null;
    };
  }, []);

  // Update Color
  const handleColorSelect = (color: GarmentColor) => {
    setSelectedColor(color);
    viewerRef.current?.setColor(color.hex);
  };

  // Switch Garment Model
  const handleModelSelect = (model: GarmentModel) => {
    setSelectedModel(model);
    viewerRef.current?.setGarmentModel?.(model);
    showToast(`Loaded ${model.name}`);
  };

  // Scale Adjustment
  const handleScaleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = parseInt(e.target.value, 10);
    setScaleValue(val);
    viewerRef.current?.setDesignSize(val / 100);
  };

  // Move Design via D-Pad
  const handleMove = (dx: number, dy: number) => {
    viewerRef.current?.moveDesign(dx, dy);
  };

  // Reset Design Position
  const handleResetPosition = () => {
    viewerRef.current?.resetPosition();
    setScaleValue(50);
    viewerRef.current?.setDesignSize(0.5);
    showToast('Reset position to center');
  };

  // Handle OBJ Mesh Upload
  const handleOBJUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
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
  };

  // Handle Texture Upload
  const handleTextureUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
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
  };

  // Export Mockup JPG
  const handleExportMockup = () => {
    if (!viewerRef.current) return;
    setIsExporting(true);
    setTimeout(() => {
      try {
        const url = viewerRef.current!.exportMockupJPG();
        const a = document.createElement('a');
        a.href = url;
        a.download = `ORICAN_${selectedModel.id}_mockup.jpg`;
        a.click();
        showToast('3D Composite Mockup Downloaded');
      } catch {
        showToast('Failed to export mockup');
      } finally {
        setIsExporting(false);
      }
    }, 100);
  };

  // Export Print Crop PNG
  const handleExportPrintFile = () => {
    if (!viewerRef.current) return;
    setIsExporting(true);
    setTimeout(() => {
      try {
        const url = viewerRef.current!.exportPrintFileCrop();
        const a = document.createElement('a');
        a.href = url;
        a.download = `ORICAN_${selectedModel.id}_print_rip.png`;
        a.click();
        showToast('Lossless Print RIP File Downloaded');
      } catch {
        showToast('Failed to export print file');
      } finally {
        setIsExporting(false);
      }
    }, 100);
  };

  // Filtered 3D Models
  const filteredModels = useMemo(() => {
    return GARMENT_MODELS.filter((model) => {
      const matchesSearch =
        model.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        model.tags.some((tag) => tag.toLowerCase().includes(searchQuery.toLowerCase()));
      const matchesTier = tierFilter === 'all' || model.tier === tierFilter;
      const matchesCategory = categoryFilter === 'all' || model.category === categoryFilter;
      return matchesSearch && matchesTier && matchesCategory;
    });
  }, [searchQuery, tierFilter, categoryFilter]);

  // Pricing Calculation
  const blankCost = selectedModel.blankPrice;
  const licenseCost = selectedModel.price;
  const printCost = PRINT_FEE;
  const totalCost = (blankCost + licenseCost + printCost).toFixed(2);

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        width: '100vw',
        height: '100vh',
        overflow: 'hidden',
        background: '#F0EEE6',
        color: '#242C47',
        fontFamily: 'var(--font-sans)',
      }}
    >
      {/* Hidden File Inputs */}
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleOBJUpload}
        accept=".obj"
        style={{ display: 'none' }}
      />
      <input
        type="file"
        ref={textureInputRef}
        onChange={handleTextureUpload}
        accept="image/*"
        style={{ display: 'none' }}
      />

      {/* TOP WORKSTATION NAVIGATION BAR */}
      <header
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '12px 24px',
          borderBottom: '1.5px solid rgba(101, 146, 197, 0.25)',
          background: 'rgba(240, 238, 230, 0.94)',
          backdropFilter: 'blur(16px)',
          WebkitBackdropFilter: 'blur(16px)',
          zIndex: 30,
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
          <Link
            href="/"
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '8px',
              color: '#242C47',
              textDecoration: 'none',
              fontSize: '13px',
              fontWeight: 600,
              padding: '6px 14px',
              borderRadius: '999px',
              border: '1px solid rgba(101, 146, 197, 0.3)',
              background: '#FFFFFF',
              transition: 'all 0.2s ease',
            }}
          >
            <ArrowLeft size={14} />
            <span>Overview</span>
          </Link>

          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span
              style={{
                fontFamily: 'var(--font-title)',
                fontSize: '18px',
                fontWeight: 400,
                color: '#242C47',
                letterSpacing: '0.02em',
              }}
            >
              ORICAN
            </span>
            <span style={{ color: '#6592C5', fontSize: '13px', fontWeight: 600 }}>/</span>
            <span style={{ fontSize: '13px', fontWeight: 700, color: '#242C47' }}>
              3D PROOFING STUDIO
            </span>
            <span
              style={{
                fontSize: '10px',
                padding: '2px 8px',
                borderRadius: '999px',
                background: selectedModel.tier === 'paid' ? 'rgba(221, 0, 114, 0.12)' : 'rgba(101, 146, 197, 0.15)',
                color: selectedModel.tier === 'paid' ? '#DD0072' : '#6592C5',
                fontWeight: 700,
                letterSpacing: '0.04em',
              }}
            >
              {selectedModel.badge || selectedModel.tier.toUpperCase()}
            </span>
          </div>
        </div>

        {/* Live Calculation Pill & Actions */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '12px',
              padding: '6px 16px',
              borderRadius: '999px',
              background: '#FFFFFF',
              border: '1.5px solid rgba(101, 146, 197, 0.3)',
              fontSize: '13px',
            }}
          >
            <span style={{ color: '#55627F' }}>Press Proof Total:</span>
            <span style={{ fontWeight: 800, color: '#242C47', fontSize: '15px' }}>${totalCost}</span>
          </div>

          <button
            onClick={handleExportMockup}
            disabled={isExporting}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '8px',
              padding: '8px 18px',
              borderRadius: '999px',
              background: '#FFFFFF',
              border: '1.5px solid #242C47',
              color: '#242C47',
              fontSize: '13px',
              fontWeight: 600,
              cursor: 'pointer',
              transition: 'all 0.2s ease',
            }}
          >
            <Download size={14} />
            <span>Export Mockup</span>
          </button>

          <button
            onClick={handleExportPrintFile}
            disabled={isExporting}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '8px',
              padding: '8px 20px',
              borderRadius: '999px',
              background: '#242C47',
              border: '1.5px solid #242C47',
              color: '#F0EEE6',
              fontSize: '13px',
              fontWeight: 600,
              cursor: 'pointer',
              boxShadow: '0 4px 14px rgba(36, 44, 71, 0.18)',
              transition: 'all 0.2s ease',
            }}
          >
            <Sparkles size={14} color="#6592C5" />
            <span>RIP Print File (PNG)</span>
          </button>
        </div>
      </header>

      {/* MAIN 3-COLUMN WORKSTATION BODY */}
      <div style={{ display: 'grid', gridTemplateColumns: '360px 1fr 340px', flex: 1, overflow: 'hidden' }}>
        {/* LEFT PANEL: 3D MODEL ASSET MARKETPLACE */}
        <aside
          style={{
            display: 'flex',
            flexDirection: 'column',
            borderRight: '1.5px solid rgba(101, 146, 197, 0.22)',
            background: 'rgba(240, 238, 230, 0.75)',
            backdropFilter: 'blur(16px)',
            overflow: 'hidden',
          }}
        >
          {/* Marketplace Header & Search */}
          <div style={{ padding: '18px 20px 14px', borderBottom: '1px solid rgba(101, 146, 197, 0.18)' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
              <span style={{ fontSize: '11px', color: '#6592C5', fontWeight: 700, letterSpacing: '0.06em' }}>
                3D GARMENT LIBRARY
              </span>
              <span style={{ fontSize: '11px', color: '#55627F', fontWeight: 600 }}>
                {filteredModels.length} Models
              </span>
            </div>

            {/* Search Input */}
            <div style={{ position: 'relative', marginBottom: '12px' }}>
              <Search size={14} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#6592C5' }} />
              <input
                type="text"
                placeholder="Search models, cuts, fabric..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                style={{
                  width: '100%',
                  padding: '8px 12px 8px 34px',
                  borderRadius: '8px',
                  border: '1.5px solid rgba(101, 146, 197, 0.3)',
                  background: '#FFFFFF',
                  color: '#242C47',
                  fontSize: '12px',
                  outline: 'none',
                }}
              />
            </div>

            {/* Tier Tabs: All / Base / Community / Paid */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '4px', background: 'rgba(101, 146, 197, 0.12)', padding: '3px', borderRadius: '8px' }}>
              {(['all', 'base', 'community', 'paid'] as const).map((tier) => (
                <button
                  key={tier}
                  onClick={() => setTierFilter(tier)}
                  style={{
                    padding: '6px 0',
                    fontSize: '11px',
                    fontWeight: 600,
                    textTransform: 'capitalize',
                    border: 'none',
                    borderRadius: '6px',
                    cursor: 'pointer',
                    background: tierFilter === tier ? '#FFFFFF' : 'transparent',
                    color: tierFilter === tier ? '#242C47' : '#55627F',
                    boxShadow: tierFilter === tier ? '0 2px 6px rgba(36,44,71,0.08)' : 'none',
                    transition: 'all 0.15s ease',
                  }}
                >
                  {tier === 'all' ? 'All' : tier}
                </button>
              ))}
            </div>

            {/* Category Filter Pills: Tops / Bottoms / Outerwear */}
            <div style={{ display: 'flex', gap: '6px', marginTop: '10px' }}>
              {(['all', 'tops', 'bottoms', 'outerwear'] as const).map((cat) => (
                <button
                  key={cat}
                  onClick={() => setCategoryFilter(cat)}
                  style={{
                    padding: '4px 10px',
                    fontSize: '10.5px',
                    fontWeight: 600,
                    textTransform: 'capitalize',
                    borderRadius: '999px',
                    border: '1px solid',
                    borderColor: categoryFilter === cat ? '#6592C5' : 'rgba(101, 146, 197, 0.25)',
                    background: categoryFilter === cat ? 'rgba(101, 146, 197, 0.16)' : '#FFFFFF',
                    color: categoryFilter === cat ? '#242C47' : '#55627F',
                    cursor: 'pointer',
                  }}
                >
                  {cat === 'all' ? 'All Cuts' : cat}
                </button>
              ))}
            </div>
          </div>

          {/* Model Cards List */}
          <div data-lenis-prevent style={{ flex: 1, overflowY: 'auto', padding: '14px 16px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {filteredModels.map((model) => {
              const isSelected = selectedModel.id === model.id;
              return (
                <div
                  key={model.id}
                  onClick={() => handleModelSelect(model)}
                  style={{
                    padding: '14px',
                    borderRadius: '12px',
                    background: isSelected ? '#FFFFFF' : 'rgba(255, 255, 255, 0.65)',
                    border: '1.5px solid',
                    borderColor: isSelected ? '#6592C5' : 'rgba(101, 146, 197, 0.22)',
                    boxShadow: isSelected
                      ? '0 10px 24px -8px rgba(101, 146, 197, 0.3)'
                      : '0 4px 12px rgba(36, 44, 71, 0.04)',
                    cursor: 'pointer',
                    transition: 'all 0.2s cubic-bezier(0.16, 1, 0.3, 1)',
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '6px' }}>
                    <span
                      style={{
                        fontSize: '9.5px',
                        padding: '2px 7px',
                        borderRadius: '999px',
                        fontWeight: 700,
                        letterSpacing: '0.04em',
                        background:
                          model.tier === 'paid'
                            ? 'rgba(221, 0, 114, 0.12)'
                            : model.tier === 'community'
                            ? 'rgba(101, 146, 197, 0.15)'
                            : 'rgba(36, 44, 71, 0.08)',
                        color:
                          model.tier === 'paid'
                            ? '#DD0072'
                            : model.tier === 'community'
                            ? '#6592C5'
                            : '#242C47',
                      }}
                    >
                      {model.badge || model.tier.toUpperCase()}
                    </span>

                    <span style={{ fontSize: '12px', fontWeight: 700, color: '#242C47' }}>
                      ${model.blankPrice.toFixed(2)} blank
                    </span>
                  </div>

                  <div style={{ fontWeight: 700, fontSize: '13.5px', color: '#242C47', marginBottom: '4px' }}>
                    {model.name}
                  </div>

                  <div style={{ fontSize: '11.5px', color: '#55627F', lineHeight: 1.4, marginBottom: '8px' }}>
                    {model.description}
                  </div>

                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '10.5px', color: '#6592C5', fontWeight: 600 }}>
                    <span>{model.gsm ? `${model.gsm} GSM` : model.category}</span>
                    <span>{model.printZone.name}</span>
                  </div>
                </div>
              );
            })}
          </div>
        </aside>

        {/* CENTER VIEWPORT: INTERACTIVE 3D WEBGL WORKSPACE */}
        <main
          ref={containerRef}
          style={{
            position: 'relative',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            overflow: 'hidden',
            background: 'radial-gradient(130% 90% at 50% 12%, rgba(101, 146, 197, 0.15), transparent 60%), #F0EEE6',
          }}
        >
          {/* Interactive WebGL Canvas */}
          <canvas
            ref={canvasRef}
            style={{
              width: '100%',
              height: '100%',
              display: 'block',
              cursor: 'grab',
            }}
          />

          {/* Floating Viewport Controls Pill */}
          <div
            style={{
              position: 'absolute',
              top: '20px',
              left: '50%',
              transform: 'translateX(-50%)',
              display: 'flex',
              alignItems: 'center',
              gap: '12px',
              padding: '6px 16px',
              borderRadius: '999px',
              background: 'rgba(255, 255, 255, 0.88)',
              backdropFilter: 'blur(12px)',
              border: '1.5px solid rgba(101, 146, 197, 0.28)',
              boxShadow: '0 8px 24px -6px rgba(36, 44, 71, 0.12)',
              zIndex: 20,
              fontSize: '12px',
              fontWeight: 600,
              color: '#55627F',
            }}
          >
            <span style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#242C47' }}>
              <Box size={14} color="#6592C5" />
              {selectedModel.name}
            </span>
            <span style={{ color: 'rgba(101,146,197,0.4)' }}>|</span>
            <span>Sub-Millimeter Zone: {selectedModel.printZone.name}</span>
            <button
              onClick={handleResetPosition}
              title="Reset View and Position"
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '4px',
                border: 'none',
                background: 'transparent',
                color: '#6592C5',
                cursor: 'pointer',
                fontWeight: 600,
                fontSize: '11px',
              }}
            >
              <RotateCcw size={12} />
              Reset
            </button>
          </div>

          {/* Quick Presets / File Bar at bottom */}
          <div
            style={{
              position: 'absolute',
              bottom: '20px',
              left: '50%',
              transform: 'translateX(-50%)',
              display: 'flex',
              alignItems: 'center',
              gap: '10px',
              padding: '8px 18px',
              borderRadius: '999px',
              background: 'rgba(255, 255, 255, 0.92)',
              backdropFilter: 'blur(14px)',
              border: '1.5px solid rgba(101, 146, 197, 0.3)',
              boxShadow: '0 12px 30px -8px rgba(36, 44, 71, 0.14)',
              zIndex: 20,
            }}
          >
            <span style={{ fontSize: '11.5px', color: '#55627F', fontWeight: 600, marginRight: '6px' }}>
              Drag & Drop file or:
            </span>

            <button
              onClick={() => fileInputRef.current?.click()}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
                padding: '6px 14px',
                borderRadius: '999px',
                border: '1px solid rgba(101, 146, 197, 0.4)',
                background: '#FFFFFF',
                color: '#242C47',
                fontSize: '12px',
                fontWeight: 600,
                cursor: 'pointer',
              }}
            >
              <Upload size={12} color="#6592C5" />
              Upload .OBJ Mesh
            </button>

            <button
              onClick={() => textureInputRef.current?.click()}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
                padding: '6px 14px',
                borderRadius: '999px',
                border: '1px solid rgba(101, 146, 197, 0.4)',
                background: '#FFFFFF',
                color: '#242C47',
                fontSize: '12px',
                fontWeight: 600,
                cursor: 'pointer',
              }}
            >
              <FileImage size={12} color="#6592C5" />
              Upload Graphic (PNG/JPG)
            </button>
          </div>

          {/* Toast Floating Notification */}
          {toastMessage && (
            <div
              style={{
                position: 'absolute',
                bottom: '80px',
                padding: '8px 20px',
                borderRadius: '999px',
                background: '#242C47',
                color: '#F0EEE6',
                fontSize: '12.5px',
                fontWeight: 600,
                boxShadow: '0 8px 20px rgba(36,44,71,0.25)',
                zIndex: 40,
                animation: 'fadeIn 0.2s ease',
              }}
            >
              {toastMessage}
            </div>
          )}
        </main>

        {/* RIGHT PANEL: PRECISION PRINT CONTROLS & SPECIFICATION */}
        <aside
          data-lenis-prevent
          style={{
            display: 'flex',
            flexDirection: 'column',
            borderLeft: '1.5px solid rgba(101, 146, 197, 0.22)',
            background: 'rgba(240, 238, 230, 0.75)',
            backdropFilter: 'blur(16px)',
            overflowY: 'auto',
            padding: '20px',
            gap: '20px',
          }}
        >
          {/* Garment Color Swatches */}
          <div>
            <div style={{ fontSize: '11px', color: '#6592C5', fontWeight: 700, letterSpacing: '0.06em', marginBottom: '8px' }}>
              GARMENT DYE FINISH
            </div>
            <div style={{ fontWeight: 700, fontSize: '13.5px', color: '#242C47', marginBottom: '10px' }}>
              {selectedColor.name}
            </div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
              {selectedModel.availableColors.map((color) => {
                const isActive = selectedColor.id === color.id;
                return (
                  <button
                    key={color.id}
                    onClick={() => handleColorSelect(color)}
                    title={color.name}
                    style={{
                      width: '32px',
                      height: '32px',
                      borderRadius: '50%',
                      background: color.hex,
                      border: isActive ? '2.5px solid #6592C5' : '1.5px solid rgba(36,44,71,0.2)',
                      boxShadow: isActive
                        ? '0 0 0 2px #FFFFFF, 0 4px 10px rgba(36,44,71,0.2)'
                        : '0 2px 6px rgba(36,44,71,0.08)',
                      cursor: 'pointer',
                      transition: 'transform 0.15s ease',
                      transform: isActive ? 'scale(1.12)' : 'scale(1)',
                    }}
                  />
                );
              })}
            </div>
          </div>

          {/* 3D Artwork Scaling Slider */}
          <div style={{ padding: '14px', borderRadius: '10px', background: '#FFFFFF', border: '1px solid rgba(101, 146, 197, 0.2)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', color: '#6592C5', fontWeight: 700, marginBottom: '8px' }}>
              <span>ARTWORK REGISTRATION SCALE</span>
              <span>{scaleValue}%</span>
            </div>
            <input
              type="range"
              min="0"
              max="100"
              value={scaleValue}
              onChange={handleScaleChange}
              style={{ width: '100%', accentColor: '#6592C5', cursor: 'pointer' }}
            />
          </div>

          {/* D-Pad Coordinate Translation */}
          <div style={{ padding: '14px', borderRadius: '10px', background: '#FFFFFF', border: '1px solid rgba(101, 146, 197, 0.2)' }}>
            <div style={{ fontSize: '11px', color: '#6592C5', fontWeight: 700, marginBottom: '10px' }}>
              SUB-MM OFFSET (D-PAD)
            </div>
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(3, 34px)',
                gridTemplateRows: 'repeat(3, 34px)',
                gap: '6px',
                justifyContent: 'center',
                margin: '0 auto',
              }}
            >
              <div />
              <button
                onClick={() => handleMove(0, 1)}
                style={{
                  borderRadius: '6px',
                  border: '1px solid rgba(101, 146, 197, 0.3)',
                  background: '#F0EEE6',
                  cursor: 'pointer',
                  fontWeight: 700,
                }}
              >
                ▲
              </button>
              <div />
              <button
                onClick={() => handleMove(-1, 0)}
                style={{
                  borderRadius: '6px',
                  border: '1px solid rgba(101, 146, 197, 0.3)',
                  background: '#F0EEE6',
                  cursor: 'pointer',
                  fontWeight: 700,
                }}
              >
                ◀
              </button>
              <button
                onClick={handleResetPosition}
                title="Center"
                style={{
                  borderRadius: '6px',
                  border: '1px solid #6592C5',
                  background: '#6592C5',
                  color: '#FFFFFF',
                  cursor: 'pointer',
                  fontSize: '10px',
                  fontWeight: 800,
                }}
              >
                •
              </button>
              <button
                onClick={() => handleMove(1, 0)}
                style={{
                  borderRadius: '6px',
                  border: '1px solid rgba(101, 146, 197, 0.3)',
                  background: '#F0EEE6',
                  cursor: 'pointer',
                  fontWeight: 700,
                }}
              >
                ▶
              </button>
              <div />
              <button
                onClick={() => handleMove(0, -1)}
                style={{
                  borderRadius: '6px',
                  border: '1px solid rgba(101, 146, 197, 0.3)',
                  background: '#F0EEE6',
                  cursor: 'pointer',
                  fontWeight: 700,
                }}
              >
                ▼
              </button>
              <div />
            </div>
          </div>

          {/* Garment Size Selection */}
          <div>
            <div style={{ fontSize: '11px', color: '#6592C5', fontWeight: 700, letterSpacing: '0.06em', marginBottom: '8px' }}>
              GARMENT BLANK SIZE
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: '6px' }}>
              {(['S', 'M', 'L', 'XL', '2XL'] as const).map((sz) => (
                <button
                  key={sz}
                  onClick={() => setSelectedSize(sz)}
                  style={{
                    padding: '8px 0',
                    borderRadius: '8px',
                    border: '1.5px solid',
                    borderColor: selectedSize === sz ? '#242C47' : 'rgba(101, 146, 197, 0.3)',
                    background: selectedSize === sz ? '#242C47' : '#FFFFFF',
                    color: selectedSize === sz ? '#F0EEE6' : '#242C47',
                    fontWeight: 700,
                    fontSize: '12px',
                    cursor: 'pointer',
                    transition: 'all 0.15s ease',
                  }}
                >
                  {sz}
                </button>
              ))}
            </div>
          </div>

          {/* Print Technique Selection */}
          <div>
            <div style={{ fontSize: '11px', color: '#6592C5', fontWeight: 700, letterSpacing: '0.06em', marginBottom: '8px' }}>
              PRINT METHODOLOGY
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
              {[
                { id: 'dtg', label: 'Direct-to-Garment (DTG)', desc: 'Full-color gamut with soft hand feel' },
                { id: 'screen', label: 'High-Density Screen Print', desc: 'Crisp plastisol opacity & edge definition' },
                { id: 'embroidery', label: 'Tactile Embroidery', desc: 'Direct needle stitch vector translation' },
              ].map((tech) => (
                <div
                  key={tech.id}
                  onClick={() => setPrintTechnique(tech.id as any)}
                  style={{
                    padding: '10px 12px',
                    borderRadius: '8px',
                    border: '1px solid',
                    borderColor: printTechnique === tech.id ? '#6592C5' : 'rgba(101, 146, 197, 0.25)',
                    background: printTechnique === tech.id ? 'rgba(101, 146, 197, 0.12)' : '#FFFFFF',
                    cursor: 'pointer',
                  }}
                >
                  <div style={{ fontSize: '12px', fontWeight: 700, color: '#242C47' }}>{tech.label}</div>
                  <div style={{ fontSize: '10.5px', color: '#55627F' }}>{tech.desc}</div>
                </div>
              ))}
            </div>
          </div>

          {/* Live Price Breakdown & Summary */}
          <div style={{ padding: '16px', borderRadius: '12px', background: '#FFFFFF', border: '1.5px solid rgba(101, 146, 197, 0.3)', marginTop: 'auto' }}>
            <div style={{ fontSize: '11px', color: '#6592C5', fontWeight: 700, marginBottom: '10px' }}>
              INDUSTRIAL PRESS CALCULATION
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', color: '#55627F', marginBottom: '4px' }}>
              <span>Blank ({selectedModel.name})</span>
              <span>${blankCost.toFixed(2)}</span>
            </div>
            {licenseCost > 0 && (
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', color: '#DD0072', marginBottom: '4px' }}>
                <span>3D Model Pro License</span>
                <span>+${licenseCost.toFixed(2)}</span>
              </div>
            )}
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', color: '#55627F', marginBottom: '8px' }}>
              <span>Sub-mm Proofing & Registration</span>
              <span>${printCost.toFixed(2)}</span>
            </div>
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                paddingTop: '8px',
                borderTop: '1px solid rgba(101, 146, 197, 0.2)',
                fontSize: '15px',
                fontWeight: 800,
                color: '#242C47',
              }}
            >
              <span>Total Proof Sample:</span>
              <span>${totalCost}</span>
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
}
