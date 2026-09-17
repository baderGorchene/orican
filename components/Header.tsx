'use client';

import React from 'react';
import { Sparkles } from 'lucide-react';

interface HeaderProps {
  onOpenStudio: () => void;
}

export const Header: React.FC<HeaderProps> = ({ onOpenStudio }) => {
  return (
    <header
      style={{
        position: 'relative',
        zIndex: 40,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '22px 40px',
        borderBottom: '1.5px solid var(--line)',
        background: 'rgba(240, 238, 230, 0.9)',
        backdropFilter: 'blur(16px)',
        WebkitBackdropFilter: 'blur(16px)',
      }}
    >
      {/* Brand */}
      <a
        href="#"
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '12px',
          color: 'var(--ink)',
          textDecoration: 'none',
        }}
        aria-label="ORICAN Studio Home"
      >
        <svg
          viewBox="0 0 32 32"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          style={{ width: '28px', height: '28px' }}
        >
          <circle cx="16" cy="16" r="14" stroke="var(--blue)" strokeWidth="1.8" />
          <path d="M16 4v24M4 16h24" stroke="var(--ink)" strokeWidth="1.5" strokeOpacity="0.8" />
          <circle cx="16" cy="16" r="4" fill="var(--blue)" />
        </svg>
        <div style={{ display: 'flex', flexDirection: 'column' }}>
          <span
            style={{
              fontFamily: 'var(--font-sans)',
              fontWeight: 800,
              letterSpacing: '0.08em',
              fontSize: '18px',
              lineHeight: 1,
              color: 'var(--ink)',
            }}
          >
            ORICAN
          </span>
          <span
            style={{
              fontFamily: 'var(--font-mono)',
              fontSize: '9.5px',
              color: 'var(--blue)',
              letterSpacing: '0.06em',
              marginTop: '3px',
              fontWeight: 600,
            }}
          >
            STUDIO PROOFING
          </span>
        </div>
      </a>

      {/* Meta Indicators */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '32px',
          fontSize: '13px',
          color: 'var(--ink-soft)',
        }}
        className="header-meta"
      >
        <span style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span
            style={{
              width: '8px',
              height: '8px',
              borderRadius: '50%',
              backgroundColor: 'var(--blue)',
              boxShadow: '0 0 10px var(--blue)',
            }}
          />
          Direct Press Engine Active
        </span>
        <span style={{ color: 'var(--line-solid)' }}>|</span>
        <span>What you see is what gets printed</span>
      </div>

      {/* Action */}
      <button
        onClick={onOpenStudio}
        className="btn btn-primary"
        style={{ borderRadius: '999px', padding: '10px 22px' }}
        id="header-customize-btn"
      >
        <Sparkles size={15} />
        Customize a tee
      </button>

      <style jsx>{`
        @media (max-width: 820px) {
          .header-meta {
            display: none !important;
          }
          header {
            padding: 18px 20px !important;
          }
        }
      `}</style>
    </header>
  );
};
