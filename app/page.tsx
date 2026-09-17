'use client';

import React, { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import {
  ArrowRight,
  Box,
  Check,
  CheckCircle2,
  ChevronRight,
  ExternalLink,
  Layers,
  Palette,
  Rotate3d,
  Scissors,
  ShieldCheck,
  Sparkles,
} from 'lucide-react';
import { GARMENT_MODELS } from '@/lib/constants';
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

  // Category showcase active tab in landing page
  const [activeCategory, setActiveCategory] = useState<GarmentCategory>('tops');

  // Interactive color swatches for garment cards
  const [cardColors, setCardColors] = useState<Record<string, string>>({});

  const SWATCHES = [
    { id: 'white', name: 'Canvas White', hex: '#F6F4EE' },
    { id: 'black', name: 'Ink Black', hex: '#1B1C1E' },
    { id: 'natural', name: 'Undyed Natural', hex: '#CBA97A' },
    { id: 'cyan', name: 'Electric Cyan', hex: '#00AEEF' },
    { id: 'magenta', name: 'Process Magenta', hex: '#DD0072' },
  ];

  // Category tab switch smooth stagger
  useEffect(() => {
    const cards = document.querySelectorAll('#garments .card');
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
          const p = self.progress;
          const frameIdx = Math.min(
            TOTAL_FRAMES,
            Math.max(1, Math.round(p * (TOTAL_FRAMES - 1)) + 1)
          );
          if (frameIdx !== currentFrameIdx) {
            currentFrameIdx = frameIdx;
            renderFrame(frameIdx);
          }

          // Active angle chip sync
          const angleChips = document.querySelectorAll('.angle-chips-row .angle-chip');
          const activeAngleIdx = p >= 0.82 ? 3 : p >= 0.55 ? 2 : p >= 0.22 ? 1 : 0;
          angleChips.forEach((chip, idx) => {
            chip.classList.toggle('active', idx === activeAngleIdx);
          });
        },
      });

      // 2. Multi-phase hero narrative typography choreography
      const step0 = document.getElementById('stageStep0');
      const step1 = document.getElementById('stageStep1');
      const step2 = document.getElementById('stageStep2');
      const dots = document.querySelectorAll('.stage-step-indicators .step-dot');

      if (step0 && step1 && step2) {
        gsap.set(step0, { autoAlpha: 1, y: 0, filter: 'blur(0px)' });
        gsap.set([step1, step2], { autoAlpha: 0, y: 28, filter: 'blur(12px)' });

        const stageTl = gsap.timeline({
          scrollTrigger: {
            trigger: wrap,
            start: 'top top',
            end: 'bottom bottom',
            scrub: 0.5,
            onUpdate: (self) => {
              const p = self.progress;
              const activeDot = p >= 0.64 ? 2 : p >= 0.30 ? 1 : 0;
              dots.forEach((dot, idx) => {
                dot.classList.toggle('active', idx === activeDot);
              });
            },
          },
        });

        // Phase 0: Holds until 0.26, then dissolves upward
        stageTl.to(
          step0,
          {
            autoAlpha: 0,
            y: -26,
            filter: 'blur(10px)',
            ease: 'power2.inOut',
            duration: 0.08,
          },
          0.26
        );

        // Phase 1: Enters from below 0.30 to 0.38
        stageTl.fromTo(
          step1,
          { autoAlpha: 0, y: 26, filter: 'blur(10px)' },
          {
            autoAlpha: 1,
            y: 0,
            filter: 'blur(0px)',
            ease: 'power2.inOut',
            duration: 0.08,
          },
          0.30
        );

        // Phase 1: Dissolves upward 0.58 to 0.66
        stageTl.to(
          step1,
          {
            autoAlpha: 0,
            y: -26,
            filter: 'blur(10px)',
            ease: 'power2.inOut',
            duration: 0.08,
          },
          0.58
        );

        // Phase 2: Enters from below 0.62 to 0.70
        stageTl.fromTo(
          step2,
          { autoAlpha: 0, y: 26, filter: 'blur(10px)' },
          {
            autoAlpha: 1,
            y: 0,
            filter: 'blur(0px)',
            ease: 'power2.inOut',
            duration: 0.08,
          },
          0.62
        );
      }

      // 3. Scroll-triggered section reveals for solid sections below
      document.querySelectorAll('.scroll-reveal-section').forEach((sec) => {
        ScrollTrigger.create({
          trigger: sec,
          start: 'top 86%',
          once: true,
          onEnter: () => sec.classList.add('is-revealed'),
        });
      });

      // 4. Tactile magnetic button hover micro-interactions
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

    // Angle Chips Click: Rotate to presets
    const angleChips = document.querySelectorAll('.angle-chips-row .angle-chip');
    const handleAngleClick = (e: Event) => {
      const btn = e.currentTarget as HTMLElement;
      const angle = btn.getAttribute('data-angle');
      if (!wrap) return;
      const scrollable = wrap.offsetHeight - window.innerHeight;
      const angleRatios: Record<string, number> = {
        '0': 0.02,
        '90': 0.33,
        '180': 0.66,
        '270': 0.95,
      };
      const ratio = angleRatios[angle || '0'] ?? 0.02;
      const targetScroll = wrap.offsetTop + scrollable * ratio;
      if (lenis) {
        lenis.scrollTo(targetScroll, { duration: 1.2 });
      } else {
        window.scrollTo({ top: targetScroll, behavior: 'smooth' });
      }
    };

    angleChips.forEach((chip) => {
      chip.addEventListener('click', handleAngleClick);
    });

    // Step dots navigation click
    const indicatorDots = document.querySelectorAll('.stage-step-indicators .step-dot');
    const handleDotClick = (e: Event) => {
      const dot = e.currentTarget as HTMLElement;
      const stepTarget = parseInt(dot.getAttribute('data-step') || '0', 10);
      if (!wrap) return;
      const scrollable = wrap.offsetHeight - window.innerHeight;
      const targetRatios = [0.06, 0.46, 0.82];
      const targetScroll = wrap.offsetTop + scrollable * targetRatios[stepTarget];
      if (lenis) {
        lenis.scrollTo(targetScroll, { duration: 1.2 });
      } else {
        window.scrollTo({ top: targetScroll, behavior: 'smooth' });
      }
    };

    indicatorDots.forEach((dot) => {
      dot.addEventListener('click', handleDotClick);
    });

    const handleResize = () => {
      resizeCanvas();
      ScrollTrigger.refresh();
    };

    window.addEventListener('resize', handleResize);

    return () => {
      clearTimeout(preloadTimer);
      angleChips.forEach((chip) => {
        chip.removeEventListener('click', handleAngleClick);
      });
      indicatorDots.forEach((dot) => {
        dot.removeEventListener('click', handleDotClick);
      });
      window.removeEventListener('resize', handleResize);
      ctx.revert();
    };
  }, [lenis]);

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
          id="scrubWrap"
          ref={scrubWrapRef}
          style={{ position: 'relative', height: '300vh', background: 'var(--paper)' }}
        >
          <section className="stage" ref={stageRef} style={{ position: 'sticky', top: 0, height: '100vh', background: 'var(--paper)' }}>
            <header className="stage-header" id="stageHeader">
              <Link className="stage-brand" id="stageBrand" href="/" aria-label="ORICAN Home">
                <svg viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <circle cx="16" cy="16" r="14" stroke="var(--blue)" strokeWidth="1.8" />
                  <path d="M16 4v24M4 16h24" stroke="var(--ink)" strokeWidth="1.5" strokeOpacity="0.8" />
                  <circle cx="16" cy="16" r="4" fill="var(--blue)" />
                </svg>
                <span className="stage-brand__name">ORICAN</span>
              </Link>

              <div className="stage-meta" id="stageMeta">
                <span id="stageMeta1">
                  <span
                    style={{
                      width: '7px',
                      height: '7px',
                      borderRadius: '50%',
                      backgroundColor: '#10B981',
                      boxShadow: '0 0 8px #10B981',
                      display: 'inline-block',
                    }}
                  />
                  Live 3D Press Engine
                </span>
                <span id="stageMeta2">Print what you actually designed</span>
              </div>

              <Link href="/studio" className="stage-try btn-magnetic" id="stageCustomize">
                <span>Launch 3D Studio</span>
                <ArrowRight size={14} style={{ marginLeft: '6px' }} />
              </Link>
            </header>

            {/* Split Editorial Hero: Left Copy, Right Unobstructed 3D Viewport */}
            <div className="hero-split-grid">
              {/* Left Column: Narrative Copy & Angle Deck */}
              <div className="hero-text-col">
                <div className="stage-copy-split">
                  {/* Prompt 1 */}
                  <div className="stage-step-split active" id="stageStep0">
                    <div className="phase-badge">
                      <span style={{ width: 6, height: 6, borderRadius: '50%', background: 'var(--blue)', display: 'inline-block' }} />
                      PHASE 01 // DIGITAL REGISTRATION
                    </div>
                    <h1 id="stageTitle0">
                      <span>Customize</span> <span>like a Pro</span>
                    </h1>
                    <p id="stageCaption0">
                      A real-time 3D simulation bridge connecting digital 3D meshes &amp; vector art directly to industrial screen print and DTG presses with sub-millimeter registration.
                    </p>
                    <div>
                      <Link href="/studio" className="btn-hero-primary btn-magnetic">
                        <Sparkles size={16} color="var(--blue)" />
                        <span>Enter 3D Studio &mdash; Try It Free</span>
                        <ArrowRight size={15} />
                      </Link>
                    </div>
                  </div>

                  {/* Prompt 2 */}
                  <div className="stage-step-split" id="stageStep1">
                    <div className="phase-badge">
                      <Rotate3d size={12} color="var(--blue)" />
                      PHASE 02 // 360&deg; HARDWARE CAD
                    </div>
                    <h1 id="stageTitle1">
                      <span>Rotate &amp; Inspect</span> <span>in 360&deg;</span>
                    </h1>
                    <p id="stageCaption1">
                      Audit garment drape, studio lighting, seam interactions, and hardware clipping boundaries from every rotational angle before a single drop of ink touches fabric.
                    </p>
                    <div>
                      <Link href="/studio" className="btn-hero-primary btn-magnetic">
                        <Rotate3d size={16} color="var(--blue)" />
                        <span>Inspect in 3D Studio</span>
                        <ArrowRight size={15} />
                      </Link>
                    </div>
                  </div>

                  {/* Prompt 3 */}
                  <div className="stage-step-split" id="stageStep2">
                    <div className="phase-badge">
                      <Layers size={12} color="var(--blue)" />
                      PHASE 03 // FULL SILHOUETTES
                    </div>
                    <h1 id="stageTitle2">
                      <span>Beyond T-Shirts:</span> <span>Hoodies &amp; Pants</span>
                    </h1>
                    <p id="stageCaption2">
                      Extend your apparel line across full silhouettes&mdash;hoodies with kangaroo pocket offsets, relaxed sweatpants, cargo trousers, and weather-resistant outerwear.
                    </p>
                    <div>
                      <Link href="/studio" className="btn-hero-primary btn-magnetic">
                        <Layers size={16} color="var(--blue)" />
                        <span>Try Multi-Garment Studio</span>
                        <ArrowRight size={15} />
                      </Link>
                    </div>
                  </div>
                </div>

                {/* Angle Chips Deck */}
                <div className="angle-chips-deck">
                  <div className="angle-chips-title">
                    <Rotate3d size={12} />
                    <span>360&deg; Camera Presets</span>
                  </div>
                  <div className="angle-chips-row" aria-label="Camera angle presets">
                    <button type="button" className="angle-chip active" data-angle="0">
                      0&deg; Front
                    </button>
                    <button type="button" className="angle-chip" data-angle="90">
                      90&deg; &frac34; Drape
                    </button>
                    <button type="button" className="angle-chip" data-angle="180">
                      180&deg; Profile
                    </button>
                    <button type="button" className="angle-chip" data-angle="270">
                      270&deg; Back
                    </button>
                  </div>

                  {/* Step Navigation Dots */}
                  <div className="stage-step-indicators" aria-label="Hero scrub phases">
                    <button
                      type="button"
                      className="step-dot active"
                      data-step="0"
                      aria-label="Phase 1: Customize like a Pro"
                    />
                    <button
                      type="button"
                      className="step-dot"
                      data-step="1"
                      aria-label="Phase 2: Rotate and Inspect"
                    />
                    <button
                      type="button"
                      className="step-dot"
                      data-step="2"
                      aria-label="Phase 3: Extended Garment Proofing"
                    />
                  </div>
                </div>
              </div>

              {/* Right Column: Clean 70% Width, Full Screen Height 3D Video Scrub (Zero Decoration) */}
              <div className="hero-canvas-col">
                <canvas
                  ref={scrubCanvasRef}
                  id="heroScrubCanvas"
                  style={{
                    position: 'absolute',
                    inset: 0,
                    width: '100%',
                    height: '100%',
                    display: 'block',
                  }}
                />
              </div>
            </div>
          </section>
        </div>

        {/* ================= 1. STATS METRICS BAR ================= */}
        <section
          className="scroll-reveal-section section-solid-linen"
          id="statsSection"
          style={{ color: 'var(--ink)', padding: '40px 0 48px' }}
        >
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

        {/* ================= 2. MULTI-GARMENT EXTENSION SHOWCASE ================= */}
        <section
          className="scroll-reveal-section section-solid-linen"
          id="garments"
          style={{ color: 'var(--ink)', padding: '80px 0 88px' }}
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
                marginBottom: '36px',
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

            {/* Multi-Garment Grid */}
            <div className="grid">
              {categoryModels.map((model, idx) => {
                const activeColor = cardColors[model.id] || '#F6F4EE';
                return (
                  <div
                    key={model.id}
                    className="card stagger-item"
                    style={{
                      '--item-idx': idx,
                      background: '#FFFFFF',
                      border: '1.5px solid rgba(101, 146, 197, 0.28)',
                      borderRadius: '14px',
                      overflow: 'hidden',
                      boxShadow: '0 12px 32px -8px rgba(36, 44, 71, 0.08)',
                    } as React.CSSProperties}
                  >
                    <div
                      className="swatch"
                      style={{
                        background: activeColor === '#1B1C1E' ? '#222429' : activeColor === '#00AEEF' ? 'rgba(0, 174, 239, 0.12)' : activeColor === '#DD0072' ? 'rgba(221, 0, 114, 0.12)' : 'rgba(232, 228, 218, 0.7)',
                        transition: 'background 0.3s ease',
                      }}
                    >
                      <div
                        style={{
                          display: 'flex',
                          flexDirection: 'column',
                          alignItems: 'center',
                          justifyContent: 'center',
                          gap: '8px',
                        }}
                      >
                        <Box size={54} color="#6592C5" />
                        <span
                          style={{
                            fontSize: '11px',
                            color: activeColor === '#1B1C1E' ? '#E8E4DA' : 'var(--ink-soft)',
                            fontFamily: 'var(--font-sans)',
                            fontWeight: 600,
                          }}
                        >
                          {model.printZone.name}
                        </span>
                      </div>
                      <div
                        className="material-badge"
                        style={{
                          background: 'rgba(240,238,230,.94)',
                          borderColor: 'var(--blue)',
                          color: 'var(--ink)',
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

                    <div className="body" style={{ borderColor: 'var(--line)', padding: '20px' }}>
                      <div
                        style={{
                          display: 'flex',
                          justifyContent: 'space-between',
                          alignItems: 'center',
                          marginBottom: '4px',
                        }}
                      >
                        <div className="name" style={{ color: 'var(--ink)', margin: 0, fontSize: '17px', fontWeight: 600 }}>
                          {model.name}
                        </div>
                        <span
                          style={{
                            fontSize: '13px',
                            fontWeight: 700,
                            color: 'var(--blue)',
                          }}
                        >
                          ${model.blankPrice.toFixed(2)}
                        </span>
                      </div>
                      <div className="price" style={{ color: 'var(--ink-soft)', marginBottom: '14px', fontSize: '13px' }}>
                        {model.description}
                      </div>

                      {/* Interactive Color Swatches */}
                      <div style={{ marginBottom: '14px' }}>
                        <div style={{ fontSize: '11px', fontWeight: 600, color: 'var(--ink-soft)', marginBottom: '6px' }}>
                          Available Blank Colors:
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
          </div>
        </section>

        {/* ================= 3. 3D MODELS ECOSYSTEM (DEEP MIDNIGHT SLATE) ================= */}
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
                Pick from production-standard blanks, community streetwear meshes, or commercial pro CAD master files.
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

        {/* ================= 4. GARMENT SCRUTINY SECTION (DEEP MIDNIGHT SLATE) ================= */}
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

        {/* ================= 5. METHODOLOGY WORKFLOW ================= */}
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
                  From 3D digital proof to physical press
                </h2>
              </div>
              <p style={{ color: 'var(--ink-soft)' }}>
                Four precision steps that eliminate printing errors before production.
              </p>
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

        {/* ================= 6. EDITORIAL STORY BANNER WITH "TRY IT" CTA ================= */}
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
              Over 12,000 garment runs proofed without a single misprint. No credit card, registration, or software download required.
            </p>

            <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap' }}>
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

        {/* ================= 7. STUDIO FOOTER ================= */}
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
          <div className="wrap" style={{ display: 'flex', flexDirection: 'column', gap: '16px', width: '100%' }}>
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                width: '100%',
                flexWrap: 'wrap',
                gap: '12px',
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

              <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
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
                <span style={{ fontSize: '11px', color: 'var(--blue)', fontFamily: 'var(--font-sans)' }}>
                  Direct WebGL Engine Active
                </span>
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
