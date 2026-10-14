import type { Metadata } from 'next';
import './globals.css';
import { AppProviders } from '@/components/providers/AppProviders';
import { AuthGate } from '@/components/auth/AuthGate';
import { Sidebar } from '@/components/layout/Sidebar';
import { Header } from '@/components/layout/Header';
import { GlobalSearchModal } from '@/components/layout/GlobalSearchModal';

export const metadata: Metadata = {
  title: 'ST25 VIETNAM - IslePilot Admin Control Panel',
  description: 'Production-ready Admin Control Panel Web Dashboard for The Isle server cluster integrated with IslePilot API',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="vi" className="dark">
      <body className="min-h-screen bg-[#050811] text-zinc-100 antialiased flex overflow-hidden">
        <AppProviders>
          <AuthGate>
            <div className="flex h-screen w-screen overflow-hidden">
              <Sidebar />
              <div className="flex-1 flex flex-col h-screen overflow-hidden">
                <Header />
                <main className="flex-1 overflow-y-auto p-6 md:p-8">
                  {children}
                </main>
              </div>
            </div>
            <GlobalSearchModal />
          </AuthGate>
        </AppProviders>
      </body>
    </html>
  );
}

