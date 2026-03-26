'use client';

import { Sidebar } from './Sidebar';
import { AuthGuard } from './AuthGuard';
import { useAuth } from '@/lib/auth';
import { usePathname } from 'next/navigation';
import { BackButton } from './BackButton';
import Link from 'next/link';
import { ArrowLeft, MessageSquare } from 'lucide-react';
import { useModals } from '@/lib/modals';
import { motion } from 'motion/react';

export function DashboardLayout({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  const pathname = usePathname();
  const { openChat, isChatOpen } = useModals();

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

        {/* Floating Chat Button */}
        {!isChatOpen && (
          <motion.button
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            onClick={openChat}
            className="fixed bottom-8 right-8 z-50 w-14 h-14 bg-indigo-600 text-white rounded-2xl shadow-2xl shadow-indigo-200 flex items-center justify-center hover:bg-indigo-700 transition-all"
          >
            <MessageSquare className="w-6 h-6" />
          </motion.button>
        )}
      </div>
    </AuthGuard>
  );
}
