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
  getDoc,
  setDoc,
  updateDoc,
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

    const unsubscribeAuth = onAuthStateChanged(auth, async (currentUser) => {
      setUser(currentUser);

      if (unsubscribeFirestore) {
        unsubscribeFirestore();
        unsubscribeFirestore = null;
      }

      if (currentUser) {
        const userDocRef = doc(db, 'users', currentUser.uid);

        // Listen for realtime changes to the user document
        unsubscribeFirestore = onSnapshot(
          userDocRef,
          async (snapshot) => {
            if (snapshot.exists()) {
              setProfile(snapshot.data() as UserProfile);
              setLoading(false);
            } else {
              // Create user doc if not yet existing
              const phoneFromEmail = currentUser.email
                ? currentUser.email.replace(/@(naviratraders\.pk|hamzaphonestore\.pk|voltphone\.pk)/, '')
                : '';
              const newProfile: UserProfile = {
                uid: currentUser.uid,
                name: currentUser.displayName || 'Nawira Traders Customer',
                phone: phoneFromEmail,
                email: currentUser.email || `${phoneFromEmail}@nawiratraders.com`,
                addresses: [],
                createdAt: serverTimestamp(),
              };
              try {
                await setDoc(userDocRef, newProfile);
                setProfile(newProfile);
              } catch (err) {
                console.error('Error creating user profile in Firestore:', err);
                setProfile(newProfile);
              }
              setLoading(false);
            }
          },
          (err) => {
            console.warn('Firestore snapshot listener warning:', err);
            // Fallback profile if Firestore is restricted
            setProfile({
              uid: currentUser.uid,
              name: currentUser.displayName || 'Nawira Traders Customer',
              phone: currentUser.email ? currentUser.email.replace(/@(naviratraders\.pk|hamzaphonestore\.pk|voltphone\.pk)/, '') : '',
              email: currentUser.email || '',
              addresses: [],
            });
            setLoading(false);
          }
        );
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
      const userCredential = await createUserWithEmailAndPassword(
        auth,
        syntheticEmail,
        password
      );

      // Update Firebase Auth profile display name
      await updateFirebaseProfile(userCredential.user, {
        displayName: trimmedName,
      });

      // Write user profile to Firestore
      const userDocRef = doc(db, 'users', userCredential.user.uid);
      const userDocData: UserProfile = {
        uid: userCredential.user.uid,
        name: trimmedName,
        phone: phoneCheck.cleanPhone,
        email: syntheticEmail,
        addresses: [],
        createdAt: serverTimestamp(),
      };

      await setDoc(userDocRef, userDocData);
      setProfile(userDocData);
      return { success: true };
    } catch (err: any) {
      console.error('Signup error:', err);
      if (err.code === 'auth/email-already-in-use') {
        return {
          success: false,
          error: `Mobile number ${phoneCheck.cleanPhone} is already registered. Please log in instead.`,
        };
      }
      if (err.code === 'auth/weak-password') {
        return {
          success: false,
          error: 'Password is too weak. Please use at least 6 characters.',
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
      await signInWithEmailAndPassword(auth, syntheticEmail, password);
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
          await signInWithEmailAndPassword(auth, legacyEmail, password);
          return { success: true };
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
      await updateFirebaseProfile(user, { displayName: trimmed });
      const userDocRef = doc(db, 'users', user.uid);
      await updateDoc(userDocRef, { name: trimmed });
      setProfile((prev) => (prev ? { ...prev, name: trimmed } : null));
      return { success: true };
    } catch (err: any) {
      return { success: false, error: err.message || 'Failed to update name.' };
    }
  };

  // 5. Add Address
  const addAddress = async (addressData: Omit<SavedAddress, 'id'>) => {
    if (!user || !profile) return { success: false, error: 'User not logged in.' };

    const newId = `addr_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
    const currentAddresses = profile.addresses || [];

    // If marked default or first address, make it default and unset others
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

    try {
      const userDocRef = doc(db, 'users', user.uid);
      await updateDoc(userDocRef, { addresses: nextAddresses });
      setProfile((prev) => (prev ? { ...prev, addresses: nextAddresses } : null));
      return { success: true };
    } catch (err: any) {
      return { success: false, error: err.message || 'Failed to add address.' };
    }
  };

  // 6. Update Address
  const updateAddress = async (id: string, addressData: Partial<SavedAddress>) => {
    if (!user || !profile) return { success: false, error: 'User not logged in.' };

    const currentAddresses = profile.addresses || [];
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

    try {
      const userDocRef = doc(db, 'users', user.uid);
      await updateDoc(userDocRef, { addresses: nextAddresses });
      setProfile((prev) => (prev ? { ...prev, addresses: nextAddresses } : null));
      return { success: true };
    } catch (err: any) {
      return { success: false, error: err.message || 'Failed to update address.' };
    }
  };

  // 7. Delete Address
  const deleteAddress = async (id: string) => {
    if (!user || !profile) return { success: false, error: 'User not logged in.' };

    const currentAddresses = profile.addresses || [];
    const target = currentAddresses.find((a) => a.id === id);
    const filtered = currentAddresses.filter((a) => a.id !== id);

    // If we deleted the default address and there are remaining addresses, set first as default
    if (target?.isDefault && filtered.length > 0) {
      filtered[0].isDefault = true;
    }

    try {
      const userDocRef = doc(db, 'users', user.uid);
      await updateDoc(userDocRef, { addresses: filtered });
      setProfile((prev) => (prev ? { ...prev, addresses: filtered } : null));
      return { success: true };
    } catch (err: any) {
      return { success: false, error: err.message || 'Failed to delete address.' };
    }
  };

  // 8. Set Default Address
  const setDefaultAddress = async (id: string) => {
    if (!user || !profile) return { success: false, error: 'User not logged in.' };

    const currentAddresses = profile.addresses || [];
    const nextAddresses = currentAddresses.map((a) => ({
      ...a,
      isDefault: a.id === id,
    }));

    try {
      const userDocRef = doc(db, 'users', user.uid);
      await updateDoc(userDocRef, { addresses: nextAddresses });
      setProfile((prev) => (prev ? { ...prev, addresses: nextAddresses } : null));
      return { success: true };
    } catch (err: any) {
      return { success: false, error: err.message || 'Failed to set default address.' };
    }
  };

  // 9. Change Password
  const changePassword = async (currentPass: string, newPass: string) => {
    if (!user || !user.email) return { success: false, error: 'User not logged in.' };

    if (!newPass || newPass.length < 6) {
      return { success: false, error: 'New password must be at least 6 characters long.' };
    }

    try {
      // Re-authenticate
      const credential = EmailAuthProvider.credential(user.email, currentPass);
      await reauthenticateWithCredential(user, credential);
      // Update password
      await updateFirebasePassword(user, newPass);
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
