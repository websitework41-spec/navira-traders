'use client';

import React, { useState, useMemo, useEffect, useCallback, useRef, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { SMARTPHONES, BRANDS, formatPKR, getPhonePrice } from '@/data/smartphones';
import { getActiveCatalog } from '@/lib/catalog';
import { matchesSearchQuery } from '@/lib/search';
import { Smartphone, FilterState, CartItem, SmartphoneVariant, SmartphoneColor } from '@/types';
import { Navbar } from '@/components/Navbar';
import { HeroBanner } from '@/components/HeroBanner';
import { BrandMarquee } from '@/components/BrandMarquee';
import { BentoTrustGrid } from '@/components/BentoTrustGrid';
import { FlagshipSpotlight } from '@/components/FlagshipSpotlight';
import { FilterSidebar } from '@/components/FilterSidebar';
import { PhoneCard } from '@/components/PhoneCard';
import { InstallmentManualModal } from '@/components/InstallmentManualModal';
import dynamic from 'next/dynamic';

// Performance Optimization: Defer loading interactive checkout/compare drawers to reduce initial main-thread JS
const ComparisonDock = dynamic(
  () => import('@/components/ComparisonDock').then((m) => m.ComparisonDock),
  { ssr: false }
);
const CartDrawer = dynamic(
  () => import('@/components/CartDrawer').then((m) => m.CartDrawer),
  { ssr: false }
);
const QuickPurchaseModal = dynamic(
  () => import('@/components/QuickPurchaseModal').then((m) => m.QuickPurchaseModal),
  { ssr: false }
);

import { Footer } from '@/components/Footer';
import { FlashSaleCountdown } from '@/components/FlashSaleCountdown';
import { sanitizeText } from '@/lib/security';
import {
  CatalogBannerS24Ultra,
  CatalogBannerDualCards,
  CatalogBannerBankEMI,
  CatalogBannerOpenParcel,
} from '@/components/PromotionalBanners';
import {
  SlidersHorizontal,
  ShieldCheck,
  PackageCheck,
  Award,
  Filter,
  CheckCircle,
  Truck,
  PhoneCall,
  Mail,
  X,
  CreditCard,
  Banknote,
  Building,
  ChevronDown,
  ChevronRight,
  RotateCcw,
  ArrowRight,
  ExternalLink,
  Flame,
  Zap,
  Sparkles,
  Headphones,
  Watch,
  Cable,
  Smartphone as PhoneIcon,
  Clock,
  MessageSquare,
} from 'lucide-react';

function HomeContent() {
  const searchParams = useSearchParams();

  // Master Filters State
  const [filters, setFilters] = useState<FilterState>({
    searchQuery: '',
    selectedBrands: [],
    priceRange: [0, 700000],
    selectedRam: [],
    selectedStorage: [],
    ptaApprovedOnly: false,
    inStockOnly: false,
    sortBy: 'popularity',
    specFilter: undefined,
  });

  // Global compare & cart states
  const [comparingPhones, setComparingPhones] = useState<Smartphone[]>([]);
  const [isCompareModalOpen, setIsCompareModalOpen] = useState(false);
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [isMobileFiltersOpen, setIsMobileFiltersOpen] = useState(false);
  const [activePolicyModal, setActivePolicyModal] = useState<string | null>(null);
  const [isInstallmentManualOpen, setIsInstallmentManualOpen] = useState(false);
  const [installmentPhone, setInstallmentPhone] = useState<Smartphone | null>(null);

  useEffect(() => {
    const handleOpen = (e: any) => {
      if (e?.detail?.phone) {
        setInstallmentPhone(e.detail.phone);
      }
      setIsInstallmentManualOpen(true);
    };
    window.addEventListener('open_installment_manual', handleOpen);
    return () => window.removeEventListener('open_installment_manual', handleOpen);
  }, []);

  // Quick Purchase Form Modal state
  const [quickBuyPhone, setQuickBuyPhone] = useState<Smartphone | null>(null);
  const [quickBuyVariant, setQuickBuyVariant] = useState<SmartphoneVariant | null>(null);
  const [quickBuyColor, setQuickBuyColor] = useState<SmartphoneColor | null>(null);
  const [isQuickBuyOpen, setIsQuickBuyOpen] = useState(false);

  // Pagination state
  const [visibleCount, setVisibleCount] = useState<number>(24);
  const [catalog, setCatalog] = useState<Smartphone[]>(() => getActiveCatalog(SMARTPHONES));

  // Category & Accessories Showcase states
  const [catalogCategory, setCatalogCategory] = useState<'all' | 'mobiles' | 'accessories'>('all');
  const [accessoryTab, setAccessoryTab] = useState<'All' | 'Smartwatch' | 'Earbuds' | 'Cable'>('All');

  const allAccessories = useMemo(() => {
    return catalog.filter((p) => p.category === 'Accessories');
  }, [catalog]);

  const displayedAccessories = useMemo(() => {
    if (accessoryTab === 'All') return allAccessories;
    return allAccessories.filter((p) => p.accessoryType === accessoryTab);
  }, [allAccessories, accessoryTab]);

  // Sync catalog with dynamic database / disk updates & local deletions from admin
  useEffect(() => {
    const syncCatalog = () => {
      setCatalog(getActiveCatalog());
    };

    const fetchCatalog = () => {
      fetch('/api/admin/products?_t=' + Date.now(), { cache: 'no-store' })
        .then((res) => res.json())
        .then((data) => {
          if (data.success && Array.isArray(data.products)) {
            setCatalog(getActiveCatalog(data.products));
          } else {
            syncCatalog();
          }
        })
        .catch(() => {
          syncCatalog();
        });
    };

    // Initial sync and fetch
    syncCatalog();
    fetchCatalog();

    window.addEventListener('naviratraders_products_updated', syncCatalog);
    window.addEventListener('voltphone_products_updated', syncCatalog);
    window.addEventListener('storage', syncCatalog);

    return () => {
      window.removeEventListener('naviratraders_products_updated', syncCatalog);
      window.removeEventListener('voltphone_products_updated', syncCatalog);
      window.removeEventListener('storage', syncCatalog);
    };
  }, []);

  const isInitialMount = useRef(true);

  // Synchronize cart with localStorage on mount & listen to other tabs
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

  // Persist cart to localStorage on updates (survives reloads and page changes)
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

  // Read URL query params securely on client load & route changes
  useEffect(() => {
    if (!searchParams) return;
    const brandParam = sanitizeText(searchParams.get('brand') || '', 40);
    const searchParam = sanitizeText(
      searchParams.get('search') || searchParams.get('q') || searchParams.get('query') || '',
      100
    );
    const maxPriceParam = searchParams.get('maxPrice');
    const minPriceParam = searchParams.get('minPrice');
    const categoryParam = searchParams.get('category');
    const specParam = searchParams.get('spec');

    setFilters((prev) => {
      let updated = { ...prev };
      if (brandParam && BRANDS.includes(brandParam)) {
        updated.selectedBrands = brandParam === 'All Brands' ? [] : [brandParam];
      }
      if (searchParam) {
        updated.searchQuery = searchParam;
        if (!brandParam) {
          updated.selectedBrands = [];
        }
      }
      if (maxPriceParam) {
        const parsedMax = parseInt(maxPriceParam, 10);
        if (!isNaN(parsedMax) && parsedMax > 0) {
          updated.priceRange = [0, parsedMax];
          updated.selectedBrands = [];
        }
      }
      if (minPriceParam) {
        const parsedMin = parseInt(minPriceParam, 10);
        if (!isNaN(parsedMin) && parsedMin > 0) {
          updated.priceRange = [parsedMin, 700000];
          updated.selectedBrands = [];
        }
      }
      if (categoryParam === 'keypad') {
        updated.selectedBrands = ['Nokia', 'Itel'];
        updated.priceRange = [0, 700000];
      }
      if (specParam) {
        updated.specFilter = specParam;
      }
      return updated;
    });

    if (searchParam) {
      setTimeout(() => {
        const catalogEl = document.getElementById('catalog');
        if (catalogEl) {
          catalogEl.scrollIntoView({ behavior: 'smooth' });
        }
      }, 100);
    }
  }, [searchParams]);

  // Reset pagination when filters change
  useEffect(() => {
    setVisibleCount(24);
  }, [
    filters.searchQuery,
    filters.selectedBrands,
    filters.priceRange,
    filters.selectedRam,
    filters.selectedStorage,
    filters.ptaApprovedOnly,
    filters.inStockOnly,
    filters.sortBy,
    filters.specFilter,
    catalogCategory,
  ]);

  // Flash deals calculation (top 4 discount items)
  const flashSalePhones = useMemo(() => {
    return [...catalog]
      .filter((p) => p.inStock && p.discountPercent >= 20)
      .sort((a, b) => b.discountPercent - a.discountPercent)
      .slice(0, 4);
  }, [catalog]);

  // Filter & Sort Logic
  const filteredPhones = useMemo(() => {
    return catalog.filter((phone) => {
      // Category Filter (All vs Mobiles vs Accessories)
      if (catalogCategory === 'mobiles' && phone.category === 'Accessories') return false;
      if (catalogCategory === 'accessories' && phone.category !== 'Accessories') return false;
      // Spec Filter
      if (filters.specFilter === '120hz-amoled') {
        const is120Hz =
          phone.specs.refreshRate?.includes('120') ||
          phone.specs.displayType?.includes('120') ||
          phone.specs.screen?.includes('120');
        const isAmoled =
          /amoled|oled/i.test(phone.specs.displayType || '') ||
          /amoled|oled/i.test(phone.specs.screen || '') ||
          /amoled|oled/i.test(phone.keyHighlights?.display || '');
        if (!is120Hz || !isAmoled) return false;
      }

      const phonePrice = getPhonePrice(phone);

      // Search (Name, Brand, Chipset, Network, Budget phrase)
      // Search (Multi-token, Name, Brand, Chipset, Specs, Normalized, and Budget phrases)
      if (filters.searchQuery.trim()) {
        if (!matchesSearchQuery(phone, filters.searchQuery)) {
          return false;
        }
      }

      // Brand
      if (filters.selectedBrands.length > 0) {
        if (!filters.selectedBrands.includes(phone.brand)) return false;
      }

      // Price Range (Strictly enforced against actual purchasable phone price)
      if (
        phonePrice < filters.priceRange[0] ||
        phonePrice > filters.priceRange[1]
      ) {
        return false;
      }

      // PTA Approved Only
      if (filters.ptaApprovedOnly && phone.specs.ptaStatus !== 'PTA Approved') {
        return false;
      }

      // In Stock Only
      if (filters.inStockOnly && !phone.inStock) {
        return false;
      }

      // RAM
      if (filters.selectedRam.length > 0) {
        const hasMatchingRam = phone.variants.some((v) =>
          filters.selectedRam.some((ram) => v.ram.includes(ram))
        );
        if (!hasMatchingRam) return false;
      }

      // Storage
      if (filters.selectedStorage.length > 0) {
        const hasMatchingStorage = phone.variants.some((v) =>
          filters.selectedStorage.some((st) => v.storage.includes(st))
        );
        if (!hasMatchingStorage) return false;
      }

      return true;
    }).sort((a, b) => {
      // Numerical sort by actual effective price without in-stock priority inversion
      const priceA = getPhonePrice(a);
      const priceB = getPhonePrice(b);
      if (filters.sortBy === 'price-asc') return priceA - priceB;
      if (filters.sortBy === 'price-desc') return priceB - priceA;
      // Prioritize in-stock phones for other sort modes (popularity, discount, rating)
      if (a.inStock !== b.inStock) {
        return a.inStock ? -1 : 1;
      }
      if (filters.sortBy === 'discount') return b.discountPercent - a.discountPercent;
      if (filters.sortBy === 'rating') return b.rating - a.rating;

      // When search query is active, rank exact / starting name matches and brand matches first
      if (filters.searchQuery.trim()) {
        const cleanLower = filters.searchQuery.trim().toLowerCase();
        const aName = a.name.toLowerCase();
        const bName = b.name.toLowerCase();
        if (aName === cleanLower && bName !== cleanLower) return -1;
        if (bName === cleanLower && aName !== cleanLower) return 1;
        const aStarts = aName.startsWith(cleanLower);
        const bStarts = bName.startsWith(cleanLower);
        if (aStarts && !bStarts) return -1;
        if (!aStarts && bStarts) return 1;
        const aBrand = a.brand.toLowerCase() === cleanLower;
        const bBrand = b.brand.toLowerCase() === cleanLower;
        if (aBrand && !bBrand) return -1;
        if (!aBrand && bBrand) return 1;
      }

      // Default: popularity
      return b.reviewCount - a.reviewCount;
    });
  }, [filters, catalog]);

  // Currently displayed slice
  const displayedPhones = filteredPhones.slice(0, visibleCount);
  const inStockCount = useMemo(() => filteredPhones.filter((p) => p.inStock).length, [filteredPhones]);

  // Cart operations (Memoized with useCallback for 60fps rendering performance)
  const handleAddToCart = useCallback((
    phone: Smartphone,
    variant: SmartphoneVariant,
    color: SmartphoneColor
  ) => {
    setCartItems((prev) => {
      const existing = prev.find(
        (item) =>
          item.phone.id === phone.id &&
          item.selectedVariant.id === variant.id &&
          item.selectedColor.name === color.name
      );
      if (existing) {
        return prev.map((item) =>
          item === existing ? { ...item, quantity: item.quantity + 1 } : item
        );
      }
      return [
        ...prev,
        {
          phone,
          selectedColor: color,
          selectedVariant: variant,
          quantity: 1,
        },
      ];
    });
    setIsCartOpen(true);
  }, []);

  const handleQuickBuy = useCallback((
    phone: Smartphone,
    variant: SmartphoneVariant,
    color: SmartphoneColor
  ) => {
    setQuickBuyPhone(phone);
    setQuickBuyVariant(variant);
    setQuickBuyColor(color);
    setIsQuickBuyOpen(true);
  }, []);

  // Compare operations (Memoized)
  const handleToggleCompare = useCallback((phone: Smartphone) => {
    setComparingPhones((prev) => {
      const exists = prev.find((p) => p.id === phone.id);
      if (exists) {
        return prev.filter((p) => p.id !== phone.id);
      }
      if (prev.length >= 3) {
        alert('You can compare a maximum of 3 mobiles at a time.');
        return prev;
      }
      return [...prev, phone];
    });
  }, []);

  const handleSelectBrand = useCallback((brand: string) => {
    if (brand === 'All Brands') {
      setFilters((prev) => ({ ...prev, selectedBrands: [], searchQuery: '' }));
    } else {
      setFilters((prev) => {
        const isCurrent = prev.selectedBrands.length === 1 && prev.selectedBrands[0] === brand;
        return {
          ...prev,
          selectedBrands: isCurrent ? [] : [brand],
          searchQuery: '',
        };
      });
    }
    const catalogEl = document.getElementById('catalog');
    if (catalogEl) {
      catalogEl.scrollIntoView({ behavior: 'smooth' });
    }
  }, []);

  const handleFilterBudget = useCallback(() => {
    setFilters((prev) => ({
      ...prev,
      selectedBrands: [],
      priceRange: [0, 35000],
      searchQuery: '',
      specFilter: undefined,
    }));
    const catalogEl = document.getElementById('catalog');
    if (catalogEl) {
      catalogEl.scrollIntoView({ behavior: 'smooth' });
    }
  }, []);

  const handleFilterKeypad = useCallback(() => {
    setFilters((prev) => ({
      ...prev,
      selectedBrands: ['Nokia', 'Itel'],
      priceRange: [0, 700000],
      searchQuery: '',
      specFilter: undefined,
    }));
    const catalogEl = document.getElementById('catalog');
    if (catalogEl) {
      catalogEl.scrollIntoView({ behavior: 'smooth' });
    }
  }, []);

  const handleSearch = useCallback((query: string) => {
    const clean = sanitizeText(query, 100).trim();
    setFilters((prev) => ({
      ...prev,
      searchQuery: clean,
      selectedBrands: [], // Clear previously locked brand filters so the search isn't blocked!
      priceRange: [0, 700000],
      specFilter: undefined,
    }));

    if (typeof window !== 'undefined') {
      const url = new URL(window.location.href);
      if (clean) {
        url.searchParams.set('search', clean);
        url.searchParams.delete('q');
        url.searchParams.delete('query');
      } else {
        url.searchParams.delete('search');
        url.searchParams.delete('q');
        url.searchParams.delete('query');
      }
      url.hash = 'catalog';
      window.history.pushState({}, '', url.toString());
    }

    setTimeout(() => {
      const catalogEl = document.getElementById('catalog');
      if (catalogEl) {
        catalogEl.scrollIntoView({ behavior: 'smooth' });
      }
    }, 50);
  }, []);

  const handleResetAllFilters = useCallback(() => {
    setFilters({
      searchQuery: '',
      selectedBrands: [],
      priceRange: [0, 700000],
      selectedRam: [],
      selectedStorage: [],
      ptaApprovedOnly: false,
      inStockOnly: false,
      sortBy: 'popularity',
      specFilter: undefined,
    });
    if (typeof window !== 'undefined') {
      const url = new URL(window.location.href);
      url.search = '';
      window.history.replaceState({}, '', url.toString());
    }
  }, []);

  const handleClearFilter = (key: string, val?: string) => {
    if (key === 'brand' && val) {
      setFilters((prev) => ({
        ...prev,
        selectedBrands: prev.selectedBrands.filter((b) => b !== val),
      }));
    } else if (key === 'search') {
      setFilters((prev) => ({ ...prev, searchQuery: '' }));
      if (typeof window !== 'undefined') {
        const url = new URL(window.location.href);
        url.searchParams.delete('search');
        url.searchParams.delete('q');
        url.searchParams.delete('query');
        window.history.replaceState({}, '', url.toString());
      }
    } else if (key === 'ram' && val) {
      setFilters((prev) => ({
        ...prev,
        selectedRam: prev.selectedRam.filter((r) => r !== val),
      }));
    } else if (key === 'storage' && val) {
      setFilters((prev) => ({
        ...prev,
        selectedStorage: prev.selectedStorage.filter((s) => s !== val),
      }));
    } else if (key === 'pta') {
      setFilters((prev) => ({ ...prev, ptaApprovedOnly: false }));
    } else if (key === 'inStock') {
      setFilters((prev) => ({ ...prev, inStockOnly: false }));
    } else if (key === 'price') {
      setFilters((prev) => ({ ...prev, priceRange: [0, 700000] }));
    } else if (key === 'spec') {
      setFilters((prev) => ({ ...prev, specFilter: undefined }));
    }
  };

  const hasActiveFilters =
    filters.searchQuery.trim() !== '' ||
    filters.selectedBrands.length > 0 ||
    filters.selectedRam.length > 0 ||
    filters.selectedStorage.length > 0 ||
    filters.ptaApprovedOnly ||
    filters.inStockOnly ||
    filters.priceRange[0] > 0 ||
    filters.priceRange[1] < 700000 ||
    Boolean(filters.specFilter);

  return (
    <div className="min-h-screen bg-[#f1f3f6] text-slate-900 flex flex-col font-sans w-full max-w-full overflow-x-hidden">
      {/* PriceOye Inspired Navbar */}
      <Navbar
        compareCount={comparingPhones.length}
        cartCount={cartItems.reduce((acc, item) => acc + item.quantity, 0)}
        onOpenCompare={() => setIsCompareModalOpen(true)}
        onOpenCart={() => setIsCartOpen(true)}
        onSelectBrand={handleSelectBrand}
        onSearch={handleSearch}
        initialSearchQuery={filters.searchQuery}
        activeBrand={
          filters.selectedBrands.length === 1
            ? filters.selectedBrands[0]
            : 'All Brands'
        }
      />

      <main className="flex-1 max-w-7xl w-full mx-auto px-3 sm:px-6 lg:px-8 py-4 sm:py-5">
        {/* Hero Banner Showcase */}
        <HeroBanner
          onQuickFilter={handleSelectBrand}
          onFilterBudget={handleFilterBudget}
          onFilterKeypad={handleFilterKeypad}
          onOpenEMIModal={() => setIsInstallmentManualOpen(true)}
        />
        {/* Interactive Infinite Brand Marquee */}
        <BrandMarquee
          onSelectBrand={handleSelectBrand}
          activeBrand={filters.selectedBrands.length === 1 ? filters.selectedBrands[0] : undefined}
          brandCounts={catalog.reduce((acc, p) => {
            acc[p.brand] = (acc[p.brand] || 0) + 1;
            return acc;
          }, {} as Record<string, number>)}
        />


        {/* PriceOye Inspired: Shop by Brand Avatar Grid */}
        <section className="mt-8">
          <div className="flex items-center justify-between mb-3 px-1">
            <div>
              <h2 className="text-lg sm:text-xl font-black text-slate-950 tracking-tight font-sans">
                Shop by Brand
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Official Pakistani PTA DIRBS compliant stock from top manufacturers
              </p>
            </div>
            <button
              onClick={() => handleSelectBrand('All Brands')}
              className="text-xs font-bold text-[#136ab5] hover:text-[#48afff] transition-colors cursor-pointer"
            >
              View All Brands →
            </button>
          </div>

          <div className="flex sm:grid sm:grid-cols-5 lg:grid-cols-10 gap-2.5 sm:gap-3 overflow-x-auto pb-2 sm:pb-0 scrollbar-none">
            {[
              { name: 'Apple', logo: '', color: 'bg-black text-white' },
              { name: 'Samsung', logo: 'SAMSUNG', color: 'bg-[#1428a0] text-white' },
              { name: 'Xiaomi', logo: 'mi', color: 'bg-[#ff6900] text-white' },
              { name: 'Infinix', logo: 'INFINIX', color: 'bg-black text-[#00b050]' },
              { name: 'Tecno', logo: 'TECNO', color: 'bg-[#0033a0] text-white' },
              { name: 'Vivo', logo: 'vivo', color: 'bg-[#0047ba] text-white' },
              { name: 'Oppo', logo: 'OPPO', color: 'bg-[#008544] text-white' },
              { name: 'Realme', logo: 'realme', color: 'bg-[#ffc915] text-black' },
              { name: 'Nokia', logo: 'NOKIA', color: 'bg-[#124191] text-white' },
              { name: 'Itel', logo: 'itel', color: 'bg-[#d32f2f] text-white' },
            ].map((b) => {
              const isSelected = filters.selectedBrands.includes(b.name);
              const count = catalog.filter((p) => p.brand.toLowerCase() === b.name.toLowerCase()).length;
              return (
                <button
                  key={b.name}
                  onClick={() => handleSelectBrand(b.name)}
                  className={`group shrink-0 min-w-[86px] sm:min-w-0 flex flex-col items-center justify-center p-2.5 sm:p-3 rounded-2xl bg-white border transition-all duration-200 cursor-pointer ${
                    isSelected
                      ? 'border-[#48afff] ring-2 ring-[#48afff]/30 shadow-md bg-sky-50/40'
                      : 'border-slate-200/80 shadow-[0_2px_8px_rgba(0,0,0,0.03)] hover:border-[#48afff] hover:shadow-lg hover:-translate-y-1'
                  }`}
                >
                  <div className={`w-10 h-10 sm:w-11 sm:h-11 rounded-full flex items-center justify-center font-black text-xs shadow-xs group-hover:scale-110 transition-transform ${b.color}`}>
                    {b.name === 'Apple' ? '' : b.name === 'Xiaomi' ? 'mi' : b.name.slice(0, 3).toUpperCase()}
                  </div>
                  <span className={`text-[11px] sm:text-xs font-bold mt-1.5 sm:mt-2 truncate transition-colors ${
                    isSelected ? 'text-[#136ab5]' : 'text-slate-800 group-hover:text-[#136ab5]'
                  }`}>
                    {b.name}
                  </span>
                  <span className="text-[9px] sm:text-[10px] text-slate-400 font-medium">
                    {count} {count === 1 ? 'model' : 'models'}
                  </span>
                </button>
              );
            })}
          </div>
        </section>

        {/* Cinematic Flagship Deal of the Day Spotlight */}
        <FlagshipSpotlight onOpenEMIModal={() => setIsInstallmentManualOpen(true)} />


        {/* PriceOye Inspired: Shop by Budget Rail */}
        <section className="mt-5 p-3.5 sm:p-4 rounded-2xl bg-white border border-slate-200/80 shadow-[0_2px_10px_rgba(0,0,0,0.03)] flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <span className="text-xs font-black uppercase text-slate-500 tracking-wider">
              Shop by Budget:
            </span>
          </div>
          <div className="flex items-center gap-2 overflow-x-auto pb-1 sm:pb-0 scrollbar-none">
            {[
              { label: 'All Budgets', range: [0, 700000] },
              { label: 'Under 25K', range: [0, 25000] },
              { label: '25K - 40K', range: [25000, 40000] },
              { label: '40K - 60K', range: [40000, 60000] },
              { label: '60K - 100K', range: [60000, 100000] },
              { label: '100K - 150K', range: [100000, 150000] },
              { label: '150K+ Flagships', range: [150000, 700000] },
            ].map((budget) => {
              const isSelected =
                filters.priceRange[0] === budget.range[0] &&
                filters.priceRange[1] === budget.range[1];
              return (
                <button
                  key={budget.label}
                  onClick={() => {
                    setFilters((prev) => ({
                      ...prev,
                      priceRange: [budget.range[0], budget.range[1]],
                      selectedBrands: [],
                    }));
                    const cat = document.getElementById('catalog');
                    if (cat) cat.scrollIntoView({ behavior: 'smooth' });
                  }}
                  className={`btn-press whitespace-nowrap text-xs font-bold px-3.5 py-1.5 rounded-full transition-all cursor-pointer ${
                    isSelected
                      ? 'bg-[#0b3c68] text-white shadow-sm ring-2 ring-[#0b3c68]/30'
                      : 'bg-[#f1f3f6] hover:bg-slate-200/80 text-slate-800 hover:text-slate-950 border border-slate-200/80'
                  }`}
                >
                  {budget.label}
                </button>
              );
            })}
          </div>
        </section>

        {/* PriceOye Flash Deals & Price Drops Bar with Live Countdown Timer */}
        <section className="mt-8 p-5 sm:p-6 rounded-2xl bg-white border border-slate-200/80 shadow-[0_2px_12px_rgba(0,0,0,0.04)] relative overflow-hidden transition-all duration-300">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-4 border-b border-slate-100 relative z-10">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-[#fef3eb] border border-[#fcd5b8] text-[#f47708] flex items-center justify-center flex-shrink-0 animate-soft-bounce">
                <Flame className="w-5 h-5 fill-[#f47708] stroke-[#f47708] animate-pulse" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-lg sm:text-xl font-black text-slate-950 tracking-tight font-sans">
                    Flash Deals &amp; Price Drops
                  </h3>
                  <span className="relative flex items-center gap-1.5 text-[10px] font-black uppercase px-2.5 py-0.5 rounded-full bg-[#fef3eb] text-[#f47708] border border-[#fcd5b8]">
                    <span className="relative flex h-2 w-2">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#f88b2a] opacity-75"></span>
                      <span className="relative inline-flex rounded-full h-2 w-2 bg-[#f47708]"></span>
                    </span>
                    Up to 40% OFF
                  </span>
                </div>
                <p className="text-xs text-slate-500 mt-0.5">
                  Verified distributor prices with maximum savings across Pakistan.
                </p>
              </div>
            </div>

            {/* Live Countdown Pill */}
            <FlashSaleCountdown />
          </div>

          {/* Flash Deal Cards Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 pt-4">
            {flashSalePhones.map((phone) => (
              <PhoneCard
                key={phone.id}
                phone={phone}
                isComparing={comparingPhones.some((p) => p.id === phone.id)}
                onToggleCompare={handleToggleCompare}
                onAddToCart={handleAddToCart}
                onQuickBuy={handleQuickBuy}
              />
            ))}
          </div>
        </section>

        {/* Dedicated Accessories Showcase Section */}
        <section id="accessories" className="mt-8 p-5 sm:p-7 rounded-3xl bg-gradient-to-br from-slate-900 via-[#0b3c68] to-slate-950 text-white shadow-xl relative overflow-hidden border border-slate-800">
          {/* Background Ambient Glows */}
          <div className="absolute -right-20 -top-20 w-80 h-80 bg-sky-500/10 rounded-full blur-3xl pointer-events-none" />
          <div className="absolute -left-20 -bottom-20 w-80 h-80 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />

          {/* Section Header */}
          <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4 pb-6 border-b border-white/10">
            <div>
              <div className="flex flex-wrap items-center gap-2 mb-2">
                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-amber-400 text-slate-950 shadow-sm">
                  <Sparkles className="w-3 h-3 fill-slate-950" />
                  New Collection
                </span>
                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-white/10 text-white border border-white/20">
                  <ShieldCheck className="w-3 h-3 text-emerald-400" />
                  100% Original Brand Warranty
                </span>
                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-white/10 text-white border border-white/20">
                  <PackageCheck className="w-3 h-3 text-sky-400" />
                  Open-Parcel Delivery
                </span>
              </div>
              <h2 className="text-xl sm:text-3xl font-black tracking-tight text-white font-sans">
                Genuine Mobile Accessories &amp; Smart Gadgets
              </h2>
              <p className="text-xs sm:text-sm text-slate-300 mt-1 max-w-2xl">
                Official Oraimo Smartwatches, Heavy-Duty Fast Charging Cables, and Open-Ear Bluetooth Earphones with genuine distributor warranty.
              </p>
            </div>

            {/* Quick Category Filter Pills */}
            <div className="flex items-center gap-1.5 sm:gap-2 overflow-x-auto pb-1 md:pb-0 scrollbar-none">
              {[
                { id: 'All', label: 'All Accessories', count: allAccessories.length, icon: Sparkles },
                { id: 'Smartwatch', label: 'Smart Watches', count: allAccessories.filter(a => a.accessoryType === 'Smartwatch').length, icon: Watch },
                { id: 'Earbuds', label: 'Wireless Earbuds', count: allAccessories.filter(a => a.accessoryType === 'Earbuds').length, icon: Headphones },
                { id: 'Cable', label: 'Charging Cables', count: allAccessories.filter(a => a.accessoryType === 'Cable').length, icon: Cable },
              ].map((tab) => {
                const isSelected = accessoryTab === tab.id;
                const TabIcon = tab.icon;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setAccessoryTab(tab.id as any)}
                    className={`btn-press whitespace-nowrap text-xs font-bold px-3 sm:px-4 py-2 rounded-full transition-all cursor-pointer flex items-center gap-1.5 ${
                      isSelected
                        ? 'bg-amber-400 text-slate-950 font-black shadow-lg shadow-amber-400/20 scale-105'
                        : 'bg-white/10 hover:bg-white/20 text-white border border-white/15'
                    }`}
                  >
                    <TabIcon className="w-3.5 h-3.5" />
                    <span>{tab.label}</span>
                    <span
                      className={`text-[10px] px-1.5 py-0.2 rounded-full font-bold ${
                        isSelected ? 'bg-slate-950 text-white' : 'bg-white/20 text-white'
                      }`}
                    >
                      {tab.count}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Accessories Cards Grid */}
          <div className="relative z-10 grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 sm:gap-4 pt-6 text-slate-900">
            {displayedAccessories.map((item) => (
              <PhoneCard
                key={item.id}
                phone={item}
                isComparing={comparingPhones.some((p) => p.id === item.id)}
                onToggleCompare={handleToggleCompare}
                onAddToCart={handleAddToCart}
                onQuickBuy={handleQuickBuy}
              />
            ))}
          </div>

          {/* Section Trust Guarantees Bar */}
          <div className="relative z-10 mt-6 pt-5 border-t border-white/10 grid grid-cols-2 sm:grid-cols-4 gap-3 text-center sm:text-left">
            <div className="flex items-center gap-2.5 bg-white/5 rounded-xl p-2.5 border border-white/10">
              <ShieldCheck className="w-5 h-5 text-emerald-400 shrink-0" />
              <div>
                <p className="text-[11px] font-bold text-white">100% Genuine Box-Pack</p>
                <p className="text-[9px] text-slate-400">Official Oraimo Pakistan Warranty</p>
              </div>
            </div>
            <div className="flex items-center gap-2.5 bg-white/5 rounded-xl p-2.5 border border-white/10">
              <PackageCheck className="w-5 h-5 text-sky-400 shrink-0" />
              <div>
                <p className="text-[11px] font-bold text-white">Open-Parcel Delivery</p>
                <p className="text-[9px] text-slate-400">Inspect before paying COD rider</p>
              </div>
            </div>
            <div className="flex items-center gap-2.5 bg-white/5 rounded-xl p-2.5 border border-white/10">
              <Truck className="w-5 h-5 text-amber-400 shrink-0" />
              <div>
                <p className="text-[11px] font-bold text-white">TCS Express Shipping</p>
                <p className="text-[9px] text-slate-400">24-48 hr fast dispatch</p>
              </div>
            </div>
            <div className="flex items-center gap-2.5 bg-white/5 rounded-xl p-2.5 border border-white/10">
              <Zap className="w-5 h-5 text-rose-400 shrink-0" />
              <div>
                <p className="text-[11px] font-bold text-white">Extra Instant Discounts</p>
                <p className="text-[9px] text-slate-400">Coupon codes apply at checkout</p>
              </div>
            </div>
          </div>
        </section>

        {/* Main Catalog Section */}
        <section id="catalog" className="pt-10">
          {/* Section Header & Sort */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between pb-6 gap-4 border-b border-slate-200">
            <div>
              <div className="flex flex-wrap items-center gap-2.5">
                <h2 className="text-xl sm:text-2xl font-extrabold tracking-tight text-slate-950 font-sans">
                  Mobile Phones Catalog
                </h2>
                <span className="px-3 py-1 rounded-full text-xs font-black bg-sky-100 text-[#136ab5] border border-sky-200">
                  {filteredPhones.length} Verified Mobiles
                </span>
                <span className="px-3 py-1 rounded-full text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-200 flex items-center gap-1.5 shadow-xs">
                  <span className="relative flex h-2 w-2">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
                  </span>
                  {inStockCount} In Stock &amp; Ready to Order
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-1">
                PTA DIRBS approved phones with brand warranties, 0% EMI installments, and Open-Parcel COD.
              </p>
            </div>

            {/* Controls: All Filters Drawer Trigger & Sort By */}
            <div className="flex items-center gap-2.5 w-full sm:w-auto justify-between sm:justify-end">
              <button
                onClick={() => setIsMobileFiltersOpen(true)}
                className="flex items-center gap-2 px-4 py-2 rounded-full text-xs font-bold bg-white border border-slate-200 hover:border-[#48afff] hover:bg-sky-50/50 text-slate-800 cursor-pointer shadow-xs transition-all btn-press"
              >
                <SlidersHorizontal className="w-3.5 h-3.5 text-[#136ab5]" />
                <span>All Filters</span>
                {(filters.selectedBrands.length > 0 || filters.selectedRam.length > 0 || filters.selectedStorage.length > 0 || filters.ptaApprovedOnly || filters.inStockOnly || filters.priceRange[0] > 0 || filters.priceRange[1] < 700000) && (
                  <span className="w-5 h-5 rounded-full bg-[#136ab5] text-white text-[10px] font-black flex items-center justify-center ml-0.5">
                    {filters.selectedBrands.length + (filters.ptaApprovedOnly ? 1 : 0) + (filters.inStockOnly ? 1 : 0) + filters.selectedRam.length + filters.selectedStorage.length + (filters.priceRange[0] > 0 || filters.priceRange[1] < 700000 ? 1 : 0)}
                  </span>
                )}
              </button>

              <div className="flex items-center gap-2">
                <span className="text-xs text-slate-400 font-bold hidden sm:inline">
                  Sort By:
                </span>
                <select
                  value={filters.sortBy}
                  onChange={(e) =>
                    setFilters((prev) => ({
                      ...prev,
                      sortBy: e.target.value as FilterState['sortBy'],
                    }))
                  }
                  className="px-4 py-2 rounded-full text-xs font-bold bg-white border border-slate-200 text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#48afff] cursor-pointer shadow-sm"
                >
                  <option value="popularity">Most Popular</option>
                  <option value="price-asc">Price: Low to High</option>
                  <option value="price-desc">Price: High to Low</option>
                  <option value="discount">Highest Discount</option>
                  <option value="rating">Top Customer Rated</option>
                </select>
              </div>
            </div>
          </div>


          {/* Quick Filter One-Tap Pills */}
          <div className="flex items-center gap-2 overflow-x-auto py-3 scrollbar-none border-b border-slate-200/70">
            <button
              onClick={handleResetAllFilters}
              className={`px-3 py-1.5 rounded-full text-xs font-bold shrink-0 transition-all cursor-pointer ${
                !hasActiveFilters
                  ? 'bg-[#0b3c68] text-white shadow-xs'
                  : 'bg-white text-slate-700 hover:bg-slate-100 border border-slate-200'
              }`}
            >
              All Mobiles
            </button>
            <button
              onClick={() => {
                setCatalogCategory(catalogCategory === 'accessories' ? 'all' : 'accessories');
              }}
              className={`px-3 py-1.5 rounded-full text-xs font-bold shrink-0 transition-all cursor-pointer flex items-center gap-1.5 ${
                catalogCategory === 'accessories'
                  ? 'bg-amber-500 text-white shadow-xs'
                  : 'bg-white text-slate-700 hover:bg-slate-100 border border-slate-200'
              }`}
            >
              <span>🎧 Accessories (${allAccessories.length})</span>
            </button>
            <button
              onClick={() => setFilters((p) => ({ ...p, inStockOnly: !p.inStockOnly }))}
              className={`px-3 py-1.5 rounded-full text-xs font-bold shrink-0 transition-all cursor-pointer flex items-center gap-1.5 ${
                filters.inStockOnly
                  ? 'bg-emerald-600 text-white shadow-xs'
                  : 'bg-white text-slate-700 hover:bg-slate-100 border border-slate-200'
              }`}
            >
              <span className={`w-2 h-2 rounded-full ${filters.inStockOnly ? 'bg-white' : 'bg-emerald-500'}`} />
              <span>In Stock Only</span>
            </button>
            <button
              onClick={() => setFilters((p) => ({ ...p, ptaApprovedOnly: !p.ptaApprovedOnly }))}
              className={`px-3 py-1.5 rounded-full text-xs font-bold shrink-0 transition-all cursor-pointer flex items-center gap-1.5 ${
                filters.ptaApprovedOnly
                  ? 'bg-sky-600 text-white shadow-xs'
                  : 'bg-white text-slate-700 hover:bg-slate-100 border border-slate-200'
              }`}
            >
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>100% PTA Approved</span>
            </button>
            <button
              onClick={() => setFilters((p) => ({ ...p, priceRange: p.priceRange[1] === 25000 ? [0, 700000] : [0, 25000] }))}
              className={`px-3 py-1.5 rounded-full text-xs font-bold shrink-0 transition-all cursor-pointer ${
                filters.priceRange[1] === 25000 && filters.priceRange[0] === 0
                  ? 'bg-[#136ab5] text-white shadow-xs'
                  : 'bg-white text-slate-700 hover:bg-slate-100 border border-slate-200'
              }`}
            >
              Under 25K
            </button>
            <button
              onClick={() => setFilters((p) => ({ ...p, priceRange: p.priceRange[0] === 25000 && p.priceRange[1] === 50000 ? [0, 700000] : [25000, 50000] }))}
              className={`px-3 py-1.5 rounded-full text-xs font-bold shrink-0 transition-all cursor-pointer ${
                filters.priceRange[0] === 25000 && filters.priceRange[1] === 50000
                  ? 'bg-[#136ab5] text-white shadow-xs'
                  : 'bg-white text-slate-700 hover:bg-slate-100 border border-slate-200'
              }`}
            >
              25K – 50K
            </button>
            <button
              onClick={() => setFilters((p) => ({ ...p, priceRange: p.priceRange[0] === 50000 && p.priceRange[1] === 100000 ? [0, 700000] : [50000, 100000] }))}
              className={`px-3 py-1.5 rounded-full text-xs font-bold shrink-0 transition-all cursor-pointer ${
                filters.priceRange[0] === 50000 && filters.priceRange[1] === 100000
                  ? 'bg-[#136ab5] text-white shadow-xs'
                  : 'bg-white text-slate-700 hover:bg-slate-100 border border-slate-200'
              }`}
            >
              50K – 100K
            </button>
            <button
              onClick={() => setFilters((p) => ({ ...p, priceRange: p.priceRange[0] === 200000 ? [0, 700000] : [200000, 700000] }))}
              className={`px-3 py-1.5 rounded-full text-xs font-bold shrink-0 transition-all cursor-pointer ${
                filters.priceRange[0] === 200000
                  ? 'bg-purple-700 text-white shadow-xs'
                  : 'bg-white text-slate-700 hover:bg-slate-100 border border-slate-200'
              }`}
            >
              200K+ Flagships
            </button>
            <button
              onClick={handleFilterKeypad}
              className={`px-3 py-1.5 rounded-full text-xs font-bold shrink-0 transition-all cursor-pointer ${
                filters.selectedBrands.includes('Nokia') && filters.selectedBrands.includes('Itel')
                  ? 'bg-amber-600 text-white shadow-xs'
                  : 'bg-white text-slate-700 hover:bg-slate-100 border border-slate-200'
              }`}
            >
              Keypad Button Phones
            </button>
          </div>

          {/* Active Filter Chips Bar */}
          {hasActiveFilters && (
            <div className="flex flex-wrap items-center gap-2 py-3.5 border-b border-slate-200">
              <span className="text-xs text-slate-400 font-bold mr-1">Active:</span>

              {filters.searchQuery.trim() && (
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-sky-50 text-[#136ab5] border border-sky-200">
                  Search: &quot;{filters.searchQuery}&quot;
                  <button onClick={() => handleClearFilter('search')} aria-label="Remove search filter" className="hover:text-[#0b4372] p-0.5 cursor-pointer">
                    <X className="w-3 h-3" />
                  </button>
                </span>
              )}

              {filters.selectedBrands.map((b) => (
                <span key={b} className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-white text-slate-800 border border-slate-200 shadow-2xs">
                  {b}
                  <button onClick={() => handleClearFilter('brand', b)} aria-label={`Remove brand filter ${b}`} className="hover:text-rose-600 p-0.5 cursor-pointer">
                    <X className="w-3 h-3" />
                  </button>
                </span>
              ))}

              {(filters.priceRange[0] > 0 || filters.priceRange[1] < 700000) && (
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-white text-slate-800 border border-slate-200 shadow-2xs">
                  {filters.priceRange[0] > 0 && filters.priceRange[1] < 700000
                    ? `${formatPKR(filters.priceRange[0])} - ${formatPKR(filters.priceRange[1])}`
                    : filters.priceRange[0] > 0
                    ? `From ${formatPKR(filters.priceRange[0])}`
                    : `Up to ${formatPKR(filters.priceRange[1])}`}
                  <button onClick={() => handleClearFilter('price')} aria-label="Remove price filter" className="hover:text-rose-600 p-0.5 cursor-pointer">
                    <X className="w-3 h-3" />
                  </button>
                </span>
              )}

              {filters.selectedRam.map((r) => (
                <span key={r} className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-white text-slate-800 border border-slate-200 shadow-2xs">
                  RAM: {r}
                  <button onClick={() => handleClearFilter('ram', r)} aria-label={`Remove RAM filter ${r}`} className="hover:text-rose-600 p-0.5 cursor-pointer">
                    <X className="w-3 h-3" />
                  </button>
                </span>
              ))}

              {filters.selectedStorage.map((s) => (
                <span key={s} className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-white text-slate-800 border border-slate-200 shadow-2xs">
                  Storage: {s}
                  <button onClick={() => handleClearFilter('storage', s)} aria-label={`Remove storage filter ${s}`} className="hover:text-rose-600 p-0.5 cursor-pointer">
                    <X className="w-3 h-3" />
                  </button>
                </span>
              ))}

              {filters.ptaApprovedOnly && (
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-800 border border-emerald-200 shadow-2xs">
                  PTA Approved Only
                  <button onClick={() => handleClearFilter('pta')} aria-label="Remove PTA Approved filter" className="hover:text-emerald-950 p-0.5 cursor-pointer">
                    <X className="w-3 h-3" />
                  </button>
                </span>
              )}

              {filters.inStockOnly && (
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-sky-50 text-[#136ab5] border border-sky-200 shadow-2xs">
                  In Stock Only
                  <button onClick={() => handleClearFilter('inStock')} aria-label="Remove In Stock filter" className="hover:text-[#0b4372] p-0.5 cursor-pointer">
                    <X className="w-3 h-3" />
                  </button>
                </span>
              )}

              {filters.specFilter && (
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-sky-50 text-[#136ab5] border border-sky-200 shadow-2xs">
                  Spec: {filters.specFilter === '120hz-amoled' ? '120Hz AMOLED Displays' : filters.specFilter}
                  <button onClick={() => handleClearFilter('spec')} aria-label="Remove display spec filter" className="hover:text-[#0b4372] p-0.5 cursor-pointer">
                    <X className="w-3 h-3" />
                  </button>
                </span>
              )}

              <button
                onClick={handleResetAllFilters}
                className="text-xs text-rose-600 hover:underline font-bold ml-auto cursor-pointer"
              >
                Clear All
              </button>
            </div>
          )}

          {/* Full-Width Catalog Products Grid (No Left Void) */}
          <div className="w-full mt-6">
            {filteredPhones.length > 0 ? (
              <>
                <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-5">
                    {displayedPhones.map((phone, index) => (
                      <React.Fragment key={phone.id}>
                        {/* Section Divider when list transitions to out-of-stock items */}
                        {!phone.inStock && (index === 0 || displayedPhones[index - 1]?.inStock) && (
                          <div className="col-span-full my-6 p-4 sm:p-5 rounded-3xl bg-slate-100 border border-slate-200/90 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shadow-xs">
                            <div className="flex items-center gap-3">
                              <div className="w-10 h-10 rounded-2xl bg-white border border-slate-200 text-slate-600 flex items-center justify-center flex-shrink-0 text-base font-bold shadow-xs">
                                📦
                              </div>
                              <div>
                                <h4 className="text-sm font-extrabold text-slate-950">
                                  Currently Out-of-Stock Models (Archive &amp; Next Batch)
                                </h4>
                                <p className="text-xs text-slate-500 mt-0.5">
                                  The models below are temporarily out of stock. All in-stock models are prioritized above.
                                </p>
                              </div>
                            </div>
                            <span className="px-3 py-1 rounded-full bg-white text-slate-700 text-[11px] font-bold border border-slate-200">
                              Subsequent Pages
                            </span>
                          </div>
                        )}
                        <PhoneCard
                          phone={phone}
                          isComparing={comparingPhones.some((p) => p.id === phone.id)}
                          onToggleCompare={handleToggleCompare}
                          onAddToCart={handleAddToCart}
                          onQuickBuy={handleQuickBuy}
                          priority={index < 4}
                        />
                        {/* Banner 1: S24 Ultra & Galaxy AI Spotlight */}
                        {index === 5 && (
                          <CatalogBannerS24Ultra onSelectBrand={handleSelectBrand} />
                        )}
                        {/* Banner 2: Dual Split Promo Cards (Budget Kings & Keypad Classics) */}
                        {index === 11 && (
                          <CatalogBannerDualCards
                            onSelectBrand={handleSelectBrand}
                            onFilterBudget={handleFilterBudget}
                            onFilterKeypad={handleFilterKeypad}
                          />
                        )}
                        {/* Banner 3: 0% Markup Bank EMI Installments */}
                        {index === 17 && (
                          <CatalogBannerBankEMI
                            onOpenEMIModal={() => setIsInstallmentManualOpen(true)}
                          />
                        )}
                        {/* Banner 4: Open-Parcel Cash on Delivery Guarantee */}
                        {index === 23 && (
                          <CatalogBannerOpenParcel />
                        )}
                      </React.Fragment>
                    ))}
                  </div>

                  {/* Fallback guarantee banner for short lists */}
                  {displayedPhones.length < 6 && (
                    <div className="mt-6">
                      <CatalogBannerOpenParcel />
                    </div>
                  )}

                  {/* Load More Pagination Bar */}
                  {filteredPhones.length > visibleCount && (
                    <div className="mt-10 p-6 sm:p-8 bg-white rounded-3xl border border-slate-200 text-center space-y-4 shadow-sm">
                      <div className="flex flex-col sm:flex-row items-center justify-between gap-2 text-xs text-slate-500 font-medium">
                        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-200 font-bold">
                          <CheckCircle className="w-3.5 h-3.5 text-emerald-600" />
                          {`Front page: ${Math.min(displayedPhones.length, inStockCount)} Available In-Stock Mobiles`}
                        </span>
                        <span>
                          Showing <strong className="text-slate-950 font-bold">{displayedPhones.length}</strong> of{' '}
                          <strong className="text-slate-950 font-bold">{filteredPhones.length}</strong> mobile phones
                        </span>
                      </div>
                      <div className="w-full max-w-xs mx-auto bg-slate-100 h-2.5 rounded-full overflow-hidden">
                        <div
                          className="bg-[#48afff] h-full transition-all duration-300"
                          style={{
                            width: `${(displayedPhones.length / filteredPhones.length) * 100}%`,
                          }}
                        />
                      </div>
                      <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
                        <button
                          onClick={() => setVisibleCount((prev) => prev + 24)}
                          className="px-6 py-3 rounded-full bg-[#48afff] hover:bg-[#229eff] text-white text-xs sm:text-sm font-black shadow-md shadow-[#48afff]/25 cursor-pointer btn-press btn-shimmer"
                        >
                          Load Next 24 Mobiles (Page {Math.floor(displayedPhones.length / 24) + 1})
                        </button>
                        <button
                          onClick={() => setVisibleCount(filteredPhones.length)}
                          className="px-5 py-3 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs sm:text-sm font-bold cursor-pointer border border-slate-200 btn-press"
                        >
                          View All ({filteredPhones.length})
                        </button>
                      </div>
                    </div>
                  )}
                </>
              ) : (
                <div className="flex flex-col items-center justify-center p-12 bg-white rounded-3xl border border-slate-200 text-center shadow-sm">
                  <div className="w-12 h-12 rounded-2xl bg-slate-100 flex items-center justify-center text-slate-400 mb-3 animate-soft-bounce">
                    <Filter className="w-6 h-6 stroke-[1.5]" />
                  </div>
                  <h3 className="text-sm font-bold text-slate-950">
                    No mobile phones match these criteria
                  </h3>
                  <p className="text-xs text-slate-400 mt-1 max-w-sm">
                    Try adjusting your price slider or resetting brand and RAM filters.
                  </p>
                  <button
                    onClick={handleResetAllFilters}
                    className="mt-4 px-6 py-2.5 rounded-full bg-[#48afff] hover:bg-[#229eff] text-white text-xs font-black transition-colors cursor-pointer btn-press"
                  >
                    Reset All Filters
                  </button>
                </div>
              )}
          </div>
        </section>

        {/* Apple-Style Bento Trust Grid */}
        <BentoTrustGrid onOpenPolicyModal={setActivePolicyModal} />
      </main>

      {/* Floating Comparison Drawer */}
      <ComparisonDock
        comparingPhones={comparingPhones}
        isOpenModal={isCompareModalOpen}
        onToggleModal={setIsCompareModalOpen}
        onRemovePhone={(id) =>
          setComparingPhones((prev) => prev.filter((p) => p.id !== id))
        }
        onClearAll={() => setComparingPhones([])}
        onSelectForCart={(phone) => {
          const inStockVariant = phone.variants.find((v) => v.inStock) || phone.variants[0];
          const inStockColor = phone.colors.find((c) => {
            if (c.inStock === false) return false;
            if (phone.colorStockMap && phone.colorStockMap[c.name] && !phone.colorStockMap[c.name].inStock) return false;
            return true;
          }) || phone.colors.find((c) => c.inStock !== false) || phone.colors[0];
          handleAddToCart(phone, inStockVariant, inStockColor);
        }}
      />

      {/* Slide-over Cart & Checkout */}
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

      {/* Quick Purchase One-Click Order Modal */}
      <QuickPurchaseModal
        phone={quickBuyPhone}
        selectedVariant={quickBuyVariant}
        selectedColor={quickBuyColor}
        isOpen={isQuickBuyOpen}
        onClose={() => setIsQuickBuyOpen(false)}
      />

      {/* Footer */}
      {/* Comprehensive 0% Markup Monthly Installment Guide & Manual Modal */}
      <InstallmentManualModal
        isOpen={isInstallmentManualOpen}
        onClose={() => {
          setIsInstallmentManualOpen(false);
          setInstallmentPhone(null);
        }}
        phone={installmentPhone}
      />

      <Footer />

      {/* Interactive Trust & Policies Informational Modal */}
      {activePolicyModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm animate-in fade-in duration-150">
          <div className="relative w-full max-w-lg bg-white rounded-3xl p-6 shadow-2xl border border-slate-200 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                {activePolicyModal === 'open-parcel' && <PackageCheck className="w-5 h-5 text-[#136ab5]" />}
                {activePolicyModal === 'pta-guide' && <ShieldCheck className="w-5 h-5 text-emerald-600" />}
                {activePolicyModal === 'warranty' && <Award className="w-5 h-5 text-indigo-600" />}
                {activePolicyModal === 'cod-terms' && <Truck className="w-5 h-5 text-amber-600" />}
                {activePolicyModal === 'installments' && <CreditCard className="w-5 h-5 text-purple-600" />}
                <h3 className="font-bold text-slate-950 text-base font-sans">
                  {activePolicyModal === 'open-parcel' && 'Open-Parcel Delivery Policy'}
                  {activePolicyModal === 'pta-guide' && 'PTA DIRBS Verification Guide'}
                  {activePolicyModal === 'warranty' && 'Official 1-Year Brand Warranty'}
                  {activePolicyModal === 'cod-terms' && 'Cash on Delivery (COD) Terms'}
                  {activePolicyModal === 'installments' && '0% Markup Installment Plans'}
                </h3>
              </div>
              <button
                onClick={() => setActivePolicyModal(null)}
                aria-label={activePolicyModal === 'installments' ? 'Close EMI modal' : 'Close policy details dialog'}
                title={activePolicyModal === 'installments' ? 'Close EMI modal' : 'Close dialog'}
                className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center text-slate-500 hover:text-slate-950 transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="text-xs text-slate-600 leading-relaxed space-y-3">
              {activePolicyModal === 'open-parcel' && (
                <>
                  <p className="font-bold text-slate-900">
                    Inspect before you pay! Zero risk, zero courier fraud.
                  </p>
                  <ol className="list-decimal pl-4 space-y-1.5">
                    <li>Rider brings the package to your doorstep.</li>
                    <li>Rider opens the flyer in front of you.</li>
                    <li>Verify the handset model, color, and box seal condition.</li>
                    <li>Pay cash or scan QR code only after you are 100% satisfied.</li>
                  </ol>
                  <p className="text-[11px] text-slate-400">
                    If anything is damaged or incorrect, hand it right back to the courier at zero cost to you.
                  </p>
                </>
              )}

              {activePolicyModal === 'pta-guide' && (
                <>
                  <p className="font-bold text-slate-900">
                    Every mobile phone in our 222-model catalog is 100% customs-duty cleared and PTA DIRBS approved.
                  </p>
                  <div className="bg-slate-100 p-3 rounded-2xl space-y-1 font-mono text-[11px] text-slate-800">
                    <div>1. Dial *#06# on the phone keypad to view IMEI</div>
                    <div>2. Send 15-digit IMEI via SMS to 8484</div>
                    <div>3. Or visit https://dirbs.pta.gov.pk</div>
                  </div>
                  <p>
                    Your status will read: <span className="font-bold text-emerald-700">&quot;IMEI is Compliant (PTA Approved)&quot;</span>. Never worry about sudden SIM blockage.
                  </p>
                </>
              )}

              {activePolicyModal === 'warranty' && (
                <>
                  <p className="font-bold text-slate-900">
                    Authorized brand service center network across Pakistan:
                  </p>
                  <ul className="list-disc pl-4 space-y-1">
                    <li><strong>Samsung:</strong> Official Samsung Care Centers nationwide.</li>
                    <li><strong>Apple:</strong> Mercantile &amp; FutureTech Authorized Centers.</li>
                    <li><strong>Xiaomi / Poco / Redmi:</strong> Airlink &amp; Smart Zone service hubs.</li>
                    <li><strong>Tecno &amp; Infinix:</strong> Carlcare service network.</li>
                    <li><strong>Vivo &amp; Oppo:</strong> Official Brand Centers in all major cities.</li>
                    <li><strong>Nokia &amp; Itel:</strong> HMD Global and authorized nationwide centers.</li>
                  </ul>
                  <p className="text-[11px] text-slate-400">
                    Your Nawira Traders invoice serves as your valid proof of purchase for all warranty claims.
                  </p>
                </>
              )}

              {activePolicyModal === 'installments' && (
                <>
                  <p className="font-bold text-slate-900">
                    0% Markup Installment Plans (Easy Monthly Installments):
                  </p>
                  <ul className="list-disc pl-4 space-y-1">
                    <li>Available on credit cards of: <strong>Bank Alfalah, Meezan Bank, Faysal Bank, and Silkbank</strong>.</li>
                    <li>Select 3, 6, or 12-month tenure during checkout.</li>
                    <li>Zero hidden fees, 100% Shariah-compliant markup arrangements.</li>
                  </ul>
                </>
              )}
            </div>

            <button
              onClick={() => setActivePolicyModal(null)}
              className="w-full py-2.5 rounded-full bg-slate-950 text-white text-xs font-bold hover:bg-[#136ab5] transition-colors cursor-pointer"
            >
              Understood
            </button>
          </div>
        </div>
      )}

      {/* Mobile Filter Slide-over Drawer */}
      {isMobileFiltersOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-xs flex justify-end animate-in fade-in duration-200">
          <div className="w-full max-w-md bg-white h-full flex flex-col shadow-2xl animate-in slide-in-from-right duration-200">
            {/* Header */}
            <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/70 shrink-0">
              <div className="flex items-center gap-2">
                <Filter className="w-4 h-4 text-[#0b3c68]" />
                <h3 className="text-sm font-black text-slate-900">
                  Filter Smartphones ({filteredPhones.length})
                </h3>
              </div>
              <button
                onClick={() => setIsMobileFiltersOpen(false)}
                className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-500 hover:text-slate-900 flex items-center justify-center transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Scrollable Filter Options */}
            <div className="flex-1 overflow-y-auto p-4">
              <FilterSidebar
                filters={filters}
                setFilters={setFilters}
                totalCount={catalog.length}
                filteredCount={filteredPhones.length}
              />
            </div>

            {/* Sticky Action Footer */}
            <div className="p-4 border-t border-slate-100 bg-white/95 backdrop-blur-md shrink-0">
              <button
                onClick={() => setIsMobileFiltersOpen(false)}
                className="w-full py-3.5 rounded-2xl bg-[#0b3c68] hover:bg-[#072847] text-white text-xs font-black shadow-md btn-press cursor-pointer flex items-center justify-center gap-2"
              >
                <span>Show {filteredPhones.length} Smartphones</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default function Home() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-slate-50 flex items-center justify-center text-slate-500 font-bold">
          Loading Nawira Traders Catalog...
        </div>
      }
    >
      <HomeContent />
    </Suspense>
  );
}
