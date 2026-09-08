'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  Music,
  Disc,
  BookOpen,
  GitBranch,
  ShieldAlert,
  Lock,
  Wallet,
  CheckCircle2,
} from 'lucide-react';

const NAV_ITEMS = [
  { href: '/', label: 'Discover', icon: Music },
  { href: '/studio', label: 'Creator Studio', icon: Disc },
  { href: '/ledger', label: 'Double-Entry Ledger', icon: BookOpen },
  { href: '/settlement', label: 'Merkle Settlement', icon: GitBranch },
  { href: '/fraud-diagnostics', label: 'Anti-Fraud', icon: ShieldAlert },
  { href: '/privacy', label: 'Privacy & CRM', icon: Lock },
];

export function Navbar() {
  const pathname = usePathname();

  return (
    <header className="sticky top-0 z-40 w-full border-b border-white/10 bg-background/80 backdrop-blur-xl">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        {/* Brand */}
        <div className="flex items-center gap-8">
          <Link href="/" className="flex items-center gap-2.5 group">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-brand-cyan via-brand-teal to-brand-violet shadow-glow-cyan">
              <Disc className="h-5 w-5 text-black group-hover:rotate-45 transition-transform duration-300" />
            </div>
            <div>
              <span className="text-xl font-bold tracking-tight bg-gradient-to-r from-white via-slate-200 to-slate-400 bg-clip-text text-transparent">
                SONDER
              </span>
              <span className="hidden sm:inline-block ml-2 text-[10px] font-mono tracking-widest uppercase text-brand-cyan/80 bg-brand-cyan/10 px-2 py-0.5 rounded-full border border-brand-cyan/20">
                Royalty Engine
              </span>
            </div>
          </Link>

          {/* Navigation Links */}
          <nav className="hidden md:flex items-center space-x-1">
            {NAV_ITEMS.map((item) => {
              const Icon = item.icon;
              const isActive = pathname === item.href;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                    isActive
                      ? 'bg-white/10 text-white shadow-sm border border-white/15'
                      : 'text-slate-400 hover:text-white hover:bg-white/5'
                  }`}
                >
                  <Icon className={`h-3.5 w-3.5 ${isActive ? 'text-brand-cyan' : 'text-slate-400'}`} />
                  {item.label}
                </Link>
              );
            })}
          </nav>
        </div>

        {/* Right Action / Wallet Info */}
        <div className="flex items-center gap-3">
          {/* Testnet Badge */}
          <div className="hidden sm:flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-mono">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
            Polygon Amoy (80002)
          </div>

          {/* Wallet Address Pill */}
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl glass-card text-xs font-mono border border-white/10 text-slate-300">
            <Wallet className="h-3.5 w-3.5 text-brand-teal" />
            <span className="text-slate-200">0x71C6...8605</span>
            <CheckCircle2 className="h-3.5 w-3.5 text-emerald-400" />
          </div>
        </div>
      </div>

      {/* Mobile Nav strip */}
      <div className="flex md:hidden overflow-x-auto px-4 py-2 border-t border-white/5 gap-2 scrollbar-none">
        {NAV_ITEMS.map((item) => {
          const Icon = item.icon;
          const isActive = pathname === item.href;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center gap-1.5 whitespace-nowrap px-2.5 py-1 rounded-md text-xs font-medium ${
                isActive
                  ? 'bg-brand-cyan/15 text-brand-cyan border border-brand-cyan/30'
                  : 'text-slate-400 bg-white/5'
              }`}
            >
              <Icon className="h-3 w-3" />
              {item.label}
            </Link>
          );
        })}
      </div>
    </header>
  );
}
