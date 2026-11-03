'use client';

import React from 'react';
import Link from 'next/link';
import {
  ShieldCheck,
  PackageCheck,
  Sparkles,
  Zap,
  ArrowRight,
  CreditCard,
  CheckCircle2,
  Clock,
  ExternalLink,
  Flame,
  Award,
  ChevronRight,
  Smartphone,
  Percent,
} from 'lucide-react';
import { PhoneImageWithFallback } from './PhoneImageWithFallback';
import { formatPKR } from '@/data/smartphones';

interface BannerProps {
  onSelectBrand?: (brand: string) => void;
  onFilterCategory?: (filterKey: string, value: any) => void;
  onFilterBudget?: () => void;
  onFilterKeypad?: () => void;
  onOpenEMIModal?: () => void;
}

/**
 * Banner 0: Oppo Reno 13 Series Launch Spotlight (Featuring the 16:9 poster)
 */
export function CatalogBannerOppoReno({ onSelectBrand }: BannerProps) {
  return (
    <div className="group col-span-full my-6 overflow-hidden rounded-2xl bg-gradient-to-r from-[#1d152c] via-[#2f2048] to-[#48316e] border border-purple-800 shadow-xl hover:shadow-2xl hover:border-purple-400 hover:-translate-y-1.5 transition-all duration-500 relative">
      <div className="absolute -top-24 -right-24 w-80 h-80 bg-purple-500/20 rounded-full blur-3xl pointer-events-none group-hover:scale-125 transition-transform duration-700" />
      <div className="absolute -bottom-24 left-1/3 w-64 h-64 bg-indigo-500/15 rounded-full blur-3xl pointer-events-none" />

      <div className="relative z-10 grid grid-cols-1 md:grid-cols-12 gap-6 p-6 sm:p-8 items-center">
        {/* Left Information Column */}
        <div className="md:col-span-6 space-y-3.5">
          <div className="flex flex-wrap items-center gap-2">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-purple-500/25 border border-purple-400/40 text-purple-200 text-[11px] font-extrabold uppercase tracking-wider shadow-xs">
              <Sparkles className="w-3.5 h-3.5 text-purple-300 animate-pulse" /> New Launch Spotlight
            </span>
            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-emerald-500/20 border border-emerald-500/30 text-emerald-300 text-[11px] font-bold">
              <ShieldCheck className="w-3.5 h-3.5" /> 100% PTA Approved
            </span>
            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-amber-500/20 border border-amber-500/30 text-amber-200 text-[11px] font-bold">
              <PackageCheck className="w-3.5 h-3.5" /> Open Parcel Delivery
            </span>
          </div>

          <div>
            <h3 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight font-sans">
              Oppo Reno 13 Series{' '}
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-300 to-pink-200">
                • Cold Sculpted Glass
              </span>
            </h3>
            <p className="text-xs sm:text-sm text-slate-200 mt-1 max-w-xl leading-relaxed">
              Starlight Butterfly pattern, aerospace-grade metal frame, 50MP Sony Ultra-Clear camera with AI Livephoto & IP69 all-scenario waterproofing.
            </p>
          </div>

          {/* Pricing Highlight Pill */}
          <div className="flex flex-wrap items-baseline gap-3 pt-1">
            <div className="flex items-baseline gap-1">
              <span className="text-sm font-bold text-purple-200">Rs</span>
              <span className="text-2xl sm:text-3xl font-black text-white">
                {(119999).toLocaleString()}
              </span>
            </div>
            <div className="text-sm line-through text-slate-300">
              Rs {(149999).toLocaleString()}
            </div>
            <div className="text-xs font-black px-2.5 py-0.5 rounded-full bg-purple-600 text-white shadow-sm">
              20% OFF
            </div>
          </div>

          {/* Call to Action Buttons */}
          <div className="flex flex-wrap items-center gap-3 pt-2">
            <Link
              href="/product/oppo-reno-13"
              className="btn-shimmer btn-press inline-flex items-center gap-2 px-6 py-3 rounded-full bg-purple-600 hover:bg-purple-500 text-white text-xs font-extrabold transition-all shadow-md shadow-purple-600/30 hover:shadow-lg hover:shadow-purple-600/50 cursor-pointer"
            >
              <span>View Reno 13 Specs</span>
              <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
            </Link>
            <button
              onClick={() => onSelectBrand && onSelectBrand('Oppo')}
              className="btn-press inline-flex items-center gap-2 px-5 py-3 rounded-full bg-white/10 hover:bg-white/20 text-white text-xs font-semibold border border-white/20 hover:border-white/40 transition-all cursor-pointer shadow-xs backdrop-blur-sm"
            >
              <span>All 12 Oppo Phones</span>
            </button>
          </div>
        </div>

        {/* Right Phone Visual Column with 16:9 Poster */}
        <div className="md:col-span-6 flex items-center justify-center relative">
          <Link
            href="/product/oppo-reno-13"
            className="relative w-full aspect-[16/9] rounded-2xl overflow-hidden shadow-2xl border border-white/20 group/poster block"
          >
            <img
              src="/banners/oppo-reno-13-banner.webp"
              alt="Oppo Reno 13 Poster"
              className="w-full h-full object-cover group-hover/poster:scale-105 transition-transform duration-700"
            />
          </Link>
        </div>
      </div>
    </div>
  );
}

/**
 * Banner 1: Samsung Galaxy S24 Ultra & Galaxy AI Launch Spotlight
 */
export function CatalogBannerS24Ultra({ onSelectBrand }: BannerProps) {
  return (
    <div className="group col-span-full my-6 overflow-hidden rounded-2xl bg-gradient-to-r from-[#0b2b4a] via-[#0f497a] to-[#136ab5] border border-sky-800 shadow-xl hover:shadow-2xl hover:border-[#48afff] hover:-translate-y-1.5 transition-all duration-500 relative">
      {/* Decorative Glow with Scale on Hover */}
      <div className="absolute -top-24 -right-24 w-80 h-80 bg-[#48afff]/20 rounded-full blur-3xl pointer-events-none group-hover:scale-125 transition-transform duration-700" />
      <div className="absolute -bottom-24 left-1/3 w-64 h-64 bg-blue-500/15 rounded-full blur-3xl pointer-events-none" />

      <div className="relative z-10 grid grid-cols-1 md:grid-cols-12 gap-6 p-6 sm:p-8 items-center">
        {/* Left Information Column */}
        <div className="md:col-span-7 space-y-3.5">
          <div className="flex flex-wrap items-center gap-2">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#48afff]/25 border border-[#48afff]/40 text-sky-200 text-[11px] font-extrabold uppercase tracking-wider shadow-xs">
              <Sparkles className="w-3.5 h-3.5 animate-pulse" /> Flagship Spotlight
            </span>
            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-emerald-500/20 border border-emerald-500/30 text-emerald-300 text-[11px] font-bold">
              <ShieldCheck className="w-3.5 h-3.5" /> 100% PTA Approved
            </span>
            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-amber-500/20 border border-amber-500/30 text-amber-200 text-[11px] font-bold">
              <PackageCheck className="w-3.5 h-3.5" /> Open Parcel COD
            </span>
          </div>

          <div>
            <h3 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight font-sans">
              Samsung Galaxy S24 Ultra{' '}
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#48afff] to-[#99d5ff]">
                • Galaxy AI
              </span>
            </h3>
            <p className="text-xs sm:text-sm text-slate-200 mt-1 max-w-xl leading-relaxed">
              Titanium frame, 200MP AI Quad-Telephoto zoom, Snapdragon 8 Gen 3 for Galaxy, and 7 years of Android OS updates. Matched with nationwide official retail pricing.
            </p>
          </div>

          {/* Pricing Highlight Pill */}
          <div className="flex flex-wrap items-baseline gap-3 pt-1">
            <div className="flex items-baseline gap-1">
              <span className="text-sm font-bold text-sky-200">Rs</span>
              <span className="text-2xl sm:text-3xl font-black text-white">
                {(316999).toLocaleString()}
              </span>
            </div>
            <div className="text-sm line-through text-slate-300">
              Rs {(469999).toLocaleString()}
            </div>
            <div className="text-xs font-black px-2.5 py-0.5 rounded-full bg-[#f88b2a] text-white shadow-sm">
              33% OFF
            </div>
          </div>

          {/* Call to Action Buttons */}
          <div className="flex flex-wrap items-center gap-3 pt-2">
            <Link
              href="/product/samsung-galaxy-s24-ultra"
              className="btn-shimmer btn-press inline-flex items-center gap-2 px-6 py-3 rounded-full bg-[#48afff] hover:bg-[#229eff] text-white text-xs font-extrabold transition-all shadow-md shadow-[#48afff]/25 hover:shadow-lg hover:shadow-[#48afff]/40 cursor-pointer"
            >
              <span>View S24 Ultra Specs</span>
              <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
            </Link>
            <button
              onClick={() => onSelectBrand && onSelectBrand('Samsung')}
              className="btn-press inline-flex items-center gap-2 px-5 py-3 rounded-full bg-white/10 hover:bg-white/20 text-white text-xs font-semibold border border-white/20 hover:border-white/40 transition-all cursor-pointer shadow-xs backdrop-blur-sm"
            >
              <span>All 25 Samsung Phones</span>
            </button>
          </div>
        </div>

        {/* Right Phone Visual Column with Showcase Card */}
        <div className="md:col-span-5 flex items-center justify-center relative">
          <div className="relative w-48 h-48 sm:w-56 sm:h-56 group/img">
            <div className="absolute -inset-2 bg-gradient-to-tr from-[#48afff]/30 to-blue-400/20 rounded-3xl blur-xl group-hover:scale-110 transition-transform duration-700" />
            <div className="relative z-10 w-full h-full bg-white rounded-3xl p-4 sm:p-5 shadow-2xl border border-white/30 flex items-center justify-center overflow-hidden">
              <PhoneImageWithFallback
                src="https://images.priceoye.pk/samsung-galaxy-s24-ultra-pakistan-priceoye-d4s6b-500x500.webp"
                alt="Samsung Galaxy S24 Ultra"
                brand="Samsung"
                className="w-full h-full object-contain group-hover/img:scale-105 transition-transform duration-500"
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

/**
 * Banner 2: Dual Promotional Cards (Budget Kings & Keypad Champions)
 */
export function CatalogBannerDualCards({
  onSelectBrand,
  onFilterCategory,
  onFilterBudget,
  onFilterKeypad,
}: BannerProps) {
  return (
    <div className="col-span-full my-6 grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-5">
      {/* Card 1: Budget Kings */}
      <div className="group rounded-3xl p-6 bg-gradient-to-br from-amber-50/80 to-orange-50/80 border border-amber-200/90 shadow-sm hover:shadow-xl hover:border-amber-400 hover:-translate-y-1.5 transition-all duration-300 relative overflow-hidden flex flex-col justify-between">
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-500/15 border border-amber-500/30 text-amber-800 text-[11px] font-black uppercase tracking-wider">
              <Flame className="w-3.5 h-3.5 text-amber-600 fill-amber-600 animate-pulse" />
              Budget Superstars
            </span>
            <span className="text-xs font-bold text-amber-900 bg-amber-200/50 px-2.5 py-0.5 rounded-full">
              Under 35,000 PKR
            </span>
          </div>

          <div>
            <h4 className="text-xl font-extrabold text-slate-950 font-sans group-hover:text-amber-900 transition-colors">
              Redmi 10C &amp; Infinix Hot 60
            </h4>
            <p className="text-xs text-slate-600 mt-1 leading-relaxed">
              120Hz smooth displays, 50MP AI high-res cameras, and massive 5000mAh batteries. Genuine Pakistani distributor warranty.
            </p>
          </div>

          <div className="flex items-baseline gap-2 pt-1">
            <span className="text-xs text-slate-500 font-medium">Starting at</span>
            <span className="text-xl font-black text-amber-700">Rs. 23,999</span>
          </div>
        </div>

        <div className="pt-4 mt-2 flex items-center justify-between border-t border-amber-200/60">
          <span className="text-[11px] text-amber-800 font-semibold flex items-center gap-1">
            <PackageCheck className="w-3.5 h-3.5 text-amber-600" />
            Open Parcel Included
          </span>
          <button
            onClick={() => {
              if (onFilterBudget) {
                onFilterBudget();
              } else if (onFilterCategory) {
                onFilterCategory('priceRange', [0, 35000]);
              }
            }}
            className="btn-press inline-flex items-center gap-1.5 px-5 py-2.5 rounded-full bg-slate-950 hover:bg-slate-800 text-white text-xs font-bold transition-all cursor-pointer shadow-md hover:shadow-lg"
          >
            <span>View Budget Phones</span>
            <ArrowRight className="w-3.5 h-3.5 text-amber-400 group-hover:translate-x-1 transition-transform" />
          </button>
        </div>
      </div>

      {/* Card 2: Nokia & Itel Keypad Legend */}
      <div className="group rounded-2xl p-6 bg-gradient-to-br from-[#136ab5] to-[#0a3f6d] border border-sky-700 shadow-sm hover:shadow-xl hover:border-[#48afff] hover:-translate-y-1.5 transition-all duration-300 relative overflow-hidden text-white flex flex-col justify-between">
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/20 border border-white/30 text-white text-[11px] font-black uppercase tracking-wider backdrop-blur-xs">
              <Smartphone className="w-3.5 h-3.5" />
              Keypad Classics
            </span>
            <span className="text-xs font-bold text-sky-200 bg-black/20 px-2.5 py-0.5 rounded-full border border-white/10">
              22 Verified Models
            </span>
          </div>

          <div>
            <h4 className="text-xl font-extrabold text-white font-sans group-hover:text-sky-200 transition-colors">
              Nokia 105, 110 &amp; Itel Keypad Phones
            </h4>
            <p className="text-xs text-sky-100 mt-1 leading-relaxed">
              Super long 1-week battery backup, loud wireless FM radio, big speaker, and PTA tax cleared for lifetime uninterrupted SIM calling.
            </p>
          </div>

          <div className="flex items-baseline gap-2 pt-1">
            <span className="text-xs text-sky-200 font-medium">Starting from</span>
            <span className="text-xl font-black text-white">Rs. 2,999</span>
          </div>
        </div>

        <div className="pt-4 mt-2 flex items-center justify-between border-t border-white/15">
          <span className="text-[11px] text-sky-200 flex items-center gap-1">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-300" />
            100% PTA Approved
          </span>
          <button
            onClick={() => {
              if (onFilterKeypad) {
                onFilterKeypad();
              } else if (onFilterCategory) {
                onFilterCategory('keypad', ['Nokia', 'Itel']);
              }
            }}
            className="btn-shimmer btn-press inline-flex items-center gap-1.5 px-5 py-2.5 rounded-full bg-white hover:bg-slate-100 text-[#136ab5] text-xs font-black transition-all cursor-pointer shadow-md"
          >
            <span>View All Keypad Phones</span>
            <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
          </button>
        </div>
      </div>
    </div>
  );
}

/**
 * Banner 3: 0% Markup Bank EMI Installments
 */
export function CatalogBannerBankEMI({ onOpenEMIModal }: BannerProps) {
  return (
    <div className="group col-span-full my-6 rounded-2xl p-6 sm:p-8 bg-gradient-to-r from-[#0b2b4a] via-[#104d7d] to-[#136ab5] text-white border border-sky-800 shadow-xl hover:shadow-2xl hover:border-[#48afff] hover:-translate-y-1.5 transition-all duration-500 relative overflow-hidden">
      <div className="relative z-10 grid grid-cols-1 md:grid-cols-12 gap-6 items-center">
        <div className="md:col-span-8 space-y-3">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#48afff]/25 border border-[#48afff]/40 text-sky-200 text-[11px] font-extrabold uppercase tracking-wider">
            <CreditCard className="w-3.5 h-3.5" /> 0% Markup Financing
          </div>

          <h3 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight font-sans">
            Buy Any Flagship Smartphone on Easy Monthly Installments
          </h3>

          <p className="text-xs sm:text-sm text-slate-200 max-w-xl leading-relaxed">
            Zero markup (interest-free) plans up to 12 months with Meezan Bank, Bank Alfalah, HBL, Standard Chartered, and Silk Bank credit cards.
          </p>

          <div className="flex flex-wrap items-center gap-3 pt-2">
            <div className="flex items-center gap-2 text-xs font-bold text-sky-100 bg-white/10 px-3.5 py-1.5 rounded-full border border-white/20">
              <CheckCircle2 className="w-4 h-4 text-emerald-300" />
              <span>No Hidden Charges</span>
            </div>
            <div className="flex items-center gap-2 text-xs font-bold text-sky-100 bg-white/10 px-3.5 py-1.5 rounded-full border border-white/20">
              <CheckCircle2 className="w-4 h-4 text-emerald-300" />
              <span>Instant Bank Approval</span>
            </div>
          </div>
        </div>

        <div className="md:col-span-4 flex flex-col items-start md:items-end justify-center space-y-3">
          {onOpenEMIModal && (
            <button
              onClick={onOpenEMIModal}
              className="btn-shimmer btn-press w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-3 rounded-full bg-[#48afff] hover:bg-[#229eff] text-white text-xs sm:text-sm font-black transition-all shadow-lg shadow-[#48afff]/30 hover:shadow-[#48afff]/50 cursor-pointer"
            >
              <span>Calculate Your Monthly EMI</span>
              <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </button>
          )}
          <span className="text-[11px] text-sky-200">
            Also accepts EasyPaisa &amp; JazzCash installments
          </span>
        </div>
      </div>
    </div>
  );
}

/**
 * Banner 4: Open-Parcel Inspection Guarantee
 */
export function CatalogBannerOpenParcel() {
  return (
    <div className="group col-span-full my-6 rounded-3xl p-6 sm:p-7 bg-white border border-slate-200/90 shadow-sm hover:shadow-xl hover:border-emerald-400 hover:-translate-y-1.5 transition-all duration-300 relative overflow-hidden">
      <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-center">
        <div className="md:col-span-8 flex items-start gap-4">
          <div className="w-12 h-12 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-700 flex items-center justify-center flex-shrink-0 group-hover:scale-115 group-hover:rotate-6 group-hover:bg-emerald-500 group-hover:text-white transition-all duration-300">
            <PackageCheck className="w-6 h-6 stroke-[2.2]" />
          </div>
          <div className="space-y-1">
            <span className="text-[11px] font-extrabold uppercase tracking-wider text-emerald-700">
              100% Risk-Free Buying
            </span>
            <h4 className="text-lg sm:text-xl font-extrabold text-slate-950 font-sans group-hover:text-emerald-800 transition-colors">
              Open-Parcel Cash on Delivery Guarantee
            </h4>
            <p className="text-xs sm:text-sm text-slate-500 leading-relaxed max-w-xl">
              When the rider arrives at your doorstep in Karachi, Lahore, Islamabad, or any city in Pakistan, open the flyer, inspect the authentic phone box, and check the seal before handing over cash.
            </p>
          </div>
        </div>

        <div className="md:col-span-4 flex flex-col md:items-end justify-center gap-2">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-bold shadow-xs">
            <ShieldCheck className="w-4 h-4 text-emerald-600 animate-pulse" />
            <span>Zero Advance Deposit Required</span>
          </div>
          <span className="text-[11px] text-slate-400 font-medium">
            Available on all 222 listed mobile phones
          </span>
        </div>
      </div>
    </div>
  );
}
