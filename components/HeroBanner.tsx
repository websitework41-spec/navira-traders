'use client';

import React, { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import {
  ShieldCheck,
  PackageCheck,
  Award,
  Zap,
  Sparkles,
  ArrowRight,
  ChevronLeft,
  ChevronRight,
  Flame,
  Truck,
  Percent,
  CreditCard,
  CheckCircle2,
  PhoneCall,
  Smartphone,
} from 'lucide-react';
import { PhoneImageWithFallback } from './PhoneImageWithFallback';
import { formatPKR } from '@/data/smartphones';
import { HeroBannerItem } from '@/types';
import { DEFAULT_HERO_BANNERS } from '@/lib/banners';

interface HeroBannerProps {
  onQuickFilter?: (brand: string) => void;
  onFilterBudget?: () => void;
  onFilterKeypad?: () => void;
  onOpenEMIModal?: () => void;
}

export function HeroBanner({
  onQuickFilter,
  onFilterBudget,
  onFilterKeypad,
  onOpenEMIModal,
}: HeroBannerProps) {
  const [slides, setSlides] = useState<HeroBannerItem[]>(() => {
    try {
      if (typeof window !== 'undefined') {
        const saved = localStorage.getItem('naviratraders_banners');
        if (saved) {
          const parsed = JSON.parse(saved);
          if (Array.isArray(parsed) && parsed.length > 0) {
            return parsed.filter((b: any) => b.isActive !== false);
          }
        }
      }
    } catch {}
    return DEFAULT_HERO_BANNERS;
  });

  const [currentSlideIndex, setCurrentSlideIndex] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const [touchStartX, setTouchStartX] = useState<number | null>(null);
  const [touchEndX, setTouchEndX] = useState<number | null>(null);

  // Sync banners from API and listen for Admin updates
  useEffect(() => {
    const fetchBanners = async () => {
      try {
        const res = await fetch(`/api/banners?_t=${Date.now()}`, { cache: 'no-store' });
        const data = await res.json();
        if (data.success && Array.isArray(data.banners) && data.banners.length > 0) {
          setSlides(data.banners);
          try {
            localStorage.setItem('naviratraders_banners', JSON.stringify(data.banners));
          } catch {}
        }
      } catch (err) {
        // Fall back gracefully to cache / default
      }
    };

    fetchBanners();

    const handleUpdate = () => {
      try {
        const saved = localStorage.getItem('naviratraders_banners');
        if (saved) {
          const parsed = JSON.parse(saved);
          if (Array.isArray(parsed) && parsed.length > 0) {
            setSlides(parsed.filter((b: any) => b.isActive !== false));
            return;
          }
        }
      } catch {}
      fetchBanners();
    };

    window.addEventListener('naviratraders_banners_updated', handleUpdate);
    window.addEventListener('storage', handleUpdate);
    return () => {
      window.removeEventListener('naviratraders_banners_updated', handleUpdate);
      window.removeEventListener('storage', handleUpdate);
    };
  }, []);

  const totalSlides = slides.length > 0 ? slides.length : DEFAULT_HERO_BANNERS.length;

  const nextSlide = useCallback(() => {
    setCurrentSlideIndex((prev) => (prev + 1) % totalSlides);
  }, [totalSlides]);

  const prevSlide = useCallback(() => {
    setCurrentSlideIndex((prev) => (prev - 1 + totalSlides) % totalSlides);
  }, [totalSlides]);

  const minSwipeDistance = 45;

  const handleTouchStart = (e: React.TouchEvent) => {
    setTouchEndX(null);
    setTouchStartX(e.targetTouches[0].clientX);
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    setTouchEndX(e.targetTouches[0].clientX);
  };

  const handleTouchEnd = () => {
    if (!touchStartX || !touchEndX) return;
    const distance = touchStartX - touchEndX;
    if (distance > minSwipeDistance) {
      nextSlide();
    } else if (distance < -minSwipeDistance) {
      prevSlide();
    }
  };

  useEffect(() => {
    if (isPaused) return;
    const interval = setInterval(nextSlide, 6000);
    return () => clearInterval(interval);
  }, [nextSlide, isPaused]);

  const slide = slides[currentSlideIndex] || slides[0] || DEFAULT_HERO_BANNERS[0];
  const isGraphic = slide.bannerType === 'graphic';

  return (
    <section className="relative w-full pb-6">
      {/* Top Split Layout: Main Dynamic Hero Carousel + Side Quick Promo Cards */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        {/* Main Hero Slider (8 cols) */}
        <div
          onMouseEnter={() => setIsPaused(true)}
          onMouseLeave={() => setIsPaused(false)}
          onTouchStart={handleTouchStart}
          onTouchMove={handleTouchMove}
          onTouchEnd={handleTouchEnd}
          className={`lg:col-span-8 relative overflow-hidden rounded-3xl bg-gradient-to-r ${slide.gradient || 'from-[#0b2b4a] via-[#0f497a] to-[#136ab5]'} text-white border border-slate-800 shadow-2xl transition-all duration-700 min-h-[380px] sm:min-h-[440px] flex flex-col justify-between group touch-pan-y`}
        >
          {/* Subtle Ambient Backdrops */}
          <div className="absolute top-0 right-0 w-96 h-96 bg-cyan-500/15 rounded-full blur-3xl pointer-events-none group-hover:scale-120 transition-transform duration-700" />
          <div className="absolute bottom-0 left-1/4 w-80 h-80 bg-indigo-500/15 rounded-full blur-3xl pointer-events-none" />

          {/* Slide Content: Either Full 16:9 Graphic Banner OR Signature 3D Product Showcase */}
          {isGraphic ? (
            <Link
              href={slide.link || '/#catalog'}
              className="relative w-full h-full min-h-[340px] sm:min-h-[380px] flex-1 flex items-center justify-center overflow-hidden rounded-t-3xl group/graphic"
            >
              <img
                src={slide.image}
                alt={slide.title}
                className="w-full h-full object-cover sm:object-contain transition-transform duration-700 group-hover/graphic:scale-105"
              />
              {(slide.title || slide.badge) && (
                <div className="absolute inset-0 bg-gradient-to-t from-slate-950/90 via-slate-950/30 to-transparent p-5 sm:p-10 flex flex-col justify-end">
                  {slide.badge && (
                    <span className="inline-flex items-center gap-1.5 self-start px-3 py-1 rounded-full text-[11px] font-extrabold uppercase tracking-wider bg-amber-400 text-slate-950 mb-2 shadow-md">
                      <Sparkles className="w-3.5 h-3.5" />
                      {slide.badge}
                    </span>
                  )}
                  <h2 className="text-2xl sm:text-4xl font-extrabold text-white tracking-tight drop-shadow-md">
                    {slide.title}
                  </h2>
                  {slide.highlight && (
                    <p className="text-sm sm:text-base text-sky-200 font-bold mt-1 drop-shadow-sm">
                      {slide.highlight}
                    </p>
                  )}
                  {slide.subtitle && (
                    <p className="text-xs sm:text-sm text-slate-200 mt-1 max-w-xl line-clamp-2 drop-shadow-sm">
                      {slide.subtitle}
                    </p>
                  )}
                  <div className="pt-3">
                    <span className="inline-flex items-center gap-2 px-6 py-3 rounded-full bg-[#48afff] hover:bg-[#229eff] text-white text-xs sm:text-sm font-black shadow-lg">
                      <span>{slide.ctaText || 'Shop Deal'}</span>
                      <ArrowRight className="w-4 h-4" />
                    </span>
                  </div>
                </div>
              )}
            </Link>
          ) : (
            <div className="relative z-10 p-4 sm:p-10 flex-1 grid grid-cols-1 sm:grid-cols-12 gap-4 sm:gap-6 items-center">
              {/* Left Copy & Actions */}
              <div className="sm:col-span-7 space-y-3.5 sm:space-y-4">
                <div className="flex flex-wrap items-center gap-2">
                  <span
                    className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-extrabold uppercase tracking-wider border backdrop-blur-md shadow-xs ${
                      slide.badgeColor || 'bg-[#48afff]/25 text-sky-200 border-[#48afff]/40'
                    }`}
                  >
                    <Sparkles className="w-3.5 h-3.5" />
                    {slide.badge}
                  </span>
                  <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
                    <ShieldCheck className="w-3.5 h-3.5" />
                    100% PTA Approved
                  </span>
                </div>

                <div>
                  <h1 className="text-2xl sm:text-4xl font-extrabold tracking-tight leading-tight text-white font-sans">
                    {slide.title}
                    {slide.highlight && (
                      <span className="block text-transparent bg-clip-text bg-gradient-to-r from-[#48afff] to-[#99d5ff] text-xl sm:text-2xl font-bold mt-1">
                        {slide.highlight}
                      </span>
                    )}
                  </h1>
                  {slide.subtitle && (
                    <p className="text-xs sm:text-sm text-slate-200 mt-2 leading-relaxed max-w-md line-clamp-3">
                      {slide.subtitle}
                    </p>
                  )}
                </div>

                {/* Pricing Display */}
                {slide.pricePKR !== undefined && slide.pricePKR > 0 && (
                  <div className="flex flex-wrap items-baseline gap-3 pt-1">
                    <div className="flex items-baseline gap-1">
                      <span className="text-sm font-bold text-sky-200">Rs</span>
                      <span className="text-2xl sm:text-3xl font-black text-white">
                        {slide.pricePKR.toLocaleString()}
                      </span>
                    </div>
                    {slide.originalPricePKR !== undefined && slide.originalPricePKR > slide.pricePKR && (
                      <div className="text-sm line-through text-slate-300">
                        Rs {slide.originalPricePKR.toLocaleString()}
                      </div>
                    )}
                    {slide.discountPercent !== undefined && slide.discountPercent > 0 && (
                      <div className="text-xs font-black px-2.5 py-0.5 rounded-full bg-[#f88b2a] text-white shadow-sm">
                        {slide.discountPercent}% OFF
                      </div>
                    )}
                  </div>
                )}

                {/* CTAs with Tactile Hover Animations */}
                <div className="flex flex-wrap items-center gap-3 pt-2">
                  <Link
                    href={slide.link || '/#catalog'}
                    className="btn-shimmer btn-press inline-flex items-center gap-2 px-6 py-3 rounded-full bg-[#48afff] hover:bg-[#229eff] text-white text-xs sm:text-sm font-black transition-all shadow-lg shadow-[#48afff]/30 hover:shadow-[#48afff]/50 cursor-pointer"
                  >
                    <span>{slide.ctaText || 'Shop Deal'}</span>
                    <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                  </Link>
                  {onOpenEMIModal && (
                    <button
                      onClick={onOpenEMIModal}
                      className="btn-press inline-flex items-center gap-2 px-5 py-3 rounded-full bg-white/10 hover:bg-white/20 text-white text-xs sm:text-sm font-semibold border border-white/25 hover:border-white/40 transition-all cursor-pointer shadow-md backdrop-blur-sm"
                    >
                      <CreditCard className="w-4 h-4 text-sky-300" />
                      <span>0% EMI Calculator</span>
                    </button>
                  )}
                </div>
              </div>

              {/* Right Visual Image with Gentle Floating Animation & Zoom */}
              <div className="sm:col-span-5 flex items-center justify-center relative">
                <div className="relative w-40 h-40 sm:w-60 sm:h-60 group/img my-1 sm:my-0">
                  <Link href={slide.link || '/#catalog'} className="relative block w-full h-full animate-float">
                    <div className="w-full h-full bg-white rounded-3xl p-3 sm:p-5 shadow-2xl border border-white/30 flex items-center justify-center overflow-hidden">
                      <PhoneImageWithFallback
                        src={slide.image}
                        alt={slide.phoneName || slide.title}
                        brand={slide.brand || 'Navira'}
                        className="w-full h-full object-contain group-hover/img:scale-105 transition-transform duration-500"
                        priority={currentSlideIndex === 0}
                      />
                    </div>
                  </Link>
                </div>
              </div>
            </div>
          )}

          {/* Slider Pagination Controls */}
          <div className="relative z-10 px-6 sm:px-10 py-3 bg-slate-950/60 backdrop-blur-md border-t border-slate-800/80 flex items-center justify-between">
            <div className="flex items-center gap-2">
              {slides.map((s, idx) => (
                <button
                  key={s.id}
                  onClick={() => setCurrentSlideIndex(idx)}
                  className={`h-2 rounded-full transition-all cursor-pointer ${
                    currentSlideIndex === idx
                      ? 'w-8 bg-[#48afff] shadow-sm shadow-[#48afff]/50'
                      : 'w-2 bg-slate-600 hover:bg-slate-400 hover:scale-125'
                  }`}
                  aria-label={`Go to slide ${idx + 1}`}
                />
              ))}
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={prevSlide}
                className="w-8 h-8 rounded-full bg-slate-800 hover:bg-slate-700 hover:scale-110 active:scale-95 text-slate-300 hover:text-white flex items-center justify-center transition-all cursor-pointer shadow-sm"
                aria-label="Previous slide"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <button
                onClick={nextSlide}
                className="w-8 h-8 rounded-full bg-slate-800 hover:bg-slate-700 hover:scale-110 active:scale-95 text-slate-300 hover:text-white flex items-center justify-center transition-all cursor-pointer shadow-sm"
                aria-label="Next slide"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>

        {/* Right Side: Dual Promotional Cards with Hover Lift */}
        <div className="lg:col-span-4 flex flex-col sm:flex-row lg:flex-col gap-4">
          {/* Promo Card 1: Budget Kings Under Rs. 35,000 */}
          <div
            onClick={() => {
              if (onFilterBudget) {
                onFilterBudget();
              } else {
                window.location.href = '/?maxPrice=35000#catalog';
              }
            }}
            className="flex-1 bg-white rounded-2xl p-5 border border-slate-200/80 shadow-[0_2px_12px_rgba(0,0,0,0.04)] hover:shadow-xl hover:border-[#48afff] hover:-translate-y-1.5 transition-all duration-300 flex flex-col justify-between relative overflow-hidden group cursor-pointer"
          >
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-[#fef3eb] text-[#f47708] border border-[#fcd5b8]">
                  <Flame className="w-3 h-3 text-[#f47708] fill-[#f47708] animate-pulse" />
                  Budget Kings
                </span>
                <span className="text-xs font-bold text-slate-400">Under 35K</span>
              </div>
              <h3 className="text-base font-extrabold text-slate-900 group-hover:text-[#136ab5] transition-colors">
                High Performance on a Budget
              </h3>
              <p className="text-xs text-slate-500 leading-relaxed">
                Xiaomi Redmi 10C, Infinix Hot 60 Pro, Tecno Spark 40 pro with 50MP AI camera &amp; 5000 mAh battery.
              </p>
            </div>

            <div className="pt-3 mt-2 border-t border-slate-100 flex items-center justify-between">
              <div>
                <span className="text-[11px] text-slate-400 block font-medium">Starting From</span>
                <span className="text-base font-black text-slate-950 group-hover:text-[#136ab5] transition-colors">Rs. 18,999</span>
              </div>
              <Link
                href="/?maxPrice=35000#catalog"
                onClick={(e) => {
                  e.stopPropagation();
                  if (onFilterBudget) {
                    e.preventDefault();
                    onFilterBudget();
                  }
                }}
                className="btn-press inline-flex items-center gap-1.5 px-4 py-2 rounded-full bg-[#48afff] hover:bg-[#229eff] text-white text-xs font-bold transition-all shadow-md shadow-[#48afff]/25 cursor-pointer"
              >
                <span>Explore</span>
                <ArrowRight className="w-3.5 h-3.5 text-white group-hover:translate-x-0.5 transition-all" />
              </Link>
            </div>
          </div>

          {/* Promo Card 2: Classic Keypad & Feature Phones */}
          <div
            onClick={() => {
              if (onFilterKeypad) {
                onFilterKeypad();
              } else {
                window.location.href = '/?category=keypad#catalog';
              }
            }}
            className="flex-1 bg-gradient-to-br from-[#136ab5] to-[#0a3f6d] rounded-2xl p-5 border border-[#136ab5]/60 shadow-[0_2px_12px_rgba(0,0,0,0.06)] hover:shadow-xl hover:border-[#48afff] hover:-translate-y-1.5 transition-all duration-300 flex flex-col justify-between text-white relative overflow-hidden group cursor-pointer"
          >
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-white/20 text-white border border-white/30 backdrop-blur-sm">
                  <Smartphone className="w-3 h-3" />
                  Keypad Mobiles
                </span>
                <span className="text-xs font-bold text-sky-200 bg-black/20 px-2.5 py-0.5 rounded-full border border-white/10">
                  22+ Models
                </span>
              </div>
              <h3 className="text-base font-extrabold text-white group-hover:text-sky-200 transition-colors">
                Nokia &amp; Itel Classic Keypad
              </h3>
              <p className="text-xs text-sky-100 leading-relaxed">
                Super long 1-week battery backup, wireless FM radio, Dual SIM PTA approved phones starting from Rs. 2,999.
              </p>
            </div>

            <div className="pt-3 mt-2 border-t border-white/15 flex items-center justify-between">
              <div>
                <span className="text-[11px] text-sky-200 block font-medium">From Only</span>
                <span className="text-base font-black text-white group-hover:text-sky-200 transition-colors">Rs. 2,999</span>
              </div>
              <Link
                href="/?category=keypad#catalog"
                onClick={(e) => {
                  e.stopPropagation();
                  if (onFilterKeypad) {
                    e.preventDefault();
                    onFilterKeypad();
                  }
                }}
                className="btn-shimmer btn-press inline-flex items-center gap-1.5 px-4 py-2 rounded-full bg-white hover:bg-slate-100 text-[#136ab5] text-xs font-bold transition-all shadow-md cursor-pointer"
              >
                <span>View Keypad</span>
                <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* 4-Pillar PriceOye Assured Kinetic Trust Bar */}
      <div className="mt-5 grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        {/* Pillar 1: Open Parcel */}
        <div className="group flex items-center gap-3 p-3.5 sm:p-4 rounded-2xl bg-white border border-slate-200/80 shadow-[0_2px_10px_rgba(0,0,0,0.03)] hover:border-[#48afff] hover:shadow-lg hover:-translate-y-1 transition-all duration-300 cursor-default">
          <div className="w-10 h-10 rounded-xl bg-sky-50 border border-sky-100 text-[#136ab5] flex items-center justify-center flex-shrink-0 group-hover:scale-115 group-hover:rotate-6 group-hover:bg-[#48afff] group-hover:text-white transition-all duration-300">
            <PackageCheck className="w-5 h-5 stroke-[2.2]" />
          </div>
          <div>
            <h4 className="text-xs sm:text-sm font-bold text-slate-950 group-hover:text-[#136ab5] transition-colors">Open Parcel COD</h4>
            <p className="text-[11px] text-slate-500 mt-0.5">Inspect phone before payment</p>
          </div>
        </div>

        {/* Pillar 2: 100% PTA Approved */}
        <div className="group flex items-center gap-3 p-3.5 sm:p-4 rounded-2xl bg-white border border-slate-200/80 shadow-[0_2px_10px_rgba(0,0,0,0.03)] hover:border-emerald-400 hover:shadow-lg hover:-translate-y-1 transition-all duration-300 cursor-default">
          <div className="w-10 h-10 rounded-xl bg-emerald-50 border border-emerald-100 text-emerald-700 flex items-center justify-center flex-shrink-0 group-hover:scale-115 group-hover:rotate-6 group-hover:bg-emerald-500 group-hover:text-white transition-all duration-300">
            <ShieldCheck className="w-5 h-5 stroke-[2.2]" />
          </div>
          <div>
            <h4 className="text-xs sm:text-sm font-bold text-slate-950 group-hover:text-emerald-700 transition-colors">100% PTA Approved</h4>
            <p className="text-[11px] text-slate-500 mt-0.5">DIRBS customs tax cleared</p>
          </div>
        </div>

        {/* Pillar 3: 1-Year Brand Warranty */}
        <div className="group flex items-center gap-3 p-3.5 sm:p-4 rounded-2xl bg-white border border-slate-200/80 shadow-[0_2px_10px_rgba(0,0,0,0.03)] hover:border-amber-400 hover:shadow-lg hover:-translate-y-1 transition-all duration-300 cursor-default">
          <div className="w-10 h-10 rounded-xl bg-amber-50 border border-amber-100 text-amber-700 flex items-center justify-center flex-shrink-0 group-hover:scale-115 group-hover:rotate-6 group-hover:bg-amber-500 group-hover:text-white transition-all duration-300">
            <Award className="w-5 h-5 stroke-[2.2]" />
          </div>
          <div>
            <h4 className="text-xs sm:text-sm font-bold text-slate-950 group-hover:text-amber-700 transition-colors">1-Year Warranty</h4>
            <p className="text-[11px] text-slate-500 mt-0.5">Direct official service claims</p>
          </div>
        </div>

        {/* Pillar 4: 0% Markup Installments */}
        <div className="group flex items-center gap-3 p-3.5 sm:p-4 rounded-2xl bg-white border border-slate-200/80 shadow-[0_2px_10px_rgba(0,0,0,0.03)] hover:border-blue-400 hover:shadow-lg hover:-translate-y-1 transition-all duration-300 cursor-default">
          <div className="w-10 h-10 rounded-xl bg-blue-50 border border-blue-100 text-[#136ab5] flex items-center justify-center flex-shrink-0 group-hover:scale-115 group-hover:rotate-6 group-hover:bg-[#136ab5] group-hover:text-white transition-all duration-300">
            <Percent className="w-5 h-5 stroke-[2.2]" />
          </div>
          <div>
            <h4 className="text-xs sm:text-sm font-bold text-slate-950 group-hover:text-[#136ab5] transition-colors">0% Markup EMI</h4>
            <p className="text-[11px] text-slate-500 mt-0.5">Up to 12 months with bank cards</p>
          </div>
        </div>
      </div>
    </section>
  );
}
