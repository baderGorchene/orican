'use client';

import React, { useState, useRef } from 'react';
import { X } from 'lucide-react';
import { GarmentColor, GarmentSize, ShirtViewerInstance } from '@/lib/types';
import { GARMENT_SIZES } from '@/lib/constants';
import { ThreeViewer } from './ThreeViewer';
import { ControlsPanel } from './ControlsPanel';
import { ResultView } from './ResultView';

interface ProofModalProps {
  isOpen: boolean;
  initialColor: GarmentColor;
  onClose: () => void;
}

export const ProofModal: React.FC<ProofModalProps> = ({
  isOpen,
  initialColor,
  onClose,
}) => {
  const [selectedColor, setSelectedColor] = useState<GarmentColor>(initialColor);
  const [selectedSize, setSelectedSize] = useState<GarmentSize>(GARMENT_SIZES[1]); // 'M'
  const [sizeSliderValue, setSizeSliderValue] = useState<number>(33);
  const [showingResult, setShowingResult] = useState<boolean>(false);
  const [mockupDataUrl, setMockupDataUrl] = useState<string>('');
  const [cropDataUrl, setCropDataUrl] = useState<string>('');
  const [toastMsg, setToastMsg] = useState<string | null>(null);
  const [modelName, setModelName] = useState<string | undefined>();
  const [textureName, setTextureName] = useState<string | undefined>();

  const viewerRef = useRef<ShirtViewerInstance | null>(null);
  const toastTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Sync initial color when opened
  React.useEffect(() => {
    setSelectedColor(initialColor);
    viewerRef.current?.setColor(initialColor.hex);
  }, [initialColor]);

  if (!isOpen) return null;

  const showToast = (msg: string, ms = 2400) => {
    setToastMsg(msg);
    if (toastTimerRef.current) clearTimeout(toastTimerRef.current);
    toastTimerRef.current = setTimeout(() => {
      setToastMsg(null);
    }, ms);
  };

  const handleColorChange = (color: GarmentColor) => {
    setSelectedColor(color);
    viewerRef.current?.setColor(color.hex);
  };

  const handleSliderChange = (val: number) => {
    setSizeSliderValue(val);
    viewerRef.current?.setDesignSize(val / 100);
  };

  const handleNudge = (dx: number, dy: number) => {
    viewerRef.current?.moveDesign(dx, dy);
  };

  const handleResetPosition = () => {
    viewerRef.current?.resetPosition();
    showToast('Position centered');
  };

  const handleGenerateProof = () => {
    if (!viewerRef.current) return;
    const mockup = viewerRef.current.exportMockupJPG();
    const crop = viewerRef.current.exportPrintFileCrop();
    setMockupDataUrl(mockup);
    setCropDataUrl(crop);
    setShowingResult(true);
  };

  const handleBackToEditor = () => {
    setShowingResult(false);
    setTimeout(() => {
      viewerRef.current?.resize();
    }, 50);
  };

  const handleOverlayClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  return (
    <div className="modal-overlay" onClick={handleOverlayClick}>
      <div className="studio-frame">
        {/* Corner Brackets */}
        <div className="corner-bracket tl" />
        <div className="corner-bracket tr" />
        <div className="corner-bracket bl" />
        <div className="corner-bracket br" />

        {/* Close Modal Button */}
        <button
          className="close-btn"
          onClick={onClose}
          title="Close Studio"
          aria-label="Close Studio"
        >
          <X size={18} />
        </button>

        {/* Viewport & Controls OR Result View */}
        {showingResult ? (
          <ResultView
            mockupDataUrl={mockupDataUrl}
            cropDataUrl={cropDataUrl}
            color={selectedColor}
            size={selectedSize}
            onBack={handleBackToEditor}
            onToast={showToast}
          />
        ) : (
          <>
            <ThreeViewer
              colorHex={selectedColor.hex}
              onViewerReady={(v) => {
                viewerRef.current = v;
              }}
              onToast={showToast}
              onModelLoaded={(name) => setModelName(name)}
              onTextureLoaded={(name) => setTextureName(name)}
            />

            <ControlsPanel
              selectedColor={selectedColor}
              onColorChange={handleColorChange}
              selectedSize={selectedSize}
              onSizeChange={setSelectedSize}
              sizeSliderValue={sizeSliderValue}
              onSliderChange={handleSliderChange}
              onNudge={handleNudge}
              onResetPosition={handleResetPosition}
              onGenerateProof={handleGenerateProof}
              modelName={modelName}
              textureName={textureName}
            />
          </>
        )}

        {/* Toast */}
        {toastMsg && <div className="studio-toast">{toastMsg}</div>}
      </div>
    </div>
  );
};
