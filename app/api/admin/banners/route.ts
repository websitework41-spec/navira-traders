import { NextResponse } from 'next/server';
import { HeroBannerItem } from '@/types';
import { DEFAULT_HERO_BANNERS } from '@/lib/banners';
import { getBannersFromDisk, saveBannersToDisk } from '@/lib/banners.server';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

const NO_CACHE_HEADERS = {
  'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
  Pragma: 'no-cache',
  Expires: '0',
};

// GET - Retrieve all banners
export async function GET() {
  try {
    const banners = getBannersFromDisk();
    return NextResponse.json(
      {
        success: true,
        banners: banners.sort((a, b) => (a.order || 0) - (b.order || 0)),
      },
      { headers: NO_CACHE_HEADERS }
    );
  } catch (err: any) {
    return NextResponse.json(
      { success: false, error: err.message || 'Failed to fetch banners' },
      { status: 500, headers: NO_CACHE_HEADERS }
    );
  }
}

// POST - Create or execute banner actions
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { action } = body;
    let banners = getBannersFromDisk();

    // 1. Reset to default banners
    if (action === 'reset') {
      saveBannersToDisk(DEFAULT_HERO_BANNERS);
      return NextResponse.json(
        { success: true, banners: DEFAULT_HERO_BANNERS },
        { headers: NO_CACHE_HEADERS }
      );
    }

    // 2. Reorder banners
    if (action === 'reorder') {
      const { orderedIds } = body;
      if (Array.isArray(orderedIds)) {
        banners = banners.map((b) => {
          const idx = orderedIds.indexOf(b.id);
          return idx !== -1 ? { ...b, order: idx + 1 } : b;
        });
        banners.sort((a, b) => a.order - b.order);
        saveBannersToDisk(banners);
      }
      return NextResponse.json(
        { success: true, banners },
        { headers: NO_CACHE_HEADERS }
      );
    }

    // 3. Toggle banner active status
    if (action === 'toggle') {
      const { id } = body;
      banners = banners.map((b) =>
        b.id === id ? { ...b, isActive: !b.isActive, updatedAt: new Date().toISOString() } : b
      );
      saveBannersToDisk(banners);
      return NextResponse.json(
        { success: true, banners },
        { headers: NO_CACHE_HEADERS }
      );
    }

    // 4. Create new banner
    const banner: HeroBannerItem = body.banner || body;
    if (!banner || !banner.title || !banner.image) {
      return NextResponse.json(
        { success: false, error: 'Banner Title and Image are required.' },
        { status: 400, headers: NO_CACHE_HEADERS }
      );
    }

    const newBanner: HeroBannerItem = {
      id: banner.id || `banner-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      badge: banner.badge || 'Featured Deal',
      badgeColor: banner.badgeColor || 'bg-[#48afff]/25 text-sky-200 border-[#48afff]/40',
      title: banner.title,
      highlight: banner.highlight || '',
      subtitle: banner.subtitle || '',
      phoneName: banner.phoneName || banner.title,
      brand: banner.brand || 'Official Store',
      specs: banner.specs || '',
      pricePKR: Number(banner.pricePKR) || 0,
      originalPricePKR: Number(banner.originalPricePKR) || 0,
      discountPercent:
        banner.discountPercent ||
        (banner.originalPricePKR && banner.pricePKR
          ? Math.max(0, Math.round(((banner.originalPricePKR - banner.pricePKR) / banner.originalPricePKR) * 100))
          : 0),
      image: banner.image,
      link: banner.link || '/#catalog',
      ctaText: banner.ctaText || 'Shop Deal',
      gradient: banner.gradient || 'from-[#0b2b4a] via-[#0f497a] to-[#136ab5]',
      bannerType: banner.bannerType || 'product',
      aspectRatio: banner.aspectRatio || '16:9',
      isActive: banner.isActive !== undefined ? banner.isActive : true,
      order: banner.order !== undefined ? banner.order : banners.length + 1,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    // If set to primary (order: 1), shift other orders
    if (newBanner.order === 1) {
      banners = banners.map((b) => ({ ...b, order: b.order + 1 }));
      banners.unshift(newBanner);
    } else {
      banners.push(newBanner);
    }

    banners.sort((a, b) => a.order - b.order);
    saveBannersToDisk(banners);

    return NextResponse.json(
      { success: true, banner: newBanner, banners },
      { headers: NO_CACHE_HEADERS }
    );
  } catch (err: any) {
    return NextResponse.json(
      { success: false, error: err.message || 'Failed to process banner' },
      { status: 500, headers: NO_CACHE_HEADERS }
    );
  }
}

// PUT - Update existing banner
export async function PUT(request: Request) {
  try {
    const body = await request.json();
    const updatedBanner: HeroBannerItem = body.banner || body;

    if (!updatedBanner || !updatedBanner.id) {
      return NextResponse.json(
        { success: false, error: 'Banner ID is required for update.' },
        { status: 400, headers: NO_CACHE_HEADERS }
      );
    }

    let banners = getBannersFromDisk();
    const existingIndex = banners.findIndex((b) => b.id === updatedBanner.id);

    if (existingIndex === -1) {
      return NextResponse.json(
        { success: false, error: 'Banner not found.' },
        { status: 404, headers: NO_CACHE_HEADERS }
      );
    }

    banners[existingIndex] = {
      ...banners[existingIndex],
      ...updatedBanner,
      discountPercent:
        updatedBanner.discountPercent ||
        (updatedBanner.originalPricePKR && updatedBanner.pricePKR
          ? Math.max(0, Math.round(((updatedBanner.originalPricePKR - updatedBanner.pricePKR) / updatedBanner.originalPricePKR) * 100))
          : banners[existingIndex].discountPercent),
      updatedAt: new Date().toISOString(),
    };

    banners.sort((a, b) => a.order - b.order);
    saveBannersToDisk(banners);

    return NextResponse.json(
      { success: true, banner: banners[existingIndex], banners },
      { headers: NO_CACHE_HEADERS }
    );
  } catch (err: any) {
    return NextResponse.json(
      { success: false, error: err.message || 'Failed to update banner' },
      { status: 500, headers: NO_CACHE_HEADERS }
    );
  }
}

// DELETE - Remove banner
export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json(
        { success: false, error: 'Banner ID parameter is required.' },
        { status: 400, headers: NO_CACHE_HEADERS }
      );
    }

    let banners = getBannersFromDisk();
    banners = banners.filter((b) => b.id !== id);
    // Re-index orders
    banners.forEach((b, idx) => {
      b.order = idx + 1;
    });

    saveBannersToDisk(banners);

    return NextResponse.json(
      { success: true, banners },
      { headers: NO_CACHE_HEADERS }
    );
  } catch (err: any) {
    return NextResponse.json(
      { success: false, error: err.message || 'Failed to delete banner' },
      { status: 500, headers: NO_CACHE_HEADERS }
    );
  }
}
