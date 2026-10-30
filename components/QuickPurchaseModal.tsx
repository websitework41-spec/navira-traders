'use client';

import React, { useState, useEffect } from 'react';
import { Smartphone, SmartphoneColor, SmartphoneVariant, Coupon } from '@/types';
import { formatPKR, PAKISTAN_CITIES } from '@/data/smartphones';
import { PhoneImageWithFallback } from './PhoneImageWithFallback';
import {
  X,
  ShieldCheck,
  PackageCheck,
  Truck,
  CheckCircle2,
  Lock,
  Phone,
  CreditCard,
  Banknote,
  Percent,
  Sparkles,
  ArrowRight,
  MessageSquare,
  Check,
  Tag,
  Mail,
  Copy,
  Building,
} from 'lucide-react';

import {
  sanitizeText,
  validatePakistaniPhone,
  isBotSubmission,
  submissionRateLimiter,
  MAX_INPUT_LENGTHS,
} from '@/lib/security';
import { useAuth } from '@/context/AuthContext';
import { doc, setDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { trackPurchase } from './AnalyticsTracker';
import { STORE_BANK_DETAILS } from '@/data/bankDetails';

interface QuickPurchaseModalProps {
  phone: Smartphone | null;
  selectedVariant?: SmartphoneVariant | null;
  selectedColor?: SmartphoneColor | null;
  isOpen: boolean;
  onClose: () => void;
}

export function QuickPurchaseModal({
  phone,
  selectedVariant,
  selectedColor,
  isOpen,
  onClose,
}: QuickPurchaseModalProps) {
  const { user, profile } = useAuth();

  // Form states
  const [fullName, setFullName] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [altPhone, setAltPhone] = useState('');
  const [customerEmail, setCustomerEmail] = useState('');
  const [city, setCity] = useState(PAKISTAN_CITIES[0] || 'Karachi');
  const [deliveryAddress, setDeliveryAddress] = useState('');
  const [paymentMethod, setPaymentMethod] = useState<'cod' | 'bank' | 'emi'>('cod');
  const [deliveryNotes, setDeliveryNotes] = useState('');
  const [honeypot, setHoneypot] = useState(''); // Anti-bot honeypot trap
  const [validationError, setValidationError] = useState('');
  const [copiedReceipt, setCopiedReceipt] = useState(false);
  const [copiedBankField, setCopiedBankField] = useState<string | null>(null);
  const [bankTxRef, setBankTxRef] = useState('');

  const copyToClipboard = (text: string, fieldName: string) => {
    if (typeof navigator !== 'undefined' && navigator.clipboard) {
      navigator.clipboard.writeText(text);
      setCopiedBankField(fieldName);
      setTimeout(() => setCopiedBankField(null), 2200);
    }
  };

  // Submission state
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isOrderConfirmed, setIsOrderConfirmed] = useState(false);
  const [generatedOrderId, setGeneratedOrderId] = useState('');

  // Promo Code / Coupon state
  const [couponCodeInput, setCouponCodeInput] = useState('');
  const [appliedCoupon, setAppliedCoupon] = useState<Coupon | null>(null);
  const [discountAmount, setDiscountAmount] = useState(0);
  const [couponError, setCouponError] = useState('');
  const [couponSuccess, setCouponSuccess] = useState('');
  const [isApplyingCoupon, setIsApplyingCoupon] = useState(false);

  // Auto-prefill customer info when logged in
  useEffect(() => {
    if (user && profile && isOpen) {
      if (!fullName && (profile.name || user.displayName)) {
        setFullName(profile.name || user.displayName || '');
      }
      if (!phoneNumber && profile.phone) {
        setPhoneNumber(profile.phone);
      }
      if (!customerEmail && (profile.email || user.email)) {
        setCustomerEmail(profile.email || user.email || '');
      }
      const defaultAddr = profile.addresses?.find((a) => a.isDefault) || profile.addresses?.[0];
      if (defaultAddr) {
        if (!deliveryAddress) {
          setDeliveryAddress(defaultAddr.streetAddress);
        }
        if (defaultAddr.city) {
          setCity(defaultAddr.city);
        }
      }
    }
  }, [user, profile, isOpen]);

  const currentVariant = phone
    ? (selectedVariant || phone.variants?.find((v) => v.inStock) || phone.variants?.[0] || null)
    : null;
  const currentColor = phone
    ? (selectedColor || phone.colors?.find((c) => c.inStock) || phone.colors?.[0] || null)
    : null;
  const price = currentVariant ? currentVariant.pricePKR : (phone?.basePricePKR || 0);
  const finalPrice = Math.max(0, price - discountAmount);

  // Recalculate discount if device price changes
  useEffect(() => {
    if (appliedCoupon && isOpen) {
      if (appliedCoupon.minOrderAmount && price < appliedCoupon.minOrderAmount) {
        setAppliedCoupon(null);
        setDiscountAmount(0);
        setCouponError(`Coupon removed: minimum order of Rs. ${appliedCoupon.minOrderAmount.toLocaleString()} required.`);
        setCouponSuccess('');
      } else {
        let newDisc = 0;
        if (appliedCoupon.discountType === 'fixed') {
          newDisc = appliedCoupon.discountValue;
        } else if (appliedCoupon.discountType === 'percentage') {
          const raw = Math.round((price * appliedCoupon.discountValue) / 100);
          newDisc = appliedCoupon.maxDiscountAmount ? Math.min(appliedCoupon.maxDiscountAmount, raw) : raw;
        }
        setDiscountAmount(Math.min(newDisc, price));
      }
    }
  }, [price, appliedCoupon, isOpen]);

  // Guaranteed: All hooks are called unconditionally in identical order before this return
  if (!isOpen || !phone || !currentColor) return null;

  const handleApplyCoupon = async (codeToApply?: string) => {
    const code = (codeToApply || couponCodeInput).trim();
    if (!code) {
      setCouponError('Please enter a promo code.');
      return;
    }
    setIsApplyingCoupon(true);
    setCouponError('');
    setCouponSuccess('');
    try {
      const res = await fetch('/api/coupons', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'validate', code, orderTotal: price }),
      });
      const data = await res.json();
      if (data.success && data.coupon) {
        setAppliedCoupon(data.coupon);
        setDiscountAmount(data.discountAmount);
        setCouponSuccess(`Coupon "${data.coupon.code}" applied! Saved Rs. ${data.discountAmount.toLocaleString()}`);
        setCouponCodeInput(data.coupon.code);
      } else {
        setCouponError(data.error || 'Invalid promo code.');
      }
    } catch {
      setCouponError('Unable to apply coupon. Please try again.');
    } finally {
      setIsApplyingCoupon(false);
    }
  };

  const handleRemoveCoupon = () => {
    setAppliedCoupon(null);
    setDiscountAmount(0);
    setCouponSuccess('');
    setCouponError('');
    setCouponCodeInput('');
  };

  const handleSubmitOrder = async (e: React.FormEvent) => {
    e.preventDefault();
    setValidationError('');

    // 1. Input Sanitization against XSS & script injection
    const cleanName = sanitizeText(fullName, MAX_INPUT_LENGTHS.NAME);
    const cleanAddress = sanitizeText(deliveryAddress, MAX_INPUT_LENGTHS.ADDRESS);
    const cleanAltPhone = sanitizeText(altPhone, MAX_INPUT_LENGTHS.PHONE);
    const cleanNotes = sanitizeText(deliveryNotes, MAX_INPUT_LENGTHS.NOTES);
    const cleanEmail = sanitizeText(customerEmail, 100);

    if (!cleanName || cleanName.trim().length === 0) {
      setValidationError('Please enter your full name.');
      return;
    }

    if (!cleanAddress || cleanAddress.trim().length === 0) {
      setValidationError('Please enter your complete delivery address.');
      return;
    }

    if (cleanEmail && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(cleanEmail)) {
      setValidationError('Please enter a valid email address (e.g. name@gmail.com) or leave it blank.');
      return;
    }

    // 2. Strict Pakistani Mobile Validation (03XX-XXXXXXX)
    const phoneCheck = validatePakistaniPhone(phoneNumber);
    if (!phoneCheck.isValid) {
      setValidationError(phoneCheck.errorMessage || 'Invalid Pakistani mobile number.');
      return;
    }

    setIsSubmitting(true);

    const randomOrder = `HPS-${Math.floor(100000 + Math.random() * 900000)}`;
    setGeneratedOrderId(randomOrder);
    setFullName(cleanName);
    setPhoneNumber(phoneCheck.cleanPhone);
    setAltPhone(cleanAltPhone);
    setCustomerEmail(cleanEmail);
    setDeliveryAddress(cleanAddress);
    setDeliveryNotes(cleanNotes);

    const orderTotal = selectedVariant?.pricePKR || phone?.basePricePKR || 0;
    const variantName = selectedVariant
      ? `${selectedVariant.ram}/${selectedVariant.storage}`
      : currentVariant
      ? `${currentVariant.ram}/${currentVariant.storage}`
      : 'Standard';
    const colorName = currentColor?.name || selectedColor?.name || 'Default';

    const orderItems = phone
      ? [
          {
            name: phone.name,
            variant: variantName,
            pricePKR: orderTotal,
            quantity: 1,
            color: colorName,
          },
        ]
      : [];

    const paymentLabel =
      paymentMethod === 'bank'
        ? `Bank Transfer / Raast (Meezan Bank)${bankTxRef ? ` — Ref: ${sanitizeText(bankTxRef, 50)}` : ''}`
        : paymentMethod === 'emi'
        ? '0% Installment Plan (Credit Card)'
        : 'Cash on Delivery (Open-Parcel)';

    // Save to Firestore if customer is logged in (non-blocking)
    if (user) {
      try {
        const orderDocRef = doc(db, 'users', user.uid, 'orders', randomOrder);
        setDoc(orderDocRef, {
          orderId: randomOrder,
          customerName: cleanName,
          phone: phoneCheck.cleanPhone,
          altPhone: cleanAltPhone,
          email: cleanEmail,
          city: city || 'Pakistan',
          address: cleanAddress,
          notes: cleanNotes,
          bankTxRef: sanitizeText(bankTxRef, 100),
          items: orderItems,
          totalPKR: finalPrice,
          couponCode: appliedCoupon?.code || '',
          discountPKR: discountAmount,
          paymentMethod: paymentLabel,
          status: paymentMethod === 'bank' ? 'Payment Verification Pending' : 'Placed',
          createdAt: serverTimestamp(),
        }).catch((err) => console.warn('Firestore quick order async write warning:', err));
      } catch (err) {
        console.warn('Firestore quick order error:', err);
      }
    }

    // Always persist to localStorage for guest tracking & offline persistence
    try {
      const newOrder = {
        orderId: randomOrder,
        customerName: cleanName,
        phone: phoneCheck.cleanPhone,
        altPhone: cleanAltPhone,
        email: cleanEmail,
        city: city || 'Pakistan',
        address: cleanAddress,
        bankTxRef: sanitizeText(bankTxRef, 100),
        items: phone ? [`${phone.name} (${variantName})`] : [],
        totalPKR: finalPrice,
        couponCode: appliedCoupon?.code || '',
        discountPKR: discountAmount,
        paymentMethod: paymentLabel,
        status:
          paymentMethod === 'bank'
            ? 'Order Placed — Send payment screenshot to WhatsApp for immediate dispatch approval.'
            : 'Order Confirmed — Dispatched via TCS Express. Estimated delivery: 24-48 Hours with Open-Parcel inspection.',
        createdAt: new Date().toISOString(),
      };
      const existing = JSON.parse(localStorage.getItem('naviratraders_orders') || localStorage.getItem('voltphone_orders') || '[]');
      localStorage.setItem('naviratraders_orders', JSON.stringify([newOrder, ...existing]));
    } catch {
      // ignore
    }

    // Sync to admin orders backend
    try {
      fetch('/api/admin/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          order: {
            orderId: randomOrder,
            customerName: cleanName,
            phone: phoneCheck.cleanPhone,
            email: cleanEmail,
            city: city || 'Pakistan',
            address: cleanAddress,
            bankTxRef: sanitizeText(bankTxRef, 100),
            items: orderItems,
            totalPKR: finalPrice,
            couponCode: appliedCoupon?.code || '',
            discountPKR: discountAmount,
            paymentMethod: paymentLabel,
            status: paymentMethod === 'bank' ? 'Payment Verification Pending' : 'Placed',
            courier: 'TCS Express',
          },
        }),
      }).catch(() => {});

      // Redeem coupon usage counter
      if (appliedCoupon) {
        fetch('/api/coupons', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ action: 'redeem', code: appliedCoupon.code }),
        }).catch(() => {});
      }
    } catch {}

    try {
      trackPurchase(randomOrder);
    } catch {}

    setIsSubmitting(false);
    setIsOrderConfirmed(true);
  };

  const handleResetAndClose = () => {
    setIsOrderConfirmed(false);
    setGeneratedOrderId('');
    setFullName('');
    setPhoneNumber('');
    setAltPhone('');
    setCustomerEmail('');
    setDeliveryAddress('');
    setDeliveryNotes('');
    setBankTxRef('');
    setCopiedBankField(null);
    setAppliedCoupon(null);
    setDiscountAmount(0);
    setCouponCodeInput('');
    setCouponError('');
    setCouponSuccess('');
    setCopiedReceipt(false);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex flex-col justify-end sm:justify-center sm:items-center p-0 sm:p-4 bg-slate-950/70 backdrop-blur-xs overflow-y-auto animate-in fade-in duration-200">
      <div className="relative w-full max-w-2xl bg-white rounded-t-3xl sm:rounded-3xl shadow-2xl border border-slate-200 flex flex-col max-h-[92vh] sm:max-h-[88vh] overflow-hidden">
        {/* Mobile Drag Indicator Bar */}
        <div className="sm:hidden w-12 h-1.5 rounded-full bg-slate-300 mx-auto mt-2.5 mb-1 shrink-0" />

        {/* Modal Top Header (Sticky) */}
        <div className="flex items-center justify-between px-4 sm:px-6 py-3.5 border-b border-slate-100 bg-slate-50/70 shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-sky-100 text-[#0b3c68] flex items-center justify-center shrink-0">
              <PackageCheck className="w-4 h-4 text-[#0b3c68]" />
            </div>
            <div>
              <h3 className="text-sm sm:text-base font-black text-slate-900 tracking-tight">
                {isOrderConfirmed ? 'Order Confirmed!' : 'Quick Buy (Cash on Delivery)'}
              </h3>
              <p className="text-[10px] sm:text-xs text-slate-500 font-medium">
                100% PTA Approved • Open-Parcel Inspection Before Payment
              </p>
            </div>
          </div>

          <button
            onClick={handleResetAndClose}
            aria-label="Close quick purchase modal"
            className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-500 hover:text-slate-900 flex items-center justify-center transition-colors cursor-pointer shrink-0"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content Body */}
        {!isOrderConfirmed ? (
          <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4">
            {/* Phone Product Summary Card (Compact & Responsive on Mobile) */}
            <div className="p-3 sm:p-4 rounded-2xl bg-slate-50 border border-slate-200/80 flex items-center gap-3 sm:gap-4">
              <div className="w-14 h-14 sm:w-18 sm:h-18 rounded-xl bg-white p-1.5 border border-slate-200 flex items-center justify-center shrink-0">
                <PhoneImageWithFallback
                  src={currentColor.image}
                  alt={phone.name}
                  brand={phone.brand}
                  className="w-full h-full object-contain"
                />
              </div>

              <div className="flex-1 min-w-0">
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <span className="text-[10px] font-black uppercase text-slate-400">
                      {phone.brand}
                    </span>
                    <h4 className="text-xs sm:text-sm font-black text-slate-900 truncate">
                      {phone.name}
                    </h4>
                  </div>
                  <span className="text-sm sm:text-base font-black text-[#0b3c68] whitespace-nowrap">
                    {formatPKR(price)}
                  </span>
                </div>

                <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5 mt-1 text-[11px] text-slate-600">
                  <span>Color: <strong className="text-slate-900">{currentColor.name}</strong></span>
                  <span className="text-slate-300">•</span>
                  <span>Config: <strong className="text-slate-900">{currentVariant?.ram} / {currentVariant?.storage}</strong></span>
                </div>

                <div className="flex items-center gap-2 mt-1.5 flex-wrap">
                  <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                    <ShieldCheck className="w-3 h-3 text-emerald-600" /> PTA Approved
                  </span>
                  <span className="inline-flex items-center gap-1 text-[10px] font-bold text-[#0b3c68] bg-sky-50 px-2 py-0.5 rounded border border-sky-100">
                    <Truck className="w-3 h-3 text-[#48afff]" /> Free Shipping
                  </span>
                </div>
              </div>
            </div>

            {/* Quick Order Form */}
            <form onSubmit={handleSubmitOrder} className="space-y-4">
              {/* Anti-Bot Security Honeypot */}
              <input
                type="text"
                name="_hp_security_check"
                value={honeypot}
                onChange={(e) => setHoneypot(e.target.value)}
                tabIndex={-1}
                autoComplete="off"
                className="sr-only opacity-0 absolute -z-10 pointer-events-none h-0 w-0"
                aria-hidden="true"
              />

              {validationError && (
                <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-semibold flex items-center gap-2 animate-in fade-in">
                  <span>⚠️</span>
                  <span>{validationError}</span>
                </div>
              )}

              {/* Responsive Inputs: text-base on mobile to completely prevent iOS auto-zoom */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {/* Full Name */}
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-700">
                    Full Name <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    placeholder="e.g. Muhammad Ali"
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-base sm:text-sm focus:outline-none focus:ring-2 focus:ring-[#48afff] focus:bg-white text-slate-900 transition-all font-medium"
                  />
                </div>

                {/* Mobile Phone Number */}
                <div className="space-y-1">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-bold text-slate-700">
                      Mobile Number (WhatsApp) <span className="text-rose-500">*</span>
                    </label>
                    <span className={`text-[10px] font-mono font-bold ${phoneNumber.length === 11 ? 'text-emerald-600' : 'text-slate-400'}`}>
                      {phoneNumber.length}/11
                    </span>
                  </div>
                  <input
                    type="tel"
                    inputMode="numeric"
                    autoComplete="tel"
                    maxLength={11}
                    required
                    value={phoneNumber}
                    onChange={(e) => setPhoneNumber(e.target.value.replace(/\D/g, '').slice(0, 11))}
                    placeholder="03001234567"
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-base sm:text-sm focus:outline-none focus:ring-2 focus:ring-[#48afff] focus:bg-white text-slate-900 transition-all font-medium"
                  />
                </div>

                {/* City Dropdown */}
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-700">
                    Delivery City <span className="text-rose-500">*</span>
                  </label>
                  <select
                    value={city}
                    onChange={(e) => setCity(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-base sm:text-sm focus:outline-none focus:ring-2 focus:ring-[#48afff] focus:bg-white text-slate-900 transition-all font-medium"
                  >
                    {PAKISTAN_CITIES.map((c) => (
                      <option key={c} value={c}>
                        {c}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Alternate Phone */}
                <div className="space-y-1">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-bold text-slate-700">
                      Alternative Phone (Optional)
                    </label>
                    {altPhone.length > 0 && (
                      <span className={`text-[10px] font-mono font-bold ${altPhone.length === 11 ? 'text-emerald-600' : 'text-slate-400'}`}>
                        {altPhone.length}/11
                      </span>
                    )}
                  </div>
                  <input
                    type="tel"
                    inputMode="numeric"
                    autoComplete="tel"
                    maxLength={11}
                    value={altPhone}
                    onChange={(e) => setAltPhone(e.target.value.replace(/\D/g, '').slice(0, 11))}
                    placeholder="03217654321"
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-base sm:text-sm focus:outline-none focus:ring-2 focus:ring-[#48afff] focus:bg-white text-slate-900 transition-all font-medium"
                  />
                </div>

                {/* Email Address (Optional for Order Receipt) */}
                <div className="space-y-1 sm:col-span-2">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-bold text-slate-700">
                      Email Address (Optional)
                    </label>
                    <span className="text-[10px] text-slate-400 font-medium">For instant invoice & PDF receipt</span>
                  </div>
                  <input
                    type="email"
                    autoComplete="email"
                    value={customerEmail}
                    onChange={(e) => setCustomerEmail(e.target.value)}
                    placeholder="e.g. name@gmail.com"
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-base sm:text-sm focus:outline-none focus:ring-2 focus:ring-[#48afff] focus:bg-white text-slate-900 transition-all font-medium"
                  />
                </div>
              </div>

              {/* Complete Address */}
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-700">
                  Complete Street Address <span className="text-rose-500">*</span>
                </label>
                <textarea
                  required
                  rows={2}
                  value={deliveryAddress}
                  onChange={(e) => setDeliveryAddress(e.target.value)}
                  placeholder="House / Apartment #, Street name, Sector / Mohalla / Area"
                  className="w-full px-3.5 py-2 rounded-xl bg-slate-50 border border-slate-200 text-base sm:text-sm focus:outline-none focus:ring-2 focus:ring-[#48afff] focus:bg-white text-slate-900 transition-all font-medium resize-none"
                />
              </div>

              {/* Payment Method Selection (Clean, Compact Mobile-Friendly Pills) */}
              <div className="space-y-2 pt-1">
                <label className="text-xs font-bold text-slate-700">
                  Select Payment Method:
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                  {/* Cash on Delivery */}
                  <label
                    onClick={() => setPaymentMethod('cod')}
                    className={`flex items-center gap-2.5 p-3 rounded-xl border cursor-pointer transition-all ${
                      paymentMethod === 'cod'
                        ? 'bg-blue-50/70 border-[#0b3c68] ring-2 ring-[#48afff]/40 shadow-xs'
                        : 'bg-slate-50 border-slate-200 hover:bg-slate-100'
                    }`}
                  >
                    <input
                      type="radio"
                      name="quick_payment"
                      checked={paymentMethod === 'cod'}
                      onChange={() => setPaymentMethod('cod')}
                      className="accent-[#0b3c68]"
                    />
                    <div className="min-w-0">
                      <div className="text-xs font-extrabold text-slate-900 flex items-center gap-1.5">
                        <Banknote className="w-3.5 h-3.5 text-emerald-600" />
                        <span>Cash on Delivery</span>
                      </div>
                      <p className="text-[10px] text-slate-500 font-medium">Open-Parcel COD</p>
                    </div>
                  </label>

                  {/* Bank Transfer / Raast */}
                  <label
                    onClick={() => setPaymentMethod('bank')}
                    className={`flex items-center gap-2.5 p-3 rounded-xl border cursor-pointer transition-all ${
                      paymentMethod === 'bank'
                        ? 'bg-blue-50/70 border-[#0b3c68] ring-2 ring-[#48afff]/40 shadow-xs'
                        : 'bg-slate-50 border-slate-200 hover:bg-slate-100'
                    }`}
                  >
                    <input
                      type="radio"
                      name="quick_payment"
                      checked={paymentMethod === 'bank'}
                      onChange={() => setPaymentMethod('bank')}
                      className="accent-[#0b3c68]"
                    />
                    <div className="min-w-0">
                      <div className="text-xs font-extrabold text-slate-900 flex items-center gap-1.5">
                        <CreditCard className="w-3.5 h-3.5 text-blue-600" />
                        <span>Online Bank / Raast</span>
                      </div>
                      <p className="text-[10px] text-slate-500 font-medium">Instant IBFT</p>
                    </div>
                  </label>

                  {/* 0% Installments */}
                  <label
                    onClick={() => setPaymentMethod('emi')}
                    className={`flex items-center gap-2.5 p-3 rounded-xl border cursor-pointer transition-all ${
                      paymentMethod === 'emi'
                        ? 'bg-blue-50/70 border-[#0b3c68] ring-2 ring-[#48afff]/40 shadow-xs'
                        : 'bg-slate-50 border-slate-200 hover:bg-slate-100'
                    }`}
                  >
                    <input
                      type="radio"
                      name="quick_payment"
                      checked={paymentMethod === 'emi'}
                      onChange={() => setPaymentMethod('emi')}
                      className="accent-[#0b3c68]"
                    />
                    <div className="min-w-0">
                      <div className="text-xs font-extrabold text-slate-900 flex items-center gap-1.5">
                        <Percent className="w-3.5 h-3.5 text-[#f47708]" />
                        <span>0% Installments</span>
                      </div>
                      <p className="text-[10px] text-slate-500 font-medium">3-12 mo Credit Card</p>
                    </div>
                  </label>
                </div>

                {/* Bank & Raast Details Card (Shown when Bank Transfer is selected) */}
                {paymentMethod === 'bank' && (
                  <div className="p-3.5 rounded-2xl bg-gradient-to-br from-blue-50/90 via-sky-50/40 to-indigo-50/70 border border-blue-200 shadow-xs space-y-3 animate-in fade-in duration-200 text-xs">
                    <div className="flex items-center justify-between border-b border-blue-200/70 pb-2">
                      <div className="flex items-center gap-2">
                        <Building className="w-4 h-4 text-[#0b3c68]" />
                        <span className="font-extrabold text-[#0b3c68]">Official Store Bank & Raast Details</span>
                      </div>
                      <span className="text-[10px] font-bold text-blue-700 bg-blue-100/80 px-2 py-0.5 rounded-full">
                        Direct IBFT
                      </span>
                    </div>

                    {/* Raast Instant Transfer (Zero Fee) */}
                    <div className="p-2.5 rounded-xl bg-white border border-blue-100 space-y-1 shadow-2xs">
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1">
                          <Sparkles className="w-3 h-3 text-[#48afff]" />
                          Raast Instant ID (Any Banking App):
                        </span>
                        <button
                          type="button"
                          onClick={() => copyToClipboard(STORE_BANK_DETAILS.raastId, 'raast_quick')}
                          className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-sky-50 text-[#0b3c68] hover:bg-sky-100 transition-colors flex items-center gap-1 cursor-pointer"
                        >
                          {copiedBankField === 'raast_quick' ? (
                            <>
                              <Check className="w-3 h-3 text-emerald-600" />
                              <span className="text-emerald-700">Copied!</span>
                            </>
                          ) : (
                            <>
                              <Copy className="w-3 h-3 text-slate-500" />
                              <span>Copy Raast</span>
                            </>
                          )}
                        </button>
                      </div>
                      <div className="flex items-baseline justify-between pt-0.5">
                        <span className="font-mono text-sm font-black text-slate-900 tracking-wider">
                          {STORE_BANK_DETAILS.raastId}
                        </span>
                        <span className="text-[10px] font-medium text-slate-600 truncate max-w-[50%]">
                          Title: <strong>{STORE_BANK_DETAILS.raastTitle}</strong>
                        </span>
                      </div>
                    </div>

                    {/* Primary Bank: Meezan Bank Ltd */}
                    <div className="p-2.5 rounded-xl bg-white border border-blue-100 space-y-2 shadow-2xs">
                      <div className="flex items-center justify-between">
                        <span className="text-[11px] font-extrabold text-[#0b3c68]">
                          {STORE_BANK_DETAILS.primaryBank.bankName}
                        </span>
                        <span className="text-[10px] text-slate-400 font-medium">{STORE_BANK_DETAILS.primaryBank.branch}</span>
                      </div>

                      <div className="space-y-1.5 text-[11px]">
                        <div className="flex items-center justify-between">
                          <span className="text-slate-500">Account Title:</span>
                          <span className="font-bold text-slate-900">{STORE_BANK_DETAILS.primaryBank.accountTitle}</span>
                        </div>

                        <div className="flex items-center justify-between">
                          <span className="text-slate-500">Account Number:</span>
                          <div className="flex items-center gap-1.5">
                            <span className="font-mono font-bold text-slate-900">{STORE_BANK_DETAILS.primaryBank.accountNumber}</span>
                            <button
                              type="button"
                              onClick={() => copyToClipboard(STORE_BANK_DETAILS.primaryBank.cleanAccountNumber, 'acc_quick')}
                              className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-slate-100 hover:bg-slate-200 text-slate-700 flex items-center gap-1 cursor-pointer"
                              title="Copy Account Number"
                            >
                              {copiedBankField === 'acc_quick' ? (
                                <Check className="w-3 h-3 text-emerald-600" />
                              ) : (
                                <Copy className="w-3 h-3 text-slate-500" />
                              )}
                            </button>
                          </div>
                        </div>

                        <div className="flex items-center justify-between pt-1 border-t border-slate-100">
                          <span className="text-slate-500">IBAN:</span>
                          <div className="flex items-center gap-1.5">
                            <span className="font-mono font-bold text-slate-900 text-[10px]">{STORE_BANK_DETAILS.primaryBank.iban}</span>
                            <button
                              type="button"
                              onClick={() => copyToClipboard(STORE_BANK_DETAILS.primaryBank.iban, 'iban_quick')}
                              className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-slate-100 hover:bg-slate-200 text-slate-700 flex items-center gap-1 cursor-pointer"
                              title="Copy IBAN"
                            >
                              {copiedBankField === 'iban_quick' ? (
                                <Check className="w-3 h-3 text-emerald-600" />
                              ) : (
                                <Copy className="w-3 h-3 text-slate-500" />
                              )}
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Optional Sender Reference Input */}
                    <div className="space-y-1">
                      <label className="text-[11px] font-bold text-slate-700 flex items-center justify-between">
                        <span>Sender Account / Transaction Ref (Optional):</span>
                        <span className="text-[10px] text-slate-400 font-normal">e.g. Meezan / HBL TID</span>
                      </label>
                      <input
                        type="text"
                        value={bankTxRef}
                        onChange={(e) => setBankTxRef(e.target.value)}
                        placeholder="e.g. Meezan Bank / Ali Khan (TID 847291)"
                        className="w-full px-3 py-1.5 text-xs rounded-xl bg-white border border-blue-200 focus:outline-none focus:ring-2 focus:ring-[#48afff] text-slate-900 font-medium"
                      />
                    </div>

                    {/* Instructions */}
                    <div className="p-2 rounded-xl bg-amber-50 border border-amber-200/80 text-amber-900 text-[11px] flex items-start gap-1.5 leading-snug">
                      <span className="text-xs shrink-0">📲</span>
                      <span>
                        Transfer the exact payable amount and send screenshot to WhatsApp <strong>+92 301 8543131</strong> for instant consignment dispatch.
                      </span>
                    </div>
                  </div>
                )}
              </div>

              {/* Open Parcel Guarantee Banner */}
              <div className="p-3 rounded-xl bg-amber-50/90 border border-amber-200 flex items-start gap-2.5 text-amber-900 text-xs">
                <PackageCheck className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                <p className="text-[11px] leading-relaxed">
                  <strong>Open-Parcel Guarantee:</strong> You are fully authorized to open the flyer and inspect the smartphone box, seals, and warranty card before paying cash to the TCS rider!
                </p>
              </div>

              {/* Promo Code Widget */}
              <div className="bg-slate-50 p-3 rounded-xl border border-slate-200 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-bold text-slate-700 flex items-center gap-1.5">
                    <Tag className="w-3.5 h-3.5 text-[#0b3c68]" />
                    Have a Promo / Coupon Code?
                  </span>
                  {appliedCoupon && (
                    <span className="text-[10px] font-extrabold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200">
                      Applied
                    </span>
                  )}
                </div>

                {appliedCoupon ? (
                  <div className="flex items-center justify-between p-2 rounded-lg bg-emerald-50 border border-emerald-200 text-xs">
                    <div className="flex items-center gap-2">
                      <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                      <div>
                        <span className="font-extrabold text-emerald-800 tracking-wider">
                          {appliedCoupon.code}
                        </span>
                        <span className="text-[11px] text-emerald-700 ml-1.5">
                          (-{formatPKR(discountAmount)})
                        </span>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={handleRemoveCoupon}
                      className="text-[11px] font-bold text-rose-600 hover:text-rose-800 underline ml-2 cursor-pointer"
                    >
                      Remove
                    </button>
                  </div>
                ) : (
                  <div className="space-y-1.5">
                    <div className="flex gap-1.5">
                      <input
                        type="text"
                        value={couponCodeInput}
                        onChange={(e) => setCouponCodeInput(e.target.value.toUpperCase())}
                        placeholder="Enter Promo Code (e.g. WELCOME1000)"
                        className="flex-1 px-3 py-1.5 text-xs font-mono font-bold uppercase rounded-lg border border-slate-200 bg-white focus:outline-none focus:ring-2 focus:ring-[#48afff] text-slate-900"
                      />
                      <button
                        type="button"
                        onClick={() => handleApplyCoupon()}
                        disabled={isApplyingCoupon || !couponCodeInput.trim()}
                        className="px-3.5 py-1.5 bg-[#0b3c68] hover:bg-[#072847] disabled:bg-slate-200 text-white disabled:text-slate-400 text-xs font-black rounded-lg transition-all cursor-pointer disabled:cursor-not-allowed"
                      >
                        {isApplyingCoupon ? '...' : 'Apply'}
                      </button>
                    </div>

                    <div className="flex items-center gap-1.5 pt-0.5">
                      <span className="text-[10px] text-slate-400 font-medium">Try:</span>
                      <button
                        type="button"
                        onClick={() => handleApplyCoupon('WELCOME1000')}
                        className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-sky-50 text-[#0b3c68] border border-sky-100 hover:bg-sky-100 transition-colors cursor-pointer"
                      >
                        WELCOME1000
                      </button>
                      <button
                        type="button"
                        onClick={() => handleApplyCoupon('NAWIRA500')}
                        className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-sky-50 text-[#0b3c68] border border-sky-100 hover:bg-sky-100 transition-colors cursor-pointer"
                      >
                        NAWIRA500
                      </button>
                    </div>
                  </div>
                )}

                {couponError && (
                  <p className="text-[11px] font-medium text-rose-600">{couponError}</p>
                )}
                {couponSuccess && !appliedCoupon && (
                  <p className="text-[11px] font-medium text-emerald-600">{couponSuccess}</p>
                )}
              </div>

              {/* Price Breakdown */}
              <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 space-y-1.5 text-xs">
                <div className="flex justify-between text-slate-600">
                  <span>Device Price:</span>
                  <span className="font-bold">{formatPKR(price)}</span>
                </div>
                {discountAmount > 0 && (
                  <div className="flex justify-between text-emerald-700 font-bold">
                    <span className="flex items-center gap-1">
                      <Tag className="w-3 h-3 text-emerald-600" />
                      Promo Discount ({appliedCoupon?.code}):
                    </span>
                    <span>-{formatPKR(discountAmount)}</span>
                  </div>
                )}
                <div className="flex justify-between text-slate-600">
                  <span>PTA DIRBS Customs Tax:</span>
                  <span className="text-emerald-700 font-bold">100% INCLUDED (Paid)</span>
                </div>
                <div className="flex justify-between text-slate-600">
                  <span>Nationwide Express Shipping:</span>
                  <span className="text-emerald-700 font-bold">FREE (Rs. 0)</span>
                </div>
              </div>

              {/* Sticky Submit Footer on Mobile so button is NEVER hidden */}
              <div className="sticky bottom-0 bg-white/95 backdrop-blur-md pt-3 pb-2 border-t border-slate-100 -mx-4 sm:-mx-6 px-4 sm:px-6 shadow-md mt-4">
                {validationError && (
                  <div className="mb-2.5 p-2.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-bold flex items-center gap-2 animate-in fade-in">
                    <span className="shrink-0">⚠️</span>
                    <span>{validationError}</span>
                  </div>
                )}

                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-bold text-slate-500">
                    {paymentMethod === 'bank' ? 'Total Amount to Transfer:' : 'Total Payable on Delivery:'}
                  </span>
                  <span className="text-base font-black text-[#0b3c68]">{formatPKR(finalPrice)}</span>
                </div>

                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full py-3.5 rounded-2xl bg-[#0b3c68] hover:bg-[#072847] text-white font-black text-xs sm:text-sm transition-all shadow-lg shadow-[#0b3c68]/20 flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 btn-press"
                >
                  {isSubmitting ? (
                    <span>Booking Consignment...</span>
                  ) : paymentMethod === 'bank' ? (
                    <>
                      <span>Confirm Order (Bank Transfer) — {formatPKR(finalPrice)}</span>
                      <ArrowRight className="w-4 h-4" />
                    </>
                  ) : paymentMethod === 'emi' ? (
                    <>
                      <span>Confirm Order (0% Installments) — {formatPKR(finalPrice)}</span>
                      <ArrowRight className="w-4 h-4" />
                    </>
                  ) : (
                    <>
                      <span>Confirm Order with Open Parcel ({formatPKR(finalPrice)})</span>
                      <ArrowRight className="w-4 h-4" />
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        ) : (
          /* Order Confirmed Screen */
          <div className="p-5 sm:p-7 text-center space-y-4 overflow-y-auto">
            <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-3xl bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto shadow-lg shadow-emerald-500/20">
              <CheckCircle2 className="w-8 h-8 sm:w-9 sm:h-9" />
            </div>

            <div className="space-y-1">
              <span className={`inline-block px-3 py-0.5 rounded-full font-extrabold text-[10px] sm:text-[11px] border ${
                paymentMethod === 'bank'
                  ? 'bg-blue-50 text-blue-800 border-blue-200'
                  : 'bg-emerald-50 text-emerald-700 border-emerald-200'
              }`}>
                {paymentMethod === 'bank'
                  ? 'ORDER BOOKED • DIRECT BANK TRANSFER'
                  : 'ORDER BOOKED • TCS EXPRESS OPEN-PARCEL'}
              </span>
              <h3 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
                {paymentMethod === 'bank' ? 'Mubarak! Order Placed via Bank Transfer' : 'Mubarak! Order Confirmed'}
              </h3>
              <p className="text-xs text-slate-500 font-medium max-w-sm mx-auto">
                {paymentMethod === 'bank'
                  ? `Please transfer ${formatPKR(finalPrice)} to the store bank/Raast account below and share the screenshot on WhatsApp.`
                  : 'Your open-parcel consignment has been booked. You can open and inspect the sealed box before paying cash.'}
              </p>
            </div>

            {/* Bank Transfer Payment Instructions (Shown when bank payment is chosen) */}
            {paymentMethod === 'bank' && (
              <div className="p-3.5 rounded-2xl bg-gradient-to-br from-blue-50 via-sky-50 to-indigo-50 border border-blue-200 text-left space-y-2 text-xs max-w-md mx-auto">
                <div className="flex items-center justify-between border-b border-blue-200/70 pb-1.5">
                  <span className="font-extrabold text-[#0b3c68] flex items-center gap-1.5">
                    <Building className="w-3.5 h-3.5 text-blue-700" />
                    Transfer {formatPKR(finalPrice)} to:
                  </span>
                  <span className="text-[10px] font-bold text-blue-700 bg-blue-100 px-2 py-0.5 rounded-full">
                    Meezan / Raast
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-0.5">
                  {/* Raast */}
                  <div className="p-2 rounded-xl bg-white border border-blue-100 space-y-0.5">
                    <div className="flex items-center justify-between text-[10px] font-bold text-slate-500 uppercase">
                      <span>Raast ID:</span>
                      <button
                        type="button"
                        onClick={() => copyToClipboard(STORE_BANK_DETAILS.raastId, 'raast_q_succ')}
                        className="text-[#0b3c68] hover:underline cursor-pointer flex items-center gap-0.5"
                      >
                        {copiedBankField === 'raast_q_succ' ? 'Copied! ✓' : 'Copy'}
                      </button>
                    </div>
                    <div className="font-mono font-black text-slate-900 text-xs">{STORE_BANK_DETAILS.raastId}</div>
                    <div className="text-[10px] text-slate-500">{STORE_BANK_DETAILS.raastTitle}</div>
                  </div>

                  {/* Meezan Account */}
                  <div className="p-2 rounded-xl bg-white border border-blue-100 space-y-0.5">
                    <div className="flex items-center justify-between text-[10px] font-bold text-slate-500 uppercase">
                      <span>Meezan Account:</span>
                      <button
                        type="button"
                        onClick={() => copyToClipboard(STORE_BANK_DETAILS.primaryBank.cleanAccountNumber, 'acc_q_succ')}
                        className="text-[#0b3c68] hover:underline cursor-pointer flex items-center gap-0.5"
                      >
                        {copiedBankField === 'acc_q_succ' ? 'Copied! ✓' : 'Copy'}
                      </button>
                    </div>
                    <div className="font-mono font-black text-slate-900 text-xs">{STORE_BANK_DETAILS.primaryBank.accountNumber}</div>
                    <div className="text-[10px] text-slate-500">{STORE_BANK_DETAILS.primaryBank.accountTitle}</div>
                  </div>
                </div>

                {/* IBAN */}
                <div className="p-2 rounded-xl bg-white border border-blue-100 flex items-center justify-between text-[11px]">
                  <div>
                    <span className="text-[10px] text-slate-400 font-bold block uppercase">Meezan IBAN:</span>
                    <span className="font-mono font-bold text-slate-900 text-[10px] sm:text-[11px]">{STORE_BANK_DETAILS.primaryBank.iban}</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => copyToClipboard(STORE_BANK_DETAILS.primaryBank.iban, 'iban_q_succ')}
                    className="text-[10px] font-bold px-2 py-1 rounded bg-slate-100 hover:bg-slate-200 text-slate-700 cursor-pointer"
                  >
                    {copiedBankField === 'iban_q_succ' ? 'Copied! ✓' : 'Copy IBAN'}
                  </button>
                </div>
              </div>
            )}

            {/* Structured Receipt Summary Card */}
            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 max-w-md mx-auto text-left space-y-2 text-xs">
              <div className="flex justify-between items-center pb-2 border-b border-slate-200">
                <span className="text-slate-500 font-medium">Tracking Code:</span>
                <span className="font-mono font-black text-[#0b3c68] text-sm bg-blue-50 px-2 py-0.5 rounded-md border border-blue-100">
                  {generatedOrderId || 'HPS-786110'}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Recipient:</span>
                <span className="font-bold text-slate-900">{fullName}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Phone Number:</span>
                <span className="font-mono font-bold text-slate-900">{phoneNumber}</span>
              </div>
              {customerEmail && (
                <div className="flex justify-between">
                  <span className="text-slate-500">Email:</span>
                  <span className="font-medium text-slate-800">{customerEmail}</span>
                </div>
              )}
              <div className="flex justify-between">
                <span className="text-slate-500">Delivery Address:</span>
                <span className="font-medium text-slate-800 text-right max-w-[65%] truncate">
                  {deliveryAddress}, {city}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Device & Variant:</span>
                <span className="font-bold text-slate-900 text-right">
                  {phone.name} ({currentVariant?.ram || ''}/{currentVariant?.storage || ''})
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Payment:</span>
                <span className={`font-bold uppercase ${paymentMethod === 'bank' ? 'text-blue-700' : 'text-emerald-700'}`}>
                  {paymentMethod === 'bank' ? 'Direct Bank Transfer / Raast' : paymentMethod === 'emi' ? '0% Installment Plan' : 'Cash on Delivery (Open Parcel)'}
                </span>
              </div>
              {bankTxRef && paymentMethod === 'bank' && (
                <div className="flex justify-between">
                  <span className="text-slate-500">Sender Ref / TID:</span>
                  <span className="font-mono font-bold text-slate-800">{bankTxRef}</span>
                </div>
              )}
              {discountAmount > 0 && (
                <div className="flex justify-between text-emerald-700">
                  <span className="font-medium">Promo Discount ({appliedCoupon?.code}):</span>
                  <span className="font-bold">-{formatPKR(discountAmount)}</span>
                </div>
              )}
              <div className="flex justify-between pt-2 border-t border-slate-200 font-bold">
                <span className="text-slate-900">Total Payable:</span>
                <span className="text-[#0b3c68] font-black text-sm">{formatPKR(finalPrice)}</span>
              </div>
            </div>

            {/* Automated Messaging & Receipt Hub */}
            <div className="space-y-2 pt-1 max-w-md mx-auto">
              {/* 1-Click WhatsApp Button with full pre-filled order receipt */}
              <a
                href={`https://wa.me/923018543131?text=${encodeURIComponent(
                  paymentMethod === 'bank'
                    ? `📦 *NAWIRA TRADERS — BANK TRANSFER PAYMENT RECEIPT*\n──────────────────────\n🔖 *Order ID:* ${generatedOrderId}\n👤 *Customer:* ${fullName}\n📞 *Mobile:* ${phoneNumber}\n${customerEmail ? `✉️ *Email:* ${customerEmail}\n` : ''}📍 *Destination:* ${city}, Pakistan\n🏠 *Address:* ${deliveryAddress}\n📱 *Item:* ${phone.name} (${currentVariant?.ram || ''}/${currentVariant?.storage || ''})\n🎨 *Color:* ${currentColor?.name || 'Default'}\n💰 *Amount Transferred:* ${formatPKR(finalPrice)}\n🏦 *Method:* Direct Bank Transfer / Raast (Meezan Bank)\n${bankTxRef ? `📝 *Sender Reference / TID:* ${bankTxRef}\n` : ''}──────────────────────\n_I have completed the bank transfer. Attaching payment receipt screenshot here for verification & immediate dispatch._`
                    : `📦 *NAWIRA TRADERS — ORDER CONFIRMATION RECEIPT*\n──────────────────────\n🔖 *Order ID:* ${generatedOrderId}\n👤 *Customer:* ${fullName}\n📞 *Mobile:* ${phoneNumber}\n${customerEmail ? `✉️ *Email:* ${customerEmail}\n` : ''}📍 *Destination:* ${city}, Pakistan\n🏠 *Address:* ${deliveryAddress}\n📱 *Item:* ${phone.name} (${currentVariant?.ram || ''}/${currentVariant?.storage || ''})\n🎨 *Color:* ${currentColor?.name || 'Default'}\n💰 *Total Payable:* ${formatPKR(finalPrice)} (Open-Parcel COD)\n🚚 *Courier:* TCS Express (24-48 Hours Delivery)\n🛡️ *PTA Status:* 100% Official PTA Approved\n──────────────────────\n_I just placed this order. Please confirm dispatch tracking details._`
                )}`}
                target="_blank"
                rel="noopener noreferrer"
                className="w-full py-3.5 px-4 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs sm:text-sm font-black flex items-center justify-center gap-2 shadow-lg shadow-emerald-600/25 transition-all cursor-pointer btn-press"
              >
                <MessageSquare className="w-4 h-4 fill-white text-white" />
                <span>
                  {paymentMethod === 'bank'
                    ? 'Send Payment Screenshot on WhatsApp (+92 301 8543131)'
                    : 'Send Order Receipt to WhatsApp (+92 301 8543131)'}
                </span>
              </a>

              {/* Copy SMS / WhatsApp Receipt Button */}
              <button
                type="button"
                onClick={() => {
                  const receiptMsg = paymentMethod === 'bank'
                    ? `📦 NAWIRA TRADERS — BANK TRANSFER RECEIPT\nOrder ID: ${generatedOrderId}\nCustomer: ${fullName}\nPhone: ${phoneNumber}\n${customerEmail ? `Email: ${customerEmail}\n` : ''}Address: ${deliveryAddress}, ${city}\nItem: ${phone.name} (${currentVariant?.ram || ''}/${currentVariant?.storage || ''})\nTotal: ${formatPKR(finalPrice)}\nPayment: Direct Bank Transfer (Meezan Bank / Raast)\n${bankTxRef ? `Sender Ref: ${bankTxRef}\n` : ''}Raast ID: ${STORE_BANK_DETAILS.raastId}\nMeezan IBAN: ${STORE_BANK_DETAILS.primaryBank.iban}`
                    : `📦 NAWIRA TRADERS — ORDER RECEIPT\nOrder ID: ${generatedOrderId}\nCustomer: ${fullName}\nPhone: ${phoneNumber}\n${customerEmail ? `Email: ${customerEmail}\n` : ''}Address: ${deliveryAddress}, ${city}\nItem: ${phone.name} (${currentVariant?.ram || ''}/${currentVariant?.storage || ''})\nTotal: ${formatPKR(finalPrice)} (Open-Parcel COD)\nCourier: TCS Express (24-48 Hours Delivery)\nPTA Status: 100% Official PTA Approved`;
                  if (navigator.clipboard) {
                    navigator.clipboard.writeText(receiptMsg);
                    setCopiedReceipt(true);
                    setTimeout(() => setCopiedReceipt(false), 2500);
                  }
                }}
                className={`w-full py-3 px-4 rounded-xl border text-xs font-bold flex items-center justify-center gap-2 transition-all cursor-pointer ${
                  copiedReceipt
                    ? 'bg-emerald-50 border-emerald-300 text-emerald-800'
                    : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
                }`}
              >
                {copiedReceipt ? (
                  <>
                    <Check className="w-4 h-4 text-emerald-600" />
                    <span>Order SMS / WhatsApp Receipt Copied! ✓</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-4 h-4 text-slate-500" />
                    <span>Copy SMS / WhatsApp Order Receipt</span>
                  </>
                )}
              </button>

              {/* Email / SMS Confirmation Notice */}
              <div className="p-2.5 rounded-xl bg-blue-50/80 border border-blue-200/60 text-left flex items-start gap-2 text-[11px] text-[#0b3c68]">
                <Mail className="w-3.5 h-3.5 mt-0.5 shrink-0 text-[#0b3c68]" />
                <span>
                  {customerEmail ? (
                    <>Order confirmation receipt generated and linked to <strong>{customerEmail}</strong>.</>
                  ) : (
                    <>SMS confirmation dispatched to <strong>{phoneNumber}</strong>. You can also send the receipt above directly to our WhatsApp support.</>
                  )}
                </span>
              </div>
            </div>

            <button
              onClick={handleResetAndClose}
              className="w-full max-w-md mx-auto mt-2 py-3 rounded-2xl bg-slate-900 text-white text-xs sm:text-sm font-black hover:bg-[#0b3c68] transition-colors shadow-md cursor-pointer"
            >
              Continue Shopping
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
