'use client';

import React, { useState, useEffect } from 'react';
import { GARMENT_MODELS, PRINT_FEE, STANDARD_COLORS } from '@/lib/constants';
import { GarmentColor, GarmentModel, GarmentSize } from '@/lib/types';
import { useGarmentViewer } from '@/hooks/useGarmentViewer';
import { useStudioFilters } from '@/hooks/useStudioFilters';
import { StudioNavbar } from '@/components/studio/StudioNavbar';
import { ModelLibrary } from '@/components/studio/ModelLibrary';
import { ViewportCanvas } from '@/components/studio/ViewportCanvas';
import { ControlsPanel } from '@/components/studio/ControlsPanel';

export default function StudioPage() {
  const [selectedModel, setSelectedModel] = useState<GarmentModel>(GARMENT_MODELS[0]);
  const [selectedColor, setSelectedColor] = useState<GarmentColor>(STANDARD_COLORS[0]);
  const [selectedSize, setSelectedSize] = useState<GarmentSize>('L');
  const [printTechnique, setPrintTechnique] = useState<'dtg' | 'screen' | 'embroidery'>('dtg');

  const filters = useStudioFilters();
  const viewer = useGarmentViewer({ initialColor: selectedColor, initialModel: selectedModel });

  // Preload model/color from URL params (e.g. ?model=hoodie&color=%23DD0072)
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const params = new URLSearchParams(window.location.search);

    const modelParam = params.get('model');
    if (modelParam) {
      const found = GARMENT_MODELS.find((m) => m.id === modelParam);
      if (found) {
        setSelectedModel(found);
        viewer.handleModelSelect(found);
      }
    }

    const colorParam = params.get('color');
    if (colorParam) {
      const foundColor = STANDARD_COLORS.find(
        (c) => c.hex.toLowerCase() === colorParam.toLowerCase(),
      );
      if (foundColor) {
        setSelectedColor(foundColor);
        viewer.handleColorSelect(foundColor);
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleModelSelect = (model: GarmentModel) => {
    setSelectedModel(model);
    viewer.handleModelSelect(model);
    viewer.showToast(`Loaded ${model.name}`);
  };

  const handleColorSelect = (color: GarmentColor) => {
    setSelectedColor(color);
    viewer.handleColorSelect(color);
  };

  const totalCost = (
    selectedModel.blankPrice +
    selectedModel.price +
    PRINT_FEE
  ).toFixed(2);

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        width: '100vw',
        height: '100vh',
        overflow: 'hidden',
        background: '#F0EEE6',
        color: '#242C47',
        fontFamily: 'var(--font-sans)',
      }}
    >
      <StudioNavbar
        selectedModel={selectedModel}
        totalCost={totalCost}
        isExporting={viewer.isExporting}
        onExportMockup={() => viewer.handleExportMockup(selectedModel.id)}
        onExportPrintFile={() => viewer.handleExportPrintFile(selectedModel.id)}
      />

      {/* 3-column workstation body */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: '360px 1fr 340px',
          flex: 1,
          overflow: 'hidden',
        }}
      >
        <ModelLibrary
          filteredModels={filters.filteredModels}
          selectedModel={selectedModel}
          searchQuery={filters.searchQuery}
          tierFilter={filters.tierFilter}
          categoryFilter={filters.categoryFilter}
          onSearchChange={filters.setSearchQuery}
          onTierChange={filters.setTierFilter}
          onCategoryChange={filters.setCategoryFilter}
          onModelSelect={handleModelSelect}
        />

        <ViewportCanvas
          canvasRef={viewer.canvasRef}
          containerRef={viewer.containerRef}
          fileInputRef={viewer.fileInputRef}
          textureInputRef={viewer.textureInputRef}
          selectedModel={selectedModel}
          toastMessage={viewer.toastMessage}
          onResetPosition={viewer.handleResetPosition}
          onOBJUpload={viewer.handleOBJUpload}
          onTextureUpload={viewer.handleTextureUpload}
        />

        <ControlsPanel
          selectedModel={selectedModel}
          selectedColor={selectedColor}
          selectedSize={selectedSize}
          printTechnique={printTechnique}
          scaleValue={viewer.scaleValue}
          loadedModelName={viewer.loadedModelName}
          loadedTextureName={viewer.loadedTextureName}
          onColorSelect={handleColorSelect}
          onSizeSelect={setSelectedSize}
          onTechniqueSelect={setPrintTechnique}
          onScaleChange={viewer.handleScaleChange}
          onMove={viewer.handleMove}
          onResetPosition={viewer.handleResetPosition}
        />
      </div>
    </div>
  );
}
