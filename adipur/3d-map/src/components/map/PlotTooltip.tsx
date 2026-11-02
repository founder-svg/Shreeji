'use client';

import React from 'react';
import { CombinedPlot } from '@/types';

interface PlotTooltipProps {
  plot: CombinedPlot | null;
  position: { x: number; y: number } | null;
}

export const PlotTooltip: React.FC<PlotTooltipProps> = ({ plot, position }) => {
  if (!plot || !position) return null;

  const statusConfig = {
    available: {
      label: 'Available',
      badge: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30',
      dot: 'bg-emerald-400',
    },
    sold: {
      label: 'Sold',
      badge: 'bg-rose-500/20 text-rose-300 border-rose-500/30',
      dot: 'bg-rose-400',
    },
    builder: {
      label: 'Builder',
      badge: 'bg-amber-500/20 text-amber-300 border-amber-500/30',
      dot: 'bg-amber-400',
    },
  }[plot.metadata.status] || {
    label: 'Available',
    badge: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30',
    dot: 'bg-emerald-400',
  };

  return (
    <div
      className="fixed z-50 pointer-events-none transform -translate-x-1/2 -translate-y-full mb-3"
      style={{
        left: `${position.x}px`,
        top: `${position.y}px`,
      }}
    >
      <div className="glass-panel px-3.5 py-2.5 rounded-xl shadow-2xl border border-white/20 text-left min-w-[170px] animate-fade-in backdrop-blur-xl">
        <div className="flex items-center justify-between gap-2 mb-1.5">
          <span className="font-bold text-sm text-white tracking-wide">
            {plot.metadata.title}
          </span>
          <span
            className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold border ${statusConfig.badge}`}
          >
            <span className={`w-1.5 h-1.5 rounded-full ${statusConfig.dot}`} />
            {statusConfig.label}
          </span>
        </div>

        <div className="grid grid-cols-2 gap-x-3 gap-y-1 text-[11px] text-gray-300">
          <div>
            <span className="text-gray-400 text-[10px]">Area: </span>
            <span className="font-medium text-gray-200">{plot.metadata.areaSqYd} sq.yd</span>
          </div>
          <div>
            <span className="text-gray-400 text-[10px]">Price: </span>
            <span className="font-semibold text-emerald-400">{plot.metadata.price}</span>
          </div>
          {plot.metadata.dimensions && (
            <div className="col-span-2 text-gray-400 text-[10px]">
              Dim: <span className="text-gray-200">{plot.metadata.dimensions}</span> • {plot.metadata.facing} Facing
            </div>
          )}
        </div>

        <div className="mt-1.5 pt-1.5 border-t border-white/10 text-[10px] text-emerald-400 font-medium flex items-center justify-between">
          <span>Click to view full details</span>
          <span>→</span>
        </div>
      </div>
    </div>
  );
};
