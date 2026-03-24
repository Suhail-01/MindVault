'use client';

import { useRouter } from 'next/navigation';
import { ArrowLeft } from 'lucide-react';
import { motion } from 'motion/react';

export function BackButton() {
  const router = useRouter();

  const handleBack = () => {
    if (window.history.length > 1) {
      router.back();
    } else {
      router.push('/dashboard');
    }
  };

  return (
    <motion.button
      initial={{ opacity: 0, x: -10 }}
      animate={{ opacity: 1, x: 0 }}
      onClick={handleBack}
      className="flex items-center gap-2 text-gray-500 hover:text-gray-900 transition-colors mb-6 group"
    >
      <div className="w-8 h-8 rounded-full bg-gray-50 flex items-center justify-center group-hover:bg-gray-100 transition-colors">
        <ArrowLeft className="w-4 h-4" />
      </div>
      <span className="text-sm font-medium">Back</span>
    </motion.button>
  );
}
