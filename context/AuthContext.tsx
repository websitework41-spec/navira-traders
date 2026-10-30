'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';
import {
  User,
  onAuthStateChanged,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  updateProfile as updateFirebaseProfile,
  updatePassword as updateFirebasePassword,
  EmailAuthProvider,
  reauthenticateWithCredential,
} from 'firebase/auth';
import {
  doc,
  setDoc,
  onSnapshot,
  serverTimestamp,
} from 'firebase/firestore';
import {
  auth,
  db,
  validatePakistaniMobile,
  phoneToSyntheticEmail,
} from '@/lib/firebase';

export interface SavedAddress {
  id: string;
  label: string; // 'Home' | 'Office' | 'Other'
  recipientName: string;
  phone: string;
  streetAddress: string;
  city: string;
  province?: string;
  isDefault: boolean;
}

export interface UserProfile {
  uid: string;
  name: string;
  phone: string;
  email: string;
  addresses: SavedAddress[];
  createdAt?: any;
  updatedAt?: any;
}

interface AuthContextType {
  user: User | null;
  profile: UserProfile | null;
  loading: boolean;
  isAuthModalOpen: boolean;
  authModalMode: 'login' | 'signup' | 'forgot';
  openAuthModal: (mode?: 'login' | 'signup' | 'forgot') => void;
  closeAuthModal: () => void;
  signup: (
    name: string,
    phone: string,
    password: string
  ) => Promise<{ success: boolean; error?: string }>;
  login: (
    phone: string,
    password: string
  ) => Promise<{ success: boolean; error?: string }>;
  logout: () => Promise<void>;
  updateProfileName: (
    name: string
  ) => Promise<{ success: boolean; error?: string }>;
  addAddress: (
    address: Omit<SavedAddress, 'id'>
  ) => Promise<{ success: boolean; error?: string }>;
  updateAddress: (
    id: string,
    address: Partial<SavedAddress>
  ) => Promise<{ success: boolean; error?: string }>;
  deleteAddress: (id: string) => Promise<{ success: boolean; error?: string }>;
  setDefaultAddress: (id: string) => Promise<{ success: boolean; error?: string }>;
  changePassword: (
    currentPass: string,
    newPass: string
  ) => Promise<{ success: boolean; error?: string }>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const LOCAL_STORAGE_KEY_PREFIX = 'nawira_profile_';

function getLocalProfile(uid: string): UserProfile | null {
  if (typeof window === 'undefined') return null;
  try {
    const raw = localStorage.getItem(`${LOCAL_STORAGE_KEY_PREFIX}${uid}`);
    if (raw) return JSON.parse(raw);
  } catch (e) {
    console.warn('Failed to read local profile:', e);
  }
  return null;
}

function saveLocalProfile(uid: string, profile: UserProfile) {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(`${LOCAL_STORAGE_KEY_PREFIX}${uid}`, JSON.stringify(profile));
    if (profile.phone) {
      localStorage.setItem(`nawira_phone_${profile.phone}`, JSON.stringify(profile));
    }
  } catch (e) {
    console.warn('Failed to write local profile:', e);
  }
}

function withTimeout<T>(promise: Promise<T>, ms: number): Promise<T> {
  return Promise.race([
    promise,
    new Promise<T>((_, reject) =>
      setTimeout(() => reject(new Error(`Timeout after ${ms}ms`)), ms)
    ),
  ]);
}

async function syncProfileToFirestore(uid: string, profileData: Partial<UserProfile>) {
  try {
    const userDocRef = doc(db, 'users', uid);
    await withTimeout(
      setDoc(userDocRef, { ...profileData, updatedAt: serverTimestamp() }, { merge: true }),
      2000
    );
  } catch (err) {
    // Firestore may fail due to permissions, offline, or rule restrictions.
    // Local profile is already saved and functional.
    console.warn('Firestore sync notice (local profile active):', err);
  }
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  // Modal State
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [authModalMode, setAuthModalMode] = useState<'login' | 'signup' | 'forgot'>('login');

  const openAuthModal = (mode: 'login' | 'signup' | 'forgot' = 'login') => {
    setAuthModalMode(mode);
    setIsAuthModalOpen(true);
  };

  const closeAuthModal = () => {
    setIsAuthModalOpen(false);
  };

  useEffect(() => {
    let unsubscribeFirestore: (() => void) | null = null;

    const unsubscribeAuth = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);

      if (unsubscribeFirestore) {
        unsubscribeFirestore();
        unsubscribeFirestore = null;
      }

      if (currentUser) {
        // Fast local hydrate first
        const cached = getLocalProfile(currentUser.uid);
        const phoneFromEmail = currentUser.email
          ? currentUser.email.replace(/@(naviratraders\.pk|hamzaphonestore\.pk|voltphone\.pk|nawiratraders\.com)/, '')
          : '';

        const baseProfile: UserProfile = cached || {
          uid: currentUser.uid,
          name: currentUser.displayName || 'Nawira Traders Customer',
          phone: phoneFromEmail,
          email: currentUser.email || `${phoneFromEmail}@nawiratraders.com`,
          addresses: [],
        };

        setProfile(baseProfile);
        setLoading(false);

        // Firestore listener with graceful error handling
        try {
          const userDocRef = doc(db, 'users', currentUser.uid);
          unsubscribeFirestore = onSnapshot(
            userDocRef,
            (snapshot) => {
              if (snapshot.exists()) {
                const data = snapshot.data() as UserProfile;
                const merged: UserProfile = {
                  ...baseProfile,
                  ...data,
                  addresses: data.addresses && data.addresses.length > 0 ? data.addresses : baseProfile.addresses,
                };
                setProfile(merged);
                saveLocalProfile(currentUser.uid, merged);
              }
            },
            (err) => {
              console.warn('Firestore snapshot listener notice (local profile active):', err);
            }
          );
        } catch (err) {
          console.warn('Firestore initialization notice:', err);
        }
      } else {
        setProfile(null);
        setLoading(false);
      }
    });

    return () => {
      unsubscribeAuth();
      if (unsubscribeFirestore) {
        unsubscribeFirestore();
      }
    };
  }, []);

  // 1. Signup Flow
  const signup = async (name: string, phone: string, password: string) => {
    const trimmedName = name.trim();
    if (!trimmedName || trimmedName.length < 2) {
      return { success: false, error: 'Please enter your full name (at least 2 characters).' };
    }

    const phoneCheck = validatePakistaniMobile(phone);
    if (!phoneCheck.isValid) {
      return { success: false, error: phoneCheck.error || 'Invalid Pakistani mobile number.' };
    }

    if (!password || password.length < 6) {
      return { success: false, error: 'Password must be at least 6 characters long.' };
    }

    const syntheticEmail = phoneToSyntheticEmail(phoneCheck.cleanPhone);

    try {
      // 1. Create user in Firebase Auth with 7-second timeout protection
      const userCredential = await withTimeout(
        createUserWithEmailAndPassword(auth, syntheticEmail, password),
        7000
      );

      // 2. Set Firebase Auth displayName
      await updateFirebaseProfile(userCredential.user, {
        displayName: trimmedName,
      }).catch((e) => console.warn('Could not update Firebase displayName:', e));

      // 3. Assemble profile
      const newProfile: UserProfile = {
        uid: userCredential.user.uid,
        name: trimmedName,
        phone: phoneCheck.cleanPhone,
        email: syntheticEmail,
        addresses: [],
        createdAt: new Date().toISOString(),
      };

      // 4. Instantly store locally & update state
      saveLocalProfile(userCredential.user.uid, newProfile);
      setProfile(newProfile);

      // 5. Sync to Firestore in background (non-blocking)
      syncProfileToFirestore(userCredential.user.uid, newProfile);

      return { success: true };
    } catch (err: any) {
      console.error('Signup error:', err);

      // If user was created during an earlier attempt (or test), seamlessly sign them in!
      if (err.code === 'auth/email-already-in-use') {
        try {
          const signinRes = await withTimeout(
            signInWithEmailAndPassword(auth, syntheticEmail, password),
            4000
          );
          if (signinRes.user) {
            await updateFirebaseProfile(signinRes.user, { displayName: trimmedName }).catch(() => {});
            const existingLocal = getLocalProfile(signinRes.user.uid);
            const resolvedProfile: UserProfile = existingLocal || {
              uid: signinRes.user.uid,
              name: trimmedName,
              phone: phoneCheck.cleanPhone,
              email: syntheticEmail,
              addresses: [],
            };
            resolvedProfile.name = trimmedName;
            saveLocalProfile(signinRes.user.uid, resolvedProfile);
            setProfile(resolvedProfile);
            syncProfileToFirestore(signinRes.user.uid, resolvedProfile);
            return { success: true };
          }
        } catch {
          return {
            success: false,
            error: `Mobile number ${phoneCheck.cleanPhone} is already registered. Please log in or use account recovery.`,
          };
        }
      }

      if (err.code === 'auth/weak-password') {
        return {
          success: false,
          error: 'Password is too weak. Please use at least 6 characters.',
        };
      }

      if (err.message && err.message.includes('timed out')) {
        return {
          success: false,
          error: 'Connection timed out. Please check your internet connection and try again.',
        };
      }

      return {
        success: false,
        error: err.message || 'Failed to create account. Please try again.',
      };
    }
  };

  // 2. Login Flow
  const login = async (phone: string, password: string) => {
    const phoneCheck = validatePakistaniMobile(phone);
    if (!phoneCheck.isValid) {
      return { success: false, error: phoneCheck.error || 'Invalid Pakistani mobile number.' };
    }

    if (!password) {
      return { success: false, error: 'Please enter your password.' };
    }

    const syntheticEmail = phoneToSyntheticEmail(phoneCheck.cleanPhone);

    try {
      const userCredential = await withTimeout(
        signInWithEmailAndPassword(auth, syntheticEmail, password),
        7000
      );

      // Hydrate profile immediately from local cache or construct fallback
      const cached = getLocalProfile(userCredential.user.uid);
      const userProfile: UserProfile = cached || {
        uid: userCredential.user.uid,
        name: userCredential.user.displayName || 'Nawira Traders Customer',
        phone: phoneCheck.cleanPhone,
        email: syntheticEmail,
        addresses: [],
      };
      setProfile(userProfile);
      saveLocalProfile(userCredential.user.uid, userProfile);

      return { success: true };
    } catch (err: any) {
      // Legacy fallback: check if account was originally created with @voltphone.pk
      if (
        (err.code === 'auth/invalid-credential' ||
          err.code === 'auth/user-not-found' ||
          err.code === 'auth/wrong-password') &&
        syntheticEmail.endsWith('@nawiratraders.com')
      ) {
        try {
          const legacyEmail = `${phoneCheck.cleanPhone}@voltphone.pk`;
          const legacyRes = await withTimeout(
            signInWithEmailAndPassword(auth, legacyEmail, password),
            4000
          );
          if (legacyRes.user) {
            const cached = getLocalProfile(legacyRes.user.uid);
            const userProfile: UserProfile = cached || {
              uid: legacyRes.user.uid,
              name: legacyRes.user.displayName || 'Nawira Traders Customer',
              phone: phoneCheck.cleanPhone,
              email: legacyEmail,
              addresses: [],
            };
            setProfile(userProfile);
            saveLocalProfile(legacyRes.user.uid, userProfile);
            return { success: true };
          }
        } catch {
          // Continue to standard error reporting
        }
      }

      console.error('Login error:', err);
      if (
        err.code === 'auth/invalid-credential' ||
        err.code === 'auth/user-not-found' ||
        err.code === 'auth/wrong-password'
      ) {
        return {
          success: false,
          error: 'Incorrect mobile number or password. Please verify and try again.',
        };
      }
      if (err.code === 'auth/too-many-requests') {
        return {
          success: false,
          error: 'Too many failed login attempts. Please wait a few minutes before trying again.',
        };
      }
      return {
        success: false,
        error: err.message || 'Login failed. Please verify your credentials.',
      };
    }
  };

  // 3. Logout Flow
  const logout = async () => {
    try {
      await signOut(auth);
      setProfile(null);
    } catch (err) {
      console.error('Logout error:', err);
    }
  };

  // 4. Update Profile Name
  const updateProfileName = async (name: string) => {
    if (!user) return { success: false, error: 'User is not logged in.' };
    const trimmed = name.trim();
    if (!trimmed || trimmed.length < 2) {
      return { success: false, error: 'Please enter a valid full name.' };
    }

    try {
      await updateFirebaseProfile(user, { displayName: trimmed }).catch(() => {});
      const updatedProfile: UserProfile = profile
        ? { ...profile, name: trimmed }
        : {
            uid: user.uid,
            name: trimmed,
            phone: '',
            email: user.email || '',
            addresses: [],
          };
      setProfile(updatedProfile);
      saveLocalProfile(user.uid, updatedProfile);
      syncProfileToFirestore(user.uid, { name: trimmed });
      return { success: true };
    } catch (err: any) {
      return { success: false, error: err.message || 'Failed to update name.' };
    }
  };

  // 5. Add Address
  const addAddress = async (addressData: Omit<SavedAddress, 'id'>) => {
    if (!user) return { success: false, error: 'User not logged in.' };

    const newId = `addr_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
    const currentAddresses = profile?.addresses || [];

    const shouldBeDefault = addressData.isDefault || currentAddresses.length === 0;
    const updatedList = currentAddresses.map((a) =>
      shouldBeDefault ? { ...a, isDefault: false } : a
    );

    const newAddress: SavedAddress = {
      ...addressData,
      id: newId,
      isDefault: shouldBeDefault,
    };

    const nextAddresses = [...updatedList, newAddress];
    const nextProfile: UserProfile = profile
      ? { ...profile, addresses: nextAddresses }
      : {
          uid: user.uid,
          name: user.displayName || 'Nawira Customer',
          phone: '',
          email: user.email || '',
          addresses: nextAddresses,
        };

    setProfile(nextProfile);
    saveLocalProfile(user.uid, nextProfile);
    syncProfileToFirestore(user.uid, { addresses: nextAddresses });
    return { success: true };
  };

  // 6. Update Address
  const updateAddress = async (id: string, addressData: Partial<SavedAddress>) => {
    if (!user) return { success: false, error: 'User not logged in.' };

    const currentAddresses = profile?.addresses || [];
    const isNowDefault = addressData.isDefault;

    const nextAddresses = currentAddresses.map((a) => {
      if (a.id === id) {
        return { ...a, ...addressData };
      }
      if (isNowDefault) {
        return { ...a, isDefault: false };
      }
      return a;
    });

    const nextProfile: UserProfile = profile
      ? { ...profile, addresses: nextAddresses }
      : {
          uid: user.uid,
          name: user.displayName || 'Nawira Customer',
          phone: '',
          email: user.email || '',
          addresses: nextAddresses,
        };

    setProfile(nextProfile);
    saveLocalProfile(user.uid, nextProfile);
    syncProfileToFirestore(user.uid, { addresses: nextAddresses });
    return { success: true };
  };

  // 7. Delete Address
  const deleteAddress = async (id: string) => {
    if (!user) return { success: false, error: 'User not logged in.' };

    const currentAddresses = profile?.addresses || [];
    const target = currentAddresses.find((a) => a.id === id);
    const filtered = currentAddresses.filter((a) => a.id !== id);

    if (target?.isDefault && filtered.length > 0) {
      filtered[0].isDefault = true;
    }

    const nextProfile: UserProfile = profile
      ? { ...profile, addresses: filtered }
      : {
          uid: user.uid,
          name: user.displayName || 'Nawira Customer',
          phone: '',
          email: user.email || '',
          addresses: filtered,
        };

    setProfile(nextProfile);
    saveLocalProfile(user.uid, nextProfile);
    syncProfileToFirestore(user.uid, { addresses: filtered });
    return { success: true };
  };

  // 8. Set Default Address
  const setDefaultAddress = async (id: string) => {
    if (!user) return { success: false, error: 'User not logged in.' };

    const currentAddresses = profile?.addresses || [];
    const nextAddresses = currentAddresses.map((a) => ({
      ...a,
      isDefault: a.id === id,
    }));

    const nextProfile: UserProfile = profile
      ? { ...profile, addresses: nextAddresses }
      : {
          uid: user.uid,
          name: user.displayName || 'Nawira Customer',
          phone: '',
          email: user.email || '',
          addresses: nextAddresses,
        };

    setProfile(nextProfile);
    saveLocalProfile(user.uid, nextProfile);
    syncProfileToFirestore(user.uid, { addresses: nextAddresses });
    return { success: true };
  };

  // 9. Change Password
  const changePassword = async (currentPass: string, newPass: string) => {
    if (!user || !user.email) return { success: false, error: 'User not logged in.' };

    if (!newPass || newPass.length < 6) {
      return { success: false, error: 'New password must be at least 6 characters long.' };
    }

    try {
      const credential = EmailAuthProvider.credential(user.email, currentPass);
      await withTimeout(reauthenticateWithCredential(user, credential), 6000);
      await withTimeout(updateFirebasePassword(user, newPass), 6000);
      return { success: true };
    } catch (err: any) {
      if (err.code === 'auth/wrong-password' || err.code === 'auth/invalid-credential') {
        return { success: false, error: 'Current password is incorrect.' };
      }
      return { success: false, error: err.message || 'Failed to change password.' };
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        profile,
        loading,
        isAuthModalOpen,
        authModalMode,
        openAuthModal,
        closeAuthModal,
        signup,
        login,
        logout,
        updateProfileName,
        addAddress,
        updateAddress,
        deleteAddress,
        setDefaultAddress,
        changePassword,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
