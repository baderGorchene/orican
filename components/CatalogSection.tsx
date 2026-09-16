'use client';

import React from 'react';
import { Shirt, Check } from 'lucide-react';
import { GARMENT_COLORS } from '@/lib/constants';
import { GarmentColor } from '@/lib/types';

interface CatalogSectionProps {
  onSelectColor: (color: GarmentColor) => void;
}

export const CatalogSection: React.FC<CatalogSectionProps> = ({ onSelectColor }) => {
  return (
    <section
      id="shop"
      style={{
        background: '#050608',
        color: '#FFFFFF',
        padding: '90px 0',
        borderTop: '1px solid rgba(255, 255, 255, 0.08)',
      }}
    >
      <div className="wrap">
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'flex-end',
            marginBottom: '44px',
            flexWrap: 'wrap',
            gap: '16px',
          }}
        >
          <div>
            <div
              style={{
                fontFamily: 'var(--font-mono)',
                fontSize: '11px',
                color: 'var(--accent-orange)',
                letterSpacing: '0.08em',
                marginBottom: '8px',
              }}
            >
              PREMIUM GARMENT SELECTION
            </div>
            <h2
              style={{
                fontFamily: 'var(--font-display)',
                fontSize: 'clamp(28px, 3.2vw, 40px)',
                fontWeight: 700,
                letterSpacing: '-0.02em',
                color: '#FFFFFF',
              }}
            >
              Pick a blank to start on.
            </h2>
          </div>
          <p
            style={{
              fontSize: '14px',
              color: 'rgba(255, 255, 255, 0.6)',
              maxWidth: '340px',
              lineHeight: 1.6,
            }}
          >
            Every blank color opens the exact same 3D proof frame &mdash; your model and positioning carry
            over seamlessly.
          </p>
        </div>

        {/* Blank Cards Grid */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(3, 1fr)',
            gap: '24px',
          }}
          className="catalog-grid"
        >
          {GARMENT_COLORS.slice(0, 3).map((blank) => (
            <div
              key={blank.id}
              style={{
                background: 'rgba(255, 255, 255, 0.03)',
                border: '1px solid rgba(255, 255, 255, 0.12)',
                borderRadius: '8px',
                overflow: 'hidden',
                display: 'flex',
                flexDirection: 'column',
                transition: 'all 0.2s ease',
              }}
            >
              {/* Swatch Header */}
              <div
                style={{
                  height: '200px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  position: 'relative',
                  background:
                    'radial-gradient(circle at center, rgba(255,255,255,0.06), rgba(0,0,0,0.4))',
                }}
              >
                <div
                  style={{
                    position: 'absolute',
                    top: '12px',
                    left: '12px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                    background: 'rgba(5, 6, 8, 0.82)',
                    border: '1px solid rgba(255, 255, 255, 0.18)',
                    borderRadius: '20px',
                    padding: '5px 12px',
                    fontSize: '11px',
                    fontFamily: 'var(--font-mono)',
                    color: '#FFFFFF',
                  }}
                >
                  <Check size={12} color="#D9631E" />
                  100% Cotton &middot; 240 GSM
                </div>

                <Shirt
                  size={100}
                  color={blank.hex}
                  strokeWidth={1.2}
                  style={{
                    filter:
                      blank.id === 'ink-black'
                        ? 'drop-shadow(0 0 1px rgba(255,255,255,0.4))'
                        : 'drop-shadow(0 10px 20px rgba(0,0,0,0.4))',
                  }}
                />
              </div>

              {/* Body */}
              <div
                style={{
                  padding: '22px 24px',
                  borderTop: '1px solid rgba(255, 255, 255, 0.1)',
                  display: 'flex',
                  flexDirection: 'column',
                  flex: 1,
                }}
              >
                <div
                  style={{
                    fontFamily: 'var(--font-sans)',
                    fontSize: '18px',
                    fontWeight: 700,
                    color: '#FFFFFF',
                    marginBottom: '4px',
                  }}
                >
                  {blank.name}
                </div>
                <div
                  style={{
                    fontFamily: 'var(--font-mono)',
                    fontSize: '12px',
                    color: 'rgba(255, 255, 255, 0.6)',
                    marginBottom: '10px',
                  }}
                >
                  Blank &middot; ${blank.price.toFixed(2)} USD
                </div>
                <p
                  style={{
                    fontSize: '12.5px',
                    color: 'rgba(255, 255, 255, 0.55)',
                    lineHeight: 1.5,
                    marginBottom: '20px',
                    flex: 1,
                  }}
                >
                  {blank.description}
                </p>

                <button
                  onClick={() => onSelectColor(blank)}
                  className="btn btn-primary btn-small"
                  style={{ width: '100%', borderRadius: '4px' }}
                >
                  Customize {blank.name}
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      <style jsx>{`
        @media (max-width: 860px) {
          .catalog-grid {
            grid-template-columns: 1fr !important;
          }
        }
      `}</style>
    </section>
  );
};
