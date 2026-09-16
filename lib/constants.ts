import { GarmentColor, GarmentSize } from './types';

export const PLANE_WIDTH = 3.1;
export const PLANE_HEIGHT = 3.875;

export const PRINT_SIZE = {
  wFrac: 0.30,
  hFrac: 0.26,
};

export const PRINT_HALF_W = (PRINT_SIZE.wFrac * PLANE_WIDTH) / 2;
export const PRINT_HALF_H = (PRINT_SIZE.hFrac * PLANE_HEIGHT) / 2;
export const PRINT_BASE_CENTER = { x: 0, y: 0.29 };
export const MOVE_LIMITS = { x: PRINT_HALF_W - 0.05, y: PRINT_HALF_H - 0.05 };
export const MOVE_STEP = 0.16;

export const SHIRT_PATH_D =
  'M 121.8,23.38 C 96.7,36.08 74.5,47.88 72.4,49.58 C 66.2,54.58 62.9,60.38 30.6,122.68 L 0,181.88 L 0,192.58 L 0,203.28 L 4.2,207.28 C 7.5,210.38 20.3,216.98 58.5,235.38 L 108.5,259.58 L 109,372.48 C 109.5,484.78 109.5,485.48 111.6,490.08 C 114.3,495.88 119.3,501.58 124.9,505.18 L 129.4,507.98 L 254,507.98 L 378.6,507.98 L 383.1,505.18 C 388.7,501.58 393.7,495.88 396.4,490.08 C 398.5,485.48 398.5,484.78 399,372.58 L 399.5,259.58 L 449.5,235.48 C 487.9,216.88 500.5,210.38 503.8,207.28 L 508,203.28 L 508,192.58 L 508,181.88 L 477.3,122.68 C 444.8,59.88 441.9,54.68 436.1,49.88 C 434.1,48.28 411.6,36.38 386,23.48 L 339.5,-0.02 L 326.9,-0.02 C 319.9,-0.02 311.9,0.48 308.9,0.98 C 277.3,6.98 241.1,7.28 205.6,1.98 C 197.2,0.68 188.3,0.08 180.1,0.08 L 167.5,0.28 L 121.8,23.38 Z';

export const SHIRT_PATH_SIZE = { w: 508, h: 507.98 };

export const GARMENT_COLORS: GarmentColor[] = [
  {
    id: 'canvas-white',
    name: 'Canvas White',
    hex: '#F6F4EE',
    price: 14.0,
    textColor: '#17150F',
    description: 'Heavyweight organic ringspun jersey in warm natural white.',
  },
  {
    id: 'ink-black',
    name: 'Ink Black',
    hex: '#1B1C1E',
    price: 14.0,
    textColor: '#F6F4EE',
    description: 'Deep carbon garment-dyed finish with ultra-clean drape.',
  },
  {
    id: 'undyed-natural',
    name: 'Undyed Natural',
    hex: '#CBA97A',
    price: 15.0,
    textColor: '#17150F',
    description: 'Pure raw cotton with natural fleck and vintage paper tone.',
  },
  {
    id: 'cyan-proof',
    name: 'Electric Cyan',
    hex: '#00AEEF',
    price: 16.0,
    textColor: '#FFFFFF',
    description: 'Studio pigment wash with high saturation contrast.',
  },
  {
    id: 'magenta-proof',
    name: 'Process Magenta',
    hex: '#DD0072',
    price: 16.0,
    textColor: '#FFFFFF',
    description: 'Punchy vivid ink tone inspired by CMYK press proofs.',
  },
];

export const GARMENT_SIZES: GarmentSize[] = ['S', 'M', 'L', 'XL', '2XL'];

export const PRINT_FEE = 14.0; // Added to blank price for custom proofing
