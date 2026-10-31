import { Smartphone } from '@/types';
import { getPhonePrice } from '@/data/smartphones';

export interface ParsedSearchQuery {
  rawQuery: string;
  cleanQuery: string;
  textTokens: string[];
  maxPrice?: number;
  minPrice?: number;
  specFilter?: string;
}

/**
 * Builds a comprehensive search index string for a smartphone.
 * Includes name, brand, slug, specs, RAM, storage variants, colors, and feature flags.
 */
export function buildPhoneSearchIndex(p: Smartphone): { fullText: string; normalized: string } {
  const parts: (string | undefined)[] = [
    p.name,
    p.brand,
    p.slug,
    p.slug.replace(/-/g, ' '),
    p.specs.processor,
    p.specs.chipsetBrand,
    p.specs.network,
    p.specs.screen,
    p.specs.mainCamera,
    p.specs.selfieCamera,
    p.specs.battery,
    p.specs.charging,
    p.specs.ptaStatus,
    p.specs.refreshRate,
    p.specs.displayType,
    p.keyHighlights?.display,
    p.keyHighlights?.camera,
    p.keyHighlights?.battery,
    p.keyHighlights?.processor,
    p.keyHighlights?.charging,
    p.category,
    p.accessoryType,
  ];

  if (p.brand === 'Oraimo' || p.category === 'Accessories') {
    parts.push('accessory accessories oraimo smartwatch smart watch earbuds earphones charging cable charger cord');
  }

  if (p.variants) {
    p.variants.forEach((v) => {
      parts.push(v.ram, v.storage, `${v.ram} ${v.storage}`, `${v.ram}${v.storage}`);
    });
  }

  if (p.colors) {
    p.colors.forEach((c) => parts.push(c.name));
  }

  // Keypad & Feature phone aliases for Nokia & Itel button phones
  if (
    ['Nokia', 'Itel'].includes(p.brand) &&
    p.variants.some((v) => (v.ram && v.ram.includes('MB')) || parseInt(v.ram || '0', 10) <= 1)
  ) {
    parts.push('keypad button feature basic bar phone');
  }

  // 120Hz AMOLED alias
  if (
    p.specs.refreshRate?.includes('120') ||
    p.specs.screen?.includes('120') ||
    p.specs.displayType?.includes('120')
  ) {
    parts.push('120hz smooth high refresh');
  }
  if (/amoled|oled/i.test(p.specs.displayType || '') || /amoled|oled/i.test(p.specs.screen || '')) {
    parts.push('amoled oled super amoled dynamic amoled');
  }

  const fullText = parts.filter(Boolean).join(' ').toLowerCase();
  const normalized = fullText.replace(/[^a-z0-9]/g, '');

  return { fullText, normalized };
}

/**
 * Parses natural language search queries:
 * Extracts budget/price constraints like "under 30k", "below 40,000", "< 25k", "above 150k", "flagship".
 */
export function parseSearchQuery(rawQuery: string): ParsedSearchQuery {
  const clean = rawQuery.trim();
  let maxPrice: number | undefined = undefined;
  let minPrice: number | undefined = undefined;
  let specFilter: string | undefined = undefined;
  let remainingText = clean;

  // 1. Detect "under / below / less than / max / < / upto X"
  const underMatch = remainingText.match(
    /(?:under|below|less than|max|<|upto|up to)\s*(?:rs\.?|pkr)?\s*([\d,.]+)\s*(k|lac|lakh|thousand)?/i
  );
  if (underMatch) {
    const numStr = underMatch[1].replace(/,/g, '');
    let val = parseFloat(numStr);
    const unit = (underMatch[2] || '').toLowerCase();
    if (unit === 'k' || unit === 'thousand') {
      val = val * 1000;
    } else if (unit === 'lac' || unit === 'lakh') {
      val = val * 100000;
    } else if (val < 1000) {
      // E.g., "under 30" -> 30,000
      val = val * 1000;
    }
    if (!isNaN(val) && val > 0) {
      maxPrice = val;
      remainingText = remainingText.replace(underMatch[0], ' ');
    }
  }

  // 2. Detect "above / over / more than / min / > X"
  const aboveMatch = remainingText.match(
    /(?:above|over|more than|min|>)\s*(?:rs\.?|pkr)?\s*([\d,.]+)\s*(k|lac|lakh|thousand)?/i
  );
  if (aboveMatch) {
    const numStr = aboveMatch[1].replace(/,/g, '');
    let val = parseFloat(numStr);
    const unit = (aboveMatch[2] || '').toLowerCase();
    if (unit === 'k' || unit === 'thousand') {
      val = val * 1000;
    } else if (unit === 'lac' || unit === 'lakh') {
      val = val * 100000;
    } else if (val < 1000) {
      val = val * 1000;
    }
    if (!isNaN(val) && val > 0) {
      minPrice = val;
      remainingText = remainingText.replace(aboveMatch[0], ' ');
    }
  }

  // 3. Detect "flagship" keyword
  if (/\bflagship\b/i.test(remainingText)) {
    minPrice = Math.max(minPrice || 0, 150000);
    remainingText = remainingText.replace(/\bflagship\b/i, ' ');
  }

  // 4. Detect "120hz amoled"
  if (
    (remainingText.toLowerCase().includes('120hz') || remainingText.toLowerCase().includes('120 hz')) &&
    (remainingText.toLowerCase().includes('amoled') || remainingText.toLowerCase().includes('oled'))
  ) {
    specFilter = '120hz-amoled';
  }

  const tokens = remainingText
    .replace(/\b(?:phones?|mobiles?|smartphones?)\b/gi, ' ')
    .trim()
    .toLowerCase()
    .split(/[\s,+/_-]+/)
    .filter(Boolean);

  return {
    rawQuery,
    cleanQuery: clean,
    textTokens: tokens,
    maxPrice,
    minPrice,
    specFilter,
  };
}

/**
 * Evaluates whether a smartphone matches a search query using multi-token and normalized matching.
 */
export function matchesSearchQuery(
  phone: Smartphone,
  query: string,
  prebuiltIndex?: { fullText: string; normalized: string }
): boolean {
  if (!query || !query.trim()) return true;

  const { textTokens, maxPrice, minPrice, specFilter } = parseSearchQuery(query);
  const price = getPhonePrice(phone);

  if (maxPrice !== undefined && price > maxPrice) return false;
  if (minPrice !== undefined && price < minPrice) return false;

  if (specFilter === '120hz-amoled') {
    const is120Hz =
      phone.specs.refreshRate?.includes('120') ||
      phone.specs.displayType?.includes('120') ||
      phone.specs.screen?.includes('120');
    const isAmoled =
      /amoled|oled/i.test(phone.specs.displayType || '') ||
      /amoled|oled/i.test(phone.specs.screen || '') ||
      /amoled|oled/i.test(phone.keyHighlights?.display || '');
    if (!is120Hz || !isAmoled) return false;
  }

  if (textTokens.length === 0) return true;

  const index = prebuiltIndex || buildPhoneSearchIndex(phone);

  return textTokens.every((token) => {
    // 1. Check direct substring presence
    if (index.fullText.includes(token)) return true;

    // 2. Check normalized alphanumeric string (e.g. "c100i" in "realme-c100i")
    const normToken = token.replace(/[^a-z0-9]/g, '');
    if (normToken && index.normalized.includes(normToken)) return true;

    return false;
  });
}

/**
 * Searches a list of smartphones and sorts them by relevance.
 */
export function searchSmartphones(phones: Smartphone[], query: string): Smartphone[] {
  if (!query || !query.trim()) return phones;

  const cleanLower = query.trim().toLowerCase();
  const matched = phones.filter((phone) => matchesSearchQuery(phone, query));

  return matched.sort((a, b) => {
    const aName = a.name.toLowerCase();
    const bName = b.name.toLowerCase();

    // Exact name match
    if (aName === cleanLower) return -1;
    if (bName === cleanLower) return 1;

    // Starts with query
    const aStarts = aName.startsWith(cleanLower);
    const bStarts = bName.startsWith(cleanLower);
    if (aStarts && !bStarts) return -1;
    if (!aStarts && bStarts) return 1;

    // Brand exact match
    const aBrand = a.brand.toLowerCase() === cleanLower;
    const bBrand = b.brand.toLowerCase() === cleanLower;
    if (aBrand && !bBrand) return -1;
    if (!aBrand && bBrand) return 1;

    // Review count tie-breaker
    return (b.reviewCount || 0) - (a.reviewCount || 0);
  });
}
