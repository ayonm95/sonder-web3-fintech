import type { Metadata } from 'next';
import './globals.css';
import { AudioPlayerProvider } from '@/components/AudioPlayerContext';
import { Navbar } from '@/components/Navbar';
import { PersistentPlayerBar } from '@/components/PersistentPlayerBar';

export const metadata: Metadata = {
  title: 'Sonder — Creator-First Royalty & Streaming Platform',
  description:
    'A decentralized creator music platform featuring double-entry financial ledgers, cryptographic Merkle tree settlements, real EIP-712 rights attestation, and transparent anti-fraud diagnostics.',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="dark">
      <body className="min-h-screen flex flex-col bg-background text-slate-100 antialiased selection:bg-brand-cyan/20 selection:text-brand-cyan">
        <AudioPlayerProvider>
          <Navbar />
          <main className="flex-1 pb-28">{children}</main>
          <PersistentPlayerBar />
        </AudioPlayerProvider>
      </body>
    </html>
  );
}
