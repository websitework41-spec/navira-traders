'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import {
  ShieldCheck,
  PackageCheck,
  Truck,
  RotateCcw,
  CreditCard,
  Mail,
  Phone,
  CheckCircle2,
  Lock,
  ArrowRight,
  Clock,
  Sparkles,
  Zap,
  Smartphone,
  MessageSquare,
} from 'lucide-react';
import {
  sanitizeText,
  validateEmailOrPhone,
  isBotSubmission,
  submissionRateLimiter,
  MAX_INPUT_LENGTHS,
} from '@/lib/security';

export function Footer() {
  const [emailOrPhone, setEmailOrPhone] = useState('');
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [honeypot, setHoneypot] = useState('');

  const handleSubscribe = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');

    // Honeypot check
    if (isBotSubmission(honeypot)) return;

    // Rate limiting
    if (!submissionRateLimiter.isAllowed('footer_newsletter', 2000)) return;

    const cleanInput = sanitizeText(emailOrPhone, MAX_INPUT_LENGTHS.EMAIL);
    if (!cleanInput || !validateEmailOrPhone(cleanInput)) {
      setErrorMsg('Please enter a valid WhatsApp number (e.g. 03001234567) or email.');
      return;
    }

    setIsSubscribed(true);
    setTimeout(() => {
      setEmailOrPhone('');
      setErrorMsg('');
    }, 4000);
  };

  return (
    <footer className="w-full bg-slate-950 text-slate-300 border-t border-slate-800">
      {/* 1. Value Proposition Pillars (Pakistani E-Commerce Trust Assurances) */}
      <div className="border-b border-slate-850 bg-slate-900/60">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {/* Pillar 1: Open Parcel */}
            <div className="flex items-start gap-4 p-4 rounded-2xl bg-slate-900/80 border border-slate-800 hover:border-[#48afff]/50 card-hover-fx group cursor-default">
              <div className="w-12 h-12 rounded-2xl bg-[#48afff]/10 border border-[#48afff]/30 text-[#48afff] flex items-center justify-center flex-shrink-0 group-hover:scale-110 group-hover:rotate-3 transition-transform duration-300">
                <PackageCheck className="w-6 h-6 stroke-[2]" />
              </div>
              <div>
                <h4 className="text-sm font-bold text-white flex items-center gap-1.5 font-sans group-hover:text-[#48afff] transition-colors">
                  <span>Open Parcel Delivery</span>
                  <span className="text-[10px] font-extrabold uppercase px-1.5 py-0.2 bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 rounded">
                    Safe
                  </span>
                </h4>
                <p className="text-xs text-slate-400 mt-1 leading-relaxed">
                  Open flyer &amp; inspect the sealed phone box before paying cash to the courier rider.
                </p>
              </div>
            </div>

            {/* Pillar 2: 100% PTA Approved */}
            <div className="flex items-start gap-4 p-4 rounded-2xl bg-slate-900/80 border border-slate-800 hover:border-emerald-500/50 card-hover-fx group cursor-default">
              <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 flex items-center justify-center flex-shrink-0 group-hover:scale-110 group-hover:rotate-3 transition-transform duration-300">
                <ShieldCheck className="w-6 h-6 stroke-[2]" />
              </div>
              <div>
                <h4 className="text-sm font-bold text-white flex items-center gap-1.5 font-sans group-hover:text-emerald-400 transition-colors">
                  <span>100% PTA Approved</span>
                  <span className="text-[10px] font-extrabold uppercase px-1.5 py-0.2 bg-[#48afff]/20 text-[#48afff] border border-[#48afff]/40 rounded">
                    DIRBS
                  </span>
                </h4>
                <p className="text-xs text-slate-400 mt-1 leading-relaxed">
                  All 222 listed smartphones and keypad phones are customs tax cleared with lifetime SIM validity.
                </p>
              </div>
            </div>

            {/* Pillar 3: Official Brand Warranty */}
            <div className="flex items-start gap-4 p-4 rounded-2xl bg-slate-900/80 border border-slate-800 hover:border-indigo-500/50 card-hover-fx group cursor-default">
              <div className="w-12 h-12 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 flex items-center justify-center flex-shrink-0 group-hover:scale-110 group-hover:rotate-3 transition-transform duration-300">
                <RotateCcw className="w-6 h-6 stroke-[2]" />
              </div>
              <div>
                <h4 className="text-sm font-bold text-white font-sans group-hover:text-indigo-400 transition-colors">1-Year Brand Warranty</h4>
                <p className="text-xs text-slate-400 mt-1 leading-relaxed">
                  Direct official claims at Samsung, Mercantile, Carlcare &amp; Airlink service centers nationwide.
                </p>
              </div>
            </div>

            {/* Pillar 4: Express Shipping */}
            <div className="flex items-start gap-4 p-4 rounded-2xl bg-slate-900/80 border border-slate-800 hover:border-amber-500/50 card-hover-fx group cursor-default">
              <div className="w-12 h-12 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-amber-400 flex items-center justify-center flex-shrink-0 group-hover:scale-110 group-hover:rotate-3 transition-transform duration-300">
                <Truck className="w-6 h-6 stroke-[2]" />
              </div>
              <div>
                <h4 className="text-sm font-bold text-white flex items-center gap-1.5 font-sans group-hover:text-amber-400 transition-colors">
                  <span>Free Express Shipping</span>
                  <span className="text-[10px] font-extrabold uppercase px-1.5 py-0.2 bg-amber-500/20 text-amber-400 border border-amber-500/30 rounded">
                    24-48h
                  </span>
                </h4>
                <p className="text-xs text-slate-400 mt-1 leading-relaxed">
                  Free courier dispatch across 150+ Pakistani cities with live SMS and tracking updates.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 2. Newsletter & WhatsApp Price Alert Subscription */}
      <div className="border-b border-slate-850 bg-slate-900/40 py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="p-6 sm:p-8 rounded-3xl bg-gradient-to-r from-slate-900 via-slate-900 to-[#0b2848] border border-slate-800 flex flex-col md:flex-row items-center justify-between gap-6">
            <div className="space-y-1.5 text-center md:text-left">
              <div className="inline-flex items-center gap-1.5 text-xs font-bold text-[#48afff] uppercase tracking-wider">
                <Sparkles className="w-3.5 h-3.5" />
                <span>Price Drop &amp; Restock Alerts</span>
              </div>
              <h3 className="text-xl sm:text-2xl font-black text-white font-sans">
                Never Miss a Smartphone Price Drop
              </h3>
              <p className="text-xs text-slate-400 max-w-lg leading-relaxed">
                Get real-time WhatsApp or email alerts when high-demand models (S24 Ultra, iPhone 16, Redmi 14C) drop in price or come back in stock.
              </p>
            </div>

            <div className="w-full md:w-auto flex-shrink-0">
              {isSubscribed ? (
                <div className="flex items-center gap-2 p-3.5 rounded-2xl bg-emerald-950/80 border border-emerald-800/60 text-emerald-300 text-xs font-bold">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                  <span>Subscribed! You will receive daily price drop &amp; stock alerts.</span>
                </div>
              ) : (
                <div className="space-y-2 w-full max-w-md">
                  <form onSubmit={handleSubscribe} className="flex flex-col sm:flex-row items-center gap-2 w-full">
                    {/* Security honeypot trap */}
                    <input
                      type="text"
                      name="_hp_newsletter"
                      value={honeypot}
                      onChange={(e) => setHoneypot(e.target.value)}
                      tabIndex={-1}
                      autoComplete="off"
                      className="sr-only opacity-0 absolute -z-10 pointer-events-none h-0 w-0"
                      aria-hidden="true"
                    />

                    <input
                      type="text"
                      required
                      value={emailOrPhone}
                      onChange={(e) => setEmailOrPhone(e.target.value)}
                      placeholder="Enter WhatsApp # or Email"
                      className="w-full sm:w-72 px-4 py-3 rounded-full bg-slate-950 border border-slate-700 text-white placeholder:text-slate-500 text-base sm:text-xs focus:outline-none focus:ring-2 focus:ring-[#48afff] font-medium"
                    />
                    <button
                      type="submit"
                      className="w-full sm:w-auto px-6 py-3 rounded-full bg-[#48afff] hover:bg-[#229eff] text-slate-950 text-xs font-black shadow-md flex items-center justify-center gap-1.5 flex-shrink-0 cursor-pointer btn-press btn-shimmer"
                    >
                      <span>Get Alerts</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </button>
                  </form>
                  {errorMsg && (
                    <div className="text-[11px] text-rose-400 font-semibold px-2 animate-in fade-in">
                      ⚠️ {errorMsg}
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* 3. Main Footer Directory Links */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-8 text-xs">
          {/* Column 1: Brand & About */}
          <div className="col-span-2 md:col-span-4 lg:col-span-1 space-y-4">
            <Link href="/" className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-xl bg-slate-900 border border-slate-800 flex items-center justify-center text-[#48afff] shadow-md">
                <Zap className="w-5 h-5 fill-cyan-400 stroke-cyan-400" />
              </div>
              <span className="text-xl font-black tracking-tight text-white font-sans">
                NAWIRA <span className="text-[#48afff]">TRADERS</span>
                <span className="text-[10px] font-bold px-1.5 py-0.5 ml-1 rounded bg-slate-800 text-sky-300">
                  PK
                </span>
              </span>
            </Link>
            <p className="text-slate-400 text-xs leading-relaxed">
              Pakistan&apos;s premier smartphone and mobile phone marketplace. 222 verified models featuring 100% PTA DIRBS compliance, smartphones and classic keypad button phones, transparent price tracking, and risk-free Open-Parcel Cash on Delivery.
            </p>
            <div className="pt-2 space-y-2 text-slate-400">
              <div className="flex items-center gap-2">
                <Lock className="w-3.5 h-3.5 text-emerald-400" />
                <span className="text-[11px] font-semibold text-slate-300">256-Bit SSL Encrypted Checkout</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-3.5 h-3.5 text-[#48afff]" />
                <span className="text-[11px] font-semibold text-slate-300">DIRBS Customs Tax Cleared</span>
              </div>
            </div>
          </div>

          {/* Column 2: Popular Mobile Brands */}
          <div className="space-y-3">
            <h5 className="font-extrabold text-white uppercase tracking-wider text-[11px] font-sans">
              Top Mobile Brands
            </h5>
            <ul className="space-y-2 text-slate-400">
              <li>
                <Link href="/?brand=Samsung#catalog" className="hover:text-[#48afff] transition-colors">
                  Samsung Galaxy (25)
                </Link>
              </li>
              <li>
                <Link href="/?brand=Apple#catalog" className="hover:text-[#48afff] transition-colors">
                  Apple iPhone Series (7)
                </Link>
              </li>
              <li>
                <Link href="/?brand=Xiaomi#catalog" className="hover:text-[#48afff] transition-colors">
                  Xiaomi, Redmi &amp; Poco (18)
                </Link>
              </li>
              <li>
                <Link href="/?brand=Infinix#catalog" className="hover:text-[#48afff] transition-colors">
                  Infinix Note &amp; Hot (9)
                </Link>
              </li>
              <li>
                <Link href="/?brand=Tecno#catalog" className="hover:text-[#48afff] transition-colors">
                  Tecno Camon &amp; Spark (11)
                </Link>
              </li>
              <li>
                <Link href="/?brand=Vivo#catalog" className="hover:text-[#48afff] transition-colors">
                  Vivo V &amp; Y Series (11)
                </Link>
              </li>
              <li>
                <Link href="/?brand=Nokia#catalog" className="hover:text-[#48afff] transition-colors">
                  Nokia Keypad Mobiles (16)
                </Link>
              </li>
              <li>
                <Link href="/?brand=Itel#catalog" className="hover:text-[#48afff] transition-colors">
                  Itel Button Phones (6)
                </Link>
              </li>
            </ul>
          </div>

          {/* Column 3: Shop by Budget */}
          <div className="space-y-3">
            <h5 className="font-extrabold text-white uppercase tracking-wider text-[11px] font-sans">
              Shop By Budget
            </h5>
            <ul className="space-y-2 text-slate-400">
              <li>
                <Link href="/?maxPrice=25000#catalog" className="hover:text-[#48afff] transition-colors">
                  Phones Under Rs. 25,000
                </Link>
              </li>
              <li>
                <Link href="/?maxPrice=40000#catalog" className="hover:text-[#48afff] transition-colors">
                  Phones Under Rs. 40,000
                </Link>
              </li>
              <li>
                <Link href="/?maxPrice=60000#catalog" className="hover:text-[#48afff] transition-colors">
                  Phones Under Rs. 60,000
                </Link>
              </li>
              <li>
                <Link href="/?maxPrice=100000#catalog" className="hover:text-[#48afff] transition-colors">
                  Phones Under Rs. 100,000
                </Link>
              </li>
              <li>
                <Link href="/?minPrice=150000#catalog" className="hover:text-[#48afff] transition-colors">
                  Flagship Mobiles (150K+)
                </Link>
              </li>
              <li>
                <Link href="/?search=5G#catalog" className="hover:text-[#48afff] transition-colors">
                  Best 5G Gaming Phones
                </Link>
              </li>
              <li>
                <Link href="/?spec=120hz-amoled#catalog" className="hover:text-[#48afff] transition-colors">
                  120Hz AMOLED Displays
                </Link>
              </li>
            </ul>
          </div>

          {/* Column 4: Customer Protection */}
          <div className="space-y-3">
            <h5 className="font-extrabold text-white uppercase tracking-wider text-[11px] font-sans">
              Customer Assurances
            </h5>
            <ul className="space-y-2 text-slate-400">
              <li>
                <Link href="/policies#open-parcel" className="hover:text-[#48afff] transition-colors">
                  Open-Parcel Delivery Policy
                </Link>
              </li>
              <li>
                <Link href="/policies#pta-guide" className="hover:text-[#48afff] transition-colors">
                  PTA DIRBS Verification Guide
                </Link>
              </li>
              <li>
                <Link href="/policies#installments" className="hover:text-[#48afff] transition-colors">
                  0% Markup EMI Installments
                </Link>
              </li>
              <li>
                <Link href="/policies#warranty" className="hover:text-[#48afff] transition-colors">
                  1-Year Official Brand Warranty
                </Link>
              </li>
              <li>
                <Link href="/policies#cod-terms" className="hover:text-[#48afff] transition-colors">
                  Cash on Delivery Terms
                </Link>
              </li>
              <li>
                <Link href="/policies#replacement-guarantee" className="hover:text-[#48afff] transition-colors">
                  7-Day Replacement Guarantee
                </Link>
              </li>
              <li>
                <Link href="/policies#privacy-security" className="hover:text-[#48afff] transition-colors">
                  Privacy Policy &amp; Security
                </Link>
              </li>
              <li className="pt-2">
                <Link href="/admin" className="text-[#48afff] font-bold hover:underline flex items-center gap-1.5 text-xs">
                  <ShieldCheck className="w-3.5 h-3.5" />
                  Store Admin &amp; Inventory Hub
                </Link>
              </li>
            </ul>
          </div>

          {/* Column 5: Support & Contact */}
          <div className="space-y-3">
            <h5 className="font-extrabold text-white uppercase tracking-wider text-[11px] font-sans">
              Helpline &amp; Hubs
            </h5>
              <div className="space-y-2 text-slate-300">
                <a
                  href="tel:+923018543131"
                  className="flex items-center gap-2 text-white font-bold hover:text-[#48afff] transition-colors"
                >
                  <Phone className="w-3.5 h-3.5 text-[#48afff] flex-shrink-0" />
                  <span>+92 301 8543131</span>
                </a>
                <a
                  href="https://wa.me/923018543131?text=Hi%20Nawira%20Traders!%20I%20have%20an%20inquiry."
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 text-emerald-400 font-bold hover:text-emerald-300 transition-colors"
                >
                  <MessageSquare className="w-3.5 h-3.5 text-emerald-400 flex-shrink-0" />
                  <span>WhatsApp: +92 301 8543131</span>
                </a>
                <div className="flex items-center gap-2 text-slate-400">
                  <Mail className="w-3.5 h-3.5 text-[#48afff] flex-shrink-0" />
                  <span>support@nawiratraders.com</span>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Clock className="w-3.5 h-3.5 text-slate-500 flex-shrink-0" />
                <span>Mon - Sat: 9:00 AM - 10:00 PM</span>
              </div>
              <div className="pt-2 text-[11px] leading-relaxed">
                <div className="font-semibold text-slate-300">Fulfillment Hubs:</div>
                <div>• Gulberg III, Lahore</div>
                <div>• Shahrah-e-Faisal, Karachi</div>
                <div>• Blue Area, Islamabad</div>
              </div>
            </div>
          </div>

        {/* Payment Partners & Courier Partners Bar */}
        <div className="mt-12 pt-6 border-t border-slate-800 flex flex-col md:flex-row items-center justify-between gap-4 text-[11px] text-slate-400">
          <div className="flex flex-wrap items-center gap-2">
            <span className="font-bold text-slate-300 mr-1">Payment Methods:</span>
            <span className="px-2.5 py-1 rounded-full bg-slate-900 border border-slate-800 text-slate-300 hover:border-[#48afff]/50 hover:text-white hover:scale-105 transition-all duration-200 cursor-default">Cash on Delivery (COD)</span>
            <span className="px-2.5 py-1 rounded-full bg-slate-900 border border-slate-800 text-slate-300 hover:border-[#48afff]/50 hover:text-white hover:scale-105 transition-all duration-200 cursor-default">Meezan Bank</span>
            <span className="px-2.5 py-1 rounded-full bg-slate-900 border border-slate-800 text-slate-300 hover:border-[#48afff]/50 hover:text-white hover:scale-105 transition-all duration-200 cursor-default">Bank Alfalah</span>
            <span className="px-2.5 py-1 rounded-full bg-slate-900 border border-slate-800 text-slate-300 hover:border-[#48afff]/50 hover:text-white hover:scale-105 transition-all duration-200 cursor-default">EasyPaisa / JazzCash</span>
            <span className="px-2.5 py-1 rounded-full bg-slate-900 border border-slate-800 text-slate-300 hover:border-[#48afff]/50 hover:text-white hover:scale-105 transition-all duration-200 cursor-default">Raast / 1Link</span>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <span className="font-bold text-slate-300 mr-1">Delivery Partners:</span>
            <span className="px-2.5 py-1 rounded-full bg-slate-900 border border-slate-800 text-slate-300 hover:border-emerald-500/50 hover:text-white hover:scale-105 transition-all duration-200 cursor-default">TCS Express</span>
            <span className="px-2.5 py-1 rounded-full bg-slate-900 border border-slate-800 text-slate-300 hover:border-emerald-500/50 hover:text-white hover:scale-105 transition-all duration-200 cursor-default">Leopards</span>
            <span className="px-2.5 py-1 rounded-full bg-slate-900 border border-slate-800 text-slate-300 hover:border-emerald-500/50 hover:text-white hover:scale-105 transition-all duration-200 cursor-default">Trax</span>
            <span className="px-2.5 py-1 rounded-full bg-slate-900 border border-slate-800 text-slate-300 hover:border-emerald-500/50 hover:text-white hover:scale-105 transition-all duration-200 cursor-default">PostEx</span>
          </div>
        </div>

        {/* Bottom Legal & Copyright Bar */}
        <div className="mt-6 pt-6 border-t border-slate-850 flex flex-col sm:flex-row items-center justify-between gap-3 text-[11px] text-slate-500 text-center sm:text-left">
          <div>
            {`© ${new Date().getFullYear()} Nawira Traders. All rights reserved. Registered NTN & SECP Compliant Pakistani Marketplace.`}
          </div>
          <div className="flex items-center gap-3">
            <span>Prices synchronized live with official distributor stock</span>
            <span>•</span>
            <span className="text-emerald-400 font-bold">100% PTA DIRBS Approved</span>
          </div>
        </div>
      </div>
    </footer>
  );
}
