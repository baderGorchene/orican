import { create } from 'zustand';
import { DEFAULT_GARMENT_ID } from './garments';
import { Placement } from './surface';

export interface BaseItem {
  id: string;
  name: string;
  visible: boolean;
  locked: boolean;
  placement: Placement;
}

/** A printed artwork projected onto the fabric. */
export interface DesignItem extends BaseItem {
  kind: 'design';
  src: string;
  /** width / height of the artwork */
  aspect: number;
}

/** A rigid 3D attachment (hardware or upload). */
export interface AccessoryItem extends BaseItem {
  kind: 'accessory';
  assetKey: string;
}

export type StudioItem = DesignItem | AccessoryItem;

export type BackgroundId = 'studio-dark' | 'studio-light' | 'paper' | 'custom' | 'transparent';
export type ViewMode = 'studio' | 'clay' | 'wireframe';
export type CameraMotion = 'none' | 'orbit' | 'sweep';
export type CameraView = 'front' | 'back' | 'left' | 'right' | 'three-quarter';

export const DESIGN_BASE_WIDTH = 0.24; // meters at scale 1
export const DESIGN_SCALE_RANGE: [number, number] = [0.25, 2.5];
export const ACCESSORY_SCALE_RANGE: [number, number] = [0.5, 2];
export const CLEARANCE_RANGE: [number, number] = [0.0005, 0.005];
export const DEFAULT_CLEARANCE = 0.0015;

interface Snapshot {
  garmentId: string;
  garmentColor: string;
  items: StudioItem[];
}

interface StudioState extends Snapshot {
  selectedId: string | null;
  /** Asset being placed with the hover ghost, if any. */
  placingKey: string | null;
  /** An item drag or gizmo interaction is in progress (orbit is disabled). */
  interacting: boolean;
  background: BackgroundId;
  customBackground: string;
  viewMode: ViewMode;
  turntable: { enabled: boolean; speed: number };
  cameraMotion: CameraMotion;
  cameraRequest: { view: CameraView; nonce: number } | null;
  advancedOpen: boolean;
  recording: boolean;
  garmentLoading: boolean;
  toast: { message: string; nonce: number } | null;
  stats: { fps: number; triangles: number };
  past: Snapshot[];
  future: Snapshot[];

  /** Push the current state to the undo stack. Call once before a change (or a drag). */
  checkpoint: () => void;
  undo: () => void;
  redo: () => void;

  setGarment: (id: string) => void;
  setGarmentColor: (hex: string, commit?: boolean) => void;
  addItem: (item: StudioItem, select?: boolean) => void;
  updateItem: (id: string, patch: Partial<Omit<DesignItem, 'kind'>> | Partial<Omit<AccessoryItem, 'kind'>>) => void;
  updatePlacement: (id: string, patch: Partial<Placement>) => void;
  removeItem: (id: string) => void;
  select: (id: string | null) => void;
  setPlacing: (key: string | null) => void;
  setInteracting: (v: boolean) => void;
  setBackground: (id: BackgroundId) => void;
  setCustomBackground: (hex: string) => void;
  setViewMode: (m: ViewMode) => void;
  setTurntable: (patch: Partial<StudioState['turntable']>) => void;
  setCameraMotion: (m: CameraMotion) => void;
  requestView: (view: CameraView) => void;
  setAdvancedOpen: (v: boolean) => void;
  setRecording: (v: boolean) => void;
  setGarmentLoading: (v: boolean) => void;
  showToast: (message: string) => void;
  setStats: (stats: StudioState['stats']) => void;
}

const HISTORY_LIMIT = 60;

const snapshot = (s: Snapshot): Snapshot => ({ garmentId: s.garmentId, garmentColor: s.garmentColor, items: s.items });

export const useStudio = create<StudioState>()((set, get) => ({
  garmentId: DEFAULT_GARMENT_ID,
  garmentColor: '#F2F1ED',
  items: [],
  selectedId: null,
  placingKey: null,
  interacting: false,
  background: 'studio-dark',
  customBackground: '#1d2233',
  viewMode: 'studio',
  turntable: { enabled: false, speed: 0.35 },
  cameraMotion: 'none',
  cameraRequest: null,
  advancedOpen: false,
  recording: false,
  garmentLoading: false,
  toast: null,
  stats: { fps: 0, triangles: 0 },
  past: [],
  future: [],

  checkpoint: () =>
    set((s) => ({ past: [...s.past.slice(-HISTORY_LIMIT + 1), snapshot(s)], future: [] })),
  undo: () =>
    set((s) => {
      const prev = s.past[s.past.length - 1];
      if (!prev) return s;
      const selectedId = prev.items.some((i) => i.id === s.selectedId) ? s.selectedId : null;
      return { ...prev, selectedId, past: s.past.slice(0, -1), future: [snapshot(s), ...s.future] };
    }),
  redo: () =>
    set((s) => {
      const next = s.future[0];
      if (!next) return s;
      const selectedId = next.items.some((i) => i.id === s.selectedId) ? s.selectedId : null;
      return { ...next, selectedId, past: [...s.past, snapshot(s)], future: s.future.slice(1) };
    }),

  setGarment: (id) => {
    if (id === get().garmentId) return;
    get().checkpoint();
    set({ garmentId: id });
  },
  setGarmentColor: (hex, commit = true) => {
    if (commit) get().checkpoint();
    set({ garmentColor: hex });
  },
  addItem: (item, select = true) => {
    get().checkpoint();
    set((s) => ({ items: [...s.items, item], selectedId: select ? item.id : s.selectedId }));
  },
  updateItem: (id, patch) =>
    set((s) => ({ items: s.items.map((i) => (i.id === id ? ({ ...i, ...patch } as StudioItem) : i)) })),
  updatePlacement: (id, patch) =>
    set((s) => ({
      items: s.items.map((i) => (i.id === id ? { ...i, placement: { ...i.placement, ...patch } } : i)),
    })),
  removeItem: (id) => {
    get().checkpoint();
    set((s) => ({ items: s.items.filter((i) => i.id !== id), selectedId: s.selectedId === id ? null : s.selectedId }));
  },
  select: (id) => set({ selectedId: id }),
  setPlacing: (key) => set(key ? { placingKey: key, selectedId: null } : { placingKey: null }),
  setInteracting: (v) => set({ interacting: v }),
  setBackground: (id) => set({ background: id }),
  setCustomBackground: (hex) => set({ background: 'custom', customBackground: hex }),
  setViewMode: (m) => set({ viewMode: m }),
  setTurntable: (patch) => set((s) => ({ turntable: { ...s.turntable, ...patch } })),
  setCameraMotion: (m) => set({ cameraMotion: m }),
  requestView: (view) => set({ cameraRequest: { view, nonce: Date.now() }, cameraMotion: 'none' }),
  setAdvancedOpen: (v) => set({ advancedOpen: v }),
  setRecording: (v) => set({ recording: v }),
  setGarmentLoading: (v) => set({ garmentLoading: v }),
  showToast: (message) => set({ toast: { message, nonce: Date.now() } }),
  setStats: (stats) => set({ stats }),
}));

export const newId = () => Math.random().toString(36).slice(2, 10);
