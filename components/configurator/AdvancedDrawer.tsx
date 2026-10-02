'use client';

import { useState } from 'react';
import {
  ArrowDown,
  ArrowLeft,
  ArrowRight,
  ArrowUp,
  Box,
  Eye,
  EyeOff,
  FlipHorizontal2,
  Lock,
  Printer,
  RotateCcw,
  Trash2,
  Unlock,
  X,
} from 'lucide-react';
import { editPrintAs3D, printAccessory, restylePrint } from '@/lib/configurator/bake';
import { getGarment } from '@/lib/configurator/garments';
import {
  DEFAULT_FILTERS,
  DEFAULT_TRANSFORM,
  FILTER_PRESETS,
  MATERIAL_MODES,
  ModelFilters,
  ModelTransform,
  presetFilters,
} from '@/lib/configurator/model-edit';
import { hotspotHit, nudgeItem } from '@/lib/configurator/placement';
import {
  ACCESSORY_SCALE_RANGE,
  AccessoryItem,
  CLEARANCE_RANGE,
  DESIGN_SCALE_RANGE,
  DesignItem,
  PrintFinish,
  PrintStyle,
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

const FINISHES: { id: PrintFinish; label: string; hint: string }[] = [
  { id: 'dtg', label: 'DTG', hint: 'Matte ink, fabric texture shows through' },
  { id: 'screen', label: 'Screen', hint: 'Thicker ink, soft sheen' },
  { id: 'puff', label: 'Puff', hint: 'Raised, rubbery print' },
  { id: 'foil', label: 'Foil', hint: 'Metallic transfer' },
  { id: 'vinyl', label: 'Vinyl', hint: 'Smooth glossy heat transfer' },
];

const PRINT_STYLES: { id: PrintStyle; label: string; hint: string }[] = [
  { id: 'graphic', label: 'Graphic', hint: 'Flat artwork colors, like a printed illustration' },
  { id: 'shaded', label: 'Shaded', hint: 'Keeps the 3D lighting, like a printed photo of the model' },
];

const NUDGE_STEPS = [
  { label: '1 mm', m: 0.001 },
  { label: '5 mm', m: 0.005 },
  { label: '2 cm', m: 0.02 },
];

const deg = (rad: number) => (rad * 180) / Math.PI;
const rad = (d: number) => (d * Math.PI) / 180;

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
        aria-label={label}
        onPointerDown={() => useStudio.getState().checkpoint()}
        onKeyDown={() => useStudio.getState().checkpoint()}
        onChange={(e) => onChange(Number(e.target.value))}
      />
    </>
  );
}

function HotspotChips({ item }: { item: StudioItem }) {
  const garmentId = useStudio((s) => s.garmentId);
  return (
    <>
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
              const store = useStudio.getState();
              store.checkpoint();
              store.updatePlacement(item.id, { position: toVec3(hit.point), normal: toVec3(hit.normal) });
            }}
          >
            {h.label}
          </button>
        ))}
      </div>
    </>
  );
}

function PlacementSliders({ item }: { item: StudioItem }) {
  const p = item.placement;
  const range = item.kind === 'design' ? DESIGN_SCALE_RANGE : ACCESSORY_SCALE_RANGE;
  const set = (patch: Partial<typeof p>) => useStudio.getState().updatePlacement(item.id, patch);
  return (
    <>
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
        label="Rotation (around the fabric)"
        value={deg(p.yaw)}
        display={`${Math.round(deg(p.yaw))}°`}
        min={0}
        max={360}
        step={1}
        onChange={(v) => set({ yaw: rad(v) })}
      />
    </>
  );
}

// ---------------------------------------------------------------------------
// 3D model editor
// ---------------------------------------------------------------------------

function NudgePad({ item }: { item: StudioItem }) {
  const [step, setStep] = useState(NUDGE_STEPS[1].m);
  const nudge = (dx: number, dy: number) => {
    useStudio.getState().checkpoint();
    if (!nudgeItem(item.id, dx * step, dy * step)) useStudio.getState().showToast('That would move it off the garment');
  };
  return (
    <div className={styles.nudgeRow}>
      <div className={styles.nudge}>
        <span />
        <button className={styles.nudgeBtn} onClick={() => nudge(0, 1)} aria-label="Move up">
          <ArrowUp size={15} />
        </button>
        <span />
        <button className={styles.nudgeBtn} onClick={() => nudge(-1, 0)} aria-label="Move left">
          <ArrowLeft size={15} />
        </button>
        <span className={styles.nudgeCenter} />
        <button className={styles.nudgeBtn} onClick={() => nudge(1, 0)} aria-label="Move right">
          <ArrowRight size={15} />
        </button>
        <span />
        <button className={styles.nudgeBtn} onClick={() => nudge(0, -1)} aria-label="Move down">
          <ArrowDown size={15} />
        </button>
        <span />
      </div>
      <div className={styles.nudgeSteps}>
        <span className={styles.label}>Step</span>
        {NUDGE_STEPS.map((s) => (
          <button
            key={s.label}
            className={`${styles.chip} ${step === s.m ? styles.chipActive : ''}`}
            onClick={() => setStep(s.m)}
          >
            {s.label}
          </button>
        ))}
      </div>
    </div>
  );
}

function MoveTab({ item }: { item: AccessoryItem }) {
  const t = item.transform;
  const store = useStudio.getState;
  const setT = (patch: Partial<ModelTransform>) => store().updateItem(item.id, { transform: { ...t, ...patch } });
  const setStretch = (axis: 0 | 1 | 2, v: number) => {
    const stretch = [...t.stretch] as ModelTransform['stretch'];
    stretch[axis] = v;
    setT({ stretch });
  };
  const p = item.placement;

  return (
    <>
      <div className={styles.sliderHead}>
        <span>Slide along the fabric (or drag it)</span>
      </div>
      <NudgePad item={item} />
      <PlacementSliders item={item} />
      <Slider
        label="Tilt forward / back"
        value={deg(t.tiltX)}
        display={`${Math.round(deg(t.tiltX))}°`}
        min={-80}
        max={80}
        step={1}
        onChange={(v) => setT({ tiltX: rad(v) })}
      />
      <Slider
        label="Tilt left / right"
        value={deg(t.tiltY)}
        display={`${Math.round(deg(t.tiltY))}°`}
        min={-80}
        max={80}
        step={1}
        onChange={(v) => setT({ tiltY: rad(v) })}
      />
      {(['Width', 'Height', 'Depth'] as const).map((label, axis) => (
        <Slider
          key={label}
          label={`Stretch ${label.toLowerCase()}`}
          value={t.stretch[axis]}
          display={`${Math.round(t.stretch[axis] * 100)}%`}
          min={0.25}
          max={3}
          step={0.01}
          onChange={(v) => setStretch(axis as 0 | 1 | 2, v)}
        />
      ))}
      <Slider
        label="Distance from fabric"
        value={p.offset}
        display={`${(p.offset * 1000).toFixed(1)} mm`}
        min={CLEARANCE_RANGE[0]}
        max={CLEARANCE_RANGE[1]}
        step={0.0005}
        onChange={(v) => store().updatePlacement(item.id, { offset: v })}
      />
      <div className={styles.row}>
        <button
          className={`${styles.chip} ${t.flipX ? styles.chipActive : ''}`}
          onClick={() => {
            store().checkpoint();
            setT({ flipX: !t.flipX });
          }}
        >
          <FlipHorizontal2 size={13} style={{ verticalAlign: '-2px', marginRight: 4 }} />
          Mirror
        </button>
        <button
          className={styles.chip}
          onClick={() => {
            store().checkpoint();
            store().updateItem(item.id, { transform: DEFAULT_TRANSFORM });
            store().updatePlacement(item.id, { yaw: 0, scale: 1 });
          }}
        >
          <RotateCcw size={13} style={{ verticalAlign: '-2px', marginRight: 4 }} />
          Reset movement
        </button>
      </div>
      <HotspotChips item={item} />
    </>
  );
}

function FiltersTab({ item }: { item: AccessoryItem }) {
  const f = item.filters;
  const store = useStudio.getState;
  const setF = (patch: Partial<ModelFilters>) =>
    store().updateItem(item.id, { filters: { ...f, ...patch, preset: patch.preset ?? 'custom' } });

  return (
    <>
      <div className={styles.sliderHead}>
        <span>Presets</span>
      </div>
      <div className={styles.chips}>
        {FILTER_PRESETS.map((p) => (
          <button
            key={p.id}
            className={`${styles.chip} ${f.preset === p.id ? styles.chipActive : ''}`}
            onClick={() => {
              store().checkpoint();
              store().updateItem(item.id, { filters: presetFilters(p.id) });
            }}
          >
            {p.label}
          </button>
        ))}
      </div>
      <div className={styles.sliderHead}>
        <span>Material</span>
      </div>
      <div className={styles.chips}>
        {MATERIAL_MODES.map((m) => (
          <button
            key={m.id}
            className={`${styles.chip} ${f.material === m.id ? styles.chipActive : ''}`}
            onClick={() => {
              store().checkpoint();
              setF({ material: m.id });
            }}
          >
            {m.label}
          </button>
        ))}
      </div>
      <Slider
        label="Brightness"
        value={f.brightness}
        display={`${Math.round(f.brightness * 200)}`}
        min={-0.5}
        max={0.5}
        step={0.01}
        onChange={(v) => setF({ brightness: v })}
      />
      <Slider
        label="Contrast"
        value={f.contrast}
        display={`${Math.round(f.contrast * 100)}%`}
        min={0}
        max={2}
        step={0.01}
        onChange={(v) => setF({ contrast: v })}
      />
      <Slider
        label="Saturation"
        value={f.saturation}
        display={`${Math.round(f.saturation * 100)}%`}
        min={0}
        max={2}
        step={0.01}
        onChange={(v) => setF({ saturation: v })}
      />
      <Slider label="Hue" value={f.hue} display={`${Math.round(f.hue)}°`} min={-180} max={180} step={1} onChange={(v) => setF({ hue: v })} />
      <div className={styles.row}>
        <span className={styles.label} style={{ flex: 1 }}>
          Tint color
        </span>
        <input
          type="color"
          className={styles.colorInput}
          value={f.tint}
          aria-label="Tint color"
          onFocus={() => store().checkpoint()}
          onChange={(e) => setF({ tint: e.target.value, tintAmount: f.tintAmount || 0.4 })}
        />
      </div>
      <Slider
        label="Tint strength"
        value={f.tintAmount}
        display={`${Math.round(f.tintAmount * 100)}%`}
        min={0}
        max={1}
        step={0.01}
        onChange={(v) => setF({ tintAmount: v })}
      />
      <div className={styles.row}>
        <button
          className={styles.chip}
          onClick={() => {
            store().checkpoint();
            store().updateItem(item.id, { filters: DEFAULT_FILTERS });
          }}
        >
          <RotateCcw size={13} style={{ verticalAlign: '-2px', marginRight: 4 }} />
          Reset filters
        </button>
      </div>
    </>
  );
}

function ModelEditor({ item }: { item: AccessoryItem }) {
  const [tab, setTab] = useState<'move' | 'filters'>('move');
  return (
    <div className={styles.drawerSection}>
      <div className={styles.drawerTitle}>3D model</div>
      <div className={styles.layerName} style={{ fontSize: 13, fontWeight: 500, marginBottom: 10 }}>
        {item.name}
      </div>
      <div className={styles.tabs} role="tablist">
        {(['move', 'filters'] as const).map((t) => (
          <button
            key={t}
            role="tab"
            aria-selected={tab === t}
            className={`${styles.tab} ${tab === t ? styles.tabActive : ''}`}
            onClick={() => setTab(t)}
          >
            {t === 'move' ? 'Move' : 'Filters'}
          </button>
        ))}
      </div>
      {tab === 'move' ? <MoveTab item={item} /> : <FiltersTab item={item} />}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Print inspector
// ---------------------------------------------------------------------------

function PrintInspector({ item }: { item: DesignItem }) {
  const store = useStudio.getState;
  const p = item.placement;
  return (
    <div className={styles.drawerSection}>
      <div className={styles.drawerTitle}>Print</div>
      <div className={styles.layerName} style={{ fontSize: 13, fontWeight: 500 }}>
        {item.name}
      </div>

      <div className={styles.sliderHead}>
        <span>Print finish</span>
      </div>
      <div className={styles.chips}>
        {FINISHES.map((f) => (
          <button
            key={f.id}
            title={f.hint}
            className={`${styles.chip} ${(item.finish ?? 'dtg') === f.id ? styles.chipActive : ''}`}
            onClick={() => {
              store().checkpoint();
              store().updateItem(item.id, { finish: f.id });
            }}
          >
            {f.label}
          </button>
        ))}
      </div>
      <p className={styles.hint} style={{ marginTop: 6 }}>
        {FINISHES.find((f) => f.id === (item.finish ?? 'dtg'))?.hint}
      </p>

      {item.baked && (
        <>
          <div className={styles.sliderHead}>
            <span>Print style</span>
          </div>
          <div className={styles.chips}>
            {PRINT_STYLES.map((st) => (
              <button
                key={st.id}
                title={st.hint}
                className={`${styles.chip} ${item.baked!.style === st.id ? styles.chipActive : ''}`}
                onClick={() => item.baked!.style !== st.id && restylePrint(item.id, st.id)}
              >
                {st.label}
              </button>
            ))}
          </div>
          <p className={styles.hint} style={{ marginTop: 6 }}>
            {PRINT_STYLES.find((st) => st.id === item.baked!.style)?.hint}
          </p>
        </>
      )}

      <div className={styles.sliderHead}>
        <span>Slide along the fabric (or drag it)</span>
      </div>
      <NudgePad item={item} />
      <PlacementSliders item={item} />

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
      <HotspotChips item={item} />

      {item.baked && (
        <button className={styles.secondaryBtn} onClick={() => editPrintAs3D(item.id)}>
          <Box size={15} /> Edit as 3D model
        </button>
      )}
      <button className={styles.dangerBtn} onClick={() => store().removeItem(item.id)}>
        Delete print
      </button>
    </div>
  );
}

// ---------------------------------------------------------------------------

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
        {selected?.kind === 'accessory' ? 'Model Editor' : 'Advanced Controls'}
        <button className={styles.layerBtn} onClick={() => store().setAdvancedOpen(false)} aria-label="Close">
          <X size={16} />
        </button>
      </div>

      {selected?.kind === 'accessory' && <ModelEditor key={selected.id} item={selected} />}
      {selected?.kind === 'design' && <PrintInspector key={selected.id} item={selected} />}
      {!selected && (
        <div className={styles.drawerSection}>
          <p className={styles.hint}>Select a print or 3D model on the garment to edit it.</p>
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
            {item.kind === 'accessory' ? <Box size={13} /> : <Printer size={13} />}
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
          Drag to move · Arrows nudge 5 mm (Shift: 1 mm) · R / Shift+R rotate 15° · [ and ] scale · Enter prints a 3D model
          · Delete removes · Ctrl+Z / Ctrl+Shift+Z undo/redo · Esc cancels
        </p>
      </div>

      {selected?.kind === 'accessory' && (
        <div className={styles.drawerFooter}>
          <button className={styles.confirmBtn} onClick={() => printAccessory(selected.id)}>
            <Printer size={16} /> Confirm &amp; print on garment
          </button>
        </div>
      )}
    </div>
  );
}
