import React from 'react';
import Image from 'next/image';

export const ScrutinyGallery: React.FC = () => {
  const images = [
    {
      src: 'https://d8j0ntlcm91z4.cloudfront.net/user_3CEJb1vs8I6xgnavY3H6CRY4bSJ/hf_20260915_082744_f9db9841-0a2f-47d8-a71f-6054f288935c.png',
      alt: 'Macro detail of embroidered logo on white cotton t-shirt',
      title: 'Embroidered Emblem',
      caption: 'Tight 3D thread density with zero puckering on ringspun cotton.',
    },
    {
      src: 'https://d8j0ntlcm91z4.cloudfront.net/user_3CEJb1vs8I6xgnavY3H6CRY4bSJ/hf_20260915_082744_aeb7a148-4bf4-4cba-a335-123d93a5d9db.png',
      alt: 'Folded white t-shirt showing fabric weave and seam stitching',
      title: 'Double-Needle Hem & Weave',
      caption: '240 GSM combed jersey with micro-knit smooth face finish.',
    },
    {
      src: 'https://d8j0ntlcm91z4.cloudfront.net/user_3CEJb1vs8I6xgnavY3H6CRY4bSJ/hf_20260915_082744_6506c085-41fe-4e67-b573-93c71e87b9a8.png',
      alt: 'Close-up of white t-shirt collar with embroidered emblem',
      title: 'Bound Collar Construction',
      caption: '1x1 rib collar designed to retain shape after 100+ wash cycles.',
    },
  ];

  return (
    <section
      style={{
        background: 'var(--paper-surface)',
        color: 'var(--ink)',
        padding: '80px 0',
        borderTop: '1.5px solid var(--line)',
      }}
    >
      <div className="wrap">
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'flex-end',
            marginBottom: '40px',
            flexWrap: 'wrap',
            gap: '16px',
          }}
        >
          <div>
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
              GARMENT SCRUTINY
            </div>
            <h2
              style={{
                fontFamily: 'var(--font-title)',
                fontSize: 'clamp(32px, 3.6vw, 44px)',
                fontWeight: 400,
                letterSpacing: '0.01em',
                color: 'var(--ink)',
              }}
            >
              Built for scrutiny.
            </h2>
          </div>
          <p
            style={{
              fontSize: '14px',
              color: 'var(--ink-soft)',
              maxWidth: '340px',
              lineHeight: 1.6,
            }}
          >
            The premium blank up close &mdash; weave density, tension stitching, and direct-to-garment
            ink affinity.
          </p>
        </div>

        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(3, 1fr)',
            gap: '24px',
          }}
          className="scrutiny-grid"
        >
          {images.map((img, i) => (
            <div
              key={i}
              style={{
                borderRadius: '12px',
                overflow: 'hidden',
                background: 'var(--white)',
                border: '1.5px solid var(--line)',
                display: 'flex',
                flexDirection: 'column',
                boxShadow: '0 8px 24px -8px rgba(36,44,71,.1)',
                transition: 'transform 0.2s ease, border-color 0.2s ease',
              }}
            >
              <div
                style={{
                  position: 'relative',
                  width: '100%',
                  aspectRatio: '16 / 10',
                  overflow: 'hidden',
                }}
              >
                <Image
                  src={img.src}
                  alt={img.alt}
                  fill
                  sizes="(max-width: 768px) 100vw, 33vw"
                  style={{ objectFit: 'cover' }}
                />
              </div>
              <div style={{ padding: '20px' }}>
                <h3
                  style={{
                    fontFamily: 'var(--font-title)',
                    fontSize: '18px',
                    fontWeight: 400,
                    letterSpacing: '0.01em',
                    marginBottom: '6px',
                    color: 'var(--ink)',
                  }}
                >
                  {img.title}
                </h3>
                <p
                  style={{
                    fontSize: '12.5px',
                    color: 'var(--ink-soft)',
                    lineHeight: 1.5,
                  }}
                >
                  {img.caption}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>

      <style jsx>{`
        @media (max-width: 860px) {
          .scrutiny-grid {
            grid-template-columns: 1fr !important;
          }
        }
      `}</style>
    </section>
  );
};
