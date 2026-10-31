import fs from 'fs';
import path from 'path';
import { HeroBannerItem } from '@/types';
import { DEFAULT_HERO_BANNERS } from '@/lib/banners';

const bannersFilePath = path.join(process.cwd(), 'data', 'banners.json');

export function getBannersFromDisk(): HeroBannerItem[] {
  try {
    if (fs.existsSync(bannersFilePath)) {
      const data = fs.readFileSync(bannersFilePath, 'utf-8');
      const parsed = JSON.parse(data);
      if (Array.isArray(parsed) && parsed.length > 0) {
        return parsed as HeroBannerItem[];
      }
    }
  } catch (err) {
    console.error('Error reading banners.json:', err);
  }
  return DEFAULT_HERO_BANNERS;
}

export function saveBannersToDisk(banners: HeroBannerItem[]): boolean {
  try {
    fs.writeFileSync(bannersFilePath, JSON.stringify(banners, null, 2), 'utf-8');
    return true;
  } catch (err) {
    console.error('Error saving banners.json:', err);
    return false;
  }
}
