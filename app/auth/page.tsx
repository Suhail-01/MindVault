'use client';
import { useState, useEffect } from 'react';
import { useAuth } from '@/lib/auth';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Brain, Loader2, Github, Chrome } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import Image from 'next/image';
import Particles from '@/components/Particles';

export default function AuthPage() {
  const { user, signInWithGoogle, signUpWithEmail, signInWithEmail } = useAuth();
  const router = useRouter();
  const [isSignUp, setIsSignUp] = useState(true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: ''
  });

  useEffect(() => {
    if (user) {
      router.push('/');
    }
  }, [user, router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      if (isSignUp) {
        await signUpWithEmail(formData.email, formData.password, formData.name);
      } else {
        await signInWithEmail(formData.email, formData.password);
      }
    } catch (err: any) {
      if (err.code === 'auth/operation-not-allowed' || err.message?.includes('operation-not-allowed')) {
        setError(
          'Email/Password sign-in is not enabled in your Firebase Console. Please enable it at: https://console.firebase.google.com/project/ai-studio-applet-webapp-78279/authentication/providers'
        );
      } else {
        setError(err.message || 'An error occurred during authentication');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#0A0A0A] text-white flex overflow-hidden font-sans relative">
      {/* Particle Background */}
      <div className="absolute inset-0 z-0 pointer-events-auto">
        <Particles
          particleColors={["#4F46E5", "#7C3AED", "#ffffff"]}
          particleCount={200}
          particleSpread={10}
          speed={0.1}
          particleBaseSize={100}
          moveParticlesOnHover={true}
          alphaParticles={true}
          disableRotation={false}
        />
      </div>

      {/* Left Side: Form */}
      <div className="w-full lg:w-1/2 flex flex-col p-8 md:p-16 lg:p-24 justify-center relative z-10 bg-[#0A0A0A]/80 backdrop-blur-sm lg:bg-transparent">
        <div className="max-w-md w-full mx-auto">
          {/* Back Button */}
          <Link 
            href="/" 
            className="flex items-center gap-2 text-gray-500 hover:text-white transition-colors mb-12 text-sm font-medium group"
          >
            <motion.div
              whileHover={{ x: -4 }}
              className="flex items-center gap-2"
            >
              <span className="text-lg">←</span> Back to home
            </motion.div>
          </Link>

          {/* Logo */}
          <Link href={user ? "/dashboard" : "/"} className="flex items-center gap-2 mb-12 group transition-all hover:opacity-80">
            <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform duration-300 shadow-xl shadow-white/5">
              <Brain className="w-6 h-6 text-black" />
            </div>
            <span className="font-bold text-2xl tracking-tight">MindVault</span>
          </Link>

          <motion.div
            key={isSignUp ? 'signup' : 'signin'}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.4 }}
          >
            <h1 className="text-4xl font-bold mb-10 tracking-tight">
              {isSignUp ? 'Sign up for an account' : 'Sign in to your account'}
            </h1>

            <form onSubmit={handleSubmit} className="space-y-6">
              <AnimatePresence mode="wait">
                {isSignUp && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    className="space-y-2"
                  >
                    <label className="text-sm font-medium text-gray-400">Full name</label>
                    <input
                      type="text"
                      placeholder="Manu Arora"
                      required={isSignUp}
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      className="w-full bg-[#1A1A1A] border-none rounded-xl px-4 py-3.5 text-white placeholder-gray-600 focus:ring-2 focus:ring-white/20 transition-all outline-none"
                    />
                  </motion.div>
                )}
              </AnimatePresence>

              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-400">Email address</label>
                <input
                  type="email"
                  placeholder="hello@johndoe.com"
                  required
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  className="w-full bg-[#1A1A1A] border-none rounded-xl px-4 py-3.5 text-white placeholder-gray-600 focus:ring-2 focus:ring-white/20 transition-all outline-none"
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-400">Password</label>
                <input
                  type="password"
                  placeholder="••••••••"
                  required
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  className="w-full bg-[#1A1A1A] border-none rounded-xl px-4 py-3.5 text-white placeholder-gray-600 focus:ring-2 focus:ring-white/20 transition-all outline-none"
                />
              </div>

              {error && (
                <div className="bg-red-500/10 border border-red-500/50 rounded-xl p-4 text-sm text-red-500 space-y-2">
                  {error.includes('operation-not-allowed') ? (
                    <>
                      <p className="font-bold">Action Required in Firebase Console:</p>
                      <p>I cannot enable Email/Password sign-in automatically. You must enable it once in your project settings:</p>
                      <ol className="list-decimal list-inside space-y-1 ml-2">
                        <li>Click the button below to open settings.</li>
                        <li>Click <strong>&quot;Add new provider&quot;</strong>.</li>
                        <li>Select <strong>&quot;Email/Password&quot;</strong>.</li>
                        <li>Toggle <strong>&quot;Enable&quot;</strong> and click <strong>&quot;Save&quot;</strong>.</li>
                      </ol>
                      <a 
                        href="https://console.firebase.google.com/project/ai-studio-applet-webapp-78279/authentication/providers" 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="inline-block bg-red-500 text-white px-4 py-2 rounded-lg font-bold hover:bg-red-600 transition-all mt-2"
                      >
                        Go to Firebase Console
                      </a>
                      <p className="text-xs mt-2 opacity-70 italic">Alternatively, use the Google button below to sign in instantly.</p>
                    </>
                  ) : (
                    <p>{error}</p>
                  )}
                </div>
              )}

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-white text-black py-3.5 rounded-xl font-bold hover:bg-gray-200 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
              >
                {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : (isSignUp ? 'Sign Up' : 'Sign In')}
              </button>
            </form>

            <div className="mt-8 flex flex-col items-center gap-6">
              <div className="flex items-center gap-4 w-full">
                <div className="h-[1px] bg-gray-800 flex-1"></div>
                <span className="text-xs text-gray-500 uppercase tracking-widest">Or continue with</span>
                <div className="h-[1px] bg-gray-800 flex-1"></div>
              </div>

              <button
                onClick={signInWithGoogle}
                className="w-full bg-[#1A1A1A] text-white py-3.5 rounded-xl font-medium hover:bg-[#252525] transition-all flex items-center justify-center gap-3 border border-gray-800"
              >
                <Chrome className="w-5 h-5" />
                Google
              </button>

              <p className="text-gray-500 text-sm">
                {isSignUp ? 'Already have an account?' : "Don't have an account?"}{' '}
                <button
                  onClick={() => setIsSignUp(!isSignUp)}
                  className="text-white font-bold hover:underline"
                >
                  {isSignUp ? 'Sign in' : 'Sign up'}
                </button>
              </p>
            </div>
          </motion.div>
        </div>
      </div>

      {/* Right Side: Visual */}
      <div className="hidden lg:flex lg:w-1/2 bg-[#0F0F0F]/50 backdrop-blur-sm relative items-center justify-center overflow-hidden border-l border-gray-800 z-10">
        <div className="absolute inset-0 opacity-20">
          <div className="absolute top-0 left-0 w-full h-full bg-[radial-gradient(circle_at_50%_50%,_#333_0%,_transparent_70%)]"></div>
        </div>
        
        <div className="relative z-10 text-center max-w-md px-8">
          <div className="flex justify-center -space-x-4 mb-10">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <div key={i} className="w-16 h-16 rounded-full border-4 border-[#0F0F0F] overflow-hidden bg-gray-800 relative">
                <Image
                  src={`https://picsum.photos/seed/${i + 10}/200`}
                  alt="User"
                  fill
                  sizes="64px"
                  className="object-cover"
                  referrerPolicy="no-referrer"
                />
              </div>
            ))}
          </div>
          
          <h2 className="text-2xl font-bold mb-4">People love us</h2>
          <p className="text-gray-400 leading-relaxed">
            MindVault is loved by thousands of people across the world, be part of the community and join us.
          </p>
        </div>

        {/* Decorative elements */}
        <div className="absolute top-1/4 -right-20 w-64 h-64 bg-white/5 rounded-full blur-3xl"></div>
        <div className="absolute bottom-1/4 -left-20 w-64 h-64 bg-white/5 rounded-full blur-3xl"></div>
      </div>
    </div>
  );
}
