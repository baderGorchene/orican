import React from 'react';

export const StatsBar: React.FC = () => {
  const stats = [
    { value: '12K+', label: 'PROOFS GENERATED' },
    { value: '4.9', label: 'AVERAGE RATING' },
    { value: '98%', label: 'FIRST-PRINT ACCURACY' },
    { value: '24h', label: 'TURNAROUND SPEED' },
  ];

  return (
    <section
      style={{
        background: 'var(--paper-surface)',
        color: 'var(--ink)',
        borderTop: '1.5px solid var(--line)',
        borderBottom: '1.5px solid var(--line)',
        padding: '38px 0',
      }}
    >
      <div
        className="wrap"
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(4, 1fr)',
          gap: '24px',
          textAlign: 'left',
        }}
      >
        {stats.map((stat, i) => (
          <div
            key={i}
            style={{
              paddingLeft: i === 0 ? '0' : '28px',
              borderLeft: i === 0 ? 'none' : '1.5px solid var(--line)',
            }}
          >
            <div
              style={{
                fontFamily: 'var(--font-display)',
                fontSize: 'clamp(28px, 3.2vw, 42px)',
                fontWeight: 700,
                color: 'var(--ink)',
                lineHeight: 1.1,
              }}
            >
              {stat.value}
            </div>
            <div
              style={{
                fontFamily: 'var(--font-mono)',
                fontSize: '11px',
                color: 'var(--blue)',
                letterSpacing: '0.06em',
                marginTop: '6px',
                fontWeight: 600,
              }}
            >
              {stat.label}
            </div>
          </div>
        ))}
      </div>

      <style jsx>{`
        @media (max-width: 768px) {
          .wrap {
            grid-template-columns: repeat(2, 1fr) !important;
            row-gap: 32px !important;
          }
          .wrap > div {
            border-left: none !important;
            padding-left: 0 !important;
          }
        }
      `}</style>
    </section>
  );
};
