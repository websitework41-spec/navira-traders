'use client';

import React, { useState, useEffect } from 'react';
import { CartItem, Coupon } from '@/types';
import { formatPKR, PAKISTAN_CITIES } from '@/data/smartphones';
import { PhoneImageWithFallback } from './PhoneImageWithFallback';
import {
  X,
  Plus,
  Minus,
  Trash2,
  ShieldCheck,
  PackageCheck,
  CheckCircle,
  CheckCircle2,
  Truck,
  ArrowRight,
  CreditCard,
  Banknote,
  Building,
  MessageSquare,
  ShoppingBag,
  Tag,
  Sparkles,
  Mail,
  Copy,
  Check,
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

interface CartDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  items: CartItem[];
  onUpdateQuantity: (index: number, newQty: number) => void;
  onRemoveItem: (index: number) => void;
  onClearCart: () => void;
}

export function CartDrawer({
  isOpen,
  onClose,
  items,
  onUpdateQuantity,
  onRemoveItem,
  onClearCart,
}: CartDrawerProps) {
  const { user, profile } = useAuth();
  const [isCheckoutStep, setIsCheckoutStep] = useState(false);
  const [orderSuccess, setOrderSuccess] = useState(false);
  const [confirmedOrderId, setConfirmedOrderId] = useState('');

  // Form states
  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [customerEmail, setCustomerEmail] = useState('');
  const [customerAddress, setCustomerAddress] = useState('');
  const [selectedCity, setSelectedCity] = useState('Lahore');
  const [paymentMethod, setPaymentMethod] = useState<'cod' | 'bank' | 'card'>('cod');
  const [honeypot, setHoneypot] = useState(''); // Anti-bot honeypot
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

  // Promo Code / Coupon state
  const [couponCodeInput, setCouponCodeInput] = useState('');
  const [appliedCoupon, setAppliedCoupon] = useState<Coupon | null>(null);
  const [discountAmount, setDiscountAmount] = useState(0);
  const [couponError, setCouponError] = useState('');
  const [couponSuccess, setCouponSuccess] = useState('');
  const [isApplyingCoupon, setIsApplyingCoupon] = useState(false);
  const [isPromoExpanded, setIsPromoExpanded] = useState(false);

  // Auto-prefill customer info when logged in
  useEffect(() => {
    if (user && profile) {
      if (!customerName && (profile.name || user.displayName)) {
        setCustomerName(profile.name || user.displayName || '');
      }
      if (!customerPhone && profile.phone) {
        setCustomerPhone(profile.phone);
      }
      if (!customerEmail && (profile.email || user.email)) {
        setCustomerEmail(profile.email || user.email || '');
      }
      const defaultAddr = profile.addresses?.find((a) => a.isDefault) || profile.addresses?.[0];
      if (defaultAddr) {
        if (!customerAddress) {
          setCustomerAddress(defaultAddr.streetAddress);
        }
        if (defaultAddr.city) {
          setSelectedCity(defaultAddr.city);
        }
      }
    }
  }, [user, profile, isCheckoutStep]);

  const subtotalPKR = items.reduce(
    (sum, item) => sum + item.selectedVariant.pricePKR * item.quantity,
    0
  );
  const totalSavingsPKR = items.reduce(
    (sum, item) =>
      sum +
      (item.selectedVariant.originalPricePKR - item.selectedVariant.pricePKR) *
        item.quantity,
    0
  );

  const finalTotalPKR = Math.max(0, subtotalPKR - discountAmount);

  // Recalculate discount if subtotal changes
  useEffect(() => {
    if (appliedCoupon) {
      if (appliedCoupon.minOrderAmount && subtotalPKR < appliedCoupon.minOrderAmount) {
        setAppliedCoupon(null);
        setDiscountAmount(0);
        setCouponError(
          `Coupon removed: minimum order of Rs. ${appliedCoupon.minOrderAmount.toLocaleString()} required.`
        );
        setCouponSuccess('');
      } else {
        let newDisc = 0;
        if (appliedCoupon.discountType === 'fixed') {
          newDisc = appliedCoupon.discountValue;
        } else if (appliedCoupon.discountType === 'percentage') {
          const raw = Math.round((subtotalPKR * appliedCoupon.discountValue) / 100);
          newDisc = appliedCoupon.maxDiscountAmount
            ? Math.min(appliedCoupon.maxDiscountAmount, raw)
            : raw;
        }
        setDiscountAmount(Math.min(newDisc, subtotalPKR));
      }
    }
  }, [subtotalPKR, appliedCoupon]);

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
        body: JSON.stringify({ action: 'validate', code, orderTotal: subtotalPKR }),
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

  if (!isOpen) return null;

  const hasOutOfStockItems = items.some(
    (i) => !i.phone.inStock || i.selectedColor.inStock === false || i.selectedVariant.inStock === false
  );

  const handlePlaceOrder = async (e: React.FormEvent) => {
    e.preventDefault();
    setValidationError('');

    if (hasOutOfStockItems) {
      setValidationError('Please remove out of stock items from your cart before proceeding.');
      return;
    }

    // 1. Input Sanitization
    const cleanName = sanitizeText(customerName, MAX_INPUT_LENGTHS.NAME);
    const cleanAddress = sanitizeText(customerAddress, MAX_INPUT_LENGTHS.ADDRESS);
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

    // 2. Mobile Phone Validation (03XX-XXXXXXX)
    const phoneCheck = validatePakistaniPhone(customerPhone);
    if (!phoneCheck.isValid) {
      setValidationError(phoneCheck.errorMessage || 'Please enter a valid Pakistani mobile number.');
      return;
    }

    const randomOrderId = `HPS-${Math.floor(100000 + Math.random() * 900000)}`;
    setConfirmedOrderId(randomOrderId);

    const paymentLabel =
      paymentMethod === 'bank'
        ? `Bank Transfer / Raast (Meezan Bank)${bankTxRef ? ` — Ref: ${sanitizeText(bankTxRef, 50)}` : ''}`
        : 'Cash on Delivery (Open-Parcel)';

    // Save to Firestore if user is authenticated (non-blocking)
    if (user) {
      try {
        const orderDocRef = doc(db, 'users', user.uid, 'orders', randomOrderId);
        setDoc(orderDocRef, {
          orderId: randomOrderId,
          customerName: cleanName,
          phone: phoneCheck.cleanPhone,
          email: cleanEmail,
          address: cleanAddress,
          city: selectedCity,
          bankTxRef: sanitizeText(bankTxRef, 100),
          items: items.map((i) => ({
            name: i.phone.name,
            variant: `${i.selectedVariant.ram}/${i.selectedVariant.storage}`,
            pricePKR: i.selectedVariant.pricePKR,
            quantity: i.quantity,
            color: i.selectedColor.name,
          })),
          totalPKR: finalTotalPKR,
          couponCode: appliedCoupon?.code || '',
          discountPKR: discountAmount,
          paymentMethod: paymentLabel,
          status: paymentMethod === 'bank' ? 'Payment Verification Pending' : 'Placed',
          createdAt: serverTimestamp(),
        }).catch((err) => console.warn('Firestore cart order async write warning:', err));
      } catch (err) {
        console.warn('Firestore cart order error:', err);
      }
    }

    // Persist to local storage for guest tracking
    try {
      const newOrder = {
        orderId: randomOrderId,
        customerName: cleanName,
        phone: phoneCheck.cleanPhone,
        email: cleanEmail,
        address: cleanAddress,
        city: selectedCity,
        bankTxRef: sanitizeText(bankTxRef, 100),
        items: items.map(
          (i) =>
            `${i.phone.name} (${i.selectedVariant.ram}/${i.selectedVariant.storage}) x${i.quantity}`
        ),
        totalPKR: finalTotalPKR,
        couponCode: appliedCoupon?.code || '',
        discountPKR: discountAmount,
        paymentMethod: paymentLabel,
        status:
          paymentMethod === 'bank'
            ? 'Order Placed — Send payment screenshot to WhatsApp for immediate dispatch approval.'
            : 'Order Confirmed — Dispatched via TCS Express. Estimated delivery: 24-48 Hours with Open-Parcel inspection.',
        createdAt: new Date().toISOString(),
      };
      const existing = JSON.parse(
        localStorage.getItem('naviratraders_orders') ||
          localStorage.getItem('voltphone_orders') ||
          '[]'
      );
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
            orderId: randomOrderId,
            customerName: cleanName,
            phone: phoneCheck.cleanPhone,
            email: cleanEmail,
            city: selectedCity,
            address: cleanAddress,
            bankTxRef: sanitizeText(bankTxRef, 100),
            items: items.map((i) => ({
              name: i.phone.name,
              variant: `${i.selectedVariant.ram}/${i.selectedVariant.storage}`,
              pricePKR: i.selectedVariant.pricePKR,
              quantity: i.quantity,
              color: i.selectedColor.name,
            })),
            totalPKR: finalTotalPKR,
            couponCode: appliedCoupon?.code || '',
            discountPKR: discountAmount,
            paymentMethod: paymentLabel,
            status: paymentMethod === 'bank' ? 'Payment Verification Pending' : 'Placed',
            courier: 'TCS Express',
          },
        }),
      }).catch(() => {});

      // Increment coupon usage
      if (appliedCoupon) {
        fetch('/api/coupons', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ action: 'redeem', code: appliedCoupon.code }),
        }).catch(() => {});
      }
    } catch {}

    trackPurchase(randomOrderId);
    setOrderSuccess(true);
  };

  const handleResetOrder = () => {
    setOrderSuccess(false);
    setIsCheckoutStep(false);
    setConfirmedOrderId('');
    setValidationError('');
    setCustomerEmail('');
    setBankTxRef('');
    setCopiedBankField(null);
    setCopiedReceipt(false);
    setHoneypot('');
    onClearCart();
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 overflow-hidden bg-slate-950/70 backdrop-blur-xs animate-in fade-in duration-200">
      {/* Container: pl-0 on mobile so drawer fills 100% of mobile width without wasted left margin */}
      <div className="absolute inset-y-0 right-0 max-w-full flex pl-0 sm:pl-10">
        <div className="w-screen sm:max-w-md bg-white border-l border-slate-200 shadow-2xl flex flex-col h-full overflow-hidden">
          {/* Header */}
          <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/70 shrink-0">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-sky-100 text-[#0b3c68] flex items-center justify-center">
                <ShoppingBag className="w-4 h-4 text-[#0b3c68]" />
              </div>
              <div>
                <h2 className="text-base font-black text-slate-900 tracking-tight">
                  {orderSuccess
                    ? 'Order Confirmed!'
                    : isCheckoutStep
                    ? 'Express Checkout (COD)'
                    : `Your Cart (${items.length})`}
                </h2>
                <p className="text-[10px] text-slate-500 font-medium">
                  100% PTA Approved • Open-Parcel Inspection
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              aria-label="Close cart drawer"
              className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-500 hover:text-slate-900 flex items-center justify-center transition-colors cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Success Screen */}
          {orderSuccess ? (
            <div className="flex-1 overflow-y-auto p-5 sm:p-6 flex flex-col items-center justify-center text-center space-y-4">
              <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-3xl bg-emerald-100 text-emerald-600 flex items-center justify-center shadow-lg shadow-emerald-500/20">
                <CheckCircle className="w-8 h-8 sm:w-9 sm:h-9 stroke-[2.2]" />
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
                  {paymentMethod === 'bank' ? 'Mubarak! Order Placed via Bank Transfer' : 'Mubarak! Order Placed'}
                </h3>
                <p className="text-xs text-slate-500 max-w-xs font-medium">
                  {paymentMethod === 'bank'
                    ? `Please transfer ${formatPKR(finalTotalPKR)} to the store bank/Raast account below and share the screenshot on WhatsApp.`
                    : 'Your smartphone order is confirmed with Open-Parcel Verification. Inspect before paying cash!'}
                </p>
              </div>

              {/* Bank Transfer Payment Instructions (Shown when bank payment is chosen) */}
              {paymentMethod === 'bank' && (
                <div className="w-full p-3.5 rounded-2xl bg-gradient-to-br from-blue-50 via-sky-50 to-indigo-50 border border-blue-200 text-left space-y-2 text-xs">
                  <div className="flex items-center justify-between border-b border-blue-200/70 pb-1.5">
                    <span className="font-extrabold text-[#0b3c68] flex items-center gap-1.5">
                      <Building className="w-3.5 h-3.5 text-blue-700" />
                      Transfer {formatPKR(finalTotalPKR)} to:
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
                          onClick={() => copyToClipboard(STORE_BANK_DETAILS.raastId, 'raast_succ')}
                          className="text-[#0b3c68] hover:underline cursor-pointer flex items-center gap-0.5"
                        >
                          {copiedBankField === 'raast_succ' ? 'Copied! ✓' : 'Copy'}
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
                          onClick={() => copyToClipboard(STORE_BANK_DETAILS.primaryBank.cleanAccountNumber, 'acc_succ')}
                          className="text-[#0b3c68] hover:underline cursor-pointer flex items-center gap-0.5"
                        >
                          {copiedBankField === 'acc_succ' ? 'Copied! ✓' : 'Copy'}
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
                      onClick={() => copyToClipboard(STORE_BANK_DETAILS.primaryBank.iban, 'iban_succ')}
                      className="text-[10px] font-bold px-2 py-1 rounded bg-slate-100 hover:bg-slate-200 text-slate-700 cursor-pointer"
                    >
                      {copiedBankField === 'iban_succ' ? 'Copied! ✓' : 'Copy IBAN'}
                    </button>
                  </div>
                </div>
              )}

              {/* Order Receipt Summary Card */}
              <div className="w-full bg-slate-50 p-4 rounded-2xl border border-slate-200 text-left space-y-2 text-xs">
                <div className="flex justify-between items-center pb-2 border-b border-slate-200">
                  <span className="text-slate-500 font-medium">Tracking Code:</span>
                  <span className="font-mono font-black text-[#0b3c68] text-sm bg-blue-50 px-2 py-0.5 rounded-md border border-blue-100">
                    {confirmedOrderId || 'HPS-786110'}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Recipient:</span>
                  <span className="font-bold text-slate-900">{customerName}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Phone Number:</span>
                  <span className="font-mono font-bold text-slate-900">{customerPhone}</span>
                </div>
                {customerEmail && (
                  <div className="flex justify-between">
                    <span className="text-slate-500">Email:</span>
                    <span className="font-medium text-slate-800">{customerEmail}</span>
                  </div>
                )}
                <div className="flex justify-between">
                  <span className="text-slate-500">Destination:</span>
                  <span className="font-bold text-slate-900">{selectedCity}, Pakistan</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Address:</span>
                  <span className="font-medium text-slate-800 text-right max-w-[65%] truncate">
                    {customerAddress}
                  </span>
                </div>
                {items.length > 0 && (
                  <div className="flex justify-between">
                    <span className="text-slate-500">Items ({items.length}):</span>
                    <span className="font-bold text-slate-900 text-right max-w-[65%] truncate">
                      {items.map((i) => `${i.phone.name} x${i.quantity}`).join(', ')}
                    </span>
                  </div>
                )}
                <div className="flex justify-between">
                  <span className="text-slate-400">Payment:</span>
                  <span className={`font-bold uppercase ${paymentMethod === 'bank' ? 'text-blue-700' : 'text-emerald-700'}`}>
                    {paymentMethod === 'bank' ? 'Direct Bank Transfer / Raast' : 'Cash on Delivery (Open Parcel)'}
                  </span>
                </div>
                {bankTxRef && paymentMethod === 'bank' && (
                  <div className="flex justify-between">
                    <span className="text-slate-400">Sender Ref / TID:</span>
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
                  <span className="text-slate-900">Total Amount:</span>
                  <span className="text-[#0b3c68] font-black text-sm">{formatPKR(finalTotalPKR)}</span>
                </div>
              </div>

              {/* Automated Messaging & Receipt Hub */}
              <div className="w-full space-y-2 pt-1">
                {/* 1-Click WhatsApp Button with full pre-filled order receipt */}
                <a
                  href={`https://wa.me/923018543131?text=${encodeURIComponent(
                    paymentMethod === 'bank'
                      ? `📦 *NAWIRA TRADERS — BANK TRANSFER PAYMENT RECEIPT*\n──────────────────────\n🔖 *Order ID:* ${confirmedOrderId}\n👤 *Customer:* ${customerName}\n📞 *Mobile:* ${customerPhone}\n${customerEmail ? `✉️ *Email:* ${customerEmail}\n` : ''}📍 *Destination:* ${selectedCity}, Pakistan\n🏠 *Address:* ${customerAddress}\n📱 *Items:* ${items.map((i) => `${i.phone.name} (${i.selectedVariant.ram}/${i.selectedVariant.storage}) x${i.quantity}`).join(', ')}\n💰 *Amount Transferred:* ${formatPKR(finalTotalPKR)}\n🏦 *Method:* Direct Bank Transfer / Raast (Meezan Bank)\n${bankTxRef ? `📝 *Sender Reference / TID:* ${bankTxRef}\n` : ''}──────────────────────\n_I have completed the bank transfer. Attaching payment receipt screenshot here for verification & immediate dispatch._`
                      : `📦 *NAWIRA TRADERS — ORDER CONFIRMATION RECEIPT*\n──────────────────────\n🔖 *Order ID:* ${confirmedOrderId}\n👤 *Customer:* ${customerName}\n📞 *Mobile:* ${customerPhone}\n${customerEmail ? `✉️ *Email:* ${customerEmail}\n` : ''}📍 *Destination:* ${selectedCity}, Pakistan\n🏠 *Address:* ${customerAddress}\n📱 *Items:* ${items.map((i) => `${i.phone.name} (${i.selectedVariant.ram}/${i.selectedVariant.storage}) x${i.quantity}`).join(', ')}\n💰 *Total Payable:* ${formatPKR(finalTotalPKR)} (Open-Parcel COD)\n🚚 *Courier:* TCS Express (24-48 Hours Delivery)\n🛡️ *PTA Status:* 100% Official PTA Approved\n──────────────────────\n_I just placed this order. Please confirm dispatch tracking details._`
                  )}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={`w-full py-3.5 px-4 rounded-2xl text-white text-xs sm:text-sm font-black flex items-center justify-center gap-2 shadow-lg transition-all cursor-pointer btn-press ${
                    paymentMethod === 'bank'
                      ? 'bg-emerald-600 hover:bg-emerald-700 shadow-emerald-600/25'
                      : 'bg-emerald-600 hover:bg-emerald-700 shadow-emerald-600/25'
                  }`}
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
                    const itemsText = items.map((i) => `${i.phone.name} (${i.selectedVariant.ram}/${i.selectedVariant.storage}) x${i.quantity}`).join(', ');
                    const receiptMsg = paymentMethod === 'bank'
                      ? `📦 NAWIRA TRADERS — BANK TRANSFER RECEIPT\nOrder ID: ${confirmedOrderId}\nCustomer: ${customerName}\nPhone: ${customerPhone}\n${customerEmail ? `Email: ${customerEmail}\n` : ''}Destination: ${selectedCity}, Pakistan\nAddress: ${customerAddress}\nItems: ${itemsText}\nTotal: ${formatPKR(finalTotalPKR)}\nPayment: Direct Bank Transfer (Meezan Bank / Raast)\n${bankTxRef ? `Sender Ref: ${bankTxRef}\n` : ''}Raast ID: ${STORE_BANK_DETAILS.raastId}\nMeezan IBAN: ${STORE_BANK_DETAILS.primaryBank.iban}`
                      : `📦 NAWIRA TRADERS — ORDER RECEIPT\nOrder ID: ${confirmedOrderId}\nCustomer: ${customerName}\nPhone: ${customerPhone}\n${customerEmail ? `Email: ${customerEmail}\n` : ''}Destination: ${selectedCity}, Pakistan\nAddress: ${customerAddress}\nItems: ${itemsText}\nTotal: ${formatPKR(finalTotalPKR)} (Open-Parcel COD)\nCourier: TCS Express (24-48 Hours Delivery)\nPTA: 100% Official PTA Approved`;
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
                      <>SMS confirmation dispatched to <strong>{customerPhone}</strong>. You can also send the receipt above directly to our WhatsApp support.</>
                    )}
                  </span>
                </div>
              </div>

              <button
                onClick={handleResetOrder}
                className="w-full py-3 rounded-2xl bg-slate-900 text-white text-xs sm:text-sm font-black hover:bg-[#0b3c68] transition-colors shadow-md cursor-pointer"
              >
                Back to Smartphone Catalog
              </button>
            </div>
          ) : isCheckoutStep ? (
            /* Checkout Form */
            <form onSubmit={handlePlaceOrder} className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-4">
              <input
                type="text"
                name="_hp_cart_check"
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

              <div className="p-3 rounded-xl bg-blue-50/80 border border-blue-200 text-xs text-[#0b3c68] flex items-start gap-2">
                <PackageCheck className="w-4 h-4 text-[#0b3c68] flex-shrink-0 mt-0.5" />
                <span className="font-medium text-[11px] leading-relaxed">
                  <strong>Open-Parcel Guarantee:</strong> The TCS rider will let you open and inspect the sealed box before you pay COD cash!
                </span>
              </div>

              {/* Responsive Inputs: text-base on mobile prevents iOS zoom */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Full Name <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={customerName}
                  onChange={(e) => setCustomerName(e.target.value)}
                  placeholder="e.g. Ali Khan"
                  className="w-full px-3.5 py-2.5 rounded-xl text-base sm:text-sm bg-slate-50 border border-slate-200 focus:outline-none focus:ring-2 focus:ring-[#48afff] focus:bg-white text-slate-900 font-medium transition-all"
                />
              </div>

              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="block text-xs font-bold text-slate-700">
                    Mobile / WhatsApp Number <span className="text-rose-500">*</span>
                  </label>
                  <span className={`text-[10px] font-mono font-bold ${customerPhone.length === 11 ? 'text-emerald-600' : 'text-slate-400'}`}>
                    {customerPhone.length}/11
                  </span>
                </div>
                <input
                  type="tel"
                  inputMode="numeric"
                  autoComplete="tel"
                  maxLength={11}
                  required
                  value={customerPhone}
                  onChange={(e) => setCustomerPhone(e.target.value.replace(/\D/g, '').slice(0, 11))}
                  placeholder="03001234567"
                  className="w-full px-3.5 py-2.5 rounded-xl text-base sm:text-sm bg-slate-50 border border-slate-200 focus:outline-none focus:ring-2 focus:ring-[#48afff] focus:bg-white text-slate-900 font-medium transition-all"
                />
              </div>

              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="block text-xs font-bold text-slate-700">
                    Email Address (Optional)
                  </label>
                  <span className="text-[10px] text-slate-400 font-medium">For instant invoice & tracking receipt</span>
                </div>
                <input
                  type="email"
                  autoComplete="email"
                  value={customerEmail}
                  onChange={(e) => setCustomerEmail(e.target.value)}
                  placeholder="e.g. yourname@gmail.com"
                  className="w-full px-3.5 py-2.5 rounded-xl text-base sm:text-sm bg-slate-50 border border-slate-200 focus:outline-none focus:ring-2 focus:ring-[#48afff] focus:bg-white text-slate-900 font-medium transition-all"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Delivery City (Pakistan) <span className="text-rose-500">*</span>
                </label>
                <select
                  value={selectedCity}
                  onChange={(e) => setSelectedCity(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl text-base sm:text-sm bg-slate-50 border border-slate-200 focus:outline-none focus:ring-2 focus:ring-[#48afff] focus:bg-white text-slate-900 font-medium transition-all cursor-pointer"
                >
                  {PAKISTAN_CITIES.map((city) => (
                    <option key={city} value={city}>
                      {city}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Complete Street Address <span className="text-rose-500">*</span>
                </label>
                <textarea
                  required
                  rows={2}
                  value={customerAddress}
                  onChange={(e) => setCustomerAddress(e.target.value)}
                  placeholder="House #, Street, Sector / Area / Landmark"
                  className="w-full px-3.5 py-2 rounded-xl text-base sm:text-sm bg-slate-50 border border-slate-200 focus:outline-none focus:ring-2 focus:ring-[#48afff] focus:bg-white text-slate-900 font-medium transition-all resize-none"
                />
              </div>

              {/* Payment Methods */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">
                  Payment Method
                </label>
                <div className="space-y-2">
                  <label
                    onClick={() => setPaymentMethod('cod')}
                    className={`flex items-center justify-between p-3 rounded-xl border text-xs font-medium cursor-pointer transition-all ${
                      paymentMethod === 'cod'
                        ? 'border-[#0b3c68] bg-blue-50/70 ring-2 ring-[#48afff]/40'
                        : 'border-slate-200 bg-slate-50 hover:bg-slate-100'
                    }`}
                  >
                    <div className="flex items-center gap-2.5">
                      <Banknote className="w-4 h-4 text-emerald-600" />
                      <div>
                        <div className="font-extrabold text-slate-900">
                          Cash on Delivery (COD)
                        </div>
                        <div className="text-[10px] text-slate-500">
                          Inspect open parcel first, pay cash to courier
                        </div>
                      </div>
                    </div>
                    <input
                      type="radio"
                      name="cart_payment"
                      checked={paymentMethod === 'cod'}
                      onChange={() => setPaymentMethod('cod')}
                      className="accent-[#0b3c68]"
                    />
                  </label>

                  <label
                    onClick={() => setPaymentMethod('bank')}
                    className={`flex items-center justify-between p-3 rounded-xl border text-xs font-medium cursor-pointer transition-all ${
                      paymentMethod === 'bank'
                        ? 'border-[#0b3c68] bg-blue-50/70 ring-2 ring-[#48afff]/40'
                        : 'border-slate-200 bg-slate-50 hover:bg-slate-100'
                    }`}
                  >
                    <div className="flex items-center gap-2.5">
                      <Building className="w-4 h-4 text-blue-600" />
                      <div>
                        <div className="font-extrabold text-slate-900">
                          Bank Transfer / Raast
                        </div>
                        <div className="text-[10px] text-slate-500">
                          Instant IBFT (Meezan Bank, Raast, Bank Alfalah)
                        </div>
                      </div>
                    </div>
                    <input
                      type="radio"
                      name="cart_payment"
                      checked={paymentMethod === 'bank'}
                      onChange={() => setPaymentMethod('bank')}
                      className="accent-[#0b3c68]"
                    />
                  </label>

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
                            onClick={() => copyToClipboard(STORE_BANK_DETAILS.raastId, 'raast')}
                            className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-sky-50 text-[#0b3c68] hover:bg-sky-100 transition-colors flex items-center gap-1 cursor-pointer"
                          >
                            {copiedBankField === 'raast' ? (
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
                                onClick={() => copyToClipboard(STORE_BANK_DETAILS.primaryBank.cleanAccountNumber, 'acc')}
                                className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-slate-100 hover:bg-slate-200 text-slate-700 flex items-center gap-1 cursor-pointer"
                                title="Copy Account Number"
                              >
                                {copiedBankField === 'acc' ? (
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
                                onClick={() => copyToClipboard(STORE_BANK_DETAILS.primaryBank.iban, 'iban')}
                                className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-slate-100 hover:bg-slate-200 text-slate-700 flex items-center gap-1 cursor-pointer"
                                title="Copy IBAN"
                              >
                                {copiedBankField === 'iban' ? (
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
              </div>

              {/* Order Submit */}
              <div className="pt-3 border-t border-slate-100 space-y-3">
                <div className="space-y-1.5 text-xs">
                  <div className="flex justify-between text-slate-500 font-medium">
                    <span>Subtotal:</span>
                    <span className="text-slate-800 font-bold">{formatPKR(subtotalPKR)}</span>
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
                  <div className="flex justify-between text-xs font-black text-slate-900 pt-1 border-t border-slate-100">
                    <span>Total Payable:</span>
                    <span className="text-base font-black text-[#0b3c68]">
                      {formatPKR(finalTotalPKR)}
                    </span>
                  </div>
                </div>

                {validationError && (
                  <div className="p-2.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-bold flex items-center gap-2 animate-in fade-in">
                    <span className="shrink-0">⚠️</span>
                    <span>{validationError}</span>
                  </div>
                )}

                <div className="grid grid-cols-2 gap-2 pb-2">
                  <button
                    type="button"
                    onClick={() => setIsCheckoutStep(false)}
                    className="py-3 px-3 rounded-xl border border-slate-200 text-xs font-bold text-slate-700 hover:bg-slate-100 btn-press cursor-pointer"
                  >
                    Edit Cart
                  </button>
                  <button
                    type="submit"
                    className="py-3 px-3 rounded-xl bg-[#0b3c68] hover:bg-[#072847] text-white text-xs font-black shadow-md btn-press cursor-pointer"
                  >
                    Confirm Order
                  </button>
                </div>
              </div>
            </form>
          ) : (
            /* Items List */
            <>
              {items.length === 0 ? (
                <div className="flex-1 flex flex-col items-center justify-center p-6 text-center text-slate-400">
                  <div className="w-16 h-16 rounded-3xl bg-slate-100 text-slate-400 flex items-center justify-center mb-3">
                    <Truck className="w-8 h-8 text-[#0b3c68]" />
                  </div>
                  <p className="text-sm font-bold text-slate-700">
                    Your cart is empty
                  </p>
                  <p className="text-xs text-slate-400 mt-1 max-w-xs">
                    Explore 222+ PTA-approved smartphones with 0% EMI and Open-Parcel delivery.
                  </p>
                  <button
                    onClick={onClose}
                    className="mt-4 px-5 py-2.5 rounded-xl bg-[#0b3c68] text-white text-xs font-bold hover:bg-[#48afff] transition-colors cursor-pointer"
                  >
                    Browse Smartphones
                  </button>
                </div>
              ) : (
                <div className="flex-1 overflow-y-auto p-4 divide-y divide-slate-100">
                  {items.map((item, index) => {
                    const isItemOutOfStock =
                      !item.phone.inStock ||
                      item.selectedColor.inStock === false ||
                      item.selectedVariant.inStock === false;
                    return (
                      <div key={`${item.phone.id}-${index}`} className="py-3.5 flex gap-3 items-center">
                        {/* Thumbnail */}
                        <div className="w-16 h-20 rounded-xl bg-white border border-slate-200 p-1.5 flex items-center justify-center shrink-0 relative">
                          <PhoneImageWithFallback
                            src={item.selectedColor.image}
                            alt={item.phone.name}
                            brand={item.phone.brand}
                            className="w-full h-full object-contain"
                          />
                          {isItemOutOfStock && (
                            <span className="absolute top-1 left-1 bg-rose-600 text-white text-[8px] font-black px-1 rounded shadow">
                              OOS
                            </span>
                          )}
                        </div>

                        {/* Info & Quantity */}
                        <div className="flex-1 min-w-0 flex flex-col justify-between self-stretch">
                          <div>
                            <div className="flex justify-between items-start gap-1">
                              <h4 className="text-xs sm:text-sm font-black text-slate-900 truncate">
                                {item.phone.name}
                              </h4>
                              <button
                                onClick={() => onRemoveItem(index)}
                                aria-label={`Remove ${item.phone.name} from cart`}
                                className="text-slate-400 hover:text-rose-600 cursor-pointer p-1 -mr-1"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </div>
                            <div className="text-[11px] text-slate-500 font-medium mt-0.5">
                              {item.selectedColor.name} • {item.selectedVariant.ram} / {item.selectedVariant.storage}
                            </div>
                            {isItemOutOfStock && (
                              <div className="text-[10px] text-rose-600 font-bold mt-1 bg-rose-50 px-1.5 py-0.5 rounded border border-rose-200 inline-block">
                                ⚠️ Out of Stock — remove to checkout
                              </div>
                            )}
                          </div>

                          <div className="flex items-center justify-between mt-2">
                            <div className="text-xs sm:text-sm font-black text-[#0b3c68]">
                              {formatPKR(item.selectedVariant.pricePKR)}
                            </div>

                            {/* Touch-Friendly Quantity Buttons (Enlarged for comfortable mobile tapping) */}
                            <div className="flex items-center gap-1 bg-slate-100 rounded-xl p-0.5 border border-slate-200">
                              <button
                                onClick={() => onUpdateQuantity(index, item.quantity - 1)}
                                aria-label={`Decrease quantity of ${item.phone.name}`}
                                className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg bg-white flex items-center justify-center text-slate-700 text-xs font-bold active:scale-90 transition-transform cursor-pointer shadow-2xs hover:bg-slate-50"
                              >
                                <Minus className="w-3.5 h-3.5" />
                              </button>
                              <span className="text-xs font-black px-2 text-slate-900">
                                {item.quantity}
                              </span>
                              <button
                                onClick={() => onUpdateQuantity(index, item.quantity + 1)}
                                aria-label={`Increase quantity of ${item.phone.name}`}
                                className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg bg-white flex items-center justify-center text-slate-700 text-xs font-bold active:scale-90 transition-transform cursor-pointer shadow-2xs hover:bg-slate-50"
                              >
                                <Plus className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}

              {/* Cart Footer Summary */}
              {items.length > 0 && (
                <div className="p-4 sm:p-5 border-t border-slate-100 space-y-3 bg-slate-50/80 shrink-0">
                  {/* Collapsible Promo Code Entry Widget */}
                  <div className="bg-white p-2.5 sm:p-3 rounded-2xl border border-slate-200/80 shadow-2xs space-y-2">
                    {appliedCoupon ? (
                      <div className="flex items-center justify-between p-2 rounded-xl bg-emerald-50/70 border border-emerald-200 text-xs">
                        <div className="flex items-center gap-2">
                          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                          <div>
                            <span className="font-extrabold text-emerald-800 tracking-wider">
                              {appliedCoupon.code}
                            </span>
                            <span className="text-[11px] text-emerald-700 ml-1.5 font-bold">
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
                    ) : !isPromoExpanded ? (
                      <button
                        type="button"
                        onClick={() => setIsPromoExpanded(true)}
                        className="w-full py-0.5 text-xs font-semibold text-slate-600 hover:text-[#0b3c68] flex items-center justify-between transition-colors cursor-pointer"
                      >
                        <span className="flex items-center gap-1.5">
                          <Tag className="w-3.5 h-3.5 text-[#0b3c68]" />
                          <span>Have a promo code?</span>
                        </span>
                        <span className="text-[11px] font-bold text-[#136ab5] hover:underline">
                          Apply
                        </span>
                      </button>
                    ) : (
                      <div className="space-y-2 animate-in fade-in duration-150">
                        <div className="flex items-center justify-between">
                          <span className="text-[11px] font-bold text-slate-700 flex items-center gap-1.5">
                            <Tag className="w-3.5 h-3.5 text-[#0b3c68]" />
                            <span>Enter Promo Code</span>
                          </span>
                          <button
                            type="button"
                            onClick={() => {
                              setIsPromoExpanded(false);
                              setCouponError('');
                            }}
                            className="text-[10px] text-slate-400 hover:text-slate-600 cursor-pointer"
                          >
                            Cancel
                          </button>
                        </div>

                        <div className="flex gap-1.5">
                          <input
                            type="text"
                            value={couponCodeInput}
                            onChange={(e) => setCouponCodeInput(e.target.value.toUpperCase())}
                            placeholder="Enter Code"
                            className="flex-1 px-3 py-1.5 text-xs font-mono font-bold uppercase rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#48afff] text-slate-900"
                          />
                          <button
                            type="button"
                            onClick={() => handleApplyCoupon()}
                            disabled={isApplyingCoupon || !couponCodeInput.trim()}
                            className="px-3.5 py-1.5 bg-[#0b3c68] hover:bg-[#072847] disabled:bg-slate-200 text-white disabled:text-slate-400 text-xs font-black rounded-xl transition-all cursor-pointer shadow-xs disabled:cursor-not-allowed"
                          >
                            {isApplyingCoupon ? '...' : 'Apply'}
                          </button>
                        </div>
                      </div>
                    )}

                    {couponError && (
                      <p className="text-[11px] font-medium text-rose-600">
                        {couponError}
                      </p>
                    )}
                    {couponSuccess && !appliedCoupon && (
                      <p className="text-[11px] font-medium text-emerald-600">
                        {couponSuccess}
                      </p>
                    )}
                  </div>

                  <div className="space-y-1.5 text-xs">
                    <div className="flex justify-between text-slate-500 font-medium">
                      <span>Subtotal</span>
                      <span className="text-slate-900 font-bold">{formatPKR(subtotalPKR)}</span>
                    </div>
                    {discountAmount > 0 && (
                      <div className="flex justify-between text-emerald-700 font-bold">
                        <span className="flex items-center gap-1">
                          <Tag className="w-3 h-3 text-emerald-600" />
                          Promo Discount ({appliedCoupon?.code})
                        </span>
                        <span>-{formatPKR(discountAmount)}</span>
                      </div>
                    )}
                    {totalSavingsPKR > 0 && (
                      <div className="flex justify-between text-emerald-700 font-bold">
                        <span>Total Savings</span>
                        <span>-{formatPKR(totalSavingsPKR)}</span>
                      </div>
                    )}
                    <div className="flex justify-between text-slate-500 font-medium">
                      <span>Shipping across Pakistan</span>
                      <span className="text-emerald-700 font-bold uppercase">Free (Rs. 0)</span>
                    </div>
                    <div className="pt-2 border-t border-slate-200 flex justify-between font-black text-sm text-slate-900">
                      <span>Total Amount:</span>
                      <span className="text-base text-[#0b3c68] font-black">
                        {formatPKR(finalTotalPKR)}
                      </span>
                    </div>
                  </div>

                  <div className="space-y-2 pt-1 pb-1">
                    <button
                      onClick={() => setIsCheckoutStep(true)}
                      disabled={hasOutOfStockItems}
                      className={`w-full py-3.5 rounded-2xl text-xs sm:text-sm font-black transition-all flex items-center justify-center gap-2 ${
                        hasOutOfStockItems
                          ? 'bg-slate-200 text-slate-400 cursor-not-allowed border border-slate-300'
                          : 'bg-[#0b3c68] hover:bg-[#072847] text-white shadow-lg shadow-[#0b3c68]/20 btn-press cursor-pointer'
                      }`}
                    >
                      <span>Proceed to Checkout (Open-Parcel COD)</span>
                      <ArrowRight className="w-4 h-4" />
                    </button>

                    <button
                      onClick={onClose}
                      className="w-full py-2.5 rounded-xl text-xs font-bold text-slate-500 hover:text-slate-800 transition-colors"
                    >
                      Continue Shopping
                    </button>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
