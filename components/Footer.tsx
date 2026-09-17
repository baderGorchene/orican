import React from 'react';

export const Footer: React.FC = () => {
  return (
    <footer
      style={{
        background: 'var(--navy)',
        color: 'rgba(240, 238, 230, 0.75)',
        borderTop: '1.5px solid rgba(101, 146, 197, 0.3)',
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
                fontFamily: 'var(--font-title)',
                fontWeight: 400,
                color: 'var(--paper)',
                letterSpacing: '0.04em',
                fontSize: '18px',
              }}
            >
              ORICAN
            </span>
            <span style={{ color: 'rgba(240, 238, 230, 0.7)' }}>&mdash; High-Precision Print-on-Demand Studio</span>
          </div>
          <div style={{ fontFamily: 'var(--font-mono)', fontSize: '11px', color: 'var(--blue)', fontWeight: 600 }}>
            Next.js + Three.js Proofing Pipeline &middot; v2.0
          </div>
        </div>

        <div
          style={{
            fontSize: '11px',
            color: 'rgba(240, 238, 230, 0.45)',
            lineHeight: 1.6,
          }}
        >
          Curated 60-30-10 palette: Natural Linen (#F0EEE6), Slate Blue (#6592C5), and Midnight Slate (#242C47)
          &middot; Custom 3D vector-mapped garment engine &middot; &copy; {new Date().getFullYear()}{' '}
          ORICAN Studio. All rights reserved.
        </div>
      </div>
    </footer>
  );
};
