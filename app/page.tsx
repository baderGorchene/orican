'use client';

import React, { useEffect, useRef, useState, useCallback } from 'react';
import Link from 'next/link';
import {
  ArrowRight,
  Box,
  Check,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  ExternalLink,
  Layers,
  MessageCircle,
  Package,
  Palette,
  Rotate3d,
  Scissors,
  ShieldCheck,
  Sparkles,
  Truck,
} from 'lucide-react';
import {
  GARMENT_MODELS,
  SHIRT_PATH_D,
  HOODIE_PATH_D,
  PANTS_PATH_D,
  JACKET_PATH_D,
} from '@/lib/constants';
import { GarmentCategory, ModelTier } from '@/lib/types';
import { useLenis } from 'lenis/react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

if (typeof window !== 'undefined') {
  gsap.registerPlugin(ScrollTrigger);
}

export default function LandingPage() {
  const lenis = useLenis();
  const scrubCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const scrubWrapRef = useRef<HTMLDivElement | null>(null);
  const stageRef = useRef<HTMLElement | null>(null);
  const carouselTrackRef = useRef<HTMLDivElement | null>(null);
  const renderFrameRef = useRef<(idx: number) => void>(() => {});

  // Direct Interactive Rotation State (0° to 360°)
  const [rotationAngle, setRotationAngle] = useState<number>(0);
  const isDraggingCanvas = useRef<boolean>(false);
  const dragStartX = useRef<number>(0);
  const dragStartAngle = useRef<number>(0);

  // Category showcase active tab in landing page
  const [activeCategory, setActiveCategory] = useState<GarmentCategory>('tops');

  // Interactive color swatches for garment cards
  const [cardColors, setCardColors] = useState<Record<string, string>>({});

  // Active step for visual explainer carousel ("Comment ça fonctionne en image")
  const [activeExplainerStep, setActiveExplainerStep] = useState<number>(0);

  const SWATCHES = [
    { id: 'white', name: 'Canvas White', hex: '#F6F4EE' },
    { id: 'black', name: 'Ink Black', hex: '#1B1C1E' },
    { id: 'natural', name: 'Undyed Natural', hex: '#CBA97A' },
    { id: 'cyan', name: 'Electric Cyan', hex: '#00AEEF' },
    { id: 'magenta', name: 'Process Magenta', hex: '#DD0072' },
  ];

  // Visual Explainer Step Definitions
  const EXPLAINER_STEPS = [
    {
      step: 1,
      title: '1. Choisissez votre silhouette',
      desc: 'Sélectionnez parmi nos modèles pré-calibrés : T-Shirt 240 GSM, Hoodie Drop-Shoulder, Pantalon ou Veste technique. Chaque modèle intègre les tolérances exactes de nos plateaux de presse.',
      renderVisual: () => (
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '14px', width: '100%' }}>
          <div style={{ display: 'flex', gap: '20px', alignItems: 'center', justifyContent: 'center' }}>
            <div style={{ padding: '16px', background: 'rgba(101,146,197,0.12)', borderRadius: '12px', border: '1.5px solid var(--blue)', boxShadow: '0 4px 14px rgba(101,146,197,0.15)' }}>
              <svg viewBox="0 0 508 508" style={{ width: '70px', height: '70px' }}>
                <path d={SHIRT_PATH_D} fill="#242C47" />
              </svg>
            </div>
            <div style={{ padding: '16px', background: 'rgba(101,146,197,0.06)', borderRadius: '12px', border: '1px solid var(--line)' }}>
              <svg viewBox="0 0 512 512" style={{ width: '70px', height: '70px' }}>
                <path d={HOODIE_PATH_D} fill="#6592C5" opacity="0.65" />
              </svg>
            </div>
          </div>
          <span style={{ fontSize: '12px', fontWeight: 700, color: 'var(--ink)', letterSpacing: '.04em' }}>
            Blanks certifi&eacute;s 240 &agrave; 420 GSM
          </span>
        </div>
      ),
    },
    {
      step: 2,
      title: '2. D&eacute;posez votre mesh 3D ou visuel',
      desc: 'Importez vos fichiers 3D Wavefront .OBJ ou vos fichiers graphiques vectoriels/raster. D&eacute;pliage UV planaire automatique, centrage dynamique et alignement au millim&egrave;tre pr&egrave;s.',
      renderVisual: () => (
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '14px', width: '100%' }}>
          <div style={{ width: '140px', height: '94px', border: '2px dashed var(--blue)', borderRadius: '12px', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', background: 'rgba(101,146,197,0.08)' }}>
            <Layers size={30} color="var(--blue)" />
            <span style={{ fontSize: '11px', fontWeight: 700, color: 'var(--ink)', marginTop: '6px' }}>
              .OBJ &middot; SVG &middot; PNG
            </span>
          </div>
          <span style={{ fontSize: '12px', fontWeight: 700, color: 'var(--ink)', letterSpacing: '.04em' }}>
            D&eacute;pliage UV planaire instantan&eacute;
          </span>
        </div>
      ),
    },
    {
      step: 3,
      title: '3. Calibrez et lancez en presse',
      desc: 'Visualisez les plans de d&eacute;limitation mat&eacute;rielle GPU. Ce que vous validez &agrave; l&rsquo;&eacute;cran correspond fid&egrave;lement au placement sous la presse s&eacute;rigraphique ou DTG.',
      renderVisual: () => (
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '14px', width: '100%' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '10px 18px', background: 'rgba(16,185,129,0.12)', border: '1.5px solid #10B981', borderRadius: '999px', color: '#065F46', fontWeight: 700, fontSize: '13px' }}>
            <CheckCircle2 size={18} color="#10B981" />
            <span>BAT 3D Conforme &bull; 0 Erreur</span>
          </div>
          <span style={{ fontSize: '12px', color: 'var(--ink-soft)' }}>
            Export JPG HD &amp; Fichier RIP PNG d&eacute;limit&eacute;
          </span>
        </div>
      ),
    },
  ];

  // Direct Slider & Angle Change Handler
  const handleSliderChange = useCallback((angle: number) => {
    const normalized = ((angle % 360) + 360) % 360;
    setRotationAngle(normalized);
    const TOTAL_FRAMES = 270;
    const targetIdx = Math.min(
      TOTAL_FRAMES,
      Math.max(1, Math.round((normalized / 360) * (TOTAL_FRAMES - 1)) + 1)
    );
    renderFrameRef.current(targetIdx);
  }, []);

  // Canvas Drag-to-Rotate Pointer Handlers
  const handleCanvasPointerDown = (e: React.PointerEvent<HTMLCanvasElement>) => {
    isDraggingCanvas.current = true;
    dragStartX.current = e.clientX;
    dragStartAngle.current = rotationAngle;
    (e.target as HTMLElement).setPointerCapture(e.pointerId);
  };

  const handleCanvasPointerMove = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (!isDraggingCanvas.current) return;
    const deltaX = e.clientX - dragStartX.current;
    // 1px drag = ~0.65 degrees rotation
    const newAngle = dragStartAngle.current - deltaX * 0.65;
    handleSliderChange(Math.round(newAngle));
  };

  const handleCanvasPointerUp = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (isDraggingCanvas.current) {
      isDraggingCanvas.current = false;
      try {
        (e.target as HTMLElement).releasePointerCapture(e.pointerId);
      } catch {
        // ignore pointer capture release if not active
      }
    }
  };

  // Carousel Arrow Navigation
  const scrollCarousel = (direction: 'left' | 'right') => {
    if (carouselTrackRef.current) {
      const scrollAmount = direction === 'left' ? -340 : 340;
      carouselTrackRef.current.scrollBy({ left: scrollAmount, behavior: 'smooth' });
    }
  };

  // Category tab switch smooth stagger
  useEffect(() => {
    const cards = document.querySelectorAll('#garments .carousel-card');
    if (cards.length > 0) {
      gsap.fromTo(
        cards,
        { opacity: 0, y: 16, scale: 0.98 },
        { opacity: 1, y: 0, scale: 1, duration: 0.4, stagger: 0.05, ease: 'power2.out' }
      );
    }
  }, [activeCategory]);

  useEffect(() => {
    // Hero scroll scrub using 270-frame image sequence + GSAP ScrollTrigger
    const wrap = scrubWrapRef.current;
    const canvas = scrubCanvasRef.current;
    const TOTAL_FRAMES = 270;
    const images: (HTMLImageElement | null)[] = new Array(TOTAL_FRAMES).fill(null);
    let currentFrameIdx = 1;

    const getFrameUrl = (idx: number) =>
      `/video/frame_${String(idx).padStart(3, '0')}.jpg`;

    function renderFrame(targetIndex: number) {
      if (!canvas) return;
      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      // Find best loaded frame: exact index or nearest loaded neighbour
      let imgToDraw: HTMLImageElement | null = null;
      const exact = images[targetIndex - 1];
      if (exact && exact.complete && exact.naturalWidth > 0) {
        imgToDraw = exact;
      } else {
        for (let offset = 1; offset < TOTAL_FRAMES; offset++) {
          const down = targetIndex - 1 - offset;
          if (down >= 0 && images[down]?.complete && images[down]!.naturalWidth > 0) {
            imgToDraw = images[down];
            break;
          }
          const up = targetIndex - 1 + offset;
          if (up < TOTAL_FRAMES && images[up]?.complete && images[up]!.naturalWidth > 0) {
            imgToDraw = images[up];
            break;
          }
        }
      }

      if (!imgToDraw) return;

      const w = canvas.width;
      const h = canvas.height;
      if (w === 0 || h === 0) return;

      // High-performance cover fit inside framed CAD canvas
      const imgW = imgToDraw.naturalWidth || 1280;
      const imgH = imgToDraw.naturalHeight || 720;
      const scale = Math.max(w / imgW, h / imgH);
      const drawW = imgW * scale;
      const drawH = imgH * scale;
      const drawX = (w - drawW) / 2;
      const drawY = (h - drawH) / 2;

      ctx.clearRect(0, 0, w, h);
      ctx.drawImage(imgToDraw, drawX, drawY, drawW, drawH);
    }

    renderFrameRef.current = renderFrame;

    function resizeCanvas() {
      if (!canvas) return;
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      const rect = canvas.getBoundingClientRect();
      const newW = Math.round(rect.width * dpr);
      const newH = Math.round(rect.height * dpr);
      if (canvas.width !== newW || canvas.height !== newH) {
        canvas.width = newW;
        canvas.height = newH;
      }
      renderFrame(currentFrameIdx);
    }

    function loadFrame(idx: number) {
      if (idx < 1 || idx > TOTAL_FRAMES || images[idx - 1]) return;
      const img = new Image();
      img.src = getFrameUrl(idx);
      img.onload = () => {
        images[idx - 1] = img;
        if (currentFrameIdx === idx || !canvas?.width) {
          if (!canvas?.width) resizeCanvas();
          renderFrame(currentFrameIdx);
        }
      };
    }

    // Step 1: Load first frame immediately and render it
    loadFrame(1);

    // Step 2: Progressive preloading
    for (let i = 2; i <= Math.min(20, TOTAL_FRAMES); i++) {
      loadFrame(i);
    }
    for (let i = 21; i <= TOTAL_FRAMES; i += 6) {
      loadFrame(i);
    }

    // Step 3: Background load the remainder
    const preloadTimer = setTimeout(() => {
      for (let i = 1; i <= TOTAL_FRAMES; i++) {
        loadFrame(i);
      }
    }, 150);

    resizeCanvas();

    // GSAP Context with automatic scoping and cleanup
    const ctx = gsap.context(() => {
      if (!wrap) return;

      // 1. Hero 270-frame scrub with sub-frame inertia (contained in Hero)
      ScrollTrigger.create({
        trigger: wrap,
        start: 'top top',
        end: 'bottom bottom',
        scrub: 0.5,
        onUpdate: (self) => {
          if (isDraggingCanvas.current) return;
          const p = self.progress;
          const frameIdx = Math.min(
            TOTAL_FRAMES,
            Math.max(1, Math.round(p * (TOTAL_FRAMES - 1)) + 1)
          );
          if (frameIdx !== currentFrameIdx) {
            currentFrameIdx = frameIdx;
            renderFrame(frameIdx);
            setRotationAngle(Math.round(p * 360));
          }
        },
      });

      // 2. Scroll-triggered section reveals for solid sections below
      document.querySelectorAll('.scroll-reveal-section').forEach((sec) => {
        ScrollTrigger.create({
          trigger: sec,
          start: 'top 86%',
          once: true,
          onEnter: () => sec.classList.add('is-revealed'),
        });
      });

      // 3. Tactile magnetic button hover micro-interactions
      const magneticTargets = document.querySelectorAll('.stage-try, .btn-magnetic');
      magneticTargets.forEach((btn) => {
        const el = btn as HTMLElement;
        const xTo = gsap.quickTo(el, 'x', { duration: 0.35, ease: 'power2.out' });
        const yTo = gsap.quickTo(el, 'y', { duration: 0.35, ease: 'power2.out' });

        const onMouseMove = (e: MouseEvent) => {
          const rect = el.getBoundingClientRect();
          const relX = e.clientX - (rect.left + rect.width / 2);
          const relY = e.clientY - (rect.top + rect.height / 2);
          xTo(relX * 0.2);
          yTo(relY * 0.2);
        };

        const onMouseLeave = () => {
          gsap.to(el, { x: 0, y: 0, duration: 0.6, ease: 'elastic.out(1, 0.4)' });
        };

        el.addEventListener('mousemove', onMouseMove);
        el.addEventListener('mouseleave', onMouseLeave);
      });
    });

    const handleResize = () => {
      resizeCanvas();
      ScrollTrigger.refresh();
    };

    window.addEventListener('resize', handleResize);

    return () => {
      clearTimeout(preloadTimer);
      window.removeEventListener('resize', handleResize);
      ctx.revert();
    };
  }, []);

  // Filter models for category showcase
  const categoryModels = GARMENT_MODELS.filter(
    (m) => m.category === activeCategory
  );

  return (
    <>
      {/* SCROLLING CONTENT LAYER */}
      <div style={{ position: 'relative', zIndex: 1 }}>
        {/* ================= HERO PINNED SCRUB SECTION ================= */}
        <div
          className="scrub-wrap"
          id="hero"
          ref={scrubWrapRef}
          style={{ position: 'relative', height: '300vh', background: 'var(--paper)' }}
        >
          <section className="stage" ref={stageRef} style={{ position: 'sticky', top: 0, height: '100vh', background: 'var(--paper)' }}>
            {/* Header with Navigation Links as requested by Client ("Home", "Proof", etc.) */}
            <header className="stage-header" id="stageHeader">
              <Link className="stage-brand" id="stageBrand" href="/" aria-label="ORICAN Home">
                <svg viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <circle cx="16" cy="16" r="14" stroke="var(--blue)" strokeWidth="1.8" />
                  <path d="M16 4v24M4 16h24" stroke="var(--ink)" strokeWidth="1.5" strokeOpacity="0.8" />
                  <circle cx="16" cy="16" r="4" fill="var(--blue)" />
                </svg>
                <span className="stage-brand__name">ORICAN</span>
              </Link>

              {/* Explicit Navigation Links ("Home", "Proof", "Specs", "Catalog") */}
              <nav className="stage-nav-links" aria-label="Main Navigation">
                <a
                  href="#hero"
                  className="stage-nav-link active"
                  onClick={(e) => {
                    e.preventDefault();
                    if (lenis) lenis.scrollTo(0, { duration: 1.2 });
                    else window.scrollTo({ top: 0, behavior: 'smooth' });
                  }}
                >
                  Home
                </a>
                <Link href="/studio" className="stage-nav-link">
                  Proof
                </Link>
                <a
                  href="#specs"
                  className="stage-nav-link"
                  onClick={(e) => {
                    e.preventDefault();
                    if (lenis) lenis.scrollTo('#specs', { duration: 1.2 });
                    else document.getElementById('specs')?.scrollIntoView({ behavior: 'smooth' });
                  }}
                >
                  Quality
                </a>
                <a
                  href="#garments"
                  className="stage-nav-link"
                  onClick={(e) => {
                    e.preventDefault();
                    if (lenis) lenis.scrollTo('#garments', { duration: 1.2 });
                    else document.getElementById('garments')?.scrollIntoView({ behavior: 'smooth' });
                  }}
                >
                  Catalog
                </a>
              </nav>

              <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                <Link href="/studio" className="stage-try btn-magnetic" id="stageCustomize">
                  <span>Launch 3D Studio</span>
                  <ArrowRight size={14} style={{ marginLeft: '6px' }} />
                </Link>
              </div>
            </header>

            {/* Split Editorial Hero: Left Clean Header ("Home / Model"), Right 3D Viewport with Rotation Controls */}
            <div className="hero-split-grid">
              {/* Left Column: Clean Product Identification as Redlined ("Home / Model") */}
              <div className="hero-text-col">
                <div className="hero-clean-header">
                  <div className="hero-clean-tag">
                    <Sparkles size={12} color="var(--blue)" />
                    <span>3D DIGITAL REGISTRATION // ARCHETYPE 01</span>
                  </div>

                  <h1 className="hero-clean-title">
                    <span>Home</span>
                    <span className="hero-model-sub">3D Model Viewport</span>
                  </h1>

                  <p style={{ color: 'var(--ink-soft)', fontSize: '14px', lineHeight: 1.6, margin: 0 }}>
                    A real-time 3D simulation bridge connecting digital artwork directly to industrial screen print &amp; DTG presses with sub-millimeter precision.
                  </p>

                  <div className="hero-spec-pills">
                    <div className="hero-spec-pill">
                      <Check size={14} color="var(--blue)" />
                      <span>100% Heavyweight Organic Cotton (240 GSM)</span>
                    </div>
                    <div className="hero-spec-pill">
                      <Check size={14} color="var(--blue)" />
                      <span>Calibrated 300 &times; 260 mm Press Platen</span>
                    </div>
                    <div className="hero-spec-pill">
                      <Check size={14} color="var(--blue)" />
                      <span>Direct 360&deg; Interactive Rotation &amp; Drape Audit</span>
                    </div>
                  </div>

                  <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
                    <Link href="/studio" className="btn-hero-primary btn-magnetic">
                      <Sparkles size={15} color="var(--blue)" />
                      <span>Open in 3D Studio</span>
                      <ArrowRight size={14} />
                    </Link>
                    <a
                      href="#garments"
                      onClick={(e) => {
                        e.preventDefault();
                        if (lenis) lenis.scrollTo('#garments', { duration: 1.2 });
                        else document.getElementById('garments')?.scrollIntoView({ behavior: 'smooth' });
                      }}
                      className="btn btn-secondary btn-magnetic"
                      style={{ borderRadius: '999px', padding: '12px 20px', fontSize: '13px' }}
                    >
                      <span>Browse Catalog</span>
                    </a>
                  </div>
                </div>
              </div>

              {/* Right Column: 3D Garment Viewport with Direct Drag Rotation, Hotspot Callout & Rotation Slider Bar */}
              <div className="hero-canvas-col" style={{ position: 'relative', cursor: 'grab' }}>
                <canvas
                  ref={scrubCanvasRef}
                  id="heroScrubCanvas"
                  onPointerDown={handleCanvasPointerDown}
                  onPointerMove={handleCanvasPointerMove}
                  onPointerUp={handleCanvasPointerUp}
                  onPointerLeave={handleCanvasPointerUp}
                  style={{
                    position: 'absolute',
                    inset: 0,
                    width: '100%',
                    height: '100%',
                    display: 'block',
                    touchAction: 'none',
                  }}
                  title="Glissez horizontalement pour faire pivoter le vêtement en 360°"
                />

                {/* On-Model Hotspot Callout Card as Circled by Client */}
                <div className="shirt-hotspot-callout">
                  <div className="hotspot-tag">HEAVYWEIGHT BLANK</div>
                  <div className="hotspot-title">240 GSM Oversized Cut</div>
                  <div className="hotspot-desc">
                    Calibrated 30&times;26cm hardware print zone with reinforced collar ribbing.
                  </div>
                  <Link href="/studio" className="hotspot-btn">
                    <span>Customize in Studio</span>
                    <ArrowRight size={12} />
                  </Link>
                </div>

                {/* Direct 360° Rotation Control Deck ("Contrôle rotation") as Sketched by Client */}
                <div className="rotation-control-deck">
                  <div className="rotation-header">
                    <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <Rotate3d size={14} color="var(--blue)" />
                      <span>Contr&ocirc;le Rotation &middot; 360&deg;</span>
                    </span>
                    <span className="rotation-angle-badge">{rotationAngle}&deg;</span>
                  </div>

                  <div className="rotation-slider-wrap">
                    <span style={{ fontSize: '11px', color: 'var(--ink-soft)', fontWeight: 600 }}>0&deg;</span>
                    <input
                      type="range"
                      min="0"
                      max="360"
                      value={rotationAngle}
                      onChange={(e) => handleSliderChange(parseInt(e.target.value, 10))}
                      className="rotation-slider"
                      aria-label="Contrôle de rotation du vêtement"
                    />
                    <span style={{ fontSize: '11px', color: 'var(--ink-soft)', fontWeight: 600 }}>360&deg;</span>
                  </div>

                  <div className="rotation-presets-row">
                    {[
                      { label: '0° Front', angle: 0 },
                      { label: '90° Drape', angle: 90 },
                      { label: '180° Profile', angle: 180 },
                      { label: '270° Back', angle: 270 },
                    ].map((preset) => (
                      <button
                        key={preset.angle}
                        type="button"
                        className={`rotation-preset-btn ${rotationAngle === preset.angle ? 'active' : ''}`}
                        onClick={() => handleSliderChange(preset.angle)}
                      >
                        {preset.label}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </section>
        </div>

        {/* ================= 1. TRUST BADGES ROW (SHIPPING, PACKAGING, QUALITY) ================= */}
        <section className="scroll-reveal-section trust-badges-wrap wrap">
          <div className="trust-badges-grid">
            <div className="trust-badge-card stagger-item" style={{ '--item-idx': 0 } as React.CSSProperties}>
              <div className="trust-badge-icon">
                <Truck size={24} />
              </div>
              <div>
                <div className="trust-badge-title">Express Shipping</div>
                <div className="trust-badge-desc">
                  Fast, secure global dispatch with live press tracking &amp; customs pre-cleared.
                </div>
              </div>
            </div>

            <div className="trust-badge-card stagger-item" style={{ '--item-idx': 1 } as React.CSSProperties}>
              <div className="trust-badge-icon">
                <Package size={24} />
              </div>
              <div>
                <div className="trust-badge-title">Custom Packaging</div>
                <div className="trust-badge-desc">
                  Premium rigid presentation boxes with individual protective garment polybags.
                </div>
              </div>
            </div>

            <div className="trust-badge-card stagger-item" style={{ '--item-idx': 2 } as React.CSSProperties}>
              <div className="trust-badge-icon">
                <ShieldCheck size={24} />
              </div>
              <div>
                <div className="trust-badge-title">Satisfaction Guaranteed</div>
                <div className="trust-badge-desc">
                  Sub-millimeter print registration. What you design is what gets printed.
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ================= 2. GARMENT ANATOMY & QUALITY SPECS SECTION ================= */}
        <section className="scroll-reveal-section specs-section wrap" id="specs">
          <div className="section-head" style={{ marginBottom: '32px' }}>
            <div>
              <div style={{ fontSize: '11px', color: 'var(--blue)', fontWeight: 700, letterSpacing: '.08em', marginBottom: '6px' }}>
                TECHNICAL CRAFTSMANSHIP
              </div>
              <h2 style={{ fontSize: 'clamp(28px, 3.5vw, 40px)', color: 'var(--ink)' }}>
                Garment Anatomy &amp; Specs
              </h2>
            </div>
            <p style={{ color: 'var(--ink-soft)', maxWidth: '420px' }}>
              Precision-crafted heavyweight blanks built to withstand high-temp industrial curing and repeated wash cycles.
            </p>
          </div>

          <div className="specs-split-grid">
            {/* Left Blueprint Card */}
            <div className="specs-blueprint-card">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: '11px', fontWeight: 700, color: 'var(--blue)', letterSpacing: '.06em' }}>
                  ARCHETYPE: 240 GSM TEE
                </span>
                <span style={{ fontSize: '11px', color: 'var(--ink-soft)' }}>
                  CAD SEAM MAP
                </span>
              </div>

              {/* Blueprint vector drawing */}
              <div style={{ position: 'relative', width: '100%', height: '280px', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
                <svg
                  viewBox="0 0 508 508"
                  style={{ maxHeight: '100%', maxWidth: '280px', filter: 'drop-shadow(0 6px 12px rgba(101,146,197,0.18))' }}
                >
                  <path
                    d={SHIRT_PATH_D}
                    fill="rgba(101, 146, 197, 0.08)"
                    stroke="var(--blue)"
                    strokeWidth="2.5"
                  />
                  {/* Print Zone Dashed Box */}
                  <rect
                    x="179"
                    y="132"
                    width="150"
                    height="132"
                    fill="rgba(36, 44, 71, 0.05)"
                    stroke="var(--ink)"
                    strokeWidth="1.5"
                    strokeDasharray="4 3"
                    rx="4"
                  />
                </svg>

                {/* Callout Pins */}
                <div style={{ position: 'absolute', top: '24px', right: '18px', background: 'rgba(255,255,255,0.95)', border: '1.5px solid var(--blue)', borderRadius: '8px', padding: '6px 12px', fontSize: '11.5px', fontWeight: 700, color: 'var(--ink)', boxShadow: '0 4px 12px rgba(36, 44, 71, 0.1)', display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <span style={{ width: 6, height: 6, borderRadius: '50%', background: 'var(--blue)' }} />
                  <span>Oversize Cut &middot; Drop Shoulder</span>
                </div>
                <div style={{ position: 'absolute', bottom: '24px', left: '18px', background: 'rgba(255,255,255,0.95)', border: '1.5px solid var(--blue)', borderRadius: '8px', padding: '6px 12px', fontSize: '11.5px', fontWeight: 700, color: 'var(--ink)', boxShadow: '0 4px 12px rgba(36, 44, 71, 0.1)', display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <span style={{ width: 6, height: 6, borderRadius: '50%', background: 'var(--blue)' }} />
                  <span>240 GSM Heavyweight Jersey</span>
                </div>
                <div style={{ position: 'absolute', top: '48%', left: '10px', background: 'rgba(255,255,255,0.95)', border: '1.5px solid var(--blue)', borderRadius: '8px', padding: '6px 12px', fontSize: '11.5px', fontWeight: 700, color: 'var(--ink)', boxShadow: '0 4px 12px rgba(36, 44, 71, 0.1)', display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <span style={{ width: 6, height: 6, borderRadius: '50%', background: 'var(--blue)' }} />
                  <span>Reinforced Twin-Needle Seams</span>
                </div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '11.5px', color: 'var(--ink-soft)', borderTop: '1px solid var(--line)', paddingTop: '12px' }}>
                <span>Cut: Pre-shrunk Streetwear Fit</span>
                <span style={{ fontWeight: 600, color: 'var(--ink)' }}>Calibrated 300 &times; 260 mm Platen Zone</span>
              </div>
            </div>

            {/* Right Quality Card as Underlined by Client */}
            <div className="specs-quality-card">
              <h3 className="specs-quality-title">Quality</h3>
              <p style={{ fontSize: '13px', color: 'var(--ink-soft)', lineHeight: 1.5, margin: 0 }}>
                Each garment is strictly benchmarked for ink adherence, dimensional stability, and luxury hand-feel.
              </p>

              <div className="specs-quality-list">
                <div className="specs-quality-item">
                  <Check size={16} color="var(--blue)" style={{ flexShrink: 0, marginTop: '2px' }} />
                  <div>
                    <strong>100% Combed Organic Ringspun Cotton:</strong> Long-staple fibers combed for zero impurities and silk-like hand-feel.
                  </div>
                </div>
                <div className="specs-quality-item">
                  <Check size={16} color="var(--blue)" style={{ flexShrink: 0, marginTop: '2px' }} />
                  <div>
                    <strong>240 GSM (7.1 oz/yd²) Heavyweight Gauge:</strong> Substantial streetwear drape that retains structural form wash after wash.
                  </div>
                </div>
                <div className="specs-quality-item">
                  <Check size={16} color="var(--blue)" style={{ flexShrink: 0, marginTop: '2px' }} />
                  <div>
                    <strong>Pre-Shrunk Compacted Finish:</strong> Under 0.8% dimensional shrinkage, guaranteeing true-to-size stability.
                  </div>
                </div>
                <div className="specs-quality-item">
                  <Check size={16} color="var(--blue)" style={{ flexShrink: 0, marginTop: '2px' }} />
                  <div>
                    <strong>Ultra-Dense Smooth Print Face:</strong> Enzyme biowashed to eliminate surface fuzz for high-fidelity DTG &amp; Screen prints.
                  </div>
                </div>
                <div className="specs-quality-item">
                  <Check size={16} color="var(--blue)" style={{ flexShrink: 0, marginTop: '2px' }} />
                  <div>
                    <strong>Double-Needle Reinforced Hem &amp; Cuffs:</strong> 1x1 ribbed collar with internal herringbone neck tape.
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ================= 3. VISUAL EXPLAINER (COMMENT ÇA FONCTIONNE EN IMAGE) ================= */}
        <section className="scroll-reveal-section wrap">
          <div className="explainer-container">
            <div className="explainer-header">
              <h2 className="explainer-title">Comment &ccedil;a fonctionne</h2>
              <div className="explainer-subtitle">Explication comment &ccedil;a fonctionne en image &middot; 3 &eacute;tapes</div>
            </div>

            {/* Step Slide Content */}
            <div className="explainer-step-card">
              <div>
                <div style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', background: 'rgba(101,146,197,0.14)', padding: '4px 12px', borderRadius: '999px', fontSize: '11px', fontWeight: 700, color: 'var(--blue)', marginBottom: '12px' }}>
                  &Eacute;TAPE 0{EXPLAINER_STEPS[activeExplainerStep].step}
                </div>
                <h3 style={{ fontSize: '24px', fontFamily: 'var(--font-title)', color: 'var(--ink)', marginBottom: '10px' }}>
                  {EXPLAINER_STEPS[activeExplainerStep].title}
                </h3>
                <p style={{ fontSize: '14px', color: 'var(--ink-soft)', lineHeight: 1.6, marginBottom: '24px' }}>
                  {EXPLAINER_STEPS[activeExplainerStep].desc}
                </p>
                <div style={{ display: 'flex', gap: '12px' }}>
                  <button
                    type="button"
                    onClick={() => setActiveExplainerStep((prev) => (prev > 0 ? prev - 1 : 2))}
                    className="btn btn-secondary small"
                  >
                    &larr; Pr&eacute;c&eacute;dent
                  </button>
                  <button
                    type="button"
                    onClick={() => setActiveExplainerStep((prev) => (prev < 2 ? prev + 1 : 0))}
                    className="btn btn-primary small"
                  >
                    Suivant &rarr;
                  </button>
                </div>
              </div>

              {/* Visual Step Illustration */}
              <div style={{ background: '#FFFFFF', borderRadius: '12px', padding: '24px', border: '1.5px solid rgba(101,146,197,0.3)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '200px' }}>
                {EXPLAINER_STEPS[activeExplainerStep].renderVisual()}
              </div>
            </div>

            {/* Pagination Dots (• • •) */}
            <div className="explainer-nav-dots" aria-label="Visual explanation steps">
              {[0, 1, 2].map((stepIdx) => (
                <button
                  key={stepIdx}
                  type="button"
                  className={`explainer-dot ${activeExplainerStep === stepIdx ? 'active' : ''}`}
                  onClick={() => setActiveExplainerStep(stepIdx)}
                  aria-label={`Step ${stepIdx + 1}`}
                />
              ))}
            </div>
          </div>
        </section>

        {/* ================= 4. STATS METRICS ("NUMBER") ================= */}
        <section
          className="scroll-reveal-section section-solid-linen"
          id="statsSection"
          style={{ color: 'var(--ink)', padding: '40px 0 48px' }}
        >
          <div className="wrap" style={{ textAlign: 'center', marginBottom: '22px' }}>
            <span style={{ fontSize: '11px', fontWeight: 700, letterSpacing: '.14em', color: 'var(--blue)', textTransform: 'uppercase' }}>
              Number &middot; Chiffres Cl&eacute;s
            </span>
          </div>

          <div className="wrap stats-bar-grid">
            <div className="stagger-item" style={{ '--item-idx': 0 } as React.CSSProperties}>
              <div style={{ fontFamily: 'var(--font-sans)', fontSize: '34px', fontWeight: 700, color: 'var(--ink)' }}>
                12K+
              </div>
              <div style={{ fontSize: '11px', color: 'var(--blue)', letterSpacing: '.06em', fontWeight: 600 }}>
                PROOFS GENERATED
              </div>
            </div>
            <div className="stagger-item" style={{ '--item-idx': 1 } as React.CSSProperties}>
              <div style={{ fontFamily: 'var(--font-sans)', fontSize: '34px', fontWeight: 700, color: 'var(--ink)' }}>
                4.9 / 5.0
              </div>
              <div style={{ fontSize: '11px', color: 'var(--blue)', letterSpacing: '.06em', fontWeight: 600 }}>
                PRESS OPERATOR RATING
              </div>
            </div>
            <div className="stagger-item" style={{ '--item-idx': 2 } as React.CSSProperties}>
              <div style={{ fontFamily: 'var(--font-sans)', fontSize: '34px', fontWeight: 700, color: 'var(--ink)' }}>
                98%
              </div>
              <div style={{ fontSize: '11px', color: 'var(--blue)', letterSpacing: '.06em', fontWeight: 600 }}>
                FIRST-RUN ACCURACY
              </div>
            </div>
            <div className="stagger-item" style={{ '--item-idx': 3 } as React.CSSProperties}>
              <div style={{ fontFamily: 'var(--font-sans)', fontSize: '34px', fontWeight: 700, color: 'var(--ink)' }}>
                Zero Misprints
              </div>
              <div style={{ fontSize: '11px', color: 'var(--blue)', letterSpacing: '.06em', fontWeight: 600 }}>
                HARDWARE CLIPPED ZONES
              </div>
            </div>
          </div>
        </section>

        {/* ================= 5. GARMENT CATALOG HORIZONTAL CAROUSEL ================= */}
        <section
          className="scroll-reveal-section section-solid-linen"
          id="garments"
          style={{ color: 'var(--ink)', padding: '72px 0 88px' }}
        >
          <div className="wrap">
            <div className="section-head">
              <div>
                <div
                  style={{
                    fontSize: '11px',
                    fontFamily: 'var(--font-sans)',
                    color: 'var(--blue)',
                    letterSpacing: '.08em',
                    fontWeight: 700,
                    marginBottom: '8px',
                  }}
                >
                  EXTENDED PRINT PROOFING
                </div>
                <h2
                  style={{
                    color: 'var(--ink)',
                    fontFamily: 'var(--font-title)',
                    fontSize: 'clamp(28px, 4vw, 44px)',
                    fontWeight: 400,
                    letterSpacing: '0.01em',
                  }}
                >
                  Beyond the basic tee
                </h2>
              </div>
              <p style={{ color: 'var(--ink-soft)', maxWidth: '380px' }}>
                Proof complete apparel collections with calibrated registration boundaries for pants, hoodies, jackets, and tees.
              </p>
            </div>

            {/* Category Toggle Tabs: Tops / Bottoms / Outerwear */}
            <div
              style={{
                display: 'inline-flex',
                gap: '8px',
                background: 'rgba(101, 146, 197, 0.12)',
                padding: '4px',
                borderRadius: '999px',
                marginBottom: '32px',
              }}
            >
              {(['tops', 'bottoms', 'outerwear'] as const).map((cat) => (
                <button
                  key={cat}
                  onClick={() => setActiveCategory(cat)}
                  style={{
                    padding: '8px 24px',
                    borderRadius: '999px',
                    border: 'none',
                    fontSize: '13px',
                    fontWeight: 600,
                    textTransform: 'capitalize',
                    cursor: 'pointer',
                    background: activeCategory === cat ? 'var(--ink)' : 'transparent',
                    color: activeCategory === cat ? 'var(--paper)' : 'var(--ink)',
                    transition: 'all 0.2s ease',
                  }}
                >
                  {cat}
                </button>
              ))}
            </div>

            {/* Horizontal Garment Carousel as Requested by Client with ◀ / ▶ Arrows */}
            <div className="carousel-wrapper">
              <button
                type="button"
                className="carousel-arrow-btn prev"
                onClick={() => scrollCarousel('left')}
                aria-label="Previous garments"
              >
                <ChevronLeft size={22} />
              </button>

              <div className="carousel-track" ref={carouselTrackRef}>
                {categoryModels.map((model, idx) => {
                  const activeColor = cardColors[model.id] || '#F6F4EE';
                  const pathD = model.id.includes('hoodie')
                    ? HOODIE_PATH_D
                    : model.id.includes('pants') || model.id.includes('shorts')
                    ? PANTS_PATH_D
                    : model.id.includes('jacket') || model.id.includes('windbreaker')
                    ? JACKET_PATH_D
                    : SHIRT_PATH_D;

                  return (
                    <div key={model.id} className="carousel-card">
                      <div
                        className="swatch"
                        style={{
                          background:
                            activeColor === '#1B1C1E'
                              ? '#222429'
                              : activeColor === '#00AEEF'
                              ? 'rgba(0, 174, 239, 0.12)'
                              : activeColor === '#DD0072'
                              ? 'rgba(221, 0, 114, 0.12)'
                              : 'rgba(232, 228, 218, 0.7)',
                          transition: 'background 0.3s ease',
                          display: 'flex',
                          flexDirection: 'column',
                          alignItems: 'center',
                          justifyContent: 'center',
                          position: 'relative',
                          padding: '24px 0',
                          minHeight: '190px',
                        }}
                      >
                        {/* Real SVG Garment Silhouette Blueprint Replacing Generic Cube */}
                        <svg
                          viewBox="0 0 512 512"
                          style={{
                            width: '92px',
                            height: '92px',
                            filter: 'drop-shadow(0 4px 10px rgba(0,0,0,0.12))',
                            transition: 'transform 0.3s ease',
                          }}
                        >
                          <path
                            d={pathD}
                            fill={activeColor}
                            stroke={activeColor === '#1B1C1E' ? '#4A5568' : '#6592C5'}
                            strokeWidth="3"
                          />
                        </svg>

                        <div
                          className="material-badge"
                          style={{
                            position: 'absolute',
                            top: '12px',
                            right: '12px',
                            background: 'rgba(240,238,230,.94)',
                            borderColor: 'var(--blue)',
                            color: 'var(--ink)',
                            fontSize: '10px',
                            padding: '3px 8px',
                          }}
                        >
                          <span
                            style={{
                              width: '6px',
                              height: '6px',
                              borderRadius: '50%',
                              backgroundColor: 'var(--blue)',
                              display: 'inline-block',
                            }}
                          />
                          {model.tier.toUpperCase()}
                        </div>
                      </div>

                      <div className="body" style={{ borderColor: 'var(--line)', padding: '18px 20px' }}>
                        <div
                          style={{
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'center',
                            marginBottom: '4px',
                          }}
                        >
                          <div className="name" style={{ color: 'var(--ink)', margin: 0, fontSize: '16px', fontWeight: 700 }}>
                            {model.name}
                          </div>
                          <span
                            style={{
                              fontSize: '13.5px',
                              fontWeight: 700,
                              color: 'var(--blue)',
                            }}
                          >
                            ${model.blankPrice.toFixed(2)}
                          </span>
                        </div>

                        <div className="price" style={{ color: 'var(--ink-soft)', marginBottom: '14px', fontSize: '12.5px' }}>
                          {model.printZone.name} &middot; Calibrated Platen
                        </div>

                        {/* Interactive Color Swatches */}
                        <div style={{ marginBottom: '16px' }}>
                          <div style={{ fontSize: '11px', fontWeight: 600, color: 'var(--ink-soft)', marginBottom: '6px' }}>
                            Couleurs disponibles :
                          </div>
                          <div className="card-color-swatches" aria-label="Select fabric color" style={{ margin: 0 }}>
                            {SWATCHES.map((swatch) => (
                              <button
                                key={swatch.id}
                                type="button"
                                className={`card-swatch-btn ${activeColor === swatch.hex ? 'active' : ''}`}
                                style={{ backgroundColor: swatch.hex }}
                                title={swatch.name}
                                onClick={() =>
                                  setCardColors((prev) => ({ ...prev, [model.id]: swatch.hex }))
                                }
                              />
                            ))}
                          </div>
                        </div>

                        <Link
                          href={`/studio?model=${model.id}&color=${encodeURIComponent(activeColor)}`}
                          className="btn small btn-magnetic"
                          style={{
                            width: '100%',
                            borderRadius: '8px',
                            background: 'var(--ink)',
                            color: 'var(--paper)',
                            display: 'flex',
                            justifyContent: 'center',
                            alignItems: 'center',
                            gap: '6px',
                            padding: '10px 0',
                            fontSize: '13px',
                            fontWeight: 600,
                          }}
                        >
                          <span>Customize in 3D Studio</span>
                          <ChevronRight size={14} />
                        </Link>
                      </div>
                    </div>
                  );
                })}
              </div>

              <button
                type="button"
                className="carousel-arrow-btn next"
                onClick={() => scrollCarousel('right')}
                aria-label="Next garments"
              >
                <ChevronRight size={22} />
              </button>
            </div>
          </div>
        </section>

        {/* ================= 6. 3D ASSET INFRASTRUCTURE (DEEP MIDNIGHT SLATE) ================= */}
        <section
          className="scroll-reveal-section section-dark-midnight"
          id="ecosystem"
          style={{ padding: '88px 0 96px' }}
        >
          <div className="wrap">
            <div className="section-head">
              <div>
                <div
                  style={{
                    fontSize: '11px',
                    fontFamily: 'var(--font-sans)',
                    color: 'var(--blue-bright)',
                    letterSpacing: '.1em',
                    fontWeight: 700,
                    marginBottom: '8px',
                  }}
                >
                  3D ASSET INFRASTRUCTURE
                </div>
                <h2
                  style={{
                    color: '#FFFFFF',
                    fontFamily: 'var(--font-title)',
                    fontSize: 'clamp(28px, 4vw, 44px)',
                    fontWeight: 400,
                    letterSpacing: '0.01em',
                  }}
                >
                  Decomposed into 3 tiers
                </h2>
              </div>
              <p style={{ color: '#A0AEC0', maxWidth: '380px' }}>
                Production-standard blanks, creator streetwear meshes, and commercial master files.
              </p>
            </div>

            {/* 3 Tier Cards */}
            <div className="grid">
              {/* Base Tier Card */}
              <div
                className="stagger-item dark-card"
                style={
                  {
                    '--item-idx': 0,
                    padding: '32px 26px',
                    borderRadius: '14px',
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'space-between',
                  } as React.CSSProperties
                }
              >
                <div>
                  <div
                    style={{
                      display: 'inline-block',
                      padding: '4px 10px',
                      borderRadius: '999px',
                      background: 'rgba(255, 255, 255, 0.08)',
                      color: '#E8E4DA',
                      fontSize: '10.5px',
                      fontWeight: 700,
                      letterSpacing: '0.05em',
                      marginBottom: '16px',
                    }}
                  >
                    BASE TIER &middot; FREE &amp; OPEN
                  </div>
                  <h3
                    style={{
                      fontSize: '22px',
                      fontFamily: 'var(--font-title)',
                      color: '#FFFFFF',
                      marginBottom: '8px',
                    }}
                  >
                    Production Blanks
                  </h3>
                  <p style={{ fontSize: '13px', color: '#A0AEC0', lineHeight: 1.6, marginBottom: '22px' }}>
                    Calibrated blanks included free with every print run. Heavyweight tees, classic French Terry hoodies, and relaxed fleece sweatpants.
                  </p>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginBottom: '32px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '12.5px', color: '#E2E8F0' }}>
                      <Check size={14} color="var(--blue-bright)" />
                      <span>Calibrated hardware print zone</span>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '12.5px', color: '#E2E8F0' }}>
                      <Check size={14} color="var(--blue-bright)" />
                      <span>Single-click color matching</span>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '12.5px', color: '#E2E8F0' }}>
                      <Check size={14} color="var(--blue-bright)" />
                      <span>Standard high-res mockups</span>
                    </div>
                  </div>
                </div>

                <div>
                  <div style={{ fontSize: '12px', color: '#A0AEC0', marginBottom: '14px' }}>
                    Starting at <strong style={{ color: '#FFFFFF' }}>$14.00 blank</strong> &middot; Free 3D asset
                  </div>
                  <Link
                    href="/studio"
                    className="btn btn-secondary btn-magnetic"
                    style={{ width: '100%', borderRadius: '8px', background: 'rgba(255, 255, 255, 0.08)', color: '#FFFFFF', borderColor: 'rgba(101, 146, 197, 0.35)' }}
                  >
                    <span>Browse Base Models</span>
                    <ArrowRight size={14} />
                  </Link>
                </div>
              </div>

              {/* Community Tier Card */}
              <div
                className="stagger-item dark-card"
                style={
                  {
                    '--item-idx': 1,
                    padding: '32px 26px',
                    borderRadius: '14px',
                    border: '1.5px solid var(--blue)',
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'space-between',
                  } as React.CSSProperties
                }
              >
                <div>
                  <div
                    style={{
                      display: 'inline-block',
                      padding: '4px 10px',
                      borderRadius: '999px',
                      background: 'rgba(101, 146, 197, 0.25)',
                      color: 'var(--blue-bright)',
                      fontSize: '10.5px',
                      fontWeight: 700,
                      letterSpacing: '0.05em',
                      marginBottom: '16px',
                    }}
                  >
                    COMMUNITY &middot; STREETWEAR CUTS
                  </div>
                  <h3
                    style={{
                      fontSize: '22px',
                      fontFamily: 'var(--font-title)',
                      color: '#FFFFFF',
                      marginBottom: '8px',
                    }}
                  >
                    Creator Silhouettes
                  </h3>
                  <p style={{ fontSize: '13px', color: '#A0AEC0', lineHeight: 1.6, marginBottom: '22px' }}>
                    Custom street-ready silhouettes contributed by 3D apparel modelers. Boxy dropped shoulders, vintage crewnecks, and heavyweight skate shorts.
                  </p>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginBottom: '32px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '12.5px', color: '#E2E8F0' }}>
                      <Check size={14} color="var(--blue-bright)" />
                      <span>Artisan drop-shoulder drape</span>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '12.5px', color: '#E2E8F0' }}>
                      <Check size={14} color="var(--blue-bright)" />
                      <span>Custom seam registration</span>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '12.5px', color: '#E2E8F0' }}>
                      <Check size={14} color="var(--blue-bright)" />
                      <span>Open community mesh files</span>
                    </div>
                  </div>
                </div>

                <div>
                  <div style={{ fontSize: '12px', color: '#A0AEC0', marginBottom: '14px' }}>
                    Starting at <strong style={{ color: '#FFFFFF' }}>$16.00 blank</strong> &middot; Open access
                  </div>
                  <Link
                    href="/studio"
                    className="btn btn-primary btn-magnetic"
                    style={{ width: '100%', borderRadius: '8px' }}
                  >
                    <span>Browse Community Models</span>
                    <ArrowRight size={14} />
                  </Link>
                </div>
              </div>

              {/* Paid / Pro Tier Card */}
              <div
                className="stagger-item dark-card"
                style={
                  {
                    '--item-idx': 2,
                    padding: '32px 26px',
                    borderRadius: '14px',
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'space-between',
                  } as React.CSSProperties
                }
              >
                <div>
                  <div
                    style={{
                      display: 'inline-block',
                      padding: '4px 10px',
                      borderRadius: '999px',
                      background: 'rgba(221, 0, 114, 0.2)',
                      color: '#FF64B0',
                      fontSize: '10.5px',
                      fontWeight: 700,
                      letterSpacing: '0.05em',
                      marginBottom: '16px',
                    }}
                  >
                    PAID / PRO &middot; COMMERCIAL CAD
                  </div>
                  <h3
                    style={{
                      fontSize: '22px',
                      fontFamily: 'var(--font-title)',
                      color: '#FFFFFF',
                      marginBottom: '8px',
                    }}
                  >
                    Master Studio Meshes
                  </h3>
                  <p style={{ fontSize: '13px', color: '#A0AEC0', lineHeight: 1.6, marginBottom: '22px' }}>
                    Industrial high-poly garment meshes with multi-panel seam maps, displacement textures, and industrial press RIP integration profiles.
                  </p>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginBottom: '32px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '12.5px', color: '#E2E8F0' }}>
                      <Check size={14} color="var(--blue-bright)" />
                      <span>Utility Cargo Pants &amp; Outerwear</span>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '12.5px', color: '#E2E8F0' }}>
                      <Check size={14} color="var(--blue-bright)" />
                      <span>Displacement &amp; normal weave maps</span>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '12.5px', color: '#E2E8F0' }}>
                      <Check size={14} color="var(--blue-bright)" />
                      <span>Full commercial license included</span>
                    </div>
                  </div>
                </div>

                <div>
                  <div style={{ fontSize: '12px', color: '#A0AEC0', marginBottom: '14px' }}>
                    From <strong style={{ color: '#FFFFFF' }}>$24.00 blank</strong> &middot; $10-15 asset license
                  </div>
                  <Link
                    href="/studio"
                    className="btn btn-secondary btn-magnetic"
                    style={{ width: '100%', borderRadius: '8px', background: 'rgba(255, 255, 255, 0.08)', color: '#FFFFFF', borderColor: 'rgba(101, 146, 197, 0.35)' }}
                  >
                    <span>Browse Pro Models</span>
                    <ArrowRight size={14} />
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ================= 7. GARMENT SCRUTINY SECTION ================= */}
        <section
          className="scroll-reveal-section section-dark-midnight"
          id="scrutinySection"
          style={{ padding: '72px 0 88px', borderTop: 'none' }}
        >
          <div className="wrap">
            <div className="section-head">
              <div>
                <div
                  style={{
                    fontSize: '11px',
                    fontFamily: 'var(--font-sans)',
                    color: 'var(--blue-bright)',
                    letterSpacing: '.1em',
                    fontWeight: 700,
                    marginBottom: '6px',
                  }}
                >
                  GARMENT SCRUTINY
                </div>
                <h2
                  style={{
                    color: '#FFFFFF',
                    fontFamily: 'var(--font-title)',
                    fontWeight: 400,
                    letterSpacing: '0.01em',
                  }}
                >
                  Built for scrutiny
                </h2>
              </div>
              <p style={{ color: '#A0AEC0' }}>
                Inspect real fabric drape &mdash; weave, stitching, collar, and print ink bonding.
              </p>
            </div>
            <div className="scrutiny-grid">
              <div
                className="stagger-item dark-card"
                style={
                  {
                    '--item-idx': 0,
                    aspectRatio: '16/9',
                    borderRadius: '12px',
                    overflow: 'hidden',
                  } as React.CSSProperties
                }
              >
                <img
                  src="https://d8j0ntlcm91z4.cloudfront.net/user_3CEJb1vs8I6xgnavY3H6CRY4bSJ/hf_20260915_082744_f9db9841-0a2f-47d8-a71f-6054f288935c.png"
                  alt="Macro detail of embroidered logo on cotton garment"
                  style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                />
              </div>
              <div
                className="stagger-item dark-card"
                style={
                  {
                    '--item-idx': 1,
                    aspectRatio: '16/9',
                    borderRadius: '12px',
                    overflow: 'hidden',
                  } as React.CSSProperties
                }
              >
                <img
                  src="https://d8j0ntlcm91z4.cloudfront.net/user_3CEJb1vs8I6xgnavY3H6CRY4bSJ/hf_20260915_082744_aeb7a148-4bf4-4cba-a335-123d93a5d9db.png"
                  alt="Folded apparel showing fabric weave and seam stitching"
                  style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                />
              </div>
              <div
                className="stagger-item dark-card"
                style={
                  {
                    '--item-idx': 2,
                    aspectRatio: '16/9',
                    borderRadius: '12px',
                    overflow: 'hidden',
                  } as React.CSSProperties
                }
              >
                <img
                  src="https://d8j0ntlcm91z4.cloudfront.net/user_3CEJb1vs8I6xgnavY3H6CRY4bSJ/hf_20260915_082744_6506c085-41fe-4e67-b573-93c71e87b9a8.png"
                  alt="Close-up of ribbed collar with embroidered emblem"
                  style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                />
              </div>
            </div>
          </div>
        </section>

        {/* ================= 8. METHODOLOGY WORKFLOW ("PRINT LIKE YOU IMAGINE") ================= */}
        <section
          className="scroll-reveal-section section-solid-linen"
          id="workflowSection"
          style={{ color: 'var(--ink)', padding: '72px 0 84px' }}
        >
          <div className="wrap">
            <div className="section-head">
              <div>
                <div
                  style={{
                    fontSize: '11px',
                    fontFamily: 'var(--font-sans)',
                    color: 'var(--blue)',
                    letterSpacing: '.08em',
                    fontWeight: 700,
                    marginBottom: '6px',
                  }}
                >
                  METHODOLOGY
                </div>
                <h2
                  style={{
                    color: 'var(--ink)',
                    fontFamily: 'var(--font-title)',
                    fontWeight: 400,
                    letterSpacing: '0.01em',
                  }}
                >
                  Print like you imagine
                </h2>
              </div>
              <div style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', color: '#10B981', fontSize: '13px', fontWeight: 700 }}>
                <CheckCircle2 size={18} color="#10B981" />
                <span>Validated 3D Proofing Pipeline</span>
              </div>
            </div>
            <div className="steps">
              <div
                className="step stagger-item glass-card"
                style={
                  {
                    '--item-idx': 0,
                    borderLeft: '2.5px solid var(--blue)',
                    padding: '24px 20px',
                    borderRadius: '10px',
                  } as React.CSSProperties
                }
              >
                <Box className="step-icon" size={24} color="#6592C5" />
                <h3 style={{ color: 'var(--ink)', fontFamily: 'var(--font-title)', fontWeight: 400 }}>
                  1. Pick Garment &amp; Model Tier
                </h3>
                <p style={{ color: 'var(--ink-soft)' }}>
                  Select from Base blanks, Community cuts, or Pro CAD models across Tops, Bottoms, and Outerwear.
                </p>
              </div>

              <div
                className="step stagger-item glass-card"
                style={
                  {
                    '--item-idx': 1,
                    borderLeft: '2.5px solid var(--blue)',
                    padding: '24px 20px',
                    borderRadius: '10px',
                  } as React.CSSProperties
                }
              >
                <Layers className="step-icon" size={24} color="#6592C5" />
                <h3 style={{ color: 'var(--ink)', fontFamily: 'var(--font-title)', fontWeight: 400 }}>
                  2. Upload 3D Mesh or Vector Art
                </h3>
                <p style={{ color: 'var(--ink-soft)' }}>
                  Place Wavefront .OBJ files or raster graphics with automatic planar UV unwrapping directly onto the 3D surface.
                </p>
              </div>

              <div
                className="step stagger-item glass-card"
                style={
                  {
                    '--item-idx': 2,
                    borderLeft: '2.5px solid var(--blue)',
                    padding: '24px 20px',
                    borderRadius: '10px',
                  } as React.CSSProperties
                }
              >
                <Scissors className="step-icon" size={24} color="#6592C5" />
                <h3 style={{ color: 'var(--ink)', fontFamily: 'var(--font-title)', fontWeight: 400 }}>
                  3. Calibrate Registration &amp; Bounds
                </h3>
                <p style={{ color: 'var(--ink-soft)' }}>
                  Use precision D-pad translation and scaling. GPU clipping planes lock your design within physical press platens.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* ================= 9. EDITORIAL STORY BANNER WITH WHATSAPP INTEGRATION ================= */}
        <section
          className="scroll-reveal-section"
          id="storyBannerSection"
          style={{
            position: 'relative',
            minHeight: '75vh',
            display: 'flex',
            alignItems: 'flex-end',
            background:
              "url('https://d8j0ntlcm91z4.cloudfront.net/user_3CEJb1vs8I6xgnavY3H6CRY4bSJ/hf_20260915_081447_70ad87e7-29a2-4c17-94d6-02871420d66f.png') center/cover no-repeat",
          }}
        >
          <div
            style={{
              position: 'absolute',
              inset: 0,
              background:
                'linear-gradient(0deg, #242C47 20%, rgba(36,44,71,.82) 65%, rgba(101,146,197,.2) 100%)',
            }}
          />
          <div className="wrap" style={{ position: 'relative', padding: '72px 32px 64px', color: 'var(--paper)' }}>
            <div
              style={{
                fontSize: '11.5px',
                color: 'var(--blue-bright)',
                fontWeight: 700,
                letterSpacing: '0.08em',
                marginBottom: '12px',
              }}
            >
              READY TO PROOF YOUR APPAREL?
            </div>
            <h2
              style={{
                fontFamily: 'var(--font-title)',
                fontWeight: 400,
                letterSpacing: '0.01em',
                fontSize: 'clamp(32px, 5.2vw, 62px)',
                lineHeight: 1.15,
                maxWidth: '720px',
                marginBottom: '20px',
                color: 'var(--paper)',
                textShadow: '0 2px 18px rgba(0,0,0,.5)',
              }}
            >
              One proof. No surprises. What you design is what gets printed.
            </h2>
            <p
              style={{
                fontSize: '15px',
                lineHeight: 1.6,
                maxWidth: '560px',
                color: 'rgba(240, 238, 230, 0.85)',
                marginBottom: '32px',
              }}
            >
              Over 12,000 garment runs proofed without a single misprint. Contact us directly or launch the 3D Studio workstation.
            </p>

            <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap', alignItems: 'center' }}>
              <Link
                href="/studio"
                className="btn btn-primary"
                style={{
                  background: 'var(--paper)',
                  color: 'var(--ink)',
                  borderColor: 'var(--paper)',
                  borderRadius: '999px',
                  padding: '14px 34px',
                  fontSize: '15px',
                  boxShadow: '0 8px 24px rgba(0,0,0,0.3)',
                }}
              >
                <Sparkles size={16} color="#6592C5" />
                <span>Launch 3D Studio &mdash; Try It Now</span>
                <ArrowRight size={16} />
              </Link>

              {/* Direct WhatsApp CTA Button as Requested by Client */}
              <a
                href="https://wa.me/?text=Hello%20ORICAN,%20I%20would%20like%20to%20proof%20a%20garment%20design"
                target="_blank"
                rel="noopener noreferrer"
                className="btn-whatsapp"
                title="Discuter directement sur WhatsApp avec l'équipe ORICAN"
              >
                <MessageCircle size={18} />
                <span>Contact via WhatsApp</span>
              </a>

              <a
                href="#garments"
                onClick={(e) => {
                  e.preventDefault();
                  if (lenis) {
                    lenis.scrollTo('#garments', { duration: 1.2 });
                  } else {
                    document.getElementById('garments')?.scrollIntoView({ behavior: 'smooth' });
                  }
                }}
                className="btn ghost"
                style={{
                  color: 'var(--paper)',
                  borderColor: 'rgba(240, 238, 230, 0.4)',
                  borderRadius: '999px',
                  padding: '14px 26px',
                  fontSize: '14px',
                }}
              >
                <span>View All Silhouettes</span>
              </a>
            </div>
          </div>
        </section>

        {/* ================= 10. STUDIO FOOTER WITH WHATSAPP ================= */}
        <footer
          className="landing-footer"
          style={{
            background: 'var(--navy-deep)',
            color: 'rgba(240,238,230,.75)',
            borderTop: '1.5px solid rgba(101,146,197,.3)',
            padding: '44px 0 54px',
            position: 'relative',
            zIndex: 10,
          }}
        >
          <div className="wrap" style={{ display: 'flex', flexDirection: 'column', gap: '20px', width: '100%' }}>
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                width: '100%',
                flexWrap: 'wrap',
                gap: '16px',
                alignItems: 'center',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <span
                  style={{
                    fontWeight: 400,
                    fontFamily: 'var(--font-title)',
                    fontSize: '20px',
                    color: 'var(--paper)',
                    letterSpacing: '.04em',
                  }}
                >
                  ORICAN
                </span>
                <span style={{ fontSize: '12px', color: 'rgba(240,238,230,0.5)' }}>
                  Industrial 3D Garment Proofing Studio
                </span>
              </div>

              {/* Direct WhatsApp Channel in Footer as Requested by Client ("footer avec whatsapp + n°") */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '16px', flexWrap: 'wrap' }}>
                <a
                  href="https://wa.me/?text=Hello%20ORICAN%20Support"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="footer-whatsapp-pill"
                >
                  <MessageCircle size={14} color="#25D366" />
                  <span>WhatsApp : +1 (800) ORICAN-PRO</span>
                </a>

                <Link
                  href="/studio"
                  style={{
                    fontSize: '13px',
                    color: 'var(--blue)',
                    textDecoration: 'none',
                    fontWeight: 600,
                  }}
                >
                  3D Studio Workstation &rarr;
                </Link>
              </div>
            </div>

            <div style={{ fontSize: '11.5px', color: 'rgba(240,238,230,.45)', lineHeight: 1.6 }}>
              Curated 60-30-10 palette in Natural Linen (#F0EEE6), Slate Blue (#6592C5), and Midnight Slate (#242C47) &middot; Strict 2-font system (Boldonse &amp; Inter) &middot; &copy; {new Date().getFullYear()} ORICAN Studio. All rights reserved.
            </div>
          </div>
        </footer>
      </div>
    </>
  );
}
