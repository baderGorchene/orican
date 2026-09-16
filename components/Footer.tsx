import React from 'react';

export const Footer: React.FC = () => {
  return (
    <footer
      style={{
        background: '#050608',
        color: 'rgba(255, 255, 255, 0.55)',
        borderTop: '1px solid rgba(255, 255, 255, 0.08)',
        padding: '40px 0 50px',
        fontSize: '13px',
      }}
    >
      <div
        className="wrap"
        style={{
          display: 'flex',
          flexDirection: 'column',
          gap: '16px',
        }}
      >
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            flexWrap: 'wrap',
            gap: '12px',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span
              style={{
                fontFamily: 'var(--font-sans)',
                fontWeight: 700,
                color: '#FFFFFF',
                letterSpacing: '0.04em',
              }}
            >
              ORICAN
            </span>
            <span>&mdash; High-Precision Print-on-Demand Studio</span>
          </div>
          <div style={{ fontFamily: 'var(--font-mono)', fontSize: '11px' }}>
            Next.js + Three.js Proofing Pipeline &middot; v2.0
          </div>
        </div>

        <div
          style={{
            fontSize: '11px',
            color: 'rgba(255, 255, 255, 0.35)',
            lineHeight: 1.6,
          }}
        >
          Curated typography in Inter, IBM Plex Mono, Manrope, & Poppins. Photography via Unsplash
          &middot; Custom 3D vector-mapped garment engine &middot; &copy; {new Date().getFullYear()}{' '}
          ORICAN Studio. All rights reserved.
        </div>
      </div>
    </footer>
  );
};
