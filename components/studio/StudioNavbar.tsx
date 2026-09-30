'use client';

import React from 'react';
import Link from 'next/link';
import { ArrowLeft, Download, Sparkles } from 'lucide-react';
import { GarmentModel } from '@/lib/types';

interface StudioNavbarProps {
  selectedModel: GarmentModel;
  totalCost: string;
  isExporting: boolean;
  onExportMockup: () => void;
  onExportPrintFile: () => void;
}

export const StudioNavbar: React.FC<StudioNavbarProps> = ({
  selectedModel,
  totalCost,
  isExporting,
  onExportMockup,
  onExportPrintFile,
}) => {
  return (
    <header
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '12px 24px',
        borderBottom: '1.5px solid rgba(101, 146, 197, 0.25)',
        background: 'rgba(240, 238, 230, 0.94)',
        backdropFilter: 'blur(16px)',
        WebkitBackdropFilter: 'blur(16px)',
        zIndex: 30,
        flexShrink: 0,
      }}
    >
      {/* Left: Back link + Breadcrumb */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
        <Link
          href="/"
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '8px',
            color: '#242C47',
            textDecoration: 'none',
            fontSize: '13px',
            fontWeight: 600,
            padding: '6px 14px',
            borderRadius: '999px',
            border: '1px solid rgba(101, 146, 197, 0.3)',
            background: '#FFFFFF',
            transition: 'all 0.2s ease',
          }}
        >
          <ArrowLeft size={14} />
          <span>Overview</span>
        </Link>

        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span
            style={{
              fontFamily: 'var(--font-title)',
              fontSize: '18px',
              fontWeight: 400,
              color: '#242C47',
              letterSpacing: '0.02em',
            }}
          >
            ORICAN
          </span>
          <span style={{ color: '#6592C5', fontSize: '13px', fontWeight: 600 }}>/</span>
          <span style={{ fontSize: '13px', fontWeight: 700, color: '#242C47' }}>
            3D PROOFING STUDIO
          </span>
          <span
            style={{
              fontSize: '10px',
              padding: '2px 8px',
              borderRadius: '999px',
              background:
                selectedModel.tier === 'paid'
                  ? 'rgba(221, 0, 114, 0.12)'
                  : 'rgba(101, 146, 197, 0.15)',
              color: selectedModel.tier === 'paid' ? '#DD0072' : '#6592C5',
              fontWeight: 700,
              letterSpacing: '0.04em',
            }}
          >
            {selectedModel.badge || selectedModel.tier.toUpperCase()}
          </span>
        </div>
      </div>

      {/* Right: Cost pill + Export actions */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '12px',
            padding: '6px 16px',
            borderRadius: '999px',
            background: '#FFFFFF',
            border: '1.5px solid rgba(101, 146, 197, 0.3)',
            fontSize: '13px',
          }}
        >
          <span style={{ color: '#55627F' }}>Press Proof Total:</span>
          <span style={{ fontWeight: 800, color: '#242C47', fontSize: '15px' }}>
            ${totalCost}
          </span>
        </div>

        <button
          onClick={onExportMockup}
          disabled={isExporting}
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '8px',
            padding: '8px 18px',
            borderRadius: '999px',
            background: '#FFFFFF',
            border: '1.5px solid #242C47',
            color: '#242C47',
            fontSize: '13px',
            fontWeight: 600,
            cursor: isExporting ? 'not-allowed' : 'pointer',
            opacity: isExporting ? 0.6 : 1,
            transition: 'all 0.2s ease',
          }}
        >
          <Download size={14} />
          <span>Export Mockup</span>
        </button>

        <button
          onClick={onExportPrintFile}
          disabled={isExporting}
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '8px',
            padding: '8px 20px',
            borderRadius: '999px',
            background: '#242C47',
            border: '1.5px solid #242C47',
            color: '#F0EEE6',
            fontSize: '13px',
            fontWeight: 600,
            cursor: isExporting ? 'not-allowed' : 'pointer',
            opacity: isExporting ? 0.6 : 1,
            boxShadow: '0 4px 14px rgba(36, 44, 71, 0.18)',
            transition: 'all 0.2s ease',
          }}
        >
          <Sparkles size={14} color="#6592C5" />
          <span>RIP Print File (PNG)</span>
        </button>
      </div>
    </header>
  );
};
