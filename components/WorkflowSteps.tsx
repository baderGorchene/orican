import React from 'react';
import { UploadCloud, Box, CheckCheck } from 'lucide-react';

export const WorkflowSteps: React.FC = () => {
  const steps = [
    {
      icon: <UploadCloud size={28} color="#6592C5" />,
      num: 'STEP 01',
      title: 'Upload your design in 3D',
      desc: 'Drop an .OBJ 3D file or graphic texture directly onto any blank. It reads straight into the proof frame with normalized geometry.',
    },
    {
      icon: <Box size={28} color="#6592C5" />,
      num: 'STEP 02',
      title: 'The frame opens on the shirt',
      desc: 'Inspect a live 3D proof right on the garment &mdash; rotate around the contours, tune scale, and check chest bounds.',
    },
    {
      icon: <CheckCheck size={28} color="#6592C5" />,
      num: 'STEP 03',
      title: 'Approve, then it goes to press',
      desc: 'Once the proof looks right, the high-res clipped print file is what gets sent straight to the industrial press.',
    },
  ];

  return (
    <section
      style={{
        background: 'var(--paper-surface)',
        color: 'var(--ink)',
        padding: '90px 0',
        borderTop: '1.5px solid var(--line)',
      }}
    >
      <div className="wrap">
        <div style={{ marginBottom: '48px' }}>
          <div
            style={{
              fontFamily: 'var(--font-mono)',
              fontSize: '11px',
              color: 'var(--blue)',
              letterSpacing: '0.08em',
              marginBottom: '8px',
              fontWeight: 600,
            }}
          >
            PRECISION METHODOLOGY
          </div>
          <h2
            style={{
              fontFamily: 'var(--font-display)',
              fontSize: 'clamp(28px, 3.2vw, 40px)',
              fontWeight: 700,
              letterSpacing: '-0.02em',
              color: 'var(--ink)',
            }}
          >
            How the proof frame works.
          </h2>
        </div>

        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(3, 1fr)',
            gap: '36px',
          }}
          className="steps-grid"
        >
          {steps.map((s, i) => (
            <div
              key={i}
              style={{
                borderLeft: '2.5px solid var(--blue)',
                paddingLeft: '24px',
                display: 'flex',
                flexDirection: 'column',
              }}
            >
              <div style={{ marginBottom: '14px' }}>{s.icon}</div>
              <div
                style={{
                  fontFamily: 'var(--font-mono)',
                  fontSize: '11px',
                  color: 'var(--blue)',
                  fontWeight: 600,
                  marginBottom: '8px',
                }}
              >
                {s.num}
              </div>
              <h3
                style={{
                  fontFamily: 'var(--font-sans)',
                  fontSize: '18px',
                  fontWeight: 700,
                  color: 'var(--ink)',
                  marginBottom: '10px',
                }}
              >
                {s.title}
              </h3>
              <p
                style={{
                  fontSize: '13.5px',
                  lineHeight: 1.65,
                  color: 'var(--ink-soft)',
                }}
              >
                {s.desc}
              </p>
            </div>
          ))}
        </div>
      </div>

      <style jsx>{`
        @media (max-width: 860px) {
          .steps-grid {
            grid-template-columns: 1fr !important;
            gap: 32px !important;
          }
        }
      `}</style>
    </section>
  );
};
