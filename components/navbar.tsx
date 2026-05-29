'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabaseClient';
import { useTheme } from '@/components/theme-provider';
import {
  Building2,
  Sun,
  Moon,
  LogOut,
  ChevronRight,
  Loader2,
} from 'lucide-react';

export default function Navbar() {
  const router = useRouter();
  const { theme, toggleTheme } = useTheme();
  const [signingOut, setSigningOut] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 10);
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  const handleSignOut = async () => {
    setSigningOut(true);
    await supabase.auth.signOut();
    router.push('/');
    router.refresh();
  };

  return (
    <header
      className={`sticky top-0 z-50 w-full transition-all duration-300 ${
        scrolled
          ? 'dark:bg-black/80 bg-white/80 backdrop-blur-xl dark:border-b dark:border-zinc-800/80 border-b border-zinc-200/80 shadow-sm'
          : 'dark:bg-black bg-brand-light-bg'
      }`}
    >
      <div className="max-w-screen-xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-4">
        {/* ── Logo ── */}
        <div className="flex items-center gap-3 shrink-0">
          <div className="w-12 h-12 flex items-center justify-center shrink-0 -ml-1">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/logo.png" alt="Rise Properties Logo" className="w-full h-full object-contain scale-[1.3]" />
          </div>

          <div className="flex items-center gap-1.5">
            {/* Styled brand wordmark placeholder */}
            <div className="hidden sm:flex flex-col leading-none">
              <span className="text-[10px] tracking-[0.35em] font-medium text-brand-gold uppercase">
                Rise
              </span>
              <span className="text-[15px] tracking-[0.2em] font-bold dark:text-white text-brand-charcoal uppercase">
                Properties
              </span>
            </div>
            <span className="sm:hidden text-[15px] tracking-[0.2em] font-bold dark:text-white text-brand-charcoal uppercase">
              Rise
            </span>
          </div>

          <ChevronRight className="w-3 h-3 text-brand-gold/50 hidden sm:block" />
          <span className="hidden sm:block text-xs text-zinc-500 font-medium tracking-wide">
            Broker CRM
          </span>
        </div>

        {/* ── Right Controls ── */}
        <div className="flex items-center gap-2">
          {/* Theme Toggle */}
          <button
            onClick={toggleTheme}
            aria-label="Toggle theme"
            className="w-9 h-9 rounded-lg flex items-center justify-center dark:text-zinc-400 text-brand-charcoal dark:hover:text-white hover:text-black dark:hover:bg-zinc-800 hover:bg-zinc-100 transition-all duration-200"
          >
            {theme === 'dark' ? (
              <Sun className="w-4 h-4" />
            ) : (
              <Moon className="w-4 h-4" />
            )}
          </button>

          {/* Sign Out */}
          <button
            onClick={handleSignOut}
            disabled={signingOut}
            aria-label="Sign out"
            className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium dark:text-zinc-400 text-brand-charcoal dark:hover:text-white hover:text-black dark:hover:bg-zinc-800 hover:bg-zinc-100 transition-all duration-200 disabled:opacity-50"
          >
            {signingOut ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <LogOut className="w-4 h-4" />
            )}
            <span className="hidden sm:inline">Sign Out</span>
          </button>
        </div>
      </div>
    </header>
  );
}
