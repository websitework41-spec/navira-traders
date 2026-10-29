'use client';

import React, { useState } from 'react';
import { Smartphone } from '@/types';
import { formatPKR } from '@/data/smartphones';
import {
  TRADE_IN_BRANDS,
  TRADE_IN_MODELS,
  CONDITIONS,
  TradeInModel,
} from '@/data/tradeInCatalog';
import {
  X,
  RefreshCw,
  Sparkles,
  ShieldCheck,
  Check,
  MessageSquare,
  ArrowRight,
  TrendingDown,
  Smartphone as PhoneIcon,
  HelpCircle,
} from 'lucide-react';

interface TradeInEstimatorModalProps {
  isOpen: boolean;
  onClose: () => void;
  targetPhone?: Smartphone | null;
  targetPricePKR?: number;
}

export function TradeInEstimatorModal({
  isOpen,
  onClose,
  targetPhone,
  targetPricePKR,
}: TradeInEstimatorModalProps) {
  const [selectedBrand, setSelectedBrand] = useState<string>(TRADE_IN_BRANDS[0]);
  const modelsForBrand = TRADE_IN_MODELS[selectedBrand] || [];

  const [selectedModel, setSelectedModel] = useState<TradeInModel>(modelsForBrand[0]);
  const [selectedStorage, setSelectedStorage] = useState<string>(
    modelsForBrand[0]?.availableStorage[0] || '128GB'
  );
  const [selectedCondition, setSelectedCondition] = useState<string>(CONDITIONS[0].id);
  const [isPtaApproved, setIsPtaApproved] = useState<boolean>(true);

  // When brand changes, update model & storage
  const handleBrandChange = (brand: string) => {
    setSelectedBrand(brand);
    const newModels = TRADE_IN_MODELS[brand] || [];
    if (newModels.length > 0) {
      setSelectedModel(newModels[0]);
      setSelectedStorage(newModels[0].availableStorage[0] || '128GB');
    }
  };

  // When model changes, update storage
  const handleModelChange = (modelName: string) => {
    const found = modelsForBrand.find((m) => m.model === modelName);
    if (found) {
      setSelectedModel(found);
      setSelectedStorage(found.availableStorage[0] || '128GB');
    }
  };

  // Calculate Trade-in valuation
  const calculateValuation = () => {
    if (!selectedModel) return 0;

    let base = selectedModel.baseValuationPKR;

    // Storage multiplier
    if (selectedStorage === '64GB') {
      base = base * 0.9;
    } else if (selectedStorage === '256GB') {
      base = base * 1.12;
    } else if (selectedStorage === '512GB') {
      base = base * 1.25;
    } else if (selectedStorage === '1TB') {
      base = base * 1.35;
    }

    // Condition multiplier
    const cond = CONDITIONS.find((c) => c.id === selectedCondition) || CONDITIONS[0];
    base = base * cond.multiplier;

    // PTA penalty if non-PTA
    if (!isPtaApproved) {
      base = base * 0.65;
    }

    return Math.round(base / 500) * 500; // Round to nearest Rs. 500
  };

  if (!isOpen) return null;

  const estimatedValue = calculateValuation();
  const newPhonePrice = targetPricePKR || targetPhone?.basePricePKR || 0;
  const netPayablePrice = Math.max(0, newPhonePrice - estimatedValue);

  const selectedConditionObj = CONDITIONS.find((c) => c.id === selectedCondition);

  // Build WhatsApp text
  const whatsappTradeInMessage = `Hi Nawira Traders! I would like to trade in my old phone for an upgrade:
📱 My Old Phone: ${selectedBrand} ${selectedModel?.model} (${selectedStorage})
✨ Condition: ${selectedConditionObj?.label}
📶 PTA Status: ${isPtaApproved ? 'Official PTA Approved' : 'Non-PTA / JV'}
💰 Estimated Trade-In Credit: Rs. ${estimatedValue.toLocaleString()}
${targetPhone ? `🛒 Target Upgrade Phone: ${targetPhone.name} (Rs. ${newPhonePrice.toLocaleString()})\n💵 Net Amount to Pay: Rs. ${netPayablePrice.toLocaleString()}` : ''}

Please confirm exchange doorstep inspection and order booking!`;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/70 backdrop-blur-xs overflow-y-auto animate-in fade-in duration-200">
      <div className="relative w-full max-w-xl bg-white rounded-3xl shadow-2xl border border-slate-200 flex flex-col max-h-[92vh] overflow-hidden my-auto">
        {/* Header */}
        <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between bg-gradient-to-r from-emerald-50/60 to-sky-50/60 shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-2xl bg-emerald-600 text-white flex items-center justify-center shadow-md shadow-emerald-600/20">
              <RefreshCw className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-black text-slate-900 tracking-tight flex items-center gap-1.5">
                <span>Old Phone Trade-In &amp; Exchange Calculator</span>
              </h2>
              <p className="text-[11px] text-slate-500 font-medium">
                Exchange your old handset for guaranteed cash credit towards a new smartphone.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-white hover:bg-slate-100 text-slate-500 hover:text-slate-800 flex items-center justify-center transition-colors shadow-2xs border border-slate-200 cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Scrollable Form Body */}
        <div className="p-4 sm:p-6 overflow-y-auto space-y-4">
          {/* Target Upgrade Device Banner */}
          {targetPhone && (
            <div className="p-3.5 rounded-2xl bg-[#0b3c68]/5 border border-[#0b3c68]/15 flex items-center justify-between">
              <div>
                <div className="text-[10px] font-black uppercase text-[#0b3c68] tracking-wider">
                  Target Upgrade Phone
                </div>
                <div className="text-sm font-black text-slate-900 mt-0.5">
                  {targetPhone.name}
                </div>
              </div>
              <div className="text-right">
                <div className="text-[10px] text-slate-500">Retail Price</div>
                <div className="text-sm font-black text-[#0b3c68]">
                  {formatPKR(newPhonePrice)}
                </div>
              </div>
            </div>
          )}

          {/* 1. Select Brand */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-700">
              Step 1: Select Brand of Your Old Phone
            </label>
            <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-none">
              {TRADE_IN_BRANDS.map((brand) => (
                <button
                  key={brand}
                  type="button"
                  onClick={() => handleBrandChange(brand)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all cursor-pointer ${
                    selectedBrand === brand
                      ? 'bg-[#0b3c68] text-white shadow-xs'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200 border border-slate-200/60'
                  }`}
                >
                  {brand}
                </button>
              ))}
            </div>
          </div>

          {/* 2. Select Model & Storage */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-700">Step 2: Select Model</label>
              <select
                value={selectedModel?.model}
                onChange={(e) => handleModelChange(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs font-bold text-slate-900 bg-white focus:outline-none focus:ring-2 focus:ring-[#0b3c68]"
              >
                {modelsForBrand.map((m) => (
                  <option key={m.model} value={m.model}>
                    {m.model}
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-700">Step 3: Storage Capacity</label>
              <select
                value={selectedStorage}
                onChange={(e) => setSelectedStorage(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs font-bold text-slate-900 bg-white focus:outline-none focus:ring-2 focus:ring-[#0b3c68]"
              >
                {selectedModel?.availableStorage.map((st) => (
                  <option key={st} value={st}>
                    {st}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* 3. PTA Approval Status */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-700">Step 4: PTA DIRBS Status</label>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setIsPtaApproved(true)}
                className={`p-3 rounded-2xl border text-left transition-all cursor-pointer ${
                  isPtaApproved
                    ? 'bg-emerald-50 border-emerald-300 ring-2 ring-emerald-500/30'
                    : 'bg-white border-slate-200 hover:bg-slate-50'
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className="text-xs font-black text-slate-900 flex items-center gap-1.5">
                    <ShieldCheck className="w-4 h-4 text-emerald-600" />
                    <span>Official PTA Approved</span>
                  </div>
                  {isPtaApproved && <Check className="w-3.5 h-3.5 text-emerald-600" />}
                </div>
                <p className="text-[10px] text-slate-500 mt-0.5">Tax fully paid, 100% SIM active</p>
              </button>

              <button
                type="button"
                onClick={() => setIsPtaApproved(false)}
                className={`p-3 rounded-2xl border text-left transition-all cursor-pointer ${
                  !isPtaApproved
                    ? 'bg-amber-50 border-amber-300 ring-2 ring-amber-500/30'
                    : 'bg-white border-slate-200 hover:bg-slate-50'
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className="text-xs font-black text-slate-900">Non-PTA / JV / Locked</div>
                  {!isPtaApproved && <Check className="w-3.5 h-3.5 text-amber-600" />}
                </div>
                <p className="text-[10px] text-slate-500 mt-0.5">SIM locked or Wi-Fi only device</p>
              </button>
            </div>
          </div>

          {/* 4. Physical Condition */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-700">
              Step 5: Physical Condition of Your Device
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {CONDITIONS.map((cond) => {
                const isSelected = selectedCondition === cond.id;
                return (
                  <button
                    key={cond.id}
                    type="button"
                    onClick={() => setSelectedCondition(cond.id)}
                    className={`p-2.5 rounded-2xl border text-left transition-all cursor-pointer ${
                      isSelected
                        ? 'bg-sky-50 border-sky-300 ring-2 ring-sky-500/30'
                        : 'bg-white border-slate-200 hover:bg-slate-50'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-slate-900">{cond.label}</span>
                      {isSelected && <Check className="w-3.5 h-3.5 text-sky-600" />}
                    </div>
                    <p className="text-[10px] text-slate-500 mt-0.5 line-clamp-1">{cond.description}</p>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Real-time Valuation Output Box */}
          <div className="p-4 rounded-3xl bg-gradient-to-br from-emerald-500 via-emerald-600 to-teal-700 text-white shadow-xl space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-emerald-200" />
                <span className="text-xs font-black uppercase tracking-wider text-emerald-100">
                  Instant Exchange Credit
                </span>
              </div>
              <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded-full bg-white/20 text-white">
                Doorstep Pickup
              </span>
            </div>

            <div className="flex items-baseline justify-between border-b border-white/20 pb-2.5">
              <div>
                <div className="text-xs text-emerald-100">Your Old Phone Value:</div>
                <div className="text-2xl sm:text-3xl font-black tracking-tight text-white">
                  {formatPKR(estimatedValue)}
                </div>
              </div>
              <div className="text-right text-emerald-100 text-xs">
                <div>Model: {selectedModel?.model}</div>
                <div>Condition: {selectedConditionObj?.label.split(' ')[0]}</div>
              </div>
            </div>

            {/* If target phone is selected, show difference */}
            {targetPhone && (
              <div className="flex items-center justify-between text-xs pt-0.5 font-bold">
                <span className="text-emerald-100">You Only Pay for {targetPhone.name}:</span>
                <span className="text-base sm:text-lg font-black text-white bg-white/20 px-2.5 py-0.5 rounded-xl">
                  {formatPKR(netPayablePrice)}
                </span>
              </div>
            )}
          </div>

          {/* Doorstep Exchange Steps */}
          <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200/90 text-[11px] text-slate-600 space-y-1.5">
            <div className="font-bold text-slate-900 flex items-center gap-1.5">
              <span>How Doorstep Exchange Works:</span>
            </div>
            <div className="grid grid-cols-3 gap-2 text-center pt-1">
              <div className="bg-white p-2 rounded-xl border border-slate-200">
                <div className="font-black text-[#0b3c68]">1. Book</div>
                <div className="text-[10px] text-slate-400">Share details via WhatsApp</div>
              </div>
              <div className="bg-white p-2 rounded-xl border border-slate-200">
                <div className="font-black text-[#0b3c68]">2. Inspect</div>
                <div className="text-[10px] text-slate-400">Rider tests your old phone</div>
              </div>
              <div className="bg-white p-2 rounded-xl border border-slate-200">
                <div className="font-black text-[#0b3c68]">3. Swap</div>
                <div className="text-[10px] text-slate-400">Pay remaining difference</div>
              </div>
            </div>
          </div>
        </div>

        {/* Modal Footer CTA */}
        <div className="p-4 sm:p-5 border-t border-slate-100 bg-slate-50/70 flex flex-col sm:flex-row items-center gap-2.5 shrink-0">
          <a
            href={`https://wa.me/923018543131?text=${encodeURIComponent(whatsappTradeInMessage)}`}
            target="_blank"
            rel="noopener noreferrer"
            className="w-full sm:flex-1 py-3 px-4 rounded-2xl bg-[#25D366] hover:bg-[#20ba5a] text-white font-black text-xs sm:text-sm flex items-center justify-center gap-2 transition-all shadow-md shadow-emerald-600/20 cursor-pointer"
          >
            <MessageSquare className="w-4 h-4 fill-white/20" />
            <span>Confirm Trade-In on WhatsApp (+92 301 8543131)</span>
          </a>

          <button
            type="button"
            onClick={onClose}
            className="w-full sm:w-auto py-3 px-5 rounded-2xl border border-slate-200 bg-white hover:bg-slate-100 text-slate-700 font-bold text-xs transition-colors cursor-pointer"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
