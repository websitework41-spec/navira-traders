'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { Smartphone, SmartphoneColor, SmartphoneVariant } from '@/types';
import { formatPKR } from '@/data/smartphones';
import { PhoneImageWithFallback } from './PhoneImageWithFallback';
import {
  ShieldCheck,
  Star,
  Check,
  Cpu,
  Battery,
  Camera,
  Layers,
  ArrowRight,
  ShoppingCart,
  Zap,
  CreditCard,
  Sparkles,
} from 'lucide-react';

interface PhoneCardProps {
  phone: Smartphone;
  isComparing?: boolean;
  onToggleCompare?: (phone: Smartphone) => void;
  onAddToCart?: (
    phone: Smartphone,
    variant: SmartphoneVariant,
    color: SmartphoneColor
  ) => void;
  onQuickBuy?: (
    phone: Smartphone,
    variant: SmartphoneVariant,
    color: SmartphoneColor
  ) => void;
  priority?: boolean;
}

export const PhoneCard = React.memo(function PhoneCard({
  phone,
  isComparing = false,
  onToggleCompare,
  onAddToCart,
  onQuickBuy,
  priority = false,
}: PhoneCardProps) {
  // Default to first in-stock color if available, else first color
  const firstInStockIdx = phone.colors.findIndex((c) => c.inStock);
  const [selectedColorIndex, setSelectedColorIndex] = useState(
    firstInStockIdx !== -1 ? firstInStockIdx : 0
  );
  const [isHovered, setIsHovered] = useState(false);
  const activeColor = phone.colors[selectedColorIndex] || phone.colors[0];
  const inStockVariants = phone.variants.filter((v) => v.inStock);
  const primaryVariant = (inStockVariants.length > 0 ? inStockVariants : phone.variants)
    .reduce((cheapest, v) => (v.pricePKR < cheapest.pricePKR ? v : cheapest), phone.variants[0]);

  const isSelectionInStock = Boolean(
    phone.inStock && (activeColor.inStock ?? true) && (primaryVariant?.inStock ?? true)
  );
  const cardPrice = primaryVariant?.pricePKR || phone.basePricePKR;
  const cardOriginalPrice = primaryVariant?.originalPricePKR || phone.originalPricePKR;
  const savingsPKR = Math.max(0, cardOriginalPrice - cardPrice);
  const emiPerMonth = Math.round(cardPrice / 12);

  return (
    <div
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      className="group relative flex flex-col justify-between bg-white rounded-3xl p-3 sm:p-5 border border-slate-200/90 shadow-[0_4px_16px_rgba(0,0,0,0.03)] hover:shadow-2xl hover:border-sky-400 hover:-translate-y-2 transition-all duration-300"
    >
      {/* Top Badges & Compare Toggle */}
      <div>
        <div className="flex items-center justify-between gap-1.5 mb-2">
          <div className="flex flex-wrap items-center gap-1">
            {!phone.inStock ? (
              <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[9px] sm:text-[10px] font-bold bg-slate-100 text-slate-600 border border-slate-200">
                Out of Stock
              </span>
            ) : phone.category === 'Accessories' ? (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[9px] sm:text-[10px] font-bold bg-indigo-50 text-indigo-700 border border-indigo-200 shadow-xs">
                <ShieldCheck className="w-3 h-3 sm:w-3.5 sm:h-3.5 stroke-[2.2]" />
                100% Genuine
              </span>
            ) : (
              phone.specs.ptaStatus === 'PTA Approved' && (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[9px] sm:text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200 shadow-xs">
                  <ShieldCheck className="w-3 h-3 sm:w-3.5 sm:h-3.5 stroke-[2.2]" />
                  PTA Approved
                </span>
              )
            )}
            {phone.discountPercent > 0 && (
              <span className="inline-flex items-center gap-1 px-1.5 sm:px-2 py-0.5 rounded-full text-[9px] sm:text-[10px] font-black bg-[#fef3eb] text-[#f47708] border border-[#fcd5b8] shadow-xs group-hover:scale-105 transition-transform">
                <Sparkles className="w-2.5 h-2.5 text-[#f47708] fill-[#f47708]" />
                {`${phone.discountPercent}% OFF`}
              </span>
            )}
          </div>

          {/* Compare Toggle Button (Visible on sm+) */}
          {onToggleCompare && (
            <button
              onClick={(e) => {
                e.preventDefault();
                onToggleCompare(phone);
              }}
              title="Add to Compare"
              className={`hidden sm:inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold transition-all cursor-pointer btn-press ${
                isComparing
                  ? 'bg-[#136ab5] text-white shadow-sm ring-2 ring-[#48afff]'
                  : 'bg-slate-100 hover:bg-slate-200 text-slate-600 hover:text-slate-900'
              }`}
            >
              <Layers className="w-3.5 h-3.5" />
              <span>{isComparing ? 'Comparing' : 'Compare'}</span>
            </button>
          )}
        </div>

        {/* Product Image Canvas */}
        <Link
          href={`/product/${phone.slug}`}
          className="block relative w-full h-36 sm:h-52 my-1.5 rounded-2xl bg-gradient-to-b from-slate-50 via-slate-50/50 to-white p-2 sm:p-3 overflow-hidden flex items-center justify-center border border-slate-100 group-hover:border-sky-200 transition-colors"
        >
          <div className="w-full h-full flex items-center justify-center transition-transform duration-500 ease-out group-hover:scale-105">
            <PhoneImageWithFallback
              src={activeColor.image}
              alt={`${phone.name} - ${activeColor.name}`}
              brand={phone.brand}
              className="w-full h-full object-contain"
              priority={priority}
            />
          </div>
        </Link>

        {/* Color Variant Swatches with Tactile Pop */}
        <div className="flex items-center gap-1.5 my-1.5 sm:my-2.5">
          <span className="text-[9px] sm:text-[10px] uppercase font-bold text-slate-400 tracking-wider">
            Colors:
          </span>
          <div className="flex items-center gap-1 sm:gap-1.5">
            {phone.colors.map((color, idx) => {
              const isColorInStock = color.inStock ?? true;
              const isSelected = selectedColorIndex === idx;
              return (
                <button
                  key={color.name}
                  onClick={() => setSelectedColorIndex(idx)}
                  title={`${color.name} ${!isColorInStock ? '(Out of Stock)' : ''}`}
                  className={`relative w-4 h-4 rounded-full border transition-all duration-200 cursor-pointer ${
                    isSelected
                      ? 'ring-2 ring-[#48afff] ring-offset-2 scale-125 shadow-md'
                      : 'border-slate-300 hover:scale-130 hover:border-slate-400'
                  } ${!isColorInStock ? 'opacity-40' : ''}`}
                  style={{ backgroundColor: color.hex }}
                >
                  {!isColorInStock && (
                    <span className="absolute inset-0 flex items-center justify-center text-[9px] text-rose-600 font-black">
                      ×
                    </span>
                  )}
                </button>
              );
            })}
          </div>
          <div className="ml-auto flex items-center gap-1 max-w-[110px]">
            <span className="text-[11px] text-slate-500 font-medium truncate group-hover:text-slate-700 transition-colors">
              {activeColor.name}
            </span>
            {activeColor.inStock === false && (
              <span className="text-[9px] font-bold text-rose-600 bg-rose-50 px-1 py-0.2 rounded border border-rose-200">
                OOS
              </span>
            )}
          </div>
        </div>

        {/* Brand & Name */}
        <div className="mt-1">
          <span className="text-[10px] sm:text-[11px] font-extrabold uppercase tracking-wider text-[#136ab5]">
            {phone.brand}
          </span>
          <Link href={`/product/${phone.slug}`}>
            <h3 className="text-xs sm:text-base font-extrabold text-slate-950 group-hover:text-[#136ab5] transition-colors line-clamp-1 mt-0.5">
              {phone.name}
            </h3>
          </Link>
          <p className="text-[10px] sm:text-xs text-slate-500 line-clamp-1 mt-0.5">
            {phone.tagline}
          </p>
        </div>

        {/* Key Specs Micro-Chips */}
        <div className="grid grid-cols-2 gap-1 sm:gap-1.5 mt-2 sm:mt-2.5 pt-2 sm:pt-2.5 border-t border-slate-100 text-[10px] sm:text-[11px] text-slate-600">
          {phone.category === 'Accessories' ? (
            <>
              <div className="flex items-center gap-1 sm:gap-1.5 min-w-0 group-hover:text-slate-800 transition-colors">
                <Sparkles className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-amber-500 flex-shrink-0" />
                <span className="truncate">{phone.accessoryType || 'Accessory'}</span>
              </div>
              <div className="flex items-center gap-1 sm:gap-1.5 min-w-0 group-hover:text-slate-800 transition-colors">
                <Zap className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-sky-500 flex-shrink-0" />
                <span className="truncate">{phone.specs.charging || phone.specs.battery || 'Fast Charge'}</span>
              </div>
              <div className="flex items-center gap-1 sm:gap-1.5 min-w-0 group-hover:text-slate-800 transition-colors">
                <ShieldCheck className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-emerald-500 flex-shrink-0" />
                <span className="truncate">{phone.specs.warranty || 'Official Warranty'}</span>
              </div>
              <div className="flex items-center gap-1 sm:gap-1.5 min-w-0 group-hover:text-slate-800 transition-colors">
                <Layers className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-indigo-500 flex-shrink-0" />
                <span className="truncate">{primaryVariant.storage || primaryVariant.ram || 'Genuine'}</span>
              </div>
            </>
          ) : (
            <>
              <div className="flex items-center gap-1 sm:gap-1.5 min-w-0 group-hover:text-slate-800 transition-colors">
                <Cpu className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-slate-400 flex-shrink-0" />
                <span className="truncate">
                  {phone.specs.chipsetBrand || phone.keyHighlights?.processor?.split(' ')[0] || 'Octa-Core'}
                </span>
              </div>
              <div className="flex items-center gap-1 sm:gap-1.5 min-w-0 group-hover:text-slate-800 transition-colors">
                <Battery className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-slate-400 flex-shrink-0" />
                <span className="truncate">
                  {(() => {
                    const raw = phone.keyHighlights?.battery || phone.specs.battery || '';
                    const match = raw.match(/(\d{3,5})\s*mAh/i);
                    if (match) return `${match[1]} mAh`;
                    const numMatch = raw.match(/\d{3,5}/);
                    if (numMatch) return `${numMatch[0]} mAh`;
                    return '5000 mAh';
                  })()}
                </span>
              </div>
              <div className="flex items-center gap-1 sm:gap-1.5 min-w-0 group-hover:text-slate-800 transition-colors">
                <Camera className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-slate-400 flex-shrink-0" />
                <span className="truncate">
                  {(() => {
                    const raw = phone.specs.mainCamera || phone.keyHighlights?.camera || '';
                    const lower = raw.toLowerCase().trim();
                    if (!lower || lower === 'no' || lower === 'no camera' || lower === 'none') return 'No Camera';
                    if (lower.includes('digital camera')) return 'Digital Camera';
                    if (lower === 'vga' || lower === 'qvga') return lower.toUpperCase();
                    if (lower === 'yes') return 'Digital Camera';
                    const clean = raw.replace(/(\d+)\.0+\s*MP/gi, '$1 MP');
                    const mpMatch = clean.match(/(\d+(?:\.\d+)?)\s*MP/i);
                    if (mpMatch && parseFloat(mpMatch[1]) > 0) return `${mpMatch[1]} MP`;
                    const numMatch = clean.match(/^\d+$/);
                    if (numMatch) return `${numMatch[0]} MP`;
                    const firstPart = clean.split('+')[0].trim();
                    return firstPart || '50 MP';
                  })()}
                </span>
              </div>
              <div className="flex items-center gap-1 sm:gap-1.5 min-w-0 group-hover:text-slate-800 transition-colors">
                <Layers className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-slate-400 flex-shrink-0" />
                <span className="truncate">
                  {`${primaryVariant.ram} / ${primaryVariant.storage}`}
                </span>
              </div>
            </>
          )}
        </div>
      </div>

      {/* Pricing, Stock Status & Dual Conversion Action Buttons */}
      <div className="mt-2.5 sm:mt-3 pt-2.5 sm:pt-3 border-t border-slate-100">
        {/* Price & Star Rating */}
        <div className="flex items-baseline justify-between gap-1">
          <div className="min-w-0">
            <div className="flex items-baseline gap-1">
              <span className="text-[10px] sm:text-xs font-bold text-slate-500">Rs</span>
              <span className="text-base sm:text-2xl font-black text-slate-950 group-hover:text-[#136ab5] tracking-tight transition-colors truncate">
                {cardPrice.toLocaleString()}
              </span>
            </div>
            {cardOriginalPrice > cardPrice && (
              <div className="flex items-center gap-1 sm:gap-1.5 mt-0.5 text-[10px] sm:text-xs text-slate-400">
                <span className="line-through truncate">Rs {cardOriginalPrice.toLocaleString()}</span>
                <span className="text-[9px] sm:text-[10px] font-black px-1 sm:px-1.5 py-0.2 rounded bg-[#fef3eb] text-[#f47708] border border-[#fcd5b8] shrink-0">
                  {Math.round(((cardOriginalPrice - cardPrice) / cardOriginalPrice) * 100)}%
                </span>
              </div>
            )}
          </div>

          <div className="flex items-center gap-1 px-1.5 sm:px-2 py-0.5 rounded-lg bg-amber-50 border border-amber-200/60 text-[10px] sm:text-xs text-amber-700 font-extrabold shrink-0">
            <Star className="w-3 h-3 sm:w-3.5 sm:h-3.5 fill-amber-400 stroke-amber-400" />
            <span>{phone.rating}</span>
            <span className="hidden sm:inline text-[10px] text-slate-400 font-normal">({phone.reviewCount})</span>
          </div>
        </div>

        {/* 0% EMI Installment Badge */}
        <div className="mt-1.5 sm:mt-2 py-0.5 sm:py-1 px-2 sm:px-2.5 rounded-xl bg-slate-50 hover:bg-sky-50/60 border border-slate-200/80 transition-colors flex items-center justify-between text-[10px] sm:text-[11px] text-slate-600">
          <span className="flex items-center gap-1 font-medium truncate">
            <CreditCard className="w-3 h-3 text-[#136ab5] shrink-0" />
            <span className="truncate">0% EMI:</span>
          </span>
          <span className="font-extrabold text-[#136ab5] shrink-0 ml-1">
            {formatPKR(emiPerMonth)}/mo
          </span>
        </div>

        {/* Live Stock Status Indicator */}
        <div className="mt-2 flex items-center justify-between text-[10px] sm:text-[11px]">
          {isSelectionInStock ? (
            <span className="inline-flex items-center gap-1 text-emerald-700 font-semibold truncate">
              <span className="relative flex h-2 w-2 shrink-0">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
              </span>
              <span className="truncate">In Stock</span>
            </span>
          ) : (
            <span className="inline-flex items-center gap-1 text-rose-600 font-semibold truncate">
              <span className="h-1.5 w-1.5 rounded-full bg-rose-500 shrink-0" />
              <span className="truncate">Out of Stock</span>
            </span>
          )}
          <span className="text-slate-400 font-medium truncate text-[9px] sm:text-[10px]">Open-Parcel COD</span>
        </div>

        {/* Dual Conversion Buttons */}
        <div className="grid grid-cols-12 gap-1.5 sm:gap-2 mt-2 sm:mt-3">
          {/* Quick Buy Button */}
          <button
            onClick={() => {
              if (isSelectionInStock && onQuickBuy) {
                onQuickBuy(phone, primaryVariant, activeColor);
              }
            }}
            disabled={!isSelectionInStock}
            className={`group/btn col-span-8 flex items-center justify-center gap-1 py-2 sm:py-2.5 px-1.5 sm:px-3 rounded-xl text-[11px] sm:text-xs font-black transition-all btn-shimmer btn-press ${
              isSelectionInStock
                ? 'bg-gradient-to-r from-[#48afff] to-[#1084d0] hover:from-[#229eff] hover:to-[#0b3c68] text-white shadow-md shadow-[#48afff]/25 hover:shadow-xl hover:shadow-[#48afff]/40 cursor-pointer'
                : 'bg-slate-200 text-slate-400 cursor-not-allowed border border-slate-300'
            }`}
          >
            <Zap className="w-3 h-3 sm:w-3.5 sm:h-3.5 fill-white stroke-white group-hover/btn:rotate-12 transition-transform duration-300" />
            <span className="truncate">{isSelectionInStock ? 'Quick Buy' : 'Out of Stock'}</span>
          </button>

          {/* Add to Cart Button */}
          <button
            onClick={() => {
              if (isSelectionInStock && onAddToCart) {
                onAddToCart(phone, primaryVariant, activeColor);
              }
            }}
            disabled={!isSelectionInStock}
            title="Add to Cart"
            className={`group/cart col-span-4 flex items-center justify-center py-2 sm:py-2.5 px-1 sm:px-2 rounded-xl text-xs font-bold transition-all btn-press ${
              isSelectionInStock
                ? 'bg-slate-900 hover:bg-slate-800 text-white cursor-pointer shadow-md shadow-slate-900/15 hover:shadow-lg hover:shadow-slate-900/25'
                : 'bg-slate-100 text-slate-300 cursor-not-allowed'
            }`}
          >
            <ShoppingCart className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-white group-hover/cart:scale-120 transition-transform duration-200" />
          </button>
        </div>
      </div>
    </div>
  );
});
