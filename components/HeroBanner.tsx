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
    const interval = setInterval(nextSlide, 6500);
    return () => clearInterval(interval);
  }, [nextSlide, isPaused]);

  const slide = slides[currentSlideIndex] || slides[0] || DEFAULT_HERO_BANNERS[0];
  const isGraphic = slide.bannerType === 'graphic' || Boolean(slide.image && slide.image.includes('panoramic'));

  return (
    <section className="relative w-full pb-6 space-y-4 sm:space-y-5">
      {/* 1. Full-Width Panoramic Hero Slider matching PriceOye clean aesthetic */}
      <div
        onMouseEnter={() => setIsPaused(true)}
        onMouseLeave={() => setIsPaused(false)}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        className="relative w-full overflow-hidden rounded-2xl sm:rounded-3xl shadow-xl transition-all duration-700 aspect-[16/6] sm:aspect-[33/10] min-h-[190px] sm:min-h-[260px] md:min-h-[340px] lg:min-h-[400px] max-h-[580px] group touch-pan-y bg-slate-950 border border-slate-200/80"
      >
        {/* Slide Content: Clean Panoramic Graphic Banner OR Product Showcase */}
        {isGraphic ? (
          <Link
            href={slide.link || '/#catalog'}
            className="relative w-full h-full block overflow-hidden group/graphic"
          >
            <img
              src={slide.image}
              alt={slide.title}
              className="w-full h-full object-cover transition-transform duration-700 group-hover/graphic:scale-[1.015]"
            />

            {/* Optional Floating CTAs if overlay is explicitly desired */}
            {!slide.hideOverlay && (slide.title || slide.badge) && (
              <div className="absolute inset-0 bg-gradient-to-t from-slate-950/90 via-slate-950/20 to-transparent p-5 sm:p-10 flex flex-col justify-end">
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
              </div>
            )}
          </Link>
        ) : (
          <div className="relative z-10 w-full h-full p-6 sm:p-12 flex items-center justify-between">
            <div className="max-w-xl space-y-3">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-extrabold uppercase tracking-wider bg-[#48afff]/25 text-sky-200 border border-[#48afff]/40">
                <Sparkles className="w-3.5 h-3.5" />
                {slide.badge}
              </span>
              <h1 className="text-2xl sm:text-4xl font-extrabold text-white">
                {slide.title}
              </h1>
              <p className="text-sm text-slate-200">{slide.subtitle}</p>
              <Link
                href={slide.link || '/#catalog'}
                className="inline-flex items-center gap-2 px-6 py-2.5 rounded-full bg-[#48afff] hover:bg-[#229eff] text-white text-xs font-bold"
              >
                <span>{slide.ctaText || 'Shop Deal'}</span>
                <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
            <div className="w-64 h-64 relative hidden sm:block">
              <PhoneImageWithFallback
                src={slide.image}
                alt={slide.title}
                brand={slide.brand || 'Navira'}
                className="w-full h-full object-contain"
              />
            </div>
          </div>
        )}

        {/* Floating Left / Right Panoramic Navigation Arrows matching PriceOye */}
        <button
          onClick={prevSlide}
          className="absolute left-2 sm:left-4 top-1/2 -translate-y-1/2 z-20 w-8 h-12 sm:w-10 sm:h-16 rounded-xl bg-slate-950/45 hover:bg-slate-950/80 text-white/90 hover:text-white backdrop-blur-md flex items-center justify-center transition-all cursor-pointer border border-white/10 shadow-xl active:scale-95 group/arrow"
          aria-label="Previous slide"
        >
          <ChevronLeft className="w-5 h-5 sm:w-6 sm:h-6 group-hover/arrow:-translate-x-0.5 transition-transform" />
        </button>

        <button
          onClick={nextSlide}
          className="absolute right-2 sm:right-4 top-1/2 -translate-y-1/2 z-20 w-8 h-12 sm:w-10 sm:h-16 rounded-xl bg-slate-950/45 hover:bg-slate-950/80 text-white/90 hover:text-white backdrop-blur-md flex items-center justify-center transition-all cursor-pointer border border-white/10 shadow-xl active:scale-95 group/arrow"
          aria-label="Next slide"
        >
          <ChevronRight className="w-5 h-5 sm:w-6 sm:h-6 group-hover/arrow:translate-x-0.5 transition-transform" />
        </button>

        {/* Floating Minimal Pagination Dots */}
        <div className="absolute bottom-2.5 sm:bottom-4 left-1/2 -translate-x-1/2 z-20 flex items-center gap-1.5 bg-slate-950/50 backdrop-blur-md px-3 py-1.5 rounded-full border border-white/10 shadow-lg">
          {slides.map((s, idx) => (
            <button
              key={s.id}
              onClick={() => setCurrentSlideIndex(idx)}
              className={`transition-all cursor-pointer rounded-full ${
                currentSlideIndex === idx
                  ? 'w-7 sm:w-8 h-1.5 sm:h-2 bg-white shadow-sm'
                  : 'w-1.5 sm:w-2 h-1.5 sm:h-2 bg-white/40 hover:bg-white/80'
              }`}
              aria-label={`Go to slide ${idx + 1}`}
            />
          ))}
        </div>
      </div>

      {/* 2. PriceOye Assured Kinetic Trust Bar (4 Full Columns) */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        {/* Pillar 1: Open Parcel */}
        <div className="group flex items-center gap-3 p-3.5 sm:p-4 rounded-2xl bg-white border border-slate-200/80 shadow-[0_2px_10px_rgba(0,0,0,0.03)] hover:border-[#48afff] hover:shadow-lg hover:-translate-y-0.5 transition-all duration-300 cursor-default">
          <div className="w-10 h-10 rounded-xl bg-sky-50 border border-sky-100 text-[#136ab5] flex items-center justify-center flex-shrink-0 group-hover:scale-110 group-hover:bg-[#48afff] group-hover:text-white transition-all duration-300">
            <PackageCheck className="w-5 h-5 stroke-[2.2]" />
          </div>
          <div>
            <h4 className="text-xs sm:text-sm font-bold text-slate-950 group-hover:text-[#136ab5] transition-colors">Open Parcel COD</h4>
            <p className="text-[11px] text-slate-500 mt-0.5">Inspect phone before payment</p>
          </div>
        </div>

        {/* Pillar 2: 100% PTA Approved */}
        <div className="group flex items-center gap-3 p-3.5 sm:p-4 rounded-2xl bg-white border border-slate-200/80 shadow-[0_2px_10px_rgba(0,0,0,0.03)] hover:border-emerald-400 hover:shadow-lg hover:-translate-y-0.5 transition-all duration-300 cursor-default">
          <div className="w-10 h-10 rounded-xl bg-emerald-50 border border-emerald-100 text-emerald-700 flex items-center justify-center flex-shrink-0 group-hover:scale-110 group-hover:bg-emerald-500 group-hover:text-white transition-all duration-300">
            <ShieldCheck className="w-5 h-5 stroke-[2.2]" />
          </div>
          <div>
            <h4 className="text-xs sm:text-sm font-bold text-slate-950 group-hover:text-emerald-700 transition-colors">100% PTA Approved</h4>
            <p className="text-[11px] text-slate-500 mt-0.5">DIRBS customs tax cleared</p>
          </div>
        </div>

        {/* Pillar 3: 1-Year Brand Warranty */}
        <div className="group flex items-center gap-3 p-3.5 sm:p-4 rounded-2xl bg-white border border-slate-200/80 shadow-[0_2px_10px_rgba(0,0,0,0.03)] hover:border-amber-400 hover:shadow-lg hover:-translate-y-0.5 transition-all duration-300 cursor-default">
          <div className="w-10 h-10 rounded-xl bg-amber-50 border border-amber-100 text-amber-700 flex items-center justify-center flex-shrink-0 group-hover:scale-110 group-hover:bg-amber-500 group-hover:text-white transition-all duration-300">
            <Award className="w-5 h-5 stroke-[2.2]" />
          </div>
          <div>
            <h4 className="text-xs sm:text-sm font-bold text-slate-950 group-hover:text-amber-700 transition-colors">Official Brand Warranty</h4>
            <p className="text-[11px] text-slate-500 mt-0.5">1-Year Authorised coverage</p>
          </div>
        </div>

        {/* Pillar 4: 0% Markup EMI */}
        <div
          onClick={onOpenEMIModal}
          className="group flex items-center gap-3 p-3.5 sm:p-4 rounded-2xl bg-white border border-slate-200/80 shadow-[0_2px_10px_rgba(0,0,0,0.03)] hover:border-purple-400 hover:shadow-lg hover:-translate-y-0.5 transition-all duration-300 cursor-pointer"
        >
          <div className="w-10 h-10 rounded-xl bg-purple-50 border border-purple-100 text-purple-700 flex items-center justify-center flex-shrink-0 group-hover:scale-110 group-hover:bg-purple-600 group-hover:text-white transition-all duration-300">
            <CreditCard className="w-5 h-5 stroke-[2.2]" />
          </div>
          <div>
            <h4 className="text-xs sm:text-sm font-bold text-slate-950 group-hover:text-purple-700 transition-colors">Bank Installments</h4>
            <p className="text-[11px] text-slate-500 mt-0.5">3 to 36 months plans</p>
          </div>
        </div>
      </div>

      {/* 3. Quick Access Promo Cards (Under-35k Budget & Keypad Mobiles) */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Promo Card 1: Budget Kings Under Rs. 35,000 */}
        <div
          onClick={() => {
            if (onFilterBudget) {
              onFilterBudget();
            } else {
              window.location.href = '/?maxPrice=35000#catalog';
            }
          }}
          className="group relative overflow-hidden rounded-2xl p-5 bg-gradient-to-r from-[#0c2e4e] via-[#145388] to-[#1a6bb0] text-white shadow-md hover:shadow-xl hover:-translate-y-1 transition-all duration-300 cursor-pointer border border-sky-800 flex flex-col justify-between min-h-[140px]"
        >
          <div className="flex items-center justify-between">
            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-[#f88b2a] text-white shadow-sm">
              <Zap className="w-3 h-3" />
              Budget Kings
            </span>
            <span className="text-xs font-bold text-sky-200 bg-black/20 px-2.5 py-0.5 rounded-full border border-white/10">
              Under Rs. 35,000
            </span>
          </div>
          <div className="my-2">
            <h3 className="text-base sm:text-lg font-extrabold text-white group-hover:text-sky-200 transition-colors">
              Best Phones Under Rs. 35,000
            </h3>
            <p className="text-xs text-sky-100 line-clamp-1">
              Xiaomi, Infinix, Tecno &amp; Realme smartphones with 50MP cameras and 5000mAh batteries.
            </p>
          </div>
          <div className="flex items-center justify-between pt-2 border-t border-white/15">
            <span className="text-xs font-bold text-sky-200">Starting from Rs. 21,999</span>
            <span className="inline-flex items-center gap-1 text-xs font-bold text-white group-hover:translate-x-1 transition-transform">
              Explore Deals <ArrowRight className="w-3.5 h-3.5" />
            </span>
          </div>
        </div>

        {/* Promo Card 2: Keypad Mobiles */}
        <div
          onClick={() => {
            if (onFilterKeypad) {
              onFilterKeypad();
            } else {
              window.location.href = '/?category=keypad#catalog';
            }
          }}
          className="group relative overflow-hidden rounded-2xl p-5 bg-gradient-to-r from-[#1a384f] via-[#245272] to-[#2c6d96] text-white shadow-md hover:shadow-xl hover:-translate-y-1 transition-all duration-300 cursor-pointer border border-sky-800 flex flex-col justify-between min-h-[140px]"
        >
          <div className="flex items-center justify-between">
            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-white/20 text-white border border-white/30 backdrop-blur-sm">
              <Smartphone className="w-3 h-3" />
              Keypad Classics
            </span>
            <span className="text-xs font-bold text-sky-200 bg-black/20 px-2.5 py-0.5 rounded-full border border-white/10">
              22+ Models
            </span>
          </div>
          <div className="my-2">
            <h3 className="text-base sm:text-lg font-extrabold text-white group-hover:text-sky-200 transition-colors">
              Nokia &amp; Itel Keypad Mobiles
            </h3>
            <p className="text-xs text-sky-100 line-clamp-1">
              Super long 1-week battery backup, wireless FM, Dual SIM PTA approved phones from Rs. 2,999.
            </p>
          </div>
          <div className="flex items-center justify-between pt-2 border-t border-white/15">
            <span className="text-xs font-bold text-sky-200">From Only Rs. 2,999</span>
            <span className="inline-flex items-center gap-1 text-xs font-bold text-white group-hover:translate-x-1 transition-transform">
              View Keypad <ArrowRight className="w-3.5 h-3.5" />
            </span>
          </div>
        </div>
      </div>
    </section>
  );
}
