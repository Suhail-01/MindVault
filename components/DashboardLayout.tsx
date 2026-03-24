'use client';

import { Sidebar } from './Sidebar';
import { AuthGuard } from './AuthGuard';
import { useAuth } from '@/lib/auth';
import { usePathname } from 'next/navigation';
import { BackButton } from './BackButton';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';

export function DashboardLayout({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  const pathname = usePathname();

  if (!user) return <>{children}</>;

  const isDashboard = pathname === '/dashboard';

  return (
    <AuthGuard>
      <div className="flex min-h-screen bg-[#FFFFFF]">
        <Sidebar />
        <main className="flex-1 ml-60 p-8">
          <div className="max-w-7xl mx-auto">
            {isDashboard ? (
              <Link 
                href="/" 
                className="flex items-center gap-2 text-gray-500 hover:text-gray-900 transition-colors mb-6 group text-sm font-medium"
              >
                <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
                Back to Home
              </Link>
            ) : (
              <BackButton />
            )}
            {children}
          </div>
        </main>
      </div>
    </AuthGuard>
  );
}
