'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/lib/auth';
import { db } from '@/lib/firebase';
import { collection, query, where, onSnapshot, addDoc, deleteDoc, doc } from 'firebase/firestore';
import { DashboardLayout } from '@/components/DashboardLayout';
import { FolderOpen, Plus, MoreVertical, Trash2, Folder } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

export default function Collections() {
  const { user } = useAuth();
  const [collections, setCollections] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isAdding, setIsAdding] = useState(false);
  const [newName, setNewName] = useState('');

  useEffect(() => {
    if (!user) return;

    const q = query(
      collection(db, 'collections'),
      where('userId', '==', user.uid)
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      setCollections(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
      setLoading(false);
    });

    return () => unsubscribe();
  }, [user]);

  const handleAddCollection = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newName.trim() || !user) return;
    try {
      await addDoc(collection(db, 'collections'), {
        userId: user.uid,
        name: newName,
        color: '#4F46E5',
        description: '',
        item_ids: [],
        created_at: new Date().toISOString()
      });
      setNewName('');
      setIsAdding(false);
    } catch (error) {
      console.error('Error adding collection:', error);
    }
  };

  return (
    <DashboardLayout>
      <header className="flex items-center justify-between mb-12">
        <div>
          <h1 className="text-3xl font-bold tracking-tight mb-2">Collections</h1>
          <p className="text-gray-500">Organize your items into folders and projects.</p>
        </div>
        <button 
          onClick={() => setIsAdding(true)}
          className="flex items-center gap-2 px-6 py-2.5 bg-indigo-600 text-white rounded-xl font-medium hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-100"
        >
          <Plus className="w-4 h-4" />
          New Collection
        </button>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <AnimatePresence mode="popLayout">
          {isAdding && (
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className="p-6 bg-white border-2 border-dashed border-indigo-200 rounded-3xl"
            >
              <form onSubmit={handleAddCollection} className="space-y-4">
                <div className="w-12 h-12 bg-indigo-50 rounded-2xl flex items-center justify-center mb-4">
                  <Folder className="w-6 h-6 text-indigo-600" />
                </div>
                <input 
                  autoFocus
                  type="text" 
                  placeholder="Collection Name"
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  className="w-full bg-transparent border-none focus:ring-0 outline-none font-bold text-lg p-0"
                />
                <div className="flex gap-2">
                  <button type="submit" className="flex-1 py-2 bg-indigo-600 text-white rounded-xl text-sm font-bold hover:bg-indigo-700 transition-all">
                    Create
                  </button>
                  <button onClick={() => setIsAdding(false)} className="flex-1 py-2 bg-gray-100 text-gray-600 rounded-xl text-sm font-bold hover:bg-gray-200 transition-all">
                    Cancel
                  </button>
                </div>
              </form>
            </motion.div>
          )}

          {collections.map((c) => (
            <motion.div
              key={c.id}
              layout
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="group p-6 bg-[#F9F9F8] rounded-3xl hover:bg-white hover:shadow-2xl hover:shadow-indigo-50 transition-all duration-300 border border-transparent hover:border-indigo-100 relative"
            >
              <div className="flex items-start justify-between mb-6">
                <div className="w-12 h-12 bg-white rounded-2xl flex items-center justify-center shadow-sm group-hover:scale-110 transition-transform">
                  <FolderOpen className="w-6 h-6 text-indigo-600" />
                </div>
                <button 
                  onClick={() => deleteDoc(doc(db, 'collections', c.id))}
                  className="p-2 hover:bg-red-50 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity"
                >
                  <Trash2 className="w-4 h-4 text-red-500" />
                </button>
              </div>
              <h3 className="font-bold text-lg mb-1">{c.name}</h3>
              <p className="text-gray-400 text-xs font-medium uppercase tracking-wider">
                {c.item_ids?.length || 0} Items
              </p>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

      {!loading && collections.length === 0 && !isAdding && (
        <div className="flex flex-col items-center justify-center py-32 text-center">
          <div className="w-20 h-20 bg-gray-50 rounded-full flex items-center justify-center mb-6">
            <FolderOpen className="w-8 h-8 text-gray-300" />
          </div>
          <h3 className="text-xl font-bold mb-2">No collections yet</h3>
          <p className="text-gray-500 max-w-xs">Create folders to organize your research and ideas.</p>
        </div>
      )}
    </DashboardLayout>
  );
}
