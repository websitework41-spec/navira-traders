'use client';

import React, { useState, memo } from 'react';
import { Smartphone as PhoneIcon } from 'lucide-react';
import { sanitizeText } from '@/lib/security';

interface PhoneImageWithFallbackProps {
  src: string;
  alt: string;
  className?: string;
  brand?: string;
  priority?: boolean;
}

export const PhoneImageWithFallback = memo(function PhoneImageWithFallback({
  src,
  alt,
  className = '',
  brand = '',
  priority = false,
}: PhoneImageWithFallbackProps) {
  const [hasError, setHasError] = useState(false);
  const safeAlt = sanitizeText(alt, 100);
  const safeBrand = sanitizeText(brand, 40);

  if (hasError || !src) {
    return (
      <div
        className={`w-full h-full flex flex-col items-center justify-center bg-slate-100 rounded-lg p-0.5 text-slate-400 overflow-hidden select-none ${className}`}
        aria-label={safeAlt}
        title={safeAlt}
      >
        <PhoneIcon className="w-4 h-4 max-w-[60%] max-h-[60%] text-slate-400 stroke-[1.8] shrink-0" />
        <span className="text-[7px] font-black tracking-wider uppercase text-slate-500 truncate max-w-full leading-tight mt-0.5">
          {safeBrand || 'PHONE'}
        </span>
      </div>
    );
  }

  return (
    <div className={`relative w-full h-full flex items-center justify-center overflow-hidden bg-transparent ${className}`}>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={src}
        alt={safeAlt}
        loading={priority ? 'eager' : 'lazy'}
        decoding="async"
        fetchPriority={priority ? 'high' : 'auto'}
        referrerPolicy="no-referrer"
        className="w-full h-full object-contain mix-blend-multiply transition-transform duration-300 will-change-transform"
        onError={() => setHasError(true)}
      />
    </div>
  );
});
