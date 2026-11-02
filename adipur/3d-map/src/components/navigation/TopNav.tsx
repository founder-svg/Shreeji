'use client';

import React from 'react';
import { ViewMode, PlotStatus } from '@/types';
import { LegendBar } from './LegendBar';
import { Layers, Box, RotateCcw, Sparkles } from 'lucide-react';

interface TopNavProps {
  viewMode: ViewMode;
  onToggleViewMode: (mode: ViewMode) => void;
  onResetView: () => void;
  statusColorsEnabled: boolean;
  onToggleStatusColors: () => void;
  filterStatus: PlotStatus | 'all';
  onSelectFilter: (status: PlotStatus | 'all') => void;
}

export const TopNav: React.FC<TopNavProps> = ({
  viewMode,
  onToggleViewMode,
  onResetView,
  statusColorsEnabled,
  onToggleStatusColors,
  filterStatus,
  onSelectFilter,
}) => {
  return (
    <header className="fixed top-3 sm:top-4 left-3 sm:left-4 right-3 sm:right-4 z-40 flex items-center justify-between gap-3 pointer-events-none">
      {/* Brand Header (Left) */}
      <div className="pointer-events-auto flex items-center gap-3 glass-panel px-3.5 sm:px-4 py-2 sm:py-2.5 rounded-2xl shadow-xl">
        <div className="relative w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-gradient-to-tr from-emerald-600 to-teal-400 p-0.5 shadow-md shadow-emerald-500/30 flex-shrink-0">
          <div className="w-full h-full rounded-[10px] bg-[#12151c] flex items-center justify-center">
            <svg
              className="w-5 h-5 sm:w-6 sm:h-6 text-emerald-400"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <polygon points="12 2 2 7 12 12 22 7 12 2" />
              <polyline points="2 17 12 22 22 17" />
              <polyline points="2 12 12 17 22 12" />
            </svg>
          </div>
        </div>

        <div className="flex flex-col">
          <div className="flex items-center gap-1.5">
            <span className="font-extrabold text-base sm:text-lg tracking-tight text-white">
              Riva Group
            </span>
            <span className="px-1.5 py-0.5 rounded text-[10px] font-semibold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 uppercase tracking-wide">
              Live
            </span>
          </div>
          <span className="text-[11px] text-gray-400 font-medium tracking-wide hidden sm:inline-block">
            Meadows & Farmland Layout
          </span>
        </div>
      </div>

      {/* Middle & Right Controls */}
      <div className="pointer-events-auto flex items-center gap-2 sm:gap-3">
        {/* Status Toggle Switch */}
        <button
          type="button"
          onClick={onToggleStatusColors}
          className={`glass-panel flex items-center gap-2.5 px-3 sm:px-3.5 py-2 rounded-full cursor-pointer transition-all duration-200 border ${
            statusColorsEnabled
              ? 'border-emerald-500/40 bg-emerald-950/30'
              : 'border-white/10 hover:border-white/20'
          }`}
          title="Toggle plot availability colors"
          aria-pressed={statusColorsEnabled}
        >
          <span className="text-xs font-semibold text-gray-200 tracking-wide">Status</span>
          <div
            className={`w-9 h-5 rounded-full relative transition-colors duration-200 p-0.5 border ${
              statusColorsEnabled
                ? 'bg-emerald-600 border-emerald-500'
                : 'bg-gray-700/80 border-gray-600'
            }`}
          >
            <div
              className={`w-4 h-4 rounded-full bg-white shadow-md transform transition-transform duration-200 ${
                statusColorsEnabled ? 'translate-x-4' : 'translate-x-0'
              }`}
            />
          </div>
        </button>

        {/* Inline Legend for Desktop */}
        <div className="hidden md:flex items-center glass-panel px-2.5 py-1.5 rounded-full">
          <LegendBar
            filterStatus={filterStatus}
            onSelectFilter={onSelectFilter}
            statusColorsEnabled={statusColorsEnabled}
          />
        </div>

        {/* View Mode Toggle (2D / 3D) */}
        <div className="flex items-center glass-panel p-1 rounded-full border border-white/10">
          <button
            type="button"
            onClick={() => onToggleViewMode('2d')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold transition-all duration-200 ${
              viewMode === '2d'
                ? 'bg-emerald-500 text-white shadow-md shadow-emerald-500/25'
                : 'text-gray-400 hover:text-white'
            }`}
            title="2D Map Layout"
          >
            <Layers className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">2D Map</span>
          </button>

          <button
            type="button"
            onClick={() => onToggleViewMode('3d')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold transition-all duration-200 ${
              viewMode === '3d'
                ? 'bg-gradient-to-r from-teal-500 to-emerald-500 text-white shadow-md shadow-teal-500/25'
                : 'text-gray-400 hover:text-white'
            }`}
            title="Interactive 3D Parcel View"
          >
            <Box className="w-3.5 h-3.5" />
            <span>3D View</span>
          </button>
        </div>

        {/* Reset / Home View Button */}
        <button
          type="button"
          onClick={onResetView}
          className="glass-panel w-9 h-9 sm:w-10 sm:h-10 rounded-full flex items-center justify-center text-gray-300 hover:text-white hover:border-white/30 transition-all duration-200"
          title="Reset map view to center"
        >
          <RotateCcw className="w-4 h-4" />
        </button>
      </div>
    </header>
  );
};
