'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  ShoppingBag,
  Package,
  Clock,
  CheckCircle2,
  Truck,
  MapPin,
  CreditCard,
  ChevronRight,
  ExternalLink,
  Phone,
  MessageSquare,
  ShieldCheck,
  PackageCheck,
  ArrowRight,
  RefreshCw,
} from 'lucide-react';
import { collection, getDocs, query, orderBy } from 'firebase/firestore';
import { Navbar } from '@/components/Navbar';
import { Footer } from '@/components/Footer';
import { useAuth } from '@/context/AuthContext';
import { db } from '@/lib/firebase';
import { formatPKR } from '@/data/smartphones';

interface OrderItem {
  name: string;
  variant?: string;
  pricePKR: number;
  quantity: number;
  color?: string;
  image?: string;
}

interface FirestoreOrder {
  orderId: string;
  items: (string | OrderItem)[];
  totalPKR: number;
  paymentMethod: string;
  status: string;
  address?: string;
  city?: string;
  customerName?: string;
  phone?: string;
  createdAt?: any;
}

export default function OrdersHistoryPage() {
  const { user, profile, loading: authLoading, openAuthModal } = useAuth();
  const [orders, setOrders] = useState<FirestoreOrder[]>([]);
  const [loadingOrders, setLoadingOrders] = useState(true);

  const fetchOrders = async () => {
    if (!user) return;
    setLoadingOrders(true);
    try {
      const ordersRef = collection(db, 'users', user.uid, 'orders');
      let docsList: FirestoreOrder[] = [];

      try {
        const q = query(ordersRef, orderBy('createdAt', 'desc'));
        const querySnapshot = await getDocs(q);
        querySnapshot.forEach((docSnap) => {
          docsList.push({ ...docSnap.data() } as FirestoreOrder);
        });
      } catch {
        // Fallback without orderBy in case index is pending
        const querySnapshot = await getDocs(ordersRef);
        querySnapshot.forEach((docSnap) => {
          docsList.push({ ...docSnap.data() } as FirestoreOrder);
        });
      }

      // Merge with local storage orders placed with same phone
      try {
        const local = JSON.parse(localStorage.getItem('naviratraders_orders') || localStorage.getItem('voltphone_orders') || '[]');
        const cleanUserPhone = profile?.phone || (user.email ? user.email.replace(/@(naviratraders\.pk|hamzaphonestore\.pk|voltphone\.pk)/, '') : '');
        
        local.forEach((lo: any) => {
          const matchPhone = lo.phone && cleanUserPhone && lo.phone.replace(/\D/g, '') === cleanUserPhone.replace(/\D/g, '');
          if (matchPhone && !docsList.some((d) => d.orderId === lo.orderId)) {
            docsList.push({
              orderId: lo.orderId,
              items: lo.items || [],
              totalPKR: lo.totalPKR || 0,
              paymentMethod: lo.paymentMethod || 'cod',
              status: lo.status || 'Placed',
              address: lo.address,
              city: lo.city,
              customerName: lo.customerName,
              phone: lo.phone,
              createdAt: lo.createdAt ? new Date(lo.createdAt) : new Date(),
            });
          }
        });
      } catch {
        // ignore
      }

      // Sort by date descending
      docsList.sort((a, b) => {
        const dateA = a.createdAt?.toDate ? a.createdAt.toDate().getTime() : new Date(a.createdAt || 0).getTime();
        const dateB = b.createdAt?.toDate ? b.createdAt.toDate().getTime() : new Date(b.createdAt || 0).getTime();
        return dateB - dateA;
      });

      setOrders(docsList);
    } catch (err) {
      console.error('Error fetching orders:', err);
    } finally {
      setLoadingOrders(false);
    }
  };

  useEffect(() => {
    if (user) {
      fetchOrders();
    } else if (!authLoading) {
      setLoadingOrders(false);
    }
  }, [user, authLoading]);

  const formatDate = (rawDate: any) => {
    if (!rawDate) return 'Recently Placed';
    try {
      const d = rawDate.toDate ? rawDate.toDate() : new Date(rawDate);
      return d.toLocaleDateString('en-PK', {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      });
    } catch {
      return 'Recently Placed';
    }
  };

  if (authLoading) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col w-full max-w-full overflow-x-hidden">
        <Navbar />
        <div className="flex-1 max-w-5xl mx-auto w-full p-6 sm:p-12 flex items-center justify-center">
          <div className="text-center space-y-3">
            <div className="w-10 h-10 border-4 border-[#48afff] border-t-transparent rounded-full animate-spin mx-auto" />
            <p className="text-xs font-bold text-slate-500">Checking authentication...</p>
          </div>
        </div>
        <Footer />
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col w-full max-w-full overflow-x-hidden">
        <Navbar />
        <div className="flex-1 max-w-md mx-auto w-full p-6 sm:p-12 flex flex-col items-center justify-center text-center">
          <div className="w-16 h-16 rounded-3xl bg-slate-900 border border-slate-800 text-[#48afff] flex items-center justify-center shadow-lg shadow-[#48afff]/10 mb-4">
            <ShoppingBag className="w-8 h-8 stroke-[1.8]" />
          </div>
          <h1 className="text-2xl font-black text-slate-950">My Smartphone Orders</h1>
          <p className="text-xs text-slate-500 mt-2 max-w-sm">
            Sign in with your registered Pakistani mobile number to view and track all your orders.
          </p>
          <button
            onClick={() => openAuthModal('login')}
            className="mt-6 py-3 px-6 rounded-2xl bg-[#136ab5] hover:bg-[#0f5492] text-white font-bold text-xs tracking-wide shadow-md shadow-cyan-600/20 cursor-pointer transition-all"
          >
            Log In to View Orders
          </button>
        </div>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-sans w-full max-w-full overflow-x-hidden">
      <Navbar />

      <main className="flex-1 max-w-5xl mx-auto w-full px-3 sm:px-6 lg:px-8 py-6 sm:py-12">
        {/* Breadcrumb Navigation */}
        <nav className="flex items-center gap-2 text-xs text-slate-500 mb-6">
          <Link href="/" className="hover:text-[#136ab5] transition-colors">
            Home
          </Link>
          <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
          <Link href="/account" className="hover:text-[#136ab5] transition-colors">
            My Account
          </Link>
          <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
          <span className="text-slate-900 font-bold">My Orders</span>
        </nav>

        {/* Page Title & Refresh */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-xl sm:text-2xl font-black text-slate-950 tracking-tight">
              Order History &amp; Tracking
            </h1>
            <p className="text-xs text-slate-500 mt-0.5">
              Review your PTA-approved smartphone orders with Open-Parcel inspection.
            </p>
          </div>
          <button
            onClick={fetchOrders}
            disabled={loadingOrders}
            className="inline-flex items-center gap-2 px-3.5 py-2 rounded-2xl bg-white hover:bg-slate-100 border border-slate-200 text-xs font-bold text-slate-700 transition-all cursor-pointer shadow-xs disabled:opacity-50"
            title="Refresh orders"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loadingOrders ? 'animate-spin' : ''}`} />
            <span className="hidden sm:inline">Refresh</span>
          </button>
        </div>

        {/* Orders List */}
        {loadingOrders ? (
          <div className="bg-white rounded-3xl p-12 border border-slate-200 text-center space-y-3">
            <div className="w-8 h-8 border-3 border-[#48afff] border-t-transparent rounded-full animate-spin mx-auto" />
            <p className="text-xs font-bold text-slate-500">Retrieving your order records...</p>
          </div>
        ) : orders.length > 0 ? (
          <div className="space-y-6">
            {orders.map((order) => {
              const formattedDate = formatDate(order.createdAt);
              const isCOD = !order.paymentMethod || order.paymentMethod.toLowerCase() === 'cod';

              return (
                <div
                  key={order.orderId}
                  className="bg-white rounded-3xl border border-slate-200/90 shadow-sm overflow-hidden hover:border-[#48afff] hover:shadow-md transition-all"
                >
                  {/* Order Top Bar */}
                  <div className="bg-slate-900 text-white p-4 sm:p-5 flex flex-wrap items-center justify-between gap-3 text-xs">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-xl bg-[#48afff]/20 text-[#48afff] border border-[#48afff]/30 flex items-center justify-center font-bold">
                        <Package className="w-4 h-4" />
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-mono font-bold text-sm text-[#48afff]">
                            {order.orderId}
                          </span>
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                            {order.status || 'Placed'}
                          </span>
                        </div>
                        <p className="text-[11px] text-slate-400 mt-0.5">
                          Placed on: {formattedDate}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <span className="hidden sm:inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-white/10 text-sky-300 border border-white/10">
                        <PackageCheck className="w-3 h-3 text-emerald-400" /> Open-Parcel Verification
                      </span>
                    </div>
                  </div>

                  {/* Order Body */}
                  <div className="p-5 sm:p-6 space-y-4">
                    {/* Items List */}
                    <div className="divide-y divide-slate-100">
                      {order.items.map((item, idx) => {
                        const itemTitle = typeof item === 'string' ? item : item.name;
                        const itemVariant = typeof item === 'object' ? item.variant : undefined;
                        const itemQty = typeof item === 'object' ? item.quantity : 1;
                        const itemPrice = typeof item === 'object' ? item.pricePKR : undefined;

                        return (
                          <div key={idx} className="py-3 flex items-center justify-between gap-4 first:pt-0 last:pb-0">
                            <div className="flex items-center gap-3">
                              <div className="w-10 h-10 rounded-xl bg-slate-100 border border-slate-200 flex items-center justify-center text-slate-500 flex-shrink-0">
                                <ShoppingBag className="w-4 h-4 text-[#136ab5]" />
                              </div>
                              <div>
                                <h4 className="text-xs font-bold text-slate-900">{itemTitle}</h4>
                                {itemVariant && (
                                  <p className="text-[11px] text-slate-500">Variant: {itemVariant}</p>
                                )}
                                <p className="text-[11px] text-slate-400">Qty: {itemQty}</p>
                              </div>
                            </div>

                            {itemPrice && (
                              <div className="text-xs font-bold text-slate-900">
                                {formatPKR(itemPrice * itemQty)}
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>

                    {/* Order Meta Footer */}
                    <div className="pt-4 border-t border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-4 text-xs">
                      <div className="space-y-1">
                        <div className="flex items-center gap-1.5 text-slate-600">
                          <MapPin className="w-3.5 h-3.5 text-[#136ab5] flex-shrink-0" />
                          <span className="truncate max-w-sm">
                            {order.address ? `${order.address}, ${order.city || 'Pakistan'}` : 'Delivery to address on file'}
                          </span>
                        </div>
                        <div className="flex items-center gap-1.5 text-slate-500 text-[11px]">
                          <CreditCard className="w-3 h-3 text-slate-400" />
                          <span>
                            {isCOD
                              ? 'Cash on Delivery (Pay after Open-Parcel inspection)'
                              : order.paymentMethod?.toUpperCase()}
                          </span>
                        </div>
                      </div>

                      <div className="flex items-center justify-between sm:justify-end gap-4">
                        <div className="text-right">
                          <span className="text-[11px] text-slate-400 block font-medium">Order Total</span>
                          <span className="text-sm font-black text-slate-950">
                            {formatPKR(order.totalPKR)}
                          </span>
                        </div>

                        <a
                          href={`https://wa.me/923135221200?text=${encodeURIComponent(
                            `Hi Nawira Traders! I am inquiring about my order #${order.orderId}.`
                          )}`}
                          target="_blank"
                          rel="noreferrer"
                          className="btn-press inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 text-emerald-800 text-xs font-bold transition-all"
                        >
                          <MessageSquare className="w-3.5 h-3.5 text-emerald-600" />
                          <span className="hidden sm:inline">WhatsApp Help</span>
                        </a>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="bg-white rounded-3xl p-10 sm:p-14 border border-slate-200 text-center space-y-4">
            <div className="w-16 h-16 rounded-3xl bg-slate-50 border border-slate-200 text-slate-400 flex items-center justify-center mx-auto shadow-xs">
              <ShoppingBag className="w-8 h-8 stroke-[1.8]" />
            </div>
            <div className="space-y-1">
              <h3 className="text-base font-bold text-slate-950">No orders placed yet</h3>
              <p className="text-xs text-slate-500 max-w-sm mx-auto">
                Explore our catalog of 222+ PTA-approved smartphones with 0% EMI installments and Open-Parcel delivery.
              </p>
            </div>
            <Link
              href="/#catalog"
              className="btn-press inline-flex items-center gap-2 px-6 py-3 rounded-2xl bg-slate-950 hover:bg-slate-800 text-white font-bold text-xs tracking-wide shadow-md shadow-slate-950/20 transition-all cursor-pointer"
            >
              <span>Explore Mobiles</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        )}
      </main>

      <Footer />
    </div>
  );
}
