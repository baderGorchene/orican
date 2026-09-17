'use client';

import React from 'react';
import { ArrowRight, Box, ShieldCheck } from 'lucide-react';

interface HeroSectionProps {
  onOpenStudio: () => void;
}

export const HeroSection: React.FC<HeroSectionProps> = ({ onOpenStudio }) => {
  return (
    <section
      style={{
        position: 'relative',
        minHeight: '85vh',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        textAlign: 'center',
        padding: '80px 24px 100px',
        overflow: 'hidden',
        background:
          'radial-gradient(120% 90% at 50% 8%, rgba(101, 146, 197, 0.22), transparent 60%), radial-gradient(90% 70% at 82% 90%, rgba(36, 44, 71, 0.08), transparent 55%), #F0EEE6',
      }}
    >
      {/* Background Decorative Rings */}
      <div
        style={{
          position: 'absolute',
          top: '48%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          width: 'min(780px, 92vw)',
          height: 'min(780px, 92vw)',
          borderRadius: '50%',
          border: '1.5px solid rgba(101, 146, 197, 0.25)',
          pointerEvents: 'none',
          boxShadow: '0 0 120px rgba(101, 146, 197, 0.12)',
        }}
      />
      <div
        style={{
          position: 'absolute',
          top: '48%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          width: 'min(560px, 70vw)',
          height: 'min(560px, 70vw)',
          borderRadius: '50%',
          background:
            'repeating-conic-gradient(rgba(101, 146, 197, 0.12) 0deg 0.5deg, transparent 0.5deg 6deg)',
          mask: 'radial-gradient(circle, transparent 0 62%, #000 63% 66%, transparent 67%)',
          WebkitMask:
            'radial-gradient(circle, transparent 0 62%, #000 63% 66%, transparent 67%)',
          pointerEvents: 'none',
          opacity: 0.7,
        }}
      />

      {/* Pill Badge */}
      <div
        className="glass-capsule"
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: '8px',
          padding: '8px 18px',
          marginBottom: '28px',
          fontSize: '12px',
          fontFamily: 'var(--font-mono)',
          color: 'var(--ink)',
          fontWeight: 600,
          letterSpacing: '0.04em',
        }}
      >
        <Box size={14} color="#6592C5" />
        <span>THREE.JS REAL-TIME PROOFING ENGINE</span>
      </div>

      {/* Main Headline */}
      <h1
        style={{
          fontFamily: 'var(--font-title)',
          fontSize: 'clamp(44px, 7vw, 88px)',
          fontWeight: 400,
          lineHeight: 1.15,
          letterSpacing: '0.01em',
          maxWidth: '900px',
          margin: '0 auto 20px',
          color: '#242C47',
        }}
      >
        Customize <span style={{ color: '#6592C5' }}>like a Pro.</span>
      </h1>

      {/* Subtitle */}
      <p
        style={{
          fontSize: 'clamp(16px, 1.35vw, 19px)',
          color: '#55627F',
          maxWidth: '620px',
          lineHeight: 1.65,
          margin: '0 auto 36px',
        }}
      >
        A live 3D layer between your file and the press. Upload your 3D design,
        nudge position, tune scale, and inspect the exact print boundary
        before going to production.
      </p>

      {/* Action Buttons */}
      <div
        style={{
          display: 'flex',
          gap: '16px',
          alignItems: 'center',
          justifyContent: 'center',
          flexWrap: 'wrap',
          zIndex: 2,
        }}
      >
        <button
          onClick={onOpenStudio}
          className="btn btn-primary"
          style={{ padding: '14px 32px', fontSize: '14px' }}
          id="hero-start-designing-btn"
        >
          Open 3D Proofing Studio
          <ArrowRight size={16} />
        </button>

        <a
          href="#shop"
          className="btn btn-secondary"
          style={{ padding: '14px 28px', fontSize: '14px' }}
        >
          Explore Blanks
        </a>
      </div>

      {/* Trust Badges under CTA */}
      <div
        style={{
          display: 'flex',
          gap: '24px',
          alignItems: 'center',
          marginTop: '44px',
          fontSize: '12px',
          color: '#55627F',
          fontFamily: 'var(--font-mono)',
        }}
      >
        <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <ShieldCheck size={14} color="#6592C5" /> 100% Organic Ringspun Cotton
        </span>
        <span>&bull;</span>
        <span>Sub-millimeter Print Registration</span>
        <span>&bull;</span>
        <span>Instant Vector & High-Res PNG Export</span>
      </div>
    </section>
  );
};
