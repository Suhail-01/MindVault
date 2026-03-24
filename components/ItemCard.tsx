'use client';

import { motion } from 'motion/react';
import { ExternalLink, Star, Archive, MoreVertical, Clock, Tag, Trash2 } from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';
import { formatDistanceToNow } from 'date-fns';
import { db } from '@/lib/firebase';
import { doc, updateDoc, deleteDoc } from 'firebase/firestore';

export function ItemCard({ item }: { item: any }) {
  const toggleFavorite = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    try {
      await updateDoc(doc(db, 'saved_items', item.id), {
        is_favorite: !item.is_favorite
      });
    } catch (error) {
      console.error('Error toggling favorite:', error);
    }
  };

  const toggleArchive = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    try {
      await updateDoc(doc(db, 'saved_items', item.id), {
        is_archived: !item.is_archived
      });
    } catch (error) {
      console.error('Error toggling archive:', error);
    }
  };

  const handleDelete = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!confirm('Are you sure you want to delete this item?')) return;
    try {
      await deleteDoc(doc(db, 'saved_items', item.id));
    } catch (error) {
      console.error('Error deleting item:', error);
    }
  };

  return (
    <motion.div
      layout
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.95 }}
      whileHover={{ y: -4 }}
      className="group bg-white border border-gray-100 rounded-2xl overflow-hidden hover:shadow-2xl hover:shadow-indigo-50 transition-all duration-300 flex flex-col"
    >
      {item.thumbnail_url && (
        <div className="relative h-40 w-full overflow-hidden">
          <Image 
            src={item.thumbnail_url} 
            alt={item.title}
            fill
            className="object-cover group-hover:scale-105 transition-transform duration-500"
            referrerPolicy="no-referrer"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
        </div>
      )}
      
      <div className="p-5 flex-1 flex flex-col">
        <div className="flex items-start justify-between mb-3">
          <div className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-wider text-indigo-600 bg-indigo-50 px-2 py-1 rounded-md">
            {item.type}
          </div>
          <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
            <button 
              onClick={toggleFavorite}
              className="p-1.5 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <Star className={`w-4 h-4 ${item.is_favorite ? 'fill-yellow-400 text-yellow-400' : 'text-gray-400'}`} />
            </button>
            <button 
              onClick={toggleArchive}
              className="p-1.5 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <Archive className={`w-4 h-4 ${item.is_archived ? 'text-indigo-600 fill-indigo-50' : 'text-gray-400'}`} />
            </button>
            <button 
              onClick={handleDelete}
              className="p-1.5 hover:bg-red-50 rounded-lg transition-colors"
            >
              <Trash2 className="w-4 h-4 text-red-400" />
            </button>
          </div>
        </div>

        <Link href={`/item/${item.id}`} className="block group/title">
          <h3 className="font-bold text-lg mb-2 line-clamp-2 group-hover/title:text-indigo-600 transition-colors">
            {item.title}
          </h3>
        </Link>
        
        <p className="text-gray-500 text-sm line-clamp-2 mb-4 flex-1">
          {item.ai_summary || item.description || "No summary available yet."}
        </p>

        <div className="flex flex-wrap gap-2 mb-4">
          {item.ai_tags?.slice(0, 3).map((tag: string) => (
            <span key={tag} className="text-[11px] font-medium text-gray-500 bg-gray-50 px-2 py-0.5 rounded-full border border-gray-100">
              #{tag}
            </span>
          ))}
        </div>

        <div className="flex items-center justify-between pt-4 border-t border-gray-50 text-[11px] text-gray-400">
          <div className="flex items-center gap-1.5">
            <Clock className="w-3 h-3" />
            <span>{formatDistanceToNow(new Date(item.created_at))} ago</span>
          </div>
          <a 
            href={item.url} 
            target="_blank" 
            rel="noopener noreferrer"
            className="flex items-center gap-1 hover:text-indigo-600 transition-colors"
          >
            <ExternalLink className="w-3 h-3" />
            <span>{item.type === 'image' || item.type === 'pdf' ? 'Open' : 'Source'}</span>
          </a>
        </div>
      </div>
    </motion.div>
  );
}
