'use client';

import { useState, useRef } from 'react';
import { useAuth } from '@/lib/auth';
import { db, storage } from '@/lib/firebase';
import { collection, addDoc } from 'firebase/firestore';
import { ref, uploadBytesResumable, getDownloadURL } from 'firebase/storage';
import { GoogleGenAI, Type } from "@google/genai";
import { X, Loader2, Link as LinkIcon, Sparkles, FileUp, Image as ImageIcon, FileText, AlertCircle } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

const ai = new GoogleGenAI({ apiKey: process.env.NEXT_PUBLIC_GEMINI_API_KEY! });

export function SaveItemModal({ isOpen, onClose }: { isOpen: boolean, onClose: () => void }) {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<'link' | 'file'>('link');
  const [url, setUrl] = useState('');
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState('');
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (activeTab === 'link') {
      await handleLinkSave();
    } else {
      await handleFileSave();
    }
  };

  const handleLinkSave = async () => {
    if (!url || !user) return;
    setLoading(true);
    setStatus('Fetching metadata...');

    try {
      const metaRes = await fetch('/api/fetch-metadata', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url })
      });
      
      if (!metaRes.ok) throw new Error('Failed to fetch metadata');
      const metadata = await metaRes.json();

      setStatus('AI is analyzing content...');

      const response = await ai.models.generateContent({
        model: "gemini-3-flash-preview",
        contents: `Analyze this content and provide a 2-line summary and 5 relevant tags. 
        Title: ${metadata.title}
        Description: ${metadata.description}
        Content: ${metadata.content.substring(0, 3000)}`,
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

      const aiData = JSON.parse(response.text);

      setStatus('Saving to vault...');

      await addDoc(collection(db, 'saved_items'), {
        userId: user.uid,
        url: metadata.url,
        type: metadata.type || 'link',
        title: metadata.title || url,
        description: metadata.description || '',
        thumbnail_url: metadata.thumbnail_url || '',
        content: metadata.content,
        ai_summary: aiData.summary,
        ai_tags: aiData.tags,
        is_favorite: false,
        is_archived: false,
        created_at: new Date().toISOString(),
        last_surfaced_at: new Date().toISOString()
      });

      setUrl('');
      onClose();
    } catch (err: any) {
      console.error('Error saving item:', err);
      setError(err.message || 'Failed to save item. Please check the URL.');
    } finally {
      setLoading(false);
      setStatus('');
    }
  };

  const handleFileSave = async () => {
    if (!file || !user) return;
    setLoading(true);
    setStatus('Uploading file...');
    setProgress(0);
    setError(null);

    try {
      console.log('Starting upload for:', file.name);
      const storageRef = ref(storage, `uploads/${user.uid}/${Date.now()}_${file.name}`);
      
      // Use uploadBytesResumable to track progress
      const uploadTask = uploadBytesResumable(storageRef, file);

      // Create a promise to handle the upload completion
      const downloadUrl = await new Promise<string>((resolve, reject) => {
        uploadTask.on('state_changed', 
          (snapshot) => {
            const p = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
            setProgress(p);
            setStatus(`Uploading: ${Math.round(p)}%`);
            console.log(`Upload progress: ${p}%`);
          }, 
          (error) => {
            console.error('Upload failed:', error);
            reject(error);
          }, 
          async () => {
            try {
              const url = await getDownloadURL(uploadTask.snapshot.ref);
              resolve(url);
            } catch (err) {
              reject(err);
            }
          }
        );
      });

      setStatus('Saving to vault...');
      console.log('File uploaded, saving metadata to Firestore...');

      // Save to Firestore without AI analysis for now to ensure reliability
      await addDoc(collection(db, 'saved_items'), {
        userId: user.uid,
        url: downloadUrl,
        file_name: file.name,
        type: file.type.startsWith('image/') ? 'image' : 'pdf',
        title: file.name,
        description: `Uploaded ${file.type.startsWith('image/') ? 'image' : 'PDF'} file`,
        thumbnail_url: file.type.startsWith('image/') ? downloadUrl : '',
        ai_summary: 'Processing summary...',
        ai_tags: [file.type.split('/')[1], 'upload'],
        is_favorite: false,
        is_archived: false,
        created_at: new Date().toISOString(),
        last_surfaced_at: new Date().toISOString()
      });

      console.log('Successfully saved to Firestore');
      setFile(null);
      onClose();
    } catch (err: any) {
      console.error('Full upload error details:', err);
      let errorMessage = 'Failed to upload file.';
      
      if (err.code === 'storage/unauthorized') {
        errorMessage = 'Upload failed: Permission denied. Please check storage rules.';
      } else if (err.code === 'storage/canceled') {
        errorMessage = 'Upload was canceled.';
      } else if (err.message) {
        errorMessage = `Upload failed: ${err.message}`;
      }
      
      setError(errorMessage);
    } finally {
      setLoading(false);
      setStatus('');
      setProgress(0);
    }
  };

  const fileToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = (error) => reject(error);
    });
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="absolute inset-0 bg-black/40 backdrop-blur-sm"
        />
        <motion.div
          initial={{ opacity: 0, scale: 0.9, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.9, y: 20 }}
          className="relative w-full max-w-lg bg-white rounded-3xl shadow-2xl overflow-hidden"
        >
          <div className="p-8">
            <div className="flex items-center justify-between mb-8">
              <h2 className="text-2xl font-bold tracking-tight">Save to Vault</h2>
              <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-full transition-colors">
                <X className="w-5 h-5 text-gray-500" />
              </button>
            </div>

            {/* Tabs */}
            <div className="flex p-1 bg-gray-100 rounded-2xl mb-8">
              <button
                onClick={() => setActiveTab('link')}
                className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-bold transition-all ${
                  activeTab === 'link' ? 'bg-white shadow-sm text-indigo-600' : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                <LinkIcon className="w-4 h-4" />
                Link
              </button>
              <button
                onClick={() => setActiveTab('file')}
                className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-bold transition-all ${
                  activeTab === 'file' ? 'bg-white shadow-sm text-indigo-600' : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                <FileUp className="w-4 h-4" />
                File
              </button>
            </div>

            <form onSubmit={handleSave} className="space-y-6">
              {error && (
                <motion.div 
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="flex items-center gap-2 text-red-500 bg-red-50 p-3 rounded-xl text-sm"
                >
                  <AlertCircle className="w-4 h-4 flex-shrink-0" />
                  <span>{error}</span>
                </motion.div>
              )}

              {activeTab === 'link' ? (
                <div className="space-y-2">
                  <label className="text-sm font-semibold text-gray-700 ml-1">URL or Link</label>
                  <div className="relative group">
                    <LinkIcon className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 group-focus-within:text-indigo-600 transition-colors" />
                    <input
                      autoFocus
                      type="url"
                      placeholder="https://example.com/article"
                      value={url}
                      onChange={(e) => setUrl(e.target.value)}
                      disabled={loading}
                      className="w-full pl-12 pr-4 py-4 bg-gray-50 border-none rounded-2xl focus:ring-2 focus:ring-indigo-500 transition-all outline-none text-lg"
                      required
                    />
                  </div>
                </div>
              ) : (
                <div className="space-y-2">
                  <label className="text-sm font-semibold text-gray-700 ml-1">Upload Image or PDF</label>
                  <div 
                    onClick={() => fileInputRef.current?.click()}
                    className="w-full aspect-video bg-gray-50 border-2 border-dashed border-gray-200 rounded-3xl flex flex-col items-center justify-center gap-4 cursor-pointer hover:border-indigo-300 hover:bg-indigo-50/30 transition-all group"
                  >
                    <input 
                      type="file" 
                      ref={fileInputRef}
                      onChange={(e) => setFile(e.target.files?.[0] || null)}
                      accept="image/*,application/pdf"
                      className="hidden"
                    />
                    {file ? (
                      <div className="text-center p-4">
                        {file.type.startsWith('image/') ? (
                          <ImageIcon className="w-12 h-12 text-indigo-600 mx-auto mb-2" />
                        ) : (
                          <FileText className="w-12 h-12 text-indigo-600 mx-auto mb-2" />
                        )}
                        <p className="font-bold text-gray-900 truncate max-w-[200px]">{file.name}</p>
                        <p className="text-xs text-gray-500">{(file.size / 1024 / 1024).toFixed(2)} MB</p>
                      </div>
                    ) : (
                      <>
                        <div className="w-16 h-16 bg-white rounded-2xl flex items-center justify-center shadow-sm group-hover:scale-110 transition-transform">
                          <FileUp className="w-8 h-8 text-gray-400 group-hover:text-indigo-600" />
                        </div>
                        <div className="text-center">
                          <p className="font-bold text-gray-900">Click to upload</p>
                          <p className="text-xs text-gray-500">Supports Images and PDFs (max 10MB)</p>
                        </div>
                      </>
                    )}
                  </div>
                </div>
              )}

              <button
                type="submit"
                disabled={loading || (activeTab === 'link' ? !url : !file)}
                className="w-full py-4 bg-indigo-600 text-white rounded-2xl font-bold text-lg hover:bg-indigo-700 transition-all shadow-xl shadow-indigo-100 disabled:opacity-50 disabled:cursor-not-allowed flex flex-col items-center justify-center gap-1 overflow-hidden relative"
              >
                {loading && activeTab === 'file' && progress > 0 && progress < 100 && (
                  <motion.div 
                    initial={{ width: 0 }}
                    animate={{ width: `${progress}%` }}
                    className="absolute inset-0 bg-indigo-500/50"
                  />
                )}
                <div className="flex items-center justify-center gap-3 relative z-10">
                  {loading ? (
                    <>
                      <Loader2 className="w-6 h-6 animate-spin" />
                      <span>{status}</span>
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-6 h-6" />
                      <span>Save with AI</span>
                    </>
                  )}
                </div>
              </button>
            </form>
          </div>
          
          <div className="bg-indigo-50 p-6 flex items-start gap-4">
            <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center flex-shrink-0 shadow-sm">
              <Sparkles className="w-5 h-5 text-indigo-600" />
            </div>
            <div>
              <p className="text-sm font-bold text-indigo-900 mb-1">AI-Powered Analysis</p>
              <p className="text-xs text-indigo-700 leading-relaxed">
                MindVault uses Gemini AI to automatically summarize content and generate relevant tags for better organization.
              </p>
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
