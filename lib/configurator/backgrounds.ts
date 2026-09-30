import { BackgroundId } from './store';

export interface BackgroundDef {
  id: BackgroundId;
  label: string;
  /** Stops for a radial gradient centered left of middle (light falls from the left). */
  stops?: [number, string][];
  solid?: string;
}

export const BACKGROUNDS: BackgroundDef[] = [
  { id: 'studio-dark', label: 'Studio Dark', stops: [[0, '#2c2c2d'], [0.55, '#1b1b1c'], [1, '#111112']] },
  { id: 'studio-light', label: 'Studio Light', stops: [[0, '#fbfbfa'], [0.6, '#e6e5e2'], [1, '#d3d2ce']] },
  { id: 'paper', label: 'Warm Paper', solid: '#F0EEE6' },
  { id: 'custom', label: 'Custom' },
  { id: 'transparent', label: 'Transparent' },
];

export function backgroundCss(id: BackgroundId, custom: string): string {
  const def = BACKGROUNDS.find((b) => b.id === id);
  if (id === 'custom') return custom;
  if (id === 'transparent') return 'repeating-conic-gradient(#3a3a3c 0% 25%, #2e2e30 0% 50%) 0 0 / 24px 24px';
  if (def?.stops) {
    return `radial-gradient(ellipse 90% 80% at 32% 45%, ${def.stops.map(([o, c]) => `${c} ${o * 100}%`).join(', ')})`;
  }
  return def?.solid ?? '#1b1b1c';
}

/** Paints the background into a 2D canvas (used for exports). Returns false for transparent. */
export function paintBackground(ctx: CanvasRenderingContext2D, w: number, h: number, id: BackgroundId, custom: string): boolean {
  if (id === 'transparent') return false;
  const def = BACKGROUNDS.find((b) => b.id === id);
  if (id === 'custom' || def?.solid) {
    ctx.fillStyle = id === 'custom' ? custom : def!.solid!;
    ctx.fillRect(0, 0, w, h);
    return true;
  }
  const cx = w * 0.32, cy = h * 0.45;
  const r = Math.hypot(Math.max(cx, w - cx), Math.max(cy, h - cy));
  const g = ctx.createRadialGradient(cx, cy, 0, cx, cy, r);
  for (const [o, c] of def!.stops!) g.addColorStop(o, c);
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, w, h);
  return true;
}

export function isDarkBackground(id: BackgroundId, custom: string): boolean {
  if (id === 'studio-dark' || id === 'transparent') return true;
  if (id !== 'custom') return false;
  const hex = custom.replace('#', '');
  const r = parseInt(hex.slice(0, 2), 16), g = parseInt(hex.slice(2, 4), 16), b = parseInt(hex.slice(4, 6), 16);
  return 0.299 * r + 0.587 * g + 0.114 * b < 140;
}
