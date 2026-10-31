import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';
import { Smartphone } from '@/types';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

const dataFilePath = path.join(process.cwd(), 'data', 'smartphones.json');
const deletedFilePath = path.join(process.cwd(), 'data', 'deleted_products.json');

const NO_CACHE_HEADERS = {
  'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
  Pragma: 'no-cache',
  Expires: '0',
};

// Helper to read deleted IDs from disk
function getDeletedIdsFromDisk(): string[] {
  try {
    if (fs.existsSync(deletedFilePath)) {
      const data = fs.readFileSync(deletedFilePath, 'utf-8');
      return JSON.parse(data) as string[];
    }
  } catch (err) {
    console.error('Error reading deleted_products.json:', err);
  }
  return [];
}

// Helper to write deleted IDs to disk
function saveDeletedIdToDisk(id: string, slug?: string) {
  try {
    const list = getDeletedIdsFromDisk();
    const idLower = id.toLowerCase();
    if (!list.includes(idLower)) list.push(idLower);
    if (slug) {
      const slugLower = slug.toLowerCase();
      if (!list.includes(slugLower)) list.push(slugLower);
    }
    fs.writeFileSync(deletedFilePath, JSON.stringify(list, null, 2), 'utf-8');
  } catch (err) {
    console.error('Error writing deleted_products.json:', err);
  }
}

// Remove from deleted list if product is added or updated
function removeDeletedIdFromDisk(id: string, slug?: string) {
  try {
    const list = getDeletedIdsFromDisk();
    const idLower = id.toLowerCase();
    const slugLower = slug?.toLowerCase();
    const filtered = list.filter((item) => item !== idLower && item !== slugLower);
    fs.writeFileSync(deletedFilePath, JSON.stringify(filtered, null, 2), 'utf-8');
  } catch {}
}

// Helper to read current smartphones
function getSmartphonesFromDisk(): Smartphone[] {
  try {
    if (fs.existsSync(dataFilePath)) {
      const fileData = fs.readFileSync(dataFilePath, 'utf-8');
      const phones = JSON.parse(fileData) as Smartphone[];
      const deletedIds = getDeletedIdsFromDisk();

      if (deletedIds.length > 0) {
        const deletedSet = new Set(deletedIds);
        return phones.filter(
          (p) => !deletedSet.has(p.id?.toLowerCase()) && !deletedSet.has(p.slug?.toLowerCase())
        );
      }
      return phones;
    }
  } catch (err) {
    console.error('Error reading smartphones.json:', err);
  }
  return [];
}

// Helper to write smartphones to disk
function saveSmartphonesToDisk(phones: Smartphone[]): boolean {
  try {
    fs.writeFileSync(dataFilePath, JSON.stringify(phones, null, 2), 'utf-8');
    return true;
  } catch (err) {
    console.error('Error writing to smartphones.json:', err);
    return false;
  }
}

// GET - Retrieve all products with optional filters
export async function GET(request: Request) {
  try {
    const phones = getSmartphonesFromDisk();
    const { searchParams } = new URL(request.url);
    const search = (searchParams.get('q') || searchParams.get('search') || '').toLowerCase().trim();
    const brand = searchParams.get('brand') || '';
    const stockStatus = searchParams.get('status') || '';
    const category = searchParams.get('category') || '';

    let filtered = phones;

    if (search) {
      const tokens = search.split(/[\s,+/_-]+/).filter(Boolean);
      filtered = filtered.filter((p) => {
        const searchable = `${p.name} ${p.brand} ${p.slug} ${p.specs?.processor || ''} ${p.specs?.network || ''}`.toLowerCase();
        return tokens.every((token) => searchable.includes(token));
      });
    }

    if (brand && brand !== 'All Brands') {
      filtered = filtered.filter((p) => p.brand.toLowerCase() === brand.toLowerCase());
    }

    if (stockStatus === 'inStock') {
      filtered = filtered.filter((p) => p.inStock && (p.stockQty ?? 1) > 0);
    } else if (stockStatus === 'lowStock') {
      filtered = filtered.filter((p) => (p.stockQty ?? 0) > 0 && (p.stockQty ?? 0) <= 5);
    } else if (stockStatus === 'outOfStock') {
      filtered = filtered.filter((p) => !p.inStock || (p.stockQty ?? 0) === 0);
    }

    if (category) {
      if (category.toLowerCase() === 'accessories') {
        filtered = filtered.filter((p) => p.category === 'Accessories');
      } else if (category.toLowerCase() === 'mobiles' || category.toLowerCase() === 'smartphones') {
        filtered = filtered.filter((p) => p.category !== 'Accessories');
      }
    }

    return NextResponse.json(
      {
        success: true,
        totalCount: phones.length,
        filteredCount: filtered.length,
        products: filtered,
      },
      { headers: NO_CACHE_HEADERS }
    );
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to fetch products' },
      { status: 500, headers: NO_CACHE_HEADERS }
    );
  }
}

// POST - Add a new product
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const newProduct: Smartphone = body.product;

    if (!newProduct || !newProduct.name || !newProduct.brand || !newProduct.basePricePKR) {
      return NextResponse.json(
        { success: false, error: 'Product name, brand, and base price are required.' },
        { status: 400, headers: NO_CACHE_HEADERS }
      );
    }

    const phones = getSmartphonesFromDisk();

    // Auto-generate ID & slug if missing
    let slug = newProduct.slug || newProduct.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
    let id = newProduct.id || slug;

    // Ensure slug uniqueness
    let duplicateIndex = 1;
    let uniqueSlug = slug;
    while (phones.some((p) => p.slug === uniqueSlug)) {
      uniqueSlug = `${slug}-${duplicateIndex}`;
      duplicateIndex++;
    }
    newProduct.slug = uniqueSlug;
    newProduct.id = id;

    // Ensure it's cleared from deleted list if re-added
    removeDeletedIdFromDisk(newProduct.id, newProduct.slug);

    // Ensure colors and variants have basic fallbacks
    if (!newProduct.colors || newProduct.colors.length === 0) {
      newProduct.colors = [
        {
          name: 'Standard Black',
          hex: '#1e293b',
          image: 'https://images.priceoye.pk/samsung-galaxy-s22-ultra-pakistan-priceoye-w11tk-500x500.webp',
          inStock: true,
          stockQty: newProduct.stockQty || 10,
        },
      ];
    }

    // Ensure wholesale cost price
    if (!newProduct.costPricePKR || newProduct.costPricePKR <= 0) {
      newProduct.costPricePKR = Math.round(newProduct.basePricePKR * 0.88);
    }

    if (!newProduct.variants || newProduct.variants.length === 0) {
      newProduct.variants = [
        {
          id: `${newProduct.slug}-default`,
          ram: '8GB',
          storage: '128GB',
          pricePKR: newProduct.basePricePKR,
          originalPricePKR: newProduct.originalPricePKR || newProduct.basePricePKR,
          costPricePKR: newProduct.costPricePKR,
          inStock: true,
          stockQty: newProduct.stockQty || 10,
        },
      ];
    } else {
      newProduct.variants = newProduct.variants.map((v) => ({
        ...v,
        costPricePKR: v.costPricePKR && v.costPricePKR > 0 ? v.costPricePKR : Math.round(v.pricePKR * 0.88),
      }));
    }

    // Initialize colorStockMap
    if (!newProduct.colorStockMap) {
      newProduct.colorStockMap = {};
      newProduct.colors.forEach((c) => {
        newProduct.colorStockMap![c.name] = {
          inStock: c.inStock !== false,
          stockQty: c.stockQty ?? 5,
        };
      });
    }

    // Default highlights & specs if missing
    if (!newProduct.keyHighlights) {
      newProduct.keyHighlights = {
        display: newProduct.specs?.screen || '6.7 inch FHD+ Display',
        processor: newProduct.specs?.processor || 'High-performance Octa-Core Processor',
        camera: newProduct.specs?.mainCamera || '50 MP High-Res Camera',
        battery: newProduct.specs?.battery || '5000 mAh All-day Battery',
        charging: newProduct.specs?.charging || 'Fast Charging Supported',
      };
    }

    // Prepend new product so it appears at top of catalog
    phones.unshift(newProduct);

    saveSmartphonesToDisk(phones);

    return NextResponse.json(
      {
        success: true,
        message: 'Product added successfully!',
        product: newProduct,
      },
      { headers: NO_CACHE_HEADERS }
    );
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to add product' },
      { status: 500, headers: NO_CACHE_HEADERS }
    );
  }
}

// PUT - Update an entire product
export async function PUT(request: Request) {
  try {
    const body = await request.json();
    const updatedProduct: Smartphone = body.product;

    if (!updatedProduct || (!updatedProduct.id && !updatedProduct.slug)) {
      return NextResponse.json(
        { success: false, error: 'Product ID or Slug is required for updating.' },
        { status: 400, headers: NO_CACHE_HEADERS }
      );
    }

    // Clear deleted list in case it was previously marked
    removeDeletedIdFromDisk(updatedProduct.id, updatedProduct.slug);

    const phones = getSmartphonesFromDisk();
    const index = phones.findIndex(
      (p) => p.id === updatedProduct.id || p.slug === updatedProduct.slug
    );

    if (index === -1) {
      return NextResponse.json(
        { success: false, error: 'Product not found in catalog.' },
        { status: 404, headers: NO_CACHE_HEADERS }
      );
    }

    // Update colorStockMap consistency
    if (updatedProduct.colors) {
      const colorMap = updatedProduct.colorStockMap || {};
      updatedProduct.colors.forEach((col) => {
        if (!colorMap[col.name]) {
          colorMap[col.name] = {
            inStock: col.inStock !== false,
            stockQty: col.stockQty ?? 5,
          };
        } else {
          colorMap[col.name].inStock = col.inStock !== false;
          colorMap[col.name].stockQty = col.stockQty ?? colorMap[col.name].stockQty;
        }
      });
      updatedProduct.colorStockMap = colorMap;
    }

    phones[index] = { ...phones[index], ...updatedProduct };

    saveSmartphonesToDisk(phones);

    return NextResponse.json(
      {
        success: true,
        message: 'Product updated successfully!',
        product: phones[index],
      },
      { headers: NO_CACHE_HEADERS }
    );
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to update product' },
      { status: 500, headers: NO_CACHE_HEADERS }
    );
  }
}

// DELETE - Remove a product
export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    let id = searchParams.get('id') || searchParams.get('slug');

    if (!id) {
      try {
        const body = await request.json();
        id = body.id || body.slug;
      } catch {}
    }

    if (!id) {
      return NextResponse.json(
        { success: false, error: 'Product ID or Slug is required to delete.' },
        { status: 400, headers: NO_CACHE_HEADERS }
      );
    }

    // 1. Record ID in deleted_products.json so it never resurrects
    saveDeletedIdToDisk(id);

    // 2. Also remove from smartphones.json
    const phones = getSmartphonesFromDisk();
    const remaining = phones.filter(
      (p) => p.id?.toLowerCase() !== id?.toLowerCase() && p.slug?.toLowerCase() !== id?.toLowerCase()
    );

    saveSmartphonesToDisk(remaining);

    return NextResponse.json(
      {
        success: true,
        message: 'Product deleted successfully!',
        deletedId: id,
      },
      { headers: NO_CACHE_HEADERS }
    );
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to delete product' },
      { status: 500, headers: NO_CACHE_HEADERS }
    );
  }
}

// PATCH - Fast Restock, Stock status toggle, Color/Variant stock update
export async function PATCH(request: Request) {
  try {
    const body = await request.json();
    const { id, action, restockQty, inStock, colorName, colorStockQty, colorInStock, variantId, variantStockQty, variantInStock } = body;

    if (!id) {
      return NextResponse.json(
        { success: false, error: 'Product ID is required.' },
        { status: 400, headers: NO_CACHE_HEADERS }
      );
    }

    const phones = getSmartphonesFromDisk();
    const index = phones.findIndex((p) => p.id === id || p.slug === id);

    if (index === -1) {
      return NextResponse.json(
        { success: false, error: 'Product not found.' },
        { status: 404, headers: NO_CACHE_HEADERS }
      );
    }

    const product = phones[index];

    switch (action) {
      case 'restock': {
        const addQty = typeof restockQty === 'number' ? restockQty : 10;
        product.stockQty = Math.max(0, (product.stockQty || 0) + addQty);
        product.inStock = product.stockQty > 0;

        if (product.variants && product.variants.length > 0) {
          product.variants = product.variants.map((v) => ({
            ...v,
            stockQty: Math.max(0, (v.stockQty || 0) + Math.ceil(addQty / product.variants.length)),
            inStock: true,
          }));
        }

        if (product.colors && product.colors.length > 0) {
          product.colors = product.colors.map((c) => ({
            ...c,
            stockQty: Math.max(0, (c.stockQty || 0) + Math.ceil(addQty / product.colors.length)),
            inStock: true,
          }));

          if (product.colorStockMap) {
            Object.keys(product.colorStockMap).forEach((colKey) => {
              product.colorStockMap![colKey].inStock = true;
              product.colorStockMap![colKey].stockQty = Math.max(
                1,
                (product.colorStockMap![colKey].stockQty || 0) + Math.ceil(addQty / product.colors.length)
              );
            });
          }
        }
        break;
      }

      case 'toggle_stock': {
        const targetState = typeof inStock === 'boolean' ? inStock : !product.inStock;
        product.inStock = targetState;
        if (!targetState) {
          product.stockQty = 0;
          if (product.variants) {
            product.variants = product.variants.map((v) => ({ ...v, inStock: false, stockQty: 0 }));
          }
          if (product.colors) {
            product.colors = product.colors.map((c) => ({ ...c, inStock: false, stockQty: 0 }));
          }
          if (product.colorStockMap) {
            Object.keys(product.colorStockMap).forEach((k) => {
              product.colorStockMap![k] = { inStock: false, stockQty: 0 };
            });
          }
        } else {
          if ((product.stockQty || 0) <= 0) product.stockQty = 10;
          if (product.variants) {
            product.variants = product.variants.map((v) => ({ ...v, inStock: true, stockQty: v.stockQty || 5 }));
          }
          if (product.colors) {
            product.colors = product.colors.map((c) => ({ ...c, inStock: true, stockQty: c.stockQty || 5 }));
          }
          if (product.colorStockMap) {
            Object.keys(product.colorStockMap).forEach((k) => {
              product.colorStockMap![k] = { inStock: true, stockQty: product.colorStockMap![k].stockQty || 5 };
            });
          }
        }
        break;
      }

      case 'update_color': {
        if (!colorName) {
          return NextResponse.json({ success: false, error: 'colorName is required' }, { status: 400, headers: NO_CACHE_HEADERS });
        }
        if (product.colors) {
          const col = product.colors.find((c) => c.name.toLowerCase() === colorName.toLowerCase());
          if (col) {
            if (typeof colorStockQty === 'number') col.stockQty = Math.max(0, colorStockQty);
            if (typeof colorInStock === 'boolean') col.inStock = colorInStock;
          }
        }
        if (!product.colorStockMap) product.colorStockMap = {};
        product.colorStockMap[colorName] = {
          inStock: typeof colorInStock === 'boolean' ? colorInStock : true,
          stockQty: typeof colorStockQty === 'number' ? Math.max(0, colorStockQty) : 5,
        };

        const totalColorStock = product.colors?.reduce((acc, c) => acc + (c.stockQty || 0), 0) ?? 0;
        product.stockQty = totalColorStock;
        product.inStock = totalColorStock > 0;
        break;
      }

      case 'update_variant': {
        if (!variantId) {
          return NextResponse.json({ success: false, error: 'variantId is required' }, { status: 400, headers: NO_CACHE_HEADERS });
        }
        if (product.variants) {
          const v = product.variants.find((item) => item.id === variantId);
          if (v) {
            if (typeof variantStockQty === 'number') v.stockQty = Math.max(0, variantStockQty);
            if (typeof variantInStock === 'boolean') v.inStock = variantInStock;
          }
        }
        const hasAnyInStock = product.variants?.some((v) => v.inStock && (v.stockQty ?? 1) > 0);
        product.inStock = hasAnyInStock ?? product.inStock;
        break;
      }

      default:
        return NextResponse.json({ success: false, error: 'Invalid PATCH action specified.' }, { status: 400, headers: NO_CACHE_HEADERS });
    }

    phones[index] = product;
    saveSmartphonesToDisk(phones);

    return NextResponse.json(
      {
        success: true,
        message: 'Stock updated successfully!',
        product,
      },
      { headers: NO_CACHE_HEADERS }
    );
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to update stock' },
      { status: 500, headers: NO_CACHE_HEADERS }
    );
  }
}
