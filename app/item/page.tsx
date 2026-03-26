'use client';

import { useState, useEffect, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { useAuth } from '@/lib/auth';
import { db } from '@/lib/firebase';
import { doc, getDoc, collection, query, where, onSnapshot, addDoc, deleteDoc, updateDoc } from 'firebase/firestore';
import { DashboardLayout } from '@/components/DashboardLayout';
import { 
  ArrowLeft, 
  Star, 
  Archive, 
  Trash2, 
  ExternalLink, 
  Clock, 
  Tag, 
  Highlighter,
  MessageSquare,
  Sparkles,
  FileText
} from 'lucide-react';
import Link from 'next/link';
import Image from 'next/image';
import { formatDistanceToNow } from 'date-fns';
import ReactMarkdown from 'react-markdown';

function ItemDetailContent() {
  const searchParams = useSearchParams();
  const id = searchParams.get('id');
  const { user } = useAuth();
  const [item, setItem] = useState<any>(null);
  const [highlights, setHighlights] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [newHighlight, setNewHighlight] = useState('');

  useEffect(() => {
    if (!user || !id) return;

    const itemRef = doc(db, 'saved_items', id);
    const unsubscribeItem = onSnapshot(itemRef, (doc) => {
      if (doc.exists()) {
        setItem({ id: doc.id, ...doc.data() });
      }
      setLoading(false);
    });

    const highlightsQuery = query(
      collection(db, 'highlights'),
      where('itemId', '==', id),
      where('userId', '==', user.uid)
    );
    const unsubscribeHighlights = onSnapshot(highlightsQuery, (snapshot) => {
      setHighlights(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    });

    return () => {
      unsubscribeItem();
      unsubscribeHighlights();
    };
  }, [user, id]);

  const handleAddHighlight = async () => {
    if (!newHighlight.trim() || !user || !id) return;
    try {
      await addDoc(collection(db, 'highlights'), {
        itemId: id,
        userId: user.uid,
        text: newHighlight,
        created_at: new Date().toISOString()
      });
      setNewHighlight('');
    } catch (error) {
      console.error('Error adding highlight:', error);
    }
  };

  if (loading) return <DashboardLayout><div className="animate-pulse h-96 bg-gray-50 rounded-3xl" /></DashboardLayout>;
  if (!item) return <DashboardLayout><div>Item not found</div></DashboardLayout>;

  return (
    <DashboardLayout>
      <div className="mb-8">
        <div className="flex flex-col lg:flex-row gap-12">
          {/* Main Content */}
          <div className="flex-1">
            <div className="flex items-center gap-3 mb-6">
              <span className="text-[10px] font-bold uppercase tracking-wider text-indigo-600 bg-indigo-50 px-2 py-1 rounded-md">
                {item.type}
              </span>
              <div className="flex items-center gap-1.5 text-xs text-gray-400">
                <Clock className="w-3.5 h-3.5" />
                <span>Saved {formatDistanceToNow(new Date(item.created_at))} ago</span>
              </div>
            </div>

            <h1 className="text-4xl font-bold tracking-tight mb-6 leading-tight">{item.title}</h1>
            
            <div className="flex flex-wrap gap-2 mb-8">
              {item.ai_tags?.map((tag: string) => (
                <span key={tag} className="text-xs font-medium text-indigo-600 bg-indigo-50 px-3 py-1 rounded-full border border-indigo-100">
                  #{tag}
                </span>
              ))}
            </div>

            {item.type === 'image' ? (
              <div className="relative aspect-auto w-full h-[600px] rounded-3xl overflow-hidden mb-12 shadow-2xl shadow-indigo-50 border border-gray-100 bg-gray-50">
                <Image 
                  src={item.url} 
                  alt={item.title} 
                  fill
                  className="object-contain"
                  referrerPolicy="no-referrer"
                />
              </div>
            ) : item.type === 'pdf' ? (
              <div className="bg-gray-50 rounded-3xl p-12 mb-12 border border-gray-200 flex flex-col items-center justify-center gap-6">
                <div className="w-24 h-24 bg-white rounded-2xl flex items-center justify-center shadow-sm">
                  <FileText className="w-12 h-12 text-red-500" />
                </div>
                <div className="text-center">
                  <h3 className="text-xl font-bold mb-2">{item.file_name || item.title}</h3>
                  <p className="text-gray-500 mb-6">PDF Document</p>
                  <a 
                    href={item.url} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 px-8 py-3 bg-gray-900 text-white rounded-xl font-bold hover:bg-black transition-all shadow-lg"
                  >
                    View PDF
                    <ExternalLink className="w-4 h-4" />
                  </a>
                </div>
              </div>
            ) : item.thumbnail_url && (
              <div className="relative aspect-video w-full rounded-3xl overflow-hidden mb-12 shadow-2xl shadow-indigo-50">
                <Image 
                  src={item.thumbnail_url} 
                  alt={item.title} 
                  fill 
                  className="object-cover"
                  referrerPolicy="no-referrer"
                />
              </div>
            )}

            <div className="bg-indigo-50/50 rounded-3xl p-8 mb-12 border border-indigo-100">
              <div className="flex items-center gap-2 mb-4">
                <Sparkles className="w-5 h-5 text-indigo-600" />
                <h2 className="font-bold text-indigo-900">AI Summary</h2>
              </div>
              <p className="text-indigo-800 leading-relaxed text-lg">
                {item.ai_summary}
              </p>
            </div>

            {item.content && (
              <div className="prose prose-indigo max-w-none text-gray-700 leading-relaxed">
                <ReactMarkdown>{item.content}</ReactMarkdown>
              </div>
            )}
          </div>

          {/* Sidebar Info */}
          <div className="w-full lg:w-80 space-y-8">
            <div className="bg-[#F9F9F8] rounded-3xl p-6 space-y-6">
              <div className="flex items-center justify-between">
                <h3 className="font-bold">Actions</h3>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <button 
                  onClick={async () => {
                    await updateDoc(doc(db, 'saved_items', item.id), { is_favorite: !item.is_favorite });
                  }}
                  className="flex flex-col items-center justify-center gap-2 p-4 bg-white rounded-2xl border border-gray-100 hover:border-indigo-200 hover:shadow-lg transition-all group"
                >
                  <Star className={`w-5 h-5 ${item.is_favorite ? 'fill-yellow-400 text-yellow-400' : 'text-gray-400'}`} />
                  <span className="text-xs font-medium">Favorite</span>
                </button>
                <button 
                  onClick={async () => {
                    await updateDoc(doc(db, 'saved_items', item.id), { is_archived: !item.is_archived });
                  }}
                  className="flex flex-col items-center justify-center gap-2 p-4 bg-white rounded-2xl border border-gray-100 hover:border-indigo-200 hover:shadow-lg transition-all"
                >
                  <Archive className={`w-5 h-5 ${item.is_archived ? 'text-indigo-600' : 'text-gray-400'}`} />
                  <span className="text-xs font-medium">Archive</span>
                </button>
              </div>
              <a 
                href={item.url} 
                target="_blank" 
                rel="noopener noreferrer"
                className="flex items-center justify-center gap-2 w-full py-3 bg-indigo-600 text-white rounded-2xl font-bold text-sm hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-100"
              >
                {item.type === 'image' || item.type === 'pdf' ? (
                  <>
                    <ExternalLink className="w-4 h-4" />
                    Open File
                  </>
                ) : (
                  <>
                    <ExternalLink className="w-4 h-4" />
                    Visit Source
                  </>
                )}
              </a>
            </div>

            <div className="bg-white border border-gray-100 rounded-3xl p-6">
              <div className="flex items-center gap-2 mb-6">
                <Highlighter className="w-5 h-5 text-indigo-600" />
                <h3 className="font-bold">Highlights</h3>
              </div>
              
              <div className="space-y-4 mb-6">
                {highlights.map((h) => (
                  <div key={h.id} className="p-4 bg-yellow-50 rounded-2xl border border-yellow-100 text-sm italic text-gray-800 relative group">
                    &quot;{h.text}&quot;
                    <button 
                      onClick={() => deleteDoc(doc(db, 'highlights', h.id))}
                      className="absolute -top-2 -right-2 w-6 h-6 bg-white border border-gray-100 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity shadow-sm"
                    >
                      <Trash2 className="w-3 h-3 text-red-500" />
                    </button>
                  </div>
                ))}
              </div>

              <div className="space-y-3">
                <textarea 
                  placeholder="Add a highlight or note..."
                  value={newHighlight}
                  onChange={(e) => setNewHighlight(e.target.value)}
                  className="w-full p-4 bg-gray-50 border-none rounded-2xl focus:ring-2 focus:ring-indigo-500 transition-all outline-none text-sm resize-none h-24"
                />
                <button 
                  onClick={handleAddHighlight}
                  disabled={!newHighlight.trim()}
                  className="w-full py-3 bg-gray-900 text-white rounded-2xl font-bold text-sm hover:bg-black transition-all disabled:opacity-50"
                >
                  Save Highlight
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}

export default function ItemDetail() {
  return (
    <Suspense fallback={<DashboardLayout><div className="animate-pulse h-96 bg-gray-50 rounded-3xl" /></DashboardLayout>}>
      <ItemDetailContent />
    </Suspense>
  );
}
