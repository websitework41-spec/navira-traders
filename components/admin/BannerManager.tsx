'use client';

import React, { useState, useEffect, useMemo, useRef } from 'react';
import Link from 'next/link';
import {
  Sparkles,
  Plus,
  Trash2,
  Edit2,
  CheckCircle2,
  XCircle,
  ArrowUp,
  ArrowDown,
  RotateCcw,
  ExternalLink,
  Image as ImageIcon,
  Upload,
  Info,
  Check,
  Eye,
  Sliders,
  Tag,
  ShieldCheck,
  CreditCard,
  ArrowRight,
  Layers,
  Search,
  Percent,
} from 'lucide-react';
import { Smartphone, HeroBannerItem } from '@/types';
import { DEFAULT_HERO_BANNERS } from '@/lib/banners';
import { PhoneImageWithFallback } from '../PhoneImageWithFallback';

interface BannerManagerProps {
  products: Smartphone[];
  showToast: (msg: string) => void;
}

const GRADIENT_PRESETS = [
  { name: 'Deep Navy (Default)', value: 'from-[#0b2b4a] via-[#0f497a] to-[#136ab5]' },
  { name: 'Midnight Titanium', value: 'from-[#08182b] via-[#103254] to-[#1c5d99]' },
  { name: 'Emerald Flagship', value: 'from-[#052b1e] via-[#094732] to-[#0e694b]' },
  { name: 'Sunset Amber', value: 'from-[#2e1303] via-[#572706] to-[#8f3f08]' },
  { name: 'Royal Violet', value: 'from-[#1a0833] via-[#351066] to-[#591ba8]' },
  { name: 'Crimson Red', value: 'from-[#2d0909] via-[#541212] to-[#871d1d]' },
  { name: 'Stealth Onyx', value: 'from-[#111317] via-[#1b1f24] to-[#272c33]' },
];

export function BannerManager({ products, showToast }: BannerManagerProps) {
  const [banners, setBanners] = useState<HeroBannerItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingBannerId, setEditingBannerId] = useState<string | null>(null);

  // Form State
  const [formType, setFormType] = useState<'catalog' | 'custom'>('catalog');
  const [selectedProductSlug, setSelectedProductSlug] = useState<string>('');
  const [productSearchQuery, setProductSearchQuery] = useState('');
  const [bannerType, setBannerType] = useState<'product' | 'graphic'>('product');
  const [title, setTitle] = useState('');
  const [highlight, setHighlight] = useState('');
  const [subtitle, setSubtitle] = useState('');
  const [badge, setBadge] = useState('New Launch Offer');
  const [badgeColor, setBadgeColor] = useState('bg-[#48afff]/25 text-sky-200 border-[#48afff]/40');
  const [brand, setBrand] = useState('Samsung');
  const [specs, setSpecs] = useState('');
  const [pricePKR, setPricePKR] = useState<number>(0);
  const [originalPricePKR, setOriginalPricePKR] = useState<number>(0);
  const [discountPercent, setDiscountPercent] = useState<number>(0);
  const [image, setImage] = useState('');
  const [link, setLink] = useState('');
  const [ctaText, setCtaText] = useState('Shop Deal');
  const [gradient, setGradient] = useState(GRADIENT_PRESETS[0].value);
  const [isActive, setIsActive] = useState(true);
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Fetch Banners from API
  const fetchBanners = async () => {
    setIsLoading(true);
    try {
      const res = await fetch(`/api/admin/banners?_t=${Date.now()}`, { cache: 'no-store' });
      const data = await res.json();
      if (data.success && Array.isArray(data.banners)) {
        setBanners(data.banners);
        try {
          localStorage.setItem('naviratraders_banners', JSON.stringify(data.banners));
        } catch {}
      } else {
        setBanners(DEFAULT_HERO_BANNERS);
      }
    } catch {
      setBanners(DEFAULT_HERO_BANNERS);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchBanners();
  }, []);

  // Filtered products for quick catalog picker
  const filteredCatalogProducts = useMemo(() => {
    if (!productSearchQuery.trim()) return products.slice(0, 30);
    const q = productSearchQuery.toLowerCase();
    return products.filter(
      (p) =>
        p.name.toLowerCase().includes(q) ||
        p.brand.toLowerCase().includes(q) ||
        p.slug.toLowerCase().includes(q)
    ).slice(0, 30);
  }, [products, productSearchQuery]);

  // Handle Catalog Selection & Auto-fill
  const handleSelectCatalogProduct = (slug: string) => {
    const p = products.find((prod) => prod.slug === slug);
    if (!p) return;
    setSelectedProductSlug(slug);
    setTitle(p.name);
    setBrand(p.brand);
    setHighlight(p.specs.ptaStatus === 'PTA Approved' ? '100% PTA Approved' : 'Exclusive Launch');
    setSubtitle(p.tagline || `${p.brand} official flagship with express delivery across Pakistan.`);
    setBadge('Hot Deal of the Week');
    setPricePKR(p.basePricePKR);
    setOriginalPricePKR(p.originalPricePKR);
    setDiscountPercent(p.discountPercent || 0);
    setImage(p.colors[0]?.image || '');
    setLink(`/product/${p.slug}`);
    setCtaText(`Shop ${p.brand} Deal`);
    setSpecs(
      p.variants[0]
        ? `${p.variants[0].ram} • ${p.variants[0].storage}`
        : `${p.specs.processor?.split(' ')[0] || ''}`
    );
    setBannerType('product');
  };

  // Auto calculate discount percentage when prices change
  useEffect(() => {
    if (originalPricePKR > 0 && pricePKR > 0 && originalPricePKR > pricePKR) {
      const disc = Math.round(((originalPricePKR - pricePKR) / originalPricePKR) * 100);
      setDiscountPercent(disc);
    }
  }, [pricePKR, originalPricePKR]);

  // Reset Form
  const resetForm = () => {
    setEditingBannerId(null);
    setFormType('catalog');
    setSelectedProductSlug('');
    setProductSearchQuery('');
    setBannerType('product');
    setTitle('');
    setHighlight('');
    setSubtitle('');
    setBadge('Featured Deal');
    setBadgeColor('bg-[#48afff]/25 text-sky-200 border-[#48afff]/40');
    setBrand('Samsung');
    setSpecs('');
    setPricePKR(0);
    setOriginalPricePKR(0);
    setDiscountPercent(0);
    setImage('');
    setLink('/#catalog');
    setCtaText('Shop Deal');
    setGradient(GRADIENT_PRESETS[0].value);
    setIsActive(true);
  };

  // Open Edit Form
  const handleStartEdit = (b: HeroBannerItem) => {
    setEditingBannerId(b.id);
    setFormType('custom');
    setBannerType(b.bannerType || 'product');
    setTitle(b.title);
    setHighlight(b.highlight || '');
    setSubtitle(b.subtitle || '');
    setBadge(b.badge || 'Featured Deal');
    setBadgeColor(b.badgeColor || 'bg-[#48afff]/25 text-sky-200 border-[#48afff]/40');
    setBrand(b.brand || 'Navira');
    setSpecs(b.specs || '');
    setPricePKR(b.pricePKR || 0);
    setOriginalPricePKR(b.originalPricePKR || 0);
    setDiscountPercent(b.discountPercent || 0);
    setImage(b.image);
    setLink(b.link || '/#catalog');
    setCtaText(b.ctaText || 'Shop Deal');
    setGradient(b.gradient || GRADIENT_PRESETS[0].value);
    setIsActive(b.isActive !== false);
    setIsFormOpen(true);
  };

  // Handle Local File Upload
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      alert('Please upload an image file (PNG, JPG, WEBP).');
      return;
    }

    if (file.size > 4 * 1024 * 1024) {
      alert('Image size exceeds 4MB. Please choose a smaller image.');
      return;
    }

    setIsUploading(true);
    const reader = new FileReader();
    reader.onload = (uploadEvent) => {
      const result = uploadEvent.target?.result as string;
      if (result) {
        setImage(result);
        showToast('Image uploaded successfully!');
      }
      setIsUploading(false);
    };
    reader.onerror = () => {
      alert('Failed to read file.');
      setIsUploading(false);
    };
    reader.readAsDataURL(file);
  };

  // Save Banner (Add or Update)
  const handleSaveBanner = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) {
      alert('Please enter a banner title.');
      return;
    }
    if (!image.trim()) {
      alert('Please provide a banner or product image URL / file.');
      return;
    }

    const payload: HeroBannerItem = {
      id: editingBannerId || `banner-${Date.now()}`,
      badge: badge.trim() || 'Special Offer',
      badgeColor,
      title: title.trim(),
      highlight: highlight.trim(),
      subtitle: subtitle.trim(),
      phoneName: title.trim(),
      brand: brand.trim() || 'Navira Traders',
      specs: specs.trim(),
      pricePKR: Number(pricePKR) || 0,
      originalPricePKR: Number(originalPricePKR) || 0,
      discountPercent: Number(discountPercent) || 0,
      image: image.trim(),
      link: link.trim() || '/#catalog',
      ctaText: ctaText.trim() || 'Shop Deal',
      gradient,
      bannerType,
      aspectRatio: '16:9',
      isActive,
      order: editingBannerId
        ? (banners.find((b) => b.id === editingBannerId)?.order || banners.length + 1)
        : banners.length + 1,
    };

    try {
      const method = editingBannerId ? 'PUT' : 'POST';
      const res = await fetch('/api/admin/banners', {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (data.success && Array.isArray(data.banners)) {
        setBanners(data.banners);
        localStorage.setItem('naviratraders_banners', JSON.stringify(data.banners));
        window.dispatchEvent(new CustomEvent('naviratraders_banners_updated'));
        showToast(editingBannerId ? 'Hero banner updated!' : 'New hero banner created!');
        setIsFormOpen(false);
        resetForm();
      } else {
        alert(data.error || 'Failed to save banner');
      }
    } catch {
      alert('Error connecting to banner service');
    }
  };

  // Delete Banner
  const handleDeleteBanner = async (id: string, name: string) => {
    if (!confirm(`Are you sure you want to delete banner "${name}"?`)) return;
    try {
      const res = await fetch(`/api/admin/banners?id=${encodeURIComponent(id)}`, {
        method: 'DELETE',
      });
      const data = await res.json();
      if (data.success && Array.isArray(data.banners)) {
        setBanners(data.banners);
        localStorage.setItem('naviratraders_banners', JSON.stringify(data.banners));
        window.dispatchEvent(new CustomEvent('naviratraders_banners_updated'));
        showToast(`Banner "${name}" removed`);
      }
    } catch {
      alert('Failed to delete banner');
    }
  };

  // Toggle Active Status
  const handleToggleActive = async (id: string) => {
    try {
      const res = await fetch('/api/admin/banners', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'toggle', id }),
      });
      const data = await res.json();
      if (data.success && Array.isArray(data.banners)) {
        setBanners(data.banners);
        localStorage.setItem('naviratraders_banners', JSON.stringify(data.banners));
        window.dispatchEvent(new CustomEvent('naviratraders_banners_updated'));
        showToast('Banner visibility toggled');
      }
    } catch {
      alert('Failed to update banner');
    }
  };

  // Make Primary (#1 Hero)
  const handleMakePrimary = async (id: string) => {
    const target = banners.find((b) => b.id === id);
    if (!target) return;
    const reordered = [target, ...banners.filter((b) => b.id !== id)];
    const orderedIds = reordered.map((b) => b.id);

    try {
      const res = await fetch('/api/admin/banners', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'reorder', orderedIds }),
      });
      const data = await res.json();
      if (data.success && Array.isArray(data.banners)) {
        setBanners(data.banners);
        localStorage.setItem('naviratraders_banners', JSON.stringify(data.banners));
        window.dispatchEvent(new CustomEvent('naviratraders_banners_updated'));
        showToast(`"${target.title}" is now the #1 Main Hero Banner!`);
      }
    } catch {
      alert('Failed to set primary banner');
    }
  };

  // Reorder Banner Up or Down
  const handleReorder = async (index: number, direction: 'up' | 'down') => {
    const newIdx = direction === 'up' ? index - 1 : index + 1;
    if (newIdx < 0 || newIdx >= banners.length) return;

    const copy = [...banners];
    const [moved] = copy.splice(index, 1);
    copy.splice(newIdx, 0, moved);
    const orderedIds = copy.map((b) => b.id);

    try {
      const res = await fetch('/api/admin/banners', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'reorder', orderedIds }),
      });
      const data = await res.json();
      if (data.success && Array.isArray(data.banners)) {
        setBanners(data.banners);
        localStorage.setItem('naviratraders_banners', JSON.stringify(data.banners));
        window.dispatchEvent(new CustomEvent('naviratraders_banners_updated'));
      }
    } catch {}
  };

  // Reset to Factory Defaults
  const handleResetDefaults = async () => {
    if (
      !confirm(
        'Are you sure you want to restore the default factory banners (S24 Ultra, iPhone 17 Pro, Redmi 15C)?'
      )
    )
      return;
    try {
      const res = await fetch('/api/admin/banners', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'reset' }),
      });
      const data = await res.json();
      if (data.success && Array.isArray(data.banners)) {
        setBanners(data.banners);
        localStorage.setItem('naviratraders_banners', JSON.stringify(data.banners));
        window.dispatchEvent(new CustomEvent('naviratraders_banners_updated'));
        showToast('Restored default hero banners!');
      }
    } catch {
      alert('Failed to reset banners');
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* 1. Header & Actions Bar */}
      <div className="bg-[#18191b] border border-slate-800 rounded-2xl p-4 sm:p-5 shadow-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-amber-500 animate-pulse" />
            <h2 className="text-base sm:text-lg font-bold text-white tracking-tight flex items-center gap-2">
              <span>Homepage Hero Banners &amp; Spotlight Deals</span>
              <span className="text-[10px] px-2 py-0.5 rounded-full font-black bg-amber-500/20 text-amber-300 border border-amber-500/30">
                Live Storefront
              </span>
            </h2>
          </div>
          <p className="text-xs text-slate-400 mt-1 max-w-2xl">
            Promote new smartphone arrivals, flash sale deals, or mobile accessories right at the top of your homepage. Manage slides, replace the S24 Ultra banner, and reorder active deals.
          </p>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <button
            onClick={handleResetDefaults}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold bg-[#202123] hover:bg-slate-800 text-slate-300 border border-slate-700 transition-all cursor-pointer"
            title="Restore original factory slides"
          >
            <RotateCcw className="w-3.5 h-3.5 text-slate-400" />
            <span>Reset Defaults</span>
          </button>

          <button
            onClick={() => {
              resetForm();
              setIsFormOpen(true);
            }}
            className="flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold bg-[#00a47c] hover:bg-[#008f6c] text-white shadow-md transition-all cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Add Hero Banner</span>
          </button>
        </div>
      </div>

      {/* 2. Aspect Ratio & Dimension Integrity Guide Card */}
      <div className="bg-gradient-to-r from-sky-950/40 via-[#0d2138] to-[#18191b] border border-sky-800/40 rounded-2xl p-4 text-xs text-slate-300 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="flex items-start gap-3">
          <div className="w-9 h-9 rounded-xl bg-sky-500/20 border border-sky-400/30 text-sky-300 flex items-center justify-center shrink-0 mt-0.5">
            <Info className="w-4 h-4" />
          </div>
          <div className="space-y-1">
            <p className="font-bold text-white flex items-center gap-2">
              <span>📐 Banner Dimensions &amp; Aspect Ratio Protection</span>
              <span className="text-[10px] font-mono font-bold bg-sky-500/20 text-sky-300 px-2 py-0.5 rounded border border-sky-500/30">
                16:9 Aspect Ratio / 500x500 Product Card
              </span>
            </p>
            <p className="text-slate-300 text-[11px] leading-relaxed">
              <strong>Product Showcase Mode:</strong> Best with square or transparent 1:1 photos (e.g. 500x500 px). Automatically displays in the 3D floating phone canvas.<br />
              <strong>Full Graphic Banner Mode:</strong> Standard 16:9 ratio (recommended: 1200x675 px or 1920x1080 px). Strict CSS bounding prevents elements from stretching or distorting across any screen size.
            </p>
          </div>
        </div>
        <Link
          href="/"
          target="_blank"
          className="shrink-0 flex items-center gap-1.5 text-xs font-bold text-sky-300 hover:text-white bg-sky-500/20 hover:bg-sky-500/30 border border-sky-400/30 px-3 py-1.5 rounded-xl transition-all"
        >
          <span>View Live Storefront</span>
          <ExternalLink className="w-3.5 h-3.5" />
        </Link>
      </div>

      {/* 3. Add / Edit Banner Drawer Modal */}
      {isFormOpen && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-3 sm:p-5 overflow-y-auto">
          <div className="bg-[#18191b] border border-slate-700 rounded-3xl w-full max-w-4xl max-h-[92vh] flex flex-col shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            {/* Modal Header */}
            <div className="p-4 sm:p-5 border-b border-slate-800 flex items-center justify-between bg-[#131416]">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-amber-500/20 text-amber-400 flex items-center justify-center font-bold">
                  <Sparkles className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm sm:text-base font-bold text-white">
                    {editingBannerId ? 'Edit Hero Banner' : 'Create New Hero Banner / Product Spotlight'}
                  </h3>
                  <p className="text-[11px] text-slate-400">
                    Feature any phone from your store or upload a custom promotional deal
                  </p>
                </div>
              </div>
              <button
                onClick={() => setIsFormOpen(false)}
                className="w-8 h-8 rounded-full bg-slate-800 hover:bg-slate-700 text-slate-300 flex items-center justify-center transition-colors cursor-pointer"
              >
                ✕
              </button>
            </div>

            {/* Modal Body */}
            <form onSubmit={handleSaveBanner} className="p-4 sm:p-6 overflow-y-auto flex-1 space-y-6 text-xs text-slate-200">
              {/* Creation Mode Tabs */}
              {!editingBannerId && (
                <div className="flex items-center gap-2 p-1 bg-[#101112] rounded-xl border border-slate-800">
                  <button
                    type="button"
                    onClick={() => setFormType('catalog')}
                    className={`flex-1 py-2 px-3 rounded-lg font-bold transition-all flex items-center justify-center gap-2 cursor-pointer ${
                      formType === 'catalog'
                        ? 'bg-[#00a47c] text-white shadow-sm'
                        : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    <Layers className="w-4 h-4" />
                    <span>Pick Product from Catalog (1-Click Auto-Fill)</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setFormType('custom')}
                    className={`flex-1 py-2 px-3 rounded-lg font-bold transition-all flex items-center justify-center gap-2 cursor-pointer ${
                      formType === 'custom'
                        ? 'bg-[#00a47c] text-white shadow-sm'
                        : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    <Sliders className="w-4 h-4" />
                    <span>Custom Deal / Graphic Banner</span>
                  </button>
                </div>
              )}

              {/* Catalog Search & Dropdown Picker */}
              {formType === 'catalog' && !editingBannerId && (
                <div className="bg-[#121315] p-3.5 rounded-2xl border border-slate-800 space-y-2.5">
                  <label className="block text-[11px] font-bold text-slate-300">
                    Select Product to Feature in Hero Banner:
                  </label>
                  <div className="relative">
                    <Search className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      placeholder="Search by phone name or brand (e.g. S24 Ultra, iPhone 17, Oraimo Watch)..."
                      value={productSearchQuery}
                      onChange={(e) => setProductSearchQuery(e.target.value)}
                      className="w-full pl-9 pr-3 py-2 bg-[#18191b] border border-slate-700 rounded-xl text-white placeholder:text-slate-500 focus:outline-none focus:border-amber-400"
                    />
                  </div>
                  <div className="max-h-40 overflow-y-auto space-y-1 border border-slate-800/80 rounded-xl p-1 bg-[#18191b]">
                    {filteredCatalogProducts.map((p) => (
                      <div
                        key={p.id}
                        onClick={() => handleSelectCatalogProduct(p.slug)}
                        className={`flex items-center justify-between p-2 rounded-lg cursor-pointer transition-colors ${
                          selectedProductSlug === p.slug
                            ? 'bg-[#00a47c]/20 border border-[#00a47c] text-white'
                            : 'hover:bg-slate-800/70 text-slate-300'
                        }`}
                      >
                        <div className="flex items-center gap-2.5 min-w-0">
                          <div className="w-7 h-7 rounded bg-white p-0.5 shrink-0 flex items-center justify-center">
                            {p.colors[0]?.image ? (
                              <img src={p.colors[0].image} alt={p.name} className="w-full h-full object-contain" />
                            ) : null}
                          </div>
                          <div className="truncate">
                            <span className="font-bold text-white">{p.name}</span>
                            <span className="text-[10px] text-slate-400 ml-2">({p.brand})</span>
                          </div>
                        </div>
                        <div className="text-right shrink-0">
                          <span className="font-black text-amber-400">Rs. {p.basePricePKR.toLocaleString()}</span>
                          {p.discountPercent > 0 && (
                            <span className="text-[9px] font-bold text-emerald-400 ml-1.5">
                              {p.discountPercent}% OFF
                            </span>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Banner Layout Mode Selector */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div
                  onClick={() => setBannerType('product')}
                  className={`p-3.5 rounded-2xl border cursor-pointer transition-all flex items-start gap-3 ${
                    bannerType === 'product'
                      ? 'bg-sky-950/40 border-sky-400 ring-2 ring-sky-500/30'
                      : 'bg-[#121315] border-slate-800 hover:border-slate-700'
                  }`}
                >
                  <div className="w-7 h-7 rounded-lg bg-sky-500/20 text-sky-400 flex items-center justify-center shrink-0 mt-0.5">
                    <Layers className="w-4 h-4" />
                  </div>
                  <div>
                    <h4 className="font-bold text-white">Product Showcase (Signature 3D Card)</h4>
                    <p className="text-[10px] text-slate-400 mt-0.5">
                      Split layout like S24 Ultra with bold headline, discount badge, pricing, and 3D floating phone card.
                    </p>
                  </div>
                </div>

                <div
                  onClick={() => setBannerType('graphic')}
                  className={`p-3.5 rounded-2xl border cursor-pointer transition-all flex items-start gap-3 ${
                    bannerType === 'graphic'
                      ? 'bg-amber-950/40 border-amber-400 ring-2 ring-amber-500/30'
                      : 'bg-[#121315] border-slate-800 hover:border-slate-700'
                  }`}
                >
                  <div className="w-7 h-7 rounded-lg bg-amber-500/20 text-amber-400 flex items-center justify-center shrink-0 mt-0.5">
                    <ImageIcon className="w-4 h-4" />
                  </div>
                  <div>
                    <h4 className="font-bold text-white">Full Graphic Banner (16:9 Ratio)</h4>
                    <p className="text-[10px] text-slate-400 mt-0.5">
                      Displays a wide 16:9 promotional banner graphic spanning the entire hero slider width.
                    </p>
                  </div>
                </div>
              </div>

              {/* Main Fields Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Title */}
                <div>
                  <label className="block text-[11px] font-bold text-slate-400 mb-1">
                    Banner Title / Phone Name *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Samsung Galaxy S24 Ultra"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    className="w-full px-3 py-2 bg-[#121315] border border-slate-700 rounded-xl text-white focus:outline-none focus:border-amber-400"
                  />
                </div>

                {/* Highlight Tagline */}
                <div>
                  <label className="block text-[11px] font-bold text-slate-400 mb-1">
                    Highlight / Slogan
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Galaxy AI is Here / Starting Rs. 49,999"
                    value={highlight}
                    onChange={(e) => setHighlight(e.target.value)}
                    className="w-full px-3 py-2 bg-[#121315] border border-slate-700 rounded-xl text-white focus:outline-none focus:border-amber-400"
                  />
                </div>

                {/* Badge Text */}
                <div>
                  <label className="block text-[11px] font-bold text-slate-400 mb-1">
                    Promotional Badge Text
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Flagship Launch Offer / Deal of the Day"
                    value={badge}
                    onChange={(e) => setBadge(e.target.value)}
                    className="w-full px-3 py-2 bg-[#121315] border border-slate-700 rounded-xl text-white focus:outline-none focus:border-amber-400"
                  />
                </div>

                {/* Brand */}
                <div>
                  <label className="block text-[11px] font-bold text-slate-400 mb-1">
                    Brand Name
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Samsung / Apple / Oraimo"
                    value={brand}
                    onChange={(e) => setBrand(e.target.value)}
                    className="w-full px-3 py-2 bg-[#121315] border border-slate-700 rounded-xl text-white focus:outline-none focus:border-amber-400"
                  />
                </div>

                {/* Price PKR */}
                <div>
                  <label className="block text-[11px] font-bold text-slate-400 mb-1">
                    Offer Price (PKR)
                  </label>
                  <input
                    type="number"
                    min="0"
                    placeholder="e.g. 316999"
                    value={pricePKR || ''}
                    onChange={(e) => setPricePKR(Number(e.target.value))}
                    className="w-full px-3 py-2 bg-[#121315] border border-slate-700 rounded-xl text-white focus:outline-none focus:border-amber-400"
                  />
                </div>

                {/* Original Retail Price PKR */}
                <div>
                  <label className="block text-[11px] font-bold text-slate-400 mb-1">
                    Original Retail Price (PKR)
                  </label>
                  <input
                    type="number"
                    min="0"
                    placeholder="e.g. 469999"
                    value={originalPricePKR || ''}
                    onChange={(e) => setOriginalPricePKR(Number(e.target.value))}
                    className="w-full px-3 py-2 bg-[#121315] border border-slate-700 rounded-xl text-white focus:outline-none focus:border-amber-400"
                  />
                </div>

                {/* Subtitle / Description */}
                <div className="sm:col-span-2">
                  <label className="block text-[11px] font-bold text-slate-400 mb-1">
                    Promotional Subtitle / Key Description
                  </label>
                  <textarea
                    rows={2}
                    placeholder="Titanium frame, 200MP Quad-Telephoto zoom, Snapdragon 8 Gen 3, and official 1-year warranty with Open-Parcel delivery."
                    value={subtitle}
                    onChange={(e) => setSubtitle(e.target.value)}
                    className="w-full px-3 py-2 bg-[#121315] border border-slate-700 rounded-xl text-white focus:outline-none focus:border-amber-400"
                  />
                </div>

                {/* Image Input & Device Upload */}
                <div className="sm:col-span-2 space-y-2">
                  <div className="flex items-center justify-between">
                    <label className="block text-[11px] font-bold text-slate-400">
                      Banner Image (URL or Local File Upload) *
                    </label>
                    <span className="text-[10px] text-slate-400 font-mono">
                      {bannerType === 'graphic' ? '16:9 Recommended (1200x675 px)' : '1:1 Square (500x500 px)'}
                    </span>
                  </div>

                  <div className="flex gap-2">
                    <input
                      type="text"
                      required
                      placeholder="https://... or click Upload from device"
                      value={image}
                      onChange={(e) => setImage(e.target.value)}
                      className="flex-1 px-3 py-2 bg-[#121315] border border-slate-700 rounded-xl text-white focus:outline-none focus:border-amber-400 font-mono text-[11px]"
                    />
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/*"
                      onChange={handleFileUpload}
                      className="hidden"
                    />
                    <button
                      type="button"
                      disabled={isUploading}
                      onClick={() => fileInputRef.current?.click()}
                      className="px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-bold flex items-center gap-1.5 cursor-pointer shrink-0 border border-slate-700"
                    >
                      <Upload className="w-3.5 h-3.5 text-amber-400" />
                      <span>{isUploading ? 'Uploading...' : 'Choose File'}</span>
                    </button>
                  </div>

                  {image && (
                    <div className="flex items-center gap-3 p-2 bg-[#121315] rounded-xl border border-slate-800">
                      <div className="w-14 h-14 rounded-lg bg-white p-1 overflow-hidden shrink-0 flex items-center justify-center">
                        <img src={image} alt="Preview" className="w-full h-full object-contain" />
                      </div>
                      <div className="text-[10px] text-slate-400 min-w-0">
                        <p className="font-bold text-white truncate">{title || 'Banner Preview'}</p>
                        <p className="text-emerald-400 font-bold mt-0.5">✓ Image Loaded &amp; Aspect-Ratio Protected</p>
                      </div>
                    </div>
                  )}
                </div>

                {/* Target Link */}
                <div>
                  <label className="block text-[11px] font-bold text-slate-400 mb-1">
                    Destination URL / Link
                  </label>
                  <input
                    type="text"
                    placeholder="/product/samsung-galaxy-s24-ultra or /#accessories"
                    value={link}
                    onChange={(e) => setLink(e.target.value)}
                    className="w-full px-3 py-2 bg-[#121315] border border-slate-700 rounded-xl text-white focus:outline-none focus:border-amber-400 font-mono text-[11px]"
                  />
                </div>

                {/* CTA Button Text */}
                <div>
                  <label className="block text-[11px] font-bold text-slate-400 mb-1">
                    CTA Button Text
                  </label>
                  <input
                    type="text"
                    placeholder="Shop Deal / View Product"
                    value={ctaText}
                    onChange={(e) => setCtaText(e.target.value)}
                    className="w-full px-3 py-2 bg-[#121315] border border-slate-700 rounded-xl text-white focus:outline-none focus:border-amber-400"
                  />
                </div>

                {/* Gradient Theme Selector */}
                <div className="sm:col-span-2">
                  <label className="block text-[11px] font-bold text-slate-400 mb-1.5">
                    Background Gradient Theme
                  </label>
                  <div className="flex flex-wrap items-center gap-2">
                    {GRADIENT_PRESETS.map((p) => (
                      <button
                        key={p.name}
                        type="button"
                        onClick={() => setGradient(p.value)}
                        className={`px-3 py-1.5 rounded-xl text-[11px] font-bold transition-all flex items-center gap-2 cursor-pointer border ${
                          gradient === p.value
                            ? 'bg-slate-800 text-white border-amber-400 ring-2 ring-amber-400/30'
                            : 'bg-[#121315] text-slate-400 border-slate-800 hover:text-white'
                        }`}
                      >
                        <span className={`w-3 h-3 rounded-full bg-gradient-to-r ${p.value} border border-white/20`} />
                        <span>{p.name}</span>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Active Checkbox */}
                <div className="sm:col-span-2 flex items-center gap-2.5 pt-1">
                  <input
                    type="checkbox"
                    id="banner-is-active"
                    checked={isActive}
                    onChange={(e) => setIsActive(e.target.checked)}
                    className="w-4 h-4 rounded text-[#00a47c] focus:ring-0"
                  />
                  <label htmlFor="banner-is-active" className="text-xs font-bold text-white cursor-pointer">
                    Enable this banner immediately on live storefront
                  </label>
                </div>
              </div>

              {/* 4. Live Realistic Preview Box */}
              <div className="pt-2">
                <label className="block text-[11px] font-bold text-amber-400 mb-2 flex items-center gap-1.5">
                  <Eye className="w-3.5 h-3.5" />
                  <span>Live Storefront Preview (How it will render):</span>
                </label>
                <div className={`relative overflow-hidden rounded-2xl bg-gradient-to-r ${gradient} text-white border border-slate-700 p-4 sm:p-6 shadow-xl`}>
                  {bannerType === 'graphic' ? (
                    <div className="relative w-full h-44 sm:h-56 rounded-xl overflow-hidden flex items-center justify-center">
                      {image ? (
                        <img src={image} alt="Preview" className="w-full h-full object-cover" />
                      ) : (
                        <div className="text-slate-400">No Image Selected</div>
                      )}
                      <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent p-4 flex flex-col justify-end">
                        <span className="text-[10px] font-bold uppercase text-amber-400">{badge || 'Offer'}</span>
                        <h3 className="text-lg font-black text-white">{title || 'Banner Title'}</h3>
                        <p className="text-[11px] text-sky-200">{highlight}</p>
                      </div>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-12 gap-4 items-center">
                      <div className="sm:col-span-8 space-y-2">
                        <span className="inline-block px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-[#48afff]/25 text-sky-200 border border-[#48afff]/40">
                          {badge || 'Deal'}
                        </span>
                        <h3 className="text-xl sm:text-2xl font-black text-white">{title || 'Product Title'}</h3>
                        {highlight && <p className="text-sm font-bold text-sky-300">{highlight}</p>}
                        <p className="text-[11px] text-slate-300 line-clamp-2">{subtitle}</p>
                        {pricePKR > 0 && (
                          <div className="flex items-baseline gap-2 pt-1">
                            <span className="text-lg font-black text-white">Rs. {pricePKR.toLocaleString()}</span>
                            {originalPricePKR > pricePKR && (
                              <span className="text-xs line-through text-slate-400">Rs. {originalPricePKR.toLocaleString()}</span>
                            )}
                            {discountPercent > 0 && (
                              <span className="text-[10px] font-bold bg-[#f88b2a] text-white px-2 py-0.2 rounded-full">
                                {discountPercent}% OFF
                              </span>
                            )}
                          </div>
                        )}
                        <div className="pt-2">
                          <span className="inline-flex items-center gap-1.5 px-4 py-2 rounded-full bg-[#48afff] text-white font-bold text-xs shadow-md">
                            <span>{ctaText || 'Shop Deal'}</span>
                            <ArrowRight className="w-3.5 h-3.5" />
                          </span>
                        </div>
                      </div>
                      <div className="sm:col-span-4 flex items-center justify-center">
                        <div className="w-28 h-28 sm:w-36 sm:h-36 rounded-2xl bg-white p-2 shadow-lg flex items-center justify-center">
                          {image ? (
                            <img src={image} alt="Preview" className="w-full h-full object-contain" />
                          ) : (
                            <ImageIcon className="w-8 h-8 text-slate-300" />
                          )}
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Form Buttons */}
              <div className="pt-4 border-t border-slate-800 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setIsFormOpen(false)}
                  className="px-4 py-2 rounded-xl text-xs font-semibold bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-6 py-2 rounded-xl text-xs font-bold bg-[#00a47c] hover:bg-[#008f6c] text-white shadow-md transition-all cursor-pointer flex items-center gap-2"
                >
                  <Check className="w-4 h-4" />
                  <span>{editingBannerId ? 'Save Changes' : 'Publish Banner to Storefront'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 5. Banners List Table */}
      <div className="bg-[#18191b] border border-slate-800 rounded-2xl overflow-hidden shadow-xs">
        <div className="p-4 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-white uppercase tracking-wider">
              Configured Hero Slides ({banners.length})
            </span>
            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
              {banners.filter((b) => b.isActive).length} Active on Homepage
            </span>
          </div>
          <span className="text-[11px] text-slate-400 hidden sm:inline">
            Slide #1 is the primary banner shown to every visitor
          </span>
        </div>

        {isLoading ? (
          <div className="p-8 text-center text-xs text-slate-400">Loading banners...</div>
        ) : banners.length === 0 ? (
          <div className="p-8 text-center text-xs text-slate-400">
            No hero banners configured. Click &quot;Add Hero Banner&quot; or &quot;Reset Defaults&quot;.
          </div>
        ) : (
          <div className="divide-y divide-slate-800">
            {banners.map((b, idx) => {
              const isFirst = idx === 0;
              const isLast = idx === banners.length - 1;
              return (
                <div
                  key={b.id}
                  className={`p-3.5 sm:p-4 flex flex-col md:flex-row items-start md:items-center justify-between gap-4 transition-colors ${
                    b.isActive ? 'hover:bg-slate-800/40' : 'bg-slate-900/40 opacity-70'
                  }`}
                >
                  {/* Left Info Column */}
                  <div className="flex items-center gap-3.5 min-w-0 flex-1">
                    {/* Order badge */}
                    <div className="flex flex-col items-center justify-center shrink-0 w-8">
                      <span
                        className={`w-7 h-7 rounded-xl flex items-center justify-center text-xs font-black shadow-xs ${
                          isFirst
                            ? 'bg-amber-400 text-slate-950 font-black ring-2 ring-amber-400/30'
                            : 'bg-slate-800 text-slate-300'
                        }`}
                      >
                        #{idx + 1}
                      </span>
                    </div>

                    {/* Image Thumbnail */}
                    <div className="w-14 h-14 rounded-xl bg-white p-1 border border-slate-700 overflow-hidden shrink-0 flex items-center justify-center">
                      <img src={b.image} alt={b.title} className="w-full h-full object-contain" />
                    </div>

                    {/* Details */}
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-bold text-white text-sm truncate">{b.title}</span>
                        {isFirst && (
                          <span className="text-[9px] font-black uppercase px-2 py-0.5 rounded-full bg-amber-400 text-slate-950 shadow-xs">
                            ★ Primary Hero
                          </span>
                        )}
                        <span className="text-[10px] px-2 py-0.5 rounded-full bg-slate-800 text-slate-300 border border-slate-700">
                          {b.bannerType === 'graphic' ? '16:9 Graphic Banner' : 'Product Showcase'}
                        </span>
                        <span
                          className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                            b.isActive
                              ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                              : 'bg-slate-800 text-slate-400 border border-slate-700'
                          }`}
                        >
                          {b.isActive ? 'Active' : 'Disabled'}
                        </span>
                      </div>

                      <div className="flex items-center gap-3 text-[11px] text-slate-400 mt-1 flex-wrap">
                        {b.highlight && <span className="text-sky-300 font-semibold">{b.highlight}</span>}
                        {b.pricePKR !== undefined && b.pricePKR > 0 && (
                          <span className="font-bold text-amber-400">Rs. {b.pricePKR.toLocaleString()}</span>
                        )}
                        {b.discountPercent !== undefined && b.discountPercent > 0 && (
                          <span className="text-emerald-400 font-bold">{b.discountPercent}% OFF</span>
                        )}
                        <span className="truncate max-w-[200px] text-slate-500 font-mono text-[10px]">{b.link}</span>
                      </div>
                    </div>
                  </div>

                  {/* Actions Column */}
                  <div className="flex items-center gap-1.5 self-end md:self-center shrink-0 flex-wrap">
                    {!isFirst && (
                      <button
                        onClick={() => handleMakePrimary(b.id)}
                        className="px-2.5 py-1.5 rounded-xl text-[10px] font-black bg-amber-400/20 hover:bg-amber-400 text-amber-300 hover:text-slate-950 border border-amber-400/40 transition-all cursor-pointer"
                        title="Promote to #1 Main Hero Banner"
                      >
                        Make Primary
                      </button>
                    )}

                    {/* Reorder Arrows */}
                    <button
                      disabled={isFirst}
                      onClick={() => handleReorder(idx, 'up')}
                      className={`p-1.5 rounded-lg border transition-all ${
                        isFirst
                          ? 'opacity-30 border-slate-800 text-slate-600 cursor-not-allowed'
                          : 'border-slate-700 hover:bg-slate-800 text-slate-300 cursor-pointer'
                      }`}
                      title="Move slide up"
                    >
                      <ArrowUp className="w-3.5 h-3.5" />
                    </button>
                    <button
                      disabled={isLast}
                      onClick={() => handleReorder(idx, 'down')}
                      className={`p-1.5 rounded-lg border transition-all ${
                        isLast
                          ? 'opacity-30 border-slate-800 text-slate-600 cursor-not-allowed'
                          : 'border-slate-700 hover:bg-slate-800 text-slate-300 cursor-pointer'
                      }`}
                      title="Move slide down"
                    >
                      <ArrowDown className="w-3.5 h-3.5" />
                    </button>

                    {/* Active toggle */}
                    <button
                      onClick={() => handleToggleActive(b.id)}
                      className={`px-2.5 py-1.5 rounded-xl text-[10px] font-bold border transition-all cursor-pointer ${
                        b.isActive
                          ? 'border-emerald-500/40 text-emerald-300 hover:bg-emerald-500/20'
                          : 'border-slate-700 text-slate-400 hover:bg-slate-800'
                      }`}
                      title={b.isActive ? 'Disable slide' : 'Enable slide'}
                    >
                      {b.isActive ? 'Active' : 'Draft'}
                    </button>

                    {/* Edit */}
                    <button
                      onClick={() => handleStartEdit(b)}
                      className="p-1.5 rounded-lg border border-slate-700 hover:bg-slate-800 text-sky-400 hover:text-sky-300 cursor-pointer transition-colors"
                      title="Edit banner"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                    </button>

                    {/* Delete */}
                    <button
                      onClick={() => handleDeleteBanner(b.id, b.title)}
                      className="p-1.5 rounded-lg border border-slate-700 hover:bg-rose-500/20 text-rose-400 hover:text-rose-300 cursor-pointer transition-colors"
                      title="Delete banner"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
