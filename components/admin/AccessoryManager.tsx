'use client';

import React, { useState, useMemo } from 'react';
import Link from 'next/link';
import { Smartphone, SmartphoneColor, SmartphoneVariant } from '@/types';
import { formatPKR } from '@/data/smartphones';
import { PhoneImageWithFallback } from '@/components/PhoneImageWithFallback';
import { saveProductLocally, markProductDeletedLocally } from '@/lib/catalog';
import {
  Headphones,
  Watch,
  Cable,
  Zap,
  Plus,
  Search,
  Edit,
  Trash2,
  Copy,
  ExternalLink,
  Check,
  X,
  AlertTriangle,
  Sparkles,
  TrendingUp,
  Tag,
  DollarSign,
  Package,
  Layers,
  ArrowRight,
  ShieldCheck,
  CheckCircle2,
  Flame,
  Star,
  RefreshCw,
  Battery,
  SlidersHorizontal,
} from 'lucide-react';

interface AccessoryManagerProps {
  products: Smartphone[];
  onRefresh: () => void;
  showToast: (msg: string) => void;
}

const POPULAR_ACCESSORY_BRANDS = [
  'All Brands',
  'Oraimo',
  'Anker',
  'Apple',
  'Samsung',
  'Xiaomi',
  'Joyroom',
  'Baseus',
  'Ronin',
  'Audionic',
  'Faster',
  'Dany',
  'Zero Lifestyle',
  'Huawei',
  'Realme',
  'Other',
];

const ACCESSORY_TYPES = [
  { id: 'All', label: 'All Accessories', icon: Sparkles },
  { id: 'Smartwatch', label: 'Smart Watches', icon: Watch },
  { id: 'Earbuds', label: 'Wireless Earbuds', icon: Headphones },
  { id: 'Cable', label: 'Charging Cables', icon: Cable },
  { id: 'Power Bank', label: 'Power Banks', icon: Battery },
  { id: 'Charger', label: 'Wall Chargers', icon: Zap },
  { id: 'Other', label: 'Other Gadgets', icon: Package },
];

export function AccessoryManager({ products, onRefresh, showToast }: AccessoryManagerProps) {
  // Extract all accessories from catalog
  const accessories = useMemo(() => {
    return products.filter((p) => p.category === 'Accessories');
  }, [products]);

  // Search & Filter States
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedType, setSelectedType] = useState('All');
  const [selectedBrand, setSelectedBrand] = useState('All Brands');
  const [stockFilter, setStockFilter] = useState<'all' | 'inStock' | 'lowStock' | 'outOfStock'>('all');

  // Modals & Actions
  const [isFormModalOpen, setIsFormModalOpen] = useState(false);
  const [editingAccessory, setEditingAccessory] = useState<Smartphone | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Smartphone | null>(null);
  const [restockTarget, setRestockTarget] = useState<Smartphone | null>(null);
  const [restockAmount, setRestockAmount] = useState<number>(10);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);

  // Computed Metrics
  const metrics = useMemo(() => {
    const total = accessories.length;
    const inStock = accessories.filter((a) => a.inStock && (a.stockQty ?? 0) > 0).length;
    const outOfStock = accessories.filter((a) => !a.inStock || (a.stockQty ?? 0) === 0).length;
    const lowStock = accessories.filter((a) => (a.stockQty ?? 0) > 0 && (a.stockQty ?? 0) <= 5).length;
    const smartwatches = accessories.filter((a) => a.accessoryType === 'Smartwatch').length;
    const earbuds = accessories.filter((a) => a.accessoryType === 'Earbuds').length;
    const cables = accessories.filter((a) => a.accessoryType === 'Cable').length;
    return { total, inStock, outOfStock, lowStock, smartwatches, earbuds, cables };
  }, [accessories]);

  // Filtered Accessories
  const filteredAccessories = useMemo(() => {
    return accessories.filter((item) => {
      // Type Filter
      if (selectedType !== 'All' && item.accessoryType !== selectedType) {
        return false;
      }
      // Brand Filter
      if (selectedBrand !== 'All Brands' && item.brand.toLowerCase() !== selectedBrand.toLowerCase()) {
        return false;
      }
      // Stock Status Filter
      if (stockFilter === 'inStock' && (!item.inStock || (item.stockQty ?? 0) <= 0)) {
        return false;
      }
      if (stockFilter === 'lowStock' && ((item.stockQty ?? 0) <= 0 || (item.stockQty ?? 0) > 5)) {
        return false;
      }
      if (stockFilter === 'outOfStock' && item.inStock && (item.stockQty ?? 0) > 0) {
        return false;
      }
      // Search Query Filter
      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase().trim();
        const searchable = `${item.name} ${item.brand} ${item.slug} ${item.accessoryType || ''} ${item.tagline || ''}`.toLowerCase();
        return query.split(' ').every((token) => searchable.includes(token));
      }
      return true;
    });
  }, [accessories, selectedType, selectedBrand, stockFilter, searchQuery]);

  // Toggle In Stock / Out of Stock
  const handleToggleStock = async (item: Smartphone) => {
    const targetState = !item.inStock;
    const updated: Smartphone = {
      ...item,
      inStock: targetState,
      stockQty: targetState ? (item.stockQty && item.stockQty > 0 ? item.stockQty : 10) : 0,
    };
    saveProductLocally(updated);
    showToast(`Accessory "${item.name}" marked ${targetState ? 'In Stock' : 'Out of Stock'}.`);
    onRefresh();

    try {
      await fetch('/api/admin/products', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: item.id,
          action: 'toggle_stock',
          inStock: targetState,
        }),
      });
    } catch (err) {
      console.warn('Sync error on toggle stock:', err);
    }
  };

  // Quick Restock
  const handleExecuteRestock = async () => {
    if (!restockTarget) return;
    const qty = Number(restockAmount) || 10;
    const newQty = (restockTarget.stockQty || 0) + qty;
    const updated: Smartphone = {
      ...restockTarget,
      inStock: true,
      stockQty: newQty,
    };
    saveProductLocally(updated);
    showToast(`Restocked +${qty} units for "${restockTarget.name}".`);
    setRestockTarget(null);
    onRefresh();

    try {
      await fetch('/api/admin/products', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: restockTarget.id,
          action: 'restock',
          restockQty: qty,
        }),
      });
    } catch (err) {
      console.warn('Sync error on restock:', err);
    }
  };

  // Duplicate Accessory
  const handleDuplicateAccessory = (item: Smartphone) => {
    const randomSuffix = Math.floor(100 + Math.random() * 900);
    const newSlug = `${item.slug}-copy-${randomSuffix}`;
    const duplicated: Smartphone = {
      ...item,
      id: newSlug,
      slug: newSlug,
      name: `${item.name} (Copy)`,
      inStock: true,
      stockQty: item.stockQty || 15,
      isNew: true,
    };
    setEditingAccessory(duplicated);
    setIsFormModalOpen(true);
  };

  // Delete Accessory
  const handleExecuteDelete = async () => {
    if (!deleteTarget) return;
    const target = deleteTarget;
    markProductDeletedLocally(target.id, target.slug);
    setDeleteTarget(null);
    showToast(`Accessory "${target.name}" removed from catalog.`);
    onRefresh();

    try {
      await fetch(`/api/admin/products?id=${encodeURIComponent(target.id)}&slug=${encodeURIComponent(target.slug)}&_t=${Date.now()}`, {
        method: 'DELETE',
        headers: { 'Cache-Control': 'no-store' },
      });
    } catch (err) {
      console.warn('Server sync error on delete:', err);
    }
  };

  // Multi-select bulk handlers
  const handleSelectAll = () => {
    if (selectedIds.length === filteredAccessories.length) {
      setSelectedIds([]);
    } else {
      setSelectedIds(filteredAccessories.map((a) => a.id));
    }
  };

  const handleToggleSelect = (id: string) => {
    setSelectedIds((prev) => (prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]));
  };

  const handleBulkDelete = async () => {
    if (!confirm(`Are you sure you want to permanently delete ${selectedIds.length} accessories?`)) return;
    selectedIds.forEach((id) => {
      const item = accessories.find((a) => a.id === id);
      if (item) markProductDeletedLocally(item.id, item.slug);
    });
    showToast(`${selectedIds.length} accessories removed.`);
    setSelectedIds([]);
    onRefresh();
  };

  return (
    <div className="space-y-5 animate-in fade-in duration-200">
      {/* Top Header Card */}
      <div className="p-4 sm:p-6 bg-gradient-to-r from-slate-900 via-[#0b3c68] to-slate-900 rounded-3xl text-white shadow-lg border border-slate-800 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1.5">
            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-amber-400 text-slate-950 flex items-center gap-1">
              <Headphones className="w-3 h-3" />
              Accessories Catalog
            </span>
            <span className="text-xs text-sky-200 font-medium">
              Live on Storefront (<span className="text-amber-300 font-bold">#accessories</span>)
            </span>
          </div>
          <h2 className="text-xl sm:text-2xl font-black tracking-tight text-white">
            Mobile Accessories &amp; Smart Gadgets
          </h2>
          <p className="text-xs sm:text-sm text-slate-300 mt-1 max-w-2xl">
            Add, edit, restock, or remove smartwatches, wireless earbuds, charging cables, power banks, and genuine accessories.
          </p>
        </div>

        {/* Action Button: Add Accessory */}
        <button
          onClick={() => {
            setEditingAccessory(null);
            setIsFormModalOpen(true);
          }}
          className="shrink-0 flex items-center gap-2 bg-[#008060] hover:bg-[#006e52] active:scale-95 text-white font-bold px-4 py-2.5 rounded-2xl text-xs sm:text-sm shadow-md transition-all cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          <span>Add New Accessory</span>
        </button>
      </div>

      {/* Metrics Rail */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
        <div className="p-3.5 sm:p-4 bg-white border border-slate-200/90 rounded-2xl shadow-2xs">
          <div className="flex items-center justify-between text-slate-500 text-xs font-semibold">
            <span>Total Accessories</span>
            <Package className="w-4 h-4 text-sky-600" />
          </div>
          <div className="text-xl sm:text-2xl font-black text-slate-900 mt-1">{metrics.total}</div>
          <div className="text-[11px] text-slate-400 mt-0.5">
            {metrics.smartwatches} Watches • {metrics.earbuds} Earbuds • {metrics.cables} Cables
          </div>
        </div>

        <div className="p-3.5 sm:p-4 bg-white border border-slate-200/90 rounded-2xl shadow-2xs">
          <div className="flex items-center justify-between text-slate-500 text-xs font-semibold">
            <span>In-Stock Ready</span>
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="text-xl sm:text-2xl font-black text-emerald-700 mt-1">{metrics.inStock}</div>
          <div className="text-[11px] text-emerald-600 font-medium mt-0.5">Active on storefront</div>
        </div>

        <div className="p-3.5 sm:p-4 bg-white border border-slate-200/90 rounded-2xl shadow-2xs">
          <div className="flex items-center justify-between text-slate-500 text-xs font-semibold">
            <span>Low Stock (≤ 5)</span>
            <AlertTriangle className="w-4 h-4 text-amber-500" />
          </div>
          <div className="text-xl sm:text-2xl font-black text-amber-700 mt-1">{metrics.lowStock}</div>
          <div className="text-[11px] text-amber-600 font-medium mt-0.5">Needs reordering</div>
        </div>

        <div className="p-3.5 sm:p-4 bg-white border border-slate-200/90 rounded-2xl shadow-2xs">
          <div className="flex items-center justify-between text-slate-500 text-xs font-semibold">
            <span>Out of Stock</span>
            <X className="w-4 h-4 text-rose-500" />
          </div>
          <div className="text-xl sm:text-2xl font-black text-rose-700 mt-1">{metrics.outOfStock}</div>
          <div className="text-[11px] text-rose-600 font-medium mt-0.5">Hidden from instant buy</div>
        </div>
      </div>

      {/* Filter & Search Bar */}
      <div className="p-3.5 sm:p-4 bg-white border border-slate-200/90 rounded-2xl shadow-2xs space-y-3">
        <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
          {/* Search Input */}
          <div className="relative w-full md:w-80">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search accessories by name, type, brand..."
              className="w-full bg-[#f9fafb] border border-slate-200 rounded-xl pl-9 pr-8 py-2 text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-[#008060] focus:bg-white transition-all"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Brand Filter & Stock Pills */}
          <div className="flex flex-wrap items-center gap-2">
            <select
              value={selectedBrand}
              onChange={(e) => setSelectedBrand(e.target.value)}
              className="bg-[#f9fafb] border border-slate-200 rounded-xl px-3 py-2 text-xs font-semibold text-slate-700 focus:outline-none focus:ring-2 focus:ring-[#008060]"
            >
              {POPULAR_ACCESSORY_BRANDS.map((b) => (
                <option key={b} value={b}>
                  {b}
                </option>
              ))}
            </select>

            <div className="flex items-center gap-1 bg-[#f1f2f4] p-1 rounded-xl">
              <button
                onClick={() => setStockFilter('all')}
                className={`px-3 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                  stockFilter === 'all' ? 'bg-white text-slate-900 shadow-2xs' : 'text-slate-500 hover:text-slate-800'
                }`}
              >
                All ({accessories.length})
              </button>
              <button
                onClick={() => setStockFilter('inStock')}
                className={`px-3 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                  stockFilter === 'inStock'
                    ? 'bg-white text-[#008060] shadow-2xs'
                    : 'text-slate-500 hover:text-slate-800'
                }`}
              >
                In Stock ({metrics.inStock})
              </button>
              <button
                onClick={() => setStockFilter('lowStock')}
                className={`px-3 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                  stockFilter === 'lowStock'
                    ? 'bg-white text-amber-700 shadow-2xs'
                    : 'text-slate-500 hover:text-slate-800'
                }`}
              >
                Low ({metrics.lowStock})
              </button>
              <button
                onClick={() => setStockFilter('outOfStock')}
                className={`px-3 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                  stockFilter === 'outOfStock'
                    ? 'bg-white text-rose-700 shadow-2xs'
                    : 'text-slate-500 hover:text-slate-800'
                }`}
              >
                Out ({metrics.outOfStock})
              </button>
            </div>
          </div>
        </div>

        {/* Accessory Type Tab Pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none pt-1 border-t border-slate-100">
          {ACCESSORY_TYPES.map((type) => {
            const Icon = type.icon;
            const count =
              type.id === 'All'
                ? accessories.length
                : accessories.filter((a) => a.accessoryType === type.id).length;
            const isActive = selectedType === type.id;
            return (
              <button
                key={type.id}
                onClick={() => setSelectedType(type.id)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all shrink-0 cursor-pointer ${
                  isActive
                    ? 'bg-slate-900 text-white shadow-2xs'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                <Icon className={`w-3.5 h-3.5 ${isActive ? 'text-amber-400' : 'text-slate-500'}`} />
                <span>{type.label}</span>
                <span
                  className={`text-[10px] px-1.5 py-0.2 rounded-full font-bold ${
                    isActive ? 'bg-white/20 text-white' : 'bg-white text-slate-700'
                  }`}
                >
                  {count}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Bulk Action Bar (when accessories selected) */}
      {selectedIds.length > 0 && (
        <div className="p-3 bg-amber-50 border border-amber-200 rounded-2xl flex items-center justify-between text-xs text-amber-900 font-bold animate-in fade-in duration-150">
          <div className="flex items-center gap-2">
            <span>{selectedIds.length} accessories selected</span>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={handleBulkDelete}
              className="px-3 py-1.5 rounded-xl bg-rose-600 text-white font-bold hover:bg-rose-700 transition-colors flex items-center gap-1.5 cursor-pointer"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>Delete Selected</span>
            </button>
            <button
              onClick={() => setSelectedIds([])}
              className="px-3 py-1.5 rounded-xl bg-white border border-amber-300 text-amber-900 font-bold hover:bg-amber-100 transition-colors cursor-pointer"
            >
              Clear
            </button>
          </div>
        </div>
      )}

      {/* Accessories Table Card */}
      <div className="bg-white border border-slate-200/90 rounded-2xl shadow-2xs overflow-hidden">
        {filteredAccessories.length === 0 ? (
          <div className="p-12 text-center space-y-3">
            <div className="w-14 h-14 rounded-2xl bg-slate-100 text-slate-400 flex items-center justify-center mx-auto">
              <Headphones className="w-7 h-7" />
            </div>
            <div className="text-base font-bold text-slate-900">No accessories found</div>
            <p className="text-xs text-slate-500 max-w-sm mx-auto">
              No mobile accessories match your active search or filters. You can add a new one right now.
            </p>
            <button
              onClick={() => {
                setSearchQuery('');
                setSelectedType('All');
                setSelectedBrand('All Brands');
                setStockFilter('all');
                setEditingAccessory(null);
                setIsFormModalOpen(true);
              }}
              className="inline-flex items-center gap-1.5 bg-[#008060] hover:bg-[#006e52] text-white font-bold px-4 py-2 rounded-xl text-xs transition-colors cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>Add First Accessory</span>
            </button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-[#f9fafb] text-slate-500 font-bold uppercase tracking-wider border-b border-slate-200/80">
                <tr>
                  <th className="py-3 px-4 w-10">
                    <input
                      type="checkbox"
                      checked={selectedIds.length === filteredAccessories.length && filteredAccessories.length > 0}
                      onChange={handleSelectAll}
                      className="rounded text-[#008060] focus:ring-[#008060]"
                    />
                  </th>
                  <th className="py-3 px-4">Accessory Product</th>
                  <th className="py-3 px-4">Type &amp; Brand</th>
                  <th className="py-3 px-4">Price &amp; Margin</th>
                  <th className="py-3 px-4">Inventory Stock</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredAccessories.map((item) => {
                  const imageSrc =
                    item.colors?.[0]?.image ||
                    'https://images.priceoye.pk/samsung-galaxy-s22-ultra-pakistan-priceoye-w11tk-500x500.webp';
                  const isLow = (item.stockQty ?? 0) > 0 && (item.stockQty ?? 0) <= 5;
                  const isOut = !item.inStock || (item.stockQty ?? 0) === 0;
                  const costPrice = item.costPricePKR || Math.round(item.basePricePKR * 0.85);
                  const netProfit = Math.max(0, item.basePricePKR - costPrice);
                  const marginPercent = Math.round((netProfit / item.basePricePKR) * 100);

                  return (
                    <tr
                      key={item.id}
                      className={`hover:bg-[#f9fafb] transition-colors ${
                        selectedIds.includes(item.id) ? 'bg-blue-50/40' : ''
                      }`}
                    >
                      {/* Checkbox */}
                      <td className="py-3 px-4">
                        <input
                          type="checkbox"
                          checked={selectedIds.includes(item.id)}
                          onChange={() => handleToggleSelect(item.id)}
                          className="rounded text-[#008060] focus:ring-[#008060]"
                        />
                      </td>

                      {/* Product Thumbnail & Details */}
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-3">
                          <div className="w-12 h-12 rounded-xl border border-slate-200 bg-white p-1 shrink-0 flex items-center justify-center overflow-hidden">
                            <PhoneImageWithFallback
                              src={imageSrc}
                              alt={item.name}
                              className="w-full h-full object-contain"
                            />
                          </div>
                          <div className="min-w-0 max-w-xs">
                            <div className="font-bold text-slate-900 truncate hover:text-[#0b3c68] transition-colors">
                              <Link href={`/product/${item.slug}`} target="_blank">
                                {item.name}
                              </Link>
                            </div>
                            <p className="text-[11px] text-slate-500 truncate mt-0.5">{item.tagline}</p>
                            <div className="flex items-center gap-1.5 mt-1">
                              {item.isNew && (
                                <span className="text-[9px] font-black uppercase px-1.5 py-0.2 rounded bg-amber-100 text-amber-800">
                                  New
                                </span>
                              )}
                              {item.isTrending && (
                                <span className="text-[9px] font-black uppercase px-1.5 py-0.2 rounded bg-orange-100 text-orange-800">
                                  Trending
                                </span>
                              )}
                              {item.isBestSeller && (
                                <span className="text-[9px] font-black uppercase px-1.5 py-0.2 rounded bg-emerald-100 text-emerald-800">
                                  Best Seller
                                </span>
                              )}
                              <span className="text-[10px] text-slate-400">
                                {item.colors?.length || 1} color{item.colors?.length !== 1 ? 's' : ''}
                              </span>
                            </div>
                          </div>
                        </div>
                      </td>

                      {/* Type & Brand */}
                      <td className="py-3 px-4">
                        <div className="space-y-1">
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg text-[10px] font-extrabold uppercase bg-purple-50 text-purple-700 border border-purple-200">
                            {item.accessoryType === 'Smartwatch' ? (
                              <Watch className="w-3 h-3" />
                            ) : item.accessoryType === 'Earbuds' ? (
                              <Headphones className="w-3 h-3" />
                            ) : item.accessoryType === 'Cable' ? (
                              <Cable className="w-3 h-3" />
                            ) : (
                              <Package className="w-3 h-3" />
                            )}
                            <span>{item.accessoryType || 'Accessory'}</span>
                          </span>
                          <div className="text-xs font-bold text-slate-800">{item.brand}</div>
                        </div>
                      </td>

                      {/* Pricing & Margins */}
                      <td className="py-3 px-4">
                        <div>
                          <div className="font-extrabold text-slate-900 text-xs sm:text-sm">
                            {formatPKR(item.basePricePKR)}
                          </div>
                          {item.originalPricePKR > item.basePricePKR && (
                            <div className="flex items-center gap-1.5 mt-0.5">
                              <span className="text-[11px] text-slate-400 line-through">
                                {formatPKR(item.originalPricePKR)}
                              </span>
                              <span className="text-[10px] font-black text-rose-600 bg-rose-50 px-1 rounded">
                                -{item.discountPercent}%
                              </span>
                            </div>
                          )}
                          <div className="text-[10px] text-emerald-700 font-semibold mt-1">
                            Profit: +{formatPKR(netProfit)} ({marginPercent}%)
                          </div>
                        </div>
                      </td>

                      {/* Stock Status & 1-Click Toggle */}
                      <td className="py-3 px-4">
                        <div className="space-y-1.5">
                          <div className="flex items-center gap-2">
                            <span
                              className={`text-[11px] font-bold px-2 py-0.5 rounded-md ${
                                isOut
                                  ? 'bg-rose-100 text-rose-800'
                                  : isLow
                                  ? 'bg-amber-100 text-amber-800'
                                  : 'bg-emerald-100 text-emerald-800'
                              }`}
                            >
                              {isOut ? '0 units (Out of Stock)' : `${item.stockQty ?? 0} units available`}
                            </span>
                          </div>
                          <button
                            type="button"
                            onClick={() => handleToggleStock(item)}
                            className={`text-[10px] font-bold px-2 py-0.8 rounded-lg border transition-all cursor-pointer ${
                              item.inStock
                                ? 'bg-white hover:bg-rose-50 text-slate-600 hover:text-rose-700 border-slate-200 hover:border-rose-300'
                                : 'bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border-emerald-300'
                            }`}
                          >
                            {item.inStock ? 'Mark Out of Stock' : 'Mark In Stock'}
                          </button>
                        </div>
                      </td>

                      {/* Actions */}
                      <td className="py-3 px-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            type="button"
                            onClick={() => {
                              setEditingAccessory(item);
                              setIsFormModalOpen(true);
                            }}
                            className="p-1.5 sm:p-2 rounded-xl bg-slate-100 hover:bg-[#008060] hover:text-white text-slate-700 transition-all cursor-pointer"
                            title="Edit Accessory"
                          >
                            <Edit className="w-3.5 h-3.5" />
                          </button>

                          <button
                            type="button"
                            onClick={() => {
                              setRestockTarget(item);
                              setRestockAmount(10);
                            }}
                            className="p-1.5 sm:p-2 rounded-xl bg-slate-100 hover:bg-emerald-600 hover:text-white text-slate-700 transition-all cursor-pointer"
                            title="Quick Restock"
                          >
                            <Zap className="w-3.5 h-3.5" />
                          </button>

                          <button
                            type="button"
                            onClick={() => handleDuplicateAccessory(item)}
                            className="p-1.5 sm:p-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 transition-all cursor-pointer"
                            title="Duplicate Accessory"
                          >
                            <Copy className="w-3.5 h-3.5" />
                          </button>

                          <Link
                            href={`/product/${item.slug}`}
                            target="_blank"
                            className="p-1.5 sm:p-2 rounded-xl bg-slate-100 hover:bg-sky-600 hover:text-white text-slate-700 transition-all cursor-pointer"
                            title="View on Storefront"
                          >
                            <ExternalLink className="w-3.5 h-3.5" />
                          </Link>

                          <button
                            type="button"
                            onClick={() => setDeleteTarget(item)}
                            className="p-1.5 sm:p-2 rounded-xl bg-slate-100 hover:bg-rose-600 hover:text-white text-slate-700 transition-all cursor-pointer"
                            title="Delete Accessory"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* QUICK RESTOCK DIALOG */}
      {restockTarget && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4">
          <div className="w-full max-w-md bg-white border border-slate-200 rounded-3xl p-5 sm:p-6 shadow-2xl space-y-4 animate-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between">
              <h3 className="font-bold text-slate-900 text-sm flex items-center gap-2">
                <Zap className="w-4 h-4 text-emerald-600" />
                <span>Restock Accessory</span>
              </h3>
              <button onClick={() => setRestockTarget(null)} className="text-slate-400 hover:text-slate-600">
                <X className="w-4 h-4" />
              </button>
            </div>

            <div>
              <div className="font-bold text-slate-900 text-sm">{restockTarget.name}</div>
              <div className="text-xs text-slate-500 mt-0.5">
                Current Stock: <strong className="text-slate-900">{restockTarget.stockQty ?? 0} units</strong>
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-2">Quick Increments:</label>
              <div className="grid grid-cols-4 gap-2">
                {[5, 10, 25, 50].map((amt) => (
                  <button
                    key={amt}
                    onClick={() => setRestockAmount(amt)}
                    className={`py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                      restockAmount === amt
                        ? 'bg-[#008060] text-white shadow-2xs'
                        : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
                    }`}
                  >
                    +{amt}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Custom Quantity to Add:</label>
              <input
                type="number"
                min="1"
                value={restockAmount}
                onChange={(e) => setRestockAmount(parseInt(e.target.value) || 1)}
                className="w-full bg-[#f9fafb] border border-slate-300 rounded-xl px-3 py-2 text-sm text-slate-900 font-bold focus:outline-none focus:ring-2 focus:ring-[#008060]"
              />
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setRestockTarget(null)}
                className="px-4 py-2 rounded-xl border border-slate-200 text-slate-700 text-xs font-bold hover:bg-slate-50 transition-colors"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleExecuteRestock}
                className="px-4 py-2 rounded-xl bg-[#008060] hover:bg-[#006e52] text-white text-xs font-bold transition-colors shadow-2xs"
              >
                Confirm Restock (+{restockAmount})
              </button>
            </div>
          </div>
        </div>
      )}

      {/* DELETE CONFIRMATION MODAL */}
      {deleteTarget && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4">
          <div className="w-full max-w-md bg-white border border-slate-200 rounded-3xl p-5 sm:p-6 shadow-2xl space-y-4 animate-in zoom-in-95 duration-150">
            <div className="flex items-center gap-3 text-rose-600">
              <div className="w-10 h-10 rounded-2xl bg-rose-100 flex items-center justify-center shrink-0">
                <AlertTriangle className="w-5 h-5 text-rose-600" />
              </div>
              <div>
                <h3 className="font-bold text-slate-900 text-sm">Delete Accessory?</h3>
                <p className="text-xs text-slate-500">This will remove it from the catalog and storefront.</p>
              </div>
            </div>

            <div className="p-3 bg-slate-50 rounded-2xl border border-slate-100 text-xs">
              <span className="font-bold text-slate-800">{deleteTarget.name}</span>
              <div className="text-slate-500 text-[11px] mt-0.5">
                Brand: {deleteTarget.brand} • Type: {deleteTarget.accessoryType || 'Accessory'} •{' '}
                {formatPKR(deleteTarget.basePricePKR)}
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setDeleteTarget(null)}
                className="px-4 py-2 rounded-xl border border-slate-200 text-slate-700 text-xs font-bold hover:bg-slate-50 transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleExecuteDelete}
                className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold transition-colors shadow-2xs cursor-pointer"
              >
                Confirm Delete
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ACCESSORY FORM MODAL (ADD & EDIT) */}
      {isFormModalOpen && (
        <AccessoryFormModal
          accessory={editingAccessory}
          onClose={() => {
            setIsFormModalOpen(false);
            setEditingAccessory(null);
          }}
          onSaved={(saved) => {
            setIsFormModalOpen(false);
            setEditingAccessory(null);
            showToast(
              editingAccessory
                ? `Accessory "${saved.name}" updated successfully!`
                : `New accessory "${saved.name}" published to catalog!`
            );
            onRefresh();
          }}
        />
      )}
    </div>
  );
}

// ============================================================================
// ACCESSORY FORM MODAL COMPONENT (TAILORED FOR MOBILE ACCESSORIES & GADGETS)
// ============================================================================

interface AccessoryFormModalProps {
  accessory: Smartphone | null;
  onClose: () => void;
  onSaved: (saved: Smartphone) => void;
}

function AccessoryFormModal({ accessory, onClose, onSaved }: AccessoryFormModalProps) {
  const isEditing = Boolean(accessory);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formError, setFormError] = useState('');

  // Basic Information
  const [name, setName] = useState(accessory?.name || '');
  const [brand, setBrand] = useState(accessory?.brand || 'Oraimo');
  const [accessoryType, setAccessoryType] = useState<string>(accessory?.accessoryType || 'Earbuds');
  const [tagline, setTagline] = useState(
    accessory?.tagline || '100% Genuine Official Accessory with Brand Warranty'
  );

  // Pricing
  const [basePricePKR, setBasePricePKR] = useState<number>(accessory?.basePricePKR || 4999);
  const [originalPricePKR, setOriginalPricePKR] = useState<number>(accessory?.originalPricePKR || 6999);
  const [costPricePKR, setCostPricePKR] = useState<number>(
    accessory?.costPricePKR || Math.round((accessory?.basePricePKR || 4999) * 0.8)
  );

  // Stock & Flags
  const [stockQty, setStockQty] = useState<number>(accessory?.stockQty ?? 20);
  const [inStock, setInStock] = useState<boolean>(accessory?.inStock !== false);
  const [isNew, setIsNew] = useState<boolean>(accessory?.isNew || true);
  const [isTrending, setIsTrending] = useState<boolean>(accessory?.isTrending || false);
  const [isBestSeller, setIsBestSeller] = useState<boolean>(accessory?.isBestSeller || false);

  // Colors & Images
  const [colors, setColors] = useState<SmartphoneColor[]>(
    accessory?.colors && accessory.colors.length > 0
      ? accessory.colors
      : [
          {
            name: 'Black',
            hex: '#1c1c1e',
            image:
              'https://images.priceoye.pk/oraimo-watch-6-osw-807-smartwatch-pakistan-priceoye-2fa0i-500x500.webp',
            inStock: true,
            stockQty: 20,
          },
        ]
  );

  // Editions / Variants / Lengths
  const [variants, setVariants] = useState<SmartphoneVariant[]>(
    accessory?.variants && accessory.variants.length > 0
      ? accessory.variants
      : [
          {
            id: 'var-1',
            storage: 'Standard',
            ram: 'Standard',
            pricePKR: accessory?.basePricePKR || 4999,
            originalPricePKR: accessory?.originalPricePKR || 6999,
            inStock: true,
            stockQty: 20,
          },
        ]
  );

  // Accessory Specs & Highlights
  const [screen, setScreen] = useState(
    accessory?.specs?.screen || 'Ergonomic Premium Build with High Durability'
  );
  const [battery, setBattery] = useState(accessory?.specs?.battery || 'Extended Long Battery Life');
  const [charging, setCharging] = useState(
    accessory?.specs?.charging || 'Rapid Fast Charging Supported'
  );
  const [processor, setProcessor] = useState(
    accessory?.specs?.processor || 'Low-Latency HD Audio Processing Chip'
  );
  const [connectivity, setConnectivity] = useState(
    accessory?.specs?.network || 'Bluetooth 5.3 High-Stability Wireless'
  );
  const [waterResistance, setWaterResistance] = useState(
    accessory?.specs?.waterResistance || 'IP68 Water & Sweat Resistant'
  );
  const [warranty, setWarranty] = useState(
    accessory?.specs?.warranty || '1 Year Official Distributor Warranty'
  );

  // Calculations
  const customerDiscountPercent = useMemo(() => {
    if (originalPricePKR <= 0 || originalPricePKR <= basePricePKR) return 0;
    return Math.round(((originalPricePKR - basePricePKR) / originalPricePKR) * 100);
  }, [basePricePKR, originalPricePKR]);

  const merchantNetProfit = useMemo(() => {
    return Math.max(0, basePricePKR - costPricePKR);
  }, [basePricePKR, costPricePKR]);

  const merchantMarginPercent = useMemo(() => {
    if (basePricePKR <= 0) return 0;
    return Math.round((merchantNetProfit / basePricePKR) * 100);
  }, [basePricePKR, merchantNetProfit]);

  // Color handlers
  const handleAddColor = () => {
    setColors((prev) => [
      ...prev,
      {
        name: 'New Color',
        hex: '#008060',
        image: colors[0]?.image || '',
        inStock: true,
        stockQty: 10,
      },
    ]);
  };

  const handleUpdateColor = (index: number, field: keyof SmartphoneColor, value: any) => {
    setColors((prev) => {
      const copy = [...prev];
      copy[index] = { ...copy[index], [field]: value };
      return copy;
    });
  };

  const handleRemoveColor = (index: number) => {
    if (colors.length <= 1) return;
    setColors((prev) => prev.filter((_, i) => i !== index));
  };

  // Variant / Edition handlers
  const handleAddVariant = () => {
    setVariants((prev) => [
      ...prev,
      {
        id: `var-${Date.now()}`,
        storage: '2 Meter / Pro',
        ram: 'Fast Charge',
        pricePKR: basePricePKR,
        originalPricePKR: originalPricePKR,
        inStock: true,
        stockQty: 10,
      },
    ]);
  };

  const handleUpdateVariant = (index: number, field: keyof SmartphoneVariant, value: any) => {
    setVariants((prev) => {
      const copy = [...prev];
      copy[index] = { ...copy[index], [field]: value };
      return copy;
    });
  };

  const handleRemoveVariant = (index: number) => {
    if (variants.length <= 1) return;
    setVariants((prev) => prev.filter((_, i) => i !== index));
  };

  // Submit Handler
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setFormError('Please enter an accessory name.');
      return;
    }

    setIsSubmitting(true);
    setFormError('');

    const slug =
      accessory?.slug ||
      name
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/(^-|-$)/g, '');
    const id = accessory?.id || slug;

    // Color stock map
    const colorStockMap: Record<string, { inStock: boolean; stockQty: number }> = {};
    colors.forEach((c) => {
      colorStockMap[c.name] = {
        inStock: c.inStock !== false,
        stockQty: c.stockQty ?? 5,
      };
    });

    const payload: Smartphone = {
      id,
      slug,
      name,
      brand,
      category: 'Accessories',
      accessoryType,
      tagline,
      basePricePKR: Number(basePricePKR),
      costPricePKR: Number(costPricePKR),
      originalPricePKR: Number(originalPricePKR),
      discountPercent: customerDiscountPercent,
      rating: accessory?.rating || 4.9,
      reviewCount: accessory?.reviewCount || 24,
      inStock,
      stockQty: Number(stockQty),
      isNew,
      isTrending,
      isBestSeller,
      colors,
      variants,
      colorStockMap,
      specs: {
        screen,
        refreshRate: accessoryType === 'Smartwatch' ? '60Hz Touch' : 'High Speed',
        displayType: screen,
        processor,
        chipsetBrand: brand,
        mainCamera: accessoryType === 'Earbuds' ? 'HD Bio-Diaphragm Drivers' : 'Smart Sensor Module',
        selfieCamera: 'Dual-Mic ENC Noise Cancellation',
        battery,
        charging,
        os: 'Universal Compatibility (Android / iOS / Windows)',
        network: connectivity,
        security: 'Safe Voltage Surge & Heat Protection',
        weight: 'Lightweight Ergonomic',
        waterResistance,
        ptaStatus: 'PTA Approved',
        warranty,
      },
      keyHighlights: {
        display: screen,
        camera: '100% Genuine Official Product',
        battery,
        processor,
        charging,
      },
    };

    try {
      // 1. Save locally for zero-latency storefront reflection
      saveProductLocally(payload);

      // 2. Persist to API
      const res = await fetch('/api/admin/products', {
        method: isEditing ? 'PUT' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ product: payload }),
      });

      const data = await res.json();
      if (!data.success) {
        throw new Error(data.error || 'Failed to save accessory to server.');
      }

      onSaved(payload);
    } catch (err: any) {
      console.error('Error saving accessory:', err);
      // Still notify success locally if cached
      onSaved(payload);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-xs flex items-center justify-center p-3 sm:p-5 overflow-y-auto">
      <div className="relative w-full max-w-4xl bg-white border border-slate-200 rounded-3xl shadow-2xl overflow-hidden my-auto animate-in zoom-in-95 duration-200">
        {/* Modal Top Bar */}
        <div className="px-5 py-4 bg-slate-900 text-white flex items-center justify-between border-b border-slate-800">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-amber-400 text-slate-950 flex items-center justify-center font-bold">
              <Headphones className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-extrabold text-sm sm:text-base text-white">
                {isEditing ? `Edit Accessory: ${accessory?.name}` : 'Add New Mobile Accessory'}
              </h3>
              <p className="text-[11px] text-slate-400">
                Category: <strong className="text-amber-300">Accessories</strong> • Reflects on #accessories and storefront
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Modal Scrollable Body */}
        <form onSubmit={handleSubmit} className="p-5 sm:p-6 max-h-[80vh] overflow-y-auto space-y-5">
          {formError && (
            <div className="p-3 bg-rose-50 border border-rose-200 text-rose-800 text-xs rounded-xl flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 shrink-0 text-rose-600" />
              <span>{formError}</span>
            </div>
          )}

          {/* Section 1: Basic Information */}
          <div className="p-4 bg-slate-50 border border-slate-200/90 rounded-2xl space-y-4">
            <h4 className="text-xs font-black uppercase tracking-wider text-slate-700 flex items-center gap-2">
              <Tag className="w-3.5 h-3.5 text-sky-600" />
              <span>1. Basic Details</span>
            </h4>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="sm:col-span-2 space-y-1">
                <label className="text-xs font-bold text-slate-700">Accessory Title *</label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Oraimo Watch 6 OSW-807 Smartwatch"
                  className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 text-xs font-semibold text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#008060]"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-700">Accessory Type *</label>
                <select
                  value={accessoryType}
                  onChange={(e) => setAccessoryType(e.target.value)}
                  className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 text-xs font-semibold text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#008060]"
                >
                  <option value="Smartwatch">Smartwatch</option>
                  <option value="Earbuds">Wireless Earbuds</option>
                  <option value="Cable">Charging Cable</option>
                  <option value="Power Bank">Power Bank</option>
                  <option value="Charger">Wall Charger</option>
                  <option value="Case">Protective Case</option>
                  <option value="Audio">Audio &amp; Speaker</option>
                  <option value="Other">Other Gadget</option>
                </select>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-700">Brand *</label>
                <input
                  type="text"
                  required
                  value={brand}
                  onChange={(e) => setBrand(e.target.value)}
                  placeholder="e.g. Oraimo, Anker, Xiaomi"
                  className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 text-xs font-semibold text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#008060]"
                />
              </div>

              <div className="sm:col-span-2 space-y-1">
                <label className="text-xs font-bold text-slate-700">Tagline / Key Highlight</label>
                <input
                  type="text"
                  value={tagline}
                  onChange={(e) => setTagline(e.target.value)}
                  placeholder="e.g. Premium Open-Ear Air-Conduction Earphones with 40H Playtime"
                  className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#008060]"
                />
              </div>
            </div>
          </div>

          {/* Section 2: Pricing & Profit Margins */}
          <div className="p-4 bg-slate-50 border border-slate-200/90 rounded-2xl space-y-4">
            <h4 className="text-xs font-black uppercase tracking-wider text-slate-700 flex items-center gap-2">
              <DollarSign className="w-3.5 h-3.5 text-emerald-600" />
              <span>2. Pricing &amp; Merchant Margin</span>
            </h4>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-700">Retail Selling Price (PKR) *</label>
                <input
                  type="number"
                  min="0"
                  required
                  value={basePricePKR}
                  onChange={(e) => setBasePricePKR(Number(e.target.value) || 0)}
                  className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 text-xs font-black text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#008060]"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-700">Original Cut Price (PKR)</label>
                <input
                  type="number"
                  min="0"
                  value={originalPricePKR}
                  onChange={(e) => setOriginalPricePKR(Number(e.target.value) || 0)}
                  className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 text-xs font-semibold text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#008060]"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-700">Wholesale Cost Price (PKR)</label>
                <input
                  type="number"
                  min="0"
                  value={costPricePKR}
                  onChange={(e) => setCostPricePKR(Number(e.target.value) || 0)}
                  className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 text-xs font-semibold text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#008060]"
                />
              </div>
            </div>

            {/* Profit Margin Preview Card */}
            <div className="p-3 bg-white rounded-xl border border-slate-200 flex flex-wrap items-center justify-between gap-3 text-xs">
              <div className="flex items-center gap-2">
                <span className="text-slate-500">Customer Discount:</span>
                <span className="font-extrabold text-rose-600">
                  {customerDiscountPercent > 0 ? `${customerDiscountPercent}% OFF` : 'No Discount'}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-slate-500">Net Profit per Unit:</span>
                <span className="font-extrabold text-emerald-700">+{formatPKR(merchantNetProfit)}</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-slate-500">Gross Margin:</span>
                <span className="font-extrabold text-sky-700">{merchantMarginPercent}%</span>
              </div>
            </div>
          </div>

          {/* Section 3: Stock & Promotional Badges */}
          <div className="p-4 bg-slate-50 border border-slate-200/90 rounded-2xl space-y-4">
            <h4 className="text-xs font-black uppercase tracking-wider text-slate-700 flex items-center gap-2">
              <Package className="w-3.5 h-3.5 text-purple-600" />
              <span>3. Stock &amp; Badges</span>
            </h4>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-700">Initial Stock Quantity</label>
                <input
                  type="number"
                  min="0"
                  value={stockQty}
                  onChange={(e) => setStockQty(Number(e.target.value) || 0)}
                  className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 text-xs font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#008060]"
                />
                <label className="flex items-center gap-2 cursor-pointer pt-1">
                  <input
                    type="checkbox"
                    checked={inStock}
                    onChange={(e) => setInStock(e.target.checked)}
                    className="accent-[#008060] rounded w-4 h-4"
                  />
                  <span className="text-xs font-bold text-slate-800">
                    Product In Stock (Visible for Instant Ordering)
                  </span>
                </label>
              </div>

              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-700">Merchandising Badges</label>
                <div className="space-y-1.5">
                  <label className="flex items-center gap-2 cursor-pointer text-xs">
                    <input
                      type="checkbox"
                      checked={isNew}
                      onChange={(e) => setIsNew(e.target.checked)}
                      className="accent-[#008060] rounded w-4 h-4"
                    />
                    <span className="font-semibold text-slate-800">New Arrival Badge</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer text-xs">
                    <input
                      type="checkbox"
                      checked={isTrending}
                      onChange={(e) => setIsTrending(e.target.checked)}
                      className="accent-[#008060] rounded w-4 h-4"
                    />
                    <span className="font-semibold text-slate-800">Trending Deal Badge</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer text-xs">
                    <input
                      type="checkbox"
                      checked={isBestSeller}
                      onChange={(e) => setIsBestSeller(e.target.checked)}
                      className="accent-[#008060] rounded w-4 h-4"
                    />
                    <span className="font-semibold text-slate-800">Best Seller Badge</span>
                  </label>
                </div>
              </div>
            </div>
          </div>

          {/* Section 4: Colors & High-Res Product Image */}
          <div className="p-4 bg-slate-50 border border-slate-200/90 rounded-2xl space-y-4">
            <div className="flex items-center justify-between">
              <h4 className="text-xs font-black uppercase tracking-wider text-slate-700 flex items-center gap-2">
                <Sparkles className="w-3.5 h-3.5 text-pink-600" />
                <span>4. Color Options &amp; Photos ({colors.length})</span>
              </h4>
              <button
                type="button"
                onClick={handleAddColor}
                className="text-[11px] font-bold text-[#008060] hover:text-[#006e52] flex items-center gap-1 cursor-pointer"
              >
                <Plus className="w-3 h-3" />
                <span>Add Color</span>
              </button>
            </div>

            <div className="space-y-3">
              {colors.map((color, idx) => (
                <div
                  key={idx}
                  className="p-3 bg-white rounded-xl border border-slate-200 flex flex-col sm:flex-row items-start sm:items-center gap-3"
                >
                  {/* Image Preview Thumbnail */}
                  <div className="w-12 h-12 rounded-xl border border-slate-200 bg-slate-50 p-1 shrink-0 flex items-center justify-center overflow-hidden">
                    <PhoneImageWithFallback
                      src={color.image}
                      alt={color.name}
                      className="w-full h-full object-contain"
                    />
                  </div>

                  <div className="flex-1 grid grid-cols-1 sm:grid-cols-4 gap-2 w-full">
                    <div>
                      <label className="block text-[10px] font-bold text-slate-500 mb-0.5">Color Name</label>
                      <input
                        type="text"
                        value={color.name}
                        onChange={(e) => handleUpdateColor(idx, 'name', e.target.value)}
                        placeholder="e.g. Black"
                        className="w-full bg-[#f9fafb] border border-slate-300 rounded-lg px-2.5 py-1 text-xs text-slate-900"
                      />
                    </div>

                    <div>
                      <label className="block text-[10px] font-bold text-slate-500 mb-0.5">Hex Code</label>
                      <div className="flex items-center gap-1.5">
                        <input
                          type="color"
                          value={color.hex || '#1c1c1e'}
                          onChange={(e) => handleUpdateColor(idx, 'hex', e.target.value)}
                          className="w-6 h-6 rounded cursor-pointer border-0"
                        />
                        <input
                          type="text"
                          value={color.hex}
                          onChange={(e) => handleUpdateColor(idx, 'hex', e.target.value)}
                          placeholder="#1c1c1e"
                          className="w-full bg-[#f9fafb] border border-slate-300 rounded-lg px-2 py-1 text-xs text-slate-900"
                        />
                      </div>
                    </div>

                    <div className="sm:col-span-2">
                      <label className="block text-[10px] font-bold text-slate-500 mb-0.5">
                        Image URL (PriceOye or CDN link)
                      </label>
                      <input
                        type="url"
                        value={color.image}
                        onChange={(e) => handleUpdateColor(idx, 'image', e.target.value)}
                        placeholder="https://images.priceoye.pk/..."
                        className="w-full bg-[#f9fafb] border border-slate-300 rounded-lg px-2.5 py-1 text-xs text-slate-900"
                      />
                    </div>
                  </div>

                  {colors.length > 1 && (
                    <button
                      type="button"
                      onClick={() => handleRemoveColor(idx)}
                      className="text-slate-400 hover:text-rose-600 p-1 shrink-0 cursor-pointer"
                      title="Remove Color"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Section 5: Editions / Variants / Lengths */}
          <div className="p-4 bg-slate-50 border border-slate-200/90 rounded-2xl space-y-4">
            <div className="flex items-center justify-between">
              <h4 className="text-xs font-black uppercase tracking-wider text-slate-700 flex items-center gap-2">
                <Layers className="w-3.5 h-3.5 text-sky-600" />
                <span>5. Editions / Cable Lengths / Variants ({variants.length})</span>
              </h4>
              <button
                type="button"
                onClick={handleAddVariant}
                className="text-[11px] font-bold text-[#008060] hover:text-[#006e52] flex items-center gap-1 cursor-pointer"
              >
                <Plus className="w-3 h-3" />
                <span>Add Edition</span>
              </button>
            </div>

            <div className="space-y-2">
              {variants.map((v, idx) => (
                <div
                  key={v.id || idx}
                  className="p-3 bg-white rounded-xl border border-slate-200 flex flex-col sm:flex-row items-center gap-2"
                >
                  <div className="flex-1 grid grid-cols-1 sm:grid-cols-3 gap-2 w-full">
                    <div>
                      <label className="block text-[10px] font-bold text-slate-500 mb-0.5">
                        Edition / Length / Label
                      </label>
                      <input
                        type="text"
                        value={v.storage}
                        onChange={(e) => handleUpdateVariant(idx, 'storage', e.target.value)}
                        placeholder="e.g. 1 Meter or Standard"
                        className="w-full bg-[#f9fafb] border border-slate-300 rounded-lg px-2.5 py-1 text-xs text-slate-900"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold text-slate-500 mb-0.5">Edition Price (PKR)</label>
                      <input
                        type="number"
                        min="0"
                        value={v.pricePKR}
                        onChange={(e) => handleUpdateVariant(idx, 'pricePKR', Number(e.target.value) || 0)}
                        className="w-full bg-[#f9fafb] border border-slate-300 rounded-lg px-2.5 py-1 text-xs font-bold text-slate-900"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold text-slate-500 mb-0.5">Edition Stock</label>
                      <input
                        type="number"
                        min="0"
                        value={v.stockQty ?? 10}
                        onChange={(e) => handleUpdateVariant(idx, 'stockQty', Number(e.target.value) || 0)}
                        className="w-full bg-[#f9fafb] border border-slate-300 rounded-lg px-2.5 py-1 text-xs text-slate-900"
                      />
                    </div>
                  </div>

                  {variants.length > 1 && (
                    <button
                      type="button"
                      onClick={() => handleRemoveVariant(idx)}
                      className="text-slate-400 hover:text-rose-600 p-1 shrink-0 cursor-pointer"
                      title="Remove Edition"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Section 6: Tailored Accessory Specifications */}
          <div className="p-4 bg-slate-50 border border-slate-200/90 rounded-2xl space-y-4">
            <h4 className="text-xs font-black uppercase tracking-wider text-slate-700 flex items-center gap-2">
              <SlidersHorizontal className="w-3.5 h-3.5 text-amber-600" />
              <span>6. Accessory Technical Specs &amp; Warranty</span>
            </h4>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-700">Display / Material Build</label>
                <input
                  type="text"
                  value={screen}
                  onChange={(e) => setScreen(e.target.value)}
                  placeholder="e.g. 1.83 inches HD TFT Screen or Braided Nylon"
                  className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#008060]"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-700">Battery / Playtime</label>
                <input
                  type="text"
                  value={battery}
                  onChange={(e) => setBattery(e.target.value)}
                  placeholder="e.g. 40-Hour Total Playtime or 7 Days Standby"
                  className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#008060]"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-700">Charging / Speed Output</label>
                <input
                  type="text"
                  value={charging}
                  onChange={(e) => setCharging(e.target.value)}
                  placeholder="e.g. 2.4A Turbo Rapid Charging or Magnetic Dock"
                  className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#008060]"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-700">Chip / Audio Technology</label>
                <input
                  type="text"
                  value={processor}
                  onChange={(e) => setProcessor(e.target.value)}
                  placeholder="e.g. Dual-Mic ENC Noise Reduction or Copper Core"
                  className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#008060]"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-700">Connectivity / Ports</label>
                <input
                  type="text"
                  value={connectivity}
                  onChange={(e) => setConnectivity(e.target.value)}
                  placeholder="e.g. Bluetooth 5.3 (10m Range) or USB-C to Lightning"
                  className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#008060]"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-700">Official Warranty</label>
                <input
                  type="text"
                  value={warranty}
                  onChange={(e) => setWarranty(e.target.value)}
                  placeholder="e.g. 1 Year Official Brand Warranty"
                  className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#008060]"
                />
              </div>
            </div>
          </div>

          {/* Modal Footer Actions */}
          <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-200">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="px-5 py-2.5 rounded-xl border border-slate-200 text-slate-700 font-bold text-xs hover:bg-slate-50 transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-6 py-2.5 rounded-xl bg-[#008060] hover:bg-[#006e52] active:scale-95 text-white font-bold text-xs shadow-md transition-all flex items-center gap-2 cursor-pointer disabled:opacity-50"
            >
              {isSubmitting ? (
                <>
                  <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                  <span>Saving Accessory...</span>
                </>
              ) : (
                <>
                  <Check className="w-4 h-4" />
                  <span>{isEditing ? 'Save Changes' : 'Publish Accessory'}</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
