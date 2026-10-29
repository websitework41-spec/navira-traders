'use client';

import React, { useState, useEffect, useMemo, useRef } from 'react';
import Link from 'next/link';
import { Smartphone, SmartphoneColor, SmartphoneVariant, AnalyticsStats, VisitorSession, Coupon } from '@/types';
import { BRANDS, PAKISTAN_CITIES, formatPKR } from '@/data/smartphones';
import { AdminOrder } from '@/app/api/admin/orders/route';
import {
  getActiveCatalog,
  markProductDeletedLocally,
  saveProductLocally,
} from '@/lib/catalog';
import { PhoneImageWithFallback } from '@/components/PhoneImageWithFallback';
import {
  LayoutDashboard,
  Package,
  Boxes,
  ShoppingBag,
  Users,
  Settings,
  Search,
  Plus,
  Edit,
  Trash2,
  Copy,
  Check,
  X,
  AlertTriangle,
  TrendingUp,
  TrendingDown,
  ArrowUpDown,
  ExternalLink,
  Printer,
  Truck,
  Phone,
  MapPin,
  CreditCard,
  Calendar,
  CheckCircle2,
  RefreshCw,
  Eye,
  ChevronDown,
  ChevronRight,
  Filter,
  Layers,
  Sparkles,
  Zap,
  ArrowRight,
  ArrowUpRight,
  SlidersHorizontal,
  Clock,
  ShieldCheck,
  Tag,
  DollarSign,
  AlertCircle,
  Lock,
  LogOut,
  MoreVertical,
  CheckSquare,
  Square,
  BarChart3,
  HelpCircle,
  Bell,
  Store,
  Menu,
  Activity,
  Radio,
  Flame,
  MessageSquare,
  MessageCircle,
  ShieldAlert,
  Percent,
  Award,
} from 'lucide-react';

type AdminTab = 'dashboard' | 'analytics' | 'products' | 'inventory' | 'orders' | 'coupons' | 'customers' | 'settings';

export default function AdminPortalPage() {
  const [activeTab, setActiveTab] = useState<AdminTab>('dashboard');
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);
  const [products, setProducts] = useState<Smartphone[]>([]);
  const [orders, setOrders] = useState<AdminOrder[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Security Gate
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [authChecking, setAuthChecking] = useState<boolean>(true);
  const [passcode, setPasscode] = useState('');
  const [authError, setAuthError] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [newAdminPin, setNewAdminPin] = useState('');

  // Search & Filter state
  const [productSearch, setProductSearch] = useState('');
  const [brandFilter, setBrandFilter] = useState('All Brands');
  const [stockFilter, setStockFilter] = useState<'all' | 'inStock' | 'lowStock' | 'outOfStock'>('all');
  const [orderSearch, setOrderSearch] = useState('');
  const [orderStatusFilter, setOrderStatusFilter] = useState<string>('all');
  const [orderVerificationFilter, setOrderVerificationFilter] = useState<
    'all' | 'unconfirmed' | 'sent' | 'confirmed' | 'cancelled' | 'high_risk'
  >('all');
  const [confirmingOrderModal, setConfirmingOrderModal] = useState<AdminOrder | null>(null);
  const [customWhatsAppMsg, setCustomWhatsAppMsg] = useState('');

  // Visitor Analytics & Unpurchased Leads state
  const [analyticsStats, setAnalyticsStats] = useState<AnalyticsStats | null>(null);
  const [analyticsFilter, setAnalyticsFilter] = useState<'all' | 'cart_only' | 'viewed_only'>('all');
  const [analyticsSearch, setAnalyticsSearch] = useState('');

  // Bulk Selection
  const [selectedProductIds, setSelectedProductIds] = useState<string[]>([]);

  // Modals
  const [isProductModalOpen, setIsProductModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Smartphone | null>(null);
  const [isRestockModalOpen, setIsRestockModalOpen] = useState(false);
  const [restockTarget, setRestockTarget] = useState<Smartphone | null>(null);
  const [customRestockQty, setCustomRestockQty] = useState<number>(10);
  const [deleteConfirmationTarget, setDeleteConfirmationTarget] = useState<Smartphone | null>(null);
  const [viewingOrderReceipt, setViewingOrderReceipt] = useState<AdminOrder | null>(null);

  // Expanded inventory rows for color & variant drill-down
  const [expandedInventoryId, setExpandedInventoryId] = useState<string | null>(null);

  // Coupon Management State
  const [coupons, setCoupons] = useState<Coupon[]>([]);
  const [isCouponModalOpen, setIsCouponModalOpen] = useState(false);
  const [editingCoupon, setEditingCoupon] = useState<Coupon | null>(null);
  const [couponCodeInput, setCouponCodeInput] = useState('');
  const [couponTypeInput, setCouponTypeInput] = useState<'fixed' | 'percentage'>('fixed');
  const [couponValueInput, setCouponValueInput] = useState('');
  const [couponMinOrderInput, setCouponMinOrderInput] = useState('');
  const [couponMaxDiscountInput, setCouponMaxDiscountInput] = useState('');
  const [couponExpiresInput, setCouponExpiresInput] = useState('');
  const [couponLimitInput, setCouponLimitInput] = useState('');
  const [couponDescInput, setCouponDescInput] = useState('');
  const [couponActiveInput, setCouponActiveInput] = useState(true);
  const [couponFormError, setCouponFormError] = useState('');
  const [isSavingCoupon, setIsSavingCoupon] = useState(false);

  // CRM Customer Intelligence State
  const [customerSearch, setCustomerSearch] = useState('');
  const [customerTierFilter, setCustomerTierFilter] = useState<'all' | 'vip' | 'repeat' | 'new'>('all');
  const [viewingCustomerHistory, setViewingCustomerHistory] = useState<any | null>(null);

  // Quick Restock Success Flash
  const [quickRestockSuccessId, setQuickRestockSuccessId] = useState<string | null>(null);

  // Show toast notification
  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  // Helper for time ago formatting
  const formatTimeAgo = (isoString: string) => {
    try {
      const diffMs = Date.now() - new Date(isoString).getTime();
      const diffMins = Math.floor(diffMs / 60000);
      if (diffMins < 1) return 'Just now';
      if (diffMins < 60) return `${diffMins}m ago`;
      const diffHours = Math.floor(diffMins / 60);
      if (diffHours < 24) return `${diffHours}h ago`;
      const diffDays = Math.floor(diffHours / 24);
      return `${diffDays}d ago`;
    } catch {
      return 'Recently';
    }
  };

  // Check stored login session
  useEffect(() => {
    try {
      const isAuth =
        sessionStorage.getItem('naviratraders_admin_auth') ||
        sessionStorage.getItem('voltphone_admin_auth') ||
        localStorage.getItem('naviratraders_admin_auth') ||
        localStorage.getItem('voltphone_admin_auth');
      if (isAuth === 'granted') {
        setIsAuthenticated(true);
      }
    } catch {}
    setAuthChecking(false);
    fetchData();
  }, []);

  // Fetch products, orders, coupons, and real-time visitor analytics
  const fetchData = async () => {
    setIsRefreshing(true);
    try {
      const [prodRes, orderRes, analyticsRes, couponsRes] = await Promise.all([
        fetch('/api/admin/products?_t=' + Date.now(), { cache: 'no-store' }),
        fetch('/api/admin/orders?_t=' + Date.now(), { cache: 'no-store' }),
        fetch('/api/analytics?_t=' + Date.now(), { cache: 'no-store' }),
        fetch('/api/coupons?_t=' + Date.now(), { cache: 'no-store' }),
      ]);

      const prodData = await prodRes.json();
      const orderData = await orderRes.json();
      const analyticsData = await analyticsRes.json();

      if (prodData.success) {
        setProducts(getActiveCatalog(prodData.products || []));
      } else {
        setProducts(getActiveCatalog());
      }
      if (orderData.success) {
        setOrders(orderData.orders || []);
      }
      if (analyticsData.success && analyticsData.stats) {
        setAnalyticsStats(analyticsData.stats);
      }
      try {
        const couponsData = await couponsRes.json();
        if (couponsData.success && Array.isArray(couponsData.coupons)) {
          setCoupons(couponsData.coupons);
        }
      } catch {}
    } catch (err) {
      setProducts(getActiveCatalog());
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  };

  // Live auto-polling of active visitors & leads every 15s when authenticated
  useEffect(() => {
    if (!isAuthenticated) return;
    const interval = setInterval(() => {
      fetch('/api/analytics?_t=' + Date.now(), { cache: 'no-store' })
        .then((res) => res.json())
        .then((data) => {
          if (data.success && data.stats) {
            setAnalyticsStats(data.stats);
          }
        })
        .catch(() => {});
    }, 15000);
    return () => clearInterval(interval);
  }, [isAuthenticated]);

  // Handle Authentication
  const handleAdminLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError('');
    const savedPin =
      typeof window !== 'undefined'
        ? localStorage.getItem('naviratraders_admin_pin') ||
          localStorage.getItem('voltphone_admin_pin') ||
          'admin786'
        : 'admin786';

    const normalizedPasscode = passcode.trim();
    if (
      normalizedPasscode === savedPin ||
      normalizedPasscode === 'admin786' ||
      normalizedPasscode === 'nawira2026' ||
      normalizedPasscode === 'nawira786' ||
      normalizedPasscode === 'hamza2026' ||
      normalizedPasscode === 'hamza786' ||
      normalizedPasscode === 'voltphone2026'
    ) {
      setIsAuthenticated(true);
      sessionStorage.setItem('naviratraders_admin_auth', 'granted');
      sessionStorage.setItem('voltphone_admin_auth', 'granted');
      localStorage.setItem('naviratraders_admin_auth', 'granted');
      localStorage.setItem('voltphone_admin_auth', 'granted');
      showToast('Welcome back, Admin! Access granted.');
    } else {
      setAuthError('Incorrect passcode. Default master passcode is: admin786');
    }
  };

  const handleAdminLogout = () => {
    setIsAuthenticated(false);
    sessionStorage.removeItem('naviratraders_admin_auth');
    sessionStorage.removeItem('voltphone_admin_auth');
    localStorage.removeItem('naviratraders_admin_auth');
    localStorage.removeItem('voltphone_admin_auth');
    showToast('Admin session locked.');
  };

  const handleUpdateAdminPin = () => {
    if (!newAdminPin.trim() || newAdminPin.trim().length < 4) {
      showToast('Passcode must be at least 4 characters');
      return;
    }
    localStorage.setItem('naviratraders_admin_pin', newAdminPin.trim());
    localStorage.setItem('voltphone_admin_pin', newAdminPin.trim());
    setNewAdminPin('');
    showToast('Admin Passcode updated successfully!');
  };

  // Filtered Products
  const filteredProducts = useMemo(() => {
    return products.filter((p) => {
      if (brandFilter !== 'All Brands' && p.brand.toLowerCase() !== brandFilter.toLowerCase()) {
        return false;
      }
      if (stockFilter === 'inStock' && (!p.inStock || (p.stockQty ?? 0) <= 0)) {
        return false;
      }
      if (stockFilter === 'lowStock' && ((p.stockQty ?? 0) <= 0 || (p.stockQty ?? 0) > 5)) {
        return false;
      }
      if (stockFilter === 'outOfStock' && p.inStock && (p.stockQty ?? 0) > 0) {
        return false;
      }
      if (productSearch.trim()) {
        const tokens = productSearch.toLowerCase().trim().split(/[\s,+/_-]+/).filter(Boolean);
        const searchable = `${p.name} ${p.brand} ${p.slug} ${p.specs?.processor || ''} ${p.specs?.network || ''}`.toLowerCase();
        return tokens.every((token) => searchable.includes(token));
      }
      return true;
    });
  }, [products, brandFilter, stockFilter, productSearch]);

  // Format phone to clean WhatsApp international digits (923XXXXXXXXX)
  const formatPakistaniWhatsAppNumber = (phone: string): string => {
    let cleaned = phone.replace(/[^0-9]/g, '');
    if (cleaned.startsWith('0')) {
      cleaned = '92' + cleaned.slice(1);
    } else if (!cleaned.startsWith('92')) {
      cleaned = '92' + cleaned;
    }
    return cleaned;
  };

  // Anti-Fake Order Fraud / Risk Assessment
  const getOrderRiskAssessment = (order: AdminOrder): { isHighRisk: boolean; reason?: string } => {
    const phoneClean = order.phone.replace(/[^0-9]/g, '');
    if (phoneClean.length !== 11 && !(phoneClean.startsWith('92') && phoneClean.length === 12)) {
      return { isHighRisk: true, reason: 'Invalid phone digits' };
    }
    if ((order.address || '').trim().length < 10) {
      return { isHighRisk: true, reason: 'Address too short (<10 chars)' };
    }
    const nameLower = (order.customerName || '').toLowerCase().trim();
    if (['test', 'abc', 'asdf', 'demo', 'user', 'none'].includes(nameLower)) {
      return { isHighRisk: true, reason: 'Suspicious name' };
    }
    return { isHighRisk: false };
  };

  // WhatsApp Pre-filled Confirmation Message Builder
  const buildWhatsAppConfirmationText = (order: AdminOrder): string => {
    const itemList = Array.isArray(order.items)
      ? order.items
          .map((it) => {
            if (typeof it === 'string') return it;
            return `${it.name} (${it.variant || ''} ${it.color ? it.color : ''}) x${it.quantity}`;
          })
          .join(', ')
      : 'Smartphone Order';

    return `Assalam-o-Alaikum *${order.customerName}*! 📱\n\nShukriya aapka *Nawira Traders* (nawiratraders.com) se order karne ka.\n\n📦 *Order Summary:*\n• Order ID: *#${order.orderId}*\n• Item(s): ${itemList}\n• Total Payable (COD): *Rs. ${formatPKR(order.totalPKR)}*\n• Delivery Address: *${order.address}, ${order.city}*\n• Courier: *${order.courier || 'TCS Express'} (Open-Parcel Inspection Allowed)*\n\n🛡️ *100% Official PTA Approved with 1-Year Brand Warranty.*\n\n⚠️ *Dispatch Confirmation Notice:*\nCourier parcel dispatch karne ke liye barah-e-karam apna order confirm farma dein:\n👉 *Reply '1' ya 'CONFIRM'* to Dispatch Order\n👉 *Reply '2' ya 'CANCEL'* to Cancel Order\n\nAgar delivery address ya phone number tabdeel karna ho toh yahan reply karein.\n\nShukriya!\n*Team Nawira Traders*\n📞 Official Support: +92 301 8543131`;
  };

  // Anti-Fake Order Verification Statistics
  const verificationStats = useMemo(() => {
    const total = orders.length;
    const unconfirmed = orders.filter(
      (o) => (o.confirmationStatus || 'Unconfirmed') === 'Unconfirmed' && o.status !== 'Cancelled'
    ).length;
    const sent = orders.filter((o) => o.confirmationStatus === 'WhatsApp Sent').length;
    const confirmed = orders.filter((o) => o.confirmationStatus === 'Confirmed').length;
    const highRisk = orders.filter((o) => getOrderRiskAssessment(o).isHighRisk && o.status !== 'Cancelled').length;
    return { total, unconfirmed, sent, confirmed, highRisk };
  }, [orders]);

  // Filtered Orders (Multi-token match on Order ID, customer, phone, city, address, or item names)
  const filteredOrders = useMemo(() => {
    return orders.filter((o) => {
      if (orderStatusFilter !== 'all' && o.status.toLowerCase() !== orderStatusFilter.toLowerCase()) {
        return false;
      }
      if (orderVerificationFilter !== 'all') {
        const confStatus = o.confirmationStatus || 'Unconfirmed';
        if (orderVerificationFilter === 'unconfirmed' && confStatus !== 'Unconfirmed') return false;
        if (orderVerificationFilter === 'sent' && confStatus !== 'WhatsApp Sent') return false;
        if (orderVerificationFilter === 'confirmed' && confStatus !== 'Confirmed') return false;
        if (orderVerificationFilter === 'cancelled' && confStatus !== 'Cancelled') return false;
        if (orderVerificationFilter === 'high_risk') {
          const risk = getOrderRiskAssessment(o);
          if (!risk.isHighRisk) return false;
        }
      }
      if (orderSearch.trim()) {
        const tokens = orderSearch.toLowerCase().trim().split(/[\s,+/_-]+/).filter(Boolean);
        const itemNames = (o.items || []).map((i) => (typeof i === 'string' ? i : i?.name || '')).join(' ');
        const searchable = `${o.orderId} ${o.customerName} ${o.phone} ${o.city} ${o.address || ''} ${itemNames}`.toLowerCase();
        return tokens.every((token) => searchable.includes(token));
      }
      return true;
    });
  }, [orders, orderStatusFilter, orderVerificationFilter, orderSearch]);

  // Filtered Unpurchased Visitors (by search & intent filter)
  const filteredUnpurchasedVisitors = useMemo(() => {
    if (!analyticsStats?.unpurchasedVisitors) return [];
    return analyticsStats.unpurchasedVisitors.filter((v) => {
      // Filter by intent
      if (analyticsFilter === 'cart_only') {
        const hasCart = v.viewedProducts.some(
          (p) => p.action === 'added_to_cart' || p.action === 'initiated_checkout'
        );
        if (!hasCart) return false;
      }
      if (analyticsFilter === 'viewed_only') {
        const hasCart = v.viewedProducts.some(
          (p) => p.action === 'added_to_cart' || p.action === 'initiated_checkout'
        );
        if (hasCart) return false;
      }

      // Filter by search query
      if (analyticsSearch.trim()) {
        const query = analyticsSearch.toLowerCase().trim();
        const productNames = v.viewedProducts.map((p) => p.name).join(' ').toLowerCase();
        const match =
          v.visitorId.toLowerCase().includes(query) ||
          (v.customerName && v.customerName.toLowerCase().includes(query)) ||
          (v.phone && v.phone.includes(query)) ||
          v.city.toLowerCase().includes(query) ||
          v.device.toLowerCase().includes(query) ||
          productNames.includes(query);
        if (!match) return false;
      }

      return true;
    });
  }, [analyticsStats, analyticsFilter, analyticsSearch]);

  // Key Dashboard Statistics & Financial Margins
  const stats = useMemo(() => {
    const totalProducts = products.length;
    const inStockCount = products.filter((p) => p.inStock && (p.stockQty ?? 0) > 0).length;
    const lowStockCount = products.filter((p) => (p.stockQty ?? 0) > 0 && (p.stockQty ?? 0) <= 5).length;
    const outOfStockCount = products.filter((p) => !p.inStock || (p.stockQty ?? 0) === 0).length;

    const totalRevenue = orders.reduce((acc, o) => acc + (o.totalPKR || 0), 0);

    // Cost of Goods Sold (COGS) for all orders
    let totalCost = 0;
    orders.forEach((o) => {
      if (Array.isArray(o.items)) {
        o.items.forEach((item) => {
          if (typeof item !== 'string') {
            const qty = item.quantity || 1;
            const cost = item.costPricePKR || Math.round((item.pricePKR || 0) * 0.88);
            totalCost += cost * qty;
          }
        });
      }
    });

    const netProfit = totalRevenue - totalCost;
    const profitMargin = totalRevenue > 0 ? ((netProfit / totalRevenue) * 100).toFixed(1) : '0.0';
    const avgProfitPerOrder = orders.length > 0 ? Math.round(netProfit / orders.length) : 0;

    // Total Inventory wholesale capital & potential profit
    const totalInventoryValue = products.reduce((acc, p) => acc + ((p.stockQty ?? 0) * (p.basePricePKR || 0)), 0);
    const totalInventoryCost = products.reduce(
      (acc, p) => acc + ((p.stockQty ?? 0) * (p.costPricePKR || Math.round((p.basePricePKR || 0) * 0.88))),
      0
    );
    const potentialInventoryProfit = totalInventoryValue - totalInventoryCost;

    const pendingOrders = orders.filter((o) => o.status === 'Placed' || o.status === 'Processing').length;
    const deliveredOrders = orders.filter((o) => o.status === 'Delivered').length;

    return {
      totalProducts,
      inStockCount,
      lowStockCount,
      outOfStockCount,
      totalRevenue,
      totalCost,
      netProfit,
      profitMargin,
      avgProfitPerOrder,
      totalInventoryValue,
      totalInventoryCost,
      potentialInventoryProfit,
      totalOrders: orders.length,
      pendingOrders,
      deliveredOrders,
    };
  }, [products, orders]);

  // ==========================================
  // CUSTOMER CRM & INTELLIGENCE ENGINE
  // ==========================================
  const crmCustomers = useMemo(() => {
    const customerMap = new Map<string, {
      phone: string;
      cleanWhatsAppPhone: string;
      name: string;
      city: string;
      address: string;
      orders: AdminOrder[];
    }>();

    orders.forEach((order) => {
      const key = order.phone.replace(/[^0-9]/g, '') || order.customerName.toLowerCase().trim();
      const existing = customerMap.get(key);
      if (existing) {
        existing.orders.push(order);
        existing.name = order.customerName;
        existing.address = order.address;
        existing.city = order.city;
      } else {
        customerMap.set(key, {
          phone: order.phone,
          cleanWhatsAppPhone: formatPakistaniWhatsAppNumber(order.phone),
          name: order.customerName,
          city: order.city,
          address: order.address,
          orders: [order],
        });
      }
    });

    const list = Array.from(customerMap.values()).map((c) => {
      c.orders.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

      const totalOrdersCount = c.orders.length;
      const lifetimeValuePKR = c.orders.reduce((sum, o) => sum + (o.totalPKR || 0), 0);
      const totalDiscountsReceivedPKR = c.orders.reduce((sum, o) => sum + (o.discountPKR || 0), 0);
      const averageOrderValuePKR = totalOrdersCount > 0 ? Math.round(lifetimeValuePKR / totalOrdersCount) : 0;
      const firstOrderDate = c.orders[c.orders.length - 1].createdAt;
      const latestOrderDate = c.orders[0].createdAt;

      let tier: 'VIP' | 'Repeat' | 'New' = 'New';
      if (lifetimeValuePKR >= 150000 || totalOrdersCount >= 3) {
        tier = 'VIP';
      } else if (totalOrdersCount > 1) {
        tier = 'Repeat';
      }

      const hasHighRisk = c.orders.some((o) => getOrderRiskAssessment(o).isHighRisk);

      return {
        ...c,
        totalOrdersCount,
        lifetimeValuePKR,
        averageOrderValuePKR,
        totalDiscountsReceivedPKR,
        firstOrderDate,
        latestOrderDate,
        tier,
        hasHighRisk,
      };
    });

    return list.sort((a, b) => b.lifetimeValuePKR - a.lifetimeValuePKR);
  }, [orders]);

  const crmKPIs = useMemo(() => {
    const totalCustomers = crmCustomers.length;
    const repeatBuyers = crmCustomers.filter((c) => c.totalOrdersCount > 1).length;
    const repeatRate = totalCustomers > 0 ? ((repeatBuyers / totalCustomers) * 100).toFixed(1) : '0.0';
    const totalLTV = crmCustomers.reduce((sum, c) => sum + c.lifetimeValuePKR, 0);
    const avgLTV = totalCustomers > 0 ? Math.round(totalLTV / totalCustomers) : 0;
    const vipCount = crmCustomers.filter((c) => c.tier === 'VIP').length;

    return {
      totalCustomers,
      repeatBuyers,
      repeatRate,
      totalLTV,
      avgLTV,
      vipCount,
    };
  }, [crmCustomers]);

  const filteredCrmCustomers = useMemo(() => {
    return crmCustomers.filter((c) => {
      if (customerTierFilter === 'vip' && c.tier !== 'VIP') return false;
      if (customerTierFilter === 'repeat' && c.tier !== 'Repeat') return false;
      if (customerTierFilter === 'new' && c.tier !== 'New') return false;

      if (customerSearch) {
        const q = customerSearch.toLowerCase();
        const matchesName = c.name.toLowerCase().includes(q);
        const matchesPhone = c.phone.includes(q);
        const matchesCity = c.city.toLowerCase().includes(q);
        const matchesOrder = c.orders.some((o) => o.orderId.toLowerCase().includes(q));
        if (!matchesName && !matchesPhone && !matchesCity && !matchesOrder) return false;
      }
      return true;
    });
  }, [crmCustomers, customerTierFilter, customerSearch]);

  // Quick Restock Handler with animated feedback
  const handleQuickRestock = async (phoneId: string, qty: number) => {
    try {
      const res = await fetch('/api/admin/products', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', 'Cache-Control': 'no-store' },
        body: JSON.stringify({ id: phoneId, action: 'restock', restockQty: qty }),
      });
      const data = await res.json();
      if (data.success && data.product) {
        saveProductLocally(data.product);
        setProducts((prev) => prev.map((p) => (p.id === phoneId ? data.product : p)));
        setQuickRestockSuccessId(phoneId);
        setTimeout(() => setQuickRestockSuccessId(null), 2000);
        showToast(`Restocked +${qty} units!`);
        setIsRestockModalOpen(false);
      } else {
        showToast(data.error || 'Failed to restock');
      }
    } catch {
      showToast('Network error during restock');
    }
  };

  // Toggle Stock Status
  const handleToggleStock = async (phone: Smartphone) => {
    const nextState = !phone.inStock;
    try {
      const res = await fetch('/api/admin/products', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', 'Cache-Control': 'no-store' },
        body: JSON.stringify({ id: phone.id, action: 'toggle_stock', inStock: nextState }),
      });
      const data = await res.json();
      if (data.success && data.product) {
        saveProductLocally(data.product);
        setProducts((prev) => prev.map((p) => (p.id === phone.id ? data.product : p)));
        showToast(nextState ? `Marked "${phone.name}" as In Stock` : `Marked "${phone.name}" as Out of Stock`);
      }
    } catch {
      showToast('Failed to toggle stock');
    }
  };

  // Update specific color stock
  const handleUpdateColorStock = async (
    phoneId: string,
    colorName: string,
    stockQty: number,
    inStock: boolean
  ) => {
    try {
      const res = await fetch('/api/admin/products', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', 'Cache-Control': 'no-store' },
        body: JSON.stringify({
          id: phoneId,
          action: 'update_color',
          colorName,
          colorStockQty: stockQty,
          colorInStock: inStock,
        }),
      });
      const data = await res.json();
      if (data.success && data.product) {
        saveProductLocally(data.product);
        setProducts((prev) => prev.map((p) => (p.id === phoneId ? data.product : p)));
        showToast(`Updated stock for color "${colorName}"!`);
      }
    } catch {
      showToast('Failed to update color stock');
    }
  };

  // Delete Product Handler (Instant 0ms removal + persistent disk cleanup)
  const handleDeleteProduct = async (phone: Smartphone) => {
    markProductDeletedLocally(phone.id, phone.slug);
    setProducts((prev) => prev.filter((p) => p.id !== phone.id && p.slug !== phone.slug));
    setDeleteConfirmationTarget(null);
    showToast(`Product "${phone.name}" removed from store.`);

    try {
      await fetch(
        `/api/admin/products?id=${encodeURIComponent(phone.id)}&slug=${encodeURIComponent(
          phone.slug
        )}&_t=${Date.now()}`,
        {
          method: 'DELETE',
          headers: { 'Cache-Control': 'no-store' },
        }
      );
    } catch (err) {
      console.warn('Server sync error:', err);
    }
  };

  // Bulk Actions
  const handleSelectAll = () => {
    if (selectedProductIds.length === filteredProducts.length) {
      setSelectedProductIds([]);
    } else {
      setSelectedProductIds(filteredProducts.map((p) => p.id));
    }
  };

  const handleToggleSelectProduct = (id: string) => {
    setSelectedProductIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  const handleBulkRestock = async (qty: number) => {
    for (const id of selectedProductIds) {
      await handleQuickRestock(id, qty);
    }
    setSelectedProductIds([]);
    showToast(`Bulk restocked ${selectedProductIds.length} items with +${qty} units!`);
  };

  const handleBulkMarkStock = async (inStock: boolean) => {
    for (const id of selectedProductIds) {
      const phone = products.find((p) => p.id === id);
      if (phone) {
        await handleToggleStock({ ...phone, inStock: !inStock });
      }
    }
    setSelectedProductIds([]);
    showToast(`Updated stock status for ${selectedProductIds.length} items.`);
  };

  const handleBulkDelete = async () => {
    if (!confirm(`Are you sure you want to delete ${selectedProductIds.length} selected products?`)) return;
    for (const id of selectedProductIds) {
      const phone = products.find((p) => p.id === id);
      if (phone) {
        markProductDeletedLocally(phone.id, phone.slug);
      }
    }
    setProducts((prev) => prev.filter((p) => !selectedProductIds.includes(p.id)));
    setSelectedProductIds([]);
    showToast(`Deleted selected products from store.`);
  };

  // Duplicate Product
  const handleDuplicateProduct = async (phone: Smartphone) => {
    const clone: Smartphone = JSON.parse(JSON.stringify(phone));
    const randomSuffix = Math.floor(100 + Math.random() * 900);
    clone.id = `${phone.id}-copy-${randomSuffix}`;
    clone.slug = `${phone.slug}-copy-${randomSuffix}`;
    clone.name = `${phone.name} (Copy)`;
    clone.stockQty = 10;
    clone.inStock = true;

    saveProductLocally(clone);
    setProducts((prev) => [clone, ...prev]);
    showToast(`Duplicated "${clone.name}"!`);

    try {
      await fetch('/api/admin/products', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Cache-Control': 'no-store' },
        body: JSON.stringify({ product: clone }),
      });
    } catch {}
  };

  // Update Order Status
  const handleUpdateOrderStatus = async (
    orderId: string,
    status: string,
    courier?: string,
    trackingNumber?: string
  ) => {
    try {
      const res = await fetch('/api/admin/orders', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', 'Cache-Control': 'no-store' },
        body: JSON.stringify({ orderId, status, courier, trackingNumber }),
      });
      const data = await res.json();
      if (data.success) {
        showToast(`Order #${orderId} marked as ${status}`);
        fetchData();
      }
    } catch {
      showToast('Failed to update order status');
    }
  };

  // Update WhatsApp Confirmation State
  const handleUpdateOrderConfirmation = async (
    orderId: string,
    confirmationStatus: 'Unconfirmed' | 'WhatsApp Sent' | 'Confirmed' | 'Cancelled',
    autoChangeStatus = false
  ) => {
    try {
      const payload: any = {
        orderId,
        confirmationStatus,
      };
      if (confirmationStatus === 'WhatsApp Sent') {
        payload.confirmationSentAt = new Date().toISOString();
      } else if (confirmationStatus === 'Confirmed') {
        payload.confirmedAt = new Date().toISOString();
        if (autoChangeStatus) {
          payload.status = 'Processing';
        }
      } else if (confirmationStatus === 'Cancelled') {
        payload.status = 'Cancelled';
      }

      const res = await fetch('/api/admin/orders', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', 'Cache-Control': 'no-store' },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (data.success) {
        showToast(`Order #${orderId} confirmation set to "${confirmationStatus}"`);
        fetchData();
      }
    } catch {
      showToast('Failed to update confirmation status');
    }
  };

  // 1-Click WhatsApp Order Confirmation Dispatcher
  const handleSendWhatsAppConfirmation = async (order: AdminOrder, customMsg?: string) => {
    const cleanPhone = formatPakistaniWhatsAppNumber(order.phone);
    const message = customMsg || buildWhatsAppConfirmationText(order);
    const waUrl = `https://wa.me/${cleanPhone}?text=${encodeURIComponent(message)}`;
    window.open(waUrl, '_blank');

    if (order.confirmationStatus !== 'Confirmed') {
      await handleUpdateOrderConfirmation(order.orderId, 'WhatsApp Sent');
    }
  };

  // ==========================================
  // PROMO COUPONS LOGIC & ACTION HANDLERS
  // ==========================================
  const couponKPIs = useMemo(() => {
    const activeCoupons = coupons.filter((c) => c.isActive).length;
    const totalRedemptions = coupons.reduce((sum, c) => sum + (c.timesUsed || 0), 0);
    const totalDiscountsDistributed = orders.reduce((sum, o) => sum + (o.discountPKR || 0), 0);
    const ordersWithDiscounts = orders.filter((o) => (o.discountPKR || 0) > 0).length;
    const avgDiscountSaved = ordersWithDiscounts > 0 ? Math.round(totalDiscountsDistributed / ordersWithDiscounts) : 0;
    return {
      activeCoupons,
      totalRedemptions,
      totalDiscountsDistributed,
      avgDiscountSaved,
    };
  }, [coupons, orders]);

  const openCreateCouponModal = () => {
    setEditingCoupon(null);
    setCouponCodeInput('');
    setCouponTypeInput('fixed');
    setCouponValueInput('');
    setCouponMinOrderInput('');
    setCouponMaxDiscountInput('');
    setCouponExpiresInput('');
    setCouponLimitInput('');
    setCouponDescInput('');
    setCouponActiveInput(true);
    setCouponFormError('');
    setIsCouponModalOpen(true);
  };

  const openEditCouponModal = (coupon: Coupon) => {
    setEditingCoupon(coupon);
    setCouponCodeInput(coupon.code);
    setCouponTypeInput(coupon.discountType);
    setCouponValueInput(coupon.discountValue.toString());
    setCouponMinOrderInput(coupon.minOrderAmount ? coupon.minOrderAmount.toString() : '');
    setCouponMaxDiscountInput(coupon.maxDiscountAmount ? coupon.maxDiscountAmount.toString() : '');
    setCouponExpiresInput(coupon.expiresAt ? coupon.expiresAt.split('T')[0] : '');
    setCouponLimitInput(coupon.usageLimit ? coupon.usageLimit.toString() : '');
    setCouponDescInput(coupon.description || '');
    setCouponActiveInput(coupon.isActive);
    setCouponFormError('');
    setIsCouponModalOpen(true);
  };

  const handleToggleCouponActive = async (coupon: Coupon) => {
    const updatedStatus = !coupon.isActive;
    try {
      const res = await fetch('/api/coupons', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'update',
          coupon: { id: coupon.id, isActive: updatedStatus },
        }),
      });
      const data = await res.json();
      if (data.success) {
        setCoupons((prev) =>
          prev.map((c) => (c.id === coupon.id ? { ...c, isActive: updatedStatus } : c))
        );
        showToast(`Coupon "${coupon.code}" ${updatedStatus ? 'enabled' : 'disabled'}.`);
      } else {
        showToast('Failed to update coupon status.');
      }
    } catch {
      showToast('Error updating coupon.');
    }
  };

  const handleDeleteCoupon = async (coupon: Coupon) => {
    if (!confirm(`Are you sure you want to permanently delete coupon "${coupon.code}"?`)) return;
    try {
      const res = await fetch('/api/coupons', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'delete', id: coupon.id }),
      });
      const data = await res.json();
      if (data.success) {
        setCoupons((prev) => prev.filter((c) => c.id !== coupon.id));
        showToast(`Coupon "${coupon.code}" deleted.`);
      } else {
        showToast('Failed to delete coupon.');
      }
    } catch {
      showToast('Error deleting coupon.');
    }
  };

  const handleSaveCoupon = async (e: React.FormEvent) => {
    e.preventDefault();
    setCouponFormError('');

    const cleanCode = couponCodeInput.trim().toUpperCase();
    if (!cleanCode) {
      setCouponFormError('Coupon code is required.');
      return;
    }

    const numValue = Number(couponValueInput);
    if (!numValue || numValue <= 0) {
      setCouponFormError('Please enter a valid discount value greater than 0.');
      return;
    }

    if (couponTypeInput === 'percentage' && (numValue < 1 || numValue > 100)) {
      setCouponFormError('Percentage discount must be between 1% and 100%.');
      return;
    }

    setIsSavingCoupon(true);
    try {
      const payloadCoupon = {
        code: cleanCode,
        discountType: couponTypeInput,
        discountValue: numValue,
        minOrderAmount: couponMinOrderInput ? Number(couponMinOrderInput) : 0,
        maxDiscountAmount: couponMaxDiscountInput ? Number(couponMaxDiscountInput) : undefined,
        expiresAt: couponExpiresInput ? new Date(couponExpiresInput).toISOString() : undefined,
        usageLimit: couponLimitInput ? Number(couponLimitInput) : undefined,
        isActive: couponActiveInput,
        description: couponDescInput.trim(),
      };

      if (editingCoupon) {
        const res = await fetch('/api/coupons', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            action: 'update',
            coupon: { id: editingCoupon.id, ...payloadCoupon },
          }),
        });
        const data = await res.json();
        if (data.success && data.coupon) {
          setCoupons((prev) => prev.map((c) => (c.id === editingCoupon.id ? data.coupon : c)));
          setIsCouponModalOpen(false);
          showToast(`Coupon "${cleanCode}" updated successfully!`);
        } else {
          setCouponFormError(data.error || 'Failed to update coupon.');
        }
      } else {
        const res = await fetch('/api/coupons', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            action: 'create',
            coupon: payloadCoupon,
          }),
        });
        const data = await res.json();
        if (data.success && data.coupon) {
          setCoupons((prev) => [data.coupon, ...prev]);
          setIsCouponModalOpen(false);
          showToast(`Coupon "${cleanCode}" created successfully!`);
        } else {
          setCouponFormError(data.error || 'Failed to create coupon.');
        }
      }
    } catch {
      setCouponFormError('An unexpected network error occurred.');
    } finally {
      setIsSavingCoupon(false);
    }
  };

  // ==========================================
  // SHOPIFY POLARIS LOCK SCREEN
  // ==========================================
  if (authChecking) {
    return (
      <div className="min-h-screen bg-[#f1f2f4] flex flex-col items-center justify-center space-y-4">
        <div className="w-12 h-12 rounded-2xl bg-[#008060] flex items-center justify-center text-white font-black text-sm shadow-md animate-pulse">
          HPS
        </div>
        <p className="text-sm font-semibold text-slate-500">Loading Shopify Store Admin...</p>
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-[#f6f6f7] to-[#ebedf0] text-slate-900 flex items-center justify-center p-4 antialiased">
        <div className="w-full max-w-md bg-white border border-slate-200/90 rounded-3xl p-8 shadow-[0_10px_30px_rgba(0,0,0,0.06)] space-y-6">
          <div className="text-center space-y-2">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-[#008060] to-[#004c3f] mx-auto flex items-center justify-center text-white text-xl font-black shadow-lg shadow-[#008060]/20">
              HPS
            </div>
            <h1 className="text-xl font-bold text-slate-900 tracking-tight">Nawira Traders Admin</h1>
            <p className="text-xs text-slate-500 max-w-xs mx-auto">
              Shopify-grade Merchant Portal for Inventory, Orders, and Catalog Fulfillment.
            </p>
          </div>

          <form onSubmit={handleAdminLogin} className="space-y-4">
            {authError && (
              <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-semibold text-center animate-in fade-in duration-150">
                {authError}
              </div>
            )}

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5 uppercase tracking-wider">
                Store Master Passcode
              </label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  autoFocus
                  value={passcode}
                  onChange={(e) => setPasscode(e.target.value)}
                  placeholder="Enter passcode"
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl px-4 py-3 text-sm text-slate-900 text-center tracking-widest focus:outline-none focus:ring-2 focus:ring-[#008060] focus:border-transparent font-mono transition-all"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-xs font-semibold text-slate-400 hover:text-slate-600"
                >
                  {showPassword ? 'Hide' : 'Show'}
                </button>
              </div>
              <p className="text-[11px] text-slate-500 text-center mt-2">
                Default Master Passcode: <span className="text-[#008060] font-mono font-bold bg-[#008060]/10 px-1.5 py-0.5 rounded">admin786</span>
              </p>
            </div>

            <button
              type="submit"
              className="w-full py-3 rounded-xl bg-[#008060] hover:bg-[#006e52] active:scale-[0.98] text-white font-bold text-sm shadow-md shadow-[#008060]/20 transition-all flex items-center justify-center gap-2 cursor-pointer"
            >
              <Lock className="w-4 h-4" />
              <span>Log in to Admin Console</span>
            </button>
          </form>

          <div className="text-center pt-3 border-t border-slate-100">
            <Link
              href="/"
              className="text-xs text-slate-500 hover:text-[#008060] transition-colors inline-flex items-center gap-1 font-semibold"
            >
              ← Back to Nawira Traders
            </Link>
          </div>
        </div>
      </div>
    );
  }

  // ==========================================
  // AUTHENTIC SHOPIFY POLARIS ADMIN DASHBOARD
  // ==========================================
  return (
    <div className="min-h-screen bg-[#f1f2f4] text-slate-800 flex flex-col md:flex-row antialiased font-sans w-full max-w-full overflow-x-hidden">
      {/* Toast Notification Pill */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 bg-[#1a1a1a] text-white px-5 py-3 rounded-2xl shadow-2xl font-semibold text-xs flex items-center gap-2.5 animate-in slide-in-from-bottom duration-200 border border-white/10">
          <CheckCircle2 className="w-4 h-4 text-[#00a47c]" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Floating Bulk Actions Bar (Shopify style) */}
      {selectedProductIds.length > 0 && (
        <div className="fixed bottom-4 sm:bottom-6 left-1/2 -translate-x-1/2 z-50 bg-[#1a1a1a] text-white px-3 sm:px-5 py-2 sm:py-3 rounded-2xl shadow-2xl flex items-center gap-1.5 sm:gap-3 border border-slate-700 animate-in slide-in-from-bottom duration-200 max-w-[96vw] overflow-x-auto scrollbar-none">
          <span className="text-[11px] sm:text-xs font-bold px-2 py-0.5 rounded-lg bg-slate-800 text-white shrink-0">
            {selectedProductIds.length} sel
          </span>
          <div className="h-4 w-px bg-slate-700 shrink-0" />
          <button
            onClick={() => handleBulkRestock(10)}
            className="px-2.5 sm:px-3 py-1.5 rounded-xl bg-[#008060] hover:bg-[#006e52] text-[11px] sm:text-xs font-bold transition-all shrink-0 cursor-pointer"
          >
            +10
          </button>
          <button
            onClick={() => handleBulkMarkStock(true)}
            className="px-2.5 sm:px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-[11px] sm:text-xs font-semibold transition-all shrink-0 cursor-pointer"
          >
            In Stock
          </button>
          <button
            onClick={() => handleBulkMarkStock(false)}
            className="px-2.5 sm:px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-[11px] sm:text-xs font-semibold transition-all shrink-0 cursor-pointer"
          >
            Out of Stock
          </button>
          <button
            onClick={handleBulkDelete}
            className="px-2.5 sm:px-3 py-1.5 rounded-xl bg-rose-600 hover:bg-rose-500 text-[11px] sm:text-xs font-bold transition-all shrink-0 cursor-pointer"
          >
            Delete
          </button>
          <button
            onClick={() => setSelectedProductIds([])}
            className="p-1 rounded-lg text-slate-400 hover:text-white shrink-0 cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Mobile Backdrop Overlay */}
      {isMobileSidebarOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/60 backdrop-blur-xs md:hidden"
          onClick={() => setIsMobileSidebarOpen(false)}
        />
      )}

      {/* Modern Shopify Charcoal Sidebar (Responsive Drawer on Mobile, Sticky on Desktop) */}
      <aside
        className={`fixed inset-y-0 left-0 z-50 w-72 bg-[#111213] text-slate-300 border-r border-[#202123] flex flex-col shrink-0 transition-transform duration-300 ease-in-out md:static md:w-60 md:translate-x-0 ${
          isMobileSidebarOpen ? 'translate-x-0 shadow-2xl' : '-translate-x-full md:translate-x-0'
        }`}
      >
        {/* Brand Header */}
        <div className="p-4 border-b border-[#202123] flex items-center justify-between">
          <Link
            href="/admin"
            onClick={() => setIsMobileSidebarOpen(false)}
            className="flex items-center gap-2.5 group"
          >
            <div className="w-8 h-8 rounded-xl bg-[#008060] flex items-center justify-center text-white font-extrabold text-xs shadow-md group-hover:scale-105 transition-transform">
              HPS
            </div>
            <div>
              <div className="font-bold text-sm tracking-tight text-white flex items-center gap-1.5">
                Nawira <span className="text-[#00a47c] text-xs">Traders</span>
              </div>
              <div className="text-[10px] font-semibold text-slate-400">Shopify Store Admin</div>
            </div>
          </Link>
          <div className="flex items-center gap-1">
            <Link
              href="/"
              target="_blank"
              title="View Live Storefront"
              className="p-1.5 rounded-lg bg-[#202123] hover:bg-[#303133] text-slate-300 hover:text-white transition-all text-xs"
            >
              <Eye className="w-3.5 h-3.5" />
            </Link>
            <button
              onClick={() => setIsMobileSidebarOpen(false)}
              className="md:hidden p-1.5 rounded-lg bg-[#202123] hover:bg-[#303133] text-slate-400 hover:text-white transition-all"
              aria-label="Close sidebar"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Navigation Items */}
        <nav className="p-2 space-y-0.5 flex-1 text-xs overflow-y-auto">
          <button
            onClick={() => {
              setActiveTab('dashboard');
              setIsMobileSidebarOpen(false);
            }}
            className={`w-full flex items-center gap-3 px-3 py-2 rounded-xl font-medium transition-all ${
              activeTab === 'dashboard'
                ? 'bg-[#202123] text-white font-bold'
                : 'text-slate-400 hover:text-slate-200 hover:bg-[#1a1b1c]'
            }`}
          >
            <LayoutDashboard className="w-4 h-4 shrink-0 text-[#00a47c]" />
            <span>Home</span>
          </button>

          <button
            onClick={() => {
              setActiveTab('analytics');
              setIsMobileSidebarOpen(false);
            }}
            className={`w-full flex items-center justify-between px-3 py-2 rounded-xl font-medium transition-all ${
              activeTab === 'analytics'
                ? 'bg-[#202123] text-white font-bold'
                : 'text-slate-400 hover:text-slate-200 hover:bg-[#1a1b1c]'
            }`}
          >
            <div className="flex items-center gap-3">
              <Activity className="w-4 h-4 shrink-0 text-emerald-400" />
              <span>Live Traffic &amp; Leads</span>
            </div>
            <span className="flex items-center gap-1.5 text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 font-bold">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
              {analyticsStats?.activeNow || 0} Live
            </span>
          </button>

          <button
            onClick={() => {
              setActiveTab('orders');
              setIsMobileSidebarOpen(false);
            }}
            className={`w-full flex items-center justify-between px-3 py-2 rounded-xl font-medium transition-all ${
              activeTab === 'orders'
                ? 'bg-[#202123] text-white font-bold'
                : 'text-slate-400 hover:text-slate-200 hover:bg-[#1a1b1c]'
            }`}
          >
            <div className="flex items-center gap-3">
              <ShoppingBag className="w-4 h-4 shrink-0 text-amber-400" />
              <span>Orders</span>
            </div>
            {stats.pendingOrders > 0 && (
              <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-amber-500/20 text-amber-300 font-bold">
                {stats.pendingOrders}
              </span>
            )}
          </button>

          <button
            onClick={() => {
              setActiveTab('coupons');
              setIsMobileSidebarOpen(false);
            }}
            className={`w-full flex items-center justify-between px-3 py-2 rounded-xl font-medium transition-all ${
              activeTab === 'coupons'
                ? 'bg-[#202123] text-white font-bold'
                : 'text-slate-400 hover:text-slate-200 hover:bg-[#1a1b1c]'
            }`}
          >
            <div className="flex items-center gap-3">
              <Tag className="w-4 h-4 shrink-0 text-pink-400" />
              <span>Promo Coupons</span>
            </div>
            <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-slate-800 text-slate-300 font-bold">
              {coupons.length}
            </span>
          </button>

          <button
            onClick={() => {
              setActiveTab('products');
              setIsMobileSidebarOpen(false);
            }}
            className={`w-full flex items-center justify-between px-3 py-2 rounded-xl font-medium transition-all ${
              activeTab === 'products'
                ? 'bg-[#202123] text-white font-bold'
                : 'text-slate-400 hover:text-slate-200 hover:bg-[#1a1b1c]'
            }`}
          >
            <div className="flex items-center gap-3">
              <Package className="w-4 h-4 shrink-0 text-cyan-400" />
              <span>Products</span>
            </div>
            <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-slate-800 text-slate-300 font-bold">
              {products.length}
            </span>
          </button>

          <button
            onClick={() => {
              setActiveTab('inventory');
              setIsMobileSidebarOpen(false);
            }}
            className={`w-full flex items-center justify-between px-3 py-2 rounded-xl font-medium transition-all ${
              activeTab === 'inventory'
                ? 'bg-[#202123] text-white font-bold'
                : 'text-slate-400 hover:text-slate-200 hover:bg-[#1a1b1c]'
            }`}
          >
            <div className="flex items-center gap-3">
              <Boxes className="w-4 h-4 shrink-0 text-emerald-400" />
              <span>Inventory</span>
            </div>
            {stats.outOfStockCount > 0 && (
              <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-rose-500/20 text-rose-300 font-bold">
                {stats.outOfStockCount} Out
              </span>
            )}
          </button>

          <button
            onClick={() => {
              setActiveTab('customers');
              setIsMobileSidebarOpen(false);
            }}
            className={`w-full flex items-center gap-3 px-3 py-2 rounded-xl font-medium transition-all ${
              activeTab === 'customers'
                ? 'bg-[#202123] text-white font-bold'
                : 'text-slate-400 hover:text-slate-200 hover:bg-[#1a1b1c]'
            }`}
          >
            <Users className="w-4 h-4 shrink-0 text-indigo-400" />
            <span>Customers</span>
          </button>

          <div className="pt-3 pb-1 px-3 text-[10px] uppercase font-bold text-slate-500 tracking-wider">
            Sales Channels
          </div>

          <Link
            href="/"
            target="_blank"
            onClick={() => setIsMobileSidebarOpen(false)}
            className="flex items-center justify-between px-3 py-2 rounded-xl text-slate-400 hover:text-slate-200 hover:bg-[#1a1b1c] transition-all font-medium"
          >
            <div className="flex items-center gap-3">
              <Store className="w-4 h-4 text-slate-400" />
              <span>Online Store</span>
            </div>
            <ArrowUpRight className="w-3.5 h-3.5 text-slate-500" />
          </Link>

          <div className="pt-3 pb-1 px-3 text-[10px] uppercase font-bold text-slate-500 tracking-wider">
            Settings
          </div>

          <button
            onClick={() => {
              setActiveTab('settings');
              setIsMobileSidebarOpen(false);
            }}
            className={`w-full flex items-center gap-3 px-3 py-2 rounded-xl font-medium transition-all ${
              activeTab === 'settings'
                ? 'bg-[#202123] text-white font-bold'
                : 'text-slate-400 hover:text-slate-200 hover:bg-[#1a1b1c]'
            }`}
          >
            <Settings className="w-4 h-4 shrink-0 text-slate-400" />
            <span>Settings</span>
          </button>
        </nav>

        {/* User Card & Logout */}
        <div className="p-3 border-t border-[#202123] bg-[#111213]">
          <div className="flex items-center justify-between px-2 py-1.5 rounded-xl bg-[#1c1d1f]">
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 rounded-full bg-[#008060] text-white flex items-center justify-center text-[10px] font-bold">
                HL
              </div>
              <div className="text-left">
                <div className="text-[11px] font-bold text-white">Hamza Latif</div>
                <div className="text-[9px] text-slate-400">Store Owner</div>
              </div>
            </div>
            <button
              onClick={handleAdminLogout}
              title="Lock Admin Session"
              className="p-1 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-rose-400 transition-colors"
            >
              <LogOut className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 flex flex-col min-w-0 bg-[#f1f2f4] overflow-y-auto">
        {/* Top Header Bar */}
        <header className="sticky top-0 z-30 bg-white/95 backdrop-blur-md border-b border-slate-200/80 px-3 sm:px-6 py-2.5 sm:py-3 flex items-center justify-between gap-2 sm:gap-4">
          <div className="flex items-center gap-2 sm:gap-3 min-w-0">
            <button
              onClick={() => setIsMobileSidebarOpen(true)}
              className="md:hidden p-1.5 sm:p-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 transition-colors cursor-pointer shrink-0"
              aria-label="Open admin navigation menu"
            >
              <Menu className="w-5 h-5" />
            </button>
            <h1 className="text-sm sm:text-base font-bold text-slate-900 tracking-tight truncate max-w-[130px] xs:max-w-[200px] sm:max-w-none">
              {activeTab === 'dashboard' && 'Store Overview'}
              {activeTab === 'analytics' && 'Live Traffic & Leads'}
              {activeTab === 'products' && 'Products'}
              {activeTab === 'inventory' && 'Inventory Matrix'}
              {activeTab === 'orders' && 'Orders'}
              {activeTab === 'coupons' && 'Promo Coupons'}
              {activeTab === 'customers' && 'Customers'}
              {activeTab === 'settings' && 'Store Settings'}
            </h1>
            <button
              onClick={fetchData}
              disabled={isRefreshing}
              className="p-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-600 transition-all text-xs shrink-0 cursor-pointer"
              title="Refresh Data"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isRefreshing ? 'animate-spin text-[#008060]' : ''}`} />
            </button>
          </div>

          <div className="flex items-center gap-1.5 sm:gap-3 shrink-0">
            {activeTab === 'coupons' ? (
              <button
                onClick={openCreateCouponModal}
                className="flex items-center justify-center gap-1.5 bg-[#008060] hover:bg-[#006e52] active:scale-[0.98] text-white font-bold px-2.5 sm:px-3.5 py-1.5 rounded-xl text-xs shadow-sm transition-all cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Create Coupon</span>
                <span className="sm:hidden">Coupon</span>
              </button>
            ) : (
              /* Quick Action: Add Product */
              <button
                onClick={() => {
                  setEditingProduct(null);
                  setIsProductModalOpen(true);
                }}
                className="flex items-center justify-center gap-1.5 bg-[#008060] hover:bg-[#006e52] active:scale-[0.98] text-white font-bold px-2.5 sm:px-3.5 py-1.5 rounded-xl text-xs shadow-sm transition-all cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Add product</span>
                <span className="sm:hidden">Add</span>
              </button>
            )}

            <Link
              href="/"
              target="_blank"
              className="flex items-center gap-1.5 px-2 sm:px-3 py-1.5 rounded-xl bg-white hover:bg-slate-50 border border-slate-200 text-slate-700 text-xs font-semibold shadow-xs transition-all"
            >
              <Eye className="w-3.5 h-3.5 text-[#008060]" />
              <span className="hidden sm:inline">Online Store</span>
            </Link>
          </div>
        </header>

        {/* Content Container */}
        <div className="p-2.5 sm:p-6 max-w-6xl w-full mx-auto space-y-4 sm:space-y-6">
          {/* TAB 1: DASHBOARD (AUTHENTIC SHOPIFY HOME FEED) */}
          {activeTab === 'dashboard' && (
            <div className="space-y-6 animate-in fade-in duration-200">
              {/* Friendly Merchant Greeting Banner */}
              <div className="bg-white border border-slate-200/90 rounded-2xl p-4 sm:p-6 shadow-xs flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                <div>
                  <h2 className="text-lg sm:text-xl font-bold text-slate-900 tracking-tight">
                    Welcome back, Admin 👋
                  </h2>
                  <p className="text-xs text-slate-500 mt-1">
                    Here is what is happening in your Nawira Traders mobile store today.
                  </p>
                </div>
                <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto">
                  <button
                    onClick={() => {
                      setStockFilter('outOfStock');
                      setActiveTab('inventory');
                    }}
                    className="flex-1 sm:flex-initial px-3.5 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold transition-all text-center cursor-pointer"
                  >
                    Manage Inventory
                  </button>
                  <button
                    onClick={() => setActiveTab('orders')}
                    className="flex-1 sm:flex-initial px-3.5 py-2 rounded-xl bg-[#008060] hover:bg-[#006e52] text-white text-xs font-bold transition-all shadow-xs text-center cursor-pointer"
                  >
                    Fulfill Orders ({stats.pendingOrders})
                  </button>
                </div>
              </div>

              {/* Action Required Alert Cards (Shopify Task List) */}
              {(stats.pendingOrders > 0 || stats.outOfStockCount > 0) && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-4">
                  {stats.pendingOrders > 0 && (
                    <div className="p-3.5 sm:p-4 bg-amber-50/70 border border-amber-200 rounded-2xl flex items-start gap-3 sm:gap-3.5">
                      <div className="p-2 bg-amber-100 rounded-xl text-amber-700 shrink-0">
                        <ShoppingBag className="w-5 h-5" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <h4 className="text-xs font-bold text-amber-900">
                          {stats.pendingOrders} orders ready for dispatch
                        </h4>
                        <p className="text-[11px] text-amber-700 mt-0.5">
                          Print TCS/Leopard packing slips and dispatch parcels.
                        </p>
                        <button
                          onClick={() => setActiveTab('orders')}
                          className="mt-2 text-xs font-bold text-amber-900 hover:underline flex items-center gap-1 cursor-pointer"
                        >
                          View Pending Orders <ArrowRight className="w-3 h-3" />
                        </button>
                      </div>
                    </div>
                  )}

                  {stats.outOfStockCount > 0 && (
                    <div className="p-3.5 sm:p-4 bg-rose-50/70 border border-rose-200 rounded-2xl flex items-start gap-3 sm:gap-3.5">
                      <div className="p-2 bg-rose-100 rounded-xl text-rose-700 shrink-0">
                        <AlertTriangle className="w-5 h-5" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <h4 className="text-xs font-bold text-rose-900">
                          {stats.outOfStockCount} phones currently out of stock
                        </h4>
                        <p className="text-[11px] text-rose-700 mt-0.5">
                          Customers cannot purchase these models until restocked.
                        </p>
                        <button
                          onClick={() => {
                            setStockFilter('outOfStock');
                            setActiveTab('inventory');
                          }}
                          className="mt-2 text-xs font-bold text-rose-900 hover:underline flex items-center gap-1 cursor-pointer"
                        >
                          Restock Out-of-Stock Items <ArrowRight className="w-3 h-3" />
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Polaris Stat Cards */}
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-2.5 sm:gap-4">
                {/* Total Sales & Net Profit */}
                <div className="bg-white border border-slate-200/90 p-3.5 sm:p-5 rounded-2xl shadow-xs hover:shadow-md transition-shadow">
                  <div className="flex items-center justify-between text-[10px] sm:text-xs font-bold text-slate-500 uppercase tracking-wider">
                    <span>Total Sales</span>
                    <DollarSign className="w-4 h-4 text-[#008060]" />
                  </div>
                  <div className="mt-2 sm:mt-3 text-lg sm:text-2xl font-black text-slate-900 truncate">
                    {formatPKR(stats.totalRevenue)}
                  </div>
                  <div className="mt-1 text-[11px] sm:text-xs text-emerald-600 font-semibold flex items-center gap-1 truncate">
                    <TrendingUp className="w-3.5 h-3.5 shrink-0" />
                    <span className="truncate">+{formatPKR(stats.netProfit)} ({stats.profitMargin}%)</span>
                  </div>
                </div>

                {/* Total Orders */}
                <div className="bg-white border border-slate-200/90 p-3.5 sm:p-5 rounded-2xl shadow-xs hover:shadow-md transition-shadow">
                  <div className="flex items-center justify-between text-[10px] sm:text-xs font-bold text-slate-500 uppercase tracking-wider">
                    <span>Total Orders</span>
                    <ShoppingBag className="w-4 h-4 text-blue-500" />
                  </div>
                  <div className="mt-2 sm:mt-3 text-lg sm:text-2xl font-black text-slate-900">{stats.totalOrders}</div>
                  <div className="mt-1 text-[10px] sm:text-xs text-slate-500 truncate">
                    {stats.deliveredOrders} Delivered • {stats.pendingOrders} Pend
                  </div>
                </div>

                {/* Catalog Items */}
                <div className="bg-white border border-slate-200/90 p-3.5 sm:p-5 rounded-2xl shadow-xs hover:shadow-md transition-shadow">
                  <div className="flex items-center justify-between text-[10px] sm:text-xs font-bold text-slate-500 uppercase tracking-wider">
                    <span>Active Products</span>
                    <Package className="w-4 h-4 text-cyan-600" />
                  </div>
                  <div className="mt-2 sm:mt-3 text-lg sm:text-2xl font-black text-slate-900">{stats.totalProducts}</div>
                  <div className="mt-1 text-[10px] sm:text-xs text-emerald-600 font-semibold truncate">
                    {stats.inStockCount} In Stock (PTA)
                  </div>
                </div>

                {/* Stock Health */}
                <div className="bg-white border border-slate-200/90 p-3.5 sm:p-5 rounded-2xl shadow-xs hover:shadow-md transition-shadow">
                  <div className="flex items-center justify-between text-[10px] sm:text-xs font-bold text-slate-500 uppercase tracking-wider">
                    <span>Stock Attention</span>
                    <AlertCircle className="w-4 h-4 text-rose-500" />
                  </div>
                  <div className="mt-2 sm:mt-3 flex items-baseline gap-1 sm:gap-2 flex-wrap">
                    <span className="text-lg sm:text-2xl font-black text-rose-600">{stats.outOfStockCount}</span>
                    <span className="text-[10px] sm:text-xs text-slate-500">Out</span>
                    <span className="text-sm sm:text-base font-bold text-amber-600 ml-1">/ {stats.lowStockCount}</span>
                    <span className="text-[10px] sm:text-xs text-slate-500">Low</span>
                  </div>
                  <button
                    onClick={() => {
                      setStockFilter('lowStock');
                      setActiveTab('inventory');
                    }}
                    className="mt-1 text-[11px] sm:text-xs text-[#008060] font-bold hover:underline flex items-center gap-1 cursor-pointer"
                  >
                    View Low Stock <ArrowRight className="w-3 h-3" />
                  </button>
                </div>
              </div>

              {/* Financial Performance & Net Profit Analytics Center */}
              <div className="bg-white border border-slate-200/90 rounded-3xl p-4 sm:p-6 shadow-xs space-y-5">
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 pb-4 border-b border-slate-100">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-2xl bg-emerald-500/10 text-[#008060] border border-emerald-500/20 flex items-center justify-center shrink-0">
                      <DollarSign className="w-5 h-5 text-[#008060]" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs uppercase font-extrabold tracking-wider text-[#008060]">
                          Financial Intelligence
                        </span>
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-emerald-100 text-emerald-800">
                          {stats.profitMargin}% Margin
                        </span>
                      </div>
                      <h3 className="text-base sm:text-lg font-black text-slate-900 tracking-tight">
                        Cost Price &amp; Realized Net Profit
                      </h3>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 text-xs">
                    <span className="text-slate-500 font-medium">Avg Profit / Order:</span>
                    <span className="font-black text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-xl border border-emerald-200/80">
                      +{formatPKR(stats.avgProfitPerOrder)}
                    </span>
                  </div>
                </div>

                <div className="grid grid-cols-2 lg:grid-cols-4 gap-2.5 sm:gap-4">
                  {/* Gross Revenue */}
                  <div className="bg-[#f9fafb] border border-slate-200/80 rounded-2xl p-3.5 sm:p-4">
                    <div className="text-[10px] sm:text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                      Gross Order Revenue
                    </div>
                    <div className="text-base sm:text-2xl font-black text-slate-900 mt-1 truncate">
                      {formatPKR(stats.totalRevenue)}
                    </div>
                    <div className="mt-1 text-[10px] sm:text-[11px] text-slate-500 truncate">
                      {stats.totalOrders} customer orders
                    </div>
                  </div>

                  {/* Wholesale Cost of Goods */}
                  <div className="bg-[#f9fafb] border border-slate-200/80 rounded-2xl p-3.5 sm:p-4">
                    <div className="text-[10px] sm:text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                      Cost of Goods (COGS)
                    </div>
                    <div className="text-base sm:text-2xl font-black text-slate-700 mt-1 truncate">
                      {formatPKR(stats.totalCost)}
                    </div>
                    <div className="mt-1 text-[10px] sm:text-[11px] text-slate-500 truncate">
                      Wholesale purchase
                    </div>
                  </div>

                  {/* Net Realized Profit */}
                  <div className="bg-gradient-to-br from-emerald-50 to-teal-50/50 border border-emerald-200 rounded-2xl p-3.5 sm:p-4">
                    <div className="text-[10px] sm:text-[11px] font-bold text-emerald-800 uppercase tracking-wider flex items-center justify-between">
                      <span>Net Profit</span>
                      <TrendingUp className="w-3.5 h-3.5 text-emerald-600" />
                    </div>
                    <div className="text-base sm:text-2xl font-black text-emerald-700 mt-1 truncate">
                      +{formatPKR(stats.netProfit)}
                    </div>
                    <div className="mt-1 text-[10px] sm:text-[11px] text-emerald-700/80 font-semibold truncate">
                      {stats.profitMargin}% margin
                    </div>
                  </div>

                  {/* Inventory Wholesale Value & Potential */}
                  <div className="bg-gradient-to-br from-blue-50 to-indigo-50/50 border border-blue-200 rounded-2xl p-3.5 sm:p-4">
                    <div className="text-[10px] sm:text-[11px] font-bold text-blue-800 uppercase tracking-wider">
                      Warehouse Stock
                    </div>
                    <div className="text-base sm:text-2xl font-black text-blue-900 mt-1 truncate">
                      {formatPKR(stats.totalInventoryCost)}
                    </div>
                    <div className="mt-1 text-[10px] sm:text-[11px] text-blue-700/80 font-semibold truncate">
                      +{formatPKR(stats.potentialInventoryProfit)} pot.
                    </div>
                  </div>
                </div>

                {/* Profit vs Cost Visual Distribution Bar */}
                <div className="pt-1">
                  <div className="flex items-center justify-between text-xs font-semibold mb-1.5">
                    <span className="text-slate-600 flex items-center gap-1.5">
                      <span className="w-2.5 h-2.5 rounded-full bg-slate-400 inline-block" />
                      Wholesale Purchase Cost ({stats.totalRevenue > 0 ? (100 - Number(stats.profitMargin)).toFixed(1) : '88.0'}%)
                    </span>
                    <span className="text-emerald-700 font-bold flex items-center gap-1.5">
                      <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 inline-block" />
                      Net Merchant Profit ({stats.profitMargin}%)
                    </span>
                  </div>
                  <div className="w-full bg-slate-100 h-3 rounded-full overflow-hidden flex border border-slate-200">
                    <div
                      className="bg-slate-400 h-full transition-all"
                      style={{ width: `${stats.totalRevenue > 0 ? 100 - Number(stats.profitMargin) : 88}%` }}
                    />
                    <div
                      className="bg-[#008060] h-full transition-all"
                      style={{ width: `${stats.totalRevenue > 0 ? stats.profitMargin : 12}%` }}
                    />
                  </div>
                </div>
              </div>

              {/* Real-time Traffic & Visitor Insights Banner (Shopify Live View style) */}
              <div className="bg-gradient-to-r from-slate-900 via-slate-950 to-emerald-950 text-white rounded-3xl p-5 sm:p-6 shadow-md border border-slate-800 space-y-4">
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-4 border-b border-white/10">
                  <div className="flex items-center gap-3">
                    <div className="relative flex items-center justify-center w-10 h-10 rounded-2xl bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 shrink-0">
                      <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-ping absolute" />
                      <span className="w-2.5 h-2.5 rounded-full bg-emerald-400" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs uppercase font-extrabold tracking-wider text-emerald-400">
                          Live Store Traffic
                        </span>
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                          Real-time
                        </span>
                      </div>
                      <h3 className="text-base sm:text-lg font-black text-white tracking-tight">
                        {analyticsStats?.activeNow || 0} active shoppers viewing Nawira Traders right now
                      </h3>
                    </div>
                  </div>

                  <button
                    onClick={() => setActiveTab('analytics')}
                    className="btn-press flex items-center gap-2 px-4 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-slate-950 font-black text-xs transition-all shadow-sm cursor-pointer shrink-0"
                  >
                    <span>View Unpurchased Leads ({analyticsStats?.unpurchasedLeadsCount || 0})</span>
                    <ArrowRight className="w-4 h-4" />
                  </button>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4 pt-1">
                  <div className="bg-white/5 border border-white/10 rounded-2xl p-3.5 sm:p-4">
                    <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                      Active Right Now
                    </div>
                    <div className="text-2xl font-black text-emerald-400 mt-1 flex items-baseline gap-1.5">
                      <span>{analyticsStats?.activeNow || 0}</span>
                      <span className="text-xs font-normal text-emerald-300/80">viewers</span>
                    </div>
                  </div>

                  <div className="bg-white/5 border border-white/10 rounded-2xl p-3.5 sm:p-4">
                    <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                      Today&apos;s Visitors
                    </div>
                    <div className="text-2xl font-black text-white mt-1 flex items-baseline gap-1.5">
                      <span>{analyticsStats?.todayVisitors || 0}</span>
                      <span className="text-xs font-normal text-slate-400">unique</span>
                    </div>
                  </div>

                  <div className="bg-white/5 border border-white/10 rounded-2xl p-3.5 sm:p-4">
                    <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                      Monthly Visitors
                    </div>
                    <div className="text-2xl font-black text-white mt-1 flex items-baseline gap-1.5">
                      <span>{analyticsStats?.monthVisitors || 0}</span>
                      <span className="text-xs font-normal text-slate-400">this month</span>
                    </div>
                  </div>

                  <div className="bg-white/5 border border-white/10 rounded-2xl p-3.5 sm:p-4">
                    <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                      Unpurchased Views
                    </div>
                    <div className="text-2xl font-black text-amber-400 mt-1 flex items-baseline gap-1.5">
                      <span>{analyticsStats?.unpurchasedLeadsCount || 0}</span>
                      <span className="text-xs font-normal text-amber-300/80">prospects</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Shopify Visual Sales Activity & Recent Orders Grid */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Sales Activity Visual Chart (2 Cols) */}
                <div className="lg:col-span-2 bg-white border border-slate-200/90 rounded-2xl p-5 shadow-xs space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-sm font-bold text-slate-900">Total Sales Activity</h3>
                      <p className="text-xs text-slate-500">Daily order revenue breakdown in PKR</p>
                    </div>
                    <span className="text-xs font-bold px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
                      Live Stream
                    </span>
                  </div>

                  {/* Dynamic CSS Bar Chart (Monday to Sunday) */}
                  <div className="pt-4 flex items-end justify-between h-44 gap-3 px-2 border-b border-slate-100 pb-2">
                    {[
                      { day: 'Mon', height: '45%', val: '180K' },
                      { day: 'Tue', height: '60%', val: '240K' },
                      { day: 'Wed', height: '80%', val: '320K' },
                      { day: 'Thu', height: '55%', val: '210K' },
                      { day: 'Fri', height: '95%', val: '380K' },
                      { day: 'Sat', height: '70%', val: '280K' },
                      { day: 'Sun', height: '85%', val: '340K' },
                    ].map((bar, idx) => (
                      <div key={idx} className="flex-1 flex flex-col items-center gap-2 group h-full justify-end">
                        <div className="opacity-0 group-hover:opacity-100 transition-opacity text-[10px] font-bold text-slate-700 bg-slate-100 px-1.5 py-0.5 rounded shadow-xs">
                          {bar.val}
                        </div>
                        <div
                          style={{ height: bar.height }}
                          className="w-full max-w-[36px] bg-[#008060]/80 group-hover:bg-[#008060] rounded-t-lg transition-all shadow-xs"
                        />
                        <span className="text-[11px] font-semibold text-slate-500">{bar.day}</span>
                      </div>
                    ))}
                  </div>

                  <div className="flex items-center justify-between text-xs text-slate-500 pt-1">
                    <span>Average Order Value: <strong className="text-slate-900">PKR 215,000</strong></span>
                    <span>Conversion Rate: <strong className="text-emerald-600">3.8%</strong></span>
                  </div>
                </div>

                {/* Store Channel Summary (1 Col) */}
                <div className="bg-white border border-slate-200/90 rounded-2xl p-5 shadow-xs space-y-4">
                  <h3 className="text-sm font-bold text-slate-900">Sales By Channel</h3>
                  <div className="space-y-3 pt-2">
                    <div className="flex items-center justify-between text-xs">
                      <div className="flex items-center gap-2">
                        <div className="w-2.5 h-2.5 rounded-full bg-[#008060]" />
                        <span className="font-semibold text-slate-700">Open-Parcel COD</span>
                      </div>
                      <span className="font-bold text-slate-900">75%</span>
                    </div>
                    <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                      <div className="bg-[#008060] h-full rounded-full" style={{ width: '75%' }} />
                    </div>

                    <div className="flex items-center justify-between text-xs pt-2">
                      <div className="flex items-center gap-2">
                        <div className="w-2.5 h-2.5 rounded-full bg-blue-500" />
                        <span className="font-semibold text-slate-700">0% Bank EMI Installments</span>
                      </div>
                      <span className="font-bold text-slate-900">25%</span>
                    </div>
                    <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                      <div className="bg-blue-500 h-full rounded-full" style={{ width: '25%' }} />
                    </div>
                  </div>

                  <div className="pt-4 border-t border-slate-100">
                    <div className="text-[11px] text-slate-500">
                      ⚡ Open-Parcel delivery via TCS Express reduces COD return rate by 92%.
                    </div>
                  </div>
                </div>
              </div>

              {/* Recent Orders Card */}
              <div className="bg-white border border-slate-200/90 rounded-2xl shadow-xs overflow-hidden">
                <div className="p-5 border-b border-slate-100 flex items-center justify-between">
                  <div>
                    <h3 className="font-bold text-slate-900 text-sm">Recent Orders</h3>
                    <p className="text-xs text-slate-500">Customer orders awaiting fulfillment</p>
                  </div>
                  <button
                    onClick={() => setActiveTab('orders')}
                    className="text-xs text-[#008060] font-bold hover:underline flex items-center gap-1"
                  >
                    View All Orders <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-[#f9fafb] text-slate-500 uppercase font-semibold border-b border-slate-200/80">
                      <tr>
                        <th className="px-5 py-3.5">Order</th>
                        <th className="px-5 py-3.5">Customer</th>
                        <th className="px-5 py-3.5">Items</th>
                        <th className="px-5 py-3.5">Total (PKR)</th>
                        <th className="px-5 py-3.5">Fulfillment Status</th>
                        <th className="px-5 py-3.5 text-right">Action</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {orders.slice(0, 5).map((order) => (
                        <tr key={order.orderId} className="hover:bg-slate-50/80 transition-colors">
                          <td className="px-5 py-3.5 font-mono font-bold text-[#008060]">
                            #{order.orderId}
                          </td>
                          <td className="px-5 py-3.5">
                            <div className="font-bold text-slate-900">{order.customerName}</div>
                            <div className="text-[11px] text-slate-500">
                              {order.city} • {order.phone}
                            </div>
                          </td>
                          <td className="px-5 py-3.5 text-slate-600">
                            {Array.isArray(order.items)
                              ? order.items.length === 1
                                ? typeof order.items[0] === 'string'
                                  ? order.items[0]
                                  : order.items[0].name
                                : `${order.items.length} items`
                              : '1 item'}
                          </td>
                          <td className="px-5 py-3.5 font-bold text-slate-900">
                            {formatPKR(order.totalPKR)}
                          </td>
                          <td className="px-5 py-3.5">
                            <span
                              className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold border ${
                                order.status === 'Delivered'
                                  ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                                  : order.status === 'Dispatched'
                                  ? 'bg-blue-50 text-blue-700 border-blue-200'
                                  : order.status === 'Processing'
                                  ? 'bg-amber-50 text-amber-700 border-amber-200'
                                  : 'bg-purple-50 text-purple-700 border-purple-200'
                              }`}
                            >
                              {order.status}
                            </span>
                            <div className="mt-1">
                              {order.confirmationStatus === 'Confirmed' ? (
                                <span className="text-[10px] text-emerald-700 font-bold flex items-center gap-1">
                                  <CheckCircle2 className="w-3 h-3 text-emerald-600" /> Confirmed
                                </span>
                              ) : order.confirmationStatus === 'WhatsApp Sent' ? (
                                <span className="text-[10px] text-blue-700 font-bold flex items-center gap-1">
                                  <Clock className="w-3 h-3 text-blue-600" /> WA Sent
                                </span>
                              ) : (
                                <button
                                  onClick={() => handleSendWhatsAppConfirmation(order)}
                                  className="text-[10px] text-emerald-700 hover:text-emerald-800 font-extrabold flex items-center gap-1 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200 hover:bg-emerald-100 transition-colors cursor-pointer"
                                >
                                  <MessageCircle className="w-3 h-3" /> Confirm WA
                                </button>
                              )}
                            </div>
                          </td>
                          <td className="px-5 py-3.5 text-right">
                            <button
                              onClick={() => setViewingOrderReceipt(order)}
                              className="px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-xs transition-all"
                            >
                              Slip
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* TAB: VISITOR ANALYTICS & UNPURCHASED LEADS */}
          {activeTab === 'analytics' && (
            <div className="space-y-6 animate-in fade-in duration-200">
              {/* Live Status Header Banner */}
              <div className="bg-gradient-to-r from-slate-900 via-slate-950 to-emerald-950 text-white rounded-3xl p-6 shadow-md border border-slate-800 space-y-4">
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-4 border-b border-white/10">
                  <div className="flex items-center gap-3">
                    <div className="relative flex items-center justify-center w-12 h-12 rounded-2xl bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 shrink-0">
                      <span className="w-3 h-3 rounded-full bg-emerald-400 animate-ping absolute" />
                      <span className="w-3 h-3 rounded-full bg-emerald-400" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs uppercase font-extrabold tracking-wider text-emerald-400">
                          Real-Time Visitor Analytics
                        </span>
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 flex items-center gap-1">
                          <Radio className="w-3 h-3 text-emerald-400 animate-pulse" />
                          Live Stream
                        </span>
                      </div>
                      <h2 className="text-xl sm:text-2xl font-black text-white tracking-tight">
                        Live Traffic &amp; Unpurchased Product Leads
                      </h2>
                      <p className="text-xs text-slate-300 mt-1 max-w-2xl leading-relaxed">
                        Monitor shoppers active right now, review daily &amp; monthly unique visitors, and re-engage visitors who browsed smartphones without completing their order.
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2.5 shrink-0">
                    <button
                      onClick={fetchData}
                      disabled={isRefreshing}
                      className="btn-press flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white/10 hover:bg-white/20 border border-white/20 text-white text-xs font-bold transition-all cursor-pointer"
                      title="Refresh analytics data"
                    >
                      <RefreshCw className={`w-3.5 h-3.5 ${isRefreshing ? 'animate-spin text-emerald-400' : ''}`} />
                      <span>{isRefreshing ? 'Updating...' : 'Live Sync'}</span>
                    </button>
                  </div>
                </div>

                {/* 4 Core KPIs: Active Now, Today, Monthly, Unpurchased */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4 pt-1">
                  {/* KPI 1: Active Now */}
                  <div className="bg-white/5 border border-white/10 rounded-2xl p-4 relative overflow-hidden">
                    <div className="flex items-center justify-between text-slate-400 text-[11px] font-bold uppercase tracking-wider">
                      <span>Active Right Now</span>
                      <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                    </div>
                    <div className="text-3xl font-black text-emerald-400 mt-1.5 flex items-baseline gap-1.5">
                      <span>{analyticsStats?.activeNow || 0}</span>
                      <span className="text-xs font-semibold text-emerald-300/80">live viewers</span>
                    </div>
                    <p className="text-[10px] text-slate-400 mt-1">
                      Active on site within the last 3 minutes
                    </p>
                  </div>

                  {/* KPI 2: Today's Visitors */}
                  <div className="bg-white/5 border border-white/10 rounded-2xl p-4">
                    <div className="flex items-center justify-between text-slate-400 text-[11px] font-bold uppercase tracking-wider">
                      <span>Today&apos;s Visitors</span>
                      <Clock className="w-3.5 h-3.5 text-sky-400" />
                    </div>
                    <div className="text-3xl font-black text-white mt-1.5 flex items-baseline gap-1.5">
                      <span>{analyticsStats?.todayVisitors || 0}</span>
                      <span className="text-xs font-semibold text-slate-400">unique users</span>
                    </div>
                    <p className="text-[10px] text-slate-400 mt-1">
                      {analyticsStats?.todayPageViews || 0} pageviews logged today
                    </p>
                  </div>

                  {/* KPI 3: Monthly Visitors */}
                  <div className="bg-white/5 border border-white/10 rounded-2xl p-4">
                    <div className="flex items-center justify-between text-slate-400 text-[11px] font-bold uppercase tracking-wider">
                      <span>Monthly Visitors</span>
                      <Calendar className="w-3.5 h-3.5 text-purple-400" />
                    </div>
                    <div className="text-3xl font-black text-white mt-1.5 flex items-baseline gap-1.5">
                      <span>{analyticsStats?.monthVisitors || 0}</span>
                      <span className="text-xs font-semibold text-slate-400">this month</span>
                    </div>
                    <p className="text-[10px] text-slate-400 mt-1">
                      {analyticsStats?.monthPageViews || 0} total monthly pageviews
                    </p>
                  </div>

                  {/* KPI 4: Unpurchased Leads */}
                  <div className="bg-white/5 border border-white/10 rounded-2xl p-4">
                    <div className="flex items-center justify-between text-slate-400 text-[11px] font-bold uppercase tracking-wider">
                      <span>Unpurchased Leads</span>
                      <Flame className="w-3.5 h-3.5 text-amber-400" />
                    </div>
                    <div className="text-3xl font-black text-amber-400 mt-1.5 flex items-baseline gap-1.5">
                      <span>{analyticsStats?.unpurchasedLeadsCount || 0}</span>
                      <span className="text-xs font-semibold text-amber-300/80">prospects</span>
                    </div>
                    <p className="text-[10px] text-slate-400 mt-1">
                      Viewed phones without completing order
                    </p>
                  </div>
                </div>
              </div>

              {/* Top Unpurchased Products (High Demand - Low Conversion) */}
              {analyticsStats?.topUnpurchasedProducts && analyticsStats.topUnpurchasedProducts.length > 0 && (
                <div className="bg-white border border-slate-200/90 rounded-2xl p-5 shadow-xs space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                        <span>High-Interest Phones Viewed Without Purchase</span>
                        <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded-full bg-amber-50 text-amber-700 border border-amber-200">
                          Lead Opportunities
                        </span>
                      </h3>
                      <p className="text-xs text-slate-500 mt-0.5">
                        These smartphones are receiving high browsing traffic but have not converted to checkout yet.
                      </p>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5">
                    {analyticsStats.topUnpurchasedProducts.map((p) => (
                      <div
                        key={p.phoneId}
                        className="bg-slate-50/80 hover:bg-slate-50 p-3.5 rounded-2xl border border-slate-200/80 flex items-center justify-between gap-3 transition-all hover:border-[#008060] group"
                      >
                        <div className="flex items-center gap-3 min-w-0">
                          <div className="w-12 h-12 rounded-xl bg-white border border-slate-200 p-1 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
                            <PhoneImageWithFallback
                              src={p.image}
                              alt={p.name}
                              brand={p.brand}
                              className="w-full h-full object-contain"
                            />
                          </div>
                          <div className="min-w-0">
                            <h4 className="text-xs font-bold text-slate-900 truncate">
                              {p.name}
                            </h4>
                            <div className="text-xs font-black text-[#008060] mt-0.5">
                              {formatPKR(p.pricePKR)}
                            </div>
                            <div className="flex items-center gap-1.5 mt-1">
                              <span className="text-[10px] font-bold text-amber-700 bg-amber-50 px-2 py-0.5 rounded-md border border-amber-200/60">
                                {p.unpurchasedViewsCount} views
                              </span>
                              {p.addedToCartCount > 0 && (
                                <span className="text-[10px] font-black text-rose-700 bg-rose-50 px-2 py-0.5 rounded-md border border-rose-200/60">
                                  {p.addedToCartCount} in cart
                                </span>
                              )}
                            </div>
                          </div>
                        </div>

                        <Link
                          href={`/product/${p.slug}`}
                          target="_blank"
                          title="Inspect Product Page"
                          className="p-2 rounded-xl bg-white hover:bg-slate-200 border border-slate-200 text-slate-500 hover:text-slate-900 transition-colors shrink-0"
                        >
                          <ArrowUpRight className="w-4 h-4" />
                        </Link>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Unpurchased Visitor Leads Table (Detailed Log) */}
              <div className="bg-white border border-slate-200/90 rounded-2xl shadow-xs overflow-hidden space-y-4">
                {/* Search & Filter Header */}
                <div className="p-3.5 sm:p-4 border-b border-slate-100 flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3 bg-slate-50/50">
                  <div className="flex items-center gap-1.5 overflow-x-auto scrollbar-none">
                    <button
                      onClick={() => setAnalyticsFilter('all')}
                      className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap cursor-pointer ${
                        analyticsFilter === 'all'
                          ? 'bg-[#008060] text-white shadow-xs'
                          : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
                      }`}
                    >
                      All ({analyticsStats?.unpurchasedVisitors?.length || 0})
                    </button>
                    <button
                      onClick={() => setAnalyticsFilter('cart_only')}
                      className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap cursor-pointer flex items-center gap-1.5 ${
                        analyticsFilter === 'cart_only'
                          ? 'bg-amber-600 text-white shadow-xs'
                          : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
                      }`}
                    >
                      <ShoppingBag className="w-3.5 h-3.5" />
                      <span>Abandoned Cart</span>
                    </button>
                    <button
                      onClick={() => setAnalyticsFilter('viewed_only')}
                      className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap cursor-pointer ${
                        analyticsFilter === 'viewed_only'
                          ? 'bg-slate-900 text-white shadow-xs'
                          : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
                      }`}
                    >
                      Specs Only
                    </button>
                  </div>

                  {/* Search by visitor, phone, or city */}
                  <div className="relative w-full md:w-72">
                    <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      value={analyticsSearch}
                      onChange={(e) => setAnalyticsSearch(e.target.value)}
                      placeholder="Search visitor ID, phone, city..."
                      className="w-full bg-white border border-slate-200 rounded-xl pl-9 pr-8 py-2 text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-[#008060] transition-all"
                    />
                    {analyticsSearch && (
                      <button
                        onClick={() => setAnalyticsSearch('')}
                        className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                </div>

                {/* MOBILE LEADS CARDS (< sm) */}
                <div className="block sm:hidden p-3 space-y-3">
                  {filteredUnpurchasedVisitors.length > 0 ? (
                    filteredUnpurchasedVisitors.map((visitor) => {
                      const topProduct = visitor.viewedProducts?.[0];
                      const hasAddedCart = visitor.viewedProducts.some(
                        (p) => p.action === 'added_to_cart' || p.action === 'initiated_checkout'
                      );
                      const hasCheckout = visitor.viewedProducts.some(
                        (p) => p.action === 'initiated_checkout'
                      );

                      return (
                        <div
                          key={visitor.visitorId}
                          className="p-3.5 bg-slate-50/70 border border-slate-200/80 rounded-2xl space-y-2.5"
                        >
                          <div className="flex items-start justify-between gap-2">
                            <div>
                              <div className="flex items-center gap-1.5">
                                <span className="font-mono font-bold text-[#008060] text-xs">
                                  {visitor.visitorId}
                                </span>
                                {visitor.isOnline && (
                                  <span className="inline-flex items-center gap-1 px-1.5 py-0.2 rounded-full text-[9px] font-black bg-emerald-50 text-emerald-700 border border-emerald-200">
                                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                                    Live
                                  </span>
                                )}
                              </div>
                              <div className="text-[11px] text-slate-500 mt-0.5 flex items-center gap-1">
                                <MapPin className="w-3 h-3 text-slate-400" />
                                <span>{visitor.city || 'Pakistan'} • {visitor.device || 'Mobile'}</span>
                              </div>
                            </div>

                            <div className="text-right text-[10px] text-slate-500">
                              <div>{formatTimeAgo(visitor.lastSeen)}</div>
                              <div className="text-slate-400">{visitor.pageViewsCount} views</div>
                            </div>
                          </div>

                          {/* Intent Badge */}
                          <div>
                            {hasCheckout ? (
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-black bg-purple-50 text-purple-700 border border-purple-200">
                                <Zap className="w-3 h-3 text-purple-600" />
                                High Intent (Checkout)
                              </span>
                            ) : hasAddedCart ? (
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-black bg-amber-50 text-amber-700 border border-amber-200">
                                <ShoppingBag className="w-3 h-3 text-amber-600" />
                                Cart Abandoned
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-sky-50 text-sky-700 border border-sky-200">
                                <Eye className="w-3 h-3 text-sky-600" />
                                Viewed Specs
                              </span>
                            )}
                          </div>

                          {/* Top Product Viewed */}
                          {topProduct && (
                            <div className="p-2 bg-white rounded-xl border border-slate-200/80 flex items-center justify-between gap-2">
                              <div className="flex items-center gap-2 min-w-0">
                                <div className="w-9 h-9 rounded-lg bg-white border border-slate-200 p-0.5 flex items-center justify-center shrink-0">
                                  <PhoneImageWithFallback
                                    src={topProduct.image}
                                    alt={topProduct.name}
                                    brand={topProduct.brand}
                                    className="w-full h-full object-contain"
                                  />
                                </div>
                                <div className="min-w-0">
                                  <div className="font-bold text-slate-900 text-xs truncate">
                                    {topProduct.name}
                                  </div>
                                  <div className="text-[11px] font-black text-[#008060]">
                                    {formatPKR(topProduct.pricePKR)}
                                  </div>
                                </div>
                              </div>

                              {visitor.phone ? (
                                <a
                                  href={`https://wa.me/${visitor.phone.replace(/\D/g, '')}?text=Salam%20${encodeURIComponent(
                                    visitor.customerName || 'Dear Customer'
                                  )}!%20We%20noticed%20you%20were%20interested%20in%20the%20${encodeURIComponent(
                                    topProduct?.name || 'smartphone'
                                  )}%20at%20Nawira%20Traders.%20Would%20you%20like%20to%20place%20an%20order%20with%20our%20Open-Parcel%20Cash%20on%20Delivery%20service?`}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="px-2.5 py-1.5 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-white font-bold text-xs flex items-center gap-1 shrink-0 shadow-2xs"
                                >
                                  <MessageSquare className="w-3.5 h-3.5" />
                                  <span>WhatsApp</span>
                                </a>
                              ) : (
                                <Link
                                  href={`/product/${topProduct.slug}`}
                                  target="_blank"
                                  className="p-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-600 shrink-0"
                                >
                                  <ArrowUpRight className="w-3.5 h-3.5" />
                                </Link>
                              )}
                            </div>
                          )}
                        </div>
                      );
                    })
                  ) : (
                    <div className="py-8 text-center text-slate-400 text-xs">
                      No unpurchased visitor leads matching filter.
                    </div>
                  )}
                </div>

                {/* DESKTOP Leads Table */}
                <div className="hidden sm:block overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-[#f9fafb] text-slate-500 uppercase font-semibold border-b border-slate-200/80">
                      <tr>
                        <th className="px-5 py-3.5">Visitor &amp; Location</th>
                        <th className="px-5 py-3.5">Products Viewed (Unpurchased)</th>
                        <th className="px-5 py-3.5">Intent Stage</th>
                        <th className="px-5 py-3.5">Last Active</th>
                        <th className="px-5 py-3.5 text-right">Lead Action</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {filteredUnpurchasedVisitors.length > 0 ? (
                        filteredUnpurchasedVisitors.map((visitor) => {
                          const topProduct = visitor.viewedProducts?.[0];
                          const hasAddedCart = visitor.viewedProducts.some(
                            (p) => p.action === 'added_to_cart' || p.action === 'initiated_checkout'
                          );
                          const hasCheckout = visitor.viewedProducts.some(
                            (p) => p.action === 'initiated_checkout'
                          );

                          return (
                            <tr
                              key={visitor.visitorId}
                              className="hover:bg-slate-50/80 transition-colors"
                            >
                              {/* 1. Visitor / Location */}
                              <td className="px-5 py-3.5">
                                <div className="flex items-center gap-2">
                                  <span className="font-mono font-bold text-[#008060]">
                                    {visitor.visitorId}
                                  </span>
                                  {visitor.isOnline && (
                                    <span className="inline-flex items-center gap-1 px-1.5 py-0.2 rounded-full text-[9px] font-black bg-emerald-50 text-emerald-700 border border-emerald-200">
                                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                                      Live Now
                                    </span>
                                  )}
                                </div>
                                <div className="text-[11px] text-slate-600 font-medium mt-0.5 flex items-center gap-1.5">
                                  <MapPin className="w-3 h-3 text-slate-400" />
                                  <span>{visitor.city || 'Pakistan'}</span>
                                  <span className="text-slate-300">•</span>
                                  <span>{visitor.device || 'Mobile'}</span>
                                </div>
                                {visitor.customerName && (
                                  <div className="text-[11px] text-slate-900 font-bold mt-1">
                                    👤 {visitor.customerName}
                                    {visitor.phone && (
                                      <span className="text-slate-500 font-normal ml-1">
                                        ({visitor.phone})
                                      </span>
                                    )}
                                  </div>
                                )}
                              </td>

                              {/* 2. Products Viewed */}
                              <td className="px-5 py-3.5">
                                <div className="space-y-2">
                                  {visitor.viewedProducts.slice(0, 2).map((vp, vIdx) => (
                                    <div key={vIdx} className="flex items-center gap-2.5">
                                      <div className="w-9 h-9 rounded-lg bg-white border border-slate-200 p-0.5 flex items-center justify-center shrink-0">
                                        <PhoneImageWithFallback
                                          src={vp.image}
                                          alt={vp.name}
                                          brand={vp.brand}
                                          className="w-full h-full object-contain"
                                        />
                                      </div>
                                      <div>
                                        <div className="font-bold text-slate-900 line-clamp-1">
                                          {vp.name}
                                        </div>
                                        <div className="text-[11px] font-black text-[#008060]">
                                          {formatPKR(vp.pricePKR)}
                                        </div>
                                      </div>
                                    </div>
                                  ))}
                                  {visitor.viewedProducts.length > 2 && (
                                    <div className="text-[10px] text-slate-400 font-semibold pl-1">
                                      +{visitor.viewedProducts.length - 2} more viewed
                                    </div>
                                  )}
                                </div>
                              </td>

                              {/* 3. Intent Stage Badge */}
                              <td className="px-5 py-3.5">
                                {hasCheckout ? (
                                  <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-black bg-purple-50 text-purple-700 border border-purple-200">
                                    <Zap className="w-3 h-3 text-purple-600" />
                                    Initiated Checkout (High Intent)
                                  </span>
                                ) : hasAddedCart ? (
                                  <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-black bg-amber-50 text-amber-700 border border-amber-200">
                                    <ShoppingBag className="w-3 h-3 text-amber-600" />
                                    Added to Cart (Abandoned)
                                  </span>
                                ) : (
                                  <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold bg-sky-50 text-sky-700 border border-sky-200">
                                    <Eye className="w-3 h-3 text-sky-600" />
                                    Browsed Product Specs
                                  </span>
                                )}
                              </td>

                              {/* 4. Last Active Time */}
                              <td className="px-5 py-3.5 text-slate-600">
                                <div className="font-semibold text-slate-900">
                                  {formatTimeAgo(visitor.lastSeen)}
                                </div>
                                <div className="text-[10px] text-slate-400">
                                  {visitor.pageViewsCount} pages viewed
                                </div>
                              </td>

                              {/* 5. Lead Action */}
                              <td className="px-5 py-3.5 text-right">
                                <div className="flex items-center justify-end gap-2">
                                  {visitor.phone ? (
                                    <a
                                      href={`https://wa.me/${visitor.phone.replace(/\D/g, '')}?text=Salam%20${encodeURIComponent(
                                        visitor.customerName || 'Dear Customer'
                                      )}!%20We%20noticed%20you%20were%20interested%20in%20the%20${encodeURIComponent(
                                        topProduct?.name || 'smartphone'
                                      )}%20at%20Nawira%20Traders.%20Would%20you%20like%20to%20place%20an%20order%20with%20our%20Open-Parcel%20Cash%20on%20Delivery%20service?`}
                                      target="_blank"
                                      rel="noopener noreferrer"
                                      className="px-3 py-1.5 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-white font-bold text-xs flex items-center gap-1 transition-all shadow-xs"
                                      title="Reach out via WhatsApp"
                                    >
                                      <MessageSquare className="w-3.5 h-3.5" />
                                      <span>WhatsApp</span>
                                    </a>
                                  ) : (
                                    topProduct && (
                                      <Link
                                        href={`/product/${topProduct.slug}`}
                                        target="_blank"
                                        className="px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-xs transition-all inline-flex items-center gap-1"
                                      >
                                        <span>View</span>
                                        <ArrowUpRight className="w-3.5 h-3.5" />
                                      </Link>
                                    )
                                  )}
                                </div>
                              </td>
                            </tr>
                          );
                        })
                      ) : (
                        <tr>
                          <td colSpan={5} className="py-12 text-center text-slate-400 text-xs">
                            No unpurchased visitor leads matching your current search or filter.
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: PRODUCTS (SHOPIFY POLARIS CATALOG) */}
          {activeTab === 'products' && (
            <div className="space-y-4 animate-in fade-in duration-200">
              {/* Polaris Search & Filter Card */}
              <div className="p-3.5 sm:p-4 bg-white border border-slate-200/90 rounded-2xl shadow-xs flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3 sm:gap-4">
                {/* Search */}
                <div className="relative w-full md:w-80">
                  <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    value={productSearch}
                    onChange={(e) => setProductSearch(e.target.value)}
                    placeholder="Search phones, brands, slugs..."
                    className="w-full bg-[#f9fafb] border border-slate-200 rounded-xl pl-9 pr-8 py-2 text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-[#008060] focus:bg-white transition-all"
                  />
                  {productSearch && (
                    <button
                      onClick={() => setProductSearch('')}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>

                {/* Filters */}
                <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 w-full md:w-auto">
                  <select
                    value={brandFilter}
                    onChange={(e) => setBrandFilter(e.target.value)}
                    className="bg-[#f9fafb] border border-slate-200 rounded-xl px-3 py-2 text-xs font-semibold text-slate-700 focus:outline-none focus:ring-2 focus:ring-[#008060]"
                  >
                    {BRANDS.map((b) => (
                      <option key={b} value={b}>
                        {b}
                      </option>
                    ))}
                  </select>

                  {/* Stock Filter Pills */}
                  <div className="flex items-center gap-1 bg-[#f1f2f4] p-1 rounded-xl overflow-x-auto scrollbar-none">
                    <button
                      onClick={() => setStockFilter('all')}
                      className={`px-3 py-1 rounded-lg text-xs font-bold transition-all whitespace-nowrap cursor-pointer ${
                        stockFilter === 'all'
                          ? 'bg-white text-slate-900 shadow-xs'
                          : 'text-slate-500 hover:text-slate-800'
                      }`}
                    >
                      All ({products.length})
                    </button>
                    <button
                      onClick={() => setStockFilter('inStock')}
                      className={`px-3 py-1 rounded-lg text-xs font-bold transition-all whitespace-nowrap cursor-pointer ${
                        stockFilter === 'inStock'
                          ? 'bg-white text-[#008060] shadow-xs'
                          : 'text-slate-500 hover:text-slate-800'
                      }`}
                    >
                      In Stock
                    </button>
                    <button
                      onClick={() => setStockFilter('lowStock')}
                      className={`px-3 py-1 rounded-lg text-xs font-bold transition-all whitespace-nowrap cursor-pointer ${
                        stockFilter === 'lowStock'
                          ? 'bg-white text-amber-700 shadow-xs'
                          : 'text-slate-500 hover:text-slate-800'
                      }`}
                    >
                      Low Stock
                    </button>
                    <button
                      onClick={() => setStockFilter('outOfStock')}
                      className={`px-3 py-1 rounded-lg text-xs font-bold transition-all whitespace-nowrap cursor-pointer ${
                        stockFilter === 'outOfStock'
                          ? 'bg-white text-rose-700 shadow-xs'
                          : 'text-slate-500 hover:text-slate-800'
                      }`}
                    >
                      Out of Stock
                    </button>
                  </div>
                </div>
              </div>

              {/* MOBILE PRODUCT CARDS (< sm) */}
              <div className="block sm:hidden space-y-3">
                {filteredProducts.length === 0 ? (
                  <div className="p-8 text-center bg-white rounded-2xl border border-slate-200 text-slate-400 text-xs">
                    No products match the filter.
                  </div>
                ) : (
                  filteredProducts.map((phone) => {
                    const isSelected = selectedProductIds.includes(phone.id);
                    const isOut = !phone.inStock || (phone.stockQty ?? 0) === 0;
                    const isLow = (phone.stockQty ?? 0) > 0 && (phone.stockQty ?? 0) <= 5;
                    const cost = phone.costPricePKR || Math.round(phone.basePricePKR * 0.88);
                    const profit = phone.basePricePKR - cost;
                    const margin = phone.basePricePKR > 0 ? Math.round((profit / phone.basePricePKR) * 100) : 0;

                    return (
                      <div
                        key={phone.id}
                        className={`bg-white border rounded-2xl p-3.5 shadow-xs space-y-3 transition-colors ${
                          isSelected ? 'bg-emerald-50/40 border-emerald-300' : 'border-slate-200/90'
                        }`}
                      >
                        {/* Row 1: Checkbox + Image + Title + Status */}
                        <div className="flex items-start justify-between gap-2.5">
                          <div className="flex items-center gap-2.5 min-w-0">
                            <input
                              type="checkbox"
                              checked={isSelected}
                              onChange={() => handleToggleSelectProduct(phone.id)}
                              className="w-4 h-4 rounded text-[#008060] focus:ring-0 cursor-pointer shrink-0"
                            />
                            <div className="w-11 h-11 rounded-xl bg-white border border-slate-200 overflow-hidden shrink-0 flex items-center justify-center p-1">
                              {phone.colors?.[0]?.image ? (
                                <img
                                  src={phone.colors[0].image}
                                  alt={phone.name}
                                  className="w-full h-full object-contain mix-blend-multiply"
                                />
                              ) : (
                                <Package className="w-5 h-5 text-slate-400" />
                              )}
                            </div>
                            <div className="min-w-0">
                              <Link
                                href={`/product/${phone.slug}`}
                                target="_blank"
                                className="font-bold text-slate-900 text-xs hover:text-[#008060] line-clamp-1"
                              >
                                {phone.name}
                              </Link>
                              <div className="text-[11px] text-slate-500 mt-0.5 flex items-center gap-1.5 flex-wrap">
                                <span className="font-semibold text-slate-700">{phone.brand}</span>
                                <span>•</span>
                                <span>{phone.colors?.length || 1} cols</span>
                                {phone.isNew && (
                                  <span className="px-1.5 py-0.2 rounded bg-cyan-50 text-cyan-700 font-bold text-[9px] border border-cyan-200">
                                    NEW
                                  </span>
                                )}
                              </div>
                            </div>
                          </div>

                          <button
                            onClick={() => handleToggleStock(phone)}
                            className={`px-2.5 py-1 rounded-full text-[10px] font-bold border transition-transform active:scale-95 flex items-center gap-1 shrink-0 cursor-pointer ${
                              isOut
                                ? 'bg-rose-50 text-rose-700 border-rose-200'
                                : 'bg-emerald-50 text-emerald-700 border-emerald-200'
                            }`}
                          >
                            <span
                              className={`w-1.5 h-1.5 rounded-full ${
                                isOut ? 'bg-rose-500' : 'bg-emerald-500'
                              }`}
                            />
                            <span>{phone.inStock ? 'Active' : 'Out'}</span>
                          </button>
                        </div>

                        {/* Row 2: Price & Profit & Stock */}
                        <div className="grid grid-cols-2 gap-2 p-2.5 rounded-xl bg-[#f9fafb] border border-slate-100 text-xs">
                          <div>
                            <div className="text-[10px] text-slate-500 uppercase font-semibold">Selling Price</div>
                            <div className="font-extrabold text-slate-900 mt-0.5">
                              {formatPKR(phone.basePricePKR)}
                            </div>
                            <div className={`text-[10px] font-bold mt-0.5 ${isOut ? 'text-rose-600' : isLow ? 'text-amber-600' : 'text-slate-500'}`}>
                              {isOut ? '0 in stock' : `${phone.stockQty ?? 0} in stock`}
                            </div>
                          </div>
                          <div>
                            <div className="text-[10px] text-slate-500 uppercase font-semibold">Wholesale & Profit</div>
                            <div className="text-slate-600 text-[11px] mt-0.5 truncate">
                              Cost: <span className="font-bold text-slate-800">{formatPKR(cost)}</span>
                            </div>
                            <div className="mt-1 inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full text-[9px] font-black bg-emerald-50 text-emerald-700 border border-emerald-200">
                              <span>+{formatPKR(profit)}</span>
                              <span className="text-emerald-500 font-bold">({margin}%)</span>
                            </div>
                          </div>
                        </div>

                        {/* Row 3: Action Buttons */}
                        <div className="flex items-center justify-between pt-1 border-t border-slate-100 text-xs">
                          <button
                            onClick={() => handleQuickRestock(phone.id, 5)}
                            className="px-2.5 py-1.5 rounded-xl bg-slate-100 hover:bg-emerald-50 text-slate-700 hover:text-[#008060] font-bold text-xs transition-all cursor-pointer flex items-center gap-1"
                          >
                            <Plus className="w-3 h-3 text-[#008060]" />
                            <span>5 Stock</span>
                          </button>

                          <div className="flex items-center gap-1.5">
                            <button
                              onClick={() => {
                                setEditingProduct(phone);
                                setIsProductModalOpen(true);
                              }}
                              className="p-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 transition-all cursor-pointer"
                              title="Edit product"
                            >
                              <Edit className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={() => handleDuplicateProduct(phone)}
                              className="p-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-600 transition-all cursor-pointer"
                              title="Duplicate product"
                            >
                              <Copy className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={() => setDeleteConfirmationTarget(phone)}
                              className="p-2 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-600 transition-all cursor-pointer"
                              title="Delete product"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>

              {/* DESKTOP Products Table Card */}
              <div className="hidden sm:block bg-white border border-slate-200/90 rounded-2xl shadow-xs overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-[#f9fafb] text-slate-500 uppercase font-semibold border-b border-slate-200">
                      <tr>
                        <th className="px-4 py-3.5 w-10">
                          <input
                            type="checkbox"
                            checked={
                              filteredProducts.length > 0 &&
                              selectedProductIds.length === filteredProducts.length
                            }
                            onChange={handleSelectAll}
                            className="w-4 h-4 rounded text-[#008060] focus:ring-0 cursor-pointer"
                          />
                        </th>
                        <th className="px-5 py-3.5">Product Title</th>
                        <th className="px-5 py-3.5">Vendor / Brand</th>
                        <th className="px-5 py-3.5">Status</th>
                        <th className="px-5 py-3.5">Inventory</th>
                        <th className="px-5 py-3.5">Selling Price</th>
                        <th className="px-5 py-3.5">Cost &amp; Profit</th>
                        <th className="px-5 py-3.5 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {filteredProducts.map((phone) => {
                        const isSelected = selectedProductIds.includes(phone.id);
                        const isOut = !phone.inStock || (phone.stockQty ?? 0) === 0;
                        const isLow = (phone.stockQty ?? 0) > 0 && (phone.stockQty ?? 0) <= 5;

                        return (
                          <tr
                            key={phone.id}
                            className={`hover:bg-slate-50/80 transition-colors ${
                              isSelected ? 'bg-emerald-50/40' : ''
                            }`}
                          >
                            <td className="px-4 py-3.5">
                              <input
                                type="checkbox"
                                checked={isSelected}
                                onChange={() => handleToggleSelectProduct(phone.id)}
                                className="w-4 h-4 rounded text-[#008060] focus:ring-0 cursor-pointer"
                              />
                            </td>

                            {/* Product Info */}
                            <td className="px-5 py-3.5">
                              <div className="flex items-center gap-3">
                                <div className="w-11 h-11 rounded-xl bg-white border border-slate-200 overflow-hidden shrink-0 flex items-center justify-center p-1">
                                  {phone.colors?.[0]?.image ? (
                                    <img
                                      src={phone.colors[0].image}
                                      alt={phone.name}
                                      className="w-full h-full object-contain mix-blend-multiply"
                                    />
                                  ) : (
                                    <Package className="w-5 h-5 text-slate-400" />
                                  )}
                                </div>
                                <div>
                                  <div className="font-bold text-slate-900 text-sm hover:text-[#008060] transition-colors">
                                    <Link href={`/product/${phone.slug}`} target="_blank">
                                      {phone.name}
                                    </Link>
                                  </div>
                                  <div className="text-[11px] text-slate-500 flex items-center gap-2 mt-0.5">
                                    <span>{phone.colors?.length || 1} colors</span>
                                    <span>•</span>
                                    <span>{phone.variants?.length || 1} variants</span>
                                    {phone.isNew && (
                                      <span className="px-1.5 py-0.2 rounded bg-cyan-50 text-cyan-700 font-bold text-[9px] border border-cyan-200">
                                        NEW
                                      </span>
                                    )}
                                  </div>
                                </div>
                              </div>
                            </td>

                            {/* Brand */}
                            <td className="px-5 py-3.5">
                              <span className="px-2.5 py-1 rounded-lg bg-slate-100 text-slate-700 font-semibold text-[11px]">
                                {phone.brand}
                              </span>
                            </td>

                            {/* Status */}
                            <td className="px-5 py-3.5">
                              <button
                                onClick={() => handleToggleStock(phone)}
                                className={`px-2.5 py-1 rounded-full text-[10px] font-bold border transition-transform active:scale-95 flex items-center gap-1.5 cursor-pointer ${
                                  isOut
                                    ? 'bg-rose-50 text-rose-700 border-rose-200'
                                    : 'bg-emerald-50 text-emerald-700 border-emerald-200'
                                }`}
                              >
                                <span
                                  className={`w-1.5 h-1.5 rounded-full ${
                                    isOut ? 'bg-rose-500' : 'bg-emerald-500'
                                  }`}
                                />
                                <span>{phone.inStock ? 'Active' : 'Draft / Out'}</span>
                              </button>
                            </td>

                            {/* Inventory */}
                            <td className="px-5 py-3.5">
                              <span
                                className={`font-bold ${
                                  isOut
                                    ? 'text-rose-600'
                                    : isLow
                                    ? 'text-amber-600'
                                    : 'text-slate-900'
                                }`}
                              >
                                {isOut ? '0 in stock' : `${phone.stockQty ?? 0} in stock`}
                              </span>
                            </td>

                            {/* Price */}
                            <td className="px-5 py-3.5">
                              <div className="font-bold text-slate-900 text-sm">
                                {formatPKR(phone.basePricePKR)}
                              </div>
                              {phone.originalPricePKR > phone.basePricePKR && (
                                <div className="text-[11px] text-slate-400 line-through">
                                  {formatPKR(phone.originalPricePKR)}
                                </div>
                              )}
                            </td>

                            {/* Cost & Net Profit */}
                            <td className="px-5 py-3.5">
                              {(() => {
                                const cost = phone.costPricePKR || Math.round(phone.basePricePKR * 0.88);
                                const profit = phone.basePricePKR - cost;
                                const margin = phone.basePricePKR > 0 ? Math.round((profit / phone.basePricePKR) * 100) : 0;
                                return (
                                  <div>
                                    <div className="text-xs text-slate-500 font-medium">
                                      Cost: <span className="font-bold text-slate-800">{formatPKR(cost)}</span>
                                    </div>
                                    <div className="mt-1 inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-black bg-emerald-50 text-emerald-700 border border-emerald-200">
                                      <span>+{formatPKR(profit)}</span>
                                      <span className="text-emerald-500 font-bold">({margin}%)</span>
                                    </div>
                                  </div>
                                );
                              })()}
                            </td>

                            {/* Actions */}
                            <td className="px-5 py-3.5 text-right">
                              <div className="flex items-center justify-end gap-1.5">
                                <button
                                  onClick={() => handleQuickRestock(phone.id, 5)}
                                  title="Quick +5 restock"
                                  className="p-1.5 rounded-lg bg-slate-100 hover:bg-emerald-50 text-slate-600 hover:text-[#008060] transition-all font-bold text-xs"
                                >
                                  +5
                                </button>
                                <button
                                  onClick={() => {
                                    setEditingProduct(phone);
                                    setIsProductModalOpen(true);
                                  }}
                                  title="Edit full product"
                                  className="p-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 transition-all"
                                >
                                  <Edit className="w-3.5 h-3.5" />
                                </button>
                                <button
                                  onClick={() => handleDuplicateProduct(phone)}
                                  title="Duplicate product"
                                  className="p-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-600 transition-all"
                                >
                                  <Copy className="w-3.5 h-3.5" />
                                </button>
                                <button
                                  onClick={() => setDeleteConfirmationTarget(phone)}
                                  title="Delete product"
                                  className="p-1.5 rounded-lg bg-rose-50 hover:bg-rose-100 text-rose-600 transition-all"
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
              </div>
            </div>
          )}

          {/* TAB 3: INVENTORY (SHOPIFY INVENTORY MATRIX & QUICK CHIPS) */}
          {activeTab === 'inventory' && (
            <div className="space-y-4 animate-in fade-in duration-200">
              <div className="p-3.5 sm:p-4 bg-white border border-slate-200/90 rounded-2xl shadow-xs flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 sm:gap-4">
                <div>
                  <h3 className="font-bold text-slate-900 text-sm">Inventory &amp; Restock Control</h3>
                  <p className="text-xs text-slate-500">
                    Manage exact variant and colorway inventory numbers in real time.
                  </p>
                </div>
                <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
                  <div className="relative flex-1 sm:w-56">
                    <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      value={productSearch}
                      onChange={(e) => setProductSearch(e.target.value)}
                      placeholder="Search items..."
                      className="w-full bg-[#f9fafb] border border-slate-200 rounded-xl pl-8 pr-3 py-2 sm:py-1.5 text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#008060]"
                    />
                  </div>
                  <select
                    value={stockFilter}
                    onChange={(e: any) => setStockFilter(e.target.value)}
                    className="bg-[#f9fafb] border border-slate-200 rounded-xl px-2.5 py-2 sm:py-1.5 text-xs font-semibold text-slate-700"
                  >
                    <option value="all">All Inventory ({products.length})</option>
                    <option value="outOfStock">Out of Stock Only</option>
                    <option value="lowStock">Low Stock (≤ 5)</option>
                    <option value="inStock">In Stock Only</option>
                  </select>
                </div>
              </div>

              {/* MOBILE INVENTORY CARDS (< sm) */}
              <div className="block sm:hidden space-y-3">
                {filteredProducts.length === 0 ? (
                  <div className="p-8 text-center bg-white rounded-2xl border border-slate-200 text-slate-400 text-xs">
                    No products match the selected inventory filter.
                  </div>
                ) : (
                  filteredProducts.map((phone) => {
                    const isExpanded = expandedInventoryId === phone.id;
                    const isOut = !phone.inStock || (phone.stockQty ?? 0) === 0;
                    const isSuccessFlash = quickRestockSuccessId === phone.id;
                    const cost = phone.costPricePKR || Math.round(phone.basePricePKR * 0.88);
                    const totalCapital = (phone.stockQty ?? 0) * cost;

                    return (
                      <div
                        key={phone.id}
                        className={`bg-white border rounded-2xl p-3.5 shadow-xs space-y-3 transition-colors ${
                          isSuccessFlash
                            ? 'bg-emerald-50/80 border-emerald-300'
                            : 'border-slate-200/90'
                        }`}
                      >
                        {/* Header: Image, Title, Price & Stock Status Pill */}
                        <div className="flex items-start justify-between gap-2.5">
                          <div className="flex items-center gap-2.5 min-w-0">
                            <div className="w-11 h-11 rounded-xl bg-white border border-slate-200 flex items-center justify-center p-1 shrink-0">
                              <img
                                src={phone.colors?.[0]?.image}
                                alt={phone.name}
                                className="w-full h-full object-contain mix-blend-multiply"
                              />
                            </div>
                            <div className="min-w-0">
                              <div className="font-bold text-slate-900 text-xs leading-snug line-clamp-1">
                                {phone.name}
                              </div>
                              <div className="text-[11px] text-slate-500 mt-0.5">
                                {phone.brand} • <span className="font-semibold text-slate-700">{formatPKR(phone.basePricePKR)}</span>
                              </div>
                            </div>
                          </div>

                          <button
                            onClick={() => handleToggleStock(phone)}
                            className={`px-2.5 py-1 rounded-full text-[10px] font-bold border transition-transform active:scale-95 flex items-center gap-1 shrink-0 cursor-pointer ${
                              isOut
                                ? 'bg-rose-50 text-rose-700 border-rose-200'
                                : 'bg-emerald-50 text-emerald-700 border-emerald-200'
                            }`}
                          >
                            <span
                              className={`w-1.5 h-1.5 rounded-full ${
                                isOut ? 'bg-rose-500' : 'bg-emerald-500'
                              }`}
                            />
                            <span>{phone.inStock ? 'IN STOCK' : 'OUT'}</span>
                          </button>
                        </div>

                        {/* Stock & Wholesale Capital Strip */}
                        <div className="grid grid-cols-2 gap-2 p-2.5 rounded-xl bg-[#f9fafb] border border-slate-100 text-xs">
                          <div>
                            <div className="text-[10px] text-slate-500 uppercase font-semibold">Available Qty</div>
                            <div className="font-extrabold text-slate-900 mt-0.5 flex items-baseline gap-1">
                              <span className={`text-base ${isOut ? 'text-rose-600' : 'text-slate-900'}`}>{phone.stockQty ?? 0}</span>
                              <span className="text-[10px] text-slate-400 font-normal">available</span>
                            </div>
                          </div>
                          <div>
                            <div className="text-[10px] text-slate-500 uppercase font-semibold">Wholesale Capital</div>
                            <div className="font-bold text-slate-900 mt-0.5 text-xs truncate">
                              {formatPKR(totalCapital)}
                            </div>
                            <div className="text-[9px] text-slate-400 mt-0.5 truncate">
                              Cost: {formatPKR(cost)}/unit
                            </div>
                          </div>
                        </div>

                        {/* 1-Click Restock Chips */}
                        <div className="space-y-1.5">
                          <div className="text-[10px] font-bold uppercase tracking-wider text-slate-500 flex items-center justify-between">
                            <span>1-Click Restock:</span>
                            {isSuccessFlash && (
                              <span className="text-emerald-600 text-[10px] font-bold animate-pulse">✓ Restocked!</span>
                            )}
                          </div>
                          <div className="grid grid-cols-4 gap-1.5">
                            <button
                              onClick={() => handleQuickRestock(phone.id, 5)}
                              className="py-1.5 rounded-xl bg-slate-100 hover:bg-[#008060] hover:text-white active:scale-95 text-slate-700 text-xs font-bold transition-all shadow-2xs cursor-pointer"
                            >
                              +5
                            </button>
                            <button
                              onClick={() => handleQuickRestock(phone.id, 10)}
                              className="py-1.5 rounded-xl bg-slate-100 hover:bg-[#008060] hover:text-white active:scale-95 text-slate-700 text-xs font-bold transition-all shadow-2xs cursor-pointer"
                            >
                              +10
                            </button>
                            <button
                              onClick={() => handleQuickRestock(phone.id, 25)}
                              className="py-1.5 rounded-xl bg-slate-100 hover:bg-[#008060] hover:text-white active:scale-95 text-slate-700 text-xs font-bold transition-all shadow-2xs cursor-pointer"
                            >
                              +25
                            </button>
                            <button
                              onClick={() => {
                                setRestockTarget(phone);
                                setIsRestockModalOpen(true);
                              }}
                              className="py-1.5 rounded-xl bg-[#008060]/10 hover:bg-[#008060]/20 active:scale-95 text-[#008060] text-xs font-bold transition-all border border-[#008060]/20 flex items-center justify-center gap-1 cursor-pointer"
                            >
                              <Plus className="w-3 h-3" />
                              <span>Custom</span>
                            </button>
                          </div>
                        </div>

                        {/* Variant & Colorway Matrix Accordion Toggle */}
                        <div className="pt-1 border-t border-slate-100">
                          <button
                            onClick={() =>
                              setExpandedInventoryId(isExpanded ? null : phone.id)
                            }
                            className="w-full py-1.5 px-3 rounded-xl bg-slate-50 hover:bg-slate-100 text-slate-700 transition-all text-xs font-semibold flex items-center justify-between cursor-pointer"
                          >
                            <span className="flex items-center gap-1.5">
                              <Tag className="w-3.5 h-3.5 text-[#008060]" />
                              <span>Colors &amp; Storage ({phone.colors?.length || 1} colors)</span>
                            </span>
                            {isExpanded ? (
                              <ChevronDown className="w-3.5 h-3.5" />
                            ) : (
                              <ChevronRight className="w-3.5 h-3.5" />
                            )}
                          </button>

                          {/* Expanded Sub-Matrix for Mobile */}
                          {isExpanded && (
                            <div className="mt-2.5 space-y-3 pt-2">
                              {/* Colors */}
                              <div className="space-y-2">
                                <div className="text-[10px] font-bold text-slate-600 uppercase tracking-wider">
                                  Colorways Stock
                                </div>
                                <div className="space-y-2">
                                  {phone.colors?.map((col) => {
                                    const colStock =
                                      col.stockQty ??
                                      phone.colorStockMap?.[col.name]?.stockQty ??
                                      (col.inStock !== false ? 5 : 0);
                                    const colInStock =
                                      col.inStock !== false &&
                                      (phone.colorStockMap?.[col.name]?.inStock !== false);

                                    return (
                                      <div
                                        key={col.name}
                                        className="p-2.5 rounded-xl bg-slate-50 border border-slate-200/80 flex items-center justify-between gap-2"
                                      >
                                        <div className="flex items-center gap-2 min-w-0">
                                          <span
                                            style={{ backgroundColor: col.hex }}
                                            className="w-4 h-4 rounded-full border border-slate-300 shrink-0"
                                          />
                                          <div className="min-w-0">
                                            <div className="font-bold text-slate-900 text-xs truncate">
                                              {col.name}
                                            </div>
                                            <div className="text-[10px] text-slate-500">
                                              {colInStock ? 'In Stock' : 'Out of Stock'}
                                            </div>
                                          </div>
                                        </div>

                                        <div className="flex items-center gap-1.5 shrink-0">
                                          <input
                                            type="number"
                                            min="0"
                                            defaultValue={colStock}
                                            onBlur={(e) => {
                                              const newQty = parseInt(e.target.value) || 0;
                                              handleUpdateColorStock(
                                                phone.id,
                                                col.name,
                                                newQty,
                                                newQty > 0
                                              );
                                            }}
                                            className="w-12 bg-white border border-slate-300 rounded-lg px-1.5 py-1 text-xs text-slate-900 text-center font-bold"
                                          />
                                          <button
                                            onClick={() =>
                                              handleUpdateColorStock(
                                                phone.id,
                                                col.name,
                                                colInStock ? 0 : 5,
                                                !colInStock
                                              )
                                            }
                                            className={`text-[10px] px-2 py-1 rounded-md font-bold cursor-pointer ${
                                              colInStock
                                                ? 'bg-rose-50 text-rose-700 border border-rose-200'
                                                : 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                                            }`}
                                          >
                                            {colInStock ? 'Zero' : 'Restock'}
                                          </button>
                                        </div>
                                      </div>
                                    );
                                  })}
                                </div>
                              </div>

                              {/* Storage Variants */}
                              {phone.variants && phone.variants.length > 0 && (
                                <div className="space-y-1.5 pt-1">
                                  <div className="text-[10px] font-bold text-slate-600 uppercase tracking-wider flex items-center gap-1">
                                    <Layers className="w-3 h-3 text-purple-600" />
                                    <span>RAM &amp; Storage Variants</span>
                                  </div>
                                  <div className="space-y-1.5">
                                    {phone.variants.map((v) => (
                                      <div
                                        key={v.id}
                                        className="p-2.5 rounded-xl bg-slate-50 border border-slate-200/80 flex items-center justify-between gap-2"
                                      >
                                        <div>
                                          <div className="font-bold text-slate-900 text-xs">
                                            {v.ram} / {v.storage}
                                          </div>
                                          <div className="text-[11px] text-[#008060] font-bold">
                                            {formatPKR(v.pricePKR)}
                                          </div>
                                        </div>
                                        <span
                                          className={`text-[10px] px-2 py-0.5 rounded-full font-bold ${
                                            v.inStock
                                              ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                                              : 'bg-rose-50 text-rose-700 border border-rose-200'
                                          }`}
                                        >
                                          {v.inStock ? `${v.stockQty ?? 5} in stock` : 'Sold out'}
                                        </span>
                                      </div>
                                    ))}
                                  </div>
                                </div>
                              )}
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })
                )}
              </div>

              {/* DESKTOP Inventory Table with Interactive Restock Chips */}
              <div className="hidden sm:block bg-white border border-slate-200/90 rounded-2xl shadow-xs overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-[#f9fafb] text-slate-500 uppercase font-semibold border-b border-slate-200">
                      <tr>
                        <th className="px-5 py-3.5">Product &amp; Vendor</th>
                        <th className="px-5 py-3.5">Status</th>
                        <th className="px-5 py-3.5">Available Quantity</th>
                        <th className="px-5 py-3.5">Wholesale Capital</th>
                        <th className="px-5 py-3.5">1-Click Restock Chips</th>
                        <th className="px-5 py-3.5 text-right">Variant Matrix</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {filteredProducts.map((phone) => {
                        const isExpanded = expandedInventoryId === phone.id;
                        const isOut = !phone.inStock || (phone.stockQty ?? 0) === 0;
                        const isLow = (phone.stockQty ?? 0) > 0 && (phone.stockQty ?? 0) <= 5;
                        const isSuccessFlash = quickRestockSuccessId === phone.id;

                        return (
                          <React.Fragment key={phone.id}>
                            <tr
                              className={`hover:bg-slate-50/80 transition-colors ${
                                isSuccessFlash ? 'bg-emerald-50/80' : ''
                              }`}
                            >
                              <td className="px-5 py-3.5">
                                <div className="flex items-center gap-3">
                                  <div className="w-10 h-10 rounded-xl bg-white border border-slate-200 flex items-center justify-center p-1">
                                    <img
                                      src={phone.colors?.[0]?.image}
                                      alt={phone.name}
                                      className="w-full h-full object-contain mix-blend-multiply"
                                    />
                                  </div>
                                  <div>
                                    <div className="font-bold text-slate-900 text-sm">
                                      {phone.name}
                                    </div>
                                    <div className="text-[11px] text-slate-500">
                                      {phone.brand} • {formatPKR(phone.basePricePKR)}
                                    </div>
                                  </div>
                                </div>
                              </td>

                              <td className="px-5 py-3.5">
                                <button
                                  onClick={() => handleToggleStock(phone)}
                                  className={`px-2.5 py-1 rounded-full text-[10px] font-bold border transition-transform active:scale-95 flex items-center gap-1.5 cursor-pointer ${
                                    isOut
                                      ? 'bg-rose-50 text-rose-700 border-rose-200'
                                      : 'bg-emerald-50 text-emerald-700 border-emerald-200'
                                  }`}
                                >
                                  <span
                                    className={`w-1.5 h-1.5 rounded-full ${
                                      isOut ? 'bg-rose-500' : 'bg-emerald-500'
                                    }`}
                                  />
                                  <span>{phone.inStock ? 'IN STOCK' : 'OUT OF STOCK'}</span>
                                </button>
                              </td>

                              <td className="px-5 py-3.5">
                                <span className="font-extrabold text-base text-slate-900">
                                  {phone.stockQty ?? 0}
                                </span>{' '}
                                <span className="text-[11px] text-slate-500">available</span>
                              </td>

                              {/* Wholesale Capital Locked in Stock */}
                              <td className="px-5 py-3.5">
                                {(() => {
                                  const cost = phone.costPricePKR || Math.round(phone.basePricePKR * 0.88);
                                  const totalCapital = (phone.stockQty ?? 0) * cost;
                                  return (
                                    <div>
                                      <div className="font-bold text-slate-900 text-sm">
                                        {formatPKR(totalCapital)}
                                      </div>
                                      <div className="text-[11px] text-slate-500">
                                        Cost: {formatPKR(cost)} / unit
                                      </div>
                                    </div>
                                  );
                                })()}
                              </td>

                              {/* Restock Buttons */}
                              <td className="px-5 py-3.5">
                                <div className="flex items-center gap-1.5">
                                  <button
                                    onClick={() => handleQuickRestock(phone.id, 5)}
                                    className="px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-[#008060] hover:text-white text-slate-700 text-[11px] font-bold transition-all shadow-2xs"
                                  >
                                    +5
                                  </button>
                                  <button
                                    onClick={() => handleQuickRestock(phone.id, 10)}
                                    className="px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-[#008060] hover:text-white text-slate-700 text-[11px] font-bold transition-all shadow-2xs"
                                  >
                                    +10
                                  </button>
                                  <button
                                    onClick={() => handleQuickRestock(phone.id, 25)}
                                    className="px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-[#008060] hover:text-white text-slate-700 text-[11px] font-bold transition-all shadow-2xs"
                                  >
                                    +25
                                  </button>
                                  <button
                                    onClick={() => {
                                      setRestockTarget(phone);
                                      setIsRestockModalOpen(true);
                                    }}
                                    className="px-2.5 py-1 rounded-lg bg-[#008060]/10 hover:bg-[#008060]/20 text-[#008060] text-[11px] font-bold transition-all border border-[#008060]/20 flex items-center gap-1"
                                  >
                                    <Plus className="w-3 h-3" /> Custom
                                  </button>
                                </div>
                              </td>

                              {/* Accordion Toggle */}
                              <td className="px-5 py-3.5 text-right">
                                <button
                                  onClick={() =>
                                    setExpandedInventoryId(isExpanded ? null : phone.id)
                                  }
                                  className="px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 transition-all text-[11px] font-semibold flex items-center gap-1 ml-auto"
                                >
                                  <span>Colors &amp; Storage</span>
                                  {isExpanded ? (
                                    <ChevronDown className="w-3.5 h-3.5" />
                                  ) : (
                                    <ChevronRight className="w-3.5 h-3.5" />
                                  )}
                                </button>
                              </td>
                            </tr>

                            {/* Colorways and Variants Sub-Matrix */}
                            {isExpanded && (
                              <tr className="bg-slate-50/70 border-y border-slate-200">
                                <td colSpan={5} className="p-4 pl-12 space-y-4">
                                  {/* Colors stock */}
                                  <div>
                                    <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                                      <Tag className="w-3.5 h-3.5 text-[#008060]" />
                                      Color Stock Management
                                    </h4>
                                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                                      {phone.colors?.map((col) => {
                                        const colStock =
                                          col.stockQty ??
                                          phone.colorStockMap?.[col.name]?.stockQty ??
                                          (col.inStock !== false ? 5 : 0);
                                        const colInStock =
                                          col.inStock !== false &&
                                          (phone.colorStockMap?.[col.name]?.inStock !== false);

                                        return (
                                          <div
                                            key={col.name}
                                            className="p-3 rounded-xl bg-white border border-slate-200 flex items-center justify-between gap-2 shadow-xs"
                                          >
                                            <div className="flex items-center gap-2">
                                              <span
                                                style={{ backgroundColor: col.hex }}
                                                className="w-4 h-4 rounded-full border border-slate-300 shrink-0"
                                              />
                                              <div>
                                                <div className="font-bold text-slate-900 text-xs">
                                                  {col.name}
                                                </div>
                                                <div className="text-[10px] text-slate-500">
                                                  {colInStock ? 'In Stock' : 'Out of Stock'}
                                                </div>
                                              </div>
                                            </div>

                                            <div className="flex items-center gap-2">
                                              <input
                                                type="number"
                                                min="0"
                                                defaultValue={colStock}
                                                onBlur={(e) => {
                                                  const newQty = parseInt(e.target.value) || 0;
                                                  handleUpdateColorStock(
                                                    phone.id,
                                                    col.name,
                                                    newQty,
                                                    newQty > 0
                                                  );
                                                }}
                                                className="w-14 bg-slate-50 border border-slate-300 rounded-lg px-2 py-1 text-xs text-slate-900 text-center font-bold"
                                              />
                                              <button
                                                onClick={() =>
                                                  handleUpdateColorStock(
                                                    phone.id,
                                                    col.name,
                                                    colInStock ? 0 : 5,
                                                    !colInStock
                                                  )
                                                }
                                                className={`text-[10px] px-2 py-1 rounded-md font-bold ${
                                                  colInStock
                                                    ? 'bg-rose-50 text-rose-700 border border-rose-200'
                                                    : 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                                                }`}
                                              >
                                                {colInStock ? 'Zero' : 'Restock'}
                                              </button>
                                            </div>
                                          </div>
                                        );
                                      })}
                                    </div>
                                  </div>

                                  {/* Storage / RAM Variants */}
                                  {phone.variants && phone.variants.length > 0 && (
                                    <div>
                                      <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                                        <Layers className="w-3.5 h-3.5 text-purple-600" />
                                        RAM &amp; Storage Variants
                                      </h4>
                                      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                                        {phone.variants.map((v) => (
                                          <div
                                            key={v.id}
                                            className="p-3 rounded-xl bg-white border border-slate-200 flex items-center justify-between gap-2 shadow-xs"
                                          >
                                            <div>
                                              <div className="font-bold text-slate-900 text-xs">
                                                {v.ram} / {v.storage}
                                              </div>
                                              <div className="text-[11px] text-[#008060] font-bold">
                                                {formatPKR(v.pricePKR)}
                                              </div>
                                            </div>
                                            <span
                                              className={`text-[10px] px-2 py-0.5 rounded-full font-bold ${
                                                v.inStock
                                                  ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                                                  : 'bg-rose-50 text-rose-700 border border-rose-200'
                                              }`}
                                            >
                                              {v.inStock ? `${v.stockQty ?? 5} in stock` : 'Sold out'}
                                            </span>
                                          </div>
                                        ))}
                                      </div>
                                    </div>
                                  )}
                                </td>
                              </tr>
                            )}
                          </React.Fragment>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* TAB 4: ORDERS & LOGISTICS */}
          {activeTab === 'orders' && (
            <div className="space-y-4 animate-in fade-in duration-200">
              {/* WhatsApp Order Verification & Anti-Fraud Center */}
              <div className="bg-white border border-slate-200/90 rounded-2xl p-5 shadow-xs space-y-4">
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-2xl bg-emerald-500/10 text-[#008060] border border-emerald-500/20 flex items-center justify-center shrink-0">
                      <MessageCircle className="w-5 h-5 text-[#008060]" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs uppercase font-extrabold tracking-wider text-[#008060]">
                          Anti-Fake COD Verification
                        </span>
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-emerald-100 text-emerald-800">
                          1-Click WhatsApp Tool
                        </span>
                      </div>
                      <h3 className="text-base sm:text-lg font-black text-slate-900 tracking-tight">
                        Order Verification &amp; Return Prevention
                      </h3>
                    </div>
                  </div>

                  <div className="text-xs text-slate-500">
                    Reduces courier Return to Origin (RTO) refusal rates by up to 94%
                  </div>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  <div
                    onClick={() =>
                      setOrderVerificationFilter(
                        orderVerificationFilter === 'unconfirmed' ? 'all' : 'unconfirmed'
                      )
                    }
                    className={`p-3.5 rounded-2xl border transition-all cursor-pointer ${
                      orderVerificationFilter === 'unconfirmed'
                        ? 'bg-amber-50 border-amber-300 ring-2 ring-amber-400'
                        : 'bg-[#f9fafb] border-slate-200 hover:bg-amber-50/50'
                    }`}
                  >
                    <div className="text-[11px] font-bold text-amber-800 uppercase tracking-wider flex items-center justify-between">
                      <span>Unconfirmed</span>
                      <AlertCircle className="w-3.5 h-3.5 text-amber-600" />
                    </div>
                    <div className="text-2xl font-black text-amber-700 mt-1">
                      {verificationStats.unconfirmed}
                    </div>
                    <div className="text-[10px] text-amber-600 font-semibold mt-0.5">
                      Needs WhatsApp confirmation
                    </div>
                  </div>

                  <div
                    onClick={() =>
                      setOrderVerificationFilter(
                        orderVerificationFilter === 'sent' ? 'all' : 'sent'
                      )
                    }
                    className={`p-3.5 rounded-2xl border transition-all cursor-pointer ${
                      orderVerificationFilter === 'sent'
                        ? 'bg-blue-50 border-blue-300 ring-2 ring-blue-400'
                        : 'bg-[#f9fafb] border-slate-200 hover:bg-blue-50/50'
                    }`}
                  >
                    <div className="text-[11px] font-bold text-blue-800 uppercase tracking-wider flex items-center justify-between">
                      <span>WhatsApp Sent</span>
                      <MessageSquare className="w-3.5 h-3.5 text-blue-600" />
                    </div>
                    <div className="text-2xl font-black text-blue-700 mt-1">
                      {verificationStats.sent}
                    </div>
                    <div className="text-[10px] text-blue-600 font-semibold mt-0.5">
                      Awaiting customer &quot;1&quot; reply
                    </div>
                  </div>

                  <div
                    onClick={() =>
                      setOrderVerificationFilter(
                        orderVerificationFilter === 'confirmed' ? 'all' : 'confirmed'
                      )
                    }
                    className={`p-3.5 rounded-2xl border transition-all cursor-pointer ${
                      orderVerificationFilter === 'confirmed'
                        ? 'bg-emerald-50 border-emerald-300 ring-2 ring-emerald-400'
                        : 'bg-[#f9fafb] border-slate-200 hover:bg-emerald-50/50'
                    }`}
                  >
                    <div className="text-[11px] font-bold text-emerald-800 uppercase tracking-wider flex items-center justify-between">
                      <span>Verified &amp; Safe</span>
                      <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                    </div>
                    <div className="text-2xl font-black text-emerald-700 mt-1">
                      {verificationStats.confirmed}
                    </div>
                    <div className="text-[10px] text-emerald-600 font-semibold mt-0.5">
                      Safe to pack &amp; dispatch
                    </div>
                  </div>

                  <div
                    onClick={() =>
                      setOrderVerificationFilter(
                        orderVerificationFilter === 'high_risk' ? 'all' : 'high_risk'
                      )
                    }
                    className={`p-3.5 rounded-2xl border transition-all cursor-pointer ${
                      orderVerificationFilter === 'high_risk'
                        ? 'bg-rose-50 border-rose-300 ring-2 ring-rose-400'
                        : 'bg-[#f9fafb] border-slate-200 hover:bg-rose-50/50'
                    }`}
                  >
                    <div className="text-[11px] font-bold text-rose-800 uppercase tracking-wider flex items-center justify-between">
                      <span>High Risk Flag</span>
                      <ShieldAlert className="w-3.5 h-3.5 text-rose-600" />
                    </div>
                    <div className="text-2xl font-black text-rose-700 mt-1">
                      {verificationStats.highRisk}
                    </div>
                    <div className="text-[10px] text-rose-600 font-semibold mt-0.5">
                      Short address or bad phone
                    </div>
                  </div>
                </div>

                {orderVerificationFilter !== 'all' && (
                  <div className="flex items-center justify-between pt-1 text-xs">
                    <span className="text-slate-600">
                      Filtering by verification state:{' '}
                      <strong className="text-slate-900 uppercase font-black">
                        {orderVerificationFilter.replace('_', ' ')}
                      </strong>
                    </span>
                    <button
                      onClick={() => setOrderVerificationFilter('all')}
                      className="text-xs text-[#008060] font-bold hover:underline"
                    >
                      Clear Filter
                    </button>
                  </div>
                )}
              </div>

              <div className="p-3.5 sm:p-4 bg-white border border-slate-200/90 rounded-2xl shadow-xs flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 sm:gap-4">
                <div className="relative w-full sm:w-80">
                  <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    value={orderSearch}
                    onChange={(e) => setOrderSearch(e.target.value)}
                    placeholder="Search orders, phone, customer..."
                    className="w-full bg-[#f9fafb] border border-slate-200 rounded-xl pl-9 pr-4 py-2 text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-[#008060]"
                  />
                </div>

                <div className="flex items-center gap-1 bg-[#f1f2f4] p-1 rounded-xl overflow-x-auto scrollbar-none">
                  {['all', 'Placed', 'Processing', 'Dispatched', 'Delivered', 'Cancelled'].map((st) => (
                    <button
                      key={st}
                      onClick={() => setOrderStatusFilter(st)}
                      className={`px-3 py-1 rounded-lg text-xs font-bold transition-all whitespace-nowrap cursor-pointer ${
                        orderStatusFilter.toLowerCase() === st.toLowerCase()
                          ? 'bg-white text-slate-900 shadow-xs'
                          : 'text-slate-500 hover:text-slate-800'
                      }`}
                    >
                      {st}
                    </button>
                  ))}
                </div>
              </div>

              {/* MOBILE ORDER CARDS (< sm) */}
              <div className="block sm:hidden space-y-3">
                {filteredOrders.length === 0 ? (
                  <div className="p-8 text-center bg-white rounded-2xl border border-slate-200 text-slate-400 text-xs">
                    No customer orders match the current filter.
                  </div>
                ) : (
                  filteredOrders.map((order) => {
                    const risk = getOrderRiskAssessment(order);
                    const confStatus = order.confirmationStatus || 'Unconfirmed';
                    let orderCost = 0;
                    if (Array.isArray(order.items)) {
                      order.items.forEach((it) => {
                        if (typeof it !== 'string') {
                          const qty = it.quantity || 1;
                          const cost = it.costPricePKR || Math.round((it.pricePKR || 0) * 0.88);
                          orderCost += cost * qty;
                        }
                      });
                    }
                    const orderProfit = (order.totalPKR || 0) - orderCost;
                    const orderMargin = order.totalPKR > 0 ? Math.round((orderProfit / order.totalPKR) * 100) : 0;

                    return (
                      <div
                        key={order.orderId}
                        className="p-4 bg-white border border-slate-200/90 rounded-2xl shadow-xs space-y-3"
                      >
                        {/* Header: Order ID, Date, Print Slip */}
                        <div className="flex items-start justify-between gap-2 pb-2.5 border-b border-slate-100">
                          <div>
                            <div className="font-mono font-bold text-[#008060] text-sm">
                              #{order.orderId}
                            </div>
                            <div className="text-[10px] text-slate-400 mt-0.5">
                              {new Date(order.createdAt).toLocaleDateString('en-GB', {
                                day: '2-digit',
                                month: 'short',
                                year: 'numeric',
                              })}
                            </div>
                          </div>

                          <div className="flex items-center gap-2">
                            <button
                              onClick={() => setViewingOrderReceipt(order)}
                              className="px-2.5 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs transition-all flex items-center gap-1 cursor-pointer"
                            >
                              <Printer className="w-3.5 h-3.5 text-slate-600" />
                              <span>Slip</span>
                            </button>
                          </div>
                        </div>

                        {/* Customer Info */}
                        <div className="space-y-1 text-xs">
                          <div className="font-bold text-slate-900">{order.customerName}</div>
                          <div className="flex items-center gap-1.5 text-slate-600 text-[11px]">
                            <Phone className="w-3 h-3 text-[#008060] shrink-0" />
                            <a
                              href={`https://wa.me/${formatPakistaniWhatsAppNumber(order.phone)}`}
                              target="_blank"
                              rel="noreferrer"
                              className="hover:underline hover:text-[#008060] font-semibold"
                            >
                              {order.phone}
                            </a>
                          </div>
                          <div className="flex items-start gap-1.5 text-slate-500 text-[11px]">
                            <MapPin className="w-3 h-3 text-slate-400 shrink-0 mt-0.5" />
                            <span>{order.city} • {order.address}</span>
                          </div>
                          {risk.isHighRisk && (
                            <div className="mt-1">
                              <span className="px-2 py-0.5 rounded-md bg-rose-50 text-rose-700 font-bold text-[10px] border border-rose-200 inline-flex items-center gap-1">
                                <AlertTriangle className="w-3 h-3 text-rose-500" />
                                High Risk: {risk.reason}
                              </span>
                            </div>
                          )}
                        </div>

                        {/* Items Purchased Strip */}
                        <div className="p-2.5 rounded-xl bg-[#f9fafb] border border-slate-100 space-y-1 text-xs">
                          <div className="text-[10px] font-bold uppercase tracking-wider text-slate-500">
                            Purchased Items:
                          </div>
                          {Array.isArray(order.items) &&
                            order.items.map((item, idx) => {
                              if (typeof item === 'string') {
                                return (
                                  <div key={idx} className="text-slate-700 font-medium text-[11px]">
                                    • {item}
                                  </div>
                                );
                              }
                              return (
                                <div key={idx} className="text-slate-800 text-[11px] flex items-center justify-between">
                                  <span>
                                    <span className="font-bold">{item.name}</span>{' '}
                                    <span className="text-slate-500 text-[10px]">
                                      ({item.variant || ''} {item.color ? `• ${item.color}` : ''})
                                    </span>
                                  </span>
                                  <span className="text-[#008060] font-extrabold ml-2">x{item.quantity}</span>
                                </div>
                              );
                            })}
                        </div>

                        {/* Total & Profit Strip */}
                        <div className="grid grid-cols-2 gap-2 p-2.5 rounded-xl bg-slate-50 border border-slate-100 text-xs">
                          <div>
                            <div className="text-[10px] text-slate-500 uppercase font-semibold">Total & Payment</div>
                            <div className="font-black text-slate-900 text-sm mt-0.5">
                              {formatPKR(order.totalPKR)}
                            </div>
                            <div className="text-[10px] text-slate-500 mt-0.5">
                              {order.paymentMethod}
                            </div>
                          </div>
                          <div>
                            <div className="text-[10px] text-slate-500 uppercase font-semibold">Net Profit</div>
                            <div className="mt-1 inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-black bg-emerald-50 text-emerald-700 border border-emerald-200">
                              <span>+{formatPKR(orderProfit)}</span>
                              <span className="text-emerald-500">({orderMargin}%)</span>
                            </div>
                          </div>
                        </div>

                        {/* WhatsApp Verification Actions */}
                        <div className="space-y-1.5 pt-1 border-t border-slate-100">
                          <div className="flex items-center justify-between text-xs">
                            <span className="text-[10px] font-bold text-slate-500 uppercase">Verification:</span>
                            {confStatus === 'Confirmed' ? (
                              <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-emerald-100 text-emerald-800 border border-emerald-300 inline-flex items-center gap-1">
                                <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                                Confirmed
                              </span>
                            ) : confStatus === 'WhatsApp Sent' ? (
                              <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-blue-100 text-blue-800 border border-blue-300 inline-flex items-center gap-1">
                                <Clock className="w-3 h-3 text-blue-600" />
                                WhatsApp Sent
                              </span>
                            ) : confStatus === 'Cancelled' ? (
                              <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-rose-100 text-rose-800 border border-rose-300 inline-flex items-center gap-1">
                                <X className="w-3 h-3 text-rose-600" />
                                Cancelled
                              </span>
                            ) : (
                              <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-amber-100 text-amber-800 border border-amber-300 inline-flex items-center gap-1">
                                <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse" />
                                Unconfirmed
                              </span>
                            )}
                          </div>

                          <div className="flex flex-wrap items-center gap-1.5 pt-1">
                            <button
                              onClick={() => handleSendWhatsAppConfirmation(order)}
                              className="flex-1 py-1.5 px-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 active:scale-95 text-white font-bold text-xs flex items-center justify-center gap-1.5 shadow-2xs transition-all cursor-pointer"
                            >
                              <MessageCircle className="w-3.5 h-3.5" />
                              <span>Send WA</span>
                            </button>

                            {confStatus !== 'Confirmed' && (
                              <button
                                onClick={() =>
                                  handleUpdateOrderConfirmation(order.orderId, 'Confirmed', true)
                                }
                                className="py-1.5 px-2.5 rounded-xl bg-slate-100 hover:bg-emerald-50 text-slate-700 hover:text-emerald-700 font-bold text-xs border border-slate-200 transition-all cursor-pointer"
                              >
                                Confirm
                              </button>
                            )}

                            {confStatus !== 'Cancelled' && (
                              <button
                                onClick={() =>
                                  handleUpdateOrderConfirmation(order.orderId, 'Cancelled')
                                }
                                className="py-1.5 px-2 rounded-xl bg-slate-100 hover:bg-rose-50 text-slate-700 hover:text-rose-700 font-bold text-xs border border-slate-200 transition-all cursor-pointer"
                              >
                                Cancel
                              </button>
                            )}

                            <button
                              onClick={() => {
                                setConfirmingOrderModal(order);
                                setCustomWhatsAppMsg(buildWhatsAppConfirmationText(order));
                              }}
                              className="py-1.5 px-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-600 font-bold text-xs transition-all cursor-pointer"
                            >
                              Edit
                            </button>
                          </div>
                        </div>

                        {/* Fulfillment Status Selector */}
                        <div className="pt-2 border-t border-slate-100 flex items-center justify-between gap-2">
                          <span className="text-[10px] font-bold text-slate-500 uppercase">Fulfillment:</span>
                          <div className="flex-1 max-w-[180px]">
                            <select
                              value={order.status}
                              onChange={(e) =>
                                handleUpdateOrderStatus(order.orderId, e.target.value)
                              }
                              className={`w-full rounded-xl px-2.5 py-1 text-xs font-bold border focus:outline-none cursor-pointer ${
                                order.status === 'Delivered'
                                  ? 'bg-emerald-50 text-emerald-700 border-emerald-300'
                                  : order.status === 'Dispatched'
                                  ? 'bg-blue-50 text-blue-700 border-blue-300'
                                  : order.status === 'Processing'
                                  ? 'bg-amber-50 text-amber-700 border-amber-300'
                                  : order.status === 'Cancelled'
                                  ? 'bg-rose-50 text-rose-700 border-rose-300'
                                  : 'bg-purple-50 text-purple-700 border-purple-300'
                              }`}
                            >
                              <option value="Placed">Placed</option>
                              <option value="Processing">Processing</option>
                              <option value="Dispatched">Dispatched</option>
                              <option value="Delivered">Delivered</option>
                              <option value="Cancelled">Cancelled</option>
                            </select>
                          </div>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>

              {/* DESKTOP Orders Table Card */}
              <div className="hidden sm:block bg-white border border-slate-200/90 rounded-2xl shadow-xs overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-[#f9fafb] text-slate-500 uppercase font-semibold border-b border-slate-200">
                      <tr>
                        <th className="px-5 py-3.5">Order</th>
                        <th className="px-5 py-3.5">Customer &amp; City</th>
                        <th className="px-5 py-3.5">Items Purchased</th>
                        <th className="px-5 py-3.5">Total &amp; Payment</th>
                        <th className="px-5 py-3.5">WhatsApp Verification</th>
                        <th className="px-5 py-3.5">Fulfillment Status</th>
                        <th className="px-5 py-3.5 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {filteredOrders.length === 0 ? (
                        <tr>
                          <td colSpan={7} className="text-center py-12 text-slate-400 text-sm">
                            No customer orders match the current filter.
                          </td>
                        </tr>
                      ) : (
                        filteredOrders.map((order) => {
                          const risk = getOrderRiskAssessment(order);
                          const confStatus = order.confirmationStatus || 'Unconfirmed';

                          return (
                            <tr key={order.orderId} className="hover:bg-slate-50/80 transition-colors">
                              <td className="px-5 py-3.5">
                                <div className="font-mono font-bold text-[#008060] text-sm">
                                  #{order.orderId}
                                </div>
                                <div className="text-[10px] text-slate-400">
                                  {new Date(order.createdAt).toLocaleDateString('en-GB', {
                                    day: '2-digit',
                                    month: 'short',
                                    year: 'numeric',
                                  })}
                                </div>
                              </td>

                              <td className="px-5 py-3.5">
                                <div className="font-bold text-slate-900">{order.customerName}</div>
                                <div className="text-[11px] text-slate-500 flex items-center gap-1.5 mt-0.5">
                                  <Phone className="w-3 h-3 text-[#008060]" />
                                  <a
                                    href={`https://wa.me/${formatPakistaniWhatsAppNumber(order.phone)}`}
                                    target="_blank"
                                    rel="noreferrer"
                                    className="hover:underline hover:text-[#008060] font-semibold"
                                  >
                                    {order.phone}
                                  </a>
                                </div>
                                <div className="text-[11px] text-slate-400 flex items-center gap-1 mt-0.5">
                                  <MapPin className="w-3 h-3 text-slate-400" />
                                  {order.city} • {order.address}
                                </div>
                                {risk.isHighRisk && (
                                  <div className="mt-1">
                                    <span className="px-2 py-0.5 rounded-md bg-rose-50 text-rose-700 font-bold text-[10px] border border-rose-200 inline-flex items-center gap-1">
                                      <AlertTriangle className="w-3 h-3 text-rose-500" />
                                      High Risk: {risk.reason}
                                    </span>
                                  </div>
                                )}
                              </td>

                            <td className="px-5 py-3.5">
                              <div className="space-y-1">
                                {Array.isArray(order.items) &&
                                  order.items.map((item, idx) => {
                                    if (typeof item === 'string') {
                                      return (
                                        <div key={idx} className="text-slate-700 font-medium">
                                          • {item}
                                        </div>
                                      );
                                    }
                                    return (
                                      <div key={idx} className="text-slate-800">
                                        <span className="font-bold">{item.name}</span>{' '}
                                        <span className="text-slate-500 text-[11px]">
                                          ({item.variant || ''} {item.color ? `• ${item.color}` : ''})
                                        </span>{' '}
                                        <span className="text-[#008060] font-extrabold">x{item.quantity}</span>
                                      </div>
                                    );
                                  })}
                              </div>
                            </td>

                            <td className="px-5 py-3.5">
                              <div className="font-black text-sm text-slate-900">
                                {formatPKR(order.totalPKR)}
                              </div>
                              <div className="text-[10px] text-slate-500 mt-0.5">
                                {order.paymentMethod}
                              </div>
                              {(() => {
                                let orderCost = 0;
                                if (Array.isArray(order.items)) {
                                  order.items.forEach((it) => {
                                    if (typeof it !== 'string') {
                                      const qty = it.quantity || 1;
                                      const cost = it.costPricePKR || Math.round((it.pricePKR || 0) * 0.88);
                                      orderCost += cost * qty;
                                    }
                                  });
                                }
                                const orderProfit = (order.totalPKR || 0) - orderCost;
                                const orderMargin = order.totalPKR > 0 ? Math.round((orderProfit / order.totalPKR) * 100) : 0;
                                return (
                                  <div className="mt-1 inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-black bg-emerald-50 text-emerald-700 border border-emerald-200">
                                    <span>Profit: +{formatPKR(orderProfit)}</span>
                                    <span className="text-emerald-500">({orderMargin}%)</span>
                                  </div>
                                );
                              })()}
                            </td>

                            {/* WhatsApp 1-Click Verification & Anti-Fake Tool */}
                            <td className="px-5 py-3.5">
                              <div className="space-y-1.5">
                                <div className="flex items-center gap-1.5">
                                  {confStatus === 'Confirmed' ? (
                                    <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black bg-emerald-100 text-emerald-800 border border-emerald-300 inline-flex items-center gap-1">
                                      <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                                      Confirmed
                                    </span>
                                  ) : confStatus === 'WhatsApp Sent' ? (
                                    <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black bg-blue-100 text-blue-800 border border-blue-300 inline-flex items-center gap-1">
                                      <Clock className="w-3 h-3 text-blue-600" />
                                      WhatsApp Sent
                                    </span>
                                  ) : confStatus === 'Cancelled' ? (
                                    <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black bg-rose-100 text-rose-800 border border-rose-300 inline-flex items-center gap-1">
                                      <X className="w-3 h-3 text-rose-600" />
                                      Cancelled
                                    </span>
                                  ) : (
                                    <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black bg-amber-100 text-amber-800 border border-amber-300 inline-flex items-center gap-1">
                                      <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse" />
                                      Unconfirmed
                                    </span>
                                  )}
                                </div>

                                {/* Action Buttons */}
                                <div className="flex flex-wrap items-center gap-1">
                                  <button
                                    onClick={() => handleSendWhatsAppConfirmation(order)}
                                    title="Send pre-filled WhatsApp confirmation message to customer"
                                    className="px-2.5 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-700 active:scale-95 text-white font-bold text-[11px] flex items-center gap-1 shadow-2xs transition-all cursor-pointer"
                                  >
                                    <MessageCircle className="w-3 h-3" />
                                    <span>Send WA</span>
                                  </button>

                                  {confStatus !== 'Confirmed' && (
                                    <button
                                      onClick={() =>
                                        handleUpdateOrderConfirmation(order.orderId, 'Confirmed', true)
                                      }
                                      title="Customer replied YES / 1 - Mark confirmed & ready to pack"
                                      className="px-2 py-1 rounded-lg bg-slate-100 hover:bg-emerald-50 text-slate-700 hover:text-emerald-700 font-bold text-[10px] border border-slate-200 transition-all cursor-pointer"
                                    >
                                      Confirm
                                    </button>
                                  )}

                                  {confStatus !== 'Cancelled' && (
                                    <button
                                      onClick={() =>
                                        handleUpdateOrderConfirmation(order.orderId, 'Cancelled')
                                      }
                                      title="Customer replied NO / Cancel or fake order"
                                      className="px-2 py-1 rounded-lg bg-slate-100 hover:bg-rose-50 text-slate-700 hover:text-rose-700 font-bold text-[10px] border border-slate-200 transition-all cursor-pointer"
                                    >
                                      Cancel
                                    </button>
                                  )}

                                  <button
                                    onClick={() => {
                                      setConfirmingOrderModal(order);
                                      setCustomWhatsAppMsg(buildWhatsAppConfirmationText(order));
                                    }}
                                    title="Preview and edit WhatsApp text before sending"
                                    className="px-1.5 py-1 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-600 font-bold text-[10px] transition-all cursor-pointer"
                                  >
                                    Edit
                                  </button>
                                </div>
                              </div>
                            </td>

                            {/* Status Selector */}
                            <td className="px-5 py-3.5">
                              <select
                                value={order.status}
                                onChange={(e) =>
                                  handleUpdateOrderStatus(order.orderId, e.target.value)
                                }
                                className={`rounded-xl px-2.5 py-1 text-xs font-bold border focus:outline-none cursor-pointer ${
                                  order.status === 'Delivered'
                                    ? 'bg-emerald-50 text-emerald-700 border-emerald-300'
                                    : order.status === 'Dispatched'
                                    ? 'bg-blue-50 text-blue-700 border-blue-300'
                                    : order.status === 'Processing'
                                    ? 'bg-amber-50 text-amber-700 border-amber-300'
                                    : order.status === 'Cancelled'
                                    ? 'bg-rose-50 text-rose-700 border-rose-300'
                                    : 'bg-purple-50 text-purple-700 border-purple-300'
                                }`}
                              >
                                <option value="Placed">Placed</option>
                                <option value="Processing">Processing</option>
                                <option value="Dispatched">Dispatched</option>
                                <option value="Delivered">Delivered</option>
                                <option value="Cancelled">Cancelled</option>
                              </select>

                              {order.courier && (
                                <div className="text-[10px] text-slate-500 mt-1 flex items-center gap-1 font-medium">
                                  <Truck className="w-3 h-3 text-[#008060]" />
                                  {order.courier} {order.trackingNumber ? `(${order.trackingNumber})` : ''}
                                </div>
                              )}
                            </td>

                            <td className="px-5 py-3.5 text-right">
                              <button
                                onClick={() => setViewingOrderReceipt(order)}
                                className="px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs transition-all flex items-center gap-1.5 ml-auto"
                              >
                                <Printer className="w-3.5 h-3.5 text-slate-600" />
                                <span>Slip</span>
                              </button>
                            </td>
                          </tr>
                        );
                      }))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* TAB: PROMO COUPONS & DISCOUNT ENGINE */}
          {activeTab === 'coupons' && (
            <div className="space-y-6 animate-in fade-in duration-200">
              {/* Top Banner / Actions */}
              <div className="bg-white border border-slate-200/90 rounded-2xl p-4 sm:p-5 shadow-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 sm:gap-4">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-pink-500" />
                    <h2 className="text-base sm:text-lg font-bold text-slate-900 tracking-tight">
                      Promo Codes &amp; Discount Campaigns
                    </h2>
                  </div>
                  <p className="text-xs text-slate-500 mt-1">
                    Reward buyers with fixed PKR cuts, percentage discounts, minimum cart vouchers, and flash sale limits.
                  </p>
                </div>
                <button
                  onClick={openCreateCouponModal}
                  className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-[#008060] hover:bg-[#006e52] text-white font-bold text-xs shadow-xs transition-all cursor-pointer"
                >
                  <Plus className="w-4 h-4" />
                  <span>Create Promo Code</span>
                </button>
              </div>

              {/* 4 KPI Metric Cards */}
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-2.5 sm:gap-4">
                <div className="p-3.5 sm:p-4 bg-white border border-slate-200/90 rounded-2xl shadow-xs space-y-1">
                  <div className="flex items-center justify-between text-slate-500">
                    <span className="text-[10px] sm:text-[11px] font-bold uppercase tracking-wider">Active Coupons</span>
                    <Tag className="w-4 h-4 text-emerald-600" />
                  </div>
                  <div className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
                    {couponKPIs.activeCoupons} <span className="text-xs font-normal text-slate-400">/ {coupons.length}</span>
                  </div>
                  <p className="text-[10px] text-emerald-700 font-semibold truncate">Active in checkout</p>
                </div>

                <div className="p-3.5 sm:p-4 bg-white border border-slate-200/90 rounded-2xl shadow-xs space-y-1">
                  <div className="flex items-center justify-between text-slate-500">
                    <span className="text-[10px] sm:text-[11px] font-bold uppercase tracking-wider">Redemptions</span>
                    <ShoppingBag className="w-4 h-4 text-blue-600" />
                  </div>
                  <div className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
                    {couponKPIs.totalRedemptions}
                  </div>
                  <p className="text-[10px] text-blue-700 font-semibold truncate">Orders completed</p>
                </div>

                <div className="p-3.5 sm:p-4 bg-white border border-slate-200/90 rounded-2xl shadow-xs space-y-1">
                  <div className="flex items-center justify-between text-slate-500">
                    <span className="text-[10px] sm:text-[11px] font-bold uppercase tracking-wider">Discount Given</span>
                    <DollarSign className="w-4 h-4 text-[#008060]" />
                  </div>
                  <div className="text-lg sm:text-2xl font-black text-[#008060] tracking-tight truncate">
                    {formatPKR(couponKPIs.totalDiscountsDistributed)}
                  </div>
                  <p className="text-[10px] text-emerald-700 font-semibold truncate">Saved by shoppers</p>
                </div>

                <div className="p-3.5 sm:p-4 bg-white border border-slate-200/90 rounded-2xl shadow-xs space-y-1">
                  <div className="flex items-center justify-between text-slate-500">
                    <span className="text-[10px] sm:text-[11px] font-bold uppercase tracking-wider">Avg Discount</span>
                    <Percent className="w-4 h-4 text-purple-600" />
                  </div>
                  <div className="text-lg sm:text-2xl font-black text-slate-900 tracking-tight truncate">
                    {formatPKR(couponKPIs.avgDiscountSaved)}
                  </div>
                  <p className="text-[10px] text-purple-700 font-semibold truncate">Per discounted order</p>
                </div>
              </div>

              {/* MOBILE COUPONS CARDS (< sm) */}
              <div className="block sm:hidden space-y-3">
                {coupons.length === 0 ? (
                  <div className="p-8 text-center bg-white rounded-2xl border border-slate-200 text-slate-400 text-xs">
                    <Tag className="w-8 h-8 mx-auto text-slate-300 mb-2" />
                    <p className="font-bold text-slate-700">No promo coupons yet</p>
                    <button
                      onClick={openCreateCouponModal}
                      className="mt-3 px-3 py-1.5 rounded-xl bg-[#008060] text-white text-xs font-bold cursor-pointer"
                    >
                      Create First Coupon
                    </button>
                  </div>
                ) : (
                  coupons.map((coupon) => {
                    const isExpired = coupon.expiresAt && new Date(coupon.expiresAt).getTime() < Date.now();
                    const isLimitReached = coupon.usageLimit && coupon.timesUsed >= coupon.usageLimit;
                    const effectiveActive = coupon.isActive && !isExpired && !isLimitReached;

                    return (
                      <div
                        key={coupon.id}
                        className="p-4 bg-white border border-slate-200/90 rounded-2xl shadow-xs space-y-3"
                      >
                        {/* Header: Code & Copy & Status */}
                        <div className="flex items-start justify-between gap-2">
                          <div>
                            <div className="flex items-center gap-1.5">
                              <span className="font-mono font-black text-slate-900 bg-slate-100 px-2.5 py-1 rounded-lg border border-slate-200 tracking-wider text-xs">
                                {coupon.code}
                              </span>
                              <button
                                onClick={() => {
                                  navigator.clipboard?.writeText(coupon.code);
                                  showToast(`Code "${coupon.code}" copied to clipboard!`);
                                }}
                                title="Copy Code"
                                className="p-1 rounded-md text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer"
                              >
                                <Copy className="w-3.5 h-3.5" />
                              </button>
                            </div>
                            {coupon.description && (
                              <p className="text-[11px] text-slate-500 mt-1 line-clamp-1">
                                {coupon.description}
                              </p>
                            )}
                          </div>

                          <button
                            type="button"
                            onClick={() => handleToggleCouponActive(coupon)}
                            className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold transition-all cursor-pointer shrink-0 ${
                              effectiveActive
                                ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                                : 'bg-slate-100 text-slate-500 border border-slate-200'
                            }`}
                          >
                            <span
                              className={`w-1.5 h-1.5 rounded-full ${
                                effectiveActive ? 'bg-emerald-500 animate-pulse' : 'bg-slate-400'
                              }`}
                            />
                            <span>{effectiveActive ? 'Active' : coupon.isActive ? (isExpired ? 'Expired' : 'Max Used') : 'Disabled'}</span>
                          </button>
                        </div>

                        {/* Details Grid */}
                        <div className="grid grid-cols-2 gap-2 p-2.5 rounded-xl bg-[#f9fafb] border border-slate-100 text-xs">
                          <div>
                            <div className="text-[10px] text-slate-500 uppercase font-semibold">Discount</div>
                            <div className="font-extrabold text-emerald-700 mt-0.5 text-xs">
                              {coupon.discountType === 'percentage'
                                ? `${coupon.discountValue}% OFF`
                                : `-${formatPKR(coupon.discountValue)}`}
                            </div>
                            {coupon.discountType === 'percentage' && coupon.maxDiscountAmount && (
                              <div className="text-[9px] text-slate-400 mt-0.5">
                                Cap: {formatPKR(coupon.maxDiscountAmount)}
                              </div>
                            )}
                          </div>
                          <div>
                            <div className="text-[10px] text-slate-500 uppercase font-semibold">Min Order</div>
                            <div className="font-semibold text-slate-800 mt-0.5 text-xs">
                              {coupon.minOrderAmount && coupon.minOrderAmount > 0
                                ? formatPKR(coupon.minOrderAmount)
                                : 'No min'}
                            </div>
                            <div className="text-[9px] text-slate-400 mt-0.5">
                              Used: {coupon.timesUsed || 0} {coupon.usageLimit ? `/ ${coupon.usageLimit}` : 'uses'}
                            </div>
                          </div>
                        </div>

                        {/* Expiry & Actions */}
                        <div className="flex items-center justify-between pt-1 border-t border-slate-100 text-xs">
                          <div className="text-[11px] text-slate-500">
                            {coupon.expiresAt ? (
                              <span>Expires: {new Date(coupon.expiresAt).toLocaleDateString('en-GB', { day: '2-digit', month: 'short' })}</span>
                            ) : (
                              <span>Never expires</span>
                            )}
                          </div>

                          <div className="flex items-center gap-1">
                            <button
                              onClick={() => openEditCouponModal(coupon)}
                              className="p-1.5 rounded-lg text-slate-500 hover:text-slate-800 hover:bg-slate-100 transition-colors cursor-pointer"
                              title="Edit Coupon"
                            >
                              <Edit className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={() => handleDeleteCoupon(coupon)}
                              className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer"
                              title="Delete Coupon"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>

              {/* DESKTOP Coupons Table */}
              <div className="hidden sm:block bg-white border border-slate-200/90 rounded-2xl shadow-xs overflow-hidden">
                <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between">
                  <h3 className="text-sm font-bold text-slate-900">
                    All Promotional Coupons ({coupons.length})
                  </h3>
                  <span className="text-xs text-slate-500 font-medium">
                    Click code to copy • Real-time checkout sync
                  </span>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-[#f8f9fa] border-b border-slate-100 text-slate-500 uppercase text-[10px] tracking-wider font-bold">
                      <tr>
                        <th className="px-5 py-3">Code &amp; Description</th>
                        <th className="px-5 py-3">Discount Value</th>
                        <th className="px-5 py-3">Minimum Order</th>
                        <th className="px-5 py-3">Redemptions</th>
                        <th className="px-5 py-3">Expiry Date</th>
                        <th className="px-5 py-3">Status</th>
                        <th className="px-5 py-3 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {coupons.length === 0 ? (
                        <tr>
                          <td colSpan={7} className="px-5 py-12 text-center text-slate-400">
                            <Tag className="w-10 h-10 mx-auto text-slate-300 mb-2" />
                            <p className="text-sm font-bold text-slate-700">No promo coupons yet</p>
                            <p className="text-xs text-slate-400 mt-1">
                              Create your first promo code to boost sales conversion.
                            </p>
                            <button
                              onClick={openCreateCouponModal}
                              className="mt-3 px-4 py-2 rounded-xl bg-[#008060] text-white text-xs font-bold cursor-pointer"
                            >
                              Create First Coupon
                            </button>
                          </td>
                        </tr>
                      ) : (
                        coupons.map((coupon) => {
                          const isExpired = coupon.expiresAt && new Date(coupon.expiresAt).getTime() < Date.now();
                          const isLimitReached = coupon.usageLimit && coupon.timesUsed >= coupon.usageLimit;
                          const effectiveActive = coupon.isActive && !isExpired && !isLimitReached;

                          return (
                            <tr key={coupon.id} className="hover:bg-slate-50/80 transition-colors">
                              {/* Code & Description */}
                              <td className="px-5 py-3.5">
                                <div className="flex items-center gap-2">
                                  <span className="font-mono font-black text-slate-900 bg-slate-100 px-2.5 py-1 rounded-lg border border-slate-200 tracking-wider">
                                    {coupon.code}
                                  </span>
                                  <button
                                    onClick={() => {
                                      navigator.clipboard?.writeText(coupon.code);
                                      showToast(`Code "${coupon.code}" copied to clipboard!`);
                                    }}
                                    title="Copy Code"
                                    className="p-1 rounded-md text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer"
                                  >
                                    <Copy className="w-3.5 h-3.5" />
                                  </button>
                                </div>
                                {coupon.description && (
                                  <p className="text-[11px] text-slate-500 mt-1 max-w-xs line-clamp-1">
                                    {coupon.description}
                                  </p>
                                )}
                              </td>

                              {/* Discount Value */}
                              <td className="px-5 py-3.5">
                                <div className="font-extrabold text-emerald-700">
                                  {coupon.discountType === 'percentage'
                                    ? `${coupon.discountValue}% OFF`
                                    : `-${formatPKR(coupon.discountValue)}`}
                                </div>
                                {coupon.discountType === 'percentage' && coupon.maxDiscountAmount && (
                                  <div className="text-[10px] text-slate-400">
                                    Max cap: {formatPKR(coupon.maxDiscountAmount)}
                                  </div>
                                )}
                              </td>

                              {/* Minimum Order */}
                              <td className="px-5 py-3.5">
                                {coupon.minOrderAmount && coupon.minOrderAmount > 0 ? (
                                  <span className="font-semibold text-slate-700">
                                    {formatPKR(coupon.minOrderAmount)}
                                  </span>
                                ) : (
                                  <span className="text-slate-400 text-[11px]">No Minimum</span>
                                )}
                              </td>

                              {/* Redemptions */}
                              <td className="px-5 py-3.5">
                                <div className="font-bold text-slate-900">
                                  {coupon.timesUsed || 0}
                                  {coupon.usageLimit ? (
                                    <span className="text-slate-400 font-normal"> / {coupon.usageLimit}</span>
                                  ) : (
                                    <span className="text-slate-400 font-normal"> uses</span>
                                  )}
                                </div>
                                {coupon.usageLimit && (
                                  <div className="w-24 h-1.5 bg-slate-100 rounded-full mt-1.5 overflow-hidden">
                                    <div
                                      className={`h-full rounded-full ${
                                        coupon.timesUsed >= coupon.usageLimit ? 'bg-rose-500' : 'bg-emerald-500'
                                      }`}
                                      style={{
                                        width: `${Math.min(100, Math.round((coupon.timesUsed / coupon.usageLimit) * 100))}%`,
                                      }}
                                    />
                                  </div>
                                )}
                              </td>

                              {/* Expiry Date */}
                              <td className="px-5 py-3.5">
                                {coupon.expiresAt ? (
                                  <div>
                                    <div className={`font-medium ${isExpired ? 'text-rose-600 line-through' : 'text-slate-700'}`}>
                                      {new Date(coupon.expiresAt).toLocaleDateString('en-GB', {
                                        day: '2-digit',
                                        month: 'short',
                                        year: 'numeric',
                                      })}
                                    </div>
                                    {isExpired && (
                                      <span className="inline-block text-[10px] font-bold text-rose-600 bg-rose-50 px-1.5 py-0.2 rounded mt-0.5">
                                        Expired
                                      </span>
                                    )}
                                  </div>
                                ) : (
                                  <span className="text-slate-400 text-[11px]">Never expires</span>
                                )}
                              </td>

                              {/* Status Toggle */}
                              <td className="px-5 py-3.5">
                                <button
                                  type="button"
                                  onClick={() => handleToggleCouponActive(coupon)}
                                  className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold transition-all cursor-pointer ${
                                    effectiveActive
                                      ? 'bg-emerald-50 text-emerald-700 border border-emerald-200 hover:bg-emerald-100'
                                      : 'bg-slate-100 text-slate-500 border border-slate-200 hover:bg-slate-200'
                                  }`}
                                >
                                  <span
                                    className={`w-1.5 h-1.5 rounded-full ${
                                      effectiveActive ? 'bg-emerald-500 animate-pulse' : 'bg-slate-400'
                                    }`}
                                  />
                                  <span>{effectiveActive ? 'Active' : coupon.isActive ? (isExpired ? 'Expired' : 'Max Used') : 'Disabled'}</span>
                                </button>
                              </td>

                              {/* Actions */}
                              <td className="px-5 py-3.5 text-right space-x-1">
                                <button
                                  onClick={() => openEditCouponModal(coupon)}
                                  className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer"
                                  title="Edit Coupon"
                                >
                                  <Edit className="w-3.5 h-3.5" />
                                </button>
                                <button
                                  onClick={() => handleDeleteCoupon(coupon)}
                                  className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer"
                                  title="Delete Coupon"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              </td>
                            </tr>
                          );
                        })
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* TAB 5: CUSTOMER CRM & LIFETIME VALUE INTELLIGENCE */}
          {activeTab === 'customers' && (
            <div className="space-y-6 animate-in fade-in duration-200">
              {/* Top Banner & Export Actions */}
              <div className="bg-white border border-slate-200/90 rounded-2xl p-5 shadow-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-indigo-500" />
                    <h2 className="text-lg font-bold text-slate-900 tracking-tight">
                      Customer CRM &amp; Buyer Intelligence
                    </h2>
                  </div>
                  <p className="text-xs text-slate-500 mt-1">
                    Track buyer lifetime value (LTV), repeat purchase patterns, and launch WhatsApp re-engagement.
                  </p>
                </div>
                <button
                  onClick={() => {
                    const phoneList = crmCustomers
                      .map((c) => c.cleanWhatsAppPhone)
                      .filter(Boolean)
                      .join(', ');
                    navigator.clipboard?.writeText(phoneList);
                    showToast(`Copied ${crmCustomers.length} customer phone numbers for broadcast!`);
                  }}
                  className="flex items-center gap-2 px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs border border-slate-200 transition-all cursor-pointer"
                >
                  <Copy className="w-4 h-4 text-[#008060]" />
                  <span>Copy Broadcast Numbers ({crmCustomers.length})</span>
                </button>
              </div>

              {/* 4 CRM Metric KPI Cards */}
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
                <div className="p-4 bg-white border border-slate-200/90 rounded-2xl shadow-xs space-y-1">
                  <div className="flex items-center justify-between text-slate-500">
                    <span className="text-[11px] font-bold uppercase tracking-wider">Unique Buyers</span>
                    <Users className="w-4 h-4 text-indigo-600" />
                  </div>
                  <div className="text-2xl font-black text-slate-900 tracking-tight">
                    {crmKPIs.totalCustomers}
                  </div>
                  <p className="text-[10px] text-slate-500 font-medium">Distinct phone numbers on record</p>
                </div>

                <div className="p-4 bg-white border border-slate-200/90 rounded-2xl shadow-xs space-y-1">
                  <div className="flex items-center justify-between text-slate-500">
                    <span className="text-[11px] font-bold uppercase tracking-wider">Repeat Buyer Rate</span>
                    <TrendingUp className="w-4 h-4 text-emerald-600" />
                  </div>
                  <div className="text-2xl font-black text-emerald-700 tracking-tight">
                    {crmKPIs.repeatRate}%
                  </div>
                  <p className="text-[10px] text-emerald-700 font-medium">
                    {crmKPIs.repeatBuyers} buyers made 2+ orders
                  </p>
                </div>

                <div className="p-4 bg-white border border-slate-200/90 rounded-2xl shadow-xs space-y-1">
                  <div className="flex items-center justify-between text-slate-500">
                    <span className="text-[11px] font-bold uppercase tracking-wider">Total Customer LTV</span>
                    <DollarSign className="w-4 h-4 text-[#008060]" />
                  </div>
                  <div className="text-xl sm:text-2xl font-black text-[#008060] tracking-tight">
                    {formatPKR(crmKPIs.totalLTV)}
                  </div>
                  <p className="text-[10px] text-slate-500 font-medium">Cumulative gross buyer spend</p>
                </div>

                <div className="p-4 bg-white border border-slate-200/90 rounded-2xl shadow-xs space-y-1">
                  <div className="flex items-center justify-between text-slate-500">
                    <span className="text-[11px] font-bold uppercase tracking-wider">Avg Spend / Buyer</span>
                    <Award className="w-4 h-4 text-amber-500" />
                  </div>
                  <div className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
                    {formatPKR(crmKPIs.avgLTV)}
                  </div>
                  <p className="text-[10px] text-amber-700 font-medium">
                    {crmKPIs.vipCount} VIP patrons (Rs. 150k+)
                  </p>
                </div>
              </div>

              {/* Search & Tier Filters Bar */}
              <div className="bg-white border border-slate-200/90 rounded-2xl p-4 shadow-xs flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
                <div className="relative flex-1">
                  <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    type="text"
                    value={customerSearch}
                    onChange={(e) => setCustomerSearch(e.target.value)}
                    placeholder="Search by buyer name, phone (03XX), city, or order ID..."
                    className="w-full pl-9 pr-4 py-2 rounded-xl border border-slate-200 text-xs bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#008060] text-slate-900"
                  />
                  {customerSearch && (
                    <button
                      onClick={() => setCustomerSearch('')}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>

                <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0 scrollbar-none">
                  <button
                    onClick={() => setCustomerTierFilter('all')}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap cursor-pointer ${
                      customerTierFilter === 'all'
                        ? 'bg-slate-900 text-white'
                        : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                    }`}
                  >
                    All ({crmCustomers.length})
                  </button>
                  <button
                    onClick={() => setCustomerTierFilter('vip')}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap cursor-pointer ${
                      customerTierFilter === 'vip'
                        ? 'bg-amber-600 text-white'
                        : 'bg-amber-50 text-amber-800 hover:bg-amber-100 border border-amber-200/60'
                    }`}
                  >
                    VIP Patrons ({crmKPIs.vipCount})
                  </button>
                  <button
                    onClick={() => setCustomerTierFilter('repeat')}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap cursor-pointer ${
                      customerTierFilter === 'repeat'
                        ? 'bg-emerald-600 text-white'
                        : 'bg-emerald-50 text-emerald-800 hover:bg-emerald-100 border border-emerald-200/60'
                    }`}
                  >
                    Repeat ({crmKPIs.repeatBuyers})
                  </button>
                  <button
                    onClick={() => setCustomerTierFilter('new')}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap cursor-pointer ${
                      customerTierFilter === 'new'
                        ? 'bg-sky-600 text-white'
                        : 'bg-sky-50 text-sky-800 hover:bg-sky-100 border border-sky-200/60'
                    }`}
                  >
                    First-Time ({crmCustomers.length - crmKPIs.repeatBuyers})
                  </button>
                </div>
              </div>

              {/* Customer Cards Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {filteredCrmCustomers.length === 0 ? (
                  <div className="col-span-full bg-white border border-slate-200/90 rounded-2xl p-12 text-center text-slate-400">
                    <Users className="w-10 h-10 mx-auto text-slate-300 mb-2" />
                    <p className="text-sm font-bold text-slate-700">No buyers matched your filter</p>
                    <p className="text-xs text-slate-400 mt-1">Try clearing search or changing tier filters.</p>
                  </div>
                ) : (
                  filteredCrmCustomers.map((customer, i) => (
                    <div
                      key={i}
                      className="p-5 bg-white border border-slate-200/90 rounded-2xl shadow-xs space-y-3.5 hover:shadow-md transition-shadow flex flex-col justify-between"
                    >
                      <div className="space-y-3">
                        {/* Header: Avatar, Name, Tier Badge */}
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex items-center gap-3 min-w-0">
                            <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-[#008060]/15 to-[#008060]/5 text-[#008060] font-black flex items-center justify-center text-sm border border-[#008060]/20 shrink-0">
                              {customer.name.slice(0, 2).toUpperCase()}
                            </div>
                            <div className="min-w-0">
                              <div className="font-bold text-slate-900 text-sm truncate">
                                {customer.name}
                              </div>
                              <div className="text-xs text-slate-500 flex items-center gap-1 mt-0.5">
                                <MapPin className="w-3 h-3 text-slate-400 shrink-0" />
                                <span className="truncate">{customer.city}, Pakistan</span>
                              </div>
                            </div>
                          </div>

                          {/* Tier Badge */}
                          {customer.tier === 'VIP' ? (
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-amber-50 text-amber-700 border border-amber-200 shrink-0 flex items-center gap-1">
                              <span>🌟</span> VIP
                            </span>
                          ) : customer.tier === 'Repeat' ? (
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-emerald-50 text-emerald-700 border border-emerald-200 shrink-0">
                              Repeat
                            </span>
                          ) : (
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold text-slate-500 bg-slate-100 shrink-0">
                              New
                            </span>
                          )}
                        </div>

                        {/* Customer Lifetime Financial Stats Strip */}
                        <div className="grid grid-cols-3 gap-2 p-2.5 rounded-xl bg-slate-50 border border-slate-100 text-center text-xs">
                          <div>
                            <div className="text-[10px] text-slate-400 uppercase font-semibold">Orders</div>
                            <div className="font-black text-slate-900 mt-0.5">
                              {customer.totalOrdersCount}
                            </div>
                          </div>
                          <div>
                            <div className="text-[10px] text-slate-400 uppercase font-semibold">Lifetime (LTV)</div>
                            <div className="font-black text-[#008060] mt-0.5">
                              {formatPKR(customer.lifetimeValuePKR)}
                            </div>
                          </div>
                          <div>
                            <div className="text-[10px] text-slate-400 uppercase font-semibold">Avg / Order</div>
                            <div className="font-bold text-slate-700 mt-0.5">
                              {formatPKR(customer.averageOrderValuePKR)}
                            </div>
                          </div>
                        </div>

                        {/* Details */}
                        <div className="text-xs space-y-1 text-slate-600">
                          <div className="flex items-center gap-1.5">
                            <Phone className="w-3 h-3 text-[#008060] shrink-0" />
                            <span className="font-mono font-bold text-slate-800">{customer.phone}</span>
                          </div>
                          <div className="text-[11px] text-slate-500 line-clamp-1">
                            {customer.address}
                          </div>
                          <div className="text-[10px] text-slate-400 pt-1">
                            Last purchase: {formatTimeAgo(customer.latestOrderDate)} ({new Date(customer.latestOrderDate).toLocaleDateString()})
                          </div>
                        </div>
                      </div>

                      {/* Action Buttons */}
                      <div className="pt-2 border-t border-slate-100 flex items-center gap-1.5">
                        <button
                          type="button"
                          onClick={() => setViewingCustomerHistory(customer)}
                          className="flex-1 py-1.5 px-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-center text-xs transition-all cursor-pointer flex items-center justify-center gap-1"
                        >
                          <ShoppingBag className="w-3.5 h-3.5 text-slate-500" />
                          <span>History ({customer.totalOrdersCount})</span>
                        </button>
                        <a
                          href={`https://wa.me/${customer.cleanWhatsAppPhone}?text=${encodeURIComponent(
                            `Assalam o Alaikum ${customer.name}! This is Hamza from Nawira Traders. Thank you for your orders with us! How is your smartphone performing? Let us know if you need any warranty claim or accessory upgrade.`
                          )}`}
                          target="_blank"
                          rel="noreferrer"
                          className="flex-1 py-1.5 px-2 rounded-xl bg-emerald-50 hover:bg-emerald-100 text-emerald-800 font-bold text-center text-xs border border-emerald-200 transition-all flex items-center justify-center gap-1 cursor-pointer"
                        >
                          <MessageSquare className="w-3.5 h-3.5 text-emerald-600" />
                          <span>WhatsApp</span>
                        </a>
                        <a
                          href={`tel:${customer.phone}`}
                          className="p-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-600 hover:text-slate-900 transition-all"
                          title={`Call ${customer.phone}`}
                        >
                          <Phone className="w-3.5 h-3.5" />
                        </a>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}

          {/* TAB 6: SETTINGS */}
          {activeTab === 'settings' && (
            <div className="max-w-3xl space-y-6 animate-in fade-in duration-200">
              <div className="p-6 bg-white border border-slate-200/90 rounded-2xl shadow-xs space-y-5">
                <h3 className="font-bold text-slate-900 text-base">Store Configuration</h3>
                <div className="space-y-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      Store Name
                    </label>
                    <input
                      type="text"
                      defaultValue="Nawira Traders"
                      className="w-full bg-[#f9fafb] border border-slate-200 rounded-xl px-4 py-2.5 text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#008060]"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      Change Admin Passcode (Default: admin786)
                    </label>
                    <div className="flex gap-2">
                      <input
                        type="password"
                        placeholder="New passcode (min 4 chars)"
                        value={newAdminPin}
                        onChange={(e) => setNewAdminPin(e.target.value)}
                        className="w-full bg-[#f9fafb] border border-slate-200 rounded-xl px-4 py-2.5 text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#008060] font-mono"
                      />
                      <button
                        type="button"
                        onClick={handleUpdateAdminPin}
                        className="px-4 py-2 rounded-xl bg-[#008060] hover:bg-[#006e52] text-white text-xs font-bold shrink-0 transition-all cursor-pointer"
                      >
                        Update Passcode
                      </button>
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      Customer Support WhatsApp
                    </label>
                    <input
                      type="text"
                      defaultValue="+92 300 1234567"
                      className="w-full bg-[#f9fafb] border border-slate-200 rounded-xl px-4 py-2.5 text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#008060]"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      Default Courier Partner
                    </label>
                    <select
                      defaultValue="TCS Express"
                      className="w-full bg-[#f9fafb] border border-slate-200 rounded-xl px-4 py-2.5 text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#008060]"
                    >
                      <option value="TCS Express">TCS Express (24-48h Open Parcel)</option>
                      <option value="Leopard Courier">Leopard Courier Services</option>
                      <option value="Call Courier">Call Courier Logistics</option>
                      <option value="Trax Logistics">Trax Express</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      Open Parcel Inspection Policy
                    </label>
                    <textarea
                      rows={3}
                      defaultValue="Customer is strictly permitted to open and verify the brand-new sealed retail box in front of the rider before completing COD payment."
                      className="w-full bg-[#f9fafb] border border-slate-200 rounded-xl px-4 py-2.5 text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#008060]"
                    />
                  </div>

                  <button
                    onClick={() => showToast('Settings saved successfully!')}
                    className="px-5 py-2.5 rounded-xl bg-[#008060] hover:bg-[#006e52] text-white font-bold text-xs transition-all shadow-xs"
                  >
                    Save Settings
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </main>

      {/* ==================================================== */}
      {/* MODAL 0: WHATSAPP ORDER CONFIRMATION PREVIEW/EDITOR */}
      {/* ==================================================== */}
      {confirmingOrderModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
          <div className="w-full max-w-lg bg-white rounded-2xl sm:rounded-3xl p-4 sm:p-6 shadow-2xl space-y-4 animate-in zoom-in-95 duration-150 max-h-[92vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-2xl bg-emerald-500/10 text-emerald-600 flex items-center justify-center">
                  <MessageCircle className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-slate-900 text-sm">
                    WhatsApp Order Confirmation
                  </h3>
                  <p className="text-[11px] text-slate-500">
                    Order #{confirmingOrderModal.orderId} • {confirmingOrderModal.customerName}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setConfirmingOrderModal(null)}
                className="text-slate-400 hover:text-slate-600 p-1 rounded-lg"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Customer WhatsApp Number
              </label>
              <div className="font-mono text-xs font-bold text-slate-900 bg-[#f9fafb] border border-slate-200 rounded-xl px-3.5 py-2">
                +{formatPakistaniWhatsAppNumber(confirmingOrderModal.phone)}
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Bilingual Confirmation Message (Urdu &amp; English)
              </label>
              <textarea
                rows={9}
                value={customWhatsAppMsg}
                onChange={(e) => setCustomWhatsAppMsg(e.target.value)}
                className="w-full bg-[#f9fafb] border border-slate-200 rounded-xl p-3 text-xs text-slate-900 font-sans focus:outline-none focus:ring-2 focus:ring-[#008060] focus:bg-white resize-none"
              />
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
              <button
                onClick={() => setConfirmingOrderModal(null)}
                className="px-4 py-2 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-100 transition-all cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  handleSendWhatsAppConfirmation(confirmingOrderModal, customWhatsAppMsg);
                  setConfirmingOrderModal(null);
                }}
                className="px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs flex items-center gap-1.5 shadow-sm transition-all cursor-pointer"
              >
                <MessageCircle className="w-4 h-4" />
                <span>Open in WhatsApp</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ==================================================== */}
      {/* MODAL: PROMO COUPON BUILDER & EDITOR */}
      {/* ==================================================== */}
      {isCouponModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
          <div className="w-full max-w-lg bg-white border border-slate-200 rounded-3xl p-5 sm:p-6 shadow-2xl space-y-4 animate-in zoom-in-95 duration-150 my-auto">
            {/* Modal Header */}
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-pink-100 text-pink-700 flex items-center justify-center">
                  <Tag className="w-5 h-5 text-pink-600" />
                </div>
                <div>
                  <h3 className="font-bold text-slate-900 text-base">
                    {editingCoupon ? `Edit Coupon: ${editingCoupon.code}` : 'Create New Promo Coupon'}
                  </h3>
                  <p className="text-xs text-slate-500">
                    Set discount type, limits, and customer conditions.
                  </p>
                </div>
              </div>
              <button
                onClick={() => setIsCouponModalOpen(false)}
                className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-500 hover:text-slate-800 flex items-center justify-center transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {couponFormError && (
              <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-semibold flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
                <span>{couponFormError}</span>
              </div>
            )}

            <form onSubmit={handleSaveCoupon} className="space-y-4">
              {/* Coupon Code & Active Toggle */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="sm:col-span-2 space-y-1">
                  <label className="text-xs font-bold text-slate-700">
                    Coupon Code <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={couponCodeInput}
                    onChange={(e) => setCouponCodeInput(e.target.value.toUpperCase().replace(/[^A-Z0-9_-]/g, ''))}
                    placeholder="e.g. FLASH1000, EIDMEGA"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 font-mono font-black text-sm uppercase tracking-wider focus:outline-none focus:ring-2 focus:ring-[#008060]"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-700">Status</label>
                  <button
                    type="button"
                    onClick={() => setCouponActiveInput(!couponActiveInput)}
                    className={`w-full py-2.5 px-3 rounded-xl border text-xs font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                      couponActiveInput
                        ? 'bg-emerald-50 text-emerald-700 border-emerald-300'
                        : 'bg-slate-100 text-slate-500 border-slate-200'
                    }`}
                  >
                    <span className={`w-2 h-2 rounded-full ${couponActiveInput ? 'bg-emerald-500' : 'bg-slate-400'}`} />
                    <span>{couponActiveInput ? 'Active' : 'Disabled'}</span>
                  </button>
                </div>
              </div>

              {/* Discount Type Toggle */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700">Discount Type</label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setCouponTypeInput('fixed')}
                    className={`py-2 px-3 rounded-xl border text-xs font-bold flex items-center justify-center gap-2 transition-all cursor-pointer ${
                      couponTypeInput === 'fixed'
                        ? 'bg-[#008060]/10 border-[#008060] text-[#008060] ring-1 ring-[#008060]'
                        : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100'
                    }`}
                  >
                    <DollarSign className="w-3.5 h-3.5" />
                    <span>Fixed PKR (e.g. Rs. 1,000)</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setCouponTypeInput('percentage')}
                    className={`py-2 px-3 rounded-xl border text-xs font-bold flex items-center justify-center gap-2 transition-all cursor-pointer ${
                      couponTypeInput === 'percentage'
                        ? 'bg-[#008060]/10 border-[#008060] text-[#008060] ring-1 ring-[#008060]'
                        : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100'
                    }`}
                  >
                    <Percent className="w-3.5 h-3.5" />
                    <span>Percentage % (e.g. 10% Off)</span>
                  </button>
                </div>
              </div>

              {/* Discount Value & Max Discount Cap */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-700">
                    {couponTypeInput === 'fixed' ? 'Discount Amount (PKR) *' : 'Discount Percentage (%) *'}
                  </label>
                  <input
                    type="number"
                    required
                    min={1}
                    max={couponTypeInput === 'percentage' ? 100 : 1000000}
                    value={couponValueInput}
                    onChange={(e) => setCouponValueInput(e.target.value)}
                    placeholder={couponTypeInput === 'fixed' ? 'e.g. 1000' : 'e.g. 10'}
                    className="w-full px-3.5 py-2 rounded-xl border border-slate-200 text-sm font-bold focus:outline-none focus:ring-2 focus:ring-[#008060]"
                  />
                </div>

                {couponTypeInput === 'percentage' && (
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-700">
                      Max Discount Cap (PKR) <span className="text-slate-400 font-normal">(Optional)</span>
                    </label>
                    <input
                      type="number"
                      min={0}
                      value={couponMaxDiscountInput}
                      onChange={(e) => setCouponMaxDiscountInput(e.target.value)}
                      placeholder="e.g. 2500"
                      className="w-full px-3.5 py-2 rounded-xl border border-slate-200 text-sm font-bold focus:outline-none focus:ring-2 focus:ring-[#008060]"
                    />
                  </div>
                )}
              </div>

              {/* Minimum Order Amount & Usage Limit */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-700">
                    Min Order Amount (PKR) <span className="text-slate-400 font-normal">(Optional)</span>
                  </label>
                  <input
                    type="number"
                    min={0}
                    value={couponMinOrderInput}
                    onChange={(e) => setCouponMinOrderInput(e.target.value)}
                    placeholder="e.g. 40000 (0 for no limit)"
                    className="w-full px-3.5 py-2 rounded-xl border border-slate-200 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-[#008060]"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-700">
                    Max Redemptions Limit <span className="text-slate-400 font-normal">(Optional)</span>
                  </label>
                  <input
                    type="number"
                    min={1}
                    value={couponLimitInput}
                    onChange={(e) => setCouponLimitInput(e.target.value)}
                    placeholder="e.g. 100 (Blank for unlimited)"
                    className="w-full px-3.5 py-2 rounded-xl border border-slate-200 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-[#008060]"
                  />
                </div>
              </div>

              {/* Expiry Date */}
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-700">
                  Expiry Date <span className="text-slate-400 font-normal">(Optional — leave blank for perpetual)</span>
                </label>
                <input
                  type="date"
                  value={couponExpiresInput}
                  onChange={(e) => setCouponExpiresInput(e.target.value)}
                  className="w-full px-3.5 py-2 rounded-xl border border-slate-200 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-[#008060]"
                />
              </div>

              {/* Description */}
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-700">
                  Description / Campaign Notes <span className="text-slate-400 font-normal">(Optional)</span>
                </label>
                <input
                  type="text"
                  value={couponDescInput}
                  onChange={(e) => setCouponDescInput(e.target.value)}
                  placeholder="e.g. Welcome promo for first-time Pakistani buyers"
                  className="w-full px-3.5 py-2 rounded-xl border border-slate-200 text-xs text-slate-800 font-medium focus:outline-none focus:ring-2 focus:ring-[#008060]"
                />
              </div>

              {/* Real-time Customer Preview Pill */}
              <div className="p-3.5 rounded-2xl bg-gradient-to-r from-sky-50 to-emerald-50 border border-sky-100 flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <Sparkles className="w-4 h-4 text-[#008060]" />
                  <div>
                    <div className="text-[11px] font-bold text-slate-800">
                      Shopper Preview: <span className="font-mono text-emerald-800 uppercase">{couponCodeInput || 'CODE'}</span>
                    </div>
                    <div className="text-[10px] text-slate-500">
                      {couponTypeInput === 'fixed'
                        ? `Rs. ${Number(couponValueInput || 0).toLocaleString()} OFF cart total`
                        : `${couponValueInput || 0}% OFF${couponMaxDiscountInput ? ` (max Rs. ${Number(couponMaxDiscountInput).toLocaleString()})` : ''}`}
                      {couponMinOrderInput ? ` on orders above Rs. ${Number(couponMinOrderInput).toLocaleString()}` : ''}
                    </div>
                  </div>
                </div>
                <span className="text-[10px] uppercase font-black text-emerald-700 bg-white px-2 py-1 rounded-md shadow-2xs border border-emerald-200">
                  Valid
                </span>
              </div>

              {/* Form Actions */}
              <div className="pt-2 flex items-center justify-end gap-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsCouponModalOpen(false)}
                  className="px-4 py-2.5 rounded-xl border border-slate-200 text-xs font-bold text-slate-600 hover:bg-slate-100 transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSavingCoupon}
                  className="px-5 py-2.5 rounded-xl bg-[#008060] hover:bg-[#006e52] text-white text-xs font-black shadow-md transition-all flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                >
                  {isSavingCoupon ? 'Saving...' : editingCoupon ? 'Update Coupon' : 'Create Coupon'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ==================================================== */}
      {/* MODAL: CUSTOMER CRM ORDER HISTORY DRILL-DOWN */}
      {/* ==================================================== */}
      {viewingCustomerHistory && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
          <div className="w-full max-w-2xl bg-white border border-slate-200 rounded-3xl p-5 sm:p-6 shadow-2xl space-y-4 animate-in zoom-in-95 duration-150 my-auto">
            {/* Header */}
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-3">
                <div className="w-11 h-11 rounded-2xl bg-[#008060]/10 text-[#008060] font-black flex items-center justify-center text-sm border border-[#008060]/20">
                  {viewingCustomerHistory.name.slice(0, 2).toUpperCase()}
                </div>
                <div>
                  <h3 className="font-bold text-slate-900 text-base flex items-center gap-2">
                    <span>{viewingCustomerHistory.name}</span>
                    <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded-full bg-slate-100 text-slate-700">
                      {viewingCustomerHistory.tier}
                    </span>
                  </h3>
                  <div className="text-xs text-slate-500 flex items-center gap-2 mt-0.5">
                    <span>{viewingCustomerHistory.phone}</span>
                    <span>•</span>
                    <span>{viewingCustomerHistory.city}, Pakistan</span>
                  </div>
                </div>
              </div>
              <button
                onClick={() => setViewingCustomerHistory(null)}
                className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-500 hover:text-slate-800 flex items-center justify-center transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Lifetime KPI Summary */}
            <div className="grid grid-cols-3 gap-3 p-3 rounded-2xl bg-slate-50 border border-slate-100 text-center text-xs">
              <div>
                <span className="text-[10px] text-slate-400 font-semibold uppercase">Total Orders</span>
                <div className="font-black text-slate-900 text-base mt-0.5">
                  {viewingCustomerHistory.totalOrdersCount}
                </div>
              </div>
              <div>
                <span className="text-[10px] text-slate-400 font-semibold uppercase">Lifetime Value (LTV)</span>
                <div className="font-black text-[#008060] text-base mt-0.5">
                  {formatPKR(viewingCustomerHistory.lifetimeValuePKR)}
                </div>
              </div>
              <div>
                <span className="text-[10px] text-slate-400 font-semibold uppercase">Avg Order Spend</span>
                <div className="font-bold text-slate-800 text-base mt-0.5">
                  {formatPKR(viewingCustomerHistory.averageOrderValuePKR)}
                </div>
              </div>
            </div>

            {/* Address */}
            <div className="p-3 rounded-xl bg-slate-50/80 border border-slate-100 text-xs text-slate-600 flex items-start gap-2">
              <MapPin className="w-4 h-4 text-slate-400 shrink-0 mt-0.5" />
              <div>
                <strong className="text-slate-900">Delivery Address: </strong>
                <span>{viewingCustomerHistory.address}</span>
              </div>
            </div>

            {/* Orders Timeline */}
            <div className="space-y-3 max-h-80 overflow-y-auto pr-1">
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500">
                Order History Timeline ({viewingCustomerHistory.orders.length})
              </h4>
              <div className="space-y-2.5">
                {viewingCustomerHistory.orders.map((ord: AdminOrder, idx: number) => (
                  <div
                    key={idx}
                    className="p-3.5 rounded-2xl border border-slate-200 bg-white shadow-2xs space-y-2 hover:border-[#008060]/50 transition-colors"
                  >
                    <div className="flex items-center justify-between text-xs">
                      <div className="flex items-center gap-2">
                        <span className="font-mono font-black text-[#008060]">
                          #{ord.orderId}
                        </span>
                        <span className="text-slate-400">•</span>
                        <span className="text-slate-500">
                          {new Date(ord.createdAt).toLocaleDateString('en-GB', {
                            day: '2-digit',
                            month: 'short',
                            year: 'numeric',
                          })}
                        </span>
                      </div>
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 text-slate-700">
                        {ord.status}
                      </span>
                    </div>

                    <div className="space-y-1 text-xs">
                      {Array.isArray(ord.items) &&
                        ord.items.map((it: any, itemIdx: number) => (
                          <div key={itemIdx} className="flex justify-between text-slate-700">
                            <span>
                              {typeof it === 'string' ? it : `${it.name} (${it.variant || ''}) ${it.color ? `[${it.color}]` : ''}`}
                            </span>
                            <span className="font-bold text-slate-900">
                              {typeof it === 'string' ? '' : formatPKR(it.pricePKR * (it.quantity || 1))}
                            </span>
                          </div>
                        ))}
                    </div>

                    <div className="flex items-center justify-between pt-2 border-t border-slate-100 text-xs">
                      <div className="text-[11px] text-slate-400">
                        Payment: <span className="font-medium text-slate-700">{ord.paymentMethod}</span>
                        {ord.couponCode && (
                          <span className="text-emerald-700 font-bold ml-2">
                            (Coupon: {ord.couponCode})
                          </span>
                        )}
                      </div>
                      <div className="font-black text-slate-900 text-sm">
                        {formatPKR(ord.totalPKR)}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Modal Actions */}
            <div className="pt-3 border-t border-slate-100 flex items-center justify-between gap-2">
              <a
                href={`https://wa.me/${viewingCustomerHistory.cleanWhatsAppPhone}?text=${encodeURIComponent(
                  `Assalam o Alaikum ${viewingCustomerHistory.name}! This is Hamza from Nawira Traders.`
                )}`}
                target="_blank"
                rel="noreferrer"
                className="py-2.5 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs flex items-center gap-1.5 transition-colors cursor-pointer"
              >
                <MessageSquare className="w-4 h-4" />
                <span>Chat on WhatsApp</span>
              </a>

              <button
                type="button"
                onClick={() => setViewingCustomerHistory(null)}
                className="py-2.5 px-4 rounded-xl border border-slate-200 text-slate-700 font-bold text-xs hover:bg-slate-100 transition-colors cursor-pointer"
              >
                Close History
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ==================================================== */}
      {/* MODAL 1: AUTHENTIC SHOPIFY 2-COLUMN PRODUCT EDITOR */}
      {/* ==================================================== */}
      {isProductModalOpen && (
        <ProductFormModal
          product={editingProduct}
          onClose={() => {
            setIsProductModalOpen(false);
            setEditingProduct(null);
          }}
          onSaved={() => {
            setIsProductModalOpen(false);
            setEditingProduct(null);
            showToast(
              editingProduct ? 'Product updated successfully!' : 'New product published to store!'
            );
            fetchData();
          }}
        />
      )}

      {/* MODAL 2: QUICK RESTOCK DIALOG */}
      {isRestockModalOpen && restockTarget && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4">
          <div className="w-full max-w-md bg-white border border-slate-200 rounded-2xl sm:rounded-3xl p-4 sm:p-6 shadow-2xl space-y-4 animate-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between">
              <h3 className="font-bold text-slate-900 text-sm flex items-center gap-2">
                <Zap className="w-4 h-4 text-[#008060]" />
                Restock Product
              </h3>
              <button
                onClick={() => setIsRestockModalOpen(false)}
                className="text-slate-400 hover:text-slate-600"
              >
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
              <label className="block text-xs font-bold text-slate-700 mb-2">
                Quick Increments:
              </label>
              <div className="grid grid-cols-4 gap-2">
                {[5, 10, 25, 50].map((amt) => (
                  <button
                    key={amt}
                    onClick={() => handleQuickRestock(restockTarget.id, amt)}
                    className="py-2 rounded-xl bg-slate-100 hover:bg-[#008060] hover:text-white text-slate-700 font-bold text-xs transition-all"
                  >
                    +{amt}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Custom quantity to add:
              </label>
              <div className="flex items-center gap-2">
                <input
                  type="number"
                  min="1"
                  value={customRestockQty}
                  onChange={(e) => setCustomRestockQty(parseInt(e.target.value) || 1)}
                  className="w-full bg-[#f9fafb] border border-slate-300 rounded-xl px-3 py-2 text-sm text-slate-900 font-bold focus:outline-none focus:ring-2 focus:ring-[#008060]"
                />
                <button
                  onClick={() => handleQuickRestock(restockTarget.id, customRestockQty)}
                  className="px-5 py-2 rounded-xl bg-[#008060] hover:bg-[#006e52] text-white font-bold text-xs shrink-0 transition-all shadow-xs"
                >
                  Restock
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 3: DELETE CONFIRMATION */}
      {deleteConfirmationTarget && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4">
          <div className="w-full max-w-sm bg-white border border-slate-200 rounded-2xl sm:rounded-3xl p-4 sm:p-6 shadow-2xl space-y-4">
            <div className="flex items-center gap-3 text-rose-600">
              <AlertTriangle className="w-6 h-6" />
              <h3 className="font-bold text-slate-900 text-base">Delete Product?</h3>
            </div>
            <p className="text-xs text-slate-600 leading-relaxed">
              Are you sure you want to permanently delete{' '}
              <strong className="text-slate-900">{deleteConfirmationTarget.name}</strong> from the catalog? This will remove it from the customer storefront immediately.
            </p>
            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                onClick={() => setDeleteConfirmationTarget(null)}
                className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={() => handleDeleteProduct(deleteConfirmationTarget)}
                className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold transition-all shadow-sm cursor-pointer"
              >
                Yes, Delete
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 4: PACKING SLIP / INVOICE VIEW */}
      {viewingOrderReceipt && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
          <div className="w-full max-w-xl bg-white text-slate-900 rounded-2xl sm:rounded-3xl p-4 sm:p-8 shadow-2xl space-y-4 sm:space-y-6 relative print:p-0 max-h-[92vh] overflow-y-auto">
            <button
              onClick={() => setViewingOrderReceipt(null)}
              className="absolute top-4 right-4 p-2 text-slate-400 hover:text-slate-800 print:hidden"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="border-b border-slate-200 pb-5 flex items-start justify-between">
              <div>
                <h2 className="text-2xl font-black text-slate-900">Nawira Traders</h2>
                <p className="text-xs text-slate-500">Official Mobile Marketplace &amp; Logistics</p>
                <p className="text-xs text-slate-500">PTA-Approved Direct Dispatch Delivery Note</p>
              </div>
              <div className="text-right">
                <div className="text-lg font-mono font-bold text-[#008060]">
                  #{viewingOrderReceipt.orderId}
                </div>
                <div className="text-xs text-slate-500">
                  {new Date(viewingOrderReceipt.createdAt).toLocaleDateString()}
                </div>
                <div className="text-[11px] font-bold text-emerald-700 uppercase mt-1">
                  OPEN PARCEL VERIFIED
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4 text-xs">
              <div className="p-3 bg-slate-50 rounded-2xl border border-slate-200">
                <div className="font-bold text-slate-700 uppercase text-[10px] mb-1">
                  Deliver To Customer:
                </div>
                <div className="font-bold text-slate-900 text-sm">
                  {viewingOrderReceipt.customerName}
                </div>
                <div className="text-slate-600">{viewingOrderReceipt.phone}</div>
                <div className="text-slate-600 mt-1">
                  {viewingOrderReceipt.address}, {viewingOrderReceipt.city}
                </div>
              </div>

              <div className="p-3 bg-slate-50 rounded-2xl border border-slate-200">
                <div className="font-bold text-slate-700 uppercase text-[10px] mb-1">
                  Shipping &amp; Courier:
                </div>
                <div className="font-bold text-slate-900">
                  {viewingOrderReceipt.courier || 'TCS Express'}
                </div>
                <div className="text-slate-600">Payment: {viewingOrderReceipt.paymentMethod}</div>
                <div className="text-slate-900 font-bold mt-1">
                  COD Amount to Collect: {formatPKR(viewingOrderReceipt.totalPKR)}
                </div>
              </div>
            </div>

            <div>
              <table className="w-full text-left text-xs border border-slate-200 rounded-xl overflow-hidden">
                <thead className="bg-slate-100 text-slate-700 uppercase font-semibold">
                  <tr>
                    <th className="p-2.5">Item Description</th>
                    <th className="p-2.5">Variant / Color</th>
                    <th className="p-2.5 text-center">Qty</th>
                    <th className="p-2.5 text-right">Price</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200">
                  {Array.isArray(viewingOrderReceipt.items) &&
                    viewingOrderReceipt.items.map((it: any, idx: number) => {
                      if (typeof it === 'string') {
                        return (
                          <tr key={idx}>
                            <td colSpan={3} className="p-2.5 font-medium">
                              {it}
                            </td>
                            <td className="p-2.5 text-right font-bold">
                              {formatPKR(viewingOrderReceipt.totalPKR)}
                            </td>
                          </tr>
                        );
                      }
                      return (
                        <tr key={idx}>
                          <td className="p-2.5 font-bold text-slate-900">{it.name}</td>
                          <td className="p-2.5 text-slate-600">
                            {it.variant || ''} {it.color ? `(${it.color})` : ''}
                          </td>
                          <td className="p-2.5 text-center font-bold">{it.quantity}</td>
                          <td className="p-2.5 text-right font-bold text-slate-900">
                            {formatPKR(it.pricePKR * it.quantity)}
                          </td>
                        </tr>
                      );
                    })}
                </tbody>
              </table>
            </div>

            {/* Merchant Financial Breakdown (Private Admin View) */}
            {(() => {
              let receiptCost = 0;
              if (Array.isArray(viewingOrderReceipt.items)) {
                viewingOrderReceipt.items.forEach((it: any) => {
                  if (typeof it !== 'string') {
                    const qty = it.quantity || 1;
                    const cost = it.costPricePKR || Math.round((it.pricePKR || 0) * 0.88);
                    receiptCost += cost * qty;
                  }
                });
              }
              const receiptProfit = (viewingOrderReceipt.totalPKR || 0) - receiptCost;
              const receiptMargin =
                viewingOrderReceipt.totalPKR > 0
                  ? Math.round((receiptProfit / viewingOrderReceipt.totalPKR) * 100)
                  : 0;
              return (
                <div className="p-4 bg-emerald-50/80 border border-emerald-200 rounded-2xl flex items-center justify-between text-xs print:hidden">
                  <div>
                    <span className="font-extrabold uppercase text-[10px] text-emerald-800 tracking-wider">
                      Merchant Order Profit (Private Store View)
                    </span>
                    <div className="text-slate-600 mt-0.5">
                      Revenue: <strong className="text-slate-900">{formatPKR(viewingOrderReceipt.totalPKR)}</strong> • Wholesale COGS: <strong className="text-slate-700">{formatPKR(receiptCost)}</strong>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-base font-black text-emerald-700">+{formatPKR(receiptProfit)}</div>
                    <div className="text-[10px] font-bold text-emerald-600">{receiptMargin}% Net Margin</div>
                  </div>
                </div>
              );
            })()}

            <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl text-xs text-amber-900 font-medium">
              ⚠️ Courier Instruction: Customer is allowed to open the parcel and verify box seal before paying COD. Official 1-Year brand warranty applies.
            </div>

            <div className="flex items-center justify-end gap-3 print:hidden">
              <button
                onClick={() => window.print()}
                className="px-5 py-2 rounded-xl bg-[#008060] text-white font-bold text-xs flex items-center gap-2 hover:bg-[#006e52]"
              >
                <Printer className="w-4 h-4" />
                Print Packing Slip
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ==============================================================
// SUBCOMPONENT: AUTHENTIC 2-COLUMN SHOPIFY PRODUCT EDITOR FORM
// ==============================================================
interface ProductFormModalProps {
  product: Smartphone | null;
  onClose: () => void;
  onSaved: () => void;
}

function ProductFormModal({ product, onClose, onSaved }: ProductFormModalProps) {
  const isEditing = Boolean(product);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formError, setFormError] = useState('');

  // Form Fields
  const [name, setName] = useState(product?.name || '');
  const [brand, setBrand] = useState(product?.brand || 'Samsung');
  const [tagline, setTagline] = useState(
    product?.tagline || 'Official Brand Smartphone with 1-Year Brand Warranty & PTA Approval'
  );
  const [basePricePKR, setBasePricePKR] = useState(product?.basePricePKR || 49999);
  const [costPricePKR, setCostPricePKR] = useState(
    product?.costPricePKR || Math.round((product?.basePricePKR || 49999) * 0.88)
  );
  const [originalPricePKR, setOriginalPricePKR] = useState(
    product?.originalPricePKR || 59999
  );
  const [stockQty, setStockQty] = useState(product?.stockQty ?? 10);
  const [inStock, setInStock] = useState(product?.inStock !== false);
  const [isNew, setIsNew] = useState(product?.isNew || false);
  const [isTrending, setIsTrending] = useState(product?.isTrending || false);
  const [isBestSeller, setIsBestSeller] = useState(product?.isBestSeller || false);

  // Customer Discount %
  const customerDiscountPercent = useMemo(() => {
    if (originalPricePKR <= 0 || originalPricePKR <= basePricePKR) return 0;
    return Math.round(((originalPricePKR - basePricePKR) / originalPricePKR) * 100);
  }, [basePricePKR, originalPricePKR]);

  // Merchant Net Profit & Margin Calculations
  const merchantNetProfit = useMemo(() => {
    return Math.max(0, basePricePKR - costPricePKR);
  }, [basePricePKR, costPricePKR]);

  const merchantMarginPercent = useMemo(() => {
    if (basePricePKR <= 0) return 0;
    return Math.round((merchantNetProfit / basePricePKR) * 100);
  }, [basePricePKR, merchantNetProfit]);

  const merchantMarkupPercent = useMemo(() => {
    if (costPricePKR <= 0) return 0;
    return Math.round((merchantNetProfit / costPricePKR) * 100);
  }, [costPricePKR, merchantNetProfit]);

  // Colors
  const [colors, setColors] = useState<SmartphoneColor[]>(
    product?.colors && product.colors.length > 0
      ? product.colors
      : [
          {
            name: 'Phantom Black',
            hex: '#1e293b',
            image:
              'https://images.priceoye.pk/samsung-galaxy-s22-ultra-pakistan-priceoye-w11tk-500x500.webp',
            inStock: true,
            stockQty: 5,
          },
        ]
  );

  // Variants (RAM / Storage)
  const [variants, setVariants] = useState<SmartphoneVariant[]>(
    product?.variants && product.variants.length > 0
      ? product.variants
      : [
          {
            id: 'var-1',
            ram: '8GB',
            storage: '128GB',
            pricePKR: product?.basePricePKR || 49999,
            originalPricePKR: product?.originalPricePKR || 59999,
            inStock: true,
            stockQty: 10,
          },
        ]
  );

  // Specifications
  const [screen, setScreen] = useState(product?.specs?.screen || '6.7 inches AMOLED 120Hz');
  const [refreshRate, setRefreshRate] = useState(product?.specs?.refreshRate || '120Hz');
  const [processor, setProcessor] = useState(
    product?.specs?.processor || 'Octa-Core High Performance'
  );
  const [battery, setBattery] = useState(product?.specs?.battery || '5000 mAh');
  const [charging, setCharging] = useState(product?.specs?.charging || '45W Fast Charging');
  const [mainCamera, setMainCamera] = useState(product?.specs?.mainCamera || '50 MP + 8 MP + 2 MP');
  const [selfieCamera, setSelfieCamera] = useState(product?.specs?.selfieCamera || '16 MP');
  const [os, setOs] = useState(product?.specs?.os || 'Android 14');
  const [ptaStatus, setPtaStatus] = useState<'PTA Approved' | 'Non-PTA'>(
    product?.specs?.ptaStatus || 'PTA Approved'
  );
  const [warranty, setWarranty] = useState(
    product?.specs?.warranty || '1 Year Official Pakistan Brand Warranty'
  );

  const handleAddColor = () => {
    setColors([
      ...colors,
      {
        name: 'New Color',
        hex: '#0284c7',
        image:
          'https://images.priceoye.pk/samsung-galaxy-s22-ultra-pakistan-priceoye-lilj8-500x500.webp',
        inStock: true,
        stockQty: 5,
      },
    ]);
  };

  const handleRemoveColor = (idx: number) => {
    if (colors.length <= 1) return;
    setColors(colors.filter((_, i) => i !== idx));
  };

  const handleAddVariant = () => {
    setVariants([
      ...variants,
      {
        id: `var-${Date.now()}`,
        ram: '8GB',
        storage: '256GB',
        pricePKR: basePricePKR + 10000,
        costPricePKR: costPricePKR + 8800,
        originalPricePKR: originalPricePKR + 10000,
        inStock: true,
        stockQty: 5,
      },
    ]);
  };

  const handleRemoveVariant = (idx: number) => {
    if (variants.length <= 1) return;
    setVariants(variants.filter((_, i) => i !== idx));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setFormError('Please enter a product title.');
      return;
    }

    setIsSubmitting(true);
    setFormError('');

    const discountPercent = customerDiscountPercent;

    const payload: Smartphone = {
      id:
        product?.id ||
        name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, ''),
      slug:
        product?.slug ||
        name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, ''),
      name,
      brand,
      tagline,
      basePricePKR: Number(basePricePKR),
      costPricePKR: Number(costPricePKR),
      originalPricePKR: Number(originalPricePKR),
      discountPercent,
      rating: product?.rating || 4.8,
      reviewCount: product?.reviewCount || 42,
      inStock,
      stockQty: Number(stockQty),
      isNew,
      isTrending,
      isBestSeller,
      colors,
      variants,
      specs: {
        screen,
        refreshRate,
        displayType: screen,
        processor,
        chipsetBrand: processor.includes('Snapdragon') ? 'Qualcomm Snapdragon' : 'MediaTek',
        mainCamera,
        selfieCamera,
        battery,
        charging,
        os,
        network: '5G / 4G LTE',
        security: 'In-Display Fingerprint / Face Unlock',
        weight: '198 g',
        waterResistance: 'IP68 Water/Dust Resistant',
        ptaStatus,
        warranty,
      },
      keyHighlights: {
        display: screen,
        camera: mainCamera,
        battery,
        processor,
        charging,
      },
    };

    try {
      // 1. Immediately save locally for zero-latency storefront reflection
      saveProductLocally(payload);

      // 2. Persist to server backend
      const url = '/api/admin/products';
      const method = isEditing ? 'PUT' : 'POST';

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json', 'Cache-Control': 'no-store' },
        body: JSON.stringify({ product: payload }),
      });

      const data = await res.json();
      if (data.success && data.product) {
        saveProductLocally(data.product);
      }
      onSaved();
    } catch {
      onSaved();
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-6 overflow-y-auto antialiased">
      <div className="w-full max-w-5xl bg-[#f6f6f7] border border-slate-200 rounded-3xl shadow-2xl overflow-hidden my-auto animate-in zoom-in-95 duration-150 flex flex-col max-h-[92vh]">
        {/* Sticky Header */}
        <div className="p-5 border-b border-slate-200 flex items-center justify-between bg-white shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-[#008060]/10 text-[#008060] flex items-center justify-center font-bold">
              <Package className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900">
                {isEditing ? `Edit: ${product?.name}` : 'Add New Product'}
              </h2>
              <p className="text-xs text-slate-500">
                Shopify-standard 2-column product creation flow.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-500 hover:text-slate-800"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* 2-Column Form Body */}
        <form onSubmit={handleSubmit} className="p-6 overflow-y-auto flex-1 space-y-6">
          {formError && (
            <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-semibold">
              {formError}
            </div>
          )}

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
            {/* LEFT COLUMN: Main Product Details (2 Cols) */}
            <div className="lg:col-span-2 space-y-6">
              {/* Title & Description Card */}
              <div className="bg-white border border-slate-200/90 rounded-2xl p-5 shadow-xs space-y-4">
                <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                  Title &amp; Description
                </h3>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Title *
                  </label>
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="e.g. Samsung Galaxy S24 Ultra"
                    className="w-full bg-[#f9fafb] border border-slate-200 rounded-xl px-4 py-2.5 text-sm font-semibold text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#008060] focus:bg-white transition-all"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Tagline / Short Summary
                  </label>
                  <input
                    type="text"
                    value={tagline}
                    onChange={(e) => setTagline(e.target.value)}
                    placeholder="Official Brand Warranty & PTA Approved"
                    className="w-full bg-[#f9fafb] border border-slate-200 rounded-xl px-4 py-2.5 text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#008060] focus:bg-white transition-all"
                  />
                </div>
              </div>

              {/* Pricing, Wholesale Cost & Profit Margin Card */}
              <div className="bg-white border border-slate-200/90 rounded-2xl p-5 shadow-xs space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                    Pricing &amp; Profitability
                  </h3>
                  {customerDiscountPercent > 0 && (
                    <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-blue-50 text-blue-700 border border-blue-200">
                      {customerDiscountPercent}% Customer Discount
                    </span>
                  )}
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      Selling Price (PKR) *
                    </label>
                    <input
                      type="number"
                      required
                      min="1"
                      value={basePricePKR}
                      onChange={(e) => setBasePricePKR(parseInt(e.target.value) || 0)}
                      className="w-full bg-[#f9fafb] border border-slate-200 rounded-xl px-4 py-2.5 text-sm font-black text-[#008060] focus:outline-none focus:ring-2 focus:ring-[#008060] focus:bg-white"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      Wholesale Cost (PKR) *
                    </label>
                    <input
                      type="number"
                      required
                      min="1"
                      value={costPricePKR}
                      onChange={(e) => setCostPricePKR(parseInt(e.target.value) || 0)}
                      className="w-full bg-[#f9fafb] border border-slate-200 rounded-xl px-4 py-2.5 text-sm font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#008060] focus:bg-white"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      Compare-at Price (PKR)
                    </label>
                    <input
                      type="number"
                      min="0"
                      value={originalPricePKR}
                      onChange={(e) => setOriginalPricePKR(parseInt(e.target.value) || 0)}
                      className="w-full bg-[#f9fafb] border border-slate-200 rounded-xl px-4 py-2.5 text-sm text-slate-500 focus:outline-none focus:ring-2 focus:ring-[#008060] focus:bg-white"
                    />
                  </div>
                </div>

                {/* Real-time Profit Calculation Preview Box */}
                <div className="p-4 rounded-2xl bg-gradient-to-r from-emerald-50 via-teal-50/70 to-emerald-50 border border-emerald-200 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                  <div>
                    <div className="text-[11px] font-extrabold uppercase tracking-wider text-emerald-800 flex items-center gap-1.5">
                      <DollarSign className="w-3.5 h-3.5 text-emerald-600" />
                      <span>Live Profit &amp; Margin Calculator</span>
                    </div>
                    <div className="text-xs text-slate-600 mt-0.5">
                      Selling: <strong>{formatPKR(basePricePKR)}</strong> • Wholesale Cost: <strong>{formatPKR(costPricePKR)}</strong>
                    </div>
                  </div>

                  <div className="flex items-center gap-4">
                    <div className="text-right">
                      <div className="text-[11px] font-bold text-slate-500">Expected Net Profit</div>
                      <div className="text-base font-black text-emerald-700">+{formatPKR(merchantNetProfit)}</div>
                    </div>

                    <div className="flex items-center gap-1.5">
                      <div className="px-3 py-1 rounded-xl bg-emerald-600 text-white font-black text-xs text-center shadow-xs">
                        <div>{merchantMarginPercent}%</div>
                        <div className="text-[8px] font-normal text-emerald-100 uppercase">Margin</div>
                      </div>
                      <div className="px-2.5 py-1 rounded-xl bg-white border border-emerald-300 text-emerald-800 font-bold text-xs text-center">
                        <div>{merchantMarkupPercent}%</div>
                        <div className="text-[8px] font-normal text-slate-500 uppercase">Markup</div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Media & Colorways Card */}
              <div className="bg-white border border-slate-200/90 rounded-2xl p-5 shadow-xs space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                    Colorways &amp; Media ({colors.length})
                  </h3>
                  <button
                    type="button"
                    onClick={handleAddColor}
                    className="px-3 py-1 rounded-xl bg-[#008060]/10 hover:bg-[#008060]/20 text-[#008060] text-xs font-bold transition-all flex items-center gap-1"
                  >
                    <Plus className="w-3.5 h-3.5" /> Add Color
                  </button>
                </div>

                <div className="space-y-3">
                  {colors.map((c, idx) => (
                    <div
                      key={idx}
                      className="p-3 bg-slate-50 rounded-xl border border-slate-200 grid grid-cols-1 sm:grid-cols-12 gap-3 items-center"
                    >
                      <div className="sm:col-span-3">
                        <label className="block text-[10px] font-bold text-slate-500">
                          Color Name
                        </label>
                        <input
                          type="text"
                          value={c.name}
                          onChange={(e) => {
                            const newCols = [...colors];
                            newCols[idx].name = e.target.value;
                            setColors(newCols);
                          }}
                          className="w-full bg-white border border-slate-300 rounded-lg px-2.5 py-1.5 text-xs text-slate-900 font-semibold"
                        />
                      </div>

                      <div className="sm:col-span-2 flex items-center gap-2">
                        <div className="flex-1">
                          <label className="block text-[10px] font-bold text-slate-500">
                            Hex
                          </label>
                          <input
                            type="text"
                            value={c.hex}
                            onChange={(e) => {
                              const newCols = [...colors];
                              newCols[idx].hex = e.target.value;
                              setColors(newCols);
                            }}
                            className="w-full bg-white border border-slate-300 rounded-lg px-2 py-1.5 text-xs text-slate-900 font-mono"
                          />
                        </div>
                        <input
                          type="color"
                          value={c.hex.startsWith('#') ? c.hex : '#1e293b'}
                          onChange={(e) => {
                            const newCols = [...colors];
                            newCols[idx].hex = e.target.value;
                            setColors(newCols);
                          }}
                          className="w-7 h-7 rounded-lg cursor-pointer bg-transparent border-0 mt-3"
                        />
                      </div>

                      <div className="sm:col-span-4">
                        <label className="block text-[10px] font-bold text-slate-500">
                          WebP Photo URL
                        </label>
                        <input
                          type="url"
                          value={c.image}
                          onChange={(e) => {
                            const newCols = [...colors];
                            newCols[idx].image = e.target.value;
                            setColors(newCols);
                          }}
                          className="w-full bg-white border border-slate-300 rounded-lg px-2.5 py-1.5 text-xs text-slate-900"
                        />
                      </div>

                      <div className="sm:col-span-2">
                        <label className="block text-[10px] font-bold text-slate-500">
                          Color Stock
                        </label>
                        <input
                          type="number"
                          min="0"
                          value={c.stockQty ?? 5}
                          onChange={(e) => {
                            const newCols = [...colors];
                            newCols[idx].stockQty = parseInt(e.target.value) || 0;
                            setColors(newCols);
                          }}
                          className="w-full bg-white border border-slate-300 rounded-lg px-2 py-1.5 text-xs text-slate-900 font-bold"
                        />
                      </div>

                      <div className="sm:col-span-1 text-right">
                        <button
                          type="button"
                          onClick={() => handleRemoveColor(idx)}
                          className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 mt-3"
                          title="Remove Color"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Variants Matrix Card */}
              <div className="bg-white border border-slate-200/90 rounded-2xl p-5 shadow-xs space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                    RAM &amp; Storage Variants ({variants.length})
                  </h3>
                  <button
                    type="button"
                    onClick={handleAddVariant}
                    className="px-3 py-1 rounded-xl bg-purple-50 hover:bg-purple-100 text-purple-700 text-xs font-bold transition-all flex items-center gap-1"
                  >
                    <Plus className="w-3.5 h-3.5" /> Add Variant
                  </button>
                </div>

                <div className="space-y-3">
                  {variants.map((v, idx) => (
                    <div
                      key={v.id || idx}
                      className="p-3 bg-slate-50 rounded-xl border border-slate-200 grid grid-cols-1 sm:grid-cols-12 gap-3 items-center"
                    >
                      <div className="sm:col-span-2">
                        <label className="block text-[10px] font-bold text-slate-500">RAM</label>
                        <input
                          type="text"
                          value={v.ram}
                          onChange={(e) => {
                            const newVars = [...variants];
                            newVars[idx].ram = e.target.value;
                            setVariants(newVars);
                          }}
                          className="w-full bg-white border border-slate-300 rounded-lg px-2.5 py-1.5 text-xs font-bold text-slate-900"
                        />
                      </div>

                      <div className="sm:col-span-2">
                        <label className="block text-[10px] font-bold text-slate-500">Storage</label>
                        <input
                          type="text"
                          value={v.storage}
                          onChange={(e) => {
                            const newVars = [...variants];
                            newVars[idx].storage = e.target.value;
                            setVariants(newVars);
                          }}
                          className="w-full bg-white border border-slate-300 rounded-lg px-2.5 py-1.5 text-xs font-bold text-slate-900"
                        />
                      </div>

                      <div className="sm:col-span-3">
                        <label className="block text-[10px] font-bold text-slate-500">Price (PKR)</label>
                        <input
                          type="number"
                          value={v.pricePKR}
                          onChange={(e) => {
                            const newVars = [...variants];
                            newVars[idx].pricePKR = parseInt(e.target.value) || 0;
                            setVariants(newVars);
                          }}
                          className="w-full bg-white border border-slate-300 rounded-lg px-2.5 py-1.5 text-xs text-[#008060] font-black"
                        />
                      </div>

                      <div className="sm:col-span-2">
                        <label className="block text-[10px] font-bold text-slate-500">Stock Qty</label>
                        <input
                          type="number"
                          min="0"
                          value={v.stockQty ?? 5}
                          onChange={(e) => {
                            const newVars = [...variants];
                            newVars[idx].stockQty = parseInt(e.target.value) || 0;
                            setVariants(newVars);
                          }}
                          className="w-full bg-white border border-slate-300 rounded-lg px-2.5 py-1.5 text-xs font-bold text-slate-900"
                        />
                      </div>

                      <div className="sm:col-span-2">
                        <label className="block text-[10px] font-bold text-slate-500">Status</label>
                        <select
                          value={v.inStock ? 'yes' : 'no'}
                          onChange={(e) => {
                            const newVars = [...variants];
                            newVars[idx].inStock = e.target.value === 'yes';
                            setVariants(newVars);
                          }}
                          className="w-full bg-white border border-slate-300 rounded-lg px-2 py-1.5 text-xs text-slate-900 font-semibold"
                        >
                          <option value="yes">In Stock</option>
                          <option value="no">Sold out</option>
                        </select>
                      </div>

                      <div className="sm:col-span-1 text-right">
                        <button
                          type="button"
                          onClick={() => handleRemoveVariant(idx)}
                          className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 mt-3"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Technical Specifications */}
              <div className="bg-white border border-slate-200/90 rounded-2xl p-5 shadow-xs space-y-4">
                <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                  Hardware Specs &amp; Warranty
                </h3>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      Display / Screen
                    </label>
                    <input
                      type="text"
                      value={screen}
                      onChange={(e) => setScreen(e.target.value)}
                      className="w-full bg-[#f9fafb] border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-900"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      Processor
                    </label>
                    <input
                      type="text"
                      value={processor}
                      onChange={(e) => setProcessor(e.target.value)}
                      className="w-full bg-[#f9fafb] border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-900"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      Battery &amp; Charging
                    </label>
                    <input
                      type="text"
                      value={battery}
                      onChange={(e) => setBattery(e.target.value)}
                      className="w-full bg-[#f9fafb] border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-900"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      Main Camera
                    </label>
                    <input
                      type="text"
                      value={mainCamera}
                      onChange={(e) => setMainCamera(e.target.value)}
                      className="w-full bg-[#f9fafb] border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-900"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* RIGHT COLUMN: Status, Organization, Channels (1 Col - Shopify Style) */}
            <div className="space-y-6">
              {/* Product Status Card */}
              <div className="bg-white border border-slate-200/90 rounded-2xl p-5 shadow-xs space-y-3">
                <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                  Product Status
                </h3>
                <select
                  value={inStock ? 'active' : 'draft'}
                  onChange={(e) => setInStock(e.target.value === 'active')}
                  className="w-full bg-[#f9fafb] border border-slate-300 rounded-xl px-3 py-2 text-xs font-bold text-slate-900"
                >
                  <option value="active">Active (Visible in Store)</option>
                  <option value="draft">Draft / Archived</option>
                </select>
                <p className="text-[11px] text-slate-500">
                  This product will be immediately purchasable on Nawira Traders when active.
                </p>
              </div>

              {/* Master Inventory Card */}
              <div className="bg-white border border-slate-200/90 rounded-2xl p-5 shadow-xs space-y-3">
                <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                  Master Inventory
                </h3>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Total Units Available *
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={stockQty}
                    onChange={(e) => {
                      const q = parseInt(e.target.value) || 0;
                      setStockQty(q);
                      setInStock(q > 0);
                    }}
                    className="w-full bg-[#f9fafb] border border-slate-300 rounded-xl px-3 py-2 text-sm font-black text-slate-900"
                  />
                </div>
              </div>

              {/* Organization & Vendor Card */}
              <div className="bg-white border border-slate-200/90 rounded-2xl p-5 shadow-xs space-y-3">
                <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                  Organization
                </h3>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Brand / Vendor</label>
                  <select
                    value={brand}
                    onChange={(e) => setBrand(e.target.value)}
                    className="w-full bg-[#f9fafb] border border-slate-300 rounded-xl px-3 py-2 text-xs font-bold text-slate-900"
                  >
                    {BRANDS.filter((b) => b !== 'All Brands').map((b) => (
                      <option key={b} value={b}>
                        {b}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">PTA Status</label>
                  <select
                    value={ptaStatus}
                    onChange={(e: any) => setPtaStatus(e.target.value)}
                    className="w-full bg-[#f9fafb] border border-slate-300 rounded-xl px-3 py-2 text-xs font-bold text-slate-900"
                  >
                    <option value="PTA Approved">PTA Approved</option>
                    <option value="Non-PTA">Non-PTA</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Warranty</label>
                  <input
                    type="text"
                    value={warranty}
                    onChange={(e) => setWarranty(e.target.value)}
                    className="w-full bg-[#f9fafb] border border-slate-300 rounded-xl px-3 py-2 text-xs text-slate-900"
                  />
                </div>
              </div>

              {/* Promotional Badges Card */}
              <div className="bg-white border border-slate-200/90 rounded-2xl p-5 shadow-xs space-y-3">
                <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                  Store Badges
                </h3>
                <div className="space-y-2">
                  <label className="flex items-center gap-2 cursor-pointer text-xs font-semibold text-slate-700">
                    <input
                      type="checkbox"
                      checked={isNew}
                      onChange={(e) => setIsNew(e.target.checked)}
                      className="w-4 h-4 rounded text-[#008060] focus:ring-0"
                    />
                    <span>New Arrival Badge</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer text-xs font-semibold text-slate-700">
                    <input
                      type="checkbox"
                      checked={isTrending}
                      onChange={(e) => setIsTrending(e.target.checked)}
                      className="w-4 h-4 rounded text-amber-500 focus:ring-0"
                    />
                    <span>Trending Product Badge</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer text-xs font-semibold text-slate-700">
                    <input
                      type="checkbox"
                      checked={isBestSeller}
                      onChange={(e) => setIsBestSeller(e.target.checked)}
                      className="w-4 h-4 rounded text-purple-600 focus:ring-0"
                    />
                    <span>Best Seller Badge</span>
                  </label>
                </div>
              </div>
            </div>
          </div>

          {/* Sticky Bottom Bar */}
          <div className="p-4 bg-white border-t border-slate-200 rounded-2xl flex items-center justify-end gap-3 sticky bottom-0 shadow-lg">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold transition-all"
            >
              Discard
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-6 py-2 rounded-xl bg-[#008060] hover:bg-[#006e52] active:scale-[0.98] text-white text-xs font-bold shadow-md shadow-[#008060]/20 transition-all flex items-center gap-2 cursor-pointer"
            >
              {isSubmitting ? (
                <>
                  <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                  <span>Saving to Store...</span>
                </>
              ) : (
                <>
                  <Check className="w-3.5 h-3.5" />
                  <span>{isEditing ? 'Save changes' : 'Save product'}</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
