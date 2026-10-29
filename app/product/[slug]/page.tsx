'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { SMARTPHONES, getPhoneBySlug, formatPKR } from '@/data/smartphones';
import { getActiveCatalog, getLocalDeletedIds } from '@/lib/catalog';
import { Smartphone, SmartphoneColor, SmartphoneVariant, CartItem } from '@/types';
import { PhoneImageWithFallback } from '@/components/PhoneImageWithFallback';
import { Navbar } from '@/components/Navbar';
import dynamic from 'next/dynamic';

// Performance Optimization: Lazy-load off-screen interactive modals
const CartDrawer = dynamic(
  () => import('@/components/CartDrawer').then((m) => m.CartDrawer),
  { ssr: false }
);
const QuickPurchaseModal = dynamic(
  () => import('@/components/QuickPurchaseModal').then((m) => m.QuickPurchaseModal),
  { ssr: false }
);
const TradeInEstimatorModal = dynamic(
  () => import('@/components/TradeInEstimatorModal').then((m) => m.TradeInEstimatorModal),
  { ssr: false }
);
const ComparisonDock = dynamic(
  () => import('@/components/ComparisonDock').then((m) => m.ComparisonDock),
  { ssr: false }
);

import { DeliveryEstimatorCountdown } from '@/components/DeliveryEstimatorCountdown';
import { Footer } from '@/components/Footer';
import { sanitizeText } from '@/lib/security';
import { trackProductView, trackCartAdd, trackCheckoutStart } from '@/components/AnalyticsTracker';
import {
  ShieldCheck,
  PackageCheck,
  Award,
  Truck,
  Star,
  Check,
  Layers,
  ShoppingCart,
  Zap,
  ArrowLeft,
  ArrowRight,
  CreditCard,
  Cpu,
  Battery,
  Camera,
  CheckCircle2,
  MessageSquare,
  ChevronRight,
  ChevronDown,
  HelpCircle,
  Box,
  Sparkles,
  RefreshCw,
  ThumbsUp,
  Radio,
  Wifi,
  Smartphone as PhoneIcon,
  Gift,
  Flame,
  Shield,
  Eye,
  Lock,
} from 'lucide-react';

export default function ProductDetailPage() {
  const router = useRouter();
  const params = useParams();
  const rawSlug = (params?.slug as string) || '';
  const slug = sanitizeText(rawSlug, 100);
  const [phone, setPhone] = useState<Smartphone>(() => getPhoneBySlug(slug) || SMARTPHONES[0]);

  useEffect(() => {
    // Check if product is marked deleted
    const deleted = getLocalDeletedIds();
    if (deleted.some((d) => d.toLowerCase() === slug.toLowerCase())) {
      router.push('/');
      return;
    }

    fetch('/api/admin/products?_t=' + Date.now(), { cache: 'no-store' })
      .then((res) => res.json())
      .then((data) => {
        if (data.success && Array.isArray(data.products)) {
          const active = getActiveCatalog(data.products);
          const found = active.find((p: Smartphone) => p.slug === slug || p.id === slug);
          if (found) {
            setPhone(found);
          } else {
            router.push('/');
          }
        }
      })
      .catch(() => {});
  }, [slug, router]);

  // Find first in-stock color & variant if available
  const initialColor =
    phone?.colors.find((c) => {
      if (c.inStock === false) return false;
      if (phone.colorStockMap && phone.colorStockMap[c.name] && !phone.colorStockMap[c.name].inStock)
        return false;
      return true;
    }) ||
    phone?.colors.find((c) => c.inStock !== false) ||
    phone?.colors[0];

  const initialVariant = phone?.variants.find((v) => v.inStock) || phone?.variants[0];

  // States
  const [selectedColor, setSelectedColor] = useState<SmartphoneColor>(initialColor);
  const [selectedVariant, setSelectedVariant] = useState<SmartphoneVariant>(initialVariant);
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [isCompareModalOpen, setIsCompareModalOpen] = useState(false);
  const [comparingPhones, setComparingPhones] = useState<Smartphone[]>([]);
  const [selectedTenure, setSelectedTenure] = useState<number>(6); // installment months
  const [isQuickBuyOpen, setIsQuickBuyOpen] = useState(false);
  const [isTradeInModalOpen, setIsTradeInModalOpen] = useState(false);

  // Addons states (PriceOye features)
  const [addGiftWrap, setAddGiftWrap] = useState(false);
  const [addScreenProtection, setAddScreenProtection] = useState(false);

  // Accordion active tab
  const [activeFaq, setActiveFaq] = useState<number | null>(null);

  const isInitialMount = useRef(true);

  // Synchronize cart with localStorage on mount & listen to storage events
  useEffect(() => {
    try {
      const saved = localStorage.getItem('voltphone_cart');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) {
          setCartItems(parsed);
        }
      }
    } catch {
      // ignore
    }

    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'voltphone_cart' && e.newValue) {
        try {
          const parsed = JSON.parse(e.newValue);
          if (Array.isArray(parsed)) {
            setCartItems(parsed);
          }
        } catch {
          // ignore
        }
      }
    };

    window.addEventListener('storage', handleStorageChange);
    return () => {
      window.removeEventListener('storage', handleStorageChange);
    };
  }, []);

  // Persist cart to localStorage
  useEffect(() => {
    if (isInitialMount.current) {
      isInitialMount.current = false;
      return;
    }
    try {
      localStorage.setItem('voltphone_cart', JSON.stringify(cartItems));
    } catch {
      // ignore
    }
  }, [cartItems]);

  useEffect(() => {
    if (phone) {
      const inStockC =
        phone.colors.find((c) => {
          if (c.inStock === false) return false;
          if (phone.colorStockMap && phone.colorStockMap[c.name] && !phone.colorStockMap[c.name].inStock)
            return false;
          return true;
        }) ||
        phone.colors.find((c) => c.inStock !== false) ||
        phone.colors[0];
      const inStockV = phone.variants.find((v) => v.inStock) || phone.variants[0];
      setSelectedColor(inStockC);
      setSelectedVariant(inStockV);
    }
  }, [phone?.id]);

  if (!phone) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-6 text-center bg-[#f1f3f6]">
        <h1 className="text-xl font-bold text-[#0b3c68]">Smartphone Not Found</h1>
        <p className="text-slate-500 text-xs mt-2">
          The requested device model does not exist in our catalog.
        </p>
        <Link
          href="/"
          className="mt-4 px-5 py-2.5 bg-[#0b3c68] text-white rounded-xl text-xs font-bold hover:bg-[#48afff] transition-colors"
        >
          Return to Catalog
        </Link>
      </div>
    );
  }

  const isColorInStock = selectedColor?.inStock ?? phone.inStock;
  const isVariantInStock = selectedVariant?.inStock ?? phone.inStock;
  const isPhoneInStock = phone.inStock;
  const isSelectionInStock = Boolean(isPhoneInStock && isColorInStock && isVariantInStock);
  const currentStockQty = selectedColor?.stockQty || selectedVariant?.stockQty || phone.stockQty || 0;

  const basePrice = selectedVariant?.pricePKR || phone.basePricePKR;
  const addonCost = (addGiftWrap ? 199 : 0) + (addScreenProtection ? 999 : 0);
  const currentPrice = basePrice + addonCost;

  const currentOriginalPrice =
    (selectedVariant?.originalPricePKR || phone.originalPricePKR) + addonCost;
  const savings = currentOriginalPrice - currentPrice;
  const monthlyInstallment = Math.round(currentPrice / selectedTenure);

  // Track product view in real-time analytics
  useEffect(() => {
    if (phone && phone.id) {
      trackProductView({
        phoneId: phone.id,
        name: phone.name,
        brand: phone.brand,
        slug: phone.slug,
        image: selectedColor?.image || phone.colors[0]?.image,
        pricePKR: currentPrice || phone.basePricePKR,
      });
    }
  }, [phone?.id, selectedColor?.name, selectedVariant?.id, currentPrice]);

  const handleAddToCart = () => {
    if (!isSelectionInStock) {
      alert(
        `${selectedColor.name} (${selectedVariant.ram}/${selectedVariant.storage}) is currently Out of Stock.`
      );
      return;
    }

    // Track cart addition in real-time analytics
    trackCartAdd({
      phoneId: phone.id,
      name: phone.name,
      brand: phone.brand,
      slug: phone.slug,
      image: selectedColor?.image || phone.colors[0]?.image,
      pricePKR: currentPrice,
    });

    setCartItems((prev) => {
      const existing = prev.find(
        (i) =>
          i.phone.id === phone.id &&
          i.selectedVariant.id === selectedVariant.id &&
          i.selectedColor.name === selectedColor.name
      );
      if (existing) {
        return prev.map((i) =>
          i === existing ? { ...i, quantity: i.quantity + 1 } : i
        );
      }
      return [
        ...prev,
        {
          phone,
          selectedColor,
          selectedVariant,
          quantity: 1,
        },
      ];
    });
    setIsCartOpen(true);
  };

  const handleToggleCompare = (item: Smartphone) => {
    setComparingPhones((prev) => {
      const exists = prev.find((p) => p.id === item.id);
      if (exists) {
        return prev.filter((p) => p.id !== item.id);
      }
      if (prev.length >= 3) {
        alert('You can compare a maximum of 3 smartphones at a time.');
        return prev;
      }
      return [...prev, item];
    });
  };

  const similarPhones = SMARTPHONES.filter(
    (p) =>
      p.id !== phone.id &&
      (p.brand.toLowerCase() === phone.brand.toLowerCase() ||
        Math.abs(p.basePricePKR - phone.basePricePKR) < 50000)
  ).slice(0, 4);

  // Static customer reviews data for social proof
  const customerReviews = [
    {
      author: 'Muhammad Bilal',
      city: 'Lahore',
      rating: 5,
      date: '3 days ago',
      verified: true,
      comment:
        '100% genuine sealed box received! The courier rider allowed me to open and inspect the parcel before taking cash. DIRBS IMEI verification matched with PTA database on the spot. Highly recommended!',
    },
    {
      author: 'Usman Tariq',
      city: 'Karachi',
      rating: 5,
      date: '1 week ago',
      verified: true,
      comment:
        'Fastest delivery in Karachi. Ordered on Tuesday and got it on Wednesday afternoon. Amazing battery timing and official warranty card stamped inside the box.',
    },
    {
      author: 'Ayesha Khan',
      city: 'Islamabad',
      rating: 5,
      date: '2 weeks ago',
      verified: true,
      comment:
        'Best price in Pakistan, even cheaper than the local market. Clean packaging and responsive WhatsApp support team answered all my questions regarding 0% EMI.',
    },
  ];

  const faqs = [
    {
      q: 'Is this phone 100% PTA Approved & DIRBS registered?',
      a: 'Yes, absolutely! Every single smartphone sold at Nawira Traders is 100% officially PTA Approved with all Pakistani customs duties and taxes paid in full. You can verify the IMEI on the official PTA DIRBS portal (dirbs.pta.gov.pk) or by sending SMS to 8484.',
    },
    {
      q: 'How does Open-Parcel Delivery work?',
      a: 'With our Open-Parcel Cash on Delivery (COD) service, you can open and physically inspect the sealed mobile parcel in front of the courier rider before paying cash. If the box is damaged or incorrect, you can reject it on the spot with zero financial obligation.',
    },
    {
      q: 'How do I claim the 1-Year Official Brand Warranty?',
      a: 'Your smartphone comes with an official brand warranty valid at all authorized service centers nationwide across Pakistan. Simply present the invoice from Nawira Traders and the stamped warranty card inside the box.',
    },
    {
      q: 'How does the 0% Markup Monthly Installment work?',
      a: 'We offer zero-markup installment plans for 3, 6, and 12 months with leading Pakistani bank credit cards, including Bank Alfalah, Meezan Bank, Faysal Bank, and Silkbank.',
    },
  ];

  return (
    <div className="min-h-screen bg-[#f1f3f6] text-slate-900 flex flex-col font-sans selection:bg-[#48afff] selection:text-white w-full max-w-full overflow-x-hidden">
      {/* Universal Store Header */}
      <Navbar
        compareCount={comparingPhones.length}
        cartCount={cartItems.reduce((sum, i) => sum + i.quantity, 0)}
        onOpenCart={() => setIsCartOpen(true)}
        onOpenCompare={() => setIsCompareModalOpen(true)}
        activeBrand={phone.brand}
      />

      <main className="flex-1 max-w-7xl w-full mx-auto px-3 sm:px-6 lg:px-8 py-4 sm:py-5 pb-24 lg:pb-8">
        {/* PriceOye Styled Breadcrumbs */}
        <nav
          aria-label="Breadcrumb"
          className="flex items-center gap-1.5 text-xs text-slate-500 font-semibold mb-5 overflow-x-auto whitespace-nowrap scrollbar-none py-1"
        >
          <Link
            href="/"
            className="hover:text-[#0b3c68] transition-colors flex items-center gap-1 text-slate-500 hover:underline shrink-0"
          >
            <span>Home</span>
          </Link>
          <ChevronRight className="w-3.5 h-3.5 text-slate-400 shrink-0" />
          <Link href="/" className="hover:text-[#0b3c68] transition-colors text-slate-500 hover:underline shrink-0">
            <span>Mobiles</span>
          </Link>
          <ChevronRight className="w-3.5 h-3.5 text-slate-400 shrink-0" />
          <Link
            href={`/?brand=${encodeURIComponent(phone.brand)}#catalog`}
            className="hover:text-[#0b3c68] transition-colors text-slate-600 hover:underline capitalize shrink-0"
          >
            {phone.brand}
          </Link>
          <ChevronRight className="w-3.5 h-3.5 text-slate-400 shrink-0" />
          <span className="text-[#0b3c68] font-black truncate max-w-xs sm:max-w-md shrink-0">
            {phone.name}
          </span>
        </nav>

        {/* 2-Column Hero Showcase & Buy Box */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-8 items-start">
          {/* Left Column: Premium Image Gallery (PriceOye Showcase) */}
          <div className="lg:col-span-5 xl:col-span-5 space-y-4 lg:sticky lg:top-24">
            {/* Main Showcase Elevated Card */}
            <div className="relative w-full h-[300px] sm:h-[460px] bg-white rounded-3xl p-4 sm:p-10 border border-slate-200/80 shadow-[0_2px_16px_rgba(0,0,0,0.04)] flex items-center justify-center overflow-hidden group">
              {/* Product cutout image with subtle hover zoom */}
              <div className="w-full h-full flex items-center justify-center transition-transform duration-300 group-hover:scale-105">
                <PhoneImageWithFallback
                  src={selectedColor.image}
                  alt={`${phone.name} - ${selectedColor.name}`}
                  brand={phone.brand}
                  className="w-full h-full object-contain"
                  priority={true}
                />
              </div>

              {/* PriceOye Orange Discount Pill */}
              {phone.discountPercent > 0 && (
                <div className="absolute top-4 left-4 flex flex-col gap-1.5 z-10">
                  <span className="px-3 py-1 rounded-full text-xs font-black bg-[#fef3eb] text-[#f47708] border border-[#fcd5b8] shadow-xs flex items-center gap-1">
                    <Sparkles className="w-3 h-3 text-[#f47708]" />
                    {phone.discountPercent}% OFF
                  </span>
                  {phone.isTrending && (
                    <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-rose-50 text-rose-600 border border-rose-200 shadow-xs flex items-center gap-1">
                      <Flame className="w-3 h-3 text-rose-500 fill-rose-500" />
                      Trending
                    </span>
                  )}
                </div>
              )}

              {/* Compare Button Pill */}
              <button
                onClick={() => handleToggleCompare(phone)}
                className={`absolute top-4 right-4 z-10 flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-extrabold transition-all shadow-xs ${
                  comparingPhones.some((p) => p.id === phone.id)
                    ? 'bg-[#0b3c68] text-white ring-2 ring-[#48afff]'
                    : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
                }`}
                title="Compare hardware specs with other smartphones"
              >
                <Layers className="w-3.5 h-3.5" />
                <span>
                  {comparingPhones.some((p) => p.id === phone.id)
                    ? 'In Compare'
                    : 'Compare Spec'}
                </span>
              </button>

              {/* Watermark/Warranty Badge */}
              <div className="absolute bottom-4 left-4 z-10 flex items-center gap-1.5 bg-slate-900/5 backdrop-blur-xs px-2.5 py-1 rounded-full text-[11px] font-bold text-slate-600 border border-slate-200/50">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                <span>100% Genuine Sealed</span>
              </div>
            </div>

            {/* PriceOye Style Visual Color Swatches with Miniature Images */}
            <div className="bg-white rounded-2xl p-4 border border-slate-200/80 shadow-[0_2px_12px_rgba(0,0,0,0.03)] space-y-2.5">
              <div className="flex items-center justify-between text-xs">
                <span className="font-extrabold text-slate-500 uppercase tracking-wider">
                  Available Colors:
                </span>
                <span className="font-black text-[#0b3c68]">{selectedColor.name}</span>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                {phone.colors.map((color) => {
                  const isSelected = selectedColor.name === color.name;
                  const isColInStock =
                    color.inStock !== false &&
                    (!phone.colorStockMap ||
                      !phone.colorStockMap[color.name] ||
                      phone.colorStockMap[color.name].inStock);
                  return (
                    <button
                      key={color.name}
                      onClick={() => setSelectedColor(color)}
                      className={`relative flex items-center gap-2.5 p-2 rounded-xl border text-left transition-all cursor-pointer ${
                        isSelected
                          ? 'border-[#0b3c68] bg-[#0b3c68]/5 ring-2 ring-[#48afff]/50 shadow-sm'
                          : 'border-slate-200 hover:border-slate-300 bg-white'
                      } ${!isColInStock ? 'opacity-50' : ''}`}
                    >
                      {/* Mini Image thumbnail */}
                      <div className="w-9 h-9 rounded-lg bg-white flex items-center justify-center p-0.5 border border-slate-200 shrink-0">
                        <PhoneImageWithFallback
                          src={color.image}
                          alt={color.name}
                          brand={phone.brand}
                          className="w-full h-full object-contain"
                        />
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="text-[11px] font-bold text-slate-900 truncate">
                          {color.name}
                        </div>
                        <div className="text-[9px] font-bold">
                          {isColInStock ? (
                            <span className="text-emerald-600">In Stock</span>
                          ) : (
                            <span className="text-rose-500">Out of Stock</span>
                          )}
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* 4 Instant Delivery & Trust Badges under Gallery */}
            <div className="grid grid-cols-2 gap-2.5">
              <div className="bg-white p-3 rounded-2xl border border-slate-200/80 shadow-[0_2px_8px_rgba(0,0,0,0.02)] flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
                  <ShieldCheck className="w-4 h-4" />
                </div>
                <div>
                  <div className="text-xs font-black text-slate-900">PTA Approved</div>
                  <div className="text-[10px] text-slate-500 font-medium">100% Tax &amp; Duty Paid</div>
                </div>
              </div>

              <div className="bg-white p-3 rounded-2xl border border-slate-200/80 shadow-[0_2px_8px_rgba(0,0,0,0.02)] flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-full bg-blue-50 text-[#0b3c68] flex items-center justify-center shrink-0">
                  <PackageCheck className="w-4 h-4" />
                </div>
                <div>
                  <div className="text-xs font-black text-slate-900">Open-Parcel COD</div>
                  <div className="text-[10px] text-slate-500 font-medium">Inspect before pay</div>
                </div>
              </div>

              <div className="bg-white p-3 rounded-2xl border border-slate-200/80 shadow-[0_2px_8px_rgba(0,0,0,0.02)] flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-full bg-amber-50 text-amber-600 flex items-center justify-center shrink-0">
                  <Award className="w-4 h-4" />
                </div>
                <div>
                  <div className="text-xs font-black text-slate-900">Official Warranty</div>
                  <div className="text-[10px] text-slate-500 font-medium">1-Year Brand Claim</div>
                </div>
              </div>

              <div className="bg-white p-3 rounded-2xl border border-slate-200/80 shadow-[0_2px_8px_rgba(0,0,0,0.02)] flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-full bg-indigo-50 text-indigo-600 flex items-center justify-center shrink-0">
                  <Truck className="w-4 h-4" />
                </div>
                <div>
                  <div className="text-xs font-black text-slate-900">Express Delivery</div>
                  <div className="text-[10px] text-slate-500 font-medium">24-48h Dispatch</div>
                </div>
              </div>
            </div>
          </div>

          {/* Right Column: Info, PriceOye Buy Box & Actions */}
          <div className="lg:col-span-7 xl:col-span-7 space-y-5">
            {/* Header & Product Identity */}
            <div className="bg-white rounded-3xl p-5 sm:p-7 border border-slate-200/80 shadow-[0_2px_16px_rgba(0,0,0,0.04)] space-y-4">
              {/* Brand & PTA Status Badges */}
              <div className="flex items-center gap-2 flex-wrap">
                <span className="px-3 py-1 rounded-lg text-xs font-black uppercase tracking-wider bg-slate-100 text-[#0b3c68] border border-slate-200">
                  {phone.brand}
                </span>
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-black bg-emerald-50 text-emerald-700 border border-emerald-200">
                  <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                  100% PTA Approved (DIRBS Verified)
                </span>
                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-extrabold bg-sky-50 text-[#0b3c68] border border-sky-100">
                  <Award className="w-3.5 h-3.5 text-[#48afff]" />
                  Official Warranty
                </span>
              </div>

              {/* Product Title */}
              <div>
                <h1 className="text-2xl sm:text-3xl lg:text-4xl font-black text-slate-950 tracking-tight leading-tight">
                  {phone.name}
                </h1>
                <p className="text-xs sm:text-sm text-slate-500 mt-1.5 font-medium leading-relaxed">
                  {phone.tagline ||
                    `Official ${phone.brand} Smartphone with 1-Year Brand Warranty, PTA Approval & Open-Parcel Delivery in Pakistan.`}
                </p>
              </div>

              {/* Rating & Social Proof Bar */}
              <div className="flex items-center gap-3 pt-1 border-t border-slate-100 flex-wrap text-xs">
                <div className="flex items-center gap-1 bg-amber-50 px-2 py-0.5 rounded-md border border-amber-200 text-amber-700 font-black">
                  <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                  <span>{phone.rating}</span>
                </div>
                <span className="text-slate-500 font-semibold">
                  {phone.reviewCount} Ratings &amp; Reviews
                </span>
                <span className="text-slate-300">•</span>
                <span className="text-emerald-700 font-bold flex items-center gap-1">
                  <ThumbsUp className="w-3.5 h-3.5 text-emerald-600" />
                  98% Recommended by Buyers
                </span>
                <span className="text-slate-300">•</span>
                <span className="text-slate-500 font-semibold">
                  🔥 150+ Sold This Month
                </span>
              </div>
            </div>

            {/* PriceOye Signature Price Container */}
            <div className="bg-white rounded-3xl p-5 sm:p-7 border border-slate-200/80 shadow-[0_2px_16px_rgba(0,0,0,0.04)] space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-xs font-extrabold uppercase tracking-wider text-slate-500">
                  Nawira Traders Best Price
                </span>
                {/* Stock Status Badge */}
                {isSelectionInStock ? (
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-black bg-emerald-50 text-emerald-700 border border-emerald-200">
                    <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                    {currentStockQty > 0 && currentStockQty <= 10
                      ? `In Stock (Only ${currentStockQty} units left)`
                      : 'In Stock & Ready to Dispatch'}
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-black bg-rose-50 text-rose-700 border border-rose-200">
                    <span className="w-2 h-2 rounded-full bg-rose-500"></span>
                    Out of Stock ({selectedColor.name})
                  </span>
                )}
              </div>

              {/* Price Typography */}
              <div className="flex items-baseline gap-3 flex-wrap">
                <div className="flex items-baseline gap-1 text-[#0b3c68]">
                  <sup className="text-lg font-black top-[-0.3em]">Rs</sup>
                  <span className="text-3xl sm:text-4xl lg:text-5xl font-black tracking-tight">
                    {currentPrice.toLocaleString('en-PK')}
                  </span>
                </div>

                {currentOriginalPrice > currentPrice && (
                  <div className="flex items-center gap-2">
                    <span className="text-base sm:text-lg text-slate-400 line-through font-semibold">
                      Rs {currentOriginalPrice.toLocaleString('en-PK')}
                    </span>
                    <span className="px-2.5 py-0.5 rounded-lg text-xs font-black bg-[#fef3eb] text-[#f47708] border border-[#fcd5b8]">
                      {Math.round(((currentOriginalPrice - currentPrice) / currentOriginalPrice) * 100)}% OFF
                    </span>
                  </div>
                )}
              </div>

              {/* Savings Announcement */}
              {savings > 0 && (
                <div className="p-3 rounded-2xl bg-gradient-to-r from-emerald-50 to-teal-50 border border-emerald-200/80 text-emerald-800 text-xs font-bold flex items-center gap-2">
                  <Zap className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span>
                    ⚡ Nawira Traders Guarantee: You save{' '}
                    <strong className="font-black text-emerald-900">{formatPKR(savings)}</strong> on
                    this model with Free Nationwide Shipping!
                  </span>
                </div>
              )}

              {/* Variant / Storage Chips (PriceOye Style) */}
              <div className="space-y-2 pt-2 border-t border-slate-100">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-extrabold uppercase tracking-wider text-slate-500">
                    Select Storage &amp; RAM:
                  </span>
                  <span className="font-black text-[#0b3c68]">
                    {selectedVariant.ram} - {selectedVariant.storage}
                  </span>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
                  {phone.variants.map((variant) => {
                    const isSelected = selectedVariant.id === variant.id;
                    const isVarInStock = variant.inStock ?? true;
                    return (
                      <button
                        key={variant.id}
                        onClick={() => setSelectedVariant(variant)}
                        className={`p-3 rounded-2xl border text-left transition-all cursor-pointer ${
                          isSelected
                            ? 'border-[#0b3c68] bg-[#0b3c68]/5 ring-2 ring-[#48afff]/50 shadow-sm'
                            : 'border-slate-200 hover:border-slate-300 bg-white'
                        } ${!isVarInStock ? 'opacity-50' : ''}`}
                      >
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-black text-slate-900">
                            {variant.ram} - {variant.storage}
                          </span>
                          {isSelected && (
                            <span className="w-4 h-4 rounded-full bg-[#0b3c68] text-white flex items-center justify-center text-[10px]">
                              <Check className="w-3 h-3 stroke-[3]" />
                            </span>
                          )}
                        </div>
                        <div className="text-xs font-extrabold text-[#0b3c68] mt-1">
                          {formatPKR(variant.pricePKR)}
                        </div>
                        {!isVarInStock && (
                          <div className="text-[10px] font-bold text-rose-500 mt-0.5">
                            Out of Stock
                          </div>
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* PriceOye Style Add-Ons (Gift Wrap & Warranty Protection) */}
              <div className="space-y-2.5 pt-2 border-t border-slate-100">
                <div className="text-xs font-extrabold uppercase tracking-wider text-slate-500">
                  Value Add-Ons:
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  {/* Gift Wrap Addon */}
                  <label
                    className={`flex items-start gap-3 p-3 rounded-2xl border cursor-pointer transition-all ${
                      addGiftWrap
                        ? 'border-[#0b3c68] bg-[#0b3c68]/5 ring-1 ring-[#0b3c68]'
                        : 'border-slate-200 hover:border-slate-300 bg-white'
                    }`}
                  >
                    <input
                      type="checkbox"
                      checked={addGiftWrap}
                      onChange={(e) => setAddGiftWrap(e.target.checked)}
                      className="mt-0.5 h-4 w-4 rounded text-[#0b3c68] focus:ring-[#48afff] border-slate-300"
                    />
                    <div className="text-xs">
                      <div className="font-black text-slate-900 flex items-center gap-1.5">
                        <Gift className="w-3.5 h-3.5 text-[#f47708]" />
                        <span>Premium Gift Wrapping</span>
                      </div>
                      <div className="text-[11px] text-slate-500 mt-0.5">
                        Cost: <strong className="text-slate-900">Rs 199</strong> (Includes customized card)
                      </div>
                    </div>
                  </label>

                  {/* Screen Protection Addon */}
                  <label
                    className={`flex items-start gap-3 p-3 rounded-2xl border cursor-pointer transition-all ${
                      addScreenProtection
                        ? 'border-[#0b3c68] bg-[#0b3c68]/5 ring-1 ring-[#0b3c68]'
                        : 'border-slate-200 hover:border-slate-300 bg-white'
                    }`}
                  >
                    <input
                      type="checkbox"
                      checked={addScreenProtection}
                      onChange={(e) => setAddScreenProtection(e.target.checked)}
                      className="mt-0.5 h-4 w-4 rounded text-[#0b3c68] focus:ring-[#48afff] border-slate-300"
                    />
                    <div className="text-xs">
                      <div className="font-black text-slate-900 flex items-center gap-1.5">
                        <Shield className="w-3.5 h-3.5 text-[#0b3c68]" />
                        <span>1-Year Screen Protection</span>
                      </div>
                      <div className="text-[11px] text-slate-500 mt-0.5">
                        Cost: <strong className="text-slate-900">Rs 999</strong> (50% crack coverage)
                      </div>
                    </div>
                  </label>
                </div>
              </div>

              {/* PriceOye 0% Markup Monthly Installment (EMI) Box */}
              <div className="p-4 rounded-2xl bg-gradient-to-br from-slate-50 to-blue-50/40 border border-slate-200 space-y-2.5">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-xs font-black text-slate-900">
                    <CreditCard className="w-4 h-4 text-[#0b3c68]" />
                    <span>0% Markup Monthly Installments</span>
                  </div>
                  <span className="text-xs font-black text-[#0b3c68]">
                    {formatPKR(monthlyInstallment)} / mo
                  </span>
                </div>

                <div className="flex items-center gap-2">
                  {[3, 6, 12].map((tenure) => (
                    <button
                      key={tenure}
                      onClick={() => setSelectedTenure(tenure)}
                      className={`flex-1 py-1.5 rounded-xl text-xs font-extrabold transition-all cursor-pointer ${
                        selectedTenure === tenure
                          ? 'bg-[#0b3c68] text-white shadow-sm ring-2 ring-[#48afff]'
                          : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
                      }`}
                    >
                      {tenure} Months
                    </button>
                  ))}
                </div>

                <div className="flex items-center justify-between text-[11px] text-slate-500 pt-1">
                  <span>Supported Credit Cards:</span>
                  <span className="font-bold text-slate-700">
                    Bank Alfalah • Meezan • Faysal • Silkbank
                  </span>
                </div>
              </div>

              {/* Dynamic Estimated Delivery & Cutoff Countdown */}
              <DeliveryEstimatorCountdown className="mt-2" />

              {/* Old Phone Trade-In & Exchange Banner Button */}
              <button
                type="button"
                onClick={() => setIsTradeInModalOpen(true)}
                className="w-full p-3.5 rounded-2xl bg-gradient-to-r from-emerald-50/90 via-teal-50/60 to-sky-50/80 border border-emerald-200/90 hover:border-emerald-300 transition-all flex items-center justify-between group cursor-pointer text-left shadow-2xs mt-2"
              >
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-xl bg-emerald-600 text-white flex items-center justify-center shrink-0 shadow-2xs group-hover:scale-105 transition-transform">
                    <RefreshCw className="w-4 h-4" />
                  </div>
                  <div>
                    <div className="text-xs font-black text-slate-900 flex items-center gap-1.5">
                      <span>Exchange &amp; Upgrade Program</span>
                      <span className="text-[10px] font-black uppercase px-1.5 py-0.2 rounded-md bg-emerald-200 text-emerald-900">
                        Doorstep Swap
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-500 font-medium">
                      Trade in your old handset for instant cash credit towards {phone.name}.
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-1 text-emerald-700 text-xs font-bold shrink-0">
                  <span>Estimate</span>
                  <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
                </div>
              </button>

              {/* Stock Warning Notice */}
              {!isSelectionInStock && (
                <div className="p-3.5 rounded-2xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-center gap-2.5">
                  <span className="text-lg">⚠️</span>
                  <div>
                    <div className="font-black">Currently Unavailable to Order:</div>
                    <div className="text-[11px] text-rose-600 mt-0.5 font-medium">
                      {!isPhoneInStock
                        ? 'This smartphone is temporarily out of stock across all warehouses.'
                        : !isColorInStock
                        ? `The ${selectedColor.name} color is sold out. Please select an in-stock color.`
                        : 'This storage/RAM configuration is sold out. Please select another configuration.'}
                    </div>
                  </div>
                </div>
              )}

              {/* CTA Action Buttons */}
              <div className="space-y-2.5 pt-1">
                <div className="grid grid-cols-2 gap-3">
                  {/* Add to Cart CTA */}
                  <button
                    onClick={handleAddToCart}
                    disabled={!isSelectionInStock}
                    className={`py-3.5 px-5 rounded-2xl text-xs sm:text-sm font-extrabold transition-all shadow-md flex items-center justify-center gap-2 ${
                      isSelectionInStock
                        ? 'bg-[#0b3c68] hover:bg-[#072846] text-white cursor-pointer shadow-[#0b3c68]/20 btn-press'
                        : 'bg-slate-200 text-slate-400 cursor-not-allowed border border-slate-300 shadow-none'
                    }`}
                  >
                    <ShoppingCart className="w-4 h-4" />
                    <span>{isSelectionInStock ? 'Add to Cart' : 'Out of Stock'}</span>
                  </button>

                  {/* Buy Now (Open-Parcel COD) CTA */}
                  <button
                    onClick={() => {
                      if (isSelectionInStock) {
                        trackCheckoutStart({
                          phoneId: phone.id,
                          name: phone.name,
                          brand: phone.brand,
                          slug: phone.slug,
                          image: selectedColor?.image || phone.colors[0]?.image,
                          pricePKR: currentPrice,
                        });
                        setIsQuickBuyOpen(true);
                      }
                    }}
                    disabled={!isSelectionInStock}
                    className={`py-3.5 px-5 rounded-2xl text-xs sm:text-sm font-extrabold transition-all shadow-lg flex items-center justify-center gap-2 ${
                      isSelectionInStock
                        ? 'bg-[#48afff] hover:bg-[#229eff] text-white shadow-[#48afff]/30 cursor-pointer btn-press'
                        : 'bg-slate-200 text-slate-400 cursor-not-allowed border border-slate-300 shadow-none'
                    }`}
                  >
                    <Zap className="w-4 h-4" />
                    <span>{isSelectionInStock ? 'Buy Now (COD)' : 'Unavailable'}</span>
                  </button>
                </div>

                {/* Direct WhatsApp Instant Order Button */}
                <a
                  href={`https://wa.me/923135221200?text=Hi%20Nawira%20Traders!%20I%20want%20to%20order%20the%20${encodeURIComponent(
                    phone.name
                  )}%20(${encodeURIComponent(selectedColor.name)},%20${encodeURIComponent(
                    selectedVariant.ram
                  )}/${encodeURIComponent(selectedVariant.storage)})%20for%20${encodeURIComponent(
                    formatPKR(currentPrice)
                  )}%20with%20Open-Parcel%20COD.`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full py-3.5 px-5 rounded-2xl bg-[#25D366] hover:bg-[#20ba5a] text-white font-black text-xs sm:text-sm transition-all shadow-lg shadow-emerald-600/25 flex items-center justify-center gap-2 cursor-pointer btn-press"
                >
                  <MessageSquare className="w-4 h-4 fill-white/20" />
                  <span>Order via WhatsApp (+92 313 5221200)</span>
                </a>
              </div>
            </div>
          </div>
        </div>

        {/* =========================================================================
            PRICE OYE HALLMARK: "ASLI WARRANTY CHALLENGE" (Double Paisay Wapis Guarantee)
           ========================================================================= */}
        <section className="mt-10 bg-gradient-to-r from-[#0b2b4a] via-[#0f497a] to-[#136ab5] rounded-3xl p-6 sm:p-8 text-white shadow-xl relative overflow-hidden">
          <div className="absolute right-0 top-0 bottom-0 w-1/3 bg-radial from-white/10 to-transparent pointer-events-none"></div>

          <div className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-6">
            <div className="flex items-center gap-4 text-left">
              <div className="w-14 h-14 rounded-2xl bg-white/15 backdrop-blur-md border border-white/25 flex items-center justify-center shrink-0">
                <ShieldCheck className="w-8 h-8 text-[#48afff]" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-xs uppercase font-black tracking-widest text-sky-200">
                    Nawira Traders Assurance
                  </span>
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-[#fef3eb] text-[#f47708]">
                    2x Money Back
                  </span>
                </div>
                <h2 className="text-xl sm:text-2xl font-black text-white tracking-tight">
                  ASLI WARRANTY CHALLENGE — 100% Genuine Sealed
                </h2>
                <p className="text-xs sm:text-sm text-sky-100 max-w-xl mt-1 leading-relaxed">
                  Never risk non-PTA, refurbished, or fake handsets. We guarantee 100% factory-sealed
                  phones with active brand warranties and official PTA DIRBS customs verification.
                </p>
              </div>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 w-full md:w-auto shrink-0">
              <div className="bg-white/10 backdrop-blur-md p-3 rounded-2xl border border-white/15 text-center">
                <div className="text-sm font-black text-white">100% PTA</div>
                <div className="text-[10px] text-sky-200">Customs Cleared</div>
              </div>
              <div className="bg-white/10 backdrop-blur-md p-3 rounded-2xl border border-white/15 text-center">
                <div className="text-sm font-black text-white">Open Parcel</div>
                <div className="text-[10px] text-sky-200">Inspect On Delivery</div>
              </div>
              <div className="bg-white/10 backdrop-blur-md p-3 rounded-2xl border border-white/15 text-center">
                <div className="text-sm font-black text-white">1-Year</div>
                <div className="text-[10px] text-sky-200">Brand Warranty</div>
              </div>
              <div className="bg-white/10 backdrop-blur-md p-3 rounded-2xl border border-white/15 text-center">
                <div className="text-sm font-black text-white">0% Markup</div>
                <div className="text-[10px] text-sky-200">Easy Installments</div>
              </div>
            </div>
          </div>
        </section>

        {/* =========================================================================
            PRICE OYE STYLE: PRODUCT HIGHLIGHTS (Visual Cards with Icons & Emojis)
           ========================================================================= */}
        <section className="mt-10 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight flex items-center gap-2">
                <span>Key Hardware Highlights</span>
                <span className="text-xs font-black px-2.5 py-0.5 rounded-full bg-sky-100 text-[#0b3c68]">
                  Verified
                </span>
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Core performance, camera, display, and battery specifications for {phone.name}
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {/* Display Highlight */}
            <div className="bg-white p-5 rounded-3xl border border-slate-200/80 shadow-[0_2px_12px_rgba(0,0,0,0.03)] flex items-start gap-4 hover:shadow-md transition-shadow">
              <div className="w-12 h-12 rounded-2xl bg-sky-50 text-[#0b3c68] flex items-center justify-center shrink-0 border border-sky-100">
                <PhoneIcon className="w-6 h-6 text-[#48afff]" />
              </div>
              <div>
                <div className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                  Display &amp; Refresh Rate
                </div>
                <div className="text-sm font-black text-slate-900 mt-0.5">
                  {phone.keyHighlights?.display || phone.specs.screen}
                </div>
                <div className="text-xs text-slate-500 font-medium mt-1">
                  {phone.specs.refreshRate} • {phone.specs.displayType || 'Vibrant Color Touchscreen'}
                </div>
              </div>
            </div>

            {/* Processor Highlight */}
            <div className="bg-white p-5 rounded-3xl border border-slate-200/80 shadow-[0_2px_12px_rgba(0,0,0,0.03)] flex items-start gap-4 hover:shadow-md transition-shadow">
              <div className="w-12 h-12 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center shrink-0 border border-indigo-100">
                <Cpu className="w-6 h-6 text-indigo-500" />
              </div>
              <div>
                <div className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                  Processor &amp; Performance
                </div>
                <div className="text-sm font-black text-slate-900 mt-0.5">
                  {phone.keyHighlights?.processor || phone.specs.processor}
                </div>
                <div className="text-xs text-slate-500 font-medium mt-1">
                  Fast multitasking &amp; lag-free app performance
                </div>
              </div>
            </div>

            {/* Camera Highlight */}
            <div className="bg-white p-5 rounded-3xl border border-slate-200/80 shadow-[0_2px_12px_rgba(0,0,0,0.03)] flex items-start gap-4 hover:shadow-md transition-shadow">
              <div className="w-12 h-12 rounded-2xl bg-rose-50 text-rose-600 flex items-center justify-center shrink-0 border border-rose-100">
                <Camera className="w-6 h-6 text-rose-500" />
              </div>
              <div>
                <div className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                  Camera System
                </div>
                <div className="text-sm font-black text-slate-900 mt-0.5">
                  {phone.keyHighlights?.camera || phone.specs.mainCamera} Primary
                </div>
                <div className="text-xs text-slate-500 font-medium mt-1">
                  Front: {phone.specs.selfieCamera} • AI HDR Photography
                </div>
              </div>
            </div>

            {/* Battery Highlight */}
            <div className="bg-white p-5 rounded-3xl border border-slate-200/80 shadow-[0_2px_12px_rgba(0,0,0,0.03)] flex items-start gap-4 hover:shadow-md transition-shadow">
              <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0 border border-emerald-100">
                <Battery className="w-6 h-6 text-emerald-500" />
              </div>
              <div>
                <div className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                  Battery &amp; Endurance
                </div>
                <div className="text-sm font-black text-slate-900 mt-0.5">
                  {phone.keyHighlights?.battery || phone.specs.battery}
                </div>
                <div className="text-xs text-slate-500 font-medium mt-1">
                  Up to 2 days standby &amp; all-day heavy gaming
                </div>
              </div>
            </div>

            {/* Fast Charging Highlight */}
            <div className="bg-white p-5 rounded-3xl border border-slate-200/80 shadow-[0_2px_12px_rgba(0,0,0,0.03)] flex items-start gap-4 hover:shadow-md transition-shadow">
              <div className="w-12 h-12 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center shrink-0 border border-amber-100">
                <Zap className="w-6 h-6 text-amber-500" />
              </div>
              <div>
                <div className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                  Charging Speed
                </div>
                <div className="text-sm font-black text-slate-900 mt-0.5">
                  {phone.keyHighlights?.charging || phone.specs.charging}
                </div>
                <div className="text-xs text-slate-500 font-medium mt-1">
                  Type-C fast power replenishment
                </div>
              </div>
            </div>

            {/* Security & OS */}
            <div className="bg-white p-5 rounded-3xl border border-slate-200/80 shadow-[0_2px_12px_rgba(0,0,0,0.03)] flex items-start gap-4 hover:shadow-md transition-shadow">
              <div className="w-12 h-12 rounded-2xl bg-teal-50 text-teal-600 flex items-center justify-center shrink-0 border border-teal-100">
                <ShieldCheck className="w-6 h-6 text-teal-600" />
              </div>
              <div>
                <div className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                  Security &amp; OS
                </div>
                <div className="text-sm font-black text-slate-900 mt-0.5">
                  {phone.specs.security || 'Biometric Security'}
                </div>
                <div className="text-xs text-slate-500 font-medium mt-1">
                  {phone.specs.os || 'Official Android Operating System'}
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* =========================================================================
            PRICE OYE STYLE: "WHAT'S IN THE BOX" PACKAGING SECTION
           ========================================================================= */}
        <section className="mt-10 bg-white rounded-3xl p-6 sm:p-8 border border-slate-200/80 shadow-[0_2px_16px_rgba(0,0,0,0.04)] space-y-4">
          <div className="flex items-center gap-2">
            <Box className="w-5 h-5 text-[#0b3c68]" />
            <h2 className="text-xl font-black text-slate-900 tracking-tight">
              What&apos;s Inside the Box
            </h2>
          </div>
          <p className="text-xs text-slate-500">
            Standard factory packaging included with {phone.name}
          </p>

          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 pt-2">
            {[
              { title: 'Smartphone', desc: '1x Handset', icon: '📱' },
              { title: 'Fast Charger', desc: '1x Power Adapter', icon: '🔌' },
              { title: 'Type-C Cable', desc: '1x Sync & Charge', icon: '⚡' },
              { title: 'Protective Case', desc: '1x Silicone Cover', icon: '🛡️' },
              { title: 'SIM Ejector', desc: '1x Ejector Pin', icon: '📍' },
              { title: 'Warranty Card', desc: '1x Official Document', icon: '📖' },
            ].map((item) => (
              <div
                key={item.title}
                className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200/80 text-center flex flex-col items-center justify-center"
              >
                <span className="text-2xl mb-1">{item.icon}</span>
                <div className="text-xs font-black text-slate-900">{item.title}</div>
                <div className="text-[10px] text-slate-500 font-semibold">{item.desc}</div>
              </div>
            ))}
          </div>
        </section>

        {/* =========================================================================
            PRICE OYE STYLE: CATEGORIZED TECHNICAL SPECIFICATIONS TABLE
           ========================================================================= */}
        <section className="mt-10 bg-white rounded-3xl p-6 sm:p-8 border border-slate-200/80 shadow-[0_2px_16px_rgba(0,0,0,0.04)] space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
                Detailed Technical Specifications
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Official verified hardware specifications for {phone.name}
              </p>
            </div>
          </div>

          <div className="divide-y divide-slate-100">
            {/* General Section */}
            <div className="py-4">
              <h3 className="text-xs font-black uppercase tracking-wider text-[#0b3c68] mb-3 flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-[#48afff]"></span>
                General &amp; Build
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
                <div className="flex justify-between p-3 rounded-xl bg-slate-50">
                  <span className="font-bold text-slate-400">Brand:</span>
                  <span className="font-extrabold text-slate-900 capitalize">{phone.brand}</span>
                </div>
                <div className="flex justify-between p-3 rounded-xl bg-slate-50">
                  <span className="font-bold text-slate-400">Model Name:</span>
                  <span className="font-extrabold text-slate-900">{phone.name}</span>
                </div>
                <div className="flex justify-between p-3 rounded-xl bg-slate-50">
                  <span className="font-bold text-slate-400">PTA Status:</span>
                  <span className="font-extrabold text-emerald-700">{phone.specs.ptaStatus}</span>
                </div>
                <div className="flex justify-between p-3 rounded-xl bg-slate-50">
                  <span className="font-bold text-slate-400">Weight:</span>
                  <span className="font-extrabold text-slate-900">{phone.specs.weight}</span>
                </div>
                <div className="flex justify-between p-3 rounded-xl bg-slate-50">
                  <span className="font-bold text-slate-400">Water Resistance:</span>
                  <span className="font-extrabold text-slate-900">
                    {phone.specs.waterResistance || 'Everyday Splash Resistance'}
                  </span>
                </div>
                <div className="flex justify-between p-3 rounded-xl bg-slate-50">
                  <span className="font-bold text-slate-400">Official Warranty:</span>
                  <span className="font-extrabold text-[#0b3c68]">{phone.specs.warranty}</span>
                </div>
              </div>
            </div>

            {/* Display Section */}
            <div className="py-4">
              <h3 className="text-xs font-black uppercase tracking-wider text-[#0b3c68] mb-3 flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-[#48afff]"></span>
                Display &amp; Screen
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
                <div className="flex justify-between p-3 rounded-xl bg-slate-50">
                  <span className="font-bold text-slate-400">Screen Size:</span>
                  <span className="font-extrabold text-slate-900">{phone.specs.screen}</span>
                </div>
                <div className="flex justify-between p-3 rounded-xl bg-slate-50">
                  <span className="font-bold text-slate-400">Display Technology:</span>
                  <span className="font-extrabold text-slate-900">
                    {phone.specs.displayType || 'Capacitive Multi-touch Screen'}
                  </span>
                </div>
                <div className="flex justify-between p-3 rounded-xl bg-slate-50">
                  <span className="font-bold text-slate-400">Refresh Rate:</span>
                  <span className="font-extrabold text-slate-900">{phone.specs.refreshRate}</span>
                </div>
              </div>
            </div>

            {/* Performance Section */}
            <div className="py-4">
              <h3 className="text-xs font-black uppercase tracking-wider text-[#0b3c68] mb-3 flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-[#48afff]"></span>
                Performance &amp; Hardware
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
                <div className="flex justify-between p-3 rounded-xl bg-slate-50">
                  <span className="font-bold text-slate-400">Processor &amp; Chipset:</span>
                  <span className="font-extrabold text-slate-900">{phone.specs.processor}</span>
                </div>
                <div className="flex justify-between p-3 rounded-xl bg-slate-50">
                  <span className="font-bold text-slate-400">Chipset Brand:</span>
                  <span className="font-extrabold text-slate-900">{phone.specs.chipsetBrand}</span>
                </div>
                <div className="flex justify-between p-3 rounded-xl bg-slate-50">
                  <span className="font-bold text-slate-400">Operating System:</span>
                  <span className="font-extrabold text-slate-900">{phone.specs.os}</span>
                </div>
                <div className="flex justify-between p-3 rounded-xl bg-slate-50">
                  <span className="font-bold text-slate-400">Security &amp; Biometrics:</span>
                  <span className="font-extrabold text-slate-900">{phone.specs.security}</span>
                </div>
              </div>
            </div>

            {/* Camera Section */}
            <div className="py-4">
              <h3 className="text-xs font-black uppercase tracking-wider text-[#0b3c68] mb-3 flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-[#48afff]"></span>
                Camera &amp; Photography
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
                <div className="flex justify-between p-3 rounded-xl bg-slate-50">
                  <span className="font-bold text-slate-400">Rear Camera:</span>
                  <span className="font-extrabold text-slate-900">{phone.specs.mainCamera}</span>
                </div>
                <div className="flex justify-between p-3 rounded-xl bg-slate-50">
                  <span className="font-bold text-slate-400">Front Selfie Camera:</span>
                  <span className="font-extrabold text-slate-900">{phone.specs.selfieCamera}</span>
                </div>
              </div>
            </div>

            {/* Battery & Charging */}
            <div className="py-4">
              <h3 className="text-xs font-black uppercase tracking-wider text-[#0b3c68] mb-3 flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-[#48afff]"></span>
                Battery &amp; Charging
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
                <div className="flex justify-between p-3 rounded-xl bg-slate-50">
                  <span className="font-bold text-slate-400">Battery Capacity:</span>
                  <span className="font-extrabold text-slate-900">{phone.specs.battery}</span>
                </div>
                <div className="flex justify-between p-3 rounded-xl bg-slate-50">
                  <span className="font-bold text-slate-400">Charging Speed:</span>
                  <span className="font-extrabold text-slate-900">{phone.specs.charging}</span>
                </div>
              </div>
            </div>

            {/* Connectivity */}
            <div className="py-4">
              <h3 className="text-xs font-black uppercase tracking-wider text-[#0b3c68] mb-3 flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-[#48afff]"></span>
                Cellular &amp; Connectivity
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
                <div className="flex justify-between p-3 rounded-xl bg-slate-50">
                  <span className="font-bold text-slate-400">Network Support:</span>
                  <span className="font-extrabold text-slate-900">{phone.specs.network}</span>
                </div>
                <div className="flex justify-between p-3 rounded-xl bg-slate-50">
                  <span className="font-bold text-slate-400">SIM Slot:</span>
                  <span className="font-extrabold text-slate-900">Dual SIM (Nano-SIM)</span>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* =========================================================================
            PRICE OYE STYLE: CUSTOMER RATINGS & VERIFIED REVIEWS
           ========================================================================= */}
        <section className="mt-10 bg-white rounded-3xl p-6 sm:p-8 border border-slate-200/80 shadow-[0_2px_16px_rgba(0,0,0,0.04)] space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h2 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
                Customer Ratings &amp; Reviews
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Real feedback from verified purchasers in Pakistan
              </p>
            </div>
            <button
              onClick={() =>
                alert('Thank you! Please submit your review on WhatsApp or after receiving your parcel.')
              }
              className="px-4 py-2 rounded-xl text-xs font-extrabold bg-[#0b3c68] text-white hover:bg-[#48afff] transition-colors self-start sm:self-auto cursor-pointer"
            >
              Write a Review
            </button>
          </div>

          {/* Rating Breakdown Bar */}
          <div className="grid grid-cols-1 md:grid-cols-12 gap-6 p-5 rounded-2xl bg-slate-50 border border-slate-200/80 items-center">
            <div className="md:col-span-4 text-center md:text-left space-y-1">
              <div className="text-4xl sm:text-5xl font-black text-[#0b3c68]">
                {phone.rating}
                <span className="text-lg font-bold text-slate-400">/5</span>
              </div>
              <div className="flex items-center justify-center md:justify-start gap-1">
                {[...Array(5)].map((_, i) => (
                  <Star
                    key={i}
                    className="w-4 h-4 fill-amber-400 text-amber-400 stroke-amber-400"
                  />
                ))}
              </div>
              <div className="text-xs text-slate-500 font-semibold">
                Based on {phone.reviewCount} verified ratings
              </div>
            </div>

            <div className="md:col-span-8 space-y-1.5 text-xs">
              {[
                { star: 5, pct: 86 },
                { star: 4, pct: 10 },
                { star: 3, pct: 3 },
                { star: 2, pct: 1 },
                { star: 1, pct: 0 },
              ].map((row) => (
                <div key={row.star} className="flex items-center gap-2">
                  <span className="w-10 font-bold text-slate-600">{row.star} Star</span>
                  <div className="flex-1 h-2 rounded-full bg-slate-200 overflow-hidden">
                    <div
                      className="h-full bg-amber-400 rounded-full"
                      style={{ width: `${row.pct}%` }}
                    ></div>
                  </div>
                  <span className="w-8 text-right font-semibold text-slate-400 text-[11px]">
                    {row.pct}%
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Review Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {customerReviews.map((rev, idx) => (
              <div
                key={idx}
                className="p-4 rounded-2xl bg-white border border-slate-200/80 space-y-2 flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between">
                    <span className="font-extrabold text-xs text-slate-900">{rev.author}</span>
                    <span className="text-[10px] text-slate-400 font-medium">{rev.date}</span>
                  </div>
                  <div className="flex items-center gap-1.5 my-1">
                    <div className="flex items-center gap-0.5">
                      {[...Array(rev.rating)].map((_, i) => (
                        <Star
                          key={i}
                          className="w-3 h-3 fill-amber-400 text-amber-400 stroke-amber-400"
                        />
                      ))}
                    </div>
                    <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-200">
                      Verified Buyer ({rev.city})
                    </span>
                  </div>
                  <p className="text-xs text-slate-600 leading-relaxed font-normal mt-1.5">
                    &quot;{rev.comment}&quot;
                  </p>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* =========================================================================
            PRICE OYE STYLE: FREQUENTLY ASKED QUESTIONS (ACCORDION)
           ========================================================================= */}
        <section className="mt-10 bg-white rounded-3xl p-6 sm:p-8 border border-slate-200/80 shadow-[0_2px_16px_rgba(0,0,0,0.04)] space-y-4">
          <div className="flex items-center gap-2">
            <HelpCircle className="w-5 h-5 text-[#0b3c68]" />
            <h2 className="text-xl font-black text-slate-900 tracking-tight">
              Frequently Asked Questions
            </h2>
          </div>
          <p className="text-xs text-slate-500">
            Common questions regarding ordering, PTA verification, and warranties
          </p>

          <div className="divide-y divide-slate-100 pt-2">
            {faqs.map((faq, idx) => {
              const isOpen = activeFaq === idx;
              return (
                <div key={idx} className="py-3">
                  <button
                    onClick={() => setActiveFaq(isOpen ? null : idx)}
                    className="w-full flex items-center justify-between text-left text-xs sm:text-sm font-black text-slate-900 hover:text-[#0b3c68] transition-colors py-1 cursor-pointer"
                  >
                    <span>{faq.q}</span>
                    <ChevronDown
                      className={`w-4 h-4 text-slate-400 transition-transform duration-200 shrink-0 ml-2 ${
                        isOpen ? 'rotate-180 text-[#0b3c68]' : ''
                      }`}
                    />
                  </button>
                  {isOpen && (
                    <p className="text-xs text-slate-600 leading-relaxed font-medium mt-2 pl-1 animate-in fade-in duration-200">
                      {faq.a}
                    </p>
                  )}
                </div>
              );
            })}
          </div>
        </section>

        {/* =========================================================================
            PRICE OYE STYLE: SIMILAR / RECOMMENDED SMARTPHONES RAIL
           ========================================================================= */}
        {similarPhones.length > 0 && (
          <section className="mt-10 space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
                  Similar Smartphones in Pakistan
                </h2>
                <p className="text-xs text-slate-500 mt-0.5">
                  Top alternative models in the same price and brand category
                </p>
              </div>
              <Link
                href={`/?brand=${encodeURIComponent(phone.brand)}#catalog`}
                className="text-xs font-black text-[#0b3c68] hover:text-[#48afff] flex items-center gap-1 transition-colors"
              >
                <span>View All {phone.brand}</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </Link>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {similarPhones.map((p) => {
                const discount =
                  p.originalPricePKR > p.basePricePKR
                    ? Math.round(
                        ((p.originalPricePKR - p.basePricePKR) / p.originalPricePKR) * 100
                      )
                    : 0;
                return (
                  <Link
                    key={p.id}
                    href={`/product/${p.slug}`}
                    className="group bg-white rounded-3xl p-4 border border-slate-200/80 shadow-[0_2px_12px_rgba(0,0,0,0.03)] hover:shadow-xl hover:-translate-y-1 transition-all flex flex-col justify-between"
                  >
                    <div>
                      {/* Image container */}
                      <div className="relative w-full h-40 sm:h-48 mb-3 bg-white rounded-2xl p-3 flex items-center justify-center overflow-hidden">
                        <PhoneImageWithFallback
                          src={p.colors[0]?.image}
                          alt={p.name}
                          brand={p.brand}
                          className="w-full h-full object-contain group-hover:scale-105 transition-transform"
                        />
                        {discount > 0 && (
                          <span className="absolute top-2.5 left-2.5 px-2 py-0.5 rounded-full text-[10px] font-black bg-[#fef3eb] text-[#f47708] border border-[#fcd5b8]">
                            {discount}% OFF
                          </span>
                        )}
                      </div>

                      {/* Brand & Name */}
                      <div className="text-[10px] font-black uppercase tracking-wider text-slate-400">
                        {p.brand}
                      </div>
                      <h4 className="text-xs sm:text-sm font-black text-slate-900 group-hover:text-[#0b3c68] transition-colors line-clamp-1 mt-0.5">
                        {p.name}
                      </h4>

                      {/* Specs snippet */}
                      <div className="text-[11px] text-slate-500 font-medium line-clamp-1 mt-1">
                        {p.specs.screen} • {p.specs.battery}
                      </div>
                    </div>

                    {/* Price */}
                    <div className="mt-3 pt-2 border-t border-slate-100 flex items-baseline justify-between">
                      <div className="text-sm sm:text-base font-black text-[#0b3c68]">
                        Rs {p.basePricePKR.toLocaleString('en-PK')}
                      </div>
                      {p.originalPricePKR > p.basePricePKR && (
                        <div className="text-[11px] text-slate-400 line-through">
                          Rs {p.originalPricePKR.toLocaleString('en-PK')}
                        </div>
                      )}
                    </div>
                  </Link>
                );
              })}
            </div>
          </section>
        )}
      </main>

      {/* Sticky Bottom Buy Bar on Mobile Viewports */}
      <div className="lg:hidden fixed bottom-0 left-0 right-0 z-40 bg-white/95 backdrop-blur-md border-t border-slate-200 px-4 py-2.5 pb-[max(12px,env(safe-area-inset-bottom))] flex items-center justify-between shadow-2xl">
        <div className="flex items-center gap-2.5 min-w-0 mr-2">
          <div className="w-10 h-10 rounded-xl bg-white border border-slate-200 p-0.5 shrink-0 flex items-center justify-center">
            <PhoneImageWithFallback
              src={selectedColor.image}
              alt={phone.name}
              brand={phone.brand}
              className="w-full h-full object-contain"
            />
          </div>
          <div className="min-w-0">
            <div className="text-xs font-black text-slate-900 truncate">
              {phone.name}
            </div>
            <div className="text-xs font-black text-[#0b3c68]">
              Rs {currentPrice.toLocaleString('en-PK')}
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <button
            onClick={handleAddToCart}
            disabled={!isSelectionInStock}
            className={`px-3 py-2.5 rounded-xl text-xs font-black transition-all active:scale-95 ${
              isSelectionInStock
                ? 'bg-[#0b3c68] text-white hover:bg-[#072846]'
                : 'bg-slate-200 text-slate-400 cursor-not-allowed'
            }`}
          >
            Add to Cart
          </button>
          <button
            onClick={() => {
              if (isSelectionInStock) {
                trackCheckoutStart({
                  phoneId: phone.id,
                  name: phone.name,
                  brand: phone.brand,
                  slug: phone.slug,
                  image: selectedColor?.image || phone.colors[0]?.image,
                  pricePKR: currentPrice,
                });
                setIsQuickBuyOpen(true);
              }
            }}
            disabled={!isSelectionInStock}
            className={`px-3.5 py-2.5 rounded-xl text-xs font-black transition-all active:scale-95 ${
              isSelectionInStock
                ? 'bg-[#48afff] text-white hover:bg-[#229eff] shadow-sm'
                : 'bg-slate-200 text-slate-400 cursor-not-allowed'
            }`}
          >
            Buy (COD)
          </button>
        </div>
      </div>

      {/* Comparison Dock and Cart Drawer */}
      <ComparisonDock
        comparingPhones={comparingPhones}
        isOpenModal={isCompareModalOpen}
        onToggleModal={setIsCompareModalOpen}
        onRemovePhone={(id) =>
          setComparingPhones((prev) => prev.filter((p) => p.id !== id))
        }
        onClearAll={() => setComparingPhones([])}
        onSelectForCart={(phoneToBuy) => {
          const inStockV = phoneToBuy.variants.find((v) => v.inStock) || phoneToBuy.variants[0];
          const inStockC =
            phoneToBuy.colors.find((c) => {
              if (c.inStock === false) return false;
              if (
                phoneToBuy.colorStockMap &&
                phoneToBuy.colorStockMap[c.name] &&
                !phoneToBuy.colorStockMap[c.name].inStock
              )
                return false;
              return true;
            }) ||
            phoneToBuy.colors.find((c) => c.inStock !== false) ||
            phoneToBuy.colors[0];

          setCartItems((prev) => {
            const existing = prev.find(
              (i) =>
                i.phone.id === phoneToBuy.id &&
                i.selectedVariant.id === inStockV.id &&
                i.selectedColor.name === inStockC.name
            );
            if (existing) {
              return prev.map((i) =>
                i === existing ? { ...i, quantity: i.quantity + 1 } : i
              );
            }
            return [
              ...prev,
              {
                phone: phoneToBuy,
                selectedColor: inStockC,
                selectedVariant: inStockV,
                quantity: 1,
              },
            ];
          });
          setIsCartOpen(true);
        }}
      />

      <CartDrawer
        isOpen={isCartOpen}
        onClose={() => setIsCartOpen(false)}
        items={cartItems}
        onUpdateQuantity={(idx, newQty) =>
          setCartItems((prev) => {
            if (newQty <= 0) return prev.filter((_, i) => i !== idx);
            return prev.map((item, i) =>
              i === idx ? { ...item, quantity: newQty } : item
            );
          })
        }
        onRemoveItem={(idx) =>
          setCartItems((prev) => prev.filter((_, i) => i !== idx))
        }
        onClearCart={() => setCartItems([])}
      />

      {/* Quick Purchase Modal */}
      <QuickPurchaseModal
        phone={phone}
        selectedVariant={selectedVariant}
        selectedColor={selectedColor}
        isOpen={isQuickBuyOpen}
        onClose={() => setIsQuickBuyOpen(false)}
      />

      {/* Old Phone Trade-In & Exchange Estimator Modal */}
      <TradeInEstimatorModal
        isOpen={isTradeInModalOpen}
        onClose={() => setIsTradeInModalOpen(false)}
        targetPhone={phone}
        targetPricePKR={currentPrice}
      />

      {/* Enhanced Store Footer */}
      <Footer />
    </div>
  );
}
