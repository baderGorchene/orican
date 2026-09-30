'use client';

import React from 'react';
import { CheckCircle2 } from 'lucide-react';
import { PRINT_FEE } from '@/lib/constants';
import { GarmentColor, GarmentModel, GarmentSize } from '@/lib/types';

const SIZES = ['S', 'M', 'L', 'XL', '2XL'] as const;

const PRINT_TECHNIQUES = [
  {
    id: 'dtg',
    label: 'Direct-to-Garment (DTG)',
    desc: 'Full-color gamut with soft hand feel',
  },
  {
    id: 'screen',
    label: 'High-Density Screen Print',
    desc: 'Crisp plastisol opacity & edge definition',
  },
  {
    id: 'embroidery',
    label: 'Tactile Embroidery',
    desc: 'Direct needle stitch vector translation',
  },
] as const;

interface ControlsPanelProps {
  selectedModel: GarmentModel;
  selectedColor: GarmentColor;
  selectedSize: GarmentSize;
  printTechnique: 'dtg' | 'screen' | 'embroidery';
  scaleValue: number;
  loadedModelName: string | null;
  loadedTextureName: string | null;
  onColorSelect: (color: GarmentColor) => void;
  onSizeSelect: (size: GarmentSize) => void;
  onTechniqueSelect: (t: 'dtg' | 'screen' | 'embroidery') => void;
  onScaleChange: (val: number) => void;
  onMove: (dx: number, dy: number) => void;
  onResetPosition: () => void;
}

const sectionLabel: React.CSSProperties = {
  fontSize: '11px',
  color: '#6592C5',
  fontWeight: 700,
  letterSpacing: '0.06em',
  marginBottom: '8px',
};

export const ControlsPanel: React.FC<ControlsPanelProps> = ({
  selectedModel,
  selectedColor,
  selectedSize,
  printTechnique,
  scaleValue,
  loadedModelName,
  loadedTextureName,
  onColorSelect,
  onSizeSelect,
  onTechniqueSelect,
  onScaleChange,
  onMove,
  onResetPosition,
}) => {
  const blankCost = selectedModel.blankPrice;
  const licenseCost = selectedModel.price;
  const printCost = PRINT_FEE;
  const totalCost = (blankCost + licenseCost + printCost).toFixed(2);

  return (
    <aside
      style={{
        display: 'flex',
        flexDirection: 'column',
        borderLeft: '1.5px solid rgba(101, 146, 197, 0.22)',
        background: 'rgba(240, 238, 230, 0.75)',
        backdropFilter: 'blur(16px)',
        overflowY: 'auto',
        padding: '20px',
        gap: '20px',
      }}
    >
      {/* Loaded asset status */}
      {(loadedModelName || loadedTextureName) && (
        <div
          style={{
            padding: '10px 12px',
            borderRadius: '8px',
            background: 'rgba(101, 146, 197, 0.08)',
            border: '1px solid rgba(101, 146, 197, 0.2)',
            fontSize: '11.5px',
            display: 'flex',
            flexDirection: 'column',
            gap: '4px',
          }}
        >
          {loadedModelName && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#242C47' }}>
              <CheckCircle2 size={12} color="#6592C5" />
              <span>
                <strong>Mesh:</strong> {loadedModelName}
              </span>
            </div>
          )}
          {loadedTextureName && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#55627F' }}>
              <CheckCircle2 size={12} color="#6592C5" />
              <span>
                <strong>Texture:</strong> {loadedTextureName}
              </span>
            </div>
          )}
        </div>
      )}

      {/* Garment Color Swatches */}
      <div>
        <div style={sectionLabel}>GARMENT DYE FINISH</div>
        <div style={{ fontWeight: 700, fontSize: '13.5px', color: '#242C47', marginBottom: '10px' }}>
          {selectedColor.name}
        </div>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
          {selectedModel.availableColors.map((color) => {
            const isActive = selectedColor.id === color.id;
            return (
              <button
                key={color.id}
                onClick={() => onColorSelect(color)}
                title={color.name}
                style={{
                  width: '32px',
                  height: '32px',
                  borderRadius: '50%',
                  background: color.hex,
                  border: isActive ? '2.5px solid #6592C5' : '1.5px solid rgba(36,44,71,0.2)',
                  boxShadow: isActive
                    ? '0 0 0 2px #FFFFFF, 0 4px 10px rgba(36,44,71,0.2)'
                    : '0 2px 6px rgba(36,44,71,0.08)',
                  cursor: 'pointer',
                  transition: 'transform 0.15s ease',
                  transform: isActive ? 'scale(1.12)' : 'scale(1)',
                }}
              />
            );
          })}
        </div>
      </div>

      {/* Artwork Scale Slider */}
      <div
        style={{
          padding: '14px',
          borderRadius: '10px',
          background: '#FFFFFF',
          border: '1px solid rgba(101, 146, 197, 0.2)',
        }}
      >
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            fontSize: '11px',
            color: '#6592C5',
            fontWeight: 700,
            marginBottom: '8px',
          }}
        >
          <span>ARTWORK REGISTRATION SCALE</span>
          <span>{scaleValue}%</span>
        </div>
        <input
          type="range"
          min="0"
          max="100"
          value={scaleValue}
          onChange={(e) => onScaleChange(parseInt(e.target.value, 10))}
          style={{ width: '100%', accentColor: '#6592C5', cursor: 'pointer' }}
        />
      </div>

      {/* D-Pad Position Control */}
      <div
        style={{
          padding: '14px',
          borderRadius: '10px',
          background: '#FFFFFF',
          border: '1px solid rgba(101, 146, 197, 0.2)',
        }}
      >
        <div style={{ fontSize: '11px', color: '#6592C5', fontWeight: 700, marginBottom: '10px' }}>
          SUB-MM OFFSET (D-PAD)
        </div>
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(3, 34px)',
            gridTemplateRows: 'repeat(3, 34px)',
            gap: '6px',
            justifyContent: 'center',
            margin: '0 auto',
          }}
        >
          <div />
          <DPadBtn onClick={() => onMove(0, 1)} label="▲" />
          <div />
          <DPadBtn onClick={() => onMove(-1, 0)} label="◀" />
          <DPadBtn
            onClick={onResetPosition}
            label="•"
            style={{ background: '#6592C5', border: '1px solid #6592C5', color: '#FFFFFF' }}
          />
          <DPadBtn onClick={() => onMove(1, 0)} label="▶" />
          <div />
          <DPadBtn onClick={() => onMove(0, -1)} label="▼" />
          <div />
        </div>
      </div>

      {/* Garment Size */}
      <div>
        <div style={sectionLabel}>GARMENT BLANK SIZE</div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: '6px' }}>
          {SIZES.map((sz) => (
            <button
              key={sz}
              onClick={() => onSizeSelect(sz)}
              style={{
                padding: '8px 0',
                borderRadius: '8px',
                border: '1.5px solid',
                borderColor: selectedSize === sz ? '#242C47' : 'rgba(101, 146, 197, 0.3)',
                background: selectedSize === sz ? '#242C47' : '#FFFFFF',
                color: selectedSize === sz ? '#F0EEE6' : '#242C47',
                fontWeight: 700,
                fontSize: '12px',
                cursor: 'pointer',
                transition: 'all 0.15s ease',
              }}
            >
              {sz}
            </button>
          ))}
        </div>
      </div>

      {/* Print Technique */}
      <div>
        <div style={sectionLabel}>PRINT METHODOLOGY</div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
          {PRINT_TECHNIQUES.map((tech) => (
            <div
              key={tech.id}
              onClick={() => onTechniqueSelect(tech.id)}
              role="button"
              tabIndex={0}
              onKeyDown={(e) => e.key === 'Enter' && onTechniqueSelect(tech.id)}
              style={{
                padding: '10px 12px',
                borderRadius: '8px',
                border: '1px solid',
                borderColor:
                  printTechnique === tech.id ? '#6592C5' : 'rgba(101, 146, 197, 0.25)',
                background:
                  printTechnique === tech.id ? 'rgba(101, 146, 197, 0.12)' : '#FFFFFF',
                cursor: 'pointer',
              }}
            >
              <div style={{ fontSize: '12px', fontWeight: 700, color: '#242C47' }}>
                {tech.label}
              </div>
              <div style={{ fontSize: '10.5px', color: '#55627F' }}>{tech.desc}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Price Breakdown */}
      <div
        style={{
          padding: '16px',
          borderRadius: '12px',
          background: '#FFFFFF',
          border: '1.5px solid rgba(101, 146, 197, 0.3)',
          marginTop: 'auto',
        }}
      >
        <div style={{ fontSize: '11px', color: '#6592C5', fontWeight: 700, marginBottom: '10px' }}>
          INDUSTRIAL PRESS CALCULATION
        </div>
        <PriceLine label={`Blank (${selectedModel.name})`} value={`$${blankCost.toFixed(2)}`} />
        {licenseCost > 0 && (
          <PriceLine
            label="3D Model Pro License"
            value={`+$${licenseCost.toFixed(2)}`}
            accent="#DD0072"
          />
        )}
        <PriceLine label="Sub-mm Proofing & Registration" value={`$${printCost.toFixed(2)}`} />
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            paddingTop: '8px',
            borderTop: '1px solid rgba(101, 146, 197, 0.2)',
            fontSize: '15px',
            fontWeight: 800,
            color: '#242C47',
          }}
        >
          <span>Total Proof Sample:</span>
          <span>${totalCost}</span>
        </div>
      </div>
    </aside>
  );
};

/* ─── Helpers ─────────────────────────────────────────────────────────── */

const DPadBtn: React.FC<{
  onClick: () => void;
  label: string;
  style?: React.CSSProperties;
}> = ({ onClick, label, style }) => (
  <button
    onClick={onClick}
    style={{
      borderRadius: '6px',
      border: '1px solid rgba(101, 146, 197, 0.3)',
      background: '#F0EEE6',
      cursor: 'pointer',
      fontWeight: 700,
      ...style,
    }}
  >
    {label}
  </button>
);

const PriceLine: React.FC<{ label: string; value: string; accent?: string }> = ({
  label,
  value,
  accent = '#55627F',
}) => (
  <div
    style={{
      display: 'flex',
      justifyContent: 'space-between',
      fontSize: '12px',
      color: accent,
      marginBottom: '4px',
    }}
  >
    <span>{label}</span>
    <span>{value}</span>
  </div>
);
