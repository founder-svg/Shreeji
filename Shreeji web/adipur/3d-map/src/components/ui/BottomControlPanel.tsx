'use client';

import React from 'react';
import { ActiveModal, ViewMode, PlotStatus } from '@/types';
import {
  Search,
  Image,
  Info,
  Navigation,
  Share2,
  Home,
  Layers,
  Box,
} from 'lucide-react';

interface BottomControlPanelProps {
  viewMode: ViewMode;
  onToggleViewMode: (mode: ViewMode) => void;
  onResetView: () => void;
  statusColorsEnabled: boolean;
  onToggleStatusColors: () => void;
  onOpenModal: (modal: ActiveModal) => void;
  onShare: () => void;
  filterStatus: PlotStatus | 'all';
  onSelectFilter: (status: PlotStatus | 'all') => void;
}

export const BottomControlPanel: React.FC<BottomControlPanelProps> = ({
  viewMode,
  onToggleViewMode,
  onResetView,
  statusColorsEnabled,
  onToggleStatusColors,
  onOpenModal,
  onShare,
  filterStatus,
  onSelectFilter,
}) => {
  return (
    <div className="fixed bottom-4 right-4 z-40 flex flex-col items-end gap-3 max-w-[calc(100vw-32px)] w-[320px] sm:w-[340px] pointer-events-auto select-none">
      {/* 1. TOP ROW: Status Toggle + 3D/2D + Home + Share */}
      <div className="relative flex items-center justify-end gap-2.5 w-full">
        {/* Floating Status Legend (revealed only when Status is ON) */}
        <div
          className={`absolute right-0 bottom-[calc(100%+10px)] z-50 flex flex-col gap-2 p-3 rounded-xl border border-[rgba(120,120,120,0.45)] bg-[rgba(30,30,30,0.95)] shadow-2xl min-w-[160px] text-gray-200 transition-all duration-200 ${
            statusColorsEnabled
              ? 'opacity-100 scale-100 pointer-events-auto translate-y-0'
              : 'opacity-0 scale-95 pointer-events-none translate-y-2'
          }`}
        >
          <div className="text-[11px] font-bold text-gray-400 uppercase tracking-wider mb-0.5">
            Plot Availability
          </div>
          
          <button
            onClick={() => onSelectFilter(filterStatus === 'available' ? 'all' : 'available')}
            className={`flex items-center gap-2.5 text-xs font-medium px-2 py-1 rounded-lg transition-colors text-left ${
              filterStatus === 'available' ? 'bg-white/15 text-white' : 'hover:bg-white/5'
            }`}
          >
            <span className="w-3 h-3 rounded-full bg-[#1e88e5] flex-shrink-0" />
            <span>Available</span>
          </button>

          <button
            onClick={() => onSelectFilter(filterStatus === 'sold' ? 'all' : 'sold')}
            className={`flex items-center gap-2.5 text-xs font-medium px-2 py-1 rounded-lg transition-colors text-left ${
              filterStatus === 'sold' ? 'bg-white/15 text-white' : 'hover:bg-white/5'
            }`}
          >
            <span className="w-3 h-3 rounded-full bg-[#e53935] flex-shrink-0" />
            <span>Sold</span>
          </button>

          <button
            onClick={() => onSelectFilter(filterStatus === 'builder' ? 'all' : 'builder')}
            className={`flex items-center gap-2.5 text-xs font-medium px-2 py-1 rounded-lg transition-colors text-left ${
              filterStatus === 'builder' ? 'bg-white/15 text-white' : 'hover:bg-white/5'
            }`}
          >
            <span className="w-3 h-3 rounded-full bg-[#f9a825] flex-shrink-0" />
            <span>Builder</span>
          </button>
        </div>

        {/* Status Toggle Button with Switch Knob */}
        <button
          type="button"
          onClick={onToggleStatusColors}
          className="h-[44px] px-3.5 rounded-full flex items-center gap-2.5 bg-[rgba(45,45,45,0.95)] hover:bg-[rgba(70,70,70,1)] border border-[rgba(120,120,120,0.45)] text-[#eaeaea] transition-all cursor-pointer shadow-md"
          title="Toggle plot availability colors"
          aria-pressed={statusColorsEnabled}
        >
          <span className="text-[13px] font-semibold tracking-wide">Status</span>
          <div
            className={`w-9 h-5 rounded-full relative transition-colors duration-200 p-0.5 border ${
              statusColorsEnabled
                ? 'bg-[#2a9d62] border-[#2a9d62]'
                : 'bg-[rgba(95,95,95,0.95)] border-[rgba(130,130,130,0.55)]'
            }`}
          >
            <div
              className={`w-4 h-4 rounded-full bg-white shadow-md transform transition-transform duration-200 ${
                statusColorsEnabled ? 'translate-x-4' : 'translate-x-0'
              }`}
            />
          </div>
        </button>

        {/* 2D / 3D Toggle Circle Button */}
        <button
          type="button"
          onClick={() => onToggleViewMode(viewMode === '2d' ? '3d' : '2d')}
          className="w-[44px] h-[44px] rounded-full flex items-center justify-center bg-[rgba(40,40,40,0.95)] hover:bg-[rgba(70,70,70,1)] border border-[rgba(120,120,120,0.45)] text-white transition-all cursor-pointer hover:scale-105 shadow-md"
          title={viewMode === '2d' ? 'Switch to 3D View' : 'Switch to 2D Map'}
        >
          {viewMode === '2d' ? (
            <Box className="w-[18px] h-[18px]" />
          ) : (
            <Layers className="w-[18px] h-[18px]" />
          )}
        </button>

        {/* Home / Reset View Circle Button */}
        <button
          type="button"
          onClick={onResetView}
          className="w-[44px] h-[44px] rounded-full flex items-center justify-center bg-[rgba(40,40,40,0.95)] hover:bg-[rgba(70,70,70,1)] border border-[rgba(120,120,120,0.45)] text-white transition-all cursor-pointer hover:scale-105 shadow-md"
          title="Reset View to Default"
        >
          <Home className="w-[18px] h-[18px]" />
        </button>

        {/* Share Circle Button */}
        <button
          type="button"
          onClick={onShare}
          className="w-[44px] h-[44px] rounded-full flex items-center justify-center bg-[rgba(40,40,40,0.95)] hover:bg-[rgba(70,70,70,1)] border border-[rgba(120,120,120,0.45)] text-white transition-all cursor-pointer hover:scale-105 shadow-md"
          title="Share Site"
        >
          <Share2 className="w-[18px] h-[18px]" />
        </button>
      </div>

      {/* 2. MIDDLE ROW: Full-Width Search Bar */}
      <button
        type="button"
        onClick={() => onOpenModal('search')}
        className="w-full h-[44px] px-4 rounded-full flex items-center gap-3 bg-[rgba(45,45,45,0.95)] hover:bg-[rgba(70,70,70,1)] border border-[rgba(120,120,120,0.45)] text-[#eaeaea] transition-all cursor-pointer shadow-md group text-left"
        title="Search Plot"
      >
        <Search className="w-[16px] h-[16px] text-gray-300 flex-shrink-0" />
        <span className="text-[13px] text-gray-300 font-normal flex-1">Search Plot</span>
      </button>

      {/* 3. BOTTOM ROW: Gallery, Info, Locate (Pill Buttons) */}
      <div className="flex items-center justify-between gap-2 w-full">
        <button
          type="button"
          onClick={() => onOpenModal('gallery')}
          className="flex-1 h-[42px] px-3.5 rounded-full flex items-center justify-center gap-2 bg-[rgba(45,45,45,0.95)] hover:bg-[rgba(70,70,70,1)] border border-[rgba(120,120,120,0.45)] text-[#eaeaea] text-[13px] font-medium transition-all cursor-pointer shadow-md"
        >
          <Image className="w-[15px] h-[15px] opacity-90" />
          <span>Gallery</span>
        </button>

        <button
          type="button"
          onClick={() => onOpenModal('info')}
          className="flex-1 h-[42px] px-3.5 rounded-full flex items-center justify-center gap-2 bg-[rgba(45,45,45,0.95)] hover:bg-[rgba(70,70,70,1)] border border-[rgba(120,120,120,0.45)] text-[#eaeaea] text-[13px] font-medium transition-all cursor-pointer shadow-md"
        >
          <Info className="w-[15px] h-[15px] opacity-90" />
          <span>Info</span>
        </button>

        <button
          type="button"
          onClick={onResetView}
          className="flex-1 h-[42px] px-3.5 rounded-full flex items-center justify-center gap-2 bg-[rgba(45,45,45,0.95)] hover:bg-[rgba(70,70,70,1)] border border-[rgba(120,120,120,0.45)] text-[#eaeaea] text-[13px] font-medium transition-all cursor-pointer shadow-md"
        >
          <Navigation className="w-[15px] h-[15px] opacity-90 transform rotate-45" />
          <span>Locate</span>
        </button>
      </div>
    </div>
  );
};
