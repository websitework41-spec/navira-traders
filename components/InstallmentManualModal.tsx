'use client';

import React, { useState } from 'react';
import {
  CreditCard,
  Percent,
  ShieldCheck,
  CheckCircle2,
  X,
  PhoneCall,
  MessageSquare,
  ArrowRight,
  Building,
  Check,
  FileText,
  Sparkles,
  Info,
  HelpCircle,
  Truck,
  PackageCheck,
} from 'lucide-react';
import { Smartphone } from '@/types';
import { formatPKR } from '@/data/smartphones';
import { STORE_BANK_DETAILS } from '@/data/bankDetails';
import { PhoneImageWithFallback } from './PhoneImageWithFallback';

interface InstallmentManualModalProps {
  isOpen: boolean;
  onClose: () => void;
  phone?: Smartphone | null;
  onSwitchToCOD?: () => void;
}

const PARTNER_BANKS = [
  { name: 'Bank Alfalah', tenures: '3, 6, 12 Months', markup: '0% Markup' },
  { name: 'Meezan Bank', tenures: '3, 6, 12 Months', markup: '0% Profit (Islamic)' },
  { name: 'Faysal Bank', tenures: '3, 6, 12 Months', markup: '0% Markup' },
  { name: 'Silkbank', tenures: '3, 6, 12 Months', markup: '0% Markup' },
  { name: 'MCB Bank', tenures: '3, 6, 12 Months', markup: '0% Markup' },
  { name: 'Standard Chartered', tenures: '3, 6 Months', markup: '0% Markup' },
  { name: 'Askari Bank', tenures: '3, 6, 12 Months', markup: '0% Markup' },
];

export function InstallmentManualModal({
  isOpen,
  onClose,
  phone,
  onSwitchToCOD,
}: InstallmentManualModalProps) {
  const [selectedTenure, setSelectedTenure] = useState<3 | 6 | 12>(3);
  const [customPrice, setCustomPrice] = useState<number>(phone?.basePricePKR || 85000);

  if (!isOpen) return null;

  const currentPrice = phone?.basePricePKR || customPrice;
  const monthlyAmount = Math.round(currentPrice / selectedTenure);

  // WhatsApp pre-filled message generator
  const deviceName = phone ? phone.name : 'Smartphone';
  const whatsappText = `Assalam-o-Alaikum Nawira Traders! I want to purchase ${encodeURIComponent(
    deviceName
  )} (Total Rs. ${currentPrice.toLocaleString()}) on your ${selectedTenure}-Month 0% Installment Plan (Approx Rs. ${monthlyAmount.toLocaleString()}/month). Please guide me through the bank manual verification and application procedure.`;

  const whatsappUrl = `https://wa.me/923135221200?text=${whatsappText}`;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-slate-950/75 backdrop-blur-sm overflow-y-auto animate-in fade-in duration-200">
      <div className="relative w-full max-w-2xl bg-white rounded-3xl shadow-2xl border border-slate-200 flex flex-col max-h-[92vh] overflow-hidden my-auto animate-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-slate-100 flex items-center justify-between bg-gradient-to-r from-blue-900 via-[#0b3c68] to-indigo-900 text-white shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-white/10 border border-white/20 flex items-center justify-center text-amber-300 shrink-0">
              <Percent className="w-5 h-5 stroke-[2.5]" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base sm:text-lg font-black tracking-tight text-white font-sans">
                  0% Markup Installment Manual &amp; Guide
                </h3>
                <span className="text-[9px] font-black uppercase px-2 py-0.5 rounded-full bg-amber-400 text-slate-950">
                  Manual Info
                </span>
              </div>
              <p className="text-[11px] text-sky-200 font-medium">
                Transparent 3, 6 &amp; 12-Month Plans • WhatsApp Direct Verification
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            aria-label="Close installment guide"
            className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition-colors cursor-pointer shrink-0"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Scrollable Content Body */}
        <div className="p-4 sm:p-6 overflow-y-auto flex-1 space-y-5 text-xs text-slate-700">
          {/* Important Security Notice: Direct Website Checkout Disabled */}
          <div className="p-3.5 rounded-2xl bg-amber-50 border border-amber-200 text-amber-900 flex items-start gap-3 shadow-xs">
            <Info className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
            <div className="space-y-1">
              <p className="font-extrabold text-amber-950 text-xs">
                Notice: Direct Online Installment Checkout is Disabled
              </p>
              <p className="text-[11px] leading-relaxed text-amber-900">
                To protect your bank credentials and avoid unauthorized deductions, our website does not take direct online credit card installment submissions. All installment plans are reviewed and activated safely via verified <strong>WhatsApp Consultation</strong> with official bank documentation.
              </p>
            </div>
          </div>

          {/* Device Showcase (If viewing a phone) */}
          {phone ? (
            <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200 flex items-center justify-between gap-3">
              <div className="flex items-center gap-3 min-w-0">
                <div className="w-14 h-14 rounded-xl bg-white p-1 border border-slate-200 overflow-hidden shrink-0 flex items-center justify-center">
                  <PhoneImageWithFallback
                    src={phone.colors[0]?.image || ''}
                    alt={phone.name}
                    brand={phone.brand}
                    className="w-full h-full object-contain"
                  />
                </div>
                <div className="min-w-0">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                    {phone.brand}
                  </span>
                  <h4 className="text-sm font-extrabold text-slate-900 truncate">
                    {phone.name}
                  </h4>
                  <div className="flex items-center gap-2 mt-0.5">
                    <span className="text-xs font-black text-[#0b3c68]">
                      Rs. {currentPrice.toLocaleString()}
                    </span>
                    <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-1.5 py-0.2 rounded border border-emerald-200">
                      100% PTA Approved
                    </span>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200 space-y-2">
              <div className="flex items-center justify-between">
                <label className="text-[11px] font-bold text-slate-700">
                  Calculate Installments for Any Device Price:
                </label>
                <span className="text-xs font-black text-[#0b3c68]">
                  Rs. {currentPrice.toLocaleString()}
                </span>
              </div>
              <input
                type="range"
                min="20000"
                max="500000"
                step="5000"
                value={currentPrice}
                onChange={(e) => setCustomPrice(Number(e.target.value))}
                className="w-full accent-[#0b3c68]"
              />
              <div className="flex justify-between text-[10px] text-slate-400">
                <span>Rs. 20,000</span>
                <span>Rs. 250,000</span>
                <span>Rs. 500,000</span>
              </div>
            </div>
          )}

          {/* Interactive Tenure Breakdown Cards (3, 6, 12 Months) */}
          <div className="space-y-2.5">
            <h4 className="text-xs font-extrabold text-slate-900 uppercase tracking-wider flex items-center gap-1.5">
              <FileText className="w-3.5 h-3.5 text-[#0b3c68]" />
              <span>Select Installment Plan &amp; Monthly Breakdown:</span>
            </h4>

            <div className="grid grid-cols-3 gap-2.5">
              {[
                { months: 3, label: '3 Months', badge: 'Fast Payoff', fee: 'Zero Advance' },
                { months: 6, label: '6 Months', badge: 'Most Popular', fee: 'Zero Advance' },
                { months: 12, label: '12 Months', badge: 'Lowest Monthly', fee: 'Zero Advance' },
              ].map((plan) => {
                const isSelected = selectedTenure === plan.months;
                const monthly = Math.round(currentPrice / plan.months);
                return (
                  <button
                    key={plan.months}
                    type="button"
                    onClick={() => setSelectedTenure(plan.months as any)}
                    className={`p-3 rounded-2xl border text-left transition-all cursor-pointer flex flex-col justify-between ${
                      isSelected
                        ? 'border-[#0b3c68] bg-[#0b3c68]/5 ring-2 ring-[#48afff] shadow-sm'
                        : 'border-slate-200 hover:border-slate-300 bg-white'
                    }`}
                  >
                    <div>
                      <span
                        className={`text-[9px] font-black uppercase px-1.5 py-0.2 rounded-full ${
                          isSelected
                            ? 'bg-[#0b3c68] text-white'
                            : 'bg-slate-100 text-slate-600'
                        }`}
                      >
                        {plan.badge}
                      </span>
                      <h5 className="font-extrabold text-slate-900 text-xs sm:text-sm mt-1">
                        {plan.label}
                      </h5>
                    </div>

                    <div className="mt-2 pt-2 border-t border-slate-100">
                      <span className="text-[10px] text-slate-400 block font-medium">Monthly:</span>
                      <span className="text-xs sm:text-sm font-black text-[#0b3c68]">
                        Rs. {monthly.toLocaleString()}
                      </span>
                      <span className="text-[9px] text-emerald-600 font-bold block mt-0.5">
                        0% Markup
                      </span>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Transparent Cost Summary Table for Selected Plan */}
          <div className="p-3.5 rounded-2xl bg-blue-50/60 border border-blue-200/80 space-y-2 text-xs">
            <div className="flex items-center justify-between font-bold text-slate-800 pb-1.5 border-b border-blue-200/60">
              <span>{selectedTenure}-Month Plan Summary</span>
              <span className="text-emerald-700 bg-emerald-100 px-2 py-0.2 rounded-full text-[10px]">
                0% Zero Markup
              </span>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-[11px]">
              <div>
                <span className="text-slate-500 block">Monthly Installment:</span>
                <span className="font-black text-[#0b3c68] text-xs">
                  Rs. {monthlyAmount.toLocaleString()} / mo
                </span>
              </div>
              <div>
                <span className="text-slate-500 block">Total Device Price:</span>
                <span className="font-bold text-slate-900">
                  Rs. {currentPrice.toLocaleString()}
                </span>
              </div>
              <div>
                <span className="text-slate-500 block">Extra Interest/Markup:</span>
                <span className="font-bold text-emerald-600">Rs. 0 (0%)</span>
              </div>
              <div>
                <span className="text-slate-500 block">Advance Required:</span>
                <span className="font-bold text-slate-900">Rs. 0 (Zero)</span>
              </div>
            </div>
          </div>

          {/* Procedure & Requirements Guide (Manual) */}
          <div className="space-y-3 pt-1">
            <h4 className="text-xs font-extrabold text-slate-900 uppercase tracking-wider flex items-center gap-1.5">
              <ShieldCheck className="w-4 h-4 text-emerald-600" />
              <span>Installment Procedure &amp; Eligibility Requirements:</span>
            </h4>

            {/* Steps */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
              <div className="p-3 rounded-2xl bg-slate-50 border border-slate-200 space-y-1">
                <span className="w-5 h-5 rounded-full bg-[#0b3c68] text-white flex items-center justify-center text-[10px] font-black">
                  1
                </span>
                <h5 className="font-bold text-slate-900 text-xs">Choose Phone &amp; Plan</h5>
                <p className="text-[10px] text-slate-500 leading-relaxed">
                  Select your desired smartphone and choose whether 3, 6, or 12 months suits your monthly budget best.
                </p>
              </div>

              <div className="p-3 rounded-2xl bg-slate-50 border border-slate-200 space-y-1">
                <span className="w-5 h-5 rounded-full bg-[#0b3c68] text-white flex items-center justify-center text-[10px] font-black">
                  2
                </span>
                <h5 className="font-bold text-slate-900 text-xs">Chat on WhatsApp</h5>
                <p className="text-[10px] text-slate-500 leading-relaxed">
                  Tap the button below. Our coordinator reviews your partner bank card eligibility and verifies limits in minutes.
                </p>
              </div>

              <div className="p-3 rounded-2xl bg-slate-50 border border-slate-200 space-y-1">
                <span className="w-5 h-5 rounded-full bg-emerald-600 text-white flex items-center justify-center text-[10px] font-black">
                  3
                </span>
                <h5 className="font-bold text-slate-900 text-xs">Open-Parcel Delivery</h5>
                <p className="text-[10px] text-slate-500 leading-relaxed">
                  Once your bank plan is converted, your 100% PTA approved sealed phone is dispatched with Open-Parcel inspection.
                </p>
              </div>
            </div>

            {/* Partner Banks Grid */}
            <div className="p-3 rounded-2xl bg-slate-50 border border-slate-200 space-y-2">
              <span className="text-[11px] font-bold text-slate-700 block">
                Supported Pakistani Partner Banks (Credit Cards):
              </span>
              <div className="flex flex-wrap gap-1.5">
                {PARTNER_BANKS.map((b) => (
                  <span
                    key={b.name}
                    className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-white border border-slate-200 text-[10px] font-semibold text-slate-700"
                  >
                    <Check className="w-3 h-3 text-emerald-600" />
                    <span>{b.name}</span>
                    <span className="text-slate-400">({b.tenures})</span>
                  </span>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Modal Bottom CTA Bar */}
        <div className="p-4 sm:p-5 border-t border-slate-100 bg-slate-50 flex flex-col sm:flex-row items-center justify-between gap-3 shrink-0">
          <div className="text-center sm:text-left">
            <span className="text-[11px] text-slate-500 block">
              Estimated Monthly for {selectedTenure} Months:
            </span>
            <span className="text-base sm:text-lg font-black text-[#0b3c68]">
              Rs. {monthlyAmount.toLocaleString()} / month
            </span>
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto">
            {onSwitchToCOD && (
              <button
                type="button"
                onClick={() => {
                  onClose();
                  onSwitchToCOD();
                }}
                className="flex-1 sm:flex-initial px-4 py-3 rounded-2xl border border-slate-300 hover:bg-slate-100 text-slate-700 font-bold text-xs transition-colors cursor-pointer"
              >
                Buy with COD Instead
              </button>
            )}

            <a
              href={whatsappUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="flex-1 sm:flex-initial btn-shimmer btn-press inline-flex items-center justify-center gap-2 px-6 py-3 rounded-2xl bg-[#25D366] hover:bg-[#20bd5a] text-white font-black text-xs sm:text-sm shadow-lg shadow-emerald-500/25 transition-all cursor-pointer"
            >
              <MessageSquare className="w-4 h-4 fill-white" />
              <span>Apply &amp; Order on WhatsApp</span>
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}
