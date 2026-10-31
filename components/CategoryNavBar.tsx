'use client';

import React, { useRef, useState, useEffect, useCallback } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import {
  Smartphone as SmartphoneIcon,
  Headphones,
  Watch,
  Battery,
  Zap,
  Volume2,
  Cable,
  Tablet,
  Laptop,
  Sparkles,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';

export interface CategoryNavItem {
  id: string;
  name: string;
  image: string;
  fallbackIcon: React.ElementType;
  targetTab?: string;
}

export const CATEGORY_NAV_ITEMS: CategoryNavItem[] = [
  {
    id: 'mobiles',
    name: 'Mobiles',
    image: 'https://static.priceoye.pk/images/home/mobiles.webp',
    fallbackIcon: SmartphoneIcon,
    targetTab: 'all',
  },
  {
    id: 'wireless-earbuds',
    name: 'Wireless Earbuds',
    image: 'https://static.priceoye.pk/images/home/wireless-earbuds.webp',
    fallbackIcon: Headphones,
    targetTab: 'Earbuds',
  },
  {
    id: 'smart-watches',
    name: 'Smart Watches',
    image: 'https://static.priceoye.pk/images/home/smart-watches.webp',
    fallbackIcon: Watch,
    targetTab: 'Smartwatch',
  },
  {
    id: 'trimmers-shaver',
    name: 'Trimmers Shaver',
    image: 'https://static.priceoye.pk/images/home/trimmers-shaver.webp',
    fallbackIcon: Sparkles,
    targetTab: 'Other',
  },
  {
    id: 'power-banks',
    name: 'Power Banks',
    image: 'https://static.priceoye.pk/images/home/power-banks.webp',
    fallbackIcon: Battery,
    targetTab: 'Power Bank',
  },
  {
    id: 'mobile-chargers',
    name: 'Wall Chargers',
    image: 'https://static.priceoye.pk/images/home/mobile-chargers.webp',
    fallbackIcon: Zap,
    targetTab: 'Charger',
  },
  {
    id: 'bluetooth-speakers',
    name: 'Bluetooth Speakers',
    image: 'https://static.priceoye.pk/images/home/bluetooth-speakers.webp',
    fallbackIcon: Volume2,
    targetTab: 'Audio',
  },
  {
    id: 'mobile-cables',
    name: 'Charging Cables',
    image: 'https://static.priceoye.pk/images/home/mobile-cables.webp',
    fallbackIcon: Cable,
    targetTab: 'Cable',
  },
  {
    id: 'tablets',
    name: 'Tablets',
    image: 'https://static.priceoye.pk/images/home/tablets.webp',
    fallbackIcon: Tablet,
    targetTab: 'Other',
  },
  {
    id: 'laptops',
    name: 'Laptops',
    image: 'https://static.priceoye.pk/images/home/laptops.webp',
    fallbackIcon: Laptop,
    targetTab: 'Other',
  },
];

interface CategoryNavBarProps {
  activeCategory?: string;
  onSelectCategory?: (categoryId: string) => void;
  className?: string;
}

export function CategoryNavBar({
  activeCategory = 'mobiles',
  onSelectCategory,
  className = '',
}: CategoryNavBarProps) {
  const router = useRouter();
  const pathname = usePathname();
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(true);

  // Check scroll position to update left/right arrows
  const checkScroll = useCallback(() => {
    if (!scrollContainerRef.current) return;
    const { scrollLeft, scrollWidth, clientWidth } = scrollContainerRef.current;
    setCanScrollLeft(scrollLeft > 6);
    setCanScrollRight(scrollLeft + clientWidth < scrollWidth - 6);
  }, []);

  useEffect(() => {
    checkScroll();
    window.addEventListener('resize', checkScroll);
    return () => window.removeEventListener('resize', checkScroll);
  }, [checkScroll]);

  // Smooth scroll left / right
  const handleScroll = (direction: 'left' | 'right') => {
    if (!scrollContainerRef.current) return;
    const scrollAmount = 260;
    scrollContainerRef.current.scrollBy({
      left: direction === 'left' ? -scrollAmount : scrollAmount,
      behavior: 'smooth',
    });
    setTimeout(checkScroll, 250);
  };

  // Horizontal scroll wheel support
  const handleWheel = (e: React.WheelEvent<HTMLDivElement>) => {
    if (!scrollContainerRef.current) return;
    if (Math.abs(e.deltaX) < Math.abs(e.deltaY)) {
      scrollContainerRef.current.scrollLeft += e.deltaY;
    }
    checkScroll();
  };

  // Click handler
  const handleItemClick = (cat: CategoryNavItem) => {
    if (onSelectCategory) {
      onSelectCategory(cat.id);
    } else {
      // If we are not on the homepage, navigate to homepage with category parameter
      if (pathname !== '/') {
        if (cat.id === 'mobiles') {
          router.push('/?category=mobiles');
        } else {
          router.push(`/?category=${cat.id}#accessories`);
        }
      } else {
        // Broadcast custom event for decoupled components
        window.dispatchEvent(new CustomEvent('navira_category_select', { detail: { categoryId: cat.id } }));
      }
    }
  };

  return (
    <nav
      aria-label="Product Categories Navigation"
      className={`bg-white border-t-2 border-[#48afff] border-b border-slate-200/90 shadow-2xs relative w-full select-none ${className}`}
    >
      <div className="max-w-7xl mx-auto px-1 sm:px-4 relative flex items-center">
        {/* Left Scroll Navigation Paddle */}
        <button
          type="button"
          onClick={() => handleScroll('left')}
          disabled={!canScrollLeft}
          aria-label="Scroll categories backward"
          className={`shrink-0 w-7 sm:w-8 h-12 sm:h-14 rounded-md flex items-center justify-center transition-all cursor-pointer z-10 mx-0.5 ${
            canScrollLeft
              ? 'bg-slate-300/80 hover:bg-slate-400 text-slate-800 shadow-xs hover:scale-105 active:scale-95'
              : 'bg-slate-100 text-slate-300 opacity-40 cursor-not-allowed'
          }`}
        >
          <ChevronLeft className="w-5 h-5 stroke-[2.5]" />
        </button>

        {/* Scrollable Categories List */}
        <div
          ref={scrollContainerRef}
          onScroll={checkScroll}
          onWheel={handleWheel}
          className="flex items-center gap-1 sm:gap-2 overflow-x-auto scrollbar-none scroll-smooth flex-1 py-1"
        >
          {CATEGORY_NAV_ITEMS.map((cat) => {
            const isActive = activeCategory === cat.id;
            const FallbackIcon = cat.fallbackIcon;

            return (
              <button
                key={cat.id}
                type="button"
                onClick={() => handleItemClick(cat)}
                className={`group shrink-0 flex flex-col items-center justify-center px-3 sm:px-4 py-1.5 sm:py-2 min-w-[96px] sm:min-w-[124px] h-[66px] sm:h-[72px] transition-all cursor-pointer relative ${
                  isActive
                    ? 'bg-[#f1f3f5] text-slate-950 font-extrabold border-b-[3px] border-[#48afff]'
                    : 'bg-transparent hover:bg-slate-50 text-slate-800 font-bold border-b-[3px] border-transparent hover:text-slate-950'
                }`}
              >
                {/* Category Graphic / Icon */}
                <div className="w-9 h-9 sm:w-10 sm:h-10 flex items-center justify-center relative mb-1">
                  <img
                    src={cat.image}
                    alt={cat.name}
                    width={40}
                    height={40}
                    loading="lazy"
                    className="max-h-full max-w-full object-contain group-hover:scale-110 transition-transform duration-200"
                    onError={(e) => {
                      // Graceful fallback to Lucide icon if CDN image fails
                      (e.currentTarget as HTMLElement).style.display = 'none';
                      const fallback = e.currentTarget.parentElement?.querySelector('.cat-fallback');
                      if (fallback) fallback.classList.remove('hidden');
                    }}
                  />
                  <span className="cat-fallback hidden text-slate-700">
                    <FallbackIcon className="w-6 h-6" />
                  </span>
                </div>

                {/* Category Name Label */}
                <span className="text-[11px] sm:text-xs leading-none text-center tracking-tight truncate max-w-[110px]">
                  {cat.name}
                </span>
              </button>
            );
          })}
        </div>

        {/* Right Scroll Navigation Paddle */}
        <button
          type="button"
          onClick={() => handleScroll('right')}
          disabled={!canScrollRight}
          aria-label="Scroll categories forward"
          className={`shrink-0 w-7 sm:w-8 h-12 sm:h-14 rounded-md flex items-center justify-center transition-all cursor-pointer z-10 mx-0.5 ${
            canScrollRight
              ? 'bg-[#5f6368] hover:bg-[#484b4f] text-white shadow-xs hover:scale-105 active:scale-95'
              : 'bg-slate-100 text-slate-300 opacity-40 cursor-not-allowed'
          }`}
        >
          <ChevronRight className="w-5 h-5 stroke-[2.5]" />
        </button>
      </div>
    </nav>
  );
}
