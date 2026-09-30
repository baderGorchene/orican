'use client';

import { useRef, useState } from 'react';
import {
  Box,
  ChevronDown,
  Circle,
  CircleDot,
  Clapperboard,
  Image as ImageIcon,
  ImageUp,
  Link2,
  Paperclip,
  Settings,
  SquarePlay,
  Star,
  Tag,
  Triangle,
  CircleEllipsis,
} from 'lucide-react';
import { STANDARD_COLORS } from '@/lib/constants';
import { BUILTIN_HARDWARE } from '@/lib/configurator/assets';
import { BACKGROUNDS, backgroundCss } from '@/lib/configurator/backgrounds';
import { exportGLB, exportPNG, exportTurntableVideo } from '@/lib/configurator/export';
import { GARMENTS } from '@/lib/configurator/garments';
import { CameraMotion, CameraView, useStudio } from '@/lib/configurator/store';
import styles from './configurator.module.css';
import { UPLOAD_ACCEPT, useUploads } from './useUploads';

const HARDWARE_ICONS: Record<string, React.ComponentType<{ size?: number }>> = {
  'builtin:pyramid-stud': Triangle,
  'builtin:dome-stud': CircleDot,
  'builtin:eyelet': Circle,
  'builtin:pin-badge': Star,
  'builtin:button': CircleEllipsis,
  'builtin:safety-pin': Paperclip,
  'builtin:carabiner': Link2,
  'builtin:zipper-pull': Tag,
};

const COLORS = [{ name: 'Off White', hex: '#F2F1ED' }, ...STANDARD_COLORS.map((c) => ({ name: c.name, hex: c.hex }))];

const CAMERA_MOTIONS: { id: CameraMotion; label: string }[] = [
  { id: 'none', label: 'Off' },
  { id: 'orbit', label: 'Orbit' },
  { id: 'sweep', label: 'Sweep' },
];

const VIEWS: { id: CameraView; label: string }[] = [
  { id: 'front', label: 'Front' },
  { id: 'three-quarter', label: '¾' },
  { id: 'left', label: 'Left' },
  { id: 'right', label: 'Right' },
  { id: 'back', label: 'Back' },
];

function Section({ id, title, open, onToggle, children }: { id: string; title: React.ReactNode; open: boolean; onToggle: (id: string) => void; children: React.ReactNode }) {
  return (
    <div>
      <button className={styles.sectionHeader} onClick={() => onToggle(id)} aria-expanded={open}>
        <span className={styles.sectionTitle}>{title}</span>
        <ChevronDown size={16} className={`${styles.chevron} ${open ? styles.chevronOpen : ''}`} />
      </button>
      {open && <div className={styles.sectionBody}>{children}</div>}
    </div>
  );
}

function GarmentThumb({ d, w, h }: { d: string; w: number; h: number }) {
  return (
    <svg width="26" height="26" viewBox={`0 0 ${w} ${h}`} aria-hidden>
      <path d={d} fill="#bdbdbd" stroke="#1f1f1f" strokeWidth={w / 40} />
    </svg>
  );
}

export function Sidebar() {
  const [open, setOpen] = useState<Set<string>>(new Set());
  const [exportOpen, setExportOpen] = useState(false);
  const [busy, setBusy] = useState<string | null>(null);
  const fileInput = useRef<HTMLInputElement>(null);
  const upload = useUploads();

  const garmentId = useStudio((s) => s.garmentId);
  const garmentColor = useStudio((s) => s.garmentColor);
  const background = useStudio((s) => s.background);
  const customBackground = useStudio((s) => s.customBackground);
  const turntable = useStudio((s) => s.turntable);
  const cameraMotion = useStudio((s) => s.cameraMotion);
  const placingKey = useStudio((s) => s.placingKey);
  const advancedOpen = useStudio((s) => s.advancedOpen);
  const store = useStudio.getState;

  const toggle = (id: string) =>
    setOpen((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });

  const runExport = async (kind: 'png' | 'video' | 'glb') => {
    setBusy(kind);
    try {
      if (kind === 'png') exportPNG();
      if (kind === 'glb') await exportGLB();
      if (kind === 'video') {
        store().showToast('Recording one full turn…');
        await exportTurntableVideo();
      }
      store().showToast('Export downloaded');
    } catch (err) {
      store().showToast(err instanceof Error ? err.message : 'Export failed');
    } finally {
      setBusy(null);
      setExportOpen(false);
    }
  };

  return (
    <aside className={styles.sidebar}>
      <input
        ref={fileInput}
        type="file"
        accept={UPLOAD_ACCEPT}
        hidden
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) upload(file);
          e.target.value = '';
        }}
      />
      <button className={`${styles.pill} ${styles.pillDark}`} onClick={() => fileInput.current?.click()}>
        Upload Your Design <ImageUp size={18} strokeWidth={1.6} />
      </button>
      <button
        className={`${styles.pill} ${advancedOpen ? styles.pillGrayActive : styles.pillGray}`}
        onClick={() => store().setAdvancedOpen(!advancedOpen)}
        aria-pressed={advancedOpen}
      >
        Advanced Controls <Settings size={18} strokeWidth={1.6} />
      </button>

      <div className={styles.sections}>
        <Section id="garment" title="Garment" open={open.has('garment')} onToggle={toggle}>
          <div className={styles.optionList}>
            {GARMENTS.map((g) => (
              <button
                key={g.id}
                className={`${styles.option} ${g.id === garmentId ? styles.optionActive : ''}`}
                onClick={() => store().setGarment(g.id)}
              >
                <span className={styles.optionThumb}>
                  <GarmentThumb {...g.outline} />
                </span>
                {g.name}
              </button>
            ))}
          </div>
        </Section>

        <Section id="color" title="Garment Color" open={open.has('color')} onToggle={toggle}>
          <div className={styles.swatches}>
            {COLORS.map((c) => (
              <button
                key={c.hex}
                title={c.name}
                aria-label={c.name}
                className={`${styles.swatch} ${c.hex.toLowerCase() === garmentColor.toLowerCase() ? styles.swatchActive : ''}`}
                style={{ background: c.hex }}
                onClick={() => store().setGarmentColor(c.hex)}
              />
            ))}
          </div>
          <div className={styles.row}>
            <input
              className={styles.hexInput}
              key={garmentColor}
              defaultValue={garmentColor}
              aria-label="Hex color"
              onKeyDown={(e) => e.key === 'Enter' && (e.target as HTMLInputElement).blur()}
              onBlur={(e) => {
                const v = e.target.value.trim();
                const hex = v.startsWith('#') ? v : `#${v}`;
                if (/^#[0-9a-f]{6}$/i.test(hex)) store().setGarmentColor(hex);
                else e.target.value = garmentColor;
              }}
            />
            <input
              type="color"
              className={styles.colorInput}
              value={garmentColor}
              aria-label="Pick a color"
              onFocus={() => store().checkpoint()}
              onChange={(e) => store().setGarmentColor(e.target.value, false)}
            />
          </div>
        </Section>

        <Section id="background" title="Background" open={open.has('background')} onToggle={toggle}>
          <div className={styles.optionList}>
            {BACKGROUNDS.map((b) => (
              <button
                key={b.id}
                className={`${styles.option} ${b.id === background ? styles.optionActive : ''}`}
                onClick={() => store().setBackground(b.id)}
              >
                <span className={styles.bgDot} style={{ background: backgroundCss(b.id, customBackground) }} />
                {b.label}
              </button>
            ))}
          </div>
          {background === 'custom' && (
            <div className={styles.row}>
              <span className={styles.label}>Color</span>
              <input
                type="color"
                className={styles.colorInput}
                value={customBackground}
                onChange={(e) => store().setCustomBackground(e.target.value)}
              />
            </div>
          )}
        </Section>

        <Section id="hardware" title="Hardware Library" open={open.has('hardware')} onToggle={toggle}>
          <div className={styles.grid2}>
            {BUILTIN_HARDWARE.map((h) => {
              const Icon = HARDWARE_ICONS[h.key] ?? Box;
              return (
                <button
                  key={h.key}
                  className={`${styles.tile} ${placingKey === h.key ? styles.tileActive : ''}`}
                  onClick={() => store().setPlacing(placingKey === h.key ? null : h.key)}
                >
                  <Icon size={18} />
                  {h.name}
                </button>
              );
            })}
          </div>
          <p className={styles.hint} style={{ marginTop: 10 }}>
            Pick a part, then click the garment to snap it to the surface. Upload your own .glb in the button above.
          </p>
        </Section>

        <Section id="animation" title="Animation" open={open.has('animation')} onToggle={toggle}>
          <div className={styles.toggleRow}>
            Turntable spin
            <button
              className={`${styles.switch} ${turntable.enabled ? styles.switchOn : ''}`}
              onClick={() => store().setTurntable({ enabled: !turntable.enabled })}
              aria-pressed={turntable.enabled}
              aria-label="Turntable spin"
            />
          </div>
          <div className={styles.sliderHead}>
            <span>Speed</span>
            <span>{turntable.speed.toFixed(2)} rad/s</span>
          </div>
          <input
            type="range"
            className={styles.slider}
            min={0.1}
            max={1.5}
            step={0.05}
            value={turntable.speed}
            onChange={(e) => store().setTurntable({ speed: Number(e.target.value) })}
          />
        </Section>

        <Section id="camera" title="Camera Animation" open={open.has('camera')} onToggle={toggle}>
          <div className={styles.chips}>
            {CAMERA_MOTIONS.map((m) => (
              <button
                key={m.id}
                className={`${styles.chip} ${cameraMotion === m.id ? styles.chipActive : ''}`}
                onClick={() => store().setCameraMotion(m.id)}
              >
                {m.label}
              </button>
            ))}
          </div>
          <div className={styles.sliderHead}>
            <span>Jump to view</span>
          </div>
          <div className={styles.chips}>
            {VIEWS.map((v) => (
              <button key={v.id} className={styles.chip} onClick={() => store().requestView(v.id)}>
                {v.label}
              </button>
            ))}
          </div>
        </Section>
      </div>

      <div className={styles.exportWrap}>
        <button className={`${styles.pill} ${styles.pillAccent}`} onClick={() => setExportOpen((v) => !v)} aria-expanded={exportOpen}>
          Export <SquarePlay size={18} strokeWidth={1.6} />
        </button>
        {exportOpen && (
          <div className={styles.menu}>
            <button className={styles.menuItem} disabled={!!busy} onClick={() => runExport('png')}>
              <ImageIcon size={16} />
              <span>
                Image (PNG)<small>Current view with background</small>
              </span>
            </button>
            <button className={styles.menuItem} disabled={!!busy} onClick={() => runExport('video')}>
              <Clapperboard size={16} />
              <span>
                {busy === 'video' ? 'Recording…' : 'Turntable video (WebM)'}
                <small>One full 360° turn, 6 s</small>
              </span>
            </button>
            <button className={styles.menuItem} disabled={!!busy} onClick={() => runExport('glb')}>
              <Box size={16} />
              <span>
                3D model (GLB)<small>Garment with prints and hardware</small>
              </span>
            </button>
          </div>
        )}
      </div>
    </aside>
  );
}
