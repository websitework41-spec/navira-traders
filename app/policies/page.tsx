'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { Navbar } from '@/components/Navbar';
import { Footer } from '@/components/Footer';
import { CartDrawer } from '@/components/CartDrawer';
import { CartItem } from '@/types';
import {
  PackageCheck,
  ShieldCheck,
  RotateCcw,
  CreditCard,
  Truck,
  Lock,
  CheckCircle2,
  Phone,
  MessageSquare,
  ArrowRight,
  ChevronRight,
  FileText,
  BadgeCheck,
  Building,
  HelpCircle,
} from 'lucide-react';

export default function PoliciesPage() {
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [isCartOpen, setIsCartOpen] = useState(false);

  // Cart localStorage persistence
  useEffect(() => {
    if (typeof window !== 'undefined') {
      try {
        const saved = localStorage.getItem('voltphone_cart');
        if (saved) {
          setCartItems(JSON.parse(saved));
        }
      } catch (e) {
        console.error('Failed to load cart from localStorage:', e);
      }
    }
  }, []);

  const handleUpdateCart = (newCart: CartItem[]) => {
    setCartItems(newCart);
    try {
      localStorage.setItem('voltphone_cart', JSON.stringify(newCart));
    } catch (e) {
      console.error('Failed to save cart to localStorage:', e);
    }
  };

  const policySections = [
    {
      id: 'open-parcel',
      title: 'Open-Parcel Delivery Policy',
      badge: 'Zero Risk Guarantee',
      badgeColor: 'bg-[#48afff]/10 text-[#136ab5] border-[#48afff]/20',
      icon: <PackageCheck className="w-6 h-6 text-[#136ab5]" />,
      summary: 'Inspect your sealed smartphone box before handing over payment to the courier rider.',
      content: (
        <div className="space-y-4 text-sm text-slate-700 leading-relaxed">
          <p className="font-semibold text-slate-900">
            Nawira Traders is proud to pioneer 100% Open-Parcel Cash on Delivery across 150+ Pakistani cities with our logistics partners (TCS Express, Leopards, Trax, and PostEx).
          </p>
          <div className="rounded-2xl bg-sky-50/60 p-4 border border-sky-200/80 space-y-2">
            <h4 className="font-bold text-cyan-950 flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-[#136ab5]" />
              <span>Step-by-Step Doorstep Verification:</span>
            </h4>
            <ol className="list-decimal pl-5 space-y-2 text-xs sm:text-sm text-slate-800">
              <li>
                <strong>Rider Arrival:</strong> The courier rider brings your parcel to your delivery address and hands you the outer flyer.
              </li>
              <li>
                <strong>Flyer Opening:</strong> Open the courier flyer in the rider&apos;s presence.
              </li>
              <li>
                <strong>Device Inspection:</strong> Verify the retail smartphone box, brand logo, model name, color variant, and ensure the official factory security seals are intact and untampered.
              </li>
              <li>
                <strong>Payment:</strong> Only after you are 100% satisfied that you received the exact genuine device you ordered, hand over cash or pay via digital QR.
              </li>
              <li>
                <strong>Instant Rejection:</strong> If the packaging is damaged or the model does not match your invoice, you have the right to reject the delivery immediately at zero cost to you.
              </li>
            </ol>
          </div>
          <p className="text-xs text-slate-500">
            * Note: To protect official brand warranties, inner retail box seals must remain intact during courier handover. Once accepted, technical defects are covered by our 7-Day Replacement Guarantee and 1-Year Official Brand Warranty.
          </p>
        </div>
      ),
    },
    {
      id: 'pta-guide',
      title: 'PTA DIRBS Verification Guide',
      badge: '100% Tax Cleared',
      badgeColor: 'bg-emerald-500/10 text-emerald-700 border-emerald-500/20',
      icon: <ShieldCheck className="w-6 h-6 text-emerald-600" />,
      summary: 'Every mobile phone on Nawira Traders is legally imported with full customs duty and lifetime PTA SIM approval.',
      content: (
        <div className="space-y-4 text-sm text-slate-700 leading-relaxed">
          <p>
            All 222 smartphones and keypad phones cataloged on Nawira Traders are registered in the Pakistan Telecommunication Authority (PTA) Device Identification, Registration and Blocking System (DIRBS).
          </p>
          <div className="rounded-2xl bg-slate-900 text-white p-5 space-y-3 font-mono text-xs sm:text-sm shadow-md">
            <div className="text-[#48afff] font-bold font-sans flex items-center gap-1.5">
              <BadgeCheck className="w-4 h-4" />
              <span>Official PTA Verification Methods:</span>
            </div>
            <div className="p-3 rounded-xl bg-slate-800/80 border border-slate-700 space-y-1">
              <div className="text-slate-400">Step 1: Check IMEI on device keypad</div>
              <div className="text-emerald-400 font-bold">Dial *#06#</div>
            </div>
            <div className="p-3 rounded-xl bg-slate-800/80 border border-slate-700 space-y-1">
              <div className="text-slate-400">Step 2: SMS your 15-digit IMEI</div>
              <div className="text-emerald-400 font-bold">Send to shortcode 8484</div>
            </div>
            <div className="p-3 rounded-xl bg-slate-800/80 border border-slate-700 space-y-1">
              <div className="text-slate-400">Step 3: Online PTA Portal</div>
              <div className="text-emerald-400 font-bold">Visit https://dirbs.pta.gov.pk</div>
            </div>
          </div>
          <div className="p-3.5 rounded-xl bg-emerald-50 border border-emerald-200 text-xs text-emerald-900 space-y-1">
            <span className="font-bold">Official Compliant Status:</span>
            <p>
              Your verification reply will state: <em>&quot;IMEI is Compliant (PTA Approved)&quot;</em>. You will enjoy lifetime unrestricted connectivity on Jazz, Zong, Telenor, Ufone, and SCO with zero risk of sudden SIM blockage.
            </p>
          </div>
        </div>
      ),
    },
    {
      id: 'installments',
      title: '0% Markup EMI Installments',
      badge: 'Shariah-Compliant',
      badgeColor: 'bg-purple-500/10 text-purple-700 border-purple-500/20',
      icon: <CreditCard className="w-6 h-6 text-purple-600" />,
      summary: 'Shop top flagship & mid-range smartphones with zero interest markup over 3, 6, or 12 monthly installments.',
      content: (
        <div className="space-y-4 text-sm text-slate-700 leading-relaxed">
          <p>
            Nawira Traders partners with leading Pakistani financial institutions to offer 0% Markup Easy Monthly Installments (EMI) on credit cards.
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs sm:text-sm">
            <div className="p-3.5 rounded-2xl bg-white border border-slate-200 space-y-1">
              <div className="font-bold text-slate-900 flex items-center gap-1.5">
                <Building className="w-4 h-4 text-purple-600" />
                <span>Meezan Bank Credit Cards</span>
              </div>
              <p className="text-slate-500 text-xs">3 &amp; 6 Months 0% Markup Plans. Fully Shariah-compliant Islamic financing.</p>
            </div>
            <div className="p-3.5 rounded-2xl bg-white border border-slate-200 space-y-1">
              <div className="font-bold text-slate-900 flex items-center gap-1.5">
                <Building className="w-4 h-4 text-purple-600" />
                <span>Bank Alfalah (Alfa Mall)</span>
              </div>
              <p className="text-slate-500 text-xs">3, 6, &amp; 12 Months 0% Markup on Alfalah Credit Cards with instant online conversion.</p>
            </div>
            <div className="p-3.5 rounded-2xl bg-white border border-slate-200 space-y-1">
              <div className="font-bold text-slate-900 flex items-center gap-1.5">
                <Building className="w-4 h-4 text-purple-600" />
                <span>Faysal Bank (Noor Cards)</span>
              </div>
              <p className="text-slate-500 text-xs">3 &amp; 6 Months 0% Markup Islamic financing options.</p>
            </div>
            <div className="p-3.5 rounded-2xl bg-white border border-slate-200 space-y-1">
              <div className="font-bold text-slate-900 flex items-center gap-1.5">
                <Building className="w-4 h-4 text-purple-600" />
                <span>Silkbank Credit Cards</span>
              </div>
              <p className="text-slate-500 text-xs">Up to 12 months installment tenure with promotional zero interest rate.</p>
            </div>
          </div>
          <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-600">
            <strong>How to order on Installments:</strong> During checkout, select <em>&quot;Credit Card 0% EMI&quot;</em> as your payment method, select your bank and tenure, and our support team will help you execute the transaction.
          </div>
        </div>
      ),
    },
    {
      id: 'warranty',
      title: '1-Year Official Brand Warranty',
      badge: 'Authorized Centers',
      badgeColor: 'bg-indigo-500/10 text-indigo-700 border-indigo-500/20',
      icon: <RotateCcw className="w-6 h-6 text-indigo-600" />,
      summary: 'Claim nationwide manufacturer support at official brand care centers with your Nawira Traders tax invoice.',
      content: (
        <div className="space-y-4 text-sm text-slate-700 leading-relaxed">
          <p>
            We sell only 100% brand new, factory sealed, official distributor stock. Every device includes an official 1-Year Brand Warranty claimable directly at authorized brand service centers across Pakistan:
          </p>
          <ul className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 text-xs sm:text-sm">
            <li className="p-3 rounded-xl bg-slate-50 border border-slate-200">
              <strong>Samsung:</strong> Official Samsung Care Centers nationwide.
            </li>
            <li className="p-3 rounded-xl bg-slate-50 border border-slate-200">
              <strong>Apple:</strong> Mercantile &amp; FutureTech Authorized Centers.
            </li>
            <li className="p-3 rounded-xl bg-slate-50 border border-slate-200">
              <strong>Xiaomi / Redmi / Poco:</strong> Airlink &amp; Smart Zone Hubs.
            </li>
            <li className="p-3 rounded-xl bg-slate-50 border border-slate-200">
              <strong>Infinix &amp; Tecno:</strong> Carlcare Service Network in 40+ cities.
            </li>
            <li className="p-3 rounded-xl bg-slate-50 border border-slate-200">
              <strong>Vivo &amp; Oppo:</strong> Official Brand Centers in all major cities.
            </li>
            <li className="p-3 rounded-xl bg-slate-50 border border-slate-200">
              <strong>Nokia &amp; Itel:</strong> Authorized nationwide centers with 1-year replacement warranty on keypad units.
            </li>
          </ul>
          <p className="text-xs text-slate-500">
            Your printed Nawira Traders invoice and digital order confirmation serve as your valid official proof of purchase for all warranty claims.
          </p>
        </div>
      ),
    },
    {
      id: 'cod-terms',
      title: 'Cash on Delivery (COD) Terms',
      badge: 'Free Express Shipping',
      badgeColor: 'bg-amber-500/10 text-amber-700 border-amber-500/20',
      icon: <Truck className="w-6 h-6 text-amber-600" />,
      summary: 'Transparent, fast, and free cash on delivery to your home or office address across Pakistan.',
      content: (
        <div className="space-y-4 text-sm text-slate-700 leading-relaxed">
          <p>
            Cash on Delivery is available for all smartphones and keypad devices to any residential or commercial address across Pakistan.
          </p>
          <div className="space-y-2 text-xs sm:text-sm">
            <div className="flex items-start gap-2">
              <CheckCircle2 className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
              <span><strong>Free Delivery:</strong> All phone orders above Rs. 2,000 enjoy 100% free delivery with zero hidden courier charges.</span>
            </div>
            <div className="flex items-start gap-2">
              <CheckCircle2 className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
              <span><strong>Dispatch Timelines:</strong> Orders placed before 4:00 PM PKT are dispatched the same day. Deliveries in Lahore, Karachi, and Islamabad/Rawalpindi arrive within 24-48 hours. Other cities arrive in 2-4 business days.</span>
            </div>
            <div className="flex items-start gap-2">
              <CheckCircle2 className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
              <span><strong>Cash Currency:</strong> Please keep exact Pakistani Rupee cash ready for the courier rider, or use online digital transfer if the rider provides an authorized QR code.</span>
            </div>
          </div>
        </div>
      ),
    },
    {
      id: 'replacement-guarantee',
      title: '7-Day Replacement Guarantee',
      badge: 'Hassle-Free Exchange',
      badgeColor: 'bg-rose-500/10 text-rose-700 border-rose-500/20',
      icon: <RotateCcw className="w-6 h-6 text-rose-600" />,
      summary: 'Prompt replacement for any out-of-the-box hardware failure or manufacturing defect.',
      content: (
        <div className="space-y-4 text-sm text-slate-700 leading-relaxed">
          <p>
            In the rare event that your new smartphone arrives with an out-of-the-box hardware defect or functional fault, Nawira Traders provides a 7-Day Replacement Guarantee.
          </p>
          <div className="p-4 rounded-2xl bg-rose-50 border border-rose-200 space-y-2 text-xs sm:text-sm text-rose-950">
            <h4 className="font-bold">Conditions for Replacement:</h4>
            <ul className="list-disc pl-5 space-y-1 text-xs">
              <li>Report the defect within 7 days of parcel receipt by contacting WhatsApp: <strong>+92 301 8543131</strong>.</li>
              <li>Handset must be free from physical drops, cracks, liquid spillage, or unauthorized rooting/jailbreaking.</li>
              <li>Original retail box, IMEI matching paperwork, charger, and bundled accessories must be returned in complete condition.</li>
              <li>Once verified by our inspection team, an immediate replacement unit will be dispatched at no extra cost.</li>
            </ul>
          </div>
        </div>
      ),
    },
    {
      id: 'privacy-security',
      title: 'Privacy Policy & Security',
      badge: '256-Bit SSL Encrypted',
      badgeColor: 'bg-blue-500/10 text-blue-700 border-blue-500/20',
      icon: <Lock className="w-6 h-6 text-blue-600" />,
      summary: 'We safeguard your personal data, contact details, and payment information with enterprise-grade encryption.',
      content: (
        <div className="space-y-4 text-sm text-slate-700 leading-relaxed">
          <p>
            At Nawira Traders, we take customer privacy and data security with utmost seriousness.
          </p>
          <div className="space-y-3 text-xs sm:text-sm">
            <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200">
              <strong className="text-slate-900 block mb-0.5">Information We Collect:</strong>
              <p className="text-slate-600 text-xs">
                Only the essential information required to fulfill your order: full name, shipping address, WhatsApp/mobile contact number, and email address for digital invoice generation.
              </p>
            </div>
            <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200">
              <strong className="text-slate-900 block mb-0.5">Data Confidentiality:</strong>
              <p className="text-slate-600 text-xs">
                We never sell, rent, or trade your personal information to third-party marketers or advertisers. Information is strictly shared with our authorized logistics partners solely to complete doorstep delivery.
              </p>
            </div>
            <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200">
              <strong className="text-slate-900 block mb-0.5">Payment Security:</strong>
              <p className="text-slate-600 text-xs">
                We do not store credit card or bank credentials on our servers. All digital payments are processed through secure 256-bit SSL encrypted bank gateways conforming to international PCI-DSS compliance.
              </p>
            </div>
          </div>
        </div>
      ),
    },
  ];

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col font-sans w-full max-w-full overflow-x-hidden">
      <Navbar
        compareCount={0}
        cartCount={cartItems.reduce((acc, item) => acc + item.quantity, 0)}
        onOpenCart={() => setIsCartOpen(true)}
      />

      {/* Header Banner */}
      <div className="bg-slate-950 text-white py-8 sm:py-12 px-3 sm:px-6 lg:px-8 border-b border-slate-800 overflow-hidden">
        <div className="max-w-5xl mx-auto space-y-4">
          <div className="flex items-center gap-2 text-xs text-[#48afff] font-bold uppercase tracking-wider">
            <Link href="/" className="hover:underline">Home</Link>
            <ChevronRight className="w-3.5 h-3.5" />
            <span>Customer Assurances &amp; Policies</span>
          </div>
          <h1 className="text-2xl sm:text-4xl font-black tracking-tight text-white font-sans">
            Nawira Traders Customer Policies &amp; Assurances
          </h1>
          <p className="text-xs sm:text-sm text-slate-400 max-w-2xl leading-relaxed">
            Pakistan&apos;s most trusted mobile phone marketplace. Complete transparency on Open-Parcel Cash on Delivery, official PTA DIRBS compliance, 0% EMI installments, and manufacturer warranties.
          </p>
        </div>
      </div>

      {/* Policies Content */}
      <main id="policies" className="flex-1 max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-10 w-full space-y-8">
        {/* Quick Nav Chips - Responsive Horizontal Rail */}
        <div className="flex items-center gap-2 p-3 sm:p-4 bg-white rounded-2xl border border-slate-200 shadow-xs overflow-x-auto scrollbar-none">
          <span className="text-xs font-bold text-slate-400 self-center mr-1 shrink-0">Quick Jump:</span>
          {policySections.map((sec) => (
            <a
              key={sec.id}
              href={`#${sec.id}`}
              className="shrink-0 whitespace-nowrap px-3 py-1.5 rounded-full text-xs font-bold bg-slate-100 hover:bg-sky-50 text-slate-700 hover:text-[#136ab5] border border-slate-200/80 hover:border-sky-300 transition-all"
            >
              {sec.title}
            </a>
          ))}
        </div>

        {/* Policy Section Cards with Working Anchors */}
        <div className="space-y-8">
          {policySections.map((sec) => (
            <section
              key={sec.id}
              id={sec.id}
              className="scroll-mt-24 p-6 sm:p-8 bg-white rounded-3xl border border-slate-200 shadow-sm hover:border-slate-300 transition-all space-y-4"
            >
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-100">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-2xl bg-slate-50 border border-slate-200 flex items-center justify-center shrink-0">
                    {sec.icon}
                  </div>
                  <div>
                    <h2 className="text-lg sm:text-xl font-black text-slate-950 font-sans">
                      {sec.title}
                    </h2>
                    <p className="text-xs text-slate-500 mt-0.5">{sec.summary}</p>
                  </div>
                </div>
                <span
                  className={`self-start sm:self-center px-3 py-1 rounded-full text-xs font-bold border uppercase tracking-wider ${sec.badgeColor}`}
                >
                  {sec.badge}
                </span>
              </div>

              <div>{sec.content}</div>
            </section>
          ))}
        </div>

        {/* Contact Help CTA */}
        <div className="p-6 sm:p-8 rounded-3xl bg-gradient-to-r from-slate-900 to-cyan-950 text-white flex flex-col md:flex-row items-center justify-between gap-6 border border-slate-800 shadow-lg">
          <div className="space-y-1.5 text-center md:text-left">
            <h3 className="text-xl font-black font-sans">Have questions about an order or policy?</h3>
            <p className="text-xs text-slate-300 max-w-md leading-relaxed">
              Our phone advisors are available Mon-Sat (9:00 AM - 10:00 PM PKT) on direct phone or WhatsApp.
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <a
              href="tel:+923018543131"
              className="px-5 py-2.5 rounded-full bg-slate-800 hover:bg-slate-700 text-white text-xs font-bold flex items-center gap-2 transition-colors"
            >
              <Phone className="w-4 h-4 text-[#48afff]" />
              <span>+92 301 8543131</span>
            </a>
            <a
              href="https://wa.me/923018543131?text=Hi%20Nawira%20Traders!%20I%20have%20a%20question%20about%20store%20policies."
              target="_blank"
              rel="noopener noreferrer"
              className="px-5 py-2.5 rounded-full bg-emerald-500 hover:bg-emerald-400 text-slate-950 text-xs font-black flex items-center gap-2 shadow-md transition-all"
            >
              <MessageSquare className="w-4 h-4" />
              <span>WhatsApp Support</span>
            </a>
          </div>
        </div>
      </main>

      <Footer />

      {/* Cart Drawer */}
      <CartDrawer
        isOpen={isCartOpen}
        onClose={() => setIsCartOpen(false)}
        items={cartItems}
        onUpdateQuantity={(idx, qty) => {
          if (qty <= 0) {
            handleUpdateCart(cartItems.filter((_, i) => i !== idx));
          } else {
            handleUpdateCart(
              cartItems.map((item, i) => (i === idx ? { ...item, quantity: qty } : item))
            );
          }
        }}
        onRemoveItem={(idx) => handleUpdateCart(cartItems.filter((_, i) => i !== idx))}
        onClearCart={() => handleUpdateCart([])}
      />
    </div>
  );
}
