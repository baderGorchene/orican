'use client';

import React from 'react';
import { Download, ArrowLeft, CheckCircle2, ShieldAlert } from 'lucide-react';
import { GarmentColor, GarmentSize } from '@/lib/types';

interface ResultViewProps {
  mockupDataUrl: string;
  cropDataUrl: string;
  color: GarmentColor;
  size: GarmentSize;
  onBack: () => void;
  onToast: (msg: string) => void;
}

export const ResultView: React.FC<ResultViewProps> = ({
  mockupDataUrl,
  cropDataUrl,
  color,
  size,
  onBack,
  onToast,
}) => {
  const handleDownload = (dataUrl: string, filename: string) => {
    if (!dataUrl) return;
    const link = document.createElement('a');
    link.href = dataUrl;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    onToast(`Downloaded ${filename}`);
  };

  return (
    <div
      style={{
        background: 'var(--paper)',
        color: 'var(--ink)',
        padding: '32px',
        display: 'flex',
        flexDirection: 'column',
        width: '100%',
        minHeight: '520px',
        maxHeight: '85vh',
        overflowY: 'auto',
      }}
    >
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: '1.2fr 0.8fr',
          gap: '36px',
          alignItems: 'start',
        }}
        className="result-grid"
      >
        {/* Left: Final Composite Mockup */}
        <div>
          <div className="field-label" style={{ marginBottom: '12px' }}>
            FINAL FLAT PRODUCT MOCKUP
          </div>
          <div
            style={{
              position: 'relative',
              width: '100%',
              borderRadius: '6px',
              border: '1px solid var(--line)',
              background: '#FFFFFF',
              overflow: 'hidden',
              boxShadow: '0 16px 36px -12px rgba(0,0,0,0.15)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            {mockupDataUrl ? (
              <img
                src={mockupDataUrl}
                alt="Final Composite Shirt Mockup"
                style={{
                  width: '100%',
                  maxHeight: '480px',
                  objectFit: 'contain',
                  display: 'block',
                }}
              />
            ) : (
              <div style={{ padding: '60px', color: 'var(--ink-soft)' }}>
                Generating Mockup...
              </div>
            )}
          </div>
        </div>

        {/* Right: Print Area Crop & Download Actions */}
        <div style={{ display: 'flex', flexDirection: 'column' }}>
          <div
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              fontFamily: 'var(--font-mono)',
              fontSize: '11px',
              color: '#6592C5',
              fontWeight: 600,
              marginBottom: '6px',
            }}
          >
            <CheckCircle2 size={14} color="#6592C5" />
            PROOF ACCURACY CERTIFIED
          </div>

          <h3
            style={{
              fontFamily: 'var(--font-title)',
              fontSize: '26px',
              fontWeight: 400,
              letterSpacing: '0.01em',
              marginBottom: '8px',
              color: 'var(--ink)',
            }}
          >
            Ready for the Press.
          </h3>

          <p
            style={{
              fontSize: '13px',
              color: 'var(--ink-soft)',
              lineHeight: 1.6,
              marginBottom: '20px',
            }}
          >
            Here is your exact cropped print file and flat product proof. This bounded print boundary
            matches our press calibration 1-to-1.
          </p>

          {/* Garment Summary Pill */}
          <div
            style={{
              background: 'var(--paper-surface)',
              border: '1px solid var(--line)',
              borderRadius: '4px',
              padding: '10px 14px',
              fontSize: '12px',
              fontFamily: 'var(--font-mono)',
              marginBottom: '20px',
              display: 'flex',
              justifyContent: 'space-between',
            }}
          >
            <span>
              <strong>Garment:</strong> {color.name}
            </span>
            <span>
              <strong>Size:</strong> {size}
            </span>
          </div>

          {/* Print Area Preview */}
          <div className="field-label" style={{ marginBottom: '8px' }}>
            ISOLATED PRINT AREA FILE (HIGH-RES)
          </div>
          <div
            style={{
              width: '180px',
              aspectRatio: '1 / 1',
              borderRadius: '4px',
              border: '1px solid var(--line)',
              background: '#FFFFFF',
              overflow: 'hidden',
              marginBottom: '28px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            {cropDataUrl ? (
              <img
                src={cropDataUrl}
                alt="Print Area Crop File"
                style={{
                  width: '100%',
                  height: '100%',
                  objectFit: 'contain',
                  display: 'block',
                }}
              />
            ) : (
              <div style={{ fontSize: '11px', color: 'var(--ink-soft)' }}>Generating Crop...</div>
            )}
          </div>

          {/* Download Action Buttons */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            <button
              onClick={() => handleDownload(mockupDataUrl, `orican-${color.id}-mockup.jpg`)}
              className="btn btn-dark"
              style={{ width: '100%' }}
            >
              <Download size={16} />
              Download JPG Mockup
            </button>

            <button
              onClick={() => handleDownload(cropDataUrl, `orican-print-area-${color.id}.png`)}
              className="btn btn-ghost"
              style={{ width: '100%' }}
            >
              <Download size={16} />
              Download Print Area File (PNG)
            </button>

            <button
              onClick={onBack}
              className="btn btn-ghost"
              style={{ width: '100%', border: 'none' }}
            >
              <ArrowLeft size={16} />
              Back to 3D Editor
            </button>
          </div>
        </div>
      </div>

      <style jsx>{`
        @media (max-width: 860px) {
          .result-grid {
            grid-template-columns: 1fr !important;
            gap: 28px !important;
          }
        }
      `}</style>
    </div>
  );
};
