'use client';

import React, { useEffect, useRef, useState } from 'react';
import { Sparkles } from 'lucide-react';
import { GARMENT_COLORS } from '@/lib/constants';
import { GarmentColor, ShirtViewerInstance } from '@/lib/types';
import { createShirtViewer } from '@/lib/three-shirt-engine';

interface LiveStudioSectionProps {
  onCustomize: (color: GarmentColor) => void;
}

export const LiveStudioSection: React.FC<LiveStudioSectionProps> = ({ onCustomize }) => {
  const [selectedColor, setSelectedColor] = useState<GarmentColor>(GARMENT_COLORS[0]);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const viewerRef = useRef<ShirtViewerInstance | null>(null);

  useEffect(() => {
    if (!canvasRef.current) return;

    const viewer = createShirtViewer(canvasRef.current, {
      color: selectedColor.hex,
      exportable: false,
    });
    viewerRef.current = viewer;

    return () => {
      viewer.destroy();
      viewerRef.current = null;
    };
  }, []);

  const handleColorSelect = (color: GarmentColor) => {
    setSelectedColor(color);
    viewerRef.current?.setColor(color.hex);
  };

  return (
    <section
      style={{
        background: 'var(--paper)',
        color: 'var(--ink)',
        padding: '90px 0',
        borderTop: '1.5px solid var(--line)',
        position: 'relative',
      }}
    >
      <div
        className="wrap"
        style={{
          display: 'grid',
          gridTemplateColumns: '1.05fr 0.95fr',
          gap: '64px',
          alignItems: 'center',
        }}
      >
        {/* 3D Canvas Preview Window */}
        <div
          style={{
            position: 'relative',
            width: '100%',
            maxWidth: '460px',
            aspectRatio: '1 / 1',
            margin: '0 auto',
            borderRadius: '16px',
            background: 'var(--white)',
            border: '1.5px solid var(--blue)',
            boxShadow: '0 20px 48px -12px rgba(36, 44, 71, 0.16)',
            overflow: 'hidden',
          }}
        >
          <canvas
            ref={canvasRef}
            style={{ width: '100%', height: '100%', display: 'block' }}
            id="live-studio-mini-canvas"
          />

          {/* Interactive Tag */}
          <div
            style={{
              position: 'absolute',
              bottom: '16px',
              left: '16px',
              background: 'rgba(240, 238, 230, 0.95)',
              border: '1px solid var(--blue)',
              backdropFilter: 'blur(8px)',
              padding: '6px 12px',
              borderRadius: '6px',
              fontSize: '11px',
              fontFamily: 'var(--font-mono)',
              color: 'var(--ink)',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              fontWeight: 600,
            }}
          >
            <span
              style={{
                width: '8px',
                height: '8px',
                borderRadius: '50%',
                backgroundColor: selectedColor.hex,
                boxShadow: `0 0 8px ${selectedColor.hex}`,
                border: selectedColor.hex === '#F6F4EE' ? '1px solid #C0D2E5' : 'none',
              }}
            />
            {selectedColor.name} &middot; Real-time Mesh
          </div>
        </div>

        {/* Text & Color Controls */}
        <div>
          <div
            style={{
              display: 'inline-block',
              fontFamily: 'var(--font-mono)',
              fontSize: '11px',
              color: 'var(--blue)',
              letterSpacing: '0.08em',
              fontWeight: 600,
              marginBottom: '12px',
            }}
          >
            INTERACTIVE PREVIEW
          </div>

          <h2
            style={{
              fontFamily: 'var(--font-display)',
              fontSize: 'clamp(32px, 3.6vw, 46px)',
              fontWeight: 700,
              lineHeight: 1.15,
              color: 'var(--ink)',
              marginBottom: '16px',
            }}
          >
            Design it live, right here.
          </h2>

          <p
            style={{
              fontSize: '15px',
              lineHeight: 1.7,
              color: 'var(--ink-soft)',
              maxWidth: '460px',
              marginBottom: '32px',
            }}
          >
            Pick a garment blank color and watch the 3D surface update instantly with realistic
            shadows and fabric draping. Open the proofing studio to drop your own 3D models or
            graphics onto this blank.
          </p>

          {/* Color Selector */}
          <div style={{ marginBottom: '36px' }}>
            <div
              style={{
                fontFamily: 'var(--font-mono)',
                fontSize: '11px',
                color: 'var(--blue)',
                marginBottom: '14px',
                letterSpacing: '0.04em',
                fontWeight: 600,
              }}
            >
              SELECT BLANK COLOR:
            </div>

            <div style={{ display: 'flex', gap: '14px', alignItems: 'center', flexWrap: 'wrap' }}>
              {GARMENT_COLORS.slice(0, 4).map((c) => {
                const isActive = selectedColor.id === c.id;
                return (
                  <button
                    key={c.id}
                    onClick={() => handleColorSelect(c)}
                    style={{
                      width: '38px',
                      height: '38px',
                      borderRadius: '50%',
                      backgroundColor: c.hex,
                      border: isActive
                        ? '3px solid var(--blue)'
                        : '2px solid rgba(101, 146, 197, 0.35)',
                      boxShadow: isActive
                        ? '0 0 0 3px rgba(240,238,230,0.9), 0 0 16px rgba(101,146,197,0.5)'
                        : '0 2px 8px rgba(36,44,71,0.15)',
                      cursor: 'pointer',
                      transition: 'all 0.15s ease',
                      transform: isActive ? 'scale(1.1)' : 'scale(1)',
                    }}
                    title={c.name}
                    aria-label={`Select ${c.name}`}
                  />
                );
              })}
            </div>
          </div>

          <button
            onClick={() => onCustomize(selectedColor)}
            className="btn btn-primary"
            style={{ padding: '14px 28px' }}
            id="live-studio-customize-btn"
          >
            <Sparkles size={16} />
            Customize with this blank
          </button>
        </div>
      </div>

      <style jsx>{`
        @media (max-width: 860px) {
          .wrap {
            grid-template-columns: 1fr !important;
            gap: 40px !important;
          }
        }
      `}</style>
    </section>
  );
};
