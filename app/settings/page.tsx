'use client';

import { useAuth } from '@/lib/auth';
import { DashboardLayout } from '@/components/DashboardLayout';
import { User, Shield, CreditCard, Bell, LogOut, ChevronRight, Globe, Zap, Copy, Check } from 'lucide-react';
import Image from 'next/image';
import { useState } from 'react';

export default function Settings() {
  const { user, logout } = useAuth();
  const [copied, setCopied] = useState(false);

  const bookmarkletCode = `javascript:(function(){window.open('${window.location.origin}/save?url='+encodeURIComponent(window.location.href), 'MindVault', 'width=500,height=600');})();`;

  const copyBookmarklet = () => {
    navigator.clipboard.writeText(bookmarkletCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <DashboardLayout>
      <header className="mb-12">
        <h1 className="text-3xl font-bold tracking-tight mb-2">Settings</h1>
        <p className="text-gray-500">Manage your profile, preferences, and subscription.</p>
      </header>

      <div className="max-w-2xl space-y-8">
        {/* Profile */}
        <section className="bg-white border border-gray-100 rounded-3xl p-8">
          <div className="flex items-center gap-6 mb-8">
            <div className="relative w-20 h-20 rounded-full overflow-hidden border-4 border-indigo-50">
              {user?.photoURL ? (
                <Image src={user.photoURL} alt={user.displayName || ''} fill className="object-cover" />
              ) : (
                <div className="w-full h-full bg-indigo-100 flex items-center justify-center text-indigo-600 font-bold text-2xl">
                  {user?.displayName?.[0]}
                </div>
              )}
            </div>
            <div>
              <h2 className="text-xl font-bold">{user?.displayName}</h2>
              <p className="text-gray-500 text-sm">{user?.email}</p>
            </div>
          </div>

          <div className="space-y-4">
            <SettingsItem 
              icon={<User className="w-5 h-5 text-gray-400" />}
              title="Personal Information"
              description="Update your name and profile details."
            />
            <SettingsItem 
              icon={<Bell className="w-5 h-5 text-gray-400" />}
              title="Notifications"
              description="Manage how you receive updates."
            />
            <SettingsItem 
              icon={<Shield className="w-5 h-5 text-gray-400" />}
              title="Security"
              description="Manage your password and security settings."
            />
          </div>
        </section>

        {/* Browser Tools */}
        <section className="bg-white border border-gray-100 rounded-3xl p-8">
          <div className="flex items-center gap-3 mb-6">
            <Globe className="w-6 h-6 text-indigo-600" />
            <h2 className="text-xl font-bold">Browser Tools</h2>
          </div>
          
          <div className="space-y-6">
            <div className="p-6 bg-gray-50 rounded-2xl border border-gray-100">
              <div className="flex items-center gap-2 mb-2">
                <Zap className="w-4 h-4 text-indigo-600" />
                <h3 className="font-bold text-sm">MindVault Bookmarklet</h3>
              </div>
              <p className="text-xs text-gray-500 mb-4 leading-relaxed">
                Drag this button to your bookmarks bar to save any page instantly while browsing.
              </p>
              <div className="flex items-center gap-3">
                <a 
                  href={bookmarkletCode}
                  onClick={(e) => e.preventDefault()}
                  className="px-6 py-2.5 bg-indigo-600 text-white rounded-xl font-bold text-xs hover:bg-indigo-700 transition-all cursor-move shadow-lg shadow-indigo-100"
                >
                  Save to MindVault
                </a>
                <button 
                  onClick={copyBookmarklet}
                  className="p-2.5 bg-white border border-gray-200 rounded-xl hover:bg-gray-50 transition-colors"
                  title="Copy bookmarklet code"
                >
                  {copied ? <Check className="w-4 h-4 text-green-500" /> : <Copy className="w-4 h-4 text-gray-400" />}
                </button>
              </div>
            </div>

            <div className="p-6 bg-indigo-50/50 rounded-2xl border border-indigo-100">
              <h3 className="font-bold text-sm text-indigo-900 mb-1">Chrome Extension</h3>
              <p className="text-xs text-indigo-700 leading-relaxed">
                Our official Chrome extension is coming soon! It will allow you to highlight text directly on web pages and save them to your vault.
              </p>
            </div>
          </div>
        </section>

        {/* Subscription */}
        <section className="bg-indigo-600 rounded-3xl p-8 text-white relative overflow-hidden">
          <div className="relative z-10">
            <div className="flex items-center gap-2 mb-4">
              <CreditCard className="w-5 h-5" />
              <span className="font-bold uppercase tracking-widest text-[10px]">Current Plan</span>
            </div>
            <h2 className="text-3xl font-bold mb-2">MindVault Free</h2>
            <p className="text-indigo-100 mb-8 max-w-xs">Upgrade to Pro for unlimited storage, advanced AI features, and priority support.</p>
            <button className="px-6 py-3 bg-white text-indigo-600 rounded-xl font-bold hover:bg-indigo-50 transition-all shadow-xl shadow-indigo-900/20">
              Upgrade to Pro
            </button>
          </div>
          <div className="absolute top-[-20%] right-[-10%] w-64 h-64 bg-indigo-500 rounded-full blur-[80px] opacity-40"></div>
        </section>

        <button 
          onClick={logout}
          className="w-full py-4 bg-red-50 text-red-600 rounded-2xl font-bold hover:bg-red-100 transition-all flex items-center justify-center gap-2"
        >
          <LogOut className="w-5 h-5" />
          Sign Out
        </button>
      </div>
    </DashboardLayout>
  );
}

function SettingsItem({ icon, title, description }: { icon: React.ReactNode, title: string, description: string }) {
  return (
    <button className="flex items-center justify-between w-full p-4 hover:bg-gray-50 rounded-2xl transition-all group">
      <div className="flex items-center gap-4">
        <div className="w-10 h-10 bg-gray-50 rounded-xl flex items-center justify-center group-hover:bg-white transition-colors">
          {icon}
        </div>
        <div className="text-left">
          <h3 className="font-bold text-sm">{title}</h3>
          <p className="text-xs text-gray-400">{description}</p>
        </div>
      </div>
      <ChevronRight className="w-4 h-4 text-gray-300 group-hover:text-indigo-600 group-hover:translate-x-1 transition-all" />
    </button>
  );
}
