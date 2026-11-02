'use client';

import React, { useState, useRef, useCallback, useEffect } from 'react';
import { CombinedPlot, PlotStatus, ViewMode, ActiveModal } from '@/types';
import { allPlots } from '@/data/plotHelper';
import { BrandHeader } from '@/components/navigation/BrandHeader';
import { MapViewer, MapViewerRef } from '@/components/map/MapViewer';
import { ThreeDViewer } from '@/components/view3d/ThreeDViewer';
import { PlotDetailPanel } from '@/components/details/PlotDetailPanel';
import { BottomControlPanel } from '@/components/ui/BottomControlPanel';
import { SearchModal } from '@/components/modals/SearchModal';
import { GalleryModal } from '@/components/modals/GalleryModal';
import { InfoModal } from '@/components/modals/InfoModal';
import { EnquiryModal } from '@/components/modals/EnquiryModal';
import { SiteLoader } from '@/components/ui/SiteLoader';

export default function HomePage() {
  const mapViewerRef = useRef<MapViewerRef | null>(null);

  // Core interactive states - statusColorsEnabled defaults to FALSE matching reference
  const [viewMode, setViewMode] = useState<ViewMode>('2d');
  const [statusColorsEnabled, setStatusColorsEnabled] = useState<boolean>(false);
  const [filterStatus, setFilterStatus] = useState<PlotStatus | 'all'>('all');
  const [selectedPlot, setSelectedPlot] = useState<CombinedPlot | null>(null);
  const [activeModal, setActiveModal] = useState<ActiveModal>('none');
  const [enquiryPlot, setEnquiryPlot] = useState<CombinedPlot | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Toast notification helper
  const showToast = useCallback((msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 2500);
  }, []);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) {
        return;
      }
      if (e.key === '/') {
        e.preventDefault();
        setActiveModal('search');
      } else if (e.key === 'Escape') {
        if (activeModal !== 'none') {
          setActiveModal('none');
        } else if (selectedPlot) {
          setSelectedPlot(null);
        }
      } else if (e.key.toLowerCase() === 's') {
        setStatusColorsEnabled((prev) => !prev);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [activeModal, selectedPlot]);

  // Handle Search Selection -> Zoom to plot & open details
  const handleSelectPlotFromSearch = useCallback((plot: CombinedPlot) => {
    setSelectedPlot(plot);
    if (viewMode === '2d' && mapViewerRef.current) {
      mapViewerRef.current.zoomToPlot(plot);
    }
  }, [viewMode]);

  // Reset View
  const handleResetView = useCallback(() => {
    if (viewMode === '2d' && mapViewerRef.current) {
      mapViewerRef.current.resetView();
    }
    setSelectedPlot(null);
    showToast('View reset');
  }, [viewMode, showToast]);

  // Share Site URL
  const handleShare = useCallback(() => {
    if (navigator.share) {
      navigator.share({
        title: '3D Plot Layout',
        text: 'Explore interactive farmland and residential plot layout.',
        url: window.location.href,
      }).catch(() => {});
    } else {
      navigator.clipboard.writeText(window.location.href);
      showToast('Project link copied to clipboard!');
    }
  }, [showToast]);

  // Open Enquiry Modal
  const handleOpenEnquiry = useCallback((plot?: CombinedPlot) => {
    setEnquiryPlot(plot || selectedPlot || null);
    setActiveModal('enquiry');
  }, [selectedPlot]);

  // Previous & Next Plot Navigation in Side Panel
  const handlePrevPlot = useCallback(() => {
    if (!selectedPlot) return;
    const currentIndex = allPlots.findIndex((p) => p.id === selectedPlot.id);
    const prevIndex = (currentIndex - 1 + allPlots.length) % allPlots.length;
    const prevPlot = allPlots[prevIndex];
    setSelectedPlot(prevPlot);
    if (viewMode === '2d' && mapViewerRef.current) {
      mapViewerRef.current.zoomToPlot(prevPlot);
    }
  }, [selectedPlot, viewMode]);

  const handleNextPlot = useCallback(() => {
    if (!selectedPlot) return;
    const currentIndex = allPlots.findIndex((p) => p.id === selectedPlot.id);
    const nextIndex = (currentIndex + 1) % allPlots.length;
    const nextPlot = allPlots[nextIndex];
    setSelectedPlot(nextPlot);
    if (viewMode === '2d' && mapViewerRef.current) {
      mapViewerRef.current.zoomToPlot(nextPlot);
    }
  }, [selectedPlot, viewMode]);

  return (
    <main className="relative w-screen h-screen overflow-hidden bg-[#333333]">
      {/* Site Entrance Loader */}
      <SiteLoader />

      {/* Top Left Brand: Gold Logo + Riva Group only */}
      <BrandHeader />

      {/* Main Interactive Viewer (2D SVG Map or 3D Parcel View) */}
      <div className="w-full h-full">
        {viewMode === '2d' ? (
          <MapViewer
            ref={mapViewerRef}
            selectedPlot={selectedPlot}
            onSelectPlot={setSelectedPlot}
            statusColorsEnabled={statusColorsEnabled}
            filterStatus={filterStatus}
          />
        ) : (
          <ThreeDViewer
            selectedPlot={selectedPlot}
            onSelectPlot={setSelectedPlot}
            statusColorsEnabled={statusColorsEnabled}
            filterStatus={filterStatus}
          />
        )}
      </div>

      {/* Bottom Right Floating Control Cluster (Exact Reference Layout) */}
      <BottomControlPanel
        viewMode={viewMode}
        onToggleViewMode={setViewMode}
        onResetView={handleResetView}
        statusColorsEnabled={statusColorsEnabled}
        onToggleStatusColors={() => setStatusColorsEnabled((prev) => !prev)}
        onOpenModal={(modal) => setActiveModal(modal)}
        onShare={handleShare}
        filterStatus={filterStatus}
        onSelectFilter={setFilterStatus}
      />

      {/* Plot Details Floating Side Panel / Mobile Bottom Sheet */}
      <PlotDetailPanel
        plot={selectedPlot}
        onClose={() => setSelectedPlot(null)}
        onOpenEnquiry={handleOpenEnquiry}
        onPrevPlot={handlePrevPlot}
        onNextPlot={handleNextPlot}
      />

      {/* Modals */}
      <SearchModal
        isOpen={activeModal === 'search'}
        onClose={() => setActiveModal('none')}
        onSelectPlot={handleSelectPlotFromSearch}
      />

      <GalleryModal
        isOpen={activeModal === 'gallery'}
        onClose={() => setActiveModal('none')}
      />

      <InfoModal
        isOpen={activeModal === 'info'}
        onClose={() => setActiveModal('none')}
        onOpenEnquiry={() => handleOpenEnquiry()}
      />

      <EnquiryModal
        isOpen={activeModal === 'enquiry'}
        onClose={() => {
          setActiveModal('none');
          setEnquiryPlot(null);
        }}
        plot={enquiryPlot}
      />

      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-20 left-1/2 transform -translate-x-1/2 z-[100] pointer-events-none animate-fade-in">
          <div className="px-4 py-2 rounded-full text-xs font-semibold text-white shadow-2xl border border-white/20 bg-gray-900/95 backdrop-blur-xl">
            {toastMessage}
          </div>
        </div>
      )}
    </main>
  );
}
