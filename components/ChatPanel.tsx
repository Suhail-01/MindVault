'use client';

import { useState, useEffect, useRef } from 'react';
import { useAuth } from '@/lib/auth';
import { db } from '@/lib/firebase';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { GoogleGenAI, Type } from "@google/genai";
import { X, Send, Sparkles, Loader2, Brain, MessageSquare } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import ReactMarkdown from 'react-markdown';

const ai = new GoogleGenAI({ apiKey: process.env.NEXT_PUBLIC_GEMINI_API_KEY! });

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

export function ChatPanel({ isOpen, onClose }: { isOpen: boolean, onClose: () => void }) {
  const { user } = useAuth();
  const [messages, setMessages] = useState<{ role: 'user' | 'ai', content: string }[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || !user || loading) return;

    const userMessage = input.trim();
    setInput('');
    setMessages(prev => [...prev, { role: 'user', content: userMessage }]);
    setLoading(true);

    try {
      // 1. Fetch all items for context (in a real app, we'd use a vector DB or search index)
      const q = query(collection(db, 'saved_items'), where('userId', '==', user.uid));
      const snapshot = await getDocs(q);
      const items = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));

      if (items.length === 0) {
        setMessages(prev => [...prev, { role: 'ai', content: "Your vault is empty! Save some links or ideas first so I can help you with them." }]);
        setLoading(false);
        return;
      }

      // 2. RAG: Find relevant items using embeddings
      // Get query embedding
      const queryEmbedding = await ai.models.embedContent({
        model: "gemini-embedding-2-preview",
        contents: [userMessage]
      });

      // Get embeddings for items (ideally these would be pre-calculated and stored in Firestore)
      const itemContents = items.map((item: any) => 
        `${item.title} ${item.description || ''} ${item.ai_summary || ''} ${item.content || ''}`.substring(0, 1000)
      );

      const itemEmbeddings = await ai.models.embedContent({
        model: "gemini-embedding-2-preview",
        contents: itemContents
      });

      // Calculate similarity and get top 5
      const results = items.map((item: any, index: number) => {
        if (!queryEmbedding?.embeddings?.[0]?.values || !itemEmbeddings?.embeddings?.[index]?.values) {
          return { ...item, similarity: 0 };
        }
        const similarity = cosineSimilarity(
          queryEmbedding.embeddings[0].values,
          itemEmbeddings.embeddings[index].values
        );
        return { ...item, similarity };
      });

      const relevantItems = results
        .sort((a: any, b: any) => b.similarity - a.similarity)
        .slice(0, 5)
        .filter((item: any) => item.similarity > 0.3);

      // 3. Generate response with context
      const context = relevantItems.length > 0 
        ? relevantItems.map((item: any) => `ITEM: ${item.title}\nSUMMARY: ${item.ai_summary}\nCONTENT: ${item.content?.substring(0, 500)}`).join('\n\n')
        : "No specific relevant items found in the vault.";

      const response = await ai.models.generateContent({
        model: "gemini-3-flash-preview",
        contents: [
          {
            role: "user",
            parts: [{ text: `You are MindVault AI, a helpful assistant for a Personal Knowledge Management app. 
            Use the following context from the user's vault to answer their question. 
            If the answer isn't in the context, say you don't know based on the vault but try to provide general advice if helpful.
            
            CONTEXT FROM VAULT:
            ${context}
            
            USER QUESTION:
            ${userMessage}` }]
          }
        ]
      });

      setMessages(prev => [...prev, { role: 'ai', content: response.text || "I'm sorry, I couldn't process that." }]);
    } catch (error) {
      console.error('Chat failed:', error);
      setMessages(prev => [...prev, { role: 'ai', content: "Something went wrong. Please try again later." }]);
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[100] flex items-end justify-end p-4 pointer-events-none">
        <motion.div
          initial={{ opacity: 0, y: 20, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 20, scale: 0.95 }}
          className="relative w-full max-w-md h-[600px] bg-white rounded-[32px] shadow-2xl overflow-hidden border border-gray-100 flex flex-col pointer-events-auto"
        >
          {/* Header */}
          <div className="p-6 bg-indigo-600 text-white flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center backdrop-blur-sm">
                <Brain className="w-6 h-6 text-white" />
              </div>
              <div>
                <h2 className="font-bold tracking-tight">Vault Assistant</h2>
                <div className="flex items-center gap-1.5">
                  <div className="w-1.5 h-1.5 bg-green-400 rounded-full animate-pulse" />
                  <span className="text-[10px] font-bold uppercase tracking-widest text-indigo-200">AI Powered</span>
                </div>
              </div>
            </div>
            <button onClick={onClose} className="p-2 hover:bg-white/10 rounded-xl transition-colors">
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Messages */}
          <div 
            ref={scrollRef}
            className="flex-1 overflow-y-auto p-6 space-y-6 bg-[#F9F9F8]"
          >
            {messages.length === 0 && (
              <div className="flex flex-col items-center justify-center h-full text-center space-y-4 opacity-50">
                <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center">
                  <MessageSquare className="w-8 h-8 text-gray-400" />
                </div>
                <div>
                  <p className="font-bold text-gray-900">Ask your vault anything</p>
                  <p className="text-xs text-gray-500 max-w-[200px] mx-auto">I can help you find connections, summarize your research, or recall specific details.</p>
                </div>
              </div>
            )}
            {messages.map((msg, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, x: msg.role === 'user' ? 20 : -20 }}
                animate={{ opacity: 1, x: 0 }}
                className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                <div className={`max-w-[85%] p-4 rounded-2xl text-sm ${
                  msg.role === 'user' 
                    ? 'bg-indigo-600 text-white rounded-tr-none shadow-lg shadow-indigo-100' 
                    : 'bg-white text-gray-800 rounded-tl-none border border-gray-100 shadow-sm'
                }`}>
                  {msg.role === 'ai' ? (
                    <div className="prose prose-sm prose-indigo max-w-none">
                      <ReactMarkdown>{msg.content}</ReactMarkdown>
                    </div>
                  ) : (
                    msg.content
                  )}
                </div>
              </motion.div>
            ))}
            {loading && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="flex justify-start"
              >
                <div className="bg-white p-4 rounded-2xl rounded-tl-none border border-gray-100 shadow-sm flex items-center gap-2">
                  <Loader2 className="w-4 h-4 text-indigo-600 animate-spin" />
                  <span className="text-xs font-medium text-gray-500">Thinking...</span>
                </div>
              </motion.div>
            )}
          </div>

          {/* Input */}
          <form onSubmit={handleSend} className="p-4 bg-white border-t border-gray-100">
            <div className="relative group">
              <input
                type="text"
                placeholder="Ask a question..."
                value={input}
                onChange={(e) => setInput(e.target.value)}
                disabled={loading}
                className="w-full pl-4 pr-12 py-3 bg-gray-50 border-none rounded-2xl focus:ring-2 focus:ring-indigo-500 transition-all outline-none text-sm"
              />
              <button
                type="submit"
                disabled={loading || !input.trim()}
                className="absolute right-2 top-1/2 -translate-y-1/2 p-2 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 transition-all disabled:opacity-50"
              >
                <Send className="w-4 h-4" />
              </button>
            </div>
          </form>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
