'use client';

import { useEffect, useState } from 'react';
import { ArrowUpRight, Sparkles } from 'lucide-react';
import { motion, useMotionValue, useSpring } from 'framer-motion';

function GlowIntro() {
  return (
    <div className="relative z-10 mx-auto flex max-w-3xl flex-col items-center px-6 text-center">
      <span className="mb-8 inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/[0.04] px-4 py-2 text-[10px] font-semibold uppercase tracking-[0.18em] text-[#b5c9b7]">
        <Sparkles aria-hidden="true" size={14} className="text-[#c3844e]" />
        Lily Studio <span className="text-white/30">/</span> Cursor study
      </span>
      <h1 className="font-[var(--font-serif)] text-5xl font-medium leading-[1.08] text-[#f4f2eb] sm:text-6xl md:text-7xl">
        I’m bringing your{' '}
        <span className="relative inline-block whitespace-nowrap px-3 text-[#c5dec9]">
          <span
            aria-hidden="true"
            className="absolute inset-x-0 bottom-[0.08em] -z-10 h-[0.72em] -rotate-2 rounded-md border border-[#7ca487]/50 bg-[#285c48]/60"
          />
          next chapter
        </span>{' '}
        into focus.
      </h1>
      <p className="mt-7 max-w-lg text-sm leading-7 text-[#a8b0a9] sm:text-base">
        Your experience, with a little more clarity. Thoughtful tools for the work you want to do next.
      </p>
      <a
        href="/templates"
        className="mt-9 inline-flex min-h-12 items-center gap-3 rounded-md bg-[#9bc4a9] px-5 text-sm font-semibold text-[#142019] transition hover:bg-[#b1d1b9] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#9bc4a9]"
      >
        Explore Lily templates <ArrowUpRight aria-hidden="true" size={16} />
      </a>
    </div>
  );
}

export default function CursorGlow({ children, className = '' }) {
  const pointerX = useMotionValue(-800);
  const pointerY = useMotionValue(-800);
  const springX = useSpring(pointerX, { stiffness: 42, damping: 24, mass: 0.8 });
  const springY = useSpring(pointerY, { stiffness: 42, damping: 24, mass: 0.8 });
  const [trackingEnabled, setTrackingEnabled] = useState(false);

  useEffect(() => {
    const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
    const touchDevice = window.matchMedia('(hover: none), (pointer: coarse)');

    if (reducedMotion.matches || touchDevice.matches) return undefined;

    setTrackingEnabled(true);
    const handleMouseMove = (event) => {
      pointerX.set(event.clientX - 280);
      pointerY.set(event.clientY - 280);
    };

    window.addEventListener('mousemove', handleMouseMove, { passive: true });
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, [pointerX, pointerY]);

  return (
    <main
      className={`relative isolate flex h-screen min-h-[560px] items-center justify-center overflow-hidden bg-[#0a0a0c] ${className}`}
    >
      {trackingEnabled && (
        <motion.div
          aria-hidden="true"
          className="pointer-events-none fixed left-0 top-0 z-0 aspect-square w-[min(74vw,560px)] rounded-full opacity-80 blur-[110px] will-change-transform sm:w-[min(58vw,640px)]"
          style={{
            x: springX,
            y: springY,
            background:
              'radial-gradient(circle, rgba(126, 190, 139, 0.42) 0%, rgba(40, 92, 72, 0.30) 42%, rgba(195, 132, 78, 0.18) 68%, transparent 74%)',
          }}
        />
      )}
      {children ?? <GlowIntro />}
    </main>
  );
}
