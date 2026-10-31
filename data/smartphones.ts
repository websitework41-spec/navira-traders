import { Smartphone } from '@/types';
import rawData from './smartphones.json';

export const SMARTPHONES: Smartphone[] = (rawData as unknown) as Smartphone[];

export const BRANDS = [
  'All Brands',
  'Samsung',
  'Apple',
  'Xiaomi',
  'Nokia',
  'Itel',
  'Vivo',
  'Oppo',
  'Infinix',
  'Tecno',
  'Realme',
  'Honor',
  'Oraimo',
  'OnePlus',
  'Google',
  'Motorola',
  'Nothing',
  'Huawei',
  'Sony',
];

export const ACCESSORY_CATEGORIES = [
  'All Accessories',
  'Smart Watches',
  'Wireless Earbuds',
  'Charging Cables',
];

export const RAM_OPTIONS = ['3GB', '4GB', '6GB', '8GB', '12GB', '16GB'];
export const STORAGE_OPTIONS = ['64GB', '128GB', '256GB', '512GB', '1TB'];

export const PAKISTAN_CITIES = [
  'Karachi',
  'Lahore',
  'Islamabad',
  'Rawalpindi',
  'Faisalabad',
  'Multan',
  'Peshawar',
  'Quetta',
  'Sialkot',
  'Gujranwala',
  'Hyderabad',
  'Bahawalpur',
  'Sargodha',
  'Abbottabad',
  'Mirpur (AJK)',
  'Sukkur',
  'Other City',
];

export function formatPKR(amount: number): string {
  return 'Rs. ' + amount.toLocaleString('en-PK');
}

export function getPhoneBySlug(slug: string): Smartphone | undefined {
  return SMARTPHONES.find((p) => p.slug === slug);
}

export function getPhonePrice(phone: Smartphone): number {
  if (!phone) return 0;
  const inStockVariants = phone.variants?.filter((v) => v.inStock) || [];
  if (inStockVariants.length > 0) {
    return Math.min(...inStockVariants.map((v) => v.pricePKR));
  }
  if (phone.variants && phone.variants.length > 0) {
    return Math.min(...phone.variants.map((v) => v.pricePKR));
  }
  return phone.basePricePKR;
}

