'use client';

import React, { useState, useRef, useEffect, useMemo, useCallback } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { SMARTPHONES, formatPKR, BRANDS } from '@/data/smartphones';
import { getActiveCatalog } from '@/lib/catalog';
import { Smartphone } from '@/types';
import { PhoneImageWithFallback } from './PhoneImageWithFallback';
import {
  Smartphone as SmartphoneIcon,
  Search,
  ShoppingCart,
  Layers,
  ShieldCheck,
  PackageCheck,
  X,
  ArrowRight,
  Phone,
  MessageSquare,
  Truck,
  CheckCircle2,
  AlertCircle,
  Sparkles,
  Zap,
  CreditCard,
  ChevronLeft,
  ChevronRight,
  Clock,
  ExternalLink,
  User,
  ChevronDown,
  LogOut,
  ShoppingBag,
} from 'lucide-react';
import { sanitizeText } from '@/lib/security';
import { useAuth } from '@/context/AuthContext';
import { searchSmartphones } from '@/lib/search';

interface NavbarProps {
  compareCount?: number;
  cartCount?: number;
  onOpenCompare?: () => void;
  onOpenCart?: () => void;
  onSelectBrand?: (brand: string) => void;
  activeBrand?: string;
  onSearch?: (query: string) => void;
  initialSearchQuery?: string;
}

export function Navbar({
  compareCount = 0,
  cartCount = 0,
  onOpenCompare,
  onOpenCart,
  onSelectBrand,
  activeBrand = 'All Brands',
  onSearch,
  initialSearchQuery,
}: NavbarProps) {
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState(initialSearchQuery || '');
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [isMobileSearchOpen, setIsMobileSearchOpen] = useState(false);

  // Sync internal search input state with initialSearchQuery or URL param
  useEffect(() => {
    if (initialSearchQuery !== undefined) {
      setSearchQuery(initialSearchQuery);
      return;
    }
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      const urlQuery = params.get('search') || params.get('q') || params.get('query');
      if (urlQuery) {
        setSearchQuery(urlQuery);
      }
    }
  }, [initialSearchQuery]);
  const [isTrackOrderOpen, setIsTrackOrderOpen] = useState(false);
  const [trackPhoneOrOrder, setTrackPhoneOrOrder] = useState('');
  const [trackResult, setTrackResult] = useState<string | null>(null);
  const [trackError, setTrackError] = useState(false);

  const searchRef = useRef<HTMLDivElement>(null);
  const mobileSearchRef = useRef<HTMLDivElement>(null);
  const userMenuRef = useRef<HTMLDivElement>(null);
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);

  const { user, profile, loading: authLoading, openAuthModal, logout } = useAuth();

  // Active synced catalog for Navbar
  const [activeCatalog, setActiveCatalog] = useState<Smartphone[]>(() => getActiveCatalog(SMARTPHONES));

  useEffect(() => {
    const handleSync = () => setActiveCatalog(getActiveCatalog());
    window.addEventListener('naviratraders_products_updated', handleSync);
    window.addEventListener('voltphone_products_updated', handleSync);
    window.addEventListener('storage', handleSync);
    return () => {
      window.removeEventListener('naviratraders_products_updated', handleSync);
      window.removeEventListener('voltphone_products_updated', handleSync);
      window.removeEventListener('storage', handleSync);
    };
  }, []);

  // Dynamic Brand Counts from active catalog
  const brandCounts = useMemo(() => {
    const counts: Record<string, number> = { 'All Brands': activeCatalog.length };
    activeCatalog.forEach((p) => {
      counts[p.brand] = (counts[p.brand] || 0) + 1;
    });
    return counts;
  }, [activeCatalog]);

  const brandScrollRef = useRef<HTMLDivElement>(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(false);

  const updateScrollIndicators = useCallback(() => {
    if (!brandScrollRef.current) return;
    const { scrollLeft, scrollWidth, clientWidth } = brandScrollRef.current;
    setCanScrollLeft(scrollLeft > 6);
    setCanScrollRight(scrollLeft + clientWidth < scrollWidth - 6);
  }, []);

  useEffect(() => {
    updateScrollIndicators();
    window.addEventListener('resize', updateScrollIndicators);
    return () => window.removeEventListener('resize', updateScrollIndicators);
  }, [updateScrollIndicators, activeCatalog]);

  useEffect(() => {
    const container = brandScrollRef.current;
    if (!container) return;
    const activeBtn = container.querySelector<HTMLElement>('[data-active="true"]');
    if (activeBtn) {
      const scrollTarget = activeBtn.offsetLeft - (container.clientWidth / 2) + (activeBtn.clientWidth / 2);
      container.scrollTo({ left: Math.max(0, scrollTarget), behavior: 'smooth' });
    }
    const timer = setTimeout(updateScrollIndicators, 300);
    return () => clearTimeout(timer);
  }, [activeBrand, updateScrollIndicators]);

  const handleScrollBrands = (direction: 'left' | 'right') => {
    if (!brandScrollRef.current) return;
    const distance = direction === 'left' ? -280 : 280;
    brandScrollRef.current.scrollBy({ left: distance, behavior: 'smooth' });
    setTimeout(updateScrollIndicators, 300);
  };

  const handleBrandBarWheel = (e: React.WheelEvent<HTMLDivElement>) => {
    if (!brandScrollRef.current) return;
    if (Math.abs(e.deltaY) > Math.abs(e.deltaX)) {
      brandScrollRef.current.scrollLeft += e.deltaY;
      updateScrollIndicators();
    }
  };

  // Search filtering on active catalog using smart multi-token engine
  const searchResults = useMemo(() => {
    if (!searchQuery.trim()) return [];
    return searchSmartphones(activeCatalog, searchQuery).slice(0, 6);
  }, [activeCatalog, searchQuery]);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        searchRef.current &&
        !searchRef.current.contains(event.target as Node) &&
        mobileSearchRef.current &&
        !mobileSearchRef.current.contains(event.target as Node)
      ) {
        setIsSearchOpen(false);
      }
      if (
        userMenuRef.current &&
        !userMenuRef.current.contains(event.target as Node)
      ) {
        setIsUserMenuOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleBrandClick = (brand: string) => {
    if (onSelectBrand) {
      onSelectBrand(brand);
    } else {
      router.push(`/?brand=${encodeURIComponent(brand)}#catalog`);
    }
  };

  const handleCompareClick = () => {
    if (onOpenCompare) {
      onOpenCompare();
    } else {
      router.push('/#catalog');
    }
  };

  const handleSearchSubmit = (e?: React.FormEvent, customQuery?: string) => {
    if (e) e.preventDefault();
    const cleanQuery = sanitizeText(customQuery || searchQuery, 80);
    if (cleanQuery) {
      setIsSearchOpen(false);
      setIsMobileSearchOpen(false);
      if (onSearch) {
        onSearch(cleanQuery);
      } else {
        router.push(`/?search=${encodeURIComponent(cleanQuery)}#catalog`);
      }
    }
  };

  const handleTrackSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const cleanTrack = sanitizeText(trackPhoneOrOrder, 50).trim();
    if (!cleanTrack) return;

    let matchedOrder: { orderId: string; customerName: string; status: string } | null = null;
    try {
      const stored = localStorage.getItem('naviratraders_orders') || localStorage.getItem('voltphone_orders');
      if (stored) {
        const orders = JSON.parse(stored);
        if (Array.isArray(orders)) {
          matchedOrder = orders.find(
            (o: any) =>
              o.orderId?.toLowerCase() === cleanTrack.toLowerCase() ||
              (o.phone && cleanTrack.replace(/\D/g, '') && o.phone.replace(/\D/g, '') === cleanTrack.replace(/\D/g, ''))
          );
        }
      }
    } catch {
      // ignore
    }

    if (!matchedOrder && (cleanTrack.toUpperCase() === 'HPS-786110' || cleanTrack.toUpperCase() === 'VPK-786110' || cleanTrack === '03001234567')) {
      matchedOrder = {
        orderId: cleanTrack.toUpperCase().includes('VPK') ? 'VPK-786110' : 'HPS-786110',
        customerName: 'Muhammad Ali',
        status: 'Dispatched via TCS Express. In transit to destination (Lahore). Expected delivery today with Open-Parcel inspection.',
      };
    }

    if (matchedOrder) {
      setTrackError(false);
      setTrackResult(
        `Tracking ID Verified: ${matchedOrder.orderId} (${matchedOrder.customerName}). Status: ${matchedOrder.status}`
      );
    } else {
      setTrackError(true);
      setTrackResult(
        `No order found with Tracking ID "${cleanTrack}". Please verify your order number (e.g. HPS-786110) or contact our WhatsApp helpline at +92 301 8543131.`
      );
    }
  };

  const trendingTags = [
    'S24 Ultra',
    'iPhone 16',
    'Nokia 105',
    'Redmi 14C',
    'Infinix Hot 50',
    '0% EMI Deals',
  ];

  return (
    <>
      <header className="sticky top-0 z-40 w-full transition-all shadow-md overflow-hidden">
        {/* 1. PriceOye Signature Deep Blue Top Utility Bar */}
        <div className="bg-[#0b3c68] text-white text-[10px] sm:text-xs py-1.5 sm:py-2 px-2.5 sm:px-4 font-semibold border-b border-[#082e50] overflow-hidden">
          <div className="max-w-7xl mx-auto flex items-center justify-between gap-1.5 sm:gap-4">
            <div className="flex items-center gap-2 sm:gap-3 overflow-hidden text-ellipsis whitespace-nowrap min-w-0">
              <span className="flex items-center gap-1 sm:gap-1.5 font-bold bg-white/15 text-white border border-white/25 px-2 sm:px-3 py-0.5 rounded-full text-[9px] sm:text-[10px] tracking-wider uppercase shadow-xs shrink-0">
                <ShieldCheck className="w-3 h-3 sm:w-3.5 sm:h-3.5 stroke-[2.4] text-emerald-300" />
                <span className="hidden sm:inline">100% PTA APPROVED (DIRBS)</span>
                <span className="sm:hidden">PTA APPROVED</span>
              </span>
              <span className="hidden md:inline-flex items-center gap-1.5 text-white/95 font-medium">
                <PackageCheck className="w-3.5 h-3.5 text-emerald-300" />
                <span>Open-Parcel Delivery (Check Karo, Pay Karo)</span>
              </span>
              <span className="text-white/40 hidden md:inline">•</span>
              <span className="hidden lg:inline text-white/95 font-medium flex items-center gap-1">
                <span className="text-amber-300 font-bold">⚡ 0% Markup</span> EMI Installments
              </span>
            </div>

            <div className="flex items-center gap-2 sm:gap-4 text-white text-[10px] sm:text-[11px] font-semibold whitespace-nowrap shrink-0">
              <button
                onClick={() => setIsTrackOrderOpen(true)}
                className="hover:text-amber-300 flex items-center gap-1 transition-all cursor-pointer hover:scale-105 active:scale-95"
              >
                <Truck className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-white" />
                <span>Track Order</span>
              </button>
              <span className="text-white/40 hidden sm:inline">•</span>
              <a
                href="tel:+923018543131"
                className="hover:text-white flex items-center gap-1 transition-all hidden sm:flex hover:scale-105"
                title="Direct Phone Helpline"
              >
                <Phone className="w-3 h-3 text-white" />
                <span>+92 301 8543131</span>
              </a>
              <span className="text-white/40 hidden sm:inline">•</span>
              <a
                href="https://wa.me/923018543131?text=Hi%20Nawira%20Traders!%20I%20have%20an%20inquiry%20regarding%20mobile%20phones."
                target="_blank"
                rel="noreferrer"
                className="hover:bg-white/20 flex items-center gap-1 sm:gap-1.5 transition-all text-white font-bold hover:scale-105 active:scale-95 bg-white/10 px-2 sm:px-2.5 py-0.5 rounded-full border border-white/20"
                title="Chat with Us on WhatsApp"
              >
                <MessageSquare className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-emerald-300" />
                <span className="hidden sm:inline">WhatsApp: +92 301 8543131</span>
                <span className="sm:hidden">WhatsApp</span>
              </a>
            </div>
          </div>
        </div>

        {/* 2. PriceOye Signature Electric Sky Blue Navigation Bar */}
        <div className="bg-[#48afff] text-white overflow-hidden">
          <div className="max-w-7xl mx-auto px-2.5 sm:px-6 lg:px-8">
            <div className="flex items-center justify-between h-14 sm:h-20 gap-1.5 sm:gap-4">
              {/* Nawira Traders Brand Logo */}
              <Link href="/" className="flex items-center gap-1 sm:gap-3 shrink min-w-0 group">
                <div className="w-7 h-7 sm:w-11 sm:h-11 rounded-lg sm:rounded-2xl bg-white text-[#0b3c68] flex items-center justify-center shadow-md group-hover:scale-105 transition-all shrink-0">
                  <Zap className="w-3.5 h-3.5 sm:w-6 sm:h-6 fill-[#0b3c68] stroke-[#0b3c68]" />
                </div>
                <div className="min-w-0">
                  <div className="flex items-center gap-1 sm:gap-1.5">
                    <span className="text-xs sm:text-2xl font-black tracking-tight text-white font-sans flex items-center gap-0.5 sm:gap-1">
                      <span>NAWIRA</span>
                      <span className="bg-white text-[#0b3c68] px-1 sm:px-2 py-0.5 rounded sm:rounded-lg text-[9px] sm:text-lg font-black shadow-xs tracking-normal">
                        TRADERS
                      </span>
                    </span>
                    <span className="text-[7px] sm:text-[10px] font-black px-1 sm:px-2 py-0.5 rounded-full bg-[#f88b2a] text-white shadow-xs tracking-wider shrink-0">
                      PK
                    </span>
                  </div>
                  <div className="hidden sm:flex items-center gap-1.5 text-[9px] sm:text-[10px] font-bold text-white/95 -mt-0.5">
                    <span className="relative flex h-1.5 w-1.5 sm:h-2 sm:w-2">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-300 opacity-80" />
                      <span className="relative inline-flex rounded-full h-1.5 w-1.5 sm:h-2 sm:w-2 bg-emerald-400" />
                    </span>
                    <span>222 Verified Mobiles In-Stock</span>
                  </div>
                </div>
              </Link>

              {/* Desktop Search Bar with PriceOye Clean White Pill & Circle Search Button */}
              <div ref={searchRef} className="relative flex-1 max-w-xl hidden md:block">
                <form onSubmit={handleSearchSubmit} className="relative">
                  <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none transition-colors" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => {
                      setSearchQuery(e.target.value);
                      setIsSearchOpen(true);
                    }}
                    onFocus={() => setIsSearchOpen(true)}
                    placeholder="Search 222 mobiles (e.g. S24 Ultra, iPhone 16, Nokia 105, 0% EMI)..."
                    className="w-full pl-11 pr-20 py-2.5 sm:py-3 rounded-full text-xs sm:text-sm bg-white text-slate-900 placeholder:text-slate-500 font-medium focus:outline-none focus:ring-4 focus:ring-white/40 transition-all shadow-md"
                  />
                  {searchQuery && (
                    <button
                      type="button"
                      onClick={() => {
                        setSearchQuery('');
                        setIsSearchOpen(false);
                      }}
                      aria-label="Clear search"
                      title="Clear search"
                      className="absolute right-10 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 hover:scale-115 active:scale-95 transition-all p-1 cursor-pointer"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  )}
                  <button
                    type="submit"
                    className="absolute right-1.5 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-[#0b3c68] hover:bg-[#072642] text-white flex items-center justify-center transition-all cursor-pointer shadow-xs active:scale-95"
                    title="Search"
                  >
                    <Search className="w-4 h-4 text-white" />
                  </button>
                </form>

                {/* Desktop Autocomplete Dropdown */}
                {isSearchOpen && (
                  <div className="absolute left-0 right-0 mt-2 bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden z-50 animate-in fade-in slide-in-from-top-1 duration-150 text-slate-900">
                    {searchQuery.trim() ? (
                      <>
                        <div className="p-3 border-b border-slate-100 flex items-center justify-between text-xs text-slate-500 px-4 font-semibold bg-slate-50">
                          <span>Phones matching &quot;{searchQuery}&quot;</span>
                          <span className="text-[#136ab5] font-bold">{searchResults.length} results</span>
                        </div>

                        {searchResults.length > 0 ? (
                          <div className="divide-y divide-slate-100 max-h-84 overflow-y-auto">
                            {searchResults.map((phone) => (
                              <Link
                                key={phone.id}
                                href={`/product/${phone.slug}`}
                                onClick={() => setIsSearchOpen(false)}
                                className="flex items-center gap-3.5 p-3 px-4 hover:bg-sky-50/70 hover:translate-x-1 transition-all duration-200 group"
                              >
                                <div className="w-12 h-12 rounded-xl bg-white p-1 flex items-center justify-center flex-shrink-0 border border-slate-200/80 group-hover:border-[#48afff] group-hover:scale-105 transition-all">
                                  {phone.colors?.[0]?.image ? (
                                    <PhoneImageWithFallback
                                      src={phone.colors[0].image}
                                      alt={phone.name}
                                      brand={phone.brand}
                                      className="w-full h-full object-contain"
                                    />
                                  ) : (
                                    <SmartphoneIcon className="w-6 h-6 text-slate-400" />
                                  )}
                                </div>
                                <div className="flex-1 min-w-0">
                                  <div className="flex items-center justify-between gap-2">
                                    <h4 className="text-xs font-bold text-slate-900 truncate group-hover:text-[#136ab5] transition-colors">
                                      {phone.name}
                                    </h4>
                                    <span className="text-xs font-extrabold text-slate-950 whitespace-nowrap">
                                      {formatPKR(phone.basePricePKR)}
                                    </span>
                                  </div>
                                  <div className="flex items-center justify-between gap-2 mt-1">
                                    <span className="text-[11px] text-slate-500 truncate">
                                      {phone.variants?.[0]?.ram || ''} {phone.variants?.[0]?.storage || ''} • {phone.specs.processor}
                                    </span>
                                    {phone.inStock ? (
                                      <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200/60 flex items-center gap-1">
                                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                                        In Stock
                                      </span>
                                    ) : (
                                      <span className="text-[10px] font-bold text-rose-700 bg-rose-50 px-2 py-0.5 rounded-full border border-rose-200/60">
                                        Out of Stock
                                      </span>
                                    )}
                                  </div>
                                </div>
                              </Link>
                            ))}
                            <button
                              type="button"
                              onClick={() => handleSearchSubmit()}
                              className="w-full p-3 text-center text-xs font-bold text-[#136ab5] hover:bg-sky-50 flex items-center justify-center gap-1.5 transition-colors cursor-pointer border-t border-slate-100"
                            >
                              <span>View all results for &quot;{searchQuery}&quot;</span>
                              <ArrowRight className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        ) : (
                          <div className="p-6 text-center text-xs text-slate-500 space-y-1">
                            <p className="font-bold text-slate-800 text-sm">
                              No phones matching &quot;{searchQuery}&quot;
                            </p>
                            <p className="text-[11px] text-slate-400">
                              Search by brand (e.g. Samsung, Apple, Nokia, Xiaomi) or model (e.g. S24, 105).
                            </p>
                          </div>
                        )}
                      </>
                    ) : (
                      <div className="p-4 space-y-3">
                        <div className="text-[11px] font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                          <Sparkles className="w-3.5 h-3.5 text-[#136ab5] animate-pulse" />
                          <span>Trending Mobile Searches</span>
                        </div>
                        <div className="flex flex-wrap gap-2">
                          {trendingTags.map((tag) => (
                            <button
                              key={tag}
                              type="button"
                              onClick={() => {
                                setSearchQuery(tag);
                                handleSearchSubmit(undefined, tag);
                              }}
                              className="btn-press px-3 py-1.5 rounded-full bg-slate-100 hover:bg-sky-50 hover:text-[#136ab5] hover:border-[#48afff] border border-slate-200 text-slate-700 text-xs font-medium transition-all cursor-pointer flex items-center gap-1"
                            >
                              <Zap className="w-3 h-3 text-amber-500 fill-amber-500" />
                              <span>{tag}</span>
                            </button>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Quick Action Navigation Buttons */}
              <div className="flex items-center gap-1.5 sm:gap-2.5 shrink-0">
                {/* Mobile Search Toggle */}
                <button
                  type="button"
                  onClick={() => setIsMobileSearchOpen(!isMobileSearchOpen)}
                  className="md:hidden w-8 h-8 rounded-full text-white hover:bg-white/10 active:scale-95 transition-all flex items-center justify-center cursor-pointer"
                  aria-label="Toggle Search"
                >
                  <Search className="w-4 h-4 text-white" />
                </button>

                {/* Customer Account / Auth State Button */}
                {authLoading ? (
                  <div className="w-8 h-8 sm:w-28 sm:h-9 rounded-full bg-white/20 animate-pulse" />
                ) : !user ? (
                  <button
                    type="button"
                    onClick={() => openAuthModal('login')}
                    aria-label="Customer Login or Sign Up"
                    className="btn-press relative flex items-center justify-center w-8 h-8 sm:w-auto sm:px-3.5 sm:py-2.5 rounded-full bg-white hover:bg-slate-50 text-[#0b3c68] font-black text-xs shadow-sm transition-all cursor-pointer hover:shadow-md"
                    title="Customer Login or Sign Up"
                  >
                    <User className="w-4 h-4 text-[#0b3c68]" />
                    <span className="hidden sm:inline">Log in / Register</span>
                  </button>
                ) : (
                  <div ref={userMenuRef} className="relative">
                    <button
                      type="button"
                      onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
                      aria-label="Customer Account Menu"
                      aria-expanded={isUserMenuOpen}
                      className="btn-press relative flex items-center justify-center w-8 h-8 sm:w-auto sm:px-3.5 sm:py-2.5 rounded-full bg-white hover:bg-slate-50 text-[#0b3c68] transition-all cursor-pointer text-xs font-black shadow-sm"
                    >
                      <div className="w-4 h-4 sm:w-5 sm:h-5 rounded-full bg-[#0b3c68] text-white flex items-center justify-center text-[9px] sm:text-[10px] font-black uppercase">
                        {(profile?.name?.charAt(0) || user.displayName?.charAt(0) || 'U')}
                      </div>
                      <span className="hidden sm:inline">
                        {profile?.name ? profile.name.trim().split(' ')[0] : user.displayName ? user.displayName.trim().split(' ')[0] : 'My Account'}
                      </span>
                      <ChevronDown
                        className={`w-3 h-3 sm:w-3.5 sm:h-3.5 text-slate-500 transition-transform duration-200 hidden sm:inline ${
                          isUserMenuOpen ? 'rotate-180' : ''
                        }`}
                      />
                    </button>

                    {isUserMenuOpen && (
                      <div className="absolute right-0 mt-2 w-56 bg-white rounded-2xl shadow-2xl border border-slate-200/90 py-2 z-50 animate-in fade-in slide-in-from-top-1 duration-150 text-slate-900">
                        <div className="px-4 py-2 border-b border-slate-100">
                          <p className="text-xs font-bold text-slate-900 truncate">
                            {profile?.name || user.displayName || 'Customer'}
                          </p>
                          <p className="text-[11px] text-slate-500 truncate">
                            {profile?.phone || (user.email ? user.email.replace(/@(naviratraders\.pk|hamzaphonestore\.pk|voltphone\.pk)/, '') : '')}
                          </p>
                        </div>

                        <div className="py-1">
                          <Link
                            href="/account"
                            onClick={() => setIsUserMenuOpen(false)}
                            className="flex items-center gap-2.5 px-4 py-2.5 text-xs font-semibold text-slate-700 hover:bg-sky-50 hover:text-[#0b3c68] transition-colors"
                          >
                            <User className="w-4 h-4 text-[#48afff]" />
                            <span>My Account</span>
                          </Link>
                          <Link
                            href="/account/orders"
                            onClick={() => setIsUserMenuOpen(false)}
                            className="flex items-center gap-2.5 px-4 py-2.5 text-xs font-semibold text-slate-700 hover:bg-sky-50 hover:text-[#0b3c68] transition-colors"
                          >
                            <ShoppingBag className="w-4 h-4 text-[#48afff]" />
                            <span>My Orders</span>
                          </Link>
                          <Link
                            href="/admin"
                            onClick={() => setIsUserMenuOpen(false)}
                            className="flex items-center gap-2.5 px-4 py-2.5 text-xs font-bold text-[#0b3c68] bg-sky-50/60 hover:bg-sky-100 transition-colors"
                          >
                            <ShieldCheck className="w-4 h-4 text-[#48afff]" />
                            <span>Store Admin &amp; Stock</span>
                          </Link>
                        </div>

                        <div className="border-t border-slate-100 pt-1">
                          <button
                            type="button"
                            onClick={async () => {
                              setIsUserMenuOpen(false);
                              await logout();
                            }}
                            className="w-full flex items-center gap-2.5 px-4 py-2.5 text-xs font-bold text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer text-left"
                          >
                            <LogOut className="w-4 h-4" />
                            <span>Logout</span>
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {/* Compare Button */}
                <button
                  type="button"
                  onClick={handleCompareClick}
                  aria-label="Compare phones side-by-side"
                  className="btn-press relative flex items-center justify-center w-8 h-8 sm:w-auto sm:px-3.5 sm:py-2.5 rounded-full bg-white hover:bg-slate-50 text-[#0b3c68] font-extrabold text-xs shadow-sm hover:shadow-md transition-all cursor-pointer"
                  title="Compare phones side-by-side"
                >
                  <Layers className="w-4 h-4 text-[#0b3c68]" />
                  <span className="hidden sm:inline">Compare</span>
                  {compareCount > 0 && (
                    <span className="absolute -top-1 -right-1 sm:static sm:ml-1 w-4 h-4 sm:w-5 sm:h-5 rounded-full bg-[#f88b2a] text-white text-[9px] sm:text-[10px] font-black flex items-center justify-center shadow-xs">
                      {compareCount}
                    </span>
                  )}
                </button>

                {/* Shopping Cart Button (PriceOye High-Contrast Dark Navy Pill with Orange Badge) */}
                <button
                  type="button"
                  onClick={onOpenCart}
                  aria-label="View shopping cart"
                  className="btn-shimmer btn-press relative flex items-center justify-center w-8 h-8 sm:w-auto sm:px-4 sm:py-2.5 rounded-full bg-[#0b3c68] hover:bg-[#072847] text-white transition-all shadow-md cursor-pointer text-xs font-black border border-white/25 shrink-0"
                  title="View your cart"
                >
                  <ShoppingCart className="w-4 h-4 text-white" />
                  <span className="hidden sm:inline">Cart</span>
                  {cartCount > 0 && (
                    <span className="absolute -top-1 -right-1 sm:static sm:ml-1 w-4 h-4 sm:w-5 sm:h-5 rounded-full bg-[#f88b2a] text-white text-[9px] sm:text-[10px] font-black flex items-center justify-center shadow-sm animate-heartbeat">
                      {cartCount}
                    </span>
                  )}
                </button>

                {/* Admin Portal Button */}
                <Link
                  href="/admin"
                  className="btn-press hidden sm:flex items-center gap-1.5 px-3.5 py-2 sm:py-2.5 rounded-full bg-white hover:bg-slate-50 text-[#0b3c68] font-extrabold text-xs shadow-sm hover:shadow-md transition-all"
                  title="Open Store Admin Portal &amp; Inventory"
                >
                  <ShieldCheck className="w-4 h-4 text-[#0b3c68]" />
                  <span>Admin</span>
                </Link>
              </div>
            </div>

            {/* Mobile Search Drawer */}
            {isMobileSearchOpen && (
              <div ref={mobileSearchRef} className="md:hidden pb-3 pt-1 border-t border-white/20 animate-in fade-in duration-200">
                <form onSubmit={handleSearchSubmit} className="relative flex items-center">
                  <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => {
                      setSearchQuery(e.target.value);
                      setIsSearchOpen(true);
                    }}
                    placeholder="Search 222 phones (e.g. S24, iPhone, under 40k)..."
                    className="w-full pl-10 pr-18 py-2.5 rounded-full text-base sm:text-xs bg-white text-slate-900 focus:outline-none focus:ring-2 focus:ring-white/40 shadow-sm font-medium"
                  />
                  {searchQuery && (
                    <button
                      type="button"
                      onClick={() => setSearchQuery('')}
                      aria-label="Clear search"
                      title="Clear search"
                      className="absolute right-10 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 cursor-pointer p-1"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  )}
                  <button
                    type="submit"
                    className="absolute right-1.5 top-1/2 -translate-y-1/2 w-7 h-7 rounded-full bg-[#0b3c68] text-white flex items-center justify-center cursor-pointer shadow-xs active:scale-95"
                    title="Search"
                    aria-label="Submit Search"
                  >
                    <Search className="w-3.5 h-3.5 text-white" />
                  </button>
                </form>

                {/* Mobile Search Results */}
                {isSearchOpen && searchQuery.trim() && (
                  <div className="mt-2 bg-white rounded-2xl shadow-xl border border-slate-200 overflow-hidden divide-y divide-slate-100 text-slate-900">
                    {searchResults.length > 0 ? (
                      <>
                        {searchResults.map((phone) => (
                          <Link
                            key={phone.id}
                            href={`/product/${phone.slug}`}
                            onClick={() => {
                              setIsSearchOpen(false);
                              setIsMobileSearchOpen(false);
                            }}
                            className="flex items-center justify-between p-3 hover:bg-slate-50 text-xs active:bg-sky-50 gap-2"
                          >
                            <div className="flex items-center gap-2.5 min-w-0">
                              <div className="w-9 h-9 rounded-lg bg-white border border-slate-200 p-0.5 shrink-0 flex items-center justify-center">
                                {phone.colors?.[0]?.image ? (
                                  <PhoneImageWithFallback
                                    src={phone.colors[0].image}
                                    alt={phone.name}
                                    brand={phone.brand}
                                    className="w-full h-full object-contain"
                                  />
                                ) : (
                                  <SmartphoneIcon className="w-4 h-4 text-slate-400" />
                                )}
                              </div>
                              <div className="truncate font-bold text-slate-900">{phone.name}</div>
                            </div>
                            <div className="font-extrabold text-[#136ab5] shrink-0">{formatPKR(phone.basePricePKR)}</div>
                          </Link>
                        ))}
                        <button
                          type="button"
                          onClick={() => handleSearchSubmit()}
                          className="w-full p-2.5 text-center text-xs font-bold text-[#136ab5] hover:bg-sky-50 flex items-center justify-center gap-1.5 transition-colors cursor-pointer bg-slate-50"
                        >
                          <span>View all results for &quot;{searchQuery}&quot;</span>
                          <ArrowRight className="w-3.5 h-3.5" />
                        </button>
                      </>
                    ) : (
                      <div className="p-4 text-center text-xs text-slate-500">
                        No phones matching &quot;{searchQuery}&quot;
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* 3. PriceOye Clean White Brand & Quick-Category Navigation Bar with Smooth Scroll Controls */}
        <div className="bg-white border-b border-slate-200/90 shadow-xs relative w-full max-w-full group/brandbar">
          <div className="max-w-7xl mx-auto px-2.5 sm:px-6 lg:px-8 relative">
            {/* Left Scroll Arrow with Fade Mask */}
            {canScrollLeft && (
              <div className="absolute left-0 top-0 bottom-0 z-20 flex items-center pl-1 sm:pl-3 bg-gradient-to-r from-white via-white/95 to-transparent pr-8 pointer-events-none">
                <button
                  type="button"
                  onClick={() => handleScrollBrands('left')}
                  aria-label="Scroll left to see previous brands"
                  className="pointer-events-auto w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-white hover:bg-slate-50 text-slate-700 hover:text-slate-950 border border-slate-200/90 shadow-md flex items-center justify-center cursor-pointer transition-all hover:scale-105 active:scale-95"
                >
                  <ChevronLeft className="w-4 h-4 stroke-[2.5]" />
                </button>
              </div>
            )}

            {/* Scrollable Brands Pill Container */}
            <div
              ref={brandScrollRef}
              onScroll={updateScrollIndicators}
              onWheel={handleBrandBarWheel}
              className="flex items-center gap-2 py-2 sm:py-2.5 overflow-x-auto scrollbar-none scroll-smooth px-1 sm:px-2"
            >
              {BRANDS.map((brand) => {
                const isActive = activeBrand === brand;
                const count = brandCounts[brand] || 0;
                return (
                  <button
                    key={brand}
                    data-active={isActive ? 'true' : 'false'}
                    onClick={() => handleBrandClick(brand)}
                    className={`shrink-0 flex-shrink-0 min-w-max whitespace-nowrap px-4 py-2 rounded-full text-xs font-bold transition-all cursor-pointer flex items-center gap-2 select-none ${
                      isActive
                        ? 'bg-[#0b3c68] text-white shadow-sm ring-2 ring-[#0b3c68]/30 font-extrabold'
                        : 'bg-slate-100 hover:bg-slate-200 text-slate-800 hover:text-slate-950 border border-slate-200/90'
                    }`}
                  >
                    <span className="shrink-0 whitespace-nowrap">{brand}</span>
                    <span
                      className={`shrink-0 whitespace-nowrap text-[10px] px-2 py-0.5 rounded-full font-bold transition-colors ${
                        isActive
                          ? 'bg-white text-[#0b3c68] font-black'
                          : 'bg-white text-slate-700 border border-slate-200'
                      }`}
                    >
                      {count}
                    </span>
                  </button>
                );
              })}
              {/* Extra spacing block at the end so last brand is never flush or cut off */}
              <div className="w-6 shrink-0" aria-hidden="true" />
            </div>

            {/* Right Scroll Arrow with Fade Mask */}
            {canScrollRight && (
              <div className="absolute right-0 top-0 bottom-0 z-20 flex items-center pr-1 sm:pr-3 bg-gradient-to-l from-white via-white/95 to-transparent pl-8 pointer-events-none">
                <button
                  type="button"
                  onClick={() => handleScrollBrands('right')}
                  aria-label="Scroll right to see more brands"
                  className="pointer-events-auto w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-white hover:bg-slate-50 text-slate-700 hover:text-slate-950 border border-slate-200/90 shadow-md flex items-center justify-center cursor-pointer transition-all hover:scale-105 active:scale-95"
                >
                  <ChevronRight className="w-4 h-4 stroke-[2.5]" />
                </button>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* Track Order Modal */}
      {isTrackOrderOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="relative w-full max-w-md bg-white rounded-3xl p-6 border border-slate-200 shadow-2xl space-y-4 animate-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-2xl bg-sky-50 border border-sky-100 text-[#136ab5] flex items-center justify-center">
                  <Truck className="w-4 h-4 stroke-[2.2]" />
                </div>
                <h3 className="text-base font-bold text-slate-950 font-sans">
                  Track Smartphone Delivery
                </h3>
              </div>
              <button
                onClick={() => {
                  setIsTrackOrderOpen(false);
                  setTrackResult(null);
                  setTrackError(false);
                }}
                aria-label="Close tracking popup"
                className="w-8 h-8 rounded-full bg-slate-100 text-slate-500 hover:text-slate-950 hover:scale-110 active:scale-95 flex items-center justify-center cursor-pointer transition-all"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <p className="text-xs text-slate-500 leading-relaxed">
              Enter your Pakistani mobile number or Order ID to view real-time courier dispatch status with Open-Parcel inspection.
            </p>

            <form onSubmit={handleTrackSubmit} className="space-y-3">
              <input
                type="text"
                required
                value={trackPhoneOrOrder}
                onChange={(e) => setTrackPhoneOrOrder(e.target.value)}
                placeholder="e.g. 03001234567 or HPS-786110"
                className="w-full px-4 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-xs focus:outline-none focus:ring-2 focus:ring-[#48afff]"
              />
              <button
                type="submit"
                className="btn-shimmer btn-press w-full py-2.5 rounded-xl bg-[#48afff] hover:bg-[#229eff] text-white text-xs font-bold transition-all cursor-pointer shadow-md shadow-[#48afff]/25"
              >
                Search Courier Status
              </button>
            </form>

            {trackResult && (
              <div
                className={`p-3.5 rounded-2xl text-xs space-y-1 animate-in fade-in duration-150 ${
                  trackError
                    ? 'bg-rose-50 border border-rose-200 text-rose-900'
                    : 'bg-emerald-50 border border-emerald-200 text-emerald-900'
                }`}
              >
                <div
                  className={`font-bold flex items-center gap-1.5 ${
                    trackError ? 'text-rose-800' : 'text-emerald-800'
                  }`}
                >
                  {trackError ? (
                    <AlertCircle className="w-4 h-4 text-rose-600" />
                  ) : (
                    <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  )}
                  <span>{trackError ? 'Order Not Found' : 'Dispatch Verified'}</span>
                </div>
                <p
                  className={`text-[11px] leading-relaxed ${
                    trackError ? 'text-rose-700' : 'text-emerald-700'
                  }`}
                >
                  {trackResult}
                </p>
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
}
