'use client';

import React from 'react';
import { ArrowRight } from 'lucide-react';

interface StoryBannerProps {
  onOpenStudio: () => void;
}

export const StoryBanner: React.FC<StoryBannerProps> = ({ onOpenStudio }) => {
  return (
    <section
      style={{
        position: 'relative',
        minHeight: '68vh',
        display: 'flex',
        alignItems: 'flex-end',
        backgroundImage:
          "url('https://d8j0ntlcm91z4.cloudfront.net/user_3CEJb1vs8I6xgnavY3H6CRY4bSJ/hf_20260915_081447_70ad87e7-29a2-4c17-94d6-02871420d66f.png')",
        backgroundSize: 'cover',
        backgroundPosition: 'center',
      }}
    >
      <div
        style={{
          position: 'absolute',
          inset: 0,
          background:
            'linear-gradient(0deg, #050608 10%, rgba(5, 6, 8, 0.45) 60%, rgba(5, 6, 8, 0.2) 100%)',
        }}
      />
      <div
        className="wrap"
        style={{
          position: 'relative',
          padding: '80px 32px 70px',
          color: '#FFFFFF',
          width: '100%',
        }}
      >
        <h2
          style={{
            fontFamily: 'var(--font-heading)',
            fontWeight: 700,
            fontSize: 'clamp(30px, 4.2vw, 54px)',
            letterSpacing: '-0.025em',
            maxWidth: '680px',
            lineHeight: 1.15,
            marginBottom: '28px',
            color: '#FFFFFF',
            textShadow: '0 3px 18px rgba(0, 0, 0, 0.5)',
          }}
        >
          One proof. No surprises. The shirt you saw is the shirt you get.
        </h2>

        <button
          onClick={onOpenStudio}
          className="btn btn-primary"
          style={{ padding: '14px 32px' }}
        >
          Start designing now
          <ArrowRight size={16} />
        </button>
      </div>
    </section>
  );
};
