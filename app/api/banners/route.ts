import { NextResponse } from 'next/server';
import { getBannersFromDisk } from '@/lib/banners.server';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

const NO_CACHE_HEADERS = {
  'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
  Pragma: 'no-cache',
  Expires: '0',
};

export async function GET() {
  try {
    const all = getBannersFromDisk();
    const activeBanners = all
      .filter((b) => b.isActive)
      .sort((a, b) => (a.order || 0) - (b.order || 0));

    return NextResponse.json(
      {
        success: true,
        banners: activeBanners.length > 0 ? activeBanners : all,
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
