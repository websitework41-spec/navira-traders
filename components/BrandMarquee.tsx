'use client';

import React from 'react';
import { Smartphone as PhoneIcon, Sparkles } from 'lucide-react';

interface BrandMarqueeProps {
  onSelectBrand: (brand: string) => void;
  activeBrand?: string;
  brandCounts?: Record<string, number>;
}

const BRANDS_LIST = [
  { name: 'Apple', tag: 'iOS 18', logoText: '', badge: 'Flagship', accent: 'bg-black text-white hover:border-slate-800' },
  { name: 'Samsung', tag: 'Galaxy AI', logoText: 'SAMSUNG', badge: 'Top Seller', accent: 'bg-[#1428a0] text-white hover:border-blue-700' },
  { name: 'Xiaomi', tag: 'HyperOS', logoText: 'mi', badge: 'Best Value', accent: 'bg-[#ff6900] text-white hover:border-orange-600' },
  { name: 'Infinix', tag: 'Gaming', logoText: 'INFINIX', badge: 'Budget King', accent: 'bg-emerald-950 text-emerald-400 hover:border-emerald-700' },
  { name: 'Vivo', tag: 'ZEISS Cam', logoText: 'vivo', badge: 'Portrait Pro', accent: 'bg-[#0047ba] text-white hover:border-blue-600' },
  { name: 'Tecno', tag: 'Camon Cam', logoText: 'TECNO', badge: 'Popular', accent: 'bg-[#0033a0] text-white hover:border-blue-800' },
  { name: 'Realme', tag: 'FastCharge', logoText: 'realme', badge: 'Trending', accent: 'bg-[#f7c000] text-black hover:border-yellow-600' },
  { name: 'Oppo', tag: 'VOOC 80W', logoText: 'OPPO', badge: 'SuperVOOC', accent: 'bg-[#008544] text-white hover:border-green-700' },
  { name: 'Google', tag: 'Pixel AI', logoText: 'Google', badge: 'Pure Android', accent: 'bg-slate-900 text-white hover:border-slate-700' },
  { name: 'OnePlus', tag: 'OxygenOS', logoText: '1+', badge: 'Never Settle', accent: 'bg-[#eb0028] text-white hover:border-red-600' },
];

export function BrandMarquee({ onSelectBrand, activeBrand, brandCounts = {} }: BrandMarqueeProps) {
  // Duplicate array for seamless infinite marquee loop
  const marqueeItems = [...BRANDS_LIST, ...BRANDS_LIST];

  return (
    <section className="relative w-full my-6 overflow-hidden">
      {/* Header bar */}
      <div className="flex items-center justify-between px-1 mb-2.5">
        <div className="flex items-center gap-2">
          <span className="flex h-2 w-2 relative">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-sky-400 opacity-75" />
            <span className="relative inline-flex rounded-full h-2 w-2 bg-[#48afff]" />
          </span>
          <span className="text-xs font-black uppercase tracking-wider text-slate-800 font-sans">
            Official Brand Partners &amp; Direct PTA Stock
          </span>
        </div>
        <div className="hidden sm:flex items-center gap-1.5 text-[11px] font-bold text-slate-500">
          <Sparkles className="w-3.5 h-3.5 text-amber-500" />
          <span>Click any brand to filter</span>
        </div>
      </div>

      {/* Marquee Container with Fade Masks on Left & Right */}
      <div className="relative w-full py-1 overflow-hidden bg-white/70 backdrop-blur-md rounded-2xl border border-slate-200/80 shadow-[0_2px_12px_rgba(0,0,0,0.03)] group">
        {/* Left Gradient Mask */}
        <div className="pointer-events-none absolute inset-y-0 left-0 w-12 sm:w-20 bg-gradient-to-r from-white via-white/80 to-transparent z-10" />

        {/* Right Gradient Mask */}
        <div className="pointer-events-none absolute inset-y-0 right-0 w-12 sm:w-20 bg-gradient-to-l from-white via-white/80 to-transparent z-10" />

        {/* Animated Track */}
        <div className="animate-marquee py-2 flex items-center gap-3">
          {marqueeItems.map((brand, idx) => {
            const isSelected = activeBrand === brand.name;
            const count = brandCounts[brand.name] ?? null;

            return (
              <button
                key={`${brand.name}-${idx}`}
                onClick={() => onSelectBrand(brand.name)}
                className={`flex items-center gap-2.5 px-3.5 py-2 rounded-xl transition-all duration-200 cursor-pointer border select-none shrink-0 ${
                  isSelected
                    ? 'bg-sky-500 text-white border-sky-600 shadow-md scale-105'
                    : 'bg-white hover:bg-slate-50 text-slate-800 border-slate-200/90 shadow-xs hover:shadow-md hover:-translate-y-0.5'
                }`}
                title={`Filter by ${brand.name}`}
              >
                {/* Brand Logo Avatar */}
                <span
                  className={`w-7 h-7 rounded-lg flex items-center justify-center font-black text-[11px] tracking-tight shadow-xs shrink-0 ${brand.accent}`}
                >
                  {brand.logoText}
                </span>

                {/* Brand Name & Info */}
                <div className="text-left flex flex-col justify-center">
                  <div className="flex items-center gap-1.5 leading-none">
                    <span className="text-xs font-black tracking-tight">{brand.name}</span>
                    <span
                      className={`text-[8px] font-bold px-1 py-0.2 rounded uppercase ${
                        isSelected ? 'bg-white/20 text-white' : 'bg-slate-100 text-slate-600'
                      }`}
                    >
                      {brand.badge}
                    </span>
                  </div>
                  <span
                    className={`text-[9px] font-semibold mt-0.5 ${
                      isSelected ? 'text-sky-100' : 'text-slate-400'
                    }`}
                  >
                    {count !== null ? `${count} Models Available` : brand.tag}
                  </span>
                </div>
              </button>
            );
          })}
        </div>
      </div>
    </section>
  );
}
