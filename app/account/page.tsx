'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  User,
  MapPin,
  Lock,
  ShoppingBag,
  Plus,
  Trash2,
  Edit2,
  CheckCircle2,
  AlertCircle,
  ShieldCheck,
  Phone,
  ChevronRight,
  Home,
  Building,
  Check,
  X,
  ArrowRight,
  Sparkles,
} from 'lucide-react';
import { Navbar } from '@/components/Navbar';
import { Footer } from '@/components/Footer';
import { useAuth, SavedAddress } from '@/context/AuthContext';
import { PAKISTAN_CITIES } from '@/data/smartphones';

export default function AccountPage() {
  const router = useRouter();
  const {
    user,
    profile,
    loading,
    openAuthModal,
    updateProfileName,
    addAddress,
    updateAddress,
    deleteAddress,
    setDefaultAddress,
    changePassword,
  } = useAuth();

  const [activeTab, setActiveTab] = useState<'profile' | 'addresses' | 'security'>('profile');

  // Profile Form State
  const [nameInput, setNameInput] = useState('');
  const [isUpdatingProfile, setIsUpdatingProfile] = useState(false);
  const [profileMessage, setProfileMessage] = useState<{ text: string; type: 'success' | 'error' } | null>(null);

  // Address Modal State
  const [isAddressModalOpen, setIsAddressModalOpen] = useState(false);
  const [editingAddressId, setEditingAddressId] = useState<string | null>(null);
  const [addressLabel, setAddressLabel] = useState('Home');
  const [recipientName, setRecipientName] = useState('');
  const [addressPhone, setAddressPhone] = useState('');
  const [streetAddress, setStreetAddress] = useState('');
  const [city, setCity] = useState(PAKISTAN_CITIES[0] || 'Lahore');
  const [province, setProvince] = useState('Punjab');
  const [isDefaultAddress, setIsDefaultAddress] = useState(false);
  const [addressError, setAddressError] = useState('');
  const [isSavingAddress, setIsSavingAddress] = useState(false);

  // Password Form State
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isUpdatingPassword, setIsUpdatingPassword] = useState(false);
  const [passwordMessage, setPasswordMessage] = useState<{ text: string; type: 'success' | 'error' } | null>(null);

  // Sync profile name to input
  React.useEffect(() => {
    if (profile?.name) {
      setNameInput(profile.name);
    } else if (user?.displayName) {
      setNameInput(user.displayName);
    }
  }, [profile, user]);

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col w-full max-w-full overflow-x-hidden">
        <Navbar />
        <div className="flex-1 max-w-5xl mx-auto w-full p-6 sm:p-12 flex items-center justify-center">
          <div className="text-center space-y-3">
            <div className="w-10 h-10 border-4 border-[#48afff] border-t-transparent rounded-full animate-spin mx-auto" />
            <p className="text-xs font-bold text-slate-500">Loading your Nawira Traders profile...</p>
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
        <div className="flex-1 max-w-lg mx-auto w-full p-6 sm:p-12 flex flex-col items-center justify-center text-center">
          <div className="w-16 h-16 rounded-3xl bg-slate-900 border border-slate-800 text-[#48afff] flex items-center justify-center shadow-lg shadow-[#48afff]/10 mb-4">
            <User className="w-8 h-8 stroke-[1.8]" />
          </div>
          <h1 className="text-2xl font-black text-slate-950">Customer Account</h1>
          <p className="text-xs text-slate-500 mt-2 max-w-sm">
            Please log in with your Pakistani mobile number to manage your profile, saved delivery addresses, and view order history.
          </p>
          <div className="mt-6 flex flex-col sm:flex-row gap-3 w-full max-w-xs">
            <button
              onClick={() => openAuthModal('login')}
              className="flex-1 py-3 px-5 rounded-2xl bg-slate-950 hover:bg-slate-800 text-white font-bold text-xs tracking-wide shadow-md shadow-slate-950/20 cursor-pointer transition-all"
            >
              Log In
            </button>
            <button
              onClick={() => openAuthModal('signup')}
              className="flex-1 py-3 px-5 rounded-2xl bg-[#136ab5] hover:bg-[#0f5492] text-white font-bold text-xs tracking-wide shadow-md shadow-cyan-600/20 cursor-pointer transition-all"
            >
              Sign Up
            </button>
          </div>
        </div>
        <Footer />
      </div>
    );
  }

  // Handle Profile Update
  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setProfileMessage(null);
    setIsUpdatingProfile(true);

    const res = await updateProfileName(nameInput);
    setIsUpdatingProfile(false);

    if (res.success) {
      setProfileMessage({ text: 'Profile name updated successfully!', type: 'success' });
      setTimeout(() => setProfileMessage(null), 4000);
    } else {
      setProfileMessage({ text: res.error || 'Failed to update profile.', type: 'error' });
    }
  };

  // Open Address Modal for New Address
  const handleOpenNewAddress = () => {
    setEditingAddressId(null);
    setAddressLabel('Home');
    setRecipientName(profile?.name || user.displayName || '');
    setAddressPhone(profile?.phone || '');
    setStreetAddress('');
    setCity(PAKISTAN_CITIES[0] || 'Lahore');
    setProvince('Punjab');
    setIsDefaultAddress(profile?.addresses?.length === 0);
    setAddressError('');
    setIsAddressModalOpen(true);
  };

  // Open Address Modal for Edit
  const handleOpenEditAddress = (addr: SavedAddress) => {
    setEditingAddressId(addr.id);
    setAddressLabel(addr.label || 'Home');
    setRecipientName(addr.recipientName);
    setAddressPhone(addr.phone);
    setStreetAddress(addr.streetAddress);
    setCity(addr.city);
    setProvince(addr.province || 'Punjab');
    setIsDefaultAddress(addr.isDefault);
    setAddressError('');
    setIsAddressModalOpen(true);
  };

  // Save Address (Create or Update)
  const handleSaveAddress = async (e: React.FormEvent) => {
    e.preventDefault();
    setAddressError('');

    if (!recipientName.trim()) {
      setAddressError('Please enter recipient full name.');
      return;
    }
    if (!addressPhone.trim()) {
      setAddressError('Please enter delivery contact phone.');
      return;
    }
    if (!streetAddress.trim() || streetAddress.trim().length < 8) {
      setAddressError('Please enter complete street address (house/flat #, street, area).');
      return;
    }

    setIsSavingAddress(true);

    let res;
    if (editingAddressId) {
      res = await updateAddress(editingAddressId, {
        label: addressLabel,
        recipientName: recipientName.trim(),
        phone: addressPhone.trim(),
        streetAddress: streetAddress.trim(),
        city,
        province,
        isDefault: isDefaultAddress,
      });
    } else {
      res = await addAddress({
        label: addressLabel,
        recipientName: recipientName.trim(),
        phone: addressPhone.trim(),
        streetAddress: streetAddress.trim(),
        city,
        province,
        isDefault: isDefaultAddress,
      });
    }

    setIsSavingAddress(false);

    if (res.success) {
      setIsAddressModalOpen(false);
    } else {
      setAddressError(res.error || 'Failed to save address.');
    }
  };

  // Handle Password Change
  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setPasswordMessage(null);

    if (!currentPassword) {
      setPasswordMessage({ text: 'Please enter your current password.', type: 'error' });
      return;
    }
    if (newPassword.length < 6) {
      setPasswordMessage({ text: 'New password must be at least 6 characters.', type: 'error' });
      return;
    }
    if (newPassword !== confirmPassword) {
      setPasswordMessage({ text: 'New passwords do not match.', type: 'error' });
      return;
    }

    setIsUpdatingPassword(true);
    const res = await changePassword(currentPassword, newPassword);
    setIsUpdatingPassword(false);

    if (res.success) {
      setPasswordMessage({ text: 'Password changed successfully!', type: 'success' });
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
      setTimeout(() => setPasswordMessage(null), 4000);
    } else {
      setPasswordMessage({ text: res.error || 'Failed to update password.', type: 'error' });
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-sans w-full max-w-full overflow-x-hidden">
      <Navbar />

      <main className="flex-1 max-w-6xl mx-auto w-full px-3 sm:px-6 lg:px-8 py-6 sm:py-12">
        {/* Breadcrumb Navigation */}
        <nav className="flex items-center gap-2 text-xs text-slate-500 mb-6">
          <Link href="/" className="hover:text-[#136ab5] transition-colors">
            Home
          </Link>
          <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
          <span className="text-slate-900 font-bold">My Account</span>
        </nav>

        {/* Account Header Hero */}
        <div className="bg-gradient-to-r from-slate-900 via-cyan-950 to-slate-900 rounded-3xl p-6 sm:p-8 text-white shadow-xl mb-8 flex flex-col md:flex-row items-start md:items-center justify-between gap-6 relative overflow-hidden">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-2xl bg-[#48afff]/20 border border-[#48afff]/40 text-[#48afff] flex items-center justify-center font-black text-2xl uppercase shadow-md shadow-[#48afff]/20">
              {(profile?.name?.charAt(0) || user.displayName?.charAt(0) || 'U')}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl sm:text-2xl font-black tracking-tight">
                  {profile?.name || user.displayName || 'Nawira Traders Customer'}
                </h1>
                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                  <ShieldCheck className="w-3 h-3" /> PTA Verified
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-1 flex items-center gap-2">
                <Phone className="w-3.5 h-3.5 text-[#48afff]" />
                <span>{profile?.phone || (user.email ? user.email.replace(/@(naviratraders\.pk|hamzaphonestore\.pk|voltphone\.pk)/, '') : '')}</span>
                <span className="text-slate-600">•</span>
                <span className="text-slate-400">Open-Parcel Delivery Member</span>
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <Link
              href="/account/orders"
              className="btn-press flex items-center gap-2 px-4 py-2.5 rounded-2xl bg-white/10 hover:bg-white/20 border border-white/20 text-white text-xs font-bold transition-all shadow-xs"
            >
              <ShoppingBag className="w-4 h-4 text-[#48afff]" />
              <span>View My Orders</span>
            </Link>
          </div>
        </div>

        {/* Dashboard Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* Navigation Sidebar (Desktop) / Horizontal Tabs Rail (Mobile) */}
          <div className="lg:col-span-1 flex lg:flex-col gap-2 overflow-x-auto scrollbar-none pb-1">
            <button
              onClick={() => setActiveTab('profile')}
              className={`shrink-0 lg:w-full flex items-center gap-3 px-4 py-3 rounded-2xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap lg:whitespace-normal text-left ${
                activeTab === 'profile'
                  ? 'bg-slate-950 text-white shadow-md'
                  : 'bg-white hover:bg-slate-100 text-slate-700 border border-slate-200/80'
              }`}
            >
              <User className={`w-4 h-4 ${activeTab === 'profile' ? 'text-[#48afff]' : 'text-slate-400'}`} />
              <span>Profile &amp; Personal Info</span>
            </button>

            <button
              onClick={() => setActiveTab('addresses')}
              className={`shrink-0 lg:w-full flex items-center justify-between gap-3 px-4 py-3 rounded-2xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap lg:whitespace-normal text-left ${
                activeTab === 'addresses'
                  ? 'bg-slate-950 text-white shadow-md'
                  : 'bg-white hover:bg-slate-100 text-slate-700 border border-slate-200/80'
              }`}
            >
              <div className="flex items-center gap-3">
                <MapPin className={`w-4 h-4 ${activeTab === 'addresses' ? 'text-[#48afff]' : 'text-slate-400'}`} />
                <span>Saved Addresses</span>
              </div>
              <span className={`text-[10px] px-2 py-0.5 rounded-full font-black ${
                activeTab === 'addresses' ? 'bg-[#48afff] text-slate-950' : 'bg-slate-100 text-slate-600'
              }`}>
                {profile?.addresses?.length || 0}
              </span>
            </button>

            <button
              onClick={() => setActiveTab('security')}
              className={`shrink-0 lg:w-full flex items-center gap-3 px-4 py-3 rounded-2xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap lg:whitespace-normal text-left ${
                activeTab === 'security'
                  ? 'bg-slate-950 text-white shadow-md'
                  : 'bg-white hover:bg-slate-100 text-slate-700 border border-slate-200/80'
              }`}
            >
              <Lock className={`w-4 h-4 ${activeTab === 'security' ? 'text-[#48afff]' : 'text-slate-400'}`} />
              <span>Change Password</span>
            </button>

            <Link
              href="/account/orders"
              className="shrink-0 lg:w-full flex items-center justify-between gap-3 px-4 py-3 rounded-2xl text-xs font-bold bg-white hover:bg-sky-50/60 text-slate-700 hover:text-[#136ab5] border border-slate-200/80 transition-all whitespace-nowrap lg:whitespace-normal text-left"
            >
              <div className="flex items-center gap-3">
                <ShoppingBag className="w-4 h-4 text-[#136ab5]" />
                <span>Order History</span>
              </div>
              <ChevronRight className="w-4 h-4 text-slate-400" />
            </Link>
          </div>

          {/* Right Main Content Panel */}
          <div className="lg:col-span-3">
            {/* 1. PROFILE TAB */}
            {activeTab === 'profile' && (
              <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200/90 shadow-sm space-y-6">
                <div>
                  <h2 className="text-base font-bold text-slate-950">Profile Information</h2>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Update your full recipient name used on shipment invoices and Open-Parcel delivery.
                  </p>
                </div>

                {profileMessage && (
                  <div
                    className={`p-4 rounded-2xl text-xs flex items-center gap-2.5 ${
                      profileMessage.type === 'success'
                        ? 'bg-emerald-50 border border-emerald-200 text-emerald-800'
                        : 'bg-rose-50 border border-rose-200 text-rose-700'
                    }`}
                  >
                    {profileMessage.type === 'success' ? (
                      <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0" />
                    ) : (
                      <AlertCircle className="w-4 h-4 text-rose-600 flex-shrink-0" />
                    )}
                    <span>{profileMessage.text}</span>
                  </div>
                )}

                <form onSubmit={handleSaveProfile} className="space-y-4 max-w-lg">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1.5">
                      Full Name
                    </label>
                    <input
                      type="text"
                      required
                      value={nameInput}
                      onChange={(e) => setNameInput(e.target.value)}
                      placeholder="e.g. Muhammad Ali"
                      className="w-full px-4 py-2.5 rounded-2xl border border-slate-200 bg-slate-50 text-xs text-slate-900 font-medium focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#48afff] focus:border-[#48afff] transition-all"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1.5">
                      Registered Mobile Number (Pakistan)
                    </label>
                    <div className="relative">
                      <input
                        type="text"
                        disabled
                        value={profile?.phone || (user.email ? user.email.replace(/@(naviratraders\.pk|hamzaphonestore\.pk|voltphone\.pk)/, '') : '') || ''}
                        className="w-full px-4 py-2.5 rounded-2xl border border-slate-200 bg-slate-100 text-xs text-slate-500 font-semibold cursor-not-allowed"
                      />
                      <span className="absolute right-3.5 top-1/2 -translate-y-1/2 text-[10px] font-bold text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded-full">
                        Verified Mobile
                      </span>
                    </div>
                    <span className="text-[10px] text-slate-400 mt-1 block">
                      Your 11-digit mobile number is your primary account login ID.
                    </span>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1.5">
                      Nawira Traders Account ID
                    </label>
                    <input
                      type="text"
                      disabled
                      value={user.uid}
                      className="w-full px-4 py-2.5 rounded-2xl border border-slate-200 bg-slate-100 text-[11px] font-mono text-slate-500 cursor-not-allowed"
                    />
                  </div>

                  <div className="pt-2">
                    <button
                      type="submit"
                      disabled={isUpdatingProfile}
                      className="py-2.5 px-6 rounded-2xl bg-[#136ab5] hover:bg-[#0f5492] active:scale-98 text-white font-bold text-xs tracking-wide transition-all shadow-md shadow-cyan-600/20 cursor-pointer disabled:opacity-60"
                    >
                      {isUpdatingProfile ? 'Saving...' : 'Save Changes'}
                    </button>
                  </div>
                </form>
              </div>
            )}

            {/* 2. SAVED ADDRESSES TAB */}
            {activeTab === 'addresses' && (
              <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200/90 shadow-sm space-y-6">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div>
                    <h2 className="text-base font-bold text-slate-950">Saved Delivery Addresses</h2>
                    <p className="text-xs text-slate-500 mt-0.5">
                      Manage multiple shipping locations across Pakistan for fast 1-click checkout.
                    </p>
                  </div>
                  <button
                    onClick={handleOpenNewAddress}
                    className="btn-press inline-flex items-center gap-2 px-4 py-2.5 rounded-2xl bg-[#136ab5] hover:bg-[#0f5492] text-white font-bold text-xs tracking-wide shadow-md shadow-cyan-600/20 transition-all cursor-pointer self-start sm:self-auto"
                  >
                    <Plus className="w-4 h-4" />
                    <span>Add New Address</span>
                  </button>
                </div>

                {/* Address Cards List */}
                {profile?.addresses && profile.addresses.length > 0 ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {profile.addresses.map((addr) => (
                      <div
                        key={addr.id}
                        className={`p-5 rounded-2xl border transition-all flex flex-col justify-between ${
                          addr.isDefault
                            ? 'bg-sky-50/40 border-[#48afff] ring-2 ring-[#48afff]/20'
                            : 'bg-white border-slate-200 hover:border-slate-300'
                        }`}
                      >
                        <div className="space-y-2">
                          <div className="flex items-center justify-between gap-2">
                            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-slate-100 text-slate-700 border border-slate-200">
                              {addr.label === 'Office' ? (
                                <Building className="w-3 h-3 text-[#136ab5]" />
                              ) : (
                                <Home className="w-3 h-3 text-[#136ab5]" />
                              )}
                              <span>{addr.label}</span>
                            </span>

                            {addr.isDefault && (
                              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-[#136ab5] text-white shadow-xs">
                                <Check className="w-3 h-3" /> Default Address
                              </span>
                            )}
                          </div>

                          <div className="pt-1">
                            <h4 className="text-xs font-bold text-slate-900">{addr.recipientName}</h4>
                            <p className="text-xs text-slate-600 mt-0.5">{addr.phone}</p>
                            <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                              {addr.streetAddress}, {addr.city}, {addr.province || 'Pakistan'}
                            </p>
                          </div>
                        </div>

                        <div className="flex items-center justify-between pt-4 mt-4 border-t border-slate-100 text-xs">
                          <div>
                            {!addr.isDefault && (
                              <button
                                onClick={() => setDefaultAddress(addr.id)}
                                className="text-[#136ab5] hover:text-[#0d4775] font-bold transition-colors cursor-pointer text-[11px]"
                              >
                                Set as Default
                              </button>
                            )}
                          </div>
                          <div className="flex items-center gap-3">
                            <button
                              onClick={() => handleOpenEditAddress(addr)}
                              className="text-slate-500 hover:text-slate-800 p-1 cursor-pointer transition-colors"
                              title="Edit address"
                            >
                              <Edit2 className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={() => deleteAddress(addr.id)}
                              className="text-rose-500 hover:text-rose-700 p-1 cursor-pointer transition-colors"
                              title="Delete address"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="p-8 rounded-2xl bg-slate-50 border border-slate-200/80 text-center space-y-3">
                    <div className="w-12 h-12 rounded-2xl bg-white border border-slate-200 text-slate-400 flex items-center justify-center mx-auto shadow-xs">
                      <MapPin className="w-6 h-6 stroke-[1.8]" />
                    </div>
                    <div className="space-y-1">
                      <h4 className="text-xs font-bold text-slate-800">No saved addresses yet</h4>
                      <p className="text-[11px] text-slate-500 max-w-sm mx-auto">
                        Add your primary delivery address to speed up checkout on your future smartphone orders.
                      </p>
                    </div>
                    <button
                      onClick={handleOpenNewAddress}
                      className="inline-flex items-center gap-1.5 px-4 py-2 rounded-2xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs transition-all cursor-pointer"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>Add First Address</span>
                    </button>
                  </div>
                )}
              </div>
            )}

            {/* 3. SECURITY / CHANGE PASSWORD TAB */}
            {activeTab === 'security' && (
              <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200/90 shadow-sm space-y-6">
                <div>
                  <h2 className="text-base font-bold text-slate-950">Security &amp; Password</h2>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Update your account password. Must contain at least 6 characters.
                  </p>
                </div>

                {passwordMessage && (
                  <div
                    className={`p-4 rounded-2xl text-xs flex items-center gap-2.5 ${
                      passwordMessage.type === 'success'
                        ? 'bg-emerald-50 border border-emerald-200 text-emerald-800'
                        : 'bg-rose-50 border border-rose-200 text-rose-700'
                    }`}
                  >
                    {passwordMessage.type === 'success' ? (
                      <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0" />
                    ) : (
                      <AlertCircle className="w-4 h-4 text-rose-600 flex-shrink-0" />
                    )}
                    <span>{passwordMessage.text}</span>
                  </div>
                )}

                <form onSubmit={handleChangePassword} className="space-y-4 max-w-lg">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1.5">
                      Current Password
                    </label>
                    <input
                      type="password"
                      required
                      value={currentPassword}
                      onChange={(e) => setCurrentPassword(e.target.value)}
                      placeholder="••••••••"
                      className="w-full px-4 py-2.5 rounded-2xl border border-slate-200 bg-slate-50 text-xs text-slate-900 font-medium focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#48afff] focus:border-[#48afff] transition-all"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1.5">
                      New Password (min 6 characters)
                    </label>
                    <input
                      type="password"
                      required
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      placeholder="••••••••"
                      className="w-full px-4 py-2.5 rounded-2xl border border-slate-200 bg-slate-50 text-xs text-slate-900 font-medium focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#48afff] focus:border-[#48afff] transition-all"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1.5">
                      Confirm New Password
                    </label>
                    <input
                      type="password"
                      required
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      placeholder="••••••••"
                      className="w-full px-4 py-2.5 rounded-2xl border border-slate-200 bg-slate-50 text-xs text-slate-900 font-medium focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#48afff] focus:border-[#48afff] transition-all"
                    />
                  </div>

                  <div className="pt-2">
                    <button
                      type="submit"
                      disabled={isUpdatingPassword}
                      className="py-2.5 px-6 rounded-2xl bg-[#136ab5] hover:bg-[#0f5492] active:scale-98 text-white font-bold text-xs tracking-wide transition-all shadow-md shadow-cyan-600/20 cursor-pointer disabled:opacity-60"
                    >
                      {isUpdatingPassword ? 'Updating...' : 'Update Password'}
                    </button>
                  </div>
                </form>
              </div>
            )}
          </div>
        </div>
      </main>

      {/* Address Edit/Add Modal */}
      {isAddressModalOpen && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-950/60 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="relative w-full max-w-lg bg-white rounded-3xl shadow-2xl border border-slate-200 p-6 sm:p-7 space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-base font-bold text-slate-950">
                  {editingAddressId ? 'Edit Address' : 'Add New Delivery Address'}
                </h3>
                <p className="text-[11px] text-slate-500">
                  Enter your exact Pakistani postal or residence address.
                </p>
              </div>
              <button
                onClick={() => setIsAddressModalOpen(false)}
                className="p-1.5 rounded-full text-slate-400 hover:text-slate-700 transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {addressError && (
              <div className="p-3 rounded-2xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 flex-shrink-0" />
                <span>{addressError}</span>
              </div>
            )}

            <form onSubmit={handleSaveAddress} className="space-y-3.5">
              <div className="flex gap-2">
                {['Home', 'Office', 'Other'].map((lbl) => (
                  <button
                    key={lbl}
                    type="button"
                    onClick={() => setAddressLabel(lbl)}
                    className={`flex-1 py-1.5 rounded-xl text-xs font-bold border transition-all cursor-pointer ${
                      addressLabel === lbl
                        ? 'bg-slate-950 text-white border-slate-950'
                        : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'
                    }`}
                  >
                    {lbl}
                  </button>
                ))}
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Recipient Name
                  </label>
                  <input
                    type="text"
                    required
                    value={recipientName}
                    onChange={(e) => setRecipientName(e.target.value)}
                    placeholder="Muhammad Ali"
                    className="w-full px-3.5 py-2 rounded-xl border border-slate-200 text-xs bg-slate-50 focus:bg-white focus:ring-2 focus:ring-[#48afff]"
                  />
                </div>
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="block text-xs font-bold text-slate-700">
                      Phone Number
                    </label>
                    <span className={`text-[10px] font-mono font-bold ${addressPhone.length === 11 ? 'text-emerald-600' : 'text-slate-400'}`}>
                      {addressPhone.length}/11
                    </span>
                  </div>
                  <input
                    type="tel"
                    inputMode="numeric"
                    autoComplete="tel"
                    maxLength={11}
                    required
                    value={addressPhone}
                    onChange={(e) => setAddressPhone(e.target.value.replace(/\D/g, '').slice(0, 11))}
                    placeholder="03001234567"
                    className="w-full px-3.5 py-2 rounded-xl border border-slate-200 text-xs bg-slate-50 focus:bg-white focus:ring-2 focus:ring-[#48afff]"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Street Address (House #, Street, Sector / Area)
                </label>
                <input
                  type="text"
                  required
                  value={streetAddress}
                  onChange={(e) => setStreetAddress(e.target.value)}
                  placeholder="House # 12, Street 4, Sector F-7/2"
                  className="w-full px-3.5 py-2 rounded-xl border border-slate-200 text-xs bg-slate-50 focus:bg-white focus:ring-2 focus:ring-[#48afff]"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    City
                  </label>
                  <select
                    value={city}
                    onChange={(e) => setCity(e.target.value)}
                    className="w-full px-3.5 py-2 rounded-xl border border-slate-200 text-xs bg-slate-50 focus:bg-white focus:ring-2 focus:ring-[#48afff]"
                  >
                    {PAKISTAN_CITIES.map((c) => (
                      <option key={c} value={c}>
                        {c}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Province
                  </label>
                  <select
                    value={province}
                    onChange={(e) => setProvince(e.target.value)}
                    className="w-full px-3.5 py-2 rounded-xl border border-slate-200 text-xs bg-slate-50 focus:bg-white focus:ring-2 focus:ring-[#48afff]"
                  >
                    <option value="Punjab">Punjab</option>
                    <option value="Sindh">Sindh</option>
                    <option value="Khyber Pakhtunkhwa">Khyber Pakhtunkhwa</option>
                    <option value="Balochistan">Balochistan</option>
                    <option value="Islamabad Capital Territory">Islamabad (ICT)</option>
                    <option value="Azad Kashmir">Azad Kashmir</option>
                    <option value="Gilgit-Baltistan">Gilgit-Baltistan</option>
                  </select>
                </div>
              </div>

              <div className="flex items-center gap-2 pt-1">
                <input
                  type="checkbox"
                  id="defaultAddressCheckbox"
                  checked={isDefaultAddress}
                  onChange={(e) => setIsDefaultAddress(e.target.checked)}
                  className="w-4 h-4 rounded text-[#136ab5] focus:ring-[#48afff]"
                />
                <label htmlFor="defaultAddressCheckbox" className="text-xs text-slate-700 font-medium">
                  Set as default delivery address
                </label>
              </div>

              <div className="flex justify-end gap-2.5 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsAddressModalOpen(false)}
                  className="px-4 py-2 rounded-xl border border-slate-200 text-xs font-bold text-slate-600 hover:bg-slate-100 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSavingAddress}
                  className="px-5 py-2 rounded-xl bg-[#136ab5] hover:bg-[#0f5492] text-white text-xs font-bold shadow-md shadow-cyan-600/20 transition-all cursor-pointer disabled:opacity-60"
                >
                  {isSavingAddress ? 'Saving...' : 'Save Address'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <Footer />
    </div>
  );
}
