import { Smartphone } from '@/types';
import { SMARTPHONES } from '@/data/smartphones';

const DELETED_KEY = 'naviratraders_deleted_ids';
const CUSTOM_KEY = 'naviratraders_custom_products';
const SYNC_KEY = 'naviratraders_catalog_version';
const LEGACY_DELETED_KEY = 'voltphone_deleted_ids';
const LEGACY_CUSTOM_KEY = 'voltphone_custom_products';

/**
 * Returns an array of phone IDs or slugs that have been marked deleted by the admin.
 */
export function getLocalDeletedIds(): string[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem(DELETED_KEY) || localStorage.getItem(LEGACY_DELETED_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

/**
 * Returns array of phones created or updated locally in the admin panel.
 */
export function getLocalCustomProducts(): Smartphone[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem(CUSTOM_KEY) || localStorage.getItem(LEGACY_CUSTOM_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

/**
 * Filters and merges catalog data in real time:
 * - Removes any deleted product IDs/slugs.
 * - Applies any added/edited product updates from admin.
 */
export function getActiveCatalog(baseList: Smartphone[] = SMARTPHONES): Smartphone[] {
  if (typeof window === 'undefined') return baseList;

  const deleted = getLocalDeletedIds();
  const custom = getLocalCustomProducts();

  // Create a map of custom/updated phones
  const customMap = new Map<string, Smartphone>();
  custom.forEach((p) => {
    if (p.id) customMap.set(p.id.toLowerCase(), p);
    if (p.slug) customMap.set(p.slug.toLowerCase(), p);
  });

  // Apply updates to existing base list
  let result = baseList.map((p) => {
    const updated =
      (p.id ? customMap.get(p.id.toLowerCase()) : undefined) ||
      (p.slug ? customMap.get(p.slug.toLowerCase()) : undefined);
    return updated ? updated : p;
  });

  // Prepend any newly added custom phones that are not yet in the base list
  custom.forEach((p) => {
    const exists = result.some(
      (item) =>
        (p.id && item.id?.toLowerCase() === p.id.toLowerCase()) ||
        (p.slug && item.slug?.toLowerCase() === p.slug.toLowerCase())
    );
    if (!exists) {
      result.unshift(p);
    }
  });

  // Filter out any deleted products
  if (deleted.length > 0) {
    const deletedSet = new Set(deleted.map((d) => d.toLowerCase().trim()));
    result = result.filter(
      (p) => !deletedSet.has(p.id?.toLowerCase().trim()) && !deletedSet.has(p.slug?.toLowerCase().trim())
    );
  }

  return result;
}

/**
 * Permanently marks a product as deleted in client storage and notifies all open tabs.
 */
export function markProductDeletedLocally(phoneId: string, slug?: string) {
  if (typeof window === 'undefined') return;

  const deleted = getLocalDeletedIds();
  const idLower = phoneId?.toLowerCase().trim();
  const slugLower = slug?.toLowerCase().trim();

  if (idLower && !deleted.map((d) => d.toLowerCase().trim()).includes(idLower)) {
    deleted.push(idLower);
  }
  if (slugLower && !deleted.map((d) => d.toLowerCase().trim()).includes(slugLower)) {
    deleted.push(slugLower);
  }

  localStorage.setItem(DELETED_KEY, JSON.stringify(deleted));

  // Also remove from custom products
  const custom = getLocalCustomProducts().filter(
    (p) =>
      p.id?.toLowerCase().trim() !== idLower &&
      p.slug?.toLowerCase().trim() !== idLower &&
      (!slugLower || (p.id?.toLowerCase().trim() !== slugLower && p.slug?.toLowerCase().trim() !== slugLower))
  );
  localStorage.setItem(CUSTOM_KEY, JSON.stringify(custom));

  // Dispatch sync event for immediate reactive state updates
  localStorage.setItem(SYNC_KEY, Date.now().toString());
  window.dispatchEvent(new Event('naviratraders_products_updated'));
  window.dispatchEvent(new Event('voltphone_products_updated'));
}

/**
 * Saves or updates a product in client storage and notifies all open tabs.
 */
export function saveProductLocally(product: Smartphone) {
  if (typeof window === 'undefined') return;

  const idLower = product.id?.toLowerCase().trim();
  const slugLower = product.slug?.toLowerCase().trim();

  // Ensure it's not marked as deleted
  const deleted = getLocalDeletedIds().filter(
    (id) => id.toLowerCase().trim() !== idLower && id.toLowerCase().trim() !== slugLower
  );
  localStorage.setItem(DELETED_KEY, JSON.stringify(deleted));

  // Upsert in custom products
  const custom = getLocalCustomProducts().filter(
    (p) =>
      p.id?.toLowerCase().trim() !== idLower &&
      p.slug?.toLowerCase().trim() !== slugLower &&
      (!idLower || p.slug?.toLowerCase().trim() !== idLower) &&
      (!slugLower || p.id?.toLowerCase().trim() !== slugLower)
  );
  custom.unshift(product);
  localStorage.setItem(CUSTOM_KEY, JSON.stringify(custom));

  // Dispatch sync
  localStorage.setItem(SYNC_KEY, Date.now().toString());
  window.dispatchEvent(new Event('naviratraders_products_updated'));
  window.dispatchEvent(new Event('voltphone_products_updated'));
}
