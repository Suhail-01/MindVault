'use client';

import { useEffect, useState, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth';
import { db } from '@/lib/firebase';
import { collection, addDoc } from 'firebase/firestore';
import { GoogleGenAI, Type } from "@google/genai";
import { Loader2, Brain, CheckCircle2, AlertCircle, ArrowLeft } from 'lucide-react';
import { motion } from 'motion/react';

const ai = new GoogleGenAI({ apiKey: process.env.NEXT_PUBLIC_GEMINI_API_KEY! });

function SaveContent() {
  const { user, loading: authLoading } = useAuth();
  const searchParams = useSearchParams();
  const router = useRouter();
  const [status, setStatus] = useState('Initializing...');
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const url = searchParams.get('url');

  useEffect(() => {
    if (authLoading) return;
    if (!user) {
      router.push('/');
      return;
    }
    if (!url) {
      setTimeout(() => setError('No URL provided'), 0);
      return;
    }

    const saveItem = async () => {
      try {
        setStatus('AI is analyzing content...');
        // Since we can't fetch metadata from client-side due to CORS, 
        // we'll use the URL as the title and provide a basic summary.
        const response = await ai.models.generateContent({
          model: "gemini-3-flash-preview",
          contents: `Analyze this URL and provide a 2-line summary and 5 relevant tags. 
          URL: ${url}`,
          config: {
            responseMimeType: "application/json",
            responseSchema: {
              type: Type.OBJECT,
              properties: {
                summary: { type: Type.STRING },
                tags: { type: Type.ARRAY, items: { type: Type.STRING } }
              },
              required: ["summary", "tags"]
            }
          }
        });

        const aiData = JSON.parse(response.text ?? '{}');

        setStatus('Saving to vault...');
        await addDoc(collection(db, 'saved_items'), {
          userId: user.uid,
          url: url,
          type: 'link',
          title: url,
          description: '',
          thumbnail_url: '',
          content: '',
          ai_summary: aiData.summary,
          ai_tags: aiData.tags,
          is_favorite: false,
          is_archived: false,
          created_at: new Date().toISOString(),
          last_surfaced_at: new Date().toISOString()
        });

        setSuccess(true);
        setStatus('Saved successfully!');
        setTimeout(() => router.push('/dashboard'), 2000);
      } catch (err: any) {
        console.error('Error saving item:', err);
        setError(err.message || 'Failed to save item');
      }
    };

    saveItem();
  }, [user, authLoading, url, router]);

  return (
    <div className="min-h-screen bg-[#F9F9F8] flex flex-col items-center justify-center p-6">
      <motion.div 
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className="w-full max-w-md bg-white rounded-[40px] p-12 shadow-2xl shadow-indigo-100 text-center"
      >
        <div className="w-20 h-20 bg-indigo-600 rounded-3xl flex items-center justify-center mx-auto mb-8 shadow-xl shadow-indigo-200">
          <Brain className="w-10 h-10 text-white" />
        </div>

        <h1 className="text-3xl font-bold tracking-tight mb-4">MindVault</h1>
        
        {error ? (
          <div className="space-y-6">
            <div className="flex items-center justify-center gap-2 text-red-500 bg-red-50 py-3 px-4 rounded-2xl">
              <AlertCircle className="w-5 h-5" />
              <span className="font-medium">{error}</span>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <button 
                onClick={() => router.back()}
                className="flex items-center justify-center gap-2 py-4 bg-gray-100 text-gray-900 rounded-2xl font-bold hover:bg-gray-200 transition-all"
              >
                <ArrowLeft className="w-4 h-4" />
                Back
              </button>
              <button 
                onClick={() => router.push('/dashboard')}
                className="py-4 bg-gray-900 text-white rounded-2xl font-bold hover:bg-black transition-all"
              >
                Dashboard
              </button>
            </div>
          </div>
        ) : success ? (
          <div className="space-y-6">
            <div className="flex items-center justify-center gap-2 text-green-600 bg-green-50 py-3 px-4 rounded-2xl">
              <CheckCircle2 className="w-5 h-5" />
              <span className="font-medium">Successfully Saved!</span>
            </div>
            <p className="text-gray-500 text-sm">Redirecting to your vault...</p>
          </div>
        ) : (
          <div className="space-y-6">
            <div className="flex items-center justify-center gap-3 text-indigo-600">
              <Loader2 className="w-6 h-6 animate-spin" />
              <span className="font-bold text-lg">{status}</span>
            </div>
            <p className="text-gray-500 text-sm truncate max-w-xs mx-auto">{url}</p>
          </div>
        )}
      </motion.div>
    </div>
  );
}

export default function SavePage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-[#F9F9F8] flex items-center justify-center"><Loader2 className="w-8 h-8 animate-spin text-indigo-600" /></div>}>
      <SaveContent />
    </Suspense>
  );
}
