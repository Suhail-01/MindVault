'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuth } from '@/lib/auth';
import { useModals } from '@/lib/modals';
import { 
  Home,
  LayoutDashboard, 
  FolderOpen, 
  Share2, 
  Settings, 
  LogOut, 
  Plus,
  Star,
  Archive,
  Brain
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { motion } from 'motion/react';

const navItems = [
  { name: 'Home', href: '/', icon: Home },
  { name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
  { name: 'Collections', href: '/collections', icon: FolderOpen },
  { name: 'Graph View', href: '/graph', icon: Share2 },
  { name: 'Favorites', href: '/favorites', icon: Star },
  { name: 'Archive', href: '/archive', icon: Archive },
];

export function Sidebar() {
  const pathname = usePathname();
  const { user, logout } = useAuth();
  const { openSaveModal } = useModals();

  if (!user) return null;

  return (
    <aside className="fixed left-0 top-0 h-screen w-60 border-r border-gray-100 bg-white flex flex-col p-4 z-50">
      <Link 
        href="/dashboard" 
        title="Go to Home"
        className="flex items-center gap-2 px-2 mb-8 group transition-all hover:opacity-80"
      >
        <div className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center group-hover:scale-110 transition-transform duration-300 shadow-lg shadow-indigo-100">
          <Brain className="w-5 h-5 text-white" />
        </div>
        <span className="font-bold text-xl tracking-tight">MindVault</span>
      </Link>

      <button 
        onClick={openSaveModal}
        className="flex items-center gap-2 w-full bg-indigo-600 text-white rounded-xl px-4 py-2.5 mb-6 hover:bg-indigo-700 transition-colors shadow-sm shadow-indigo-200"
      >
        <Plus className="w-4 h-4" />
        <span className="font-medium">Save Item</span>
      </button>

      <nav className="flex-1 space-y-1">
        {navItems.map((item) => {
          const isActive = pathname === item.href;
          return (
            <Link
              key={item.name}
              href={item.href}
              className={cn(
                "flex items-center gap-3 px-3 py-2 rounded-lg transition-all duration-200 group",
                isActive 
                  ? "bg-indigo-50 text-indigo-700 font-medium" 
                  : "text-gray-500 hover:bg-gray-50 hover:text-gray-900"
              )}
            >
              <item.icon className={cn(
                "w-5 h-5",
                isActive ? "text-indigo-600" : "text-gray-400 group-hover:text-gray-600"
              )} />
              <span>{item.name}</span>
            </Link>
          );
        })}
      </nav>

      <div className="mt-auto pt-4 border-t border-gray-100 space-y-1">
        <Link
          href="/settings"
          className={cn(
            "flex items-center gap-3 px-3 py-2 rounded-lg transition-all duration-200 text-gray-500 hover:bg-gray-50 hover:text-gray-900",
            pathname === '/settings' && "bg-gray-50 text-gray-900 font-medium"
          )}
        >
          <Settings className="w-5 h-5 text-gray-400" />
          <span>Settings</span>
        </Link>
        <button
          onClick={logout}
          className="flex items-center gap-3 w-full px-3 py-2 rounded-lg transition-all duration-200 text-gray-500 hover:bg-red-50 hover:text-red-600"
        >
          <LogOut className="w-5 h-5 text-gray-400" />
          <span>Logout</span>
        </button>
      </div>
    </aside>
  );
}
