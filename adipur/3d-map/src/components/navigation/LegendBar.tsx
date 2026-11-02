'use client';

import React from 'react';
import { PlotStatus } from '@/types';
import { getPlotCounts } from '@/data/plotHelper';

interface LegendBarProps {
  filterStatus: PlotStatus | 'all';
  onSelectFilter: (status: PlotStatus | 'all') => void;
  statusColorsEnabled: boolean;
  className?: string;
}

export const LegendBar: React.FC<LegendBarProps> = ({
  filterStatus,
  onSelectFilter,
  statusColorsEnabled,
  className = '',
}) => {
  const counts = getPlotCounts();

  const legendItems: {
    status: PlotStatus;
    label: string;
    count: number;
    colorBg: string;
    colorRing: string;
    badgeBg: string;
  }[] = [
    {
      status: 'available',
      label: 'Available',
      count: counts.available,
      colorBg: 'bg-emerald-500',
      colorRing: 'ring-emerald-500/50',
      badgeBg: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30',
    },
    {
      status: 'sold',
      label: 'Sold',
      count: counts.sold,
      colorBg: 'bg-rose-500',
      colorRing: 'ring-rose-500/50',
      badgeBg: 'bg-rose-500/20 text-rose-300 border-rose-500/30',
    },
    {
      status: 'builder',
      label: 'Builder',
      count: counts.builder,
      colorBg: 'bg-amber-500',
      colorRing: 'ring-amber-500/50',
      badgeBg: 'bg-amber-500/20 text-amber-300 border-amber-500/30',
    },
  ];

  return (
    <div className={`flex items-center gap-1.5 sm:gap-2 ${className}`}>
      {legendItems.map((item) => {
        const isSelected = filterStatus === item.status;
        return (
          <button
            key={item.status}
            onClick={() => onSelectFilter(isSelected ? 'all' : item.status)}
            type="button"
            className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-medium transition-all duration-200 border ${
              isSelected
                ? `bg-gray-800/90 text-white border-white/40 shadow-lg ring-2 ${item.colorRing}`
                : 'bg-gray-900/70 text-gray-300 border-white/10 hover:bg-gray-800/80 hover:text-white'
            }`}
            title={`Filter by ${item.label} plots (${item.count})`}
          >
            <span
              className={`w-2.5 h-2.5 rounded-full ${item.colorBg} transition-transform duration-200 ${
                isSelected ? 'scale-125' : ''
              }`}
            />
            <span>{item.label}</span>
            <span
              className={`px-1.5 py-0.2 rounded-full text-[10px] font-semibold border ${item.badgeBg}`}
            >
              {item.count}
            </span>
          </button>
        );
      })}

      {filterStatus !== 'all' && (
        <button
          onClick={() => onSelectFilter('all')}
          className="px-2.5 py-1.5 rounded-full text-xs font-medium bg-red-500/20 text-red-300 border border-red-500/30 hover:bg-red-500/30 transition-all"
        >
          Reset
        </button>
      )}
    </div>
  );
};
