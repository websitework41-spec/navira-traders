'use client';

import React, { useEffect, useState } from 'react';
import { Smartphone, ShieldCheck, PackageCheck, Sparkles, CheckCircle2 } from 'lucide-react';

interface BrandPreloaderProps {
  /** If true, the preloader will auto-dismiss once mounted/loaded */
  autoDismiss?: boolean;
}

export function BrandPreloader({ autoDismiss = true }: BrandPreloaderProps) {
  const [visible, setVisible] = useState(true);
  const [fading, setFading] = useState(false);
  const [progress, setProgress] = useState(35);
  const [statusMessage, setStatusMessage] = useState('Connecting to Nawira Traders...');

  useEffect(() => {
    if (!autoDismiss) return;

    // Check if the user has already seen the preloader in this browsing session
    try {
      if (typeof window !== 'undefined' && sessionStorage.getItem('nt_splash_seen')) {
        setVisible(false);
        return;
      }
      sessionStorage.setItem('nt_splash_seen', '1');
    } catch {
      // Ignore storage errors in private browsing
    }

    // High-speed, energetic progress sequence (~380ms total)
    const t1 = setTimeout(() => {
      setProgress(80);
      setStatusMessage('Verifying PTA DIRBS Catalog...');
    }, 120);

    const t2 = setTimeout(() => {
      setProgress(100);
      setFading(true);
    }, 380);

    const t3 = setTimeout(() => {
      setVisible(false);
    }, 650);

    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
      clearTimeout(t3);
    };
  }, [autoDismiss]);

  if (!visible) return null;

  return (
    <div
      className={`fixed inset-0 z-[9999] flex flex-col items-center justify-center bg-gradient-to-br from-[#06182c] via-[#0b2b4d] to-[#041120] text-white select-none transition-all duration-500 ${
        fading ? 'opacity-0 pointer-events-none scale-102' : 'opacity-100'
      }`}
      aria-label="Loading Nawira Traders"
      role="status"
    >
      {/* Ambient background glow orbs */}
      <div className="absolute top-1/4 -left-20 w-80 h-80 bg-sky-500/15 rounded-full blur-3xl pointer-events-none animate-pulse" />
      <div className="absolute bottom-1/4 -right-20 w-80 h-80 bg-emerald-500/15 rounded-full blur-3xl pointer-events-none animate-pulse delay-500" />

      <div className="relative z-10 flex flex-col items-center max-w-sm px-6 text-center space-y-6">
        {/* Animated Brand Emblem with Spinning Glow Rings */}
        <div className="relative flex items-center justify-center">
          {/* Outer Pulsing Glow */}
          <div className="absolute -inset-3 rounded-3xl bg-gradient-to-r from-sky-400/30 via-emerald-400/20 to-[#48afff]/30 blur-lg animate-pulse" />

          {/* Rotating Gradient Ring */}
          <div className="absolute -inset-1 rounded-3xl bg-gradient-to-tr from-sky-400 via-transparent to-emerald-400 opacity-80 animate-spin [animation-duration:4s]" />

          {/* Core Emblem Card */}
          <div className="relative w-20 h-20 sm:w-24 sm:h-24 rounded-2xl sm:rounded-3xl bg-gradient-to-b from-[#0e3b66] to-[#071f38] border border-white/20 shadow-2xl flex flex-col items-center justify-center">
            <Smartphone className="w-9 h-9 sm:w-11 sm:h-11 text-white stroke-[1.8] drop-shadow-md animate-bounce [animation-duration:2.5s]" />
            <div className="absolute -top-1.5 -right-1.5 w-6 h-6 rounded-full bg-emerald-500 border-2 border-[#06182c] flex items-center justify-center text-white shadow-md">
              <ShieldCheck className="w-3.5 h-3.5 stroke-[2.6]" />
            </div>
          </div>
        </div>

        {/* Brand Typography */}
        <div className="space-y-1">
          <div className="flex items-center justify-center gap-1.5">
            <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-white font-sans">
              NAWIRA <span className="text-[#48afff]">TRADERS</span>
            </h1>
            <span className="text-[10px] font-black px-2 py-0.5 rounded-full bg-sky-500/20 text-sky-300 border border-sky-400/30 uppercase tracking-wider">
              PK
            </span>
          </div>
          <p className="text-xs text-sky-200/80 font-medium">
            Pakistan&apos;s #1 PTA-Approved Mobile Marketplace
          </p>
        </div>

        {/* Dynamic Progress Bar & Status Text */}
        <div className="w-full space-y-2.5 pt-2">
          {/* Animated Track */}
          <div className="w-full h-1.5 sm:h-2 bg-white/10 rounded-full overflow-hidden p-0.5 border border-white/10">
            <div
              className="h-full bg-gradient-to-r from-sky-400 via-[#48afff] to-emerald-400 rounded-full transition-all duration-300 ease-out shadow-[0_0_12px_rgba(72,175,255,0.7)]"
              style={{ width: `${progress}%` }}
            />
          </div>

          {/* Cycling Status Label */}
          <div className="flex items-center justify-center gap-1.5 text-xs text-slate-300 min-h-[20px]">
            <Sparkles className="w-3.5 h-3.5 text-amber-300 shrink-0 animate-spin [animation-duration:3s]" />
            <span className="font-semibold text-slate-200 transition-all duration-200">
              {statusMessage}
            </span>
          </div>
        </div>

        {/* Subtle Trust Indicators */}
        <div className="pt-4 border-t border-white/10 flex items-center justify-center gap-4 text-[11px] text-slate-300 font-semibold">
          <span className="inline-flex items-center gap-1">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
            <span>100% PTA Approved</span>
          </span>
          <span className="text-white/30">•</span>
          <span className="inline-flex items-center gap-1">
            <PackageCheck className="w-3.5 h-3.5 text-sky-400" />
            <span>Open-Parcel COD</span>
          </span>
        </div>
      </div>
    </div>
  );
}

/**
 * Static Animated Fallback (used inside Suspense / app/loading.tsx)
 */
export function BrandLoadingScreen() {
  return (
    <div
      className="min-h-screen w-full flex flex-col items-center justify-center bg-gradient-to-br from-[#06182c] via-[#0b2b4d] to-[#041120] text-white p-6"
      role="status"
      aria-label="Loading Nawira Traders Catalog"
    >
      <div className="relative flex flex-col items-center max-w-sm text-center space-y-6 animate-in fade-in duration-300">
        <div className="relative">
          <div className="absolute -inset-3 rounded-3xl bg-sky-400/20 blur-xl animate-pulse" />
          <div className="w-20 h-20 rounded-2xl bg-[#0e3b66] border border-white/20 shadow-2xl flex items-center justify-center">
            <Smartphone className="w-10 h-10 text-white stroke-[1.8] animate-bounce [animation-duration:2s]" />
          </div>
        </div>

        <div className="space-y-1">
          <h2 className="text-2xl font-black text-white tracking-tight">
            NAWIRA <span className="text-[#48afff]">TRADERS</span>
          </h2>
          <p className="text-xs text-sky-200/80">Connecting to Pakistan&apos;s #1 Mobile Marketplace...</p>
        </div>

        <div className="w-48 h-1.5 bg-white/10 rounded-full overflow-hidden">
          <div className="h-full w-2/3 bg-gradient-to-r from-sky-400 to-emerald-400 rounded-full animate-pulse" />
        </div>
      </div>
    </div>
  );
}
