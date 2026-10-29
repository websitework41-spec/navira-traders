import { initializeApp, getApps, getApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

// Nawira Traders Firebase Configuration
export const firebaseConfig = {
  apiKey: "AIzaSyB4ZMA-IE5LRVaEU9mtT36CPjIlS9fb2t4",
  authDomain: "navira-traders.firebaseapp.com",
  projectId: "navira-traders",
  storageBucket: "navira-traders.firebasestorage.app",
  messagingSenderId: "75804014654",
  appId: "1:75804014654:web:5f425da96b1261f0af796f",
  measurementId: "G-5V6RN5BWF5"
};

// Singleton App initialization
export const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();
export const auth = getAuth(app);
export const db = getFirestore(app);

/**
 * Validates a Pakistani mobile number.
 * Accepts formats: 03001234567, 0300-1234567, +923001234567, 923001234567
 * Returns clean standard 11-digit phone starting with 03 (e.g. 03001234567).
 */
export function validatePakistaniMobile(phone: string): { isValid: boolean; cleanPhone: string; error?: string } {
  if (!phone || typeof phone !== 'string') {
    return { isValid: false, cleanPhone: '', error: 'Mobile number is required.' };
  }

  let clean = phone.trim().replace(/[\s\-\(\)]/g, '');
  if (clean.startsWith('+92')) {
    clean = '0' + clean.slice(3);
  } else if (clean.startsWith('92') && clean.length === 12) {
    clean = '0' + clean.slice(2);
  }

  if (!/^03\d{9}$/.test(clean)) {
    return {
      isValid: false,
      cleanPhone: clean,
      error: 'Enter a valid 11-digit Pakistani mobile number starting with 03 (e.g. 03001234567).'
    };
  }

  return { isValid: true, cleanPhone: clean };
}

/**
 * Converts a Pakistani mobile number into a stable synthetic email address.
 * E.g. 03001234567 -> 03001234567@nawiratraders.com
 */
export function phoneToSyntheticEmail(phone: string): string {
  const result = validatePakistaniMobile(phone);
  const clean = result.isValid ? result.cleanPhone : phone.replace(/\D/g, '');
  return `${clean}@nawiratraders.com`;
}
