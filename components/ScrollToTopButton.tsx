'use client';

import React, { useState, useEffect } from 'react';
import { ArrowUp } from 'lucide-react';
import { usePathname } from 'next/navigation';

export function ScrollToTopButton() {
  const pathname = usePathname();
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      // Show button after scrolling down 250px
      if (window.scrollY > 250) {
        setIsVisible(true);
      } else {
        setIsVisible(false);
      }
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    // Check initial position
    handleScroll();

    return () => {
      window.removeEventListener('scroll', handleScroll);
    };
  }, []);

  // Do not show on admin dashboard
  if (pathname?.startsWith('/admin')) {
    return null;
  }

  const scrollToTop = () => {
    window.scrollTo({
      top: 0,
      behavior: 'smooth',
    });

    // Clear hash like #accessories if present, so the URL returns clean without jumping
    if (window.location.hash) {
      window.history.replaceState(null, '', window.location.pathname + window.location.search);
    }
  };

  return (
    <aside
      aria-label="Scroll to top"
      className={`fixed bottom-[180px] sm:bottom-[144px] right-4 sm:right-6 z-40 flex items-center transition-all duration-300 ease-out ${
        isVisible
          ? 'opacity-100 translate-y-0 pointer-events-auto scale-100'
          : 'opacity-0 translate-y-3 pointer-events-none scale-90'
      }`}
    >
      <button
        type="button"
        onClick={scrollToTop}
        aria-label="Back to top"
        title="Back to top"
        className="group relative flex items-center justify-center gap-1.5 w-10 h-10 sm:w-auto sm:px-3.5 sm:py-2.5 rounded-full bg-[#0b3c68] hover:bg-[#082e50] text-white shadow-xl shadow-[#0b3c68]/30 hover:shadow-[#0b3c68]/50 hover:scale-105 active:scale-95 transition-all duration-200 border-2 border-white/60 cursor-pointer"
      >
        <ArrowUp
          className="w-4 h-4 sm:w-4.5 sm:h-4.5 text-white transition-transform duration-200 group-hover:-translate-y-1"
          strokeWidth={2.5}
        />
        <span className="text-xs font-black tracking-wide hidden sm:inline">Top</span>

        {/* Hover tooltip for desktop */}
        <span className="absolute right-full mr-2.5 px-2.5 py-1 bg-slate-900/95 text-white text-[11px] font-bold rounded-lg shadow-lg opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none whitespace-nowrap hidden sm:block border border-white/10">
          Back to Top
        </span>
      </button>
    </aside>
  );
}
