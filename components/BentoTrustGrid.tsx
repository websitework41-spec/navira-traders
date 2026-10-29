'use client';

import React from 'react';
import Link from 'next/link';
import {
  PackageCheck,
  ShieldCheck,
  CreditCard,
  Wrench,
  Truck,
  ArrowRight,
  CheckCircle2,
  Sparkles,
  PhoneCall,
  Clock,
  ShieldAlert,
  BadgeCheck
} from 'lucide-react';

interface BentoTrustGridProps {
  onOpenPolicyModal: (policyId: string) => void;
}

export function BentoTrustGrid({ onOpenPolicyModal }: BentoTrustGridProps) {
  return (
    <section className="w-full my-12" id="customer-assurances">
      {/* Section Header */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between mb-6 px-1 gap-2">
        <div>
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-sky-100 text-[#0b3c68] text-[11px] font-black tracking-wide uppercase mb-2">
            <Sparkles className="w-3.5 h-3.5 text-[#48afff]" />
            <span>Nawira Traders Buyer Protection Program</span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-black text-slate-950 font-sans tracking-tight">
            Why Thousands of Pakistanis Trust Us
          </h2>
          <p className="text-xs sm:text-sm text-slate-500 mt-1 max-w-2xl">
            Online smartphone shopping without fear. We eliminated fraud, customs headaches, and warranty hassles with total transparency.
          </p>
        </div>

        <Link
          href="/policies"
          className="inline-flex items-center gap-1.5 text-xs font-bold text-[#136ab5] hover:text-[#48afff] transition-colors group self-start sm:self-auto cursor-pointer"
        >
          <span>View All Official Policies</span>
          <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
        </Link>
      </div>

      {/* Bento Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-5">
        {/* BENTO CARD 1: Large Featured Hero Card (2 columns on lg/xl) */}
        <div
          onClick={() => onOpenPolicyModal('open-parcel')}
          className="lg:col-span-2 relative overflow-hidden rounded-3xl bg-gradient-to-br from-[#071d33] via-[#0b3c68] to-[#125898] text-white p-6 sm:p-8 flex flex-col justify-between shadow-xl shadow-sky-950/15 border border-sky-400/20 group cursor-pointer hover:shadow-2xl hover:scale-[1.01] transition-all duration-300"
        >
          {/* Subtle Ambient Background Glow */}
          <div className="pointer-events-none absolute -right-12 -bottom-12 w-64 h-64 bg-sky-400/20 rounded-full blur-3xl group-hover:bg-sky-400/30 transition-all duration-500" />

          {/* Top Badge & Header */}
          <div className="relative z-10">
            <div className="flex items-center justify-between gap-2 mb-4">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-400/30 text-[11px] font-black uppercase tracking-wider backdrop-blur-md">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                Zero Risk • Scam-Free Guarantee
              </span>
              <div className="w-9 h-9 rounded-xl bg-white/10 backdrop-blur-md flex items-center justify-center text-white group-hover:bg-white group-hover:text-[#0b3c68] transition-all">
                <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
              </div>
            </div>

            <div className="flex items-start gap-3.5 mb-3">
              <div className="w-12 h-12 rounded-2xl bg-white/10 backdrop-blur-md border border-white/20 flex items-center justify-center shrink-0 text-sky-300">
                <PackageCheck className="w-6 h-6 stroke-[2.2]" />
              </div>
              <div>
                <h3 className="text-xl sm:text-2xl font-black tracking-tight font-sans">
                  100% Open-Parcel Doorstep Inspection
                </h3>
                <p className="text-xs sm:text-sm text-sky-100/90 mt-1 leading-relaxed">
                  Never pay blindly. When our courier rider arrives, open the flyer and inspect the smartphone box and factory seals before handing over cash.
                </p>
              </div>
            </div>
          </div>

          {/* 3 Step Interactive Process Flow */}
          <div className="relative z-10 grid grid-cols-1 sm:grid-cols-3 gap-2.5 mt-6 pt-5 border-t border-white/15">
            <div className="bg-white/10 backdrop-blur-md rounded-2xl p-3 border border-white/10">
              <span className="text-[10px] font-black text-sky-300 block mb-1">STEP 01</span>
              <p className="text-xs font-bold leading-tight">Rider arrives with sealed parcel</p>
            </div>
            <div className="bg-white/10 backdrop-blur-md rounded-2xl p-3 border border-white/10">
              <span className="text-[10px] font-black text-sky-300 block mb-1">STEP 02</span>
              <p className="text-xs font-bold leading-tight">Open box &amp; verify model seals</p>
            </div>
            <div className="bg-white/10 backdrop-blur-md rounded-2xl p-3 border border-white/10 bg-emerald-500/20 border-emerald-400/30">
              <span className="text-[10px] font-black text-emerald-300 block mb-1">STEP 03</span>
              <p className="text-xs font-bold leading-tight">Pay only when 100% satisfied</p>
            </div>
          </div>
        </div>

        {/* BENTO CARD 2: PTA DIRBS Verification */}
        <div
          onClick={() => onOpenPolicyModal('pta-guide')}
          className="relative overflow-hidden rounded-3xl bg-white p-6 sm:p-7 flex flex-col justify-between shadow-sm border border-slate-200/90 hover:border-emerald-500 hover:shadow-xl transition-all duration-300 group cursor-pointer"
        >
          <div>
            <div className="flex items-center justify-between mb-4">
              <div className="w-11 h-11 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-700 flex items-center justify-center group-hover:scale-110 transition-transform">
                <ShieldCheck className="w-6 h-6 stroke-[2.2]" />
              </div>
              <span className="text-[10px] font-black px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 uppercase tracking-wider">
                PTA Approved
              </span>
            </div>

            <h3 className="text-base sm:text-lg font-black text-slate-900 group-hover:text-emerald-700 transition-colors">
              PTA DIRBS Compliant Stock
            </h3>
            <p className="text-xs text-slate-500 mt-1.5 leading-relaxed">
              Every handset has full customs duties cleared. Guaranteed lifetime SIM operation on Jazz, Zong, Telenor, and Ufone with zero blocking fears.
            </p>
          </div>

          {/* Quick verification helper pill */}
          <div className="mt-5 pt-4 border-t border-slate-100">
            <div className="flex items-center justify-between bg-slate-50 rounded-xl p-2.5 border border-slate-200/70 font-mono text-[11px] text-slate-700">
              <span>Dial *#06# → SMS to 8484</span>
              <BadgeCheck className="w-4 h-4 text-emerald-600" />
            </div>
          </div>
        </div>

        {/* BENTO CARD 3: 0% Markup EMI Installments */}
        <div
          onClick={() => onOpenPolicyModal('installments')}
          className="relative overflow-hidden rounded-3xl bg-white p-6 sm:p-7 flex flex-col justify-between shadow-sm border border-slate-200/90 hover:border-blue-500 hover:shadow-xl transition-all duration-300 group cursor-pointer"
        >
          <div>
            <div className="flex items-center justify-between mb-4">
              <div className="w-11 h-11 rounded-2xl bg-blue-50 border border-blue-200 text-blue-700 flex items-center justify-center group-hover:scale-110 transition-transform">
                <CreditCard className="w-6 h-6 stroke-[2.2]" />
              </div>
              <span className="text-[10px] font-black px-2.5 py-0.5 rounded-full bg-blue-100 text-blue-800 uppercase tracking-wider">
                0% Markup
              </span>
            </div>

            <h3 className="text-base sm:text-lg font-black text-slate-900 group-hover:text-blue-700 transition-colors">
              0% EMI Monthly Installments
            </h3>
            <p className="text-xs text-slate-500 mt-1.5 leading-relaxed">
              Own your dream smartphone in convenient 3, 6, or 12-month installments on credit cards with zero hidden markup fees.
            </p>
          </div>

          {/* Supported Bank Pills */}
          <div className="mt-5 pt-4 border-t border-slate-100">
            <div className="flex flex-wrap gap-1.5">
              <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-slate-100 text-slate-700">Meezan Bank</span>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-slate-100 text-slate-700">Bank Alfalah</span>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-slate-100 text-slate-700">Faysal Bank</span>
            </div>
          </div>
        </div>

        {/* BENTO CARD 4: 1-Year Official Brand Warranty */}
        <div
          onClick={() => onOpenPolicyModal('warranty')}
          className="relative overflow-hidden rounded-3xl bg-white p-6 sm:p-7 flex flex-col justify-between shadow-sm border border-slate-200/90 hover:border-purple-500 hover:shadow-xl transition-all duration-300 group cursor-pointer"
        >
          <div>
            <div className="flex items-center justify-between mb-4">
              <div className="w-11 h-11 rounded-2xl bg-purple-50 border border-purple-200 text-purple-700 flex items-center justify-center group-hover:scale-110 transition-transform">
                <Wrench className="w-6 h-6 stroke-[2.2]" />
              </div>
              <span className="text-[10px] font-black px-2.5 py-0.5 rounded-full bg-purple-100 text-purple-800 uppercase tracking-wider">
                1-Year Care
              </span>
            </div>

            <h3 className="text-base sm:text-lg font-black text-slate-900 group-hover:text-purple-700 transition-colors">
              Official Nationwide Brand Care
            </h3>
            <p className="text-xs text-slate-500 mt-1.5 leading-relaxed">
              Claim 100% genuine parts and free labor at authorized care centers nationwide: Carlcare, Airlink, Mercantile &amp; Samsung Care.
            </p>
          </div>

          <div className="mt-5 pt-4 border-t border-slate-100 flex items-center justify-between text-xs font-bold text-purple-700">
            <span>Invoice = Official Warranty Card</span>
            <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
          </div>
        </div>

        {/* BENTO CARD 5: 24-48 Hours Express Dispatch */}
        <div
          className="lg:col-span-2 xl:col-span-3 relative overflow-hidden rounded-3xl bg-slate-900 text-white p-6 sm:p-7 flex flex-col sm:flex-row items-center justify-between gap-5 shadow-lg border border-slate-800"
        >
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-sky-500/20 border border-sky-400/30 flex items-center justify-center text-sky-400 shrink-0">
              <Truck className="w-6 h-6 stroke-[2.2]" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h4 className="text-base sm:text-lg font-black tracking-tight">
                  24–48 Hours Express Nationwide Delivery
                </h4>
                <span className="text-[10px] font-extrabold px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                  Fast Dispatch
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                Orders placed before 3:00 PM are dispatched same-day with live tracking SMS via TCS Express, Leopards, and PostEx.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3 shrink-0 w-full sm:w-auto justify-end">
            <a
              href="https://wa.me/923135221200?text=Hi%20Nawira%20Traders!%20I%20have%20an%20inquiry%20regarding%20shipping%20and%20orders."
              target="_blank"
              rel="noopener noreferrer"
              className="w-full sm:w-auto px-5 py-2.5 rounded-full bg-emerald-500 hover:bg-emerald-600 text-white text-xs font-black shadow-md flex items-center justify-center gap-1.5 transition-all hover:scale-105"
            >
              <PhoneCall className="w-3.5 h-3.5" />
              <span>Contact Order Helpline</span>
            </a>
          </div>
        </div>
      </div>
    </section>
  );
}
