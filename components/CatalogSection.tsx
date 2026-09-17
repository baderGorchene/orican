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
        background: 'var(--paper)',
        color: 'var(--ink)',
        padding: '90px 0',
        borderTop: '1.5px solid var(--line)',
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
                color: 'var(--blue)',
                letterSpacing: '0.08em',
                marginBottom: '8px',
                fontWeight: 600,
              }}
            >
              PREMIUM GARMENT SELECTION
            </div>
            <h2
              style={{
                fontFamily: 'var(--font-title)',
                fontSize: 'clamp(32px, 3.6vw, 46px)',
                fontWeight: 400,
                letterSpacing: '0.01em',
                color: 'var(--ink)',
              }}
            >
              Pick a blank to start on.
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
                background: 'var(--white)',
                border: '1.5px solid var(--line)',
                borderRadius: '8px',
                overflow: 'hidden',
                display: 'flex',
                flexDirection: 'column',
                boxShadow: '0 12px 30px -12px rgba(36, 44, 71, 0.12)',
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
                  background: 'var(--paper-surface)',
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
                    background: 'rgba(240, 238, 230, 0.92)',
                    border: '1px solid var(--blue)',
                    borderRadius: '20px',
                    padding: '5px 12px',
                    fontSize: '11px',
                    fontFamily: 'var(--font-mono)',
                    color: 'var(--ink)',
                    fontWeight: 600,
                  }}
                >
                  <Check size={12} color="#6592C5" />
                  100% Cotton &middot; 240 GSM
                </div>

                <Shirt
                  size={100}
                  color={blank.hex}
                  strokeWidth={1.2}
                  style={{
                    filter:
                      blank.id === 'ink-black'
                        ? 'drop-shadow(0 4px 12px rgba(36,44,71,0.25))'
                        : 'drop-shadow(0 6px 14px rgba(36,44,71,0.14))',
                  }}
                />
              </div>

              {/* Body */}
              <div
                style={{
                  padding: '22px 24px',
                  borderTop: '1.5px solid var(--line)',
                  display: 'flex',
                  flexDirection: 'column',
                  flex: 1,
                }}
              >
                <div
                  style={{
                    fontFamily: 'var(--font-title)',
                    fontSize: '20px',
                    fontWeight: 400,
                    letterSpacing: '0.01em',
                    color: 'var(--ink)',
                    marginBottom: '4px',
                  }}
                >
                  {blank.name}
                </div>
                <div
                  style={{
                    fontFamily: 'var(--font-mono)',
                    fontSize: '12px',
                    color: 'var(--ink-soft)',
                    marginBottom: '10px',
                    fontWeight: 500,
                  }}
                >
                  Blank &middot; ${blank.price.toFixed(2)} USD
                </div>
                <p
                  style={{
                    fontSize: '12.5px',
                    color: 'var(--ink-soft)',
                    lineHeight: 1.5,
                    marginBottom: '20px',
                    flex: 1,
                  }}
                >
                  {blank.description}
                </p>

                <button
                  onClick={() => onSelectColor(blank)}
                  className="btn btn-primary"
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
