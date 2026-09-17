import * as THREE from 'three';

export type GarmentCategory = 'tops' | 'bottoms' | 'outerwear';
export type ModelTier = 'base' | 'community' | 'paid';
export type GarmentSize = 'S' | 'M' | 'L' | 'XL' | '2XL';

export interface GarmentColor {
  id: string;
  name: string;
  hex: string;
  price: number;
  textColor?: string;
  description?: string;
}

export interface PrintZoneConfig {
  name: string; // e.g. "Chest Print", "Back Print", "Thigh Placement", "Left Pocket"
  wFrac: number; // fraction of plane width (e.g. 0.30)
  hFrac: number; // fraction of plane height (e.g. 0.26)
  center: { x: number; y: number }; // local offset in 3D plane
}

export interface GarmentModel {
  id: string;
  name: string;
  category: GarmentCategory;
  tier: ModelTier;
  price: number; // 0 for base, included/license for paid
  blankPrice: number; // Garment blank base cost (e.g. $14, $28, $38)
  description: string;
  silhouettePath: string; // SVG path d attribute
  pathSize: { w: number; h: number };
  planeWidth: number;
  planeHeight: number;
  printZone: PrintZoneConfig;
  availableColors: GarmentColor[];
  sizes: GarmentSize[];
  badge?: string; // "BASE", "COMMUNITY", "PRO $4.99"
  author?: string; // for community models
  gsm?: number; // fabric weight (e.g. 240, 380, 450)
  materialBlend?: string; // e.g. "100% Organic Ring-Spun Cotton"
  tags: string[];
}

export interface ScreenRect {
  left: number;
  right: number;
  top: number;
  bottom: number;
}

export interface ShirtViewerInstance {
  setColor: (color: string) => void;
  setGarmentModel?: (model: GarmentModel) => void;
  getGarmentModel?: () => GarmentModel;
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
