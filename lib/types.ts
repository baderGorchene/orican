import * as THREE from 'three';

export interface GarmentColor {
  id: string;
  name: string;
  hex: string;
  price: number;
  textColor?: string;
  description?: string;
}

export type GarmentSize = 'S' | 'M' | 'L' | 'XL' | '2XL';

export interface ScreenRect {
  left: number;
  right: number;
  top: number;
  bottom: number;
}

export interface ShirtViewerInstance {
  setColor: (color: string) => void;
  setDesignGeometry: (geometry: THREE.BufferGeometry, color?: string) => void;
  setDesignSize: (t: number) => void;
  moveDesign: (dx: number, dy: number) => void;
  panDesign: (dxLocal: number, dyLocal: number) => void;
  resetPosition: () => void;
  setDesignTexture: (img: HTMLImageElement) => void;
  exportMockupJPG: () => string;
  exportPrintFileCrop: () => string;
  resize: () => void;
  destroy: () => void;
}

export interface ProofDesignState {
  color: GarmentColor;
  size: GarmentSize;
  scaleSliderValue: number; // 0 to 100
  has3DDesign: boolean;
  hasTexture: boolean;
  modelName?: string;
  textureName?: string;
}
