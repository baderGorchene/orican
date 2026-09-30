'use client';

import React from 'react';
import { Box, FileImage, RotateCcw, Upload } from 'lucide-react';
import { GarmentModel } from '@/lib/types';

interface ViewportCanvasProps {
  canvasRef: React.RefObject<HTMLCanvasElement | null>;
  containerRef: React.RefObject<HTMLDivElement | null>;
  fileInputRef: React.RefObject<HTMLInputElement | null>;
  textureInputRef: React.RefObject<HTMLInputElement | null>;
  selectedModel: GarmentModel;
  toastMessage: string | null;
  onResetPosition: () => void;
  onOBJUpload: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onTextureUpload: (e: React.ChangeEvent<HTMLInputElement>) => void;
}

export const ViewportCanvas: React.FC<ViewportCanvasProps> = ({
  canvasRef,
  containerRef,
  fileInputRef,
  textureInputRef,
  selectedModel,
  toastMessage,
  onResetPosition,
  onOBJUpload,
  onTextureUpload,
}) => {
  return (
    <main
      ref={containerRef}
      style={{
        position: 'relative',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        overflow: 'hidden',
        background:
          'radial-gradient(130% 90% at 50% 12%, rgba(101, 146, 197, 0.15), transparent 60%), #F0EEE6',
      }}
    >
      {/* Hidden file inputs */}
      <input
        type="file"
        ref={fileInputRef}
        onChange={onOBJUpload}
        accept=".obj"
        style={{ display: 'none' }}
      />
      <input
        type="file"
        ref={textureInputRef}
        onChange={onTextureUpload}
        accept="image/*"
        style={{ display: 'none' }}
      />

      {/* WebGL Canvas */}
      <canvas
        ref={canvasRef}
        style={{ width: '100%', height: '100%', display: 'block', cursor: 'grab' }}
      />

      {/* Top info pill */}
      <div
        style={{
          position: 'absolute',
          top: '20px',
          left: '50%',
          transform: 'translateX(-50%)',
          display: 'flex',
          alignItems: 'center',
          gap: '12px',
          padding: '6px 16px',
          borderRadius: '999px',
          background: 'rgba(255, 255, 255, 0.88)',
          backdropFilter: 'blur(12px)',
          border: '1.5px solid rgba(101, 146, 197, 0.28)',
          boxShadow: '0 8px 24px -6px rgba(36, 44, 71, 0.12)',
          zIndex: 20,
          fontSize: '12px',
          fontWeight: 600,
          color: '#55627F',
          whiteSpace: 'nowrap',
        }}
      >
        <span style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#242C47' }}>
          <Box size={14} color="#6592C5" />
          {selectedModel.name}
        </span>
        <span style={{ color: 'rgba(101,146,197,0.4)' }}>|</span>
        <span>Sub-Millimeter Zone: {selectedModel.printZone.name}</span>
        <button
          onClick={onResetPosition}
          title="Reset View and Position"
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '4px',
            border: 'none',
            background: 'transparent',
            color: '#6592C5',
            cursor: 'pointer',
            fontWeight: 600,
            fontSize: '11px',
          }}
        >
          <RotateCcw size={12} />
          Reset
        </button>
      </div>

      {/* Bottom upload bar */}
      <div
        style={{
          position: 'absolute',
          bottom: '20px',
          left: '50%',
          transform: 'translateX(-50%)',
          display: 'flex',
          alignItems: 'center',
          gap: '10px',
          padding: '8px 18px',
          borderRadius: '999px',
          background: 'rgba(255, 255, 255, 0.92)',
          backdropFilter: 'blur(14px)',
          border: '1.5px solid rgba(101, 146, 197, 0.3)',
          boxShadow: '0 12px 30px -8px rgba(36, 44, 71, 0.14)',
          zIndex: 20,
          whiteSpace: 'nowrap',
        }}
      >
        <span style={{ fontSize: '11.5px', color: '#55627F', fontWeight: 600, marginRight: '6px' }}>
          Drag &amp; Drop file or:
        </span>

        <button
          onClick={() => fileInputRef.current?.click()}
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '6px',
            padding: '6px 14px',
            borderRadius: '999px',
            border: '1px solid rgba(101, 146, 197, 0.4)',
            background: '#FFFFFF',
            color: '#242C47',
            fontSize: '12px',
            fontWeight: 600,
            cursor: 'pointer',
          }}
        >
          <Upload size={12} color="#6592C5" />
          Upload .OBJ Mesh
        </button>

        <button
          onClick={() => textureInputRef.current?.click()}
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '6px',
            padding: '6px 14px',
            borderRadius: '999px',
            border: '1px solid rgba(101, 146, 197, 0.4)',
            background: '#FFFFFF',
            color: '#242C47',
            fontSize: '12px',
            fontWeight: 600,
            cursor: 'pointer',
          }}
        >
          <FileImage size={12} color="#6592C5" />
          Upload Graphic (PNG/JPG)
        </button>
      </div>

      {/* Toast notification */}
      {toastMessage && (
        <div
          style={{
            position: 'absolute',
            bottom: '80px',
            padding: '8px 20px',
            borderRadius: '999px',
            background: '#242C47',
            color: '#F0EEE6',
            fontSize: '12.5px',
            fontWeight: 600,
            boxShadow: '0 8px 20px rgba(36,44,71,0.25)',
            zIndex: 40,
            animation: 'fadeIn 0.2s ease',
            pointerEvents: 'none',
          }}
        >
          {toastMessage}
        </div>
      )}
    </main>
  );
};
