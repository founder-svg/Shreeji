'use client';

import React, { useState, useEffect, useMemo, useRef } from 'react';
import { CombinedPlot, PlotStatus } from '@/types';
import { allPlots } from '@/data/plotHelper';
import { Search, X, MapPin, Compass, ArrowRight, Filter } from 'lucide-react';

interface SearchModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectPlot: (plot: CombinedPlot) => void;
}

export const SearchModal: React.FC<SearchModalProps> = ({
  isOpen,
  onClose,
  onSelectPlot,
}) => {
  const [query, setQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<PlotStatus | 'all'>('all');
  const inputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 100);
    } else {
      setQuery('');
      setStatusFilter('all');
    }
  }, [isOpen]);

  const filteredResults = useMemo(() => {
    const q = query.trim().toLowerCase();
    return allPlots.filter((p) => {
      // Exclude common facilities from plot searches
      if (p.metadata.isCommonArea) {
        return false;
      }
      // Status filter
      if (statusFilter !== 'all' && p.metadata.status !== statusFilter) {
        return false;
      }
      if (!q) return true;
      const matchNumber = p.metadata.plotNumber.toLowerCase().includes(q);
      const matchTitle = p.metadata.title.toLowerCase().includes(q);
      const matchArea = `${p.metadata.areaSqYd}`.includes(q);
      const matchPrice = p.metadata.price.toLowerCase().includes(q);
      return matchNumber || matchTitle || matchArea || matchPrice;
    });
  }, [query, statusFilter]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-16 sm:pt-24 px-4 bg-black/70 backdrop-blur-sm animate-fade-in">
      <div
        className="w-full max-w-xl glass-panel rounded-2xl shadow-2xl border border-white/15 overflow-hidden flex flex-col max-h-[80vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Search Input Bar */}
        <div className="p-4 border-b border-white/10 flex items-center gap-3 bg-white/[0.02]">
          <Search className="w-5 h-5 text-emerald-400 flex-shrink-0" />
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Type plot number, area, or landmark (e.g. 545, Satsang, 373)..."
            className="w-full bg-transparent text-white placeholder-gray-400 text-sm sm:text-base outline-none font-medium"
          />
          {query && (
            <button
              onClick={() => setQuery('')}
              className="p-1 rounded-full text-gray-400 hover:text-white"
            >
              <X className="w-4 h-4" />
            </button>
          )}
          <button
            onClick={onClose}
            className="px-2.5 py-1 rounded-lg text-xs font-semibold bg-white/10 text-gray-300 hover:text-white hover:bg-white/20 transition-colors"
          >
            Esc
          </button>
        </div>

        {/* Quick Filter Chips */}
        <div className="px-4 py-2.5 bg-black/20 border-b border-white/5 flex items-center gap-2 overflow-x-auto text-xs">
          <span className="text-gray-400 font-medium flex items-center gap-1 flex-shrink-0">
            <Filter className="w-3 h-3 text-emerald-400" /> Filter:
          </span>
          {(['all', 'available', 'sold', 'builder'] as const).map((st) => (
            <button
              key={st}
              onClick={() => setStatusFilter(st)}
              className={`px-3 py-1 rounded-full capitalize font-medium transition-all ${
                statusFilter === st
                  ? 'bg-emerald-500 text-white shadow-md'
                  : 'bg-white/5 text-gray-400 hover:text-white'
              }`}
            >
              {st === 'all' ? 'All Plots' : st}
            </button>
          ))}
          <span className="ml-auto text-[11px] text-gray-400">
            {filteredResults.length} found
          </span>
        </div>

        {/* Results List */}
        <div className="flex-1 overflow-y-auto p-3 space-y-1.5 divide-y divide-white/5">
          {filteredResults.length === 0 ? (
            <div className="py-12 text-center text-gray-400 space-y-2">
              <p className="text-sm">No plots matching "{query}"</p>
              <p className="text-xs text-gray-500">Try searching for plot numbers like 545, 578, 373 or amenities like Satsang Hall</p>
            </div>
          ) : (
            filteredResults.map((plot) => {
              const statusBadge = {
                available: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30',
                sold: 'bg-rose-500/20 text-rose-300 border-rose-500/30',
                builder: 'bg-amber-500/20 text-amber-300 border-amber-500/30',
              }[plot.metadata.status] || 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30';

              return (
                <div
                  key={plot.id}
                  onClick={() => {
                    onSelectPlot(plot);
                    onClose();
                  }}
                  className="pt-1.5 first:pt-0"
                >
                  <button
                    type="button"
                    className="w-full text-left p-3 rounded-xl hover:bg-white/[0.06] transition-all flex items-center justify-between gap-3 group"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-emerald-600/30 to-teal-500/30 border border-emerald-500/30 flex items-center justify-center font-bold text-emerald-300 text-sm group-hover:scale-105 transition-transform flex-shrink-0">
                        {plot.metadata.plotNumber}
                      </div>

                      <div className="space-y-0.5">
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-sm text-white group-hover:text-emerald-300 transition-colors">
                            {plot.metadata.title}
                          </span>
                          <span
                            className={`px-2 py-0.2 rounded-full text-[10px] font-semibold border ${statusBadge}`}
                          >
                            {plot.metadata.status}
                          </span>
                        </div>

                        <div className="text-xs text-gray-400 flex items-center gap-3">
                          <span>{plot.metadata.areaSqYd} sq.yd ({plot.metadata.areaSqFt} sq.ft)</span>
                          <span>•</span>
                          <span className="flex items-center gap-0.5">
                            <Compass className="w-3 h-3" /> {plot.metadata.facing}
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-3 flex-shrink-0">
                      <span className="font-bold text-sm text-emerald-400">
                        {plot.metadata.price}
                      </span>
                      <ArrowRight className="w-4 h-4 text-gray-400 group-hover:text-white group-hover:translate-x-1 transition-all" />
                    </div>
                  </button>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
};
