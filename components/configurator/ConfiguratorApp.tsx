'use client';

import { useEffect } from 'react';
import { ACCESSORY_SCALE_RANGE, DESIGN_SCALE_RANGE, useStudio } from '@/lib/configurator/store';
import { AdvancedDrawer } from './AdvancedDrawer';
import { Sidebar } from './Sidebar';
import { TopNav } from './TopNav';
import { Viewport } from './Viewport';
import styles from './configurator.module.css';

function useShortcuts() {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement;
      if (target.closest('input, textarea, select, [contenteditable]')) return;
      const s = useStudio.getState();
      const mod = e.ctrlKey || e.metaKey;

      if (mod && e.key.toLowerCase() === 'z') {
        e.preventDefault();
        if (e.shiftKey) s.redo();
        else s.undo();
        return;
      }
      if (mod && e.key.toLowerCase() === 'y') {
        e.preventDefault();
        s.redo();
        return;
      }
      if (e.key === 'Escape') {
        if (s.placingKey) s.setPlacing(null);
        else s.select(null);
        return;
      }

      const item = s.items.find((i) => i.id === s.selectedId);
      if (!item || item.locked) return;
      if (e.key === 'Delete' || e.key === 'Backspace') {
        e.preventDefault();
        s.removeItem(item.id);
      } else if (e.key.toLowerCase() === 'r') {
        s.checkpoint();
        const tau = Math.PI * 2;
        const step = (e.shiftKey ? -15 : 15) * (Math.PI / 180);
        s.updatePlacement(item.id, { yaw: (((item.placement.yaw + step) % tau) + tau) % tau });
      } else if (e.key === '[' || e.key === ']') {
        s.checkpoint();
        const [lo, hi] = item.kind === 'design' ? DESIGN_SCALE_RANGE : ACCESSORY_SCALE_RANGE;
        const scale = Math.min(hi, Math.max(lo, item.placement.scale * (e.key === ']' ? 1.1 : 1 / 1.1)));
        s.updatePlacement(item.id, { scale });
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);
}

export default function ConfiguratorApp() {
  const advancedOpen = useStudio((s) => s.advancedOpen);
  useShortcuts();

  return (
    <div className={styles.app}>
      <Viewport />
      <TopNav />
      <Sidebar />
      {advancedOpen && <AdvancedDrawer />}
    </div>
  );
}
