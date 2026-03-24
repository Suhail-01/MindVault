'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import { useAuth } from '@/lib/auth';
import { db } from '@/lib/firebase';
import { collection, query, where, onSnapshot, orderBy, limit } from 'firebase/firestore';
import { DashboardLayout } from '@/components/DashboardLayout';
import { ItemCard } from '@/components/ItemCard';
import { Search, Filter, Plus, Sparkles, Clock } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { formatDistanceToNow } from 'date-fns';
import { GoogleGenAI } from "@google/genai";

function cosineSimilarity(vecA: number[], vecB: number[]) {
  let dotProduct = 0;
  let normA = 0;
  let normB = 0;
  for (let i = 0; i < vecA.length; i++) {
    dotProduct += vecA[i] * vecB[i];
    normA += vecA[i] * vecA[i];
    normB += vecB[i] * vecB[i];
  }
  return dotProduct / (Math.sqrt(normA) * Math.sqrt(normB));
}

export default function Dashboard() {
  const { user } = useAuth();
  const [items, setItems] = useState<any[]>([]);
  const [resurfacedItem, setResurfacedItem] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [isSemanticSearch, setIsSemanticSearch] = useState(false);
  const [semanticResults, setSemanticResults] = useState<any[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [activeTab, setActiveTab] = useState('all');

  useEffect(() => {
    if (!isSemanticSearch || !searchQuery.trim() || items.length === 0) {
      setSemanticResults([]);
      return;
    }

    const timer = setTimeout(async () => {
      setIsSearching(true);
      try {
        const ai = new GoogleGenAI({ apiKey: process.env.NEXT_PUBLIC_GEMINI_API_KEY! });
        
        // 1. Get embedding for the query
        const queryEmbedding = await ai.models.embedContent({
          model: "gemini-embedding-2-preview",
          contents: [searchQuery]
        });

        // 2. Get embeddings for all items (title + description + summary)
        const itemContents = items.map((item: any) => 
          `${item.title} ${item.description || ''} ${item.ai_summary || ''}`
        );

        const itemEmbeddings = await ai.models.embedContent({
          model: "gemini-embedding-2-preview",
          contents: itemContents
        });

        // 3. Calculate cosine similarity
        const results = items.map((item: any, index: number) => {
          if (!queryEmbedding?.embeddings?.[0]?.values || 
              !itemEmbeddings?.embeddings?.[index]?.values) {
            return { ...item, similarity: 0 };
          }
          const similarity = cosineSimilarity(
            queryEmbedding.embeddings[0].values,
            itemEmbeddings.embeddings[index].values
          );
          return { ...item, similarity };
        });

        // 4. Sort and return top results
        const sortedResults = results
          .sort((a: any, b: any) => b.similarity - a.similarity)
          .slice(0, 10);

        setSemanticResults(sortedResults);
      } catch (err) {
        console.error('Semantic search failed:', err);
      } finally {
        setIsSearching(false);
      }
    }, 500);

    return () => clearTimeout(timer);
  }, [searchQuery, isSemanticSearch, items]);

  useEffect(() => {
    if (!user) return;

    const q = query(
      collection(db, 'saved_items'),
      where('userId', '==', user.uid),
      orderBy('created_at', 'desc')
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const newItems = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setItems(newItems);
      
      // Randomly pick an old item for resurfacing
      if (newItems.length > 5) {
        const oldItems = newItems.slice(Math.floor(newItems.length / 2));
        setResurfacedItem(oldItems[Math.floor(Math.random() * oldItems.length)]);
      }
      
      setLoading(false);
    }, (error) => {
      console.error("Error fetching items:", error);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [user]);

  const filteredItems = isSemanticSearch && searchQuery.trim() 
    ? semanticResults 
    : items.filter(item => {
        const matchesSearch = !searchQuery.trim() || 
                             item.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                             item.description?.toLowerCase().includes(searchQuery.toLowerCase());
        const matchesTab = activeTab === 'all' 
          ? !item.is_archived 
          : (activeTab === 'favorites' ? item.is_favorite && !item.is_archived : item.is_archived);
        return matchesSearch && matchesTab;
      });

  return (
    <DashboardLayout>
      <header className="flex items-center justify-between mb-12">
        <div>
          <h1 className="text-3xl font-bold tracking-tight mb-2">Good morning, {user?.displayName?.split(' ')[0]}</h1>
          <p className="text-gray-500">You have {items.length} items saved in your vault.</p>
        </div>
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2 px-3 py-1.5 bg-[#F9F9F8] rounded-xl border border-gray-100">
            <Sparkles className={`w-4 h-4 ${isSemanticSearch ? 'text-indigo-600' : 'text-gray-400'}`} />
            <span className="text-xs font-bold text-gray-600">AI Search</span>
            <button 
              onClick={() => setIsSemanticSearch(!isSemanticSearch)}
              className={`w-8 h-4 rounded-full transition-all relative ${isSemanticSearch ? 'bg-indigo-600' : 'bg-gray-300'}`}
            >
              <div className={`absolute top-0.5 w-3 h-3 bg-white rounded-full transition-all ${isSemanticSearch ? 'left-4.5' : 'left-0.5'}`} />
            </button>
          </div>
          <div className="relative group">
            <Search className={`absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 transition-colors ${isSearching ? 'text-indigo-600 animate-pulse' : 'text-gray-400 group-focus-within:text-indigo-600'}`} />
            <input 
              type="text" 
              placeholder={isSemanticSearch ? "Ask your vault anything..." : "Search your vault..."}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 pr-4 py-2.5 bg-[#F9F9F8] border-none rounded-xl w-64 focus:ring-2 focus:ring-indigo-500 transition-all outline-none"
            />
          </div>
        </div>
      </header>

      {/* Memory Resurfacing */}
      {resurfacedItem && (
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-indigo-600 rounded-[32px] p-8 mb-12 text-white relative overflow-hidden shadow-2xl shadow-indigo-200"
        >
          <div className="relative z-10 flex flex-col md:flex-row items-center gap-8">
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-4">
                <Sparkles className="w-5 h-5 text-indigo-200" />
                <span className="font-bold uppercase tracking-widest text-[10px] text-indigo-200">Memory Resurfacing</span>
              </div>
              <h2 className="text-2xl font-bold mb-4">You saved this {formatDistanceToNow(new Date(resurfacedItem.created_at))} ago</h2>
              <p className="text-indigo-100 mb-6 text-lg line-clamp-2 italic">&quot;{resurfacedItem.title}&quot;</p>
              <button className="px-6 py-3 bg-white text-indigo-600 rounded-xl font-bold hover:bg-indigo-50 transition-all shadow-xl shadow-indigo-900/20">
                Review Item
              </button>
            </div>
            {resurfacedItem.thumbnail_url && (
              <div className="w-full md:w-64 h-40 relative rounded-2xl overflow-hidden shadow-2xl">
                <Image 
                  src={resurfacedItem.thumbnail_url} 
                  alt="" 
                  fill 
                  className="object-cover" 
                  referrerPolicy="no-referrer"
                />
              </div>
            )}
          </div>
          <div className="absolute top-[-20%] right-[-10%] w-64 h-64 bg-indigo-500 rounded-full blur-[80px] opacity-40"></div>
        </motion.div>
      )}

      {/* Tabs */}
      <div className="flex items-center gap-8 border-b border-gray-100 mb-8">
        {['all', 'favorites', 'archived'].map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`pb-4 text-sm font-medium capitalize transition-all relative ${
              activeTab === tab ? 'text-indigo-600' : 'text-gray-500 hover:text-gray-900'
            }`}
          >
            {tab}
            {activeTab === tab && (
              <motion.div 
                layoutId="activeTab"
                className="absolute bottom-0 left-0 right-0 h-0.5 bg-indigo-600"
              />
            )}
          </button>
        ))}
      </div>

      {/* Grid */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3, 4, 5, 6].map(i => (
            <div key={i} className="h-64 bg-gray-50 rounded-2xl animate-pulse" />
          ))}
        </div>
      ) : filteredItems.length > 0 ? (
        <motion.div 
          layout
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
        >
          <AnimatePresence mode="popLayout">
            {filteredItems.map((item) => (
              <ItemCard key={item.id} item={item} />
            ))}
          </AnimatePresence>
        </motion.div>
      ) : (
        <div className="flex flex-col items-center justify-center py-32 text-center">
          <div className="w-20 h-20 bg-gray-50 rounded-full flex items-center justify-center mb-6">
            <Plus className="w-8 h-8 text-gray-300" />
          </div>
          <h3 className="text-xl font-bold mb-2">No items found</h3>
          <p className="text-gray-500 max-w-xs">Start by saving your first link or idea to your vault.</p>
        </div>
      )}
    </DashboardLayout>
  );
}
