'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  Sparkles,
  Flame,
  ShieldCheck,
  PackageCheck,
  CreditCard,
  ArrowRight,
  Zap,
  Clock,
  CheckCircle2,
  PhoneCall
} from 'lucide-react';
import { PhoneImageWithFallback } from './PhoneImageWithFallback';
import { formatPKR } from '@/data/smartphones';

interface FlagshipSpotlightProps {
  onOpenEMIModal?: () => void;
}

export function FlagshipSpotlight({ onOpenEMIModal }: FlagshipSpotlightProps) {
  // Live Countdown Timer (Simulated Flash Sale ending midnight)
  const [timeLeft, setTimeLeft] = useState({ hours: 7, minutes: 24, seconds: 48 });

  useEffect(() => {
    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev.seconds > 0) {
          return { ...prev, seconds: prev.seconds - 1 };
        } else if (prev.minutes > 0) {
          return { ...prev, minutes: 59, seconds: 59 };
        } else if (prev.hours > 0) {
          return { hours: prev.hours - 1, minutes: 59, seconds: 59 };
        }
        return { hours: 12, minutes: 0, seconds: 0 };
      });
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  return (
    <section className="w-full my-10 relative">
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-[#050b14] via-[#091629] to-[#0c223f] border border-sky-500/30 text-white shadow-2xl p-6 sm:p-10">
        {/* Cinematic Ambient Glows */}
        <div className="pointer-events-none absolute -top-24 -left-24 w-96 h-96 bg-sky-500/20 rounded-full blur-[100px]" />
        <div className="pointer-events-none absolute -bottom-24 -right-24 w-96 h-96 bg-blue-600/20 rounded-full blur-[100px]" />

        {/* Top Header Row with Countdown */}
        <div className="relative z-10 flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-white/10">
          <div className="flex items-center gap-2.5">
            <span className="w-8 h-8 rounded-xl bg-amber-500/20 border border-amber-400/40 flex items-center justify-center text-amber-300">
              <Flame className="w-5 h-5 fill-amber-400 animate-pulse" />
            </span>
            <div>
              <span className="text-[10px] font-black uppercase tracking-widest text-amber-400 block font-sans">
                Official Deal of the Day
              </span>
              <h2 className="text-lg sm:text-xl font-black tracking-tight text-white font-sans">
                Flagship of the Week Spotlight
              </h2>
            </div>
          </div>

          {/* Flash Timer Badge */}
          <div className="flex items-center gap-2 bg-white/10 backdrop-blur-md px-3.5 py-1.5 rounded-2xl border border-white/15 self-start sm:self-auto">
            <Clock className="w-4 h-4 text-sky-400" />
            <span className="text-xs font-semibold text-slate-300">Ends in:</span>
            <div className="font-mono text-xs font-black text-white flex items-center gap-1">
              <span className="bg-sky-500/40 px-1.5 py-0.5 rounded">{String(timeLeft.hours).padStart(2, '0')}h</span>
              <span>:</span>
              <span className="bg-sky-500/40 px-1.5 py-0.5 rounded">{String(timeLeft.minutes).padStart(2, '0')}m</span>
              <span>:</span>
              <span className="bg-sky-500/40 px-1.5 py-0.5 rounded text-amber-300">{String(timeLeft.seconds).padStart(2, '0')}s</span>
            </div>
          </div>
        </div>

        {/* Main Content Grid */}
        <div className="relative z-10 grid grid-cols-1 lg:grid-cols-12 gap-8 items-center pt-8">
          {/* Left Hero Phone Details (7 Cols) */}
          <div className="lg:col-span-7 space-y-5">
            <div className="flex flex-wrap items-center gap-2">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-black uppercase tracking-wider bg-sky-500/20 text-sky-300 border border-sky-400/30">
                <Sparkles className="w-3.5 h-3.5" />
                Galaxy AI • Snapdragon 8 Gen 3
              </span>
              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-400/30">
                <ShieldCheck className="w-3.5 h-3.5" />
                100% PTA Customs Cleared
              </span>
            </div>

            <div>
              <h3 className="text-3xl sm:text-5xl font-black tracking-tight text-white font-sans leading-tight">
                Samsung Galaxy S24 Ultra
              </h3>
              <p className="text-xs sm:text-sm text-slate-300 mt-2 max-w-xl leading-relaxed">
                Titanium chassis, 200MP Quad-Telephoto zoom system, built-in S-Pen, and 7 years of guaranteed security updates. Shipped in official factory-sealed box with Open-Parcel inspection.
              </p>
            </div>

            {/* Spec Highlights Matrix */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 py-2">
              <div className="bg-white/5 backdrop-blur-md rounded-2xl p-3 border border-white/10">
                <span className="text-[10px] font-bold text-sky-400 block uppercase">Camera</span>
                <span className="text-xs font-black text-white">200MP OIS Zoom</span>
              </div>
              <div className="bg-white/5 backdrop-blur-md rounded-2xl p-3 border border-white/10">
                <span className="text-[10px] font-bold text-sky-400 block uppercase">Display</span>
                <span className="text-xs font-black text-white">6.8&quot; 120Hz 2600nits</span>
              </div>
              <div className="bg-white/5 backdrop-blur-md rounded-2xl p-3 border border-white/10">
                <span className="text-[10px] font-bold text-sky-400 block uppercase">Battery</span>
                <span className="text-xs font-black text-white">5000mAh 45W</span>
              </div>
              <div className="bg-white/5 backdrop-blur-md rounded-2xl p-3 border border-white/10">
                <span className="text-[10px] font-bold text-sky-400 block uppercase">Warranty</span>
                <span className="text-xs font-black text-white">1-Year Official</span>
              </div>
            </div>

            {/* Price & Savings */}
            <div className="flex flex-wrap items-baseline gap-3 pt-2">
              <div className="flex items-baseline gap-1">
                <span className="text-sm font-bold text-sky-300">Rs.</span>
                <span className="text-3xl sm:text-4xl font-black text-white tracking-tight">
                  316,999
                </span>
              </div>
              <div className="text-sm sm:text-base line-through text-slate-400">
                Rs. 469,999
              </div>
              <div className="text-xs font-black px-2.5 py-1 rounded-full bg-emerald-500 text-white shadow-md">
                SAVE RS. 153,000 (33% OFF)
              </div>
            </div>

            {/* 0% Installment tag */}
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-xl bg-white/5 border border-white/10 text-xs text-sky-200">
              <CreditCard className="w-3.5 h-3.5 text-sky-400" />
              <span>Or pay <strong>Rs. 26,416 / month</strong> with 0% EMI Installments</span>
            </div>

            {/* CTAs */}
            <div className="flex flex-wrap items-center gap-3 pt-3">
              <Link
                href="/product/samsung-galaxy-s24-ultra"
                className="btn-shimmer inline-flex items-center gap-2 px-7 py-3.5 rounded-full bg-gradient-to-r from-[#48afff] to-[#1084d0] hover:from-[#229eff] hover:to-[#0b3c68] text-white text-xs sm:text-sm font-black transition-all shadow-xl shadow-sky-500/25 hover:shadow-sky-500/40 hover:scale-105 cursor-pointer"
              >
                <Zap className="w-4 h-4 fill-white" />
                <span>Order Now (Open-Parcel COD)</span>
                <ArrowRight className="w-4 h-4" />
              </Link>

              <a
                href="https://wa.me/923135221200?text=Hi%20Nawira%20Traders!%20I%20am%20interested%20in%20the%20Samsung%20Galaxy%20S24%20Ultra%20Deal%20of%20the%20Day."
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 px-5 py-3.5 rounded-full bg-white/10 hover:bg-white/20 text-white text-xs sm:text-sm font-bold border border-white/20 hover:border-white/40 transition-all cursor-pointer backdrop-blur-md"
              >
                <PhoneCall className="w-4 h-4 text-emerald-400" />
                <span>WhatsApp VIP Concierge</span>
              </a>
            </div>
          </div>

          {/* Right Floating Visual Phone Display (5 Cols) */}
          <div className="lg:col-span-5 flex items-center justify-center relative">
            <div className="relative w-64 h-64 sm:w-80 sm:h-80 group">
              {/* Radial Phone Backlight */}
              <div className="absolute inset-0 bg-radial from-sky-400/30 via-sky-600/10 to-transparent rounded-full filter blur-2xl group-hover:scale-110 transition-transform duration-700" />

              <Link href="/product/samsung-galaxy-s24-ultra" className="relative block w-full h-full animate-float">
                <div className="w-full h-full rounded-3xl p-6 flex items-center justify-center">
                  <PhoneImageWithFallback
                    src="https://images.priceoye.pk/samsung-galaxy-s24-ultra-pakistan-priceoye-d4s6b-500x500.webp"
                    alt="Samsung Galaxy S24 Ultra"
                    brand="Samsung"
                    className="w-full h-full object-contain filter drop-shadow-[0_20px_30px_rgba(0,0,0,0.6)] group-hover:scale-105 transition-transform duration-500"
                    priority
                  />
                </div>
              </Link>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
