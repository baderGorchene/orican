'use client';

import { Eye, EyeOff, Lock, Trash2, Unlock, X } from 'lucide-react';
import { getGarment } from '@/lib/configurator/garments';
import { hotspotHit } from '@/lib/configurator/placement';
import {
  ACCESSORY_SCALE_RANGE,
  CLEARANCE_RANGE,
  DESIGN_SCALE_RANGE,
  StudioItem,
  ViewMode,
  useStudio,
} from '@/lib/configurator/store';
import { toVec3 } from '@/lib/configurator/surface';
import styles from './configurator.module.css';

const VIEW_MODES: { id: ViewMode; label: string }[] = [
  { id: 'studio', label: 'Studio' },
  { id: 'clay', label: 'Clay' },
  { id: 'wireframe', label: 'Wireframe' },
];

function Slider({
  label,
  value,
  display,
  min,
  max,
  step,
  onChange,
}: {
  label: string;
  value: number;
  display: string;
  min: number;
  max: number;
  step: number;
  onChange: (v: number) => void;
}) {
  return (
    <>
      <div className={styles.sliderHead}>
        <span>{label}</span>
        <span>{display}</span>
      </div>
      <input
        type="range"
        className={styles.slider}
        min={min}
        max={max}
        step={step}
        value={value}
        onPointerDown={() => useStudio.getState().checkpoint()}
        onKeyDown={() => useStudio.getState().checkpoint()}
        onChange={(e) => onChange(Number(e.target.value))}
      />
    </>
  );
}

function Inspector({ item }: { item: StudioItem }) {
  const store = useStudio.getState;
  const garmentId = useStudio((s) => s.garmentId);
  const p = item.placement;
  const range = item.kind === 'design' ? DESIGN_SCALE_RANGE : ACCESSORY_SCALE_RANGE;
  const set = (patch: Partial<typeof p>) => store().updatePlacement(item.id, patch);

  return (
    <div className={styles.drawerSection}>
      <div className={styles.drawerTitle}>{item.kind === 'design' ? 'Print' : 'Attachment'}</div>
      <div className={styles.layerName} style={{ fontSize: 13, fontWeight: 500 }}>
        {item.name}
      </div>

      <Slider
        label="Scale"
        value={p.scale}
        display={`${Math.round(p.scale * 100)}%`}
        min={range[0]}
        max={range[1]}
        step={0.01}
        onChange={(v) => set({ scale: v })}
      />
      <Slider
        label="Rotation (yaw)"
        value={(p.yaw * 180) / Math.PI}
        display={`${Math.round((p.yaw * 180) / Math.PI)}°`}
        min={0}
        max={360}
        step={1}
        onChange={(v) => set({ yaw: (v * Math.PI) / 180 })}
      />
      {item.kind === 'accessory' && (
        <Slider
          label="Normal clearance"
          value={p.offset}
          display={`${(p.offset * 1000).toFixed(1)} mm`}
          min={CLEARANCE_RANGE[0]}
          max={CLEARANCE_RANGE[1]}
          step={0.0001}
          onChange={(v) => set({ offset: v })}
        />
      )}

      <div className={styles.sliderHead}>
        <span>Position (cm, garment space)</span>
      </div>
      <div className={styles.readout}>
        {p.position.map((v, i) => (
          <span key={i}>
            {'XYZ'[i]} {(v * 100).toFixed(1)}
          </span>
        ))}
      </div>

      <div className={styles.sliderHead}>
        <span>Snap to hotspot</span>
      </div>
      <div className={styles.chips}>
        {getGarment(garmentId).hotspots.map((h) => (
          <button
            key={h.id}
            className={styles.chip}
            onClick={() => {
              const hit = hotspotHit(h);
              if (!hit) return;
              store().checkpoint();
              set({ position: toVec3(hit.point), normal: toVec3(hit.normal) });
            }}
          >
            {h.label}
          </button>
        ))}
      </div>

      <button className={styles.dangerBtn} onClick={() => store().removeItem(item.id)}>
        Delete {item.kind === 'design' ? 'print' : 'attachment'}
      </button>
    </div>
  );
}

export function AdvancedDrawer() {
  const items = useStudio((s) => s.items);
  const selectedId = useStudio((s) => s.selectedId);
  const viewMode = useStudio((s) => s.viewMode);
  const store = useStudio.getState;
  const selected = items.find((i) => i.id === selectedId);

  const toggleFlag = (item: StudioItem, flag: 'visible' | 'locked') => {
    store().checkpoint();
    store().updateItem(item.id, { [flag]: !item[flag] });
  };

  return (
    <div className={styles.drawer}>
      <div className={styles.drawerHead}>
        Advanced Controls
        <button className={styles.layerBtn} onClick={() => store().setAdvancedOpen(false)} aria-label="Close">
          <X size={16} />
        </button>
      </div>

      {selected ? (
        <Inspector item={selected} />
      ) : (
        <div className={styles.drawerSection}>
          <p className={styles.hint}>Select a print or attachment on the garment to edit its scale, rotation and clearance.</p>
        </div>
      )}

      <div className={styles.drawerSection}>
        <div className={styles.drawerTitle}>Layers ({items.length})</div>
        {items.length === 0 && <p className={styles.hint}>Nothing placed yet.</p>}
        {items.map((item) => (
          <div
            key={item.id}
            className={`${styles.layer} ${item.id === selectedId ? styles.layerActive : ''}`}
            onClick={() => store().select(item.id)}
          >
            <span className={styles.layerName}>{item.name}</span>
            <button
              className={styles.layerBtn}
              aria-label={item.visible ? 'Hide' : 'Show'}
              onClick={(e) => {
                e.stopPropagation();
                toggleFlag(item, 'visible');
              }}
            >
              {item.visible ? <Eye size={14} /> : <EyeOff size={14} />}
            </button>
            <button
              className={styles.layerBtn}
              aria-label={item.locked ? 'Unlock' : 'Lock'}
              onClick={(e) => {
                e.stopPropagation();
                toggleFlag(item, 'locked');
              }}
            >
              {item.locked ? <Lock size={14} /> : <Unlock size={14} />}
            </button>
            <button
              className={styles.layerBtn}
              aria-label="Delete"
              onClick={(e) => {
                e.stopPropagation();
                store().removeItem(item.id);
              }}
            >
              <Trash2 size={14} />
            </button>
          </div>
        ))}
      </div>

      <div className={styles.drawerSection}>
        <div className={styles.drawerTitle}>View mode</div>
        <div className={styles.chips}>
          {VIEW_MODES.map((m) => (
            <button
              key={m.id}
              className={`${styles.chip} ${viewMode === m.id ? styles.chipActive : ''}`}
              onClick={() => store().setViewMode(m.id)}
            >
              {m.label}
            </button>
          ))}
        </div>
      </div>

      <div className={styles.drawerSection}>
        <div className={styles.drawerTitle}>Shortcuts</div>
        <p className={styles.hint}>
          Drag to move · R / Shift+R rotate 15° · [ and ] scale · Delete removes · Ctrl+Z / Ctrl+Shift+Z undo/redo · Esc cancels
        </p>
      </div>
    </div>
  );
}
