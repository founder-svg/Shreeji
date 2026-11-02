'use client';

import React from 'react';
import { CombinedPlot } from '@/types';
import {
  X,
  MapPin,
  CheckCircle2,
  Compass,
  Maximize2,
  DollarSign,
  PhoneCall,
  MessageSquare,
  Share2,
  ChevronLeft,
  ChevronRight,
  ShieldCheck,
  Sparkles,
} from 'lucide-react';

interface PlotDetailPanelProps {
  plot: CombinedPlot | null;
  onClose: () => void;
  onOpenEnquiry: (plot: CombinedPlot) => void;
  onPrevPlot?: () => void;
  onNextPlot?: () => void;
}

export const PlotDetailPanel: React.FC<PlotDetailPanelProps> = ({
  plot,
  onClose,
  onOpenEnquiry,
  onPrevPlot,
  onNextPlot,
}) => {
  if (!plot) return null;

  const { metadata } = plot;

  const statusBadge = {
    available: {
      text: 'Available for Booking',
      bg: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30',
      dot: 'bg-emerald-400',
    },
    sold: {
      text: 'Sold / Reserved',
      bg: 'bg-rose-500/20 text-rose-300 border-rose-500/30',
      dot: 'bg-rose-400',
    },
    builder: {
      text: 'Under Construction',
      bg: 'bg-amber-500/20 text-amber-300 border-amber-500/30',
      dot: 'bg-amber-400',
    },
  }[metadata.status] || {
    text: 'Available for Booking',
    bg: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30',
    dot: 'bg-emerald-400',
  };

  const handleSharePlot = () => {
    if (navigator.share) {
      navigator.share({
        title: `${metadata.title} - 3D Plot Layout`,
        text: `Check out ${metadata.title} (${metadata.areaSqYd} sq.yd) at 3D Plot Layout. Price: ${metadata.price}`,
        url: window.location.href,
      }).catch(() => {});
    } else {
      navigator.clipboard.writeText(window.location.href);
      alert('Plot link copied to clipboard!');
    }
  };

  return (
    <aside
      className="fixed z-50 transition-all duration-300 ease-out
        inset-x-0 bottom-0 max-h-[85vh] rounded-t-3xl sm:inset-y-0 sm:right-4 sm:left-auto sm:top-20 sm:bottom-4 sm:w-[380px] sm:max-h-none sm:rounded-2xl
        glass-panel flex flex-col shadow-2xl border border-white/15 overflow-hidden animate-slide-up"
    >
      {/* Header */}
      <div className="relative p-4 sm:p-5 border-b border-white/10 bg-gradient-to-b from-white/5 to-transparent">
        {/* Mobile Pull Bar */}
        <div className="w-12 h-1 bg-white/20 rounded-full mx-auto mb-3 sm:hidden" />

        <div className="flex items-start justify-between gap-3">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="text-xl sm:text-2xl font-extrabold text-white tracking-tight">
                {metadata.title}
              </span>
              <button
                onClick={handleSharePlot}
                className="p-1.5 rounded-full hover:bg-white/10 text-gray-400 hover:text-white transition-colors"
                title="Share Plot"
              >
                <Share2 className="w-4 h-4" />
              </button>
            </div>
            <div className="flex items-center gap-1.5 text-xs text-gray-400 font-medium">
              <MapPin className="w-3.5 h-3.5 text-emerald-400 flex-shrink-0" />
              <span>Phase 5A/5B • Prime Valley Sector</span>
            </div>
          </div>

          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-white/5 hover:bg-white/15 text-gray-400 hover:text-white flex items-center justify-center transition-all flex-shrink-0"
            title="Close Panel"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Status Badge */}
        <div className="mt-3 flex items-center justify-between">
          <span
            className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold border ${statusBadge.bg}`}
          >
            <span className={`w-2 h-2 rounded-full ${statusBadge.dot} animate-pulse`} />
            {statusBadge.text}
          </span>

          <span className="text-xl font-black text-emerald-400 tracking-tight">
            {metadata.price}
          </span>
        </div>
      </div>

      {/* Scrollable Content */}
      <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-4 text-left">
        {/* Key Dimension Stats Grid */}
        <div className="grid grid-cols-2 gap-2.5">
          <div className="p-3 rounded-xl bg-white/[0.04] border border-white/5 flex flex-col">
            <span className="text-[11px] text-gray-400 font-medium">Plot Area (Sq. Yd)</span>
            <span className="text-lg font-bold text-white mt-0.5">
              {metadata.areaSqYd}{' '}
              <span className="text-xs font-normal text-gray-400">sq.yd</span>
            </span>
            <span className="text-[10px] text-gray-400">
              ≈ {plot.areaM2 ? plot.areaM2.toFixed(1) : (metadata.areaSqYd * 0.8361).toFixed(1)} m² ({metadata.areaSqFt} sq.ft)
            </span>
          </div>

          <div className="p-3 rounded-xl bg-white/[0.04] border border-white/5 flex flex-col">
            <span className="text-[11px] text-gray-400 font-medium">Dimensions</span>
            <span className="text-lg font-bold text-white mt-0.5">
              {metadata.dimensions}
            </span>
            <span className="text-[10px] text-gray-400">Length x Breadth</span>
          </div>

          <div className="p-3 rounded-xl bg-white/[0.04] border border-white/5 flex flex-col">
            <span className="text-[11px] text-gray-400 font-medium">Facing / Vastu</span>
            <span className="text-lg font-bold text-emerald-300 mt-0.5 flex items-center gap-1">
              <Compass className="w-4 h-4" />
              {metadata.facing}
            </span>
            <span className="text-[10px] text-gray-400">100% Vastu Compliant</span>
          </div>

          <div className="p-3 rounded-xl bg-white/[0.04] border border-white/5 flex flex-col">
            <span className="text-[11px] text-gray-400 font-medium">Land Category</span>
            <span className="text-lg font-bold text-white mt-0.5 capitalize">
              {metadata.type}
            </span>
            <span className="text-[10px] text-gray-400">Clear Title / 7-12</span>
          </div>
        </div>

        {/* Description */}
        <div className="p-3.5 rounded-xl bg-white/[0.03] border border-white/5 space-y-1.5">
          <h4 className="text-xs font-semibold text-gray-300 uppercase tracking-wider">
            Property Overview
          </h4>
          <p className="text-xs text-gray-300 leading-relaxed font-normal">
            {metadata.description}
          </p>
        </div>

        {/* Plot Features & Highlights */}
        <div className="space-y-2">
          <h4 className="text-xs font-semibold text-gray-300 uppercase tracking-wider flex items-center gap-1.5">
            <Sparkles className="w-3.5 h-3.5 text-emerald-400" />
            Plot Highlights & Amenities
          </h4>
          <div className="space-y-1.5">
            {metadata.features.map((feature, idx) => (
              <div
                key={idx}
                className="flex items-center gap-2 text-xs text-gray-300 p-2 rounded-lg bg-white/[0.02] border border-white/5"
              >
                <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0" />
                <span>{feature}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Legal & Trust Guarantee */}
        <div className="p-3 rounded-xl bg-emerald-950/30 border border-emerald-500/20 flex items-start gap-2.5">
          <ShieldCheck className="w-5 h-5 text-emerald-400 flex-shrink-0 mt-0.5" />
          <div className="text-[11px] text-emerald-200/90 leading-tight space-y-0.5">
            <span className="font-bold text-emerald-300">RERA & NA Approved</span>
            <p>Immediate sale deed registration, demarcated boundary stones, and ready utility connectivity.</p>
          </div>
        </div>
      </div>

      {/* Footer CTA & Actions */}
      <div className="p-4 border-t border-white/10 bg-[#141720]/90 space-y-2.5">
        <button
          type="button"
          onClick={() => onOpenEnquiry(plot)}
          className="w-full py-3 px-4 rounded-xl font-bold text-sm bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-white shadow-lg shadow-emerald-500/25 transition-all duration-200 flex items-center justify-center gap-2 active:scale-[0.98]"
        >
          <MessageSquare className="w-4 h-4" />
          <span>Enquire / Book Site Visit</span>
        </button>

        <div className="flex items-center justify-between text-xs text-gray-400 px-1">
          <span className="flex items-center gap-1">
            <PhoneCall className="w-3 h-3 text-emerald-400" />
            Assistance: +91 98765 43210
          </span>
          <span className="text-[11px] text-gray-500">ID: {plot.id}</span>
        </div>
      </div>
    </aside>
  );
};
