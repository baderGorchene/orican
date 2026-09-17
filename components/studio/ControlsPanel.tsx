'use client';

import React from 'react';
import {
  ArrowUp,
  ArrowDown,
  ArrowLeft,
  ArrowRight,
  Dot,
  Minus,
  Plus,
  ArrowRightCircle,
  ShoppingBag,
} from 'lucide-react';
import { GARMENT_COLORS, GARMENT_SIZES, PRINT_FEE } from '@/lib/constants';
import { GarmentColor, GarmentSize } from '@/lib/types';

interface ControlsPanelProps {
  selectedColor: GarmentColor;
  onColorChange: (color: GarmentColor) => void;
  selectedSize: GarmentSize;
  onSizeChange: (size: GarmentSize) => void;
  sizeSliderValue: number;
  onSliderChange: (val: number) => void;
  onNudge: (dx: number, dy: number) => void;
  onResetPosition: () => void;
  onGenerateProof: () => void;
  modelName?: string;
  textureName?: string;
}

export const ControlsPanel: React.FC<ControlsPanelProps> = ({
  selectedColor,
  onColorChange,
  selectedSize,
  onSizeChange,
  sizeSliderValue,
  onSliderChange,
  onNudge,
  onResetPosition,
  onGenerateProof,
  modelName,
  textureName,
}) => {
  const totalPrice = selectedColor.price + PRINT_FEE;

  return (
    <div className="studio-controls">
      {/* Title & Product Info */}
      <div>
        <h3>{selectedColor.name}</h3>
        <div className="sub">
          Heavyweight organic cotton. Proof updates live as you manipulate the 3D model.
        </div>
      </div>

      {/* Upload Status Card if items loaded */}
      {(modelName || textureName) && (
        <div
          style={{
            background: 'rgba(36, 44, 71, 0.05)',
            border: '1px solid var(--line)',
            borderRadius: '4px',
            padding: '10px 14px',
            fontSize: '11.5px',
            fontFamily: 'var(--font-mono)',
            display: 'flex',
            flexDirection: 'column',
            gap: '4px',
          }}
        >
          {modelName && (
            <div style={{ color: 'var(--ink)' }}>
              <strong>3D Model:</strong> {modelName}
            </div>
          )}
          {textureName && (
            <div style={{ color: 'var(--ink-soft)' }}>
              <strong>Texture:</strong> {textureName}
            </div>
          )}
        </div>
      )}

      {/* Garment Color Swatches */}
      <div>
        <div className="field-label">GARMENT COLOR</div>
        <div className="color-picker-row">
          {GARMENT_COLORS.map((c) => {
            const isActive = selectedColor.id === c.id;
            return (
              <button
                key={c.id}
                className={`color-dot ${isActive ? 'active' : ''}`}
                style={{
                  backgroundColor: c.hex,
                  border: c.hex === '#F6F4EE' ? '1px solid var(--line)' : 'none',
                }}
                onClick={() => onColorChange(c)}
                title={c.name}
                aria-label={`Select ${c.name}`}
              />
            );
          })}
        </div>
      </div>

      {/* Design Size Slider */}
      <div>
        <div className="field-label">DESIGN SCALE</div>
        <div className="slider-container">
          <Minus size={14} color="var(--ink-soft)" />
          <input
            type="range"
            min="0"
            max="100"
            value={sizeSliderValue}
            onChange={(e) => onSliderChange(Number(e.target.value))}
            aria-label="Design scale slider"
          />
          <Plus size={14} color="var(--ink-soft)" />
        </div>
      </div>

      {/* Positioning Nudge D-Pad */}
      <div>
        <div className="field-label">POSITION OFFSET (PRINT AREA BOUNDS)</div>
        <div className="dpad-grid">
          <button
            className="dpad-btn up"
            onClick={() => onNudge(0, 1)}
            title="Move Up"
            aria-label="Nudge Up"
          >
            <ArrowUp size={15} />
          </button>
          <button
            className="dpad-btn left"
            onClick={() => onNudge(-1, 0)}
            title="Move Left"
            aria-label="Nudge Left"
          >
            <ArrowLeft size={15} />
          </button>
          <button
            className="dpad-btn center"
            onClick={onResetPosition}
            title="Center Reset"
            aria-label="Center Reset"
          >
            <Dot size={18} color="#6592C5" />
          </button>
          <button
            className="dpad-btn right"
            onClick={() => onNudge(1, 0)}
            title="Move Right"
            aria-label="Nudge Right"
          >
            <ArrowRight size={15} />
          </button>
          <button
            className="dpad-btn down"
            onClick={() => onNudge(0, -1)}
            title="Move Down"
            aria-label="Nudge Down"
          >
            <ArrowDown size={15} />
          </button>
        </div>
      </div>

      {/* Garment Size Selection */}
      <div>
        <div className="field-label">GARMENT SIZE</div>
        <div className="sizes-row">
          {GARMENT_SIZES.map((size) => (
            <button
              key={size}
              className={`size-pill ${selectedSize === size ? 'active' : ''}`}
              onClick={() => onSizeChange(size)}
            >
              {size}
            </button>
          ))}
        </div>
      </div>

      {/* Next: Generate Proof */}
      <div>
        <button
          onClick={onGenerateProof}
          className="btn btn-dark"
          style={{ width: '100%', padding: '14px', borderRadius: '4px' }}
          id="controls-next-btn"
        >
          Generate High-Res Proof
          <ArrowRightCircle size={16} />
        </button>
      </div>

      {/* Price & Cart row */}
      <div className="price-checkout-row">
        <div>
          <div className="price-val">${totalPrice.toFixed(2)}</div>
          <div className="sub" style={{ margin: 0 }}>
            Blank (${selectedColor.price.toFixed(2)}) + 3D Proof (${PRINT_FEE.toFixed(2)})
          </div>
        </div>

        <button
          onClick={onGenerateProof}
          className="btn btn-primary btn-small"
          style={{ borderRadius: '4px' }}
        >
          <ShoppingBag size={14} />
          Approve Proof
        </button>
      </div>
    </div>
  );
};
