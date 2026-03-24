'use client';

import { Brain, Sparkles, Shield, Zap, ArrowRight, Github } from 'lucide-react';
import { motion } from 'motion/react';
import Link from 'next/link';
import { useAuth } from '@/lib/auth';
import Particles from '@/components/Particles';
import BorderGlow from '@/components/BorderGlow';
import BubbleMenu from '@/components/BubbleMenu';
import TextPressure from '@/components/TextPressure';

const menuItems = [
  {
    label: 'home',
    href: '#',
    ariaLabel: 'Home',
    rotation: -8,
    hoverStyles: { bgColor: '#3b82f6', textColor: '#ffffff' }
  },
  {
    label: 'about',
    href: '#',
    ariaLabel: 'About',
    rotation: 8,
    hoverStyles: { bgColor: '#10b981', textColor: '#ffffff' }
  },
  {
    label: 'projects',
    href: '#',
    ariaLabel: 'Projects',
    rotation: 8,
    hoverStyles: { bgColor: '#f59e0b', textColor: '#ffffff' }
  },
  {
    label: 'sign in',
    href: '/auth',
    ariaLabel: 'Sign In',
    rotation: 8,
    hoverStyles: { bgColor: '#ef4444', textColor: '#ffffff' }
  },
  {
    label: 'settings',
    href: '/settings',
    ariaLabel: 'Settings',
    rotation: -8,
    hoverStyles: { bgColor: '#8b5cf6', textColor: '#ffffff' }
  }
];

const features = [
  {
    icon: <Zap className="w-6 h-6 text-yellow-400" />,
    title: "Instant Capture",
    description: "Save any link, text, or image in a single click. We handle the organization.",
    glowColor: "45 100 60", // Yellowish
    colors: ['#FACC15', '#EAB308', '#CA8A04']
  },
  {
    icon: <Sparkles className="w-6 h-6 text-indigo-400" />,
    title: "AI Resurfacing",
    description: "Our AI automatically resurfaces old memories when they're most relevant to you.",
    glowColor: "240 80 70", // Indigoy
    colors: ['#818CF8', '#6366F1', '#4F46E5']
  },
  {
    icon: <Shield className="w-6 h-6 text-green-400" />,
    title: "Private & Secure",
    description: "Your data is encrypted and only accessible by you. Your privacy is our priority.",
    glowColor: "140 80 60", // Greenish
    colors: ['#4ADE80', '#22C55E', '#16A34A']
  }
];

export default function LandingPage() {
  const { user } = useAuth();

  return (
    <div className="min-h-screen bg-[#0A0A0A] text-white font-sans selection:bg-white selection:text-black">
      {/* Particle Background */}
      <div className="fixed inset-0 z-0 pointer-events-none">
        <Particles
          particleColors={["#4F46E5", "#7C3AED", "#ffffff"]}
          particleCount={150}
          particleSpread={10}
          speed={0.05}
          particleBaseSize={80}
          moveParticlesOnHover={false}
          alphaParticles={true}
          disableRotation={false}
        />
      </div>

      {/* Navigation */}
      <div className="relative z-50">
        <BubbleMenu
          logo={
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-black rounded-lg flex items-center justify-center">
                <Brain className="w-6 h-6 text-white" />
              </div>
              <span className="font-bold text-black text-lg tracking-tighter">MindVault</span>
            </div>
          }
          items={menuItems}
          menuAriaLabel="Toggle navigation"
          menuBg="#ffffff"
          menuContentColor="#111111"
          useFixedPosition={false}
          animationEase="back.out(1.5)"
          animationDuration={0.5}
          staggerDelay={0.12}
        />
      </div>

      {/* Hero Section */}
      <main className="relative z-10 pt-20 pb-32 px-8 max-w-7xl mx-auto text-center">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        >
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/5 border border-white/10 mb-8">
            <Sparkles className="w-3 h-3 text-indigo-400" />
            <span className="text-[10px] font-bold uppercase tracking-widest text-indigo-200">AI-Powered Personal Knowledge Vault</span>
          </div>
          
          <div className="relative h-[120px] md:h-[200px] mb-8 w-full max-w-4xl mx-auto">
            <TextPressure
              text="MindVault"
              flex
              alpha={false}
              stroke={false}
              width
              weight
              italic
              textColor="#ffffff"
              minFontSize={48}
            />
          </div>
          
          <p className="text-gray-400 text-lg md:text-xl max-w-2xl mx-auto mb-12 leading-relaxed">
            MindVault helps you capture, organize, and resurface your ideas and links using advanced AI. Never lose a thought again.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link 
              href={user ? "/dashboard" : "/auth"} 
              className="w-full sm:w-auto px-8 py-4 bg-white text-black rounded-2xl font-bold text-lg hover:scale-105 transition-all flex items-center justify-center gap-2 group"
            >
              {user ? "Go to Dashboard" : "Start your vault for free"}
              <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
            </Link>
            <a 
              href="https://github.com" 
              target="_blank"
              className="w-full sm:w-auto px-8 py-4 bg-white/5 text-white border border-white/10 rounded-2xl font-bold text-lg hover:bg-white/10 transition-all flex items-center justify-center gap-2"
            >
              <Github className="w-5 h-5" />
              Star on GitHub
            </a>
          </div>
        </motion.div>

        {/* Features Section */}
        <section className="mt-32">
          <div className="text-center mb-16 px-8">
            <h2 className="text-4xl md:text-5xl font-bold tracking-tight mb-4">Powerful Features</h2>
            <p className="text-gray-400 max-w-2xl mx-auto">
              Everything you need to build your digital legacy, powered by cutting-edge AI and secure infrastructure.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {features.map((feature, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.6, delay: i * 0.1 }}
              >
                <BorderGlow
                  edgeSensitivity={30}
                  glowColor={feature.glowColor}
                  backgroundColor="#111111"
                  borderRadius={32}
                  glowRadius={50}
                  glowIntensity={0.8}
                  coneSpread={30}
                  animated={true}
                  colors={feature.colors}
                  className="h-full"
                >
                  <div className="p-10 text-left h-full flex flex-col">
                    <div className="w-14 h-14 bg-white/5 rounded-2xl flex items-center justify-center mb-8 group-hover:scale-110 transition-transform">
                      {feature.icon}
                    </div>
                    <h3 className="text-2xl font-bold mb-4">{feature.title}</h3>
                    <p className="text-gray-500 leading-relaxed text-lg">{feature.description}</p>
                  </div>
                </BorderGlow>
              </motion.div>
            ))}
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="relative z-10 border-t border-white/10 py-12 px-8 mt-32">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-8">
          <div className="flex items-center gap-2">
            <Brain className="w-5 h-5 text-gray-500" />
            <span className="font-bold text-gray-500">MindVault</span>
          </div>
          <p className="text-gray-600 text-sm">© 2026 MindVault. All rights reserved.</p>
          <div className="flex items-center gap-6">
            <Link href="#" className="text-gray-600 hover:text-white transition-colors text-sm">Privacy</Link>
            <Link href="#" className="text-gray-600 hover:text-white transition-colors text-sm">Terms</Link>
            <Link href="#" className="text-gray-600 hover:text-white transition-colors text-sm">Twitter</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
