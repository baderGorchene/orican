import { GarmentColor, GarmentModel, GarmentSize } from './types';

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

/* ============================================================
   SVG Silhouette Paths for Garment Archetypes
   ============================================================ */

// 1. Classic Crewneck T-Shirt (508 x 508)
export const SHIRT_PATH_D =
  'M 121.8,23.38 C 96.7,36.08 74.5,47.88 72.4,49.58 C 66.2,54.58 62.9,60.38 30.6,122.68 L 0,181.88 L 0,192.58 L 0,203.28 L 4.2,207.28 C 7.5,210.38 20.3,216.98 58.5,235.38 L 108.5,259.58 L 109,372.48 C 109.5,484.78 109.5,485.48 111.6,490.08 C 114.3,495.88 119.3,501.58 124.9,505.18 L 129.4,507.98 L 254,507.98 L 378.6,507.98 L 383.1,505.18 C 388.7,501.58 393.7,495.88 396.4,490.08 C 398.5,485.48 398.5,484.78 399,372.58 L 399.5,259.58 L 449.5,235.48 C 487.9,216.88 500.5,210.38 503.8,207.28 L 508,203.28 L 508,192.58 L 508,181.88 L 477.3,122.68 C 444.8,59.88 441.9,54.68 436.1,49.88 C 434.1,48.28 411.6,36.38 386,23.48 L 339.5,-0.02 L 326.9,-0.02 C 319.9,-0.02 311.9,0.48 308.9,0.98 C 277.3,6.98 241.1,7.28 205.6,1.98 C 197.2,0.68 188.3,0.08 180.1,0.08 L 167.5,0.28 L 121.8,23.38 Z';
export const SHIRT_PATH_SIZE = { w: 508, h: 507.98 };

// 2. Drop-Shoulder French Terry Hoodie (512 x 540)
export const HOODIE_PATH_D =
  'M 190,12 C 170,14 150,32 145,55 C 130,58 105,74 88,88 L 32,150 L 8,230 L 52,254 L 98,198 L 102,460 C 102,488 120,500 148,500 L 364,500 C 392,500 410,488 410,460 L 414,198 L 460,254 L 504,230 L 480,150 L 424,88 C 407,74 382,58 367,55 C 362,32 342,14 322,12 C 290,8 260,18 256,22 C 252,18 222,8 190,12 Z M 256,65 C 278,65 296,82 296,104 C 296,120 278,135 256,135 C 234,135 216,120 216,104 C 216,82 234,65 256,65 Z';
export const HOODIE_PATH_SIZE = { w: 512, h: 512 };

// 3. Relaxed Fleece Sweatpants & Cargo Pants (400 x 580)
export const PANTS_PATH_D =
  'M 120,10 L 280,10 C 292,10 300,20 300,32 L 320,150 L 332,490 C 334,510 320,526 300,526 L 244,526 C 228,526 216,512 216,494 L 210,240 C 208,220 192,220 190,240 L 184,494 C 184,512 172,526 156,526 L 100,526 C 80,526 66,510 68,490 L 80,150 L 100,32 C 100,20 108,10 120,10 Z';
export const PANTS_PATH_SIZE = { w: 400, h: 540 };

// 4. Technical Zip Windbreaker & Coach Jacket (520 x 520)
export const JACKET_PATH_D =
  'M 180,24 L 140,58 L 96,78 L 24,142 L 2,216 L 46,242 L 92,186 L 96,480 C 96,498 112,508 130,508 L 390,508 C 408,508 424,498 424,480 L 428,186 L 474,242 L 518,216 L 496,142 L 424,78 L 380,58 L 340,24 C 316,36 290,44 260,44 C 230,44 204,36 180,24 Z';
export const JACKET_PATH_SIZE = { w: 520, h: 520 };

/* ============================================================
   Garment Color Palettes
   ============================================================ */

export const STANDARD_COLORS: GarmentColor[] = [
  {
    id: 'canvas-white',
    name: 'Canvas White',
    hex: '#F6F4EE',
    price: 0,
    textColor: '#242C47',
    description: 'Heavyweight organic ringspun jersey in warm natural white.',
  },
  {
    id: 'ink-black',
    name: 'Ink Black',
    hex: '#1B1C1E',
    price: 0,
    textColor: '#F0EEE6',
    description: 'Deep carbon garment-dyed finish with ultra-clean drape.',
  },
  {
    id: 'undyed-natural',
    name: 'Undyed Natural',
    hex: '#CBA97A',
    price: 1.0,
    textColor: '#242C47',
    description: 'Pure raw cotton with natural fleck and vintage paper tone.',
  },
  {
    id: 'cyan-proof',
    name: 'Electric Cyan',
    hex: '#00AEEF',
    price: 2.0,
    textColor: '#FFFFFF',
    description: 'Studio pigment wash with high saturation contrast.',
  },
  {
    id: 'magenta-proof',
    name: 'Process Magenta',
    hex: '#DD0072',
    price: 2.0,
    textColor: '#FFFFFF',
    description: 'Punchy vivid ink tone inspired by CMYK press proofs.',
  },
  {
    id: 'slate-blue',
    name: 'Slate Blue',
    hex: '#6592C5',
    price: 2.0,
    textColor: '#FFFFFF',
    description: 'Structural slate blue pigment matching the ORICAN studio tint.',
  },
  {
    id: 'olive-drab',
    name: 'Vintage Olive',
    hex: '#4A5542',
    price: 2.0,
    textColor: '#F0EEE6',
    description: 'Earthy military olive wash with subtle weathered undertone.',
  },
];

export const GARMENT_COLORS = STANDARD_COLORS;
export const GARMENT_SIZES: GarmentSize[] = ['S', 'M', 'L', 'XL', '2XL'];
export const PRINT_FEE = 14.0; // Standard industrial proofing & plate setup fee

/* ============================================================
   3D Model Asset Catalog (Base / Community / Paid)
   ============================================================ */

export const GARMENT_MODELS: GarmentModel[] = [
  // --- BASE MODELS (Included / Free) ---
  {
    id: 'classic-tee',
    name: 'Classic Heavyweight Tee',
    category: 'tops',
    tier: 'base',
    price: 0,
    blankPrice: 14.0,
    description: 'Industrial-grade 240 GSM combed cotton crewneck with tailored collar ribbing.',
    silhouettePath: SHIRT_PATH_D,
    pathSize: SHIRT_PATH_SIZE,
    planeWidth: PLANE_WIDTH,
    planeHeight: PLANE_HEIGHT,
    printZone: {
      name: 'Center Chest Print',
      wFrac: 0.30,
      hFrac: 0.26,
      center: { x: 0, y: 0.29 },
    },
    availableColors: STANDARD_COLORS,
    sizes: GARMENT_SIZES,
    badge: 'BASE INCLUDED',
    gsm: 240,
    materialBlend: '100% Organic Ringspun Cotton',
    tags: ['Essential', 'Everyday Blank', 'Heavyweight', 'Boxy Shoulder'],
  },
  {
    id: 'french-terry-hoodie',
    name: 'French Terry Drop-Shoulder Hoodie',
    category: 'tops',
    tier: 'base',
    price: 0,
    blankPrice: 32.0,
    description: '450 GSM dense loopback French Terry with double-lined hood and seamless front pouch.',
    silhouettePath: HOODIE_PATH_D,
    pathSize: HOODIE_PATH_SIZE,
    planeWidth: 3.2,
    planeHeight: 3.9,
    printZone: {
      name: 'Chest & Pouch Zone',
      wFrac: 0.28,
      hFrac: 0.24,
      center: { x: 0, y: 0.15 },
    },
    availableColors: STANDARD_COLORS,
    sizes: GARMENT_SIZES,
    badge: 'BASE INCLUDED',
    gsm: 450,
    materialBlend: '100% Combed Heavy Cotton',
    tags: ['Heavyweight', 'French Terry', 'Double-Lined', 'Street Fit'],
  },
  {
    id: 'fleece-sweatpants',
    name: 'Relaxed Heavy Fleece Sweatpants',
    category: 'bottoms',
    tier: 'base',
    price: 0,
    blankPrice: 28.0,
    description: '380 GSM brushed interior fleece with gathered elastic cuffs and deep slash pockets.',
    silhouettePath: PANTS_PATH_D,
    pathSize: PANTS_PATH_SIZE,
    planeWidth: 2.8,
    planeHeight: 4.1,
    printZone: {
      name: 'Left Thigh Print',
      wFrac: 0.22,
      hFrac: 0.26,
      center: { x: -0.42, y: 0.45 },
    },
    availableColors: STANDARD_COLORS,
    sizes: GARMENT_SIZES,
    badge: 'BASE INCLUDED',
    gsm: 380,
    materialBlend: '80% Organic Cotton / 20% Recycled Poly',
    tags: ['Lounge', 'Tapered Cuff', 'Heavy Fleece', 'Unisex'],
  },

  // --- COMMUNITY MODELS (Open Streetwear & Experimental) ---
  {
    id: 'oversized-boxy-tee',
    name: 'Boxy Streetwear Oversized Tee',
    category: 'tops',
    tier: 'community',
    price: 0,
    blankPrice: 16.0,
    author: '@district_zero',
    description: 'Drop-shoulder relaxed cut with exaggerated sleeves and 1.25" thick ribbed neckband.',
    silhouettePath: SHIRT_PATH_D,
    pathSize: SHIRT_PATH_SIZE,
    planeWidth: 3.3,
    planeHeight: 3.85,
    printZone: {
      name: 'Oversized Front Graphic',
      wFrac: 0.32,
      hFrac: 0.28,
      center: { x: 0, y: 0.26 },
    },
    availableColors: STANDARD_COLORS,
    sizes: GARMENT_SIZES,
    badge: 'COMMUNITY',
    gsm: 280,
    materialBlend: '100% Vintage Washed Cotton',
    tags: ['Oversized', 'Streetwear', 'Drop Shoulder', 'Thick Collar'],
  },
  {
    id: 'vintage-washed-crewneck',
    name: 'Vintage Washed Crewneck Sweatshirt',
    category: 'tops',
    tier: 'community',
    price: 0,
    blankPrice: 29.0,
    author: '@sub_surface',
    description: 'Enzyme-washed 400 GSM terry featuring faded seam contrast and retro boxy silhouette.',
    silhouettePath: SHIRT_PATH_D,
    pathSize: SHIRT_PATH_SIZE,
    planeWidth: 3.15,
    planeHeight: 3.9,
    printZone: {
      name: 'Centered Chest Crest',
      wFrac: 0.26,
      hFrac: 0.24,
      center: { x: 0, y: 0.30 },
    },
    availableColors: STANDARD_COLORS,
    sizes: GARMENT_SIZES,
    badge: 'COMMUNITY',
    gsm: 400,
    materialBlend: '100% French Terry Cotton',
    tags: ['Vintage Wash', 'Crewneck', 'Subtle Distress', 'Retro Cut'],
  },
  {
    id: 'cotton-skate-shorts',
    name: 'Raw-Hem Cotton Skate Shorts',
    category: 'bottoms',
    tier: 'community',
    price: 0,
    blankPrice: 22.0,
    author: '@concrete_lab',
    description: 'Mid-thigh heavyweight cotton shorts with raw distressed hem and chunky drawstrings.',
    silhouettePath: PANTS_PATH_D,
    pathSize: PANTS_PATH_SIZE,
    planeWidth: 2.8,
    planeHeight: 3.4,
    printZone: {
      name: 'Right Hem Stamp',
      wFrac: 0.22,
      hFrac: 0.20,
      center: { x: 0.44, y: 0.32 },
    },
    availableColors: STANDARD_COLORS,
    sizes: GARMENT_SIZES,
    badge: 'COMMUNITY',
    gsm: 340,
    materialBlend: '100% Ring-Spun Cotton Fleece',
    tags: ['Raw Hem', 'Above Knee', 'Skate Fit', 'Heavyweight'],
  },

  // --- PAID / PRO MODELS (Technical Apparel & Licensed Fits) ---
  {
    id: 'utility-cargo-pants',
    name: 'Utility Wide-Leg Cargo Pants',
    category: 'bottoms',
    tier: 'paid',
    price: 4.99,
    blankPrice: 38.0,
    description: 'Tactical multi-pocket silhouette with articulated knees, bellows side cargos, and cinch cords.',
    silhouettePath: PANTS_PATH_D,
    pathSize: PANTS_PATH_SIZE,
    planeWidth: 2.9,
    planeHeight: 4.2,
    printZone: {
      name: 'Cargo Pocket Bellows',
      wFrac: 0.24,
      hFrac: 0.26,
      center: { x: -0.45, y: 0.38 },
    },
    availableColors: STANDARD_COLORS,
    sizes: GARMENT_SIZES,
    badge: 'PRO $4.99',
    gsm: 320,
    materialBlend: '65% Cotton / 35% Military Cordura Ripstop',
    tags: ['Cargo', 'Ripstop', 'Wide Leg', 'Tactical Seams'],
  },
  {
    id: 'technical-windbreaker',
    name: 'Technical Shell Windbreaker',
    category: 'outerwear',
    tier: 'paid',
    price: 5.99,
    blankPrice: 44.0,
    description: 'Matte weatherproof ripstop shell with water-sealed taped zippers and adjustable funnel neck.',
    silhouettePath: JACKET_PATH_D,
    pathSize: JACKET_PATH_SIZE,
    planeWidth: 3.2,
    planeHeight: 3.9,
    printZone: {
      name: 'Left Chest Insignia',
      wFrac: 0.20,
      hFrac: 0.20,
      center: { x: -0.46, y: 0.35 },
    },
    availableColors: STANDARD_COLORS,
    sizes: GARMENT_SIZES,
    badge: 'PRO $5.99',
    gsm: 210,
    materialBlend: '100% Recycled Matte Nylon with DWR',
    tags: ['Weatherproof', 'Taped Zips', 'Windbreaker', 'Shell'],
  },
  {
    id: 'canvas-work-jacket',
    name: 'Heavy Duck Canvas Coach Jacket',
    category: 'outerwear',
    tier: 'paid',
    price: 4.99,
    blankPrice: 48.0,
    description: '12oz durable duck canvas work jacket with corduroy point collar and brushed flannel lining.',
    silhouettePath: JACKET_PATH_D,
    pathSize: JACKET_PATH_SIZE,
    planeWidth: 3.2,
    planeHeight: 3.9,
    printZone: {
      name: 'Full Back Press Zone',
      wFrac: 0.32,
      hFrac: 0.30,
      center: { x: 0, y: 0.25 },
    },
    availableColors: STANDARD_COLORS,
    sizes: GARMENT_SIZES,
    badge: 'PRO $4.99',
    gsm: 410,
    materialBlend: '100% Heavy Duck Canvas',
    tags: ['Duck Canvas', 'Corduroy Collar', 'Workwear', 'Structured'],
  },
];
