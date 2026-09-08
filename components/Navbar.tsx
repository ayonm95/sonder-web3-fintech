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
  const [account, setAccount] = React.useState<string | null>(null);
  const [isConnecting, setIsConnecting] = React.useState(false);
  const [chainId, setChainId] = React.useState<string | null>(null);

  React.useEffect(() => {
    if (typeof window !== 'undefined' && (window as any).ethereum) {
      const ethereum = (window as any).ethereum;

      // Check already connected accounts
      ethereum.request({ method: 'eth_accounts' })
        .then((accounts: string[]) => {
          if (accounts && accounts.length > 0) {
            setAccount(accounts[0]);
          }
        })
        .catch(console.error);

      // Check current chain
      ethereum.request({ method: 'eth_chainId' })
        .then((currentChain: string) => setChainId(currentChain))
        .catch(console.error);

      const handleAccountsChanged = (accounts: string[]) => {
        if (accounts.length > 0) {
          setAccount(accounts[0]);
        } else {
          setAccount(null);
        }
      };

      const handleChainChanged = (newChainId: string) => {
        setChainId(newChainId);
      };

      ethereum.on('accountsChanged', handleAccountsChanged);
      ethereum.on('chainChanged', handleChainChanged);

      return () => {
        if (ethereum.removeListener) {
          ethereum.removeListener('accountsChanged', handleAccountsChanged);
          ethereum.removeListener('chainChanged', handleChainChanged);
        }
      };
    }
  }, []);

  const connectWallet = async () => {
    if (typeof window === 'undefined' || !(window as any).ethereum) {
      alert('MetaMask or a Web3 wallet extension was not detected. Please install MetaMask to connect your real wallet.');
      return;
    }

    try {
      setIsConnecting(true);
      const ethereum = (window as any).ethereum;
      const accounts = await ethereum.request({ method: 'eth_requestAccounts' });
      if (accounts && accounts.length > 0) {
        setAccount(accounts[0]);
      }

      // Check & switch to Polygon Amoy (80002 = 0x13882)
      const currentChain = await ethereum.request({ method: 'eth_chainId' });
      const currentChainNum = typeof currentChain === 'string' && currentChain.startsWith('0x')
        ? parseInt(currentChain, 16)
        : Number(currentChain);

      if (currentChainNum !== 80002) {
        await switchToAmoy();
      }
    } catch (err: any) {
      console.error('Wallet connection failed:', err);
    } finally {
      setIsConnecting(false);
    }
  };

  const switchToAmoy = async () => {
    if (typeof window === 'undefined' || !(window as any).ethereum) return;
    const ethereum = (window as any).ethereum;
    try {
      await ethereum.request({
        method: 'wallet_switchEthereumChain',
        params: [{ chainId: '0x13882' }],
      });
    } catch (switchError: any) {
      if (switchError.code === 4902) {
        await ethereum.request({
          method: 'wallet_addEthereumChain',
          params: [
            {
              chainId: '0x13882',
              chainName: 'Polygon Amoy Testnet',
              rpcUrls: ['https://polygon-amoy.drpc.org'],
              nativeCurrency: { name: 'POL', symbol: 'POL', decimals: 18 },
              blockExplorerUrls: ['https://amoy.polygonscan.com'],
            },
          ],
        });
      }
    }
  };

  const isAmoy = React.useMemo(() => {
    if (!chainId) return true; // Default to true while detecting
    try {
      const num = typeof chainId === 'string' && chainId.startsWith('0x')
        ? parseInt(chainId, 16)
        : Number(chainId);
      return num === 80002;
    } catch {
      return true;
    }
  }, [chainId]);

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
          <button
            onClick={!isAmoy ? switchToAmoy : undefined}
            className={`hidden sm:flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-mono border transition-all ${
              !isAmoy ? 'cursor-pointer hover:bg-amber-500/20 active:scale-95' : ''
            } ${
              isAmoy
                ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400'
                : 'bg-amber-500/10 border-amber-500/20 text-amber-400'
            }`}
            title={!isAmoy ? 'Click to switch MetaMask to Polygon Amoy' : 'Connected to Polygon Amoy Testnet'}
          >
            <span className={`h-1.5 w-1.5 rounded-full animate-pulse ${isAmoy ? 'bg-emerald-400' : 'bg-amber-400'}`} />
            {isAmoy ? 'Polygon Amoy (80002)' : 'Switch to Amoy (80002)'}
          </button>

          {/* Interactive Wallet Address Pill */}
          {account ? (
            <div
              title={`Connected: ${account} (Click to copy)`}
              onClick={() => {
                navigator.clipboard.writeText(account);
                alert(`Copied wallet address to clipboard:\n${account}`);
              }}
              className="flex items-center gap-2 px-3 py-1.5 rounded-xl glass-card text-xs font-mono border border-emerald-500/30 text-slate-200 cursor-pointer hover:border-emerald-500/60 hover:bg-white/5 transition-all shadow-sm"
            >
              <Wallet className="h-3.5 w-3.5 text-emerald-400" />
              <span>{account.slice(0, 6)}...{account.slice(-4)}</span>
              <CheckCircle2 className="h-3.5 w-3.5 text-emerald-400" />
            </div>
          ) : (
            <button
              onClick={connectWallet}
              disabled={isConnecting}
              className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-brand-cyan/10 border border-brand-cyan/30 text-xs font-mono text-brand-cyan hover:bg-brand-cyan/20 hover:border-brand-cyan/50 active:scale-95 transition-all shadow-sm"
            >
              <Wallet className="h-3.5 w-3.5" />
              <span>{isConnecting ? 'Connecting...' : 'Connect MetaMask'}</span>
            </button>
          )}
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
