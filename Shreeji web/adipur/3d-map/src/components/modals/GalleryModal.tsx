'use client';

import React, { useState } from 'react';
import { X, Image as ImageIcon, Sparkles, ChevronRight, Eye } from 'lucide-react';

interface GalleryModalProps {
  isOpen: boolean;
  onClose: () => void;
}

interface GalleryItem {
  id: string;
  title: string;
  category: string;
  image: string;
  description: string;
}

const galleryItems: GalleryItem[] = [
  {
    id: '1',
    title: 'Scenic Farmland Master Layout',
    category: 'Masterplan',
    image: 'https://images.unsplash.com/photo-1500382017468-9049fed747ef?auto=format&fit=crop&w=1200&q=80',
    description: 'Expansive lush farmland plots with wide 40ft internal asphalt roads and underground utilities.',
  },
  {
    id: '2',
    title: 'Luxury Farmland Villa Concept',
    category: 'Villas',
    image: 'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=1200&q=80',
    description: 'Custom weekend farm villa with sprawling lawns, wooden deck, and organic garden.',
  },
  {
    id: '3',
    title: 'Grand Clubhouse & Infinity Pool',
    category: 'Amenities',
    image: 'https://images.unsplash.com/photo-1576013551627-0cc20b96c2a7?auto=format&fit=crop&w=1200&q=80',
    description: 'World-class clubhouse featuring swimming pool, fitness lounge, tennis court, and banquet hall.',
  },
  {
    id: '4',
    title: 'Organic Fruit Orchards & Plantations',
    category: 'Greenery',
    image: 'https://images.unsplash.com/photo-1500651230702-0e2d8a49d4ad?auto=format&fit=crop&w=1200&q=80',
    description: 'Over 5,000 fruit-bearing trees including Mango, Guava, and Teak with automated drip irrigation.',
  },
  {
    id: '5',
    title: 'Sunset Lakeview Promenade',
    category: 'Landscape',
    image: 'https://images.unsplash.com/photo-1506744038136-46273834b3fb?auto=format&fit=crop&w=1200&q=80',
    description: 'Perimeter walking trails with serene water reservoir and gazebos for evening strolls.',
  },
  {
    id: '6',
    title: 'Grand Gated Entrance & Security',
    category: 'Infrastructure',
    image: 'https://images.unsplash.com/photo-1512917774080-9991f1c4c750?auto=format&fit=crop&w=1200&q=80',
    description: '24/7 CCTV surveillance, biometric boom barrier entry, and multi-tier security personnel.',
  },
];

const categories = ['All', 'Masterplan', 'Villas', 'Amenities', 'Greenery', 'Landscape'];

export const GalleryModal: React.FC<GalleryModalProps> = ({ isOpen, onClose }) => {
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [activeImage, setActiveImage] = useState<GalleryItem | null>(null);

  if (!isOpen) return null;

  const filteredItems = selectedCategory === 'All'
    ? galleryItems
    : galleryItems.filter((item) => item.category === selectedCategory);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/80 backdrop-blur-md animate-fade-in">
      <div
        className="w-full max-w-4xl glass-panel rounded-3xl shadow-2xl border border-white/15 overflow-hidden flex flex-col max-h-[90vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="p-4 sm:p-6 border-b border-white/10 flex items-center justify-between bg-white/[0.02]">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-teal-500/20 border border-teal-500/30 flex items-center justify-center text-teal-400">
              <ImageIcon className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg sm:text-xl font-extrabold text-white tracking-tight">
                Project Gallery & Visuals
              </h2>
              <p className="text-xs text-gray-400">
                Immerse yourself in Riva Meadows farmland lifestyle and master amenities
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="w-9 h-9 rounded-full bg-white/5 hover:bg-white/15 text-gray-400 hover:text-white flex items-center justify-center transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Category Tabs */}
        <div className="px-4 sm:px-6 py-3 border-b border-white/5 flex items-center gap-2 overflow-x-auto bg-black/20">
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`px-4 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition-all ${
                selectedCategory === cat
                  ? 'bg-gradient-to-r from-emerald-500 to-teal-500 text-white shadow-md'
                  : 'bg-white/5 text-gray-400 hover:text-white hover:bg-white/10'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>

        {/* Gallery Grid */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
            {filteredItems.map((item) => (
              <div
                key={item.id}
                onClick={() => setActiveImage(item)}
                className="group relative rounded-2xl overflow-hidden bg-white/5 border border-white/10 cursor-pointer shadow-lg aspect-[4/3]"
              >
                <img
                  src={item.image}
                  alt={item.title}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                  loading="lazy"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/30 to-transparent opacity-80 group-hover:opacity-95 transition-opacity" />

                <div className="absolute top-3 left-3">
                  <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-black/60 text-emerald-300 border border-emerald-500/30 backdrop-blur-md uppercase tracking-wider">
                    {item.category}
                  </span>
                </div>

                <div className="absolute bottom-3 left-3 right-3 space-y-1">
                  <h4 className="font-bold text-sm text-white group-hover:text-emerald-300 transition-colors">
                    {item.title}
                  </h4>
                  <p className="text-[11px] text-gray-300 line-clamp-2 leading-relaxed">
                    {item.description}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Lightbox Modal */}
      {activeImage && (
        <div
          className="fixed inset-0 z-[60] bg-black/95 flex flex-col items-center justify-center p-4"
          onClick={() => setActiveImage(null)}
        >
          <button
            onClick={() => setActiveImage(null)}
            className="absolute top-5 right-5 text-white/70 hover:text-white p-2 rounded-full bg-white/10"
          >
            <X className="w-6 h-6" />
          </button>
          <div className="max-w-4xl max-h-[80vh] flex flex-col items-center" onClick={(e) => e.stopPropagation()}>
            <img
              src={activeImage.image}
              alt={activeImage.title}
              className="max-h-[65vh] w-auto rounded-2xl shadow-2xl object-contain border border-white/15"
            />
            <div className="text-center mt-4 space-y-1">
              <h3 className="text-lg font-bold text-white">{activeImage.title}</h3>
              <p className="text-xs text-gray-400 max-w-xl">{activeImage.description}</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
