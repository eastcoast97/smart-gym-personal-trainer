import './globals.css';
import type { Metadata } from 'next';
import SessionProvider from '@/components/SessionProvider';

export const metadata: Metadata = {
  title: 'Smart GYM Personal Trainer',
  description: 'Build a "Smart Gym & Personal Trainer" application where the interface tracks individual clients usi',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="dark" suppressHydrationWarning>
      <body className="bg-[#0a0a0f] text-gray-100 min-h-screen font-sans antialiased selection:bg-emerald-500/30" suppressHydrationWarning>
        <SessionProvider>
        <div className="flex min-h-screen">
          {/* Sidebar */}
          <aside className="w-64 bg-[#0c0c14] border-r border-white/5 flex flex-col sticky top-0 h-screen">
            <div className="p-4 border-b border-white/5">
              <a href="/" className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-emerald-600 flex items-center justify-center font-bold text-white shadow-lg shadow-emerald-500/20">
                  S
                </div>
                <span className="font-bold text-lg tracking-tight text-white">Smart GYM Personal Trainer</span>
              </a>
            </div>
            <nav className="flex-1 p-3 space-y-1 overflow-y-auto">
              <a href="/" className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-zinc-400 hover:text-white hover:bg-[#1a1a24] transition-colors text-sm">
                <span>🏠</span>
                <span>Home</span>
              </a>
              <a href="/workouts" className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-zinc-400 hover:text-white hover:bg-[#1a1a24] transition-colors text-sm">
                <span>💪</span>
                <span>Workouts</span>
              </a>
            </nav>
            <div className="p-4 border-t border-white/5 text-zinc-600 text-xs">
              © {new Date().getFullYear()} Smart GYM Personal Trainer
            </div>
          </aside>

          {/* Main content */}
          <div className="flex-1 flex flex-col min-h-screen">
            <header className="h-14 bg-[#0a0a0f]/80 backdrop-blur-md border-b border-white/5 sticky top-0 z-40 flex items-center justify-between px-6">
              <div className="flex-1 flex items-center">
              <div className="relative">
                <input type="text" placeholder="Search..." className="w-48 lg:w-64 px-3 py-1.5 rounded-lg bg-white/5 border border-white/10 text-gray-300 placeholder-gray-500 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/50" />
                <span className="absolute right-2.5 top-1/2 -translate-y-1/2 text-xs text-zinc-600">⌘K</span>
              </div>
              </div>
              <div className="flex items-center gap-4 text-sm text-zinc-400">
                <span>🔔</span>
                <span>👤</span>
              </div>
            </header>
            <main className="flex-1 p-6">
              {children}
            </main>
          </div>
        </div>
        </SessionProvider>
      </body>
    </html>
  );
}
