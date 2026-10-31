export interface Coupon {
  id: string;
  code: string;
  discountType: 'fixed' | 'percentage';
  discountValue: number;
  minOrderAmount?: number;
  maxDiscountAmount?: number;
  expiresAt?: string;
  usageLimit?: number;
  timesUsed: number;
  isActive: boolean;
  description?: string;
  createdAt: string;
}

export interface SmartphoneColor {
  name: string;
  hex: string;
  image: string;
  inStock?: boolean;
  stockQty?: number;
}

export interface SmartphoneVariant {
  id: string;
  storage: string;
  ram: string;
  pricePKR: number;
  originalPricePKR: number;
  costPricePKR?: number;
  inStock: boolean;
  stockQty?: number;
}

export interface SmartphoneSpecs {
  screen: string;
  refreshRate: string;
  displayType: string;
  processor: string;
  chipsetBrand: string;
  mainCamera: string;
  selfieCamera: string;
  battery: string;
  charging: string;
  os: string;
  network: string;
  security: string;
  weight: string;
  waterResistance?: string;
  ptaStatus: 'PTA Approved' | 'Non-PTA';
  warranty: string;
}

export interface Smartphone {
  id: string;
  slug: string;
  name: string;
  brand: string;
  category?: string;
  accessoryType?: string;
  tagline: string;
  basePricePKR: number;
  originalPricePKR: number;
  costPricePKR?: number;
  discountPercent: number;
  rating: number;
  reviewCount: number;
  inStock: boolean;
  stockQty?: number;
  isNew?: boolean;
  isTrending?: boolean;
  isBestSeller?: boolean;
  colors: SmartphoneColor[];
  variants: SmartphoneVariant[];
  colorStockMap?: Record<string, { inStock: boolean; stockQty: number }>;
  specs: SmartphoneSpecs;
  keyHighlights: {
    display: string;
    camera: string;
    battery: string;
    processor: string;
    charging: string;
  };
}

export interface FilterState {
  searchQuery: string;
  selectedBrands: string[];
  priceRange: [number, number];
  selectedRam: string[];
  selectedStorage: string[];
  ptaApprovedOnly: boolean;
  inStockOnly: boolean;
  sortBy: 'popularity' | 'price-asc' | 'price-desc' | 'discount' | 'rating';
  specFilter?: string;
}

export interface CartItem {
  phone: Smartphone;
  selectedColor: SmartphoneColor;
  selectedVariant: SmartphoneVariant;
  quantity: number;
}

export interface ProductViewEvent {
  phoneId: string;
  name: string;
  brand: string;
  slug: string;
  image: string;
  pricePKR: number;
  viewedAt: string;
  action?: 'viewed' | 'added_to_cart' | 'initiated_checkout';
}

export interface VisitorSession {
  visitorId: string;
  customerName?: string;
  phone?: string;
  city: string;
  device: string;
  ip?: string;
  firstSeen: string;
  lastSeen: string;
  isOnline: boolean;
  pageViewsCount: number;
  currentPath: string;
  hasPurchased: boolean;
  orderIds?: string[];
  viewedProducts: ProductViewEvent[];
}

export interface AnalyticsStats {
  activeNow: number;
  todayVisitors: number;
  monthVisitors: number;
  todayPageViews: number;
  monthPageViews: number;
  unpurchasedLeadsCount: number;
  unpurchasedVisitors: VisitorSession[];
  topUnpurchasedProducts: Array<{
    phoneId: string;
    name: string;
    brand: string;
    slug: string;
    image: string;
    pricePKR: number;
    unpurchasedViewsCount: number;
    addedToCartCount: number;
  }>;
}
