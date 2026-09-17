'use client';

import React, { useEffect } from 'react';
import { ReactLenis, useLenis } from 'lenis/react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import 'lenis/dist/lenis.css';

// Register GSAP plugins safely
if (typeof window !== 'undefined') {
  gsap.registerPlugin(ScrollTrigger);
}

interface LenisProviderProps {
  children: React.ReactNode;
}

function GSAPLenisSync() {
  const lenis = useLenis();

  useEffect(() => {
    if (!lenis) return;

    // Update ScrollTrigger on every Lenis smooth scroll frame
    const handleScroll = () => {
      ScrollTrigger.update();
    };
    lenis.on('scroll', handleScroll);

    // Initial refresh to ensure trigger positions calculate accurately
    ScrollTrigger.refresh();

    return () => {
      lenis.off('scroll', handleScroll);
    };
  }, [lenis]);

  return null;
}

export default function LenisProvider({ children }: LenisProviderProps) {
  return (
    <ReactLenis
      root
      options={{
        lerp: 0.09,
        duration: 1.2,
        smoothWheel: true,
        wheelMultiplier: 0.95,
        touchMultiplier: 1.2,
        autoRaf: true,
      }}
    >
      <GSAPLenisSync />
      {children}
    </ReactLenis>
  );
}
