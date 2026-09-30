'use client';

import Link from 'next/link';
import { Camera, Redo2, Undo2 } from 'lucide-react';
import { exportPNG } from '@/lib/configurator/export';
import { useStudio } from '@/lib/configurator/store';
import styles from './configurator.module.css';

function LogoMark() {
  return (
    <svg width="30" height="30" viewBox="0 0 32 32" aria-hidden>
      <circle cx="16" cy="16" r="11.5" fill="none" stroke="#1c1f2b" strokeWidth="5" />
      <path d="M22 4 L31 4 L22 13 Z" fill="#4153DB" />
    </svg>
  );
}

export function TopNav() {
  const canUndo = useStudio((s) => s.past.length > 0);
  const canRedo = useStudio((s) => s.future.length > 0);

  const saveRender = () => {
    try {
      exportPNG();
      useStudio.getState().showToast('Render saved as PNG');
    } catch {
      useStudio.getState().showToast('Could not save the render');
    }
  };

  return (
    <header className={styles.nav}>
      <Link href="/configurator" className={styles.brand}>
        <LogoMark />
        ORICAN
      </Link>

      <div className={styles.navLinks} role="navigation">
        <Link href="/configurator" className={`${styles.navLink} ${styles.navLinkActive}`}>
          3D Studio
        </Link>
        <Link href="/studio" className={styles.navLink}>
          Print Proofing
        </Link>
      </div>

      <div className={styles.navRight}>
        <button className={`${styles.softBtn} ${styles.navHideSm}`} onClick={() => useStudio.getState().undo()} disabled={!canUndo} title="Undo (Ctrl+Z)">
          <Undo2 size={16} /> Undo
        </button>
        <button className={`${styles.softBtn} ${styles.navHideSm}`} onClick={() => useStudio.getState().redo()} disabled={!canRedo} title="Redo (Ctrl+Shift+Z)">
          <Redo2 size={16} /> Redo
        </button>
        <button className={styles.primaryBtn} onClick={saveRender}>
          <Camera size={16} /> Save Render
        </button>
      </div>
    </header>
  );
}
