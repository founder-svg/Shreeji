'use client';

import React, { useRef, useEffect, useImperativeHandle, forwardRef } from 'react';
import {
  TransformWrapper,
  TransformComponent,
  ReactZoomPanPinchRef,
} from 'react-zoom-pan-pinch';
import { CombinedPlot, PlotStatus } from '@/types';
import { allPlots, LINES_GEOMETRY, SVG_VIEWBOX } from '@/data/plotHelper';
import { PlotPath } from './PlotPath';

export interface MapViewerRef {
  zoomToPlot: (plot: CombinedPlot) => void;
  resetView: () => void;
}

interface MapViewerProps {
  selectedPlot: CombinedPlot | null;
  onSelectPlot: (plot: CombinedPlot | null) => void;
  statusColorsEnabled: boolean;
  filterStatus: PlotStatus | 'all';
}

export const MapViewer = forwardRef<MapViewerRef, MapViewerProps>(({
  selectedPlot,
  onSelectPlot,
  statusColorsEnabled,
  filterStatus,
}, ref) => {
  const transformRef = useRef<ReactZoomPanPinchRef | null>(null);

  // Smooth Zoom To Plot function
  const animateZoomToPlot = (plot: CombinedPlot) => {
    if (!transformRef.current) return;
    const { centerX, centerY } = plot.stats;
    
    const targetScale = 3.8;
    const containerWidth = window.innerWidth;
    const containerHeight = window.innerHeight;

    // Coordinate scaling matching SVG
    const baseScale = Math.min(containerWidth / 210, containerHeight / 297);
    const offsetX = (containerWidth - 210 * baseScale) / 2;
    const offsetY = (containerHeight - 297 * baseScale) / 2;

    const plotScreenX = offsetX + centerX * baseScale;
    const plotScreenY = offsetY + centerY * baseScale;

    // Center target: slightly shift left on desktop to leave room for the 380px side detail panel
    const desktopOffset = containerWidth > 768 ? -80 : 0;
    const posX = containerWidth / 2 - plotScreenX * targetScale + desktopOffset;
    const posY = containerHeight / 2 - plotScreenY * targetScale;

    transformRef.current.setTransform(posX, posY, targetScale, 750, 'easeInOutCubic');
  };

  // Expose zoomToPlot and resetView to parent via ref
  useImperativeHandle(ref, () => ({
    zoomToPlot: (plot: CombinedPlot) => {
      animateZoomToPlot(plot);
      onSelectPlot(plot);
    },
    resetView: () => {
      if (!transformRef.current) return;
      transformRef.current.resetTransform(650, 'easeInOutCubic');
    },
  }));

  // Auto-animate camera whenever selectedPlot changes
  useEffect(() => {
    if (selectedPlot && !selectedPlot.metadata.isCommonArea) {
      animateZoomToPlot(selectedPlot);
    } else if (!selectedPlot) {
      // Animate back out to default full view when closed/deselected
      transformRef.current?.resetTransform(650, 'easeInOutCubic');
    }
  }, [selectedPlot]);

  const handleBackgroundClick = () => {
    if (selectedPlot) {
      onSelectPlot(null);
    }
  };

  return (
    <div className="relative w-full h-full overflow-hidden bg-[#333333]">
      {/* Zoom / Pan Container */}
      <TransformWrapper
        ref={transformRef}
        initialScale={1}
        minScale={0.6}
        maxScale={12}
        centerOnInit={true}
        limitToBounds={false}
        wheel={{ step: 0.15, smoothStep: 0.005 }}
        pinch={{ step: 5 }}
        doubleClick={{ mode: 'zoomIn', step: 1.6 }}
      >
        <TransformComponent
          wrapperClass="!w-full !h-full flex items-center justify-center cursor-grab active:cursor-grabbing"
          contentClass="!w-full !h-full flex items-center justify-center"
        >
          <div
            className="relative w-full h-full flex items-center justify-center"
            onClick={handleBackgroundClick}
          >
            {/* SVG Plot Survey Layout */}
            <svg
              viewBox={SVG_VIEWBOX}
              className="max-w-full max-h-full filter transition-all duration-300"
              style={{
                width: 'auto',
                height: '92vh',
              }}
            >
              {/* Layer 1: Plot Fills (Exact SVG Paths from fills.svg) */}
              <g id="plot-fills-layer">
                {allPlots.map((plot) => (
                  <PlotPath
                    key={plot.id}
                    plot={plot}
                    isSelected={selectedPlot?.id === plot.id}
                    statusColorsEnabled={statusColorsEnabled}
                    filterStatus={filterStatus}
                    onSelect={onSelectPlot}
                  />
                ))}
              </g>

              {/* Layer 2: Boundary lines, internal roads & dividers (from lines.svg) */}
              <g id="plot-lines-layer" style={{ pointerEvents: 'none' }}>
                {LINES_GEOMETRY.map((line) => (
                  <path
                    key={line.id}
                    id={line.id}
                    d={line.d}
                    fill="#000000"
                    fillOpacity={1}
                    stroke="none"
                  />
                ))}
              </g>

              {/* Layer 3: Plot Labels & Detailed Selected State */}
              <g id="plot-labels-layer" style={{ pointerEvents: 'none' }}>
                {allPlots.map((plot) => {
                  const { centerX, centerY, width, height } = plot.stats;
                  const label = plot.metadata.plotNumber;
                  const isAmenity = Boolean(plot.metadata.isCommonArea);
                  const isSelected = selectedPlot?.id === plot.id && !isAmenity;

                  if (isSelected) {
                    // SELECTED STATE: Stacked Plot #, area in m², area in yd²
                    const titleSize = Math.max(1.5, Math.min(2.6, Math.min(width, height) * 0.44));
                    const subSize = Math.max(0.65, Math.min(1.05, Math.min(width, height) * 0.2));
                    const gap = subSize * 1.25;

                    const areaM2 = plot.areaM2 || (plot.stats.area * 10.24);
                    const areaYd2 = plot.areaYd2 || (areaM2 * 1.19599);

                    return (
                      <g key={`selected-info-${plot.id}`}>
                        {/* Large Bold Plot Number */}
                        <text
                          x={centerX}
                          y={centerY - gap * 1.1}
                          textAnchor="middle"
                          dominantBaseline="central"
                          fontSize={titleSize}
                          fontFamily="system-ui, -apple-system, BlinkMacSystemFont, sans-serif"
                          fontWeight="800"
                          fill="#ffffff"
                          letterSpacing="-0.02em"
                        >
                          {label}
                        </text>

                        {/* Area in m² */}
                        <text
                          x={centerX}
                          y={centerY + gap * 0.15}
                          textAnchor="middle"
                          dominantBaseline="central"
                          fontSize={subSize}
                          fontFamily="system-ui, -apple-system, BlinkMacSystemFont, sans-serif"
                          fontWeight="600"
                          fill="#ffffff"
                          opacity="0.95"
                          letterSpacing="0.01em"
                        >
                          {areaM2.toFixed(2)} m²
                        </text>

                        {/* Area in yd² */}
                        <text
                          x={centerX}
                          y={centerY + gap * 1.35}
                          textAnchor="middle"
                          dominantBaseline="central"
                          fontSize={subSize * 0.95}
                          fontFamily="system-ui, -apple-system, BlinkMacSystemFont, sans-serif"
                          fontWeight="500"
                          fill="#ffffff"
                          opacity="0.9"
                          letterSpacing="0.01em"
                        >
                          {areaYd2.toFixed(2)} yd²
                        </text>
                      </g>
                    );
                  }

                  // DEFAULT UNSELECTED STATE: Moderately larger legible label
                  const fontSize = isAmenity 
                    ? Math.max(1.4, Math.min(2.6, Math.sqrt(width * height) * 0.11))
                    : Math.max(1.0, Math.min(1.9, Math.min(width, height) * 0.38));

                  return (
                    <text
                      key={`label-${plot.id}`}
                      x={centerX}
                      y={centerY}
                      textAnchor="middle"
                      dominantBaseline="central"
                      fontSize={fontSize}
                      fontFamily="system-ui, -apple-system, BlinkMacSystemFont, sans-serif"
                      fontWeight={isAmenity ? "700" : "600"}
                      fill={isAmenity ? "#ffffff" : "#1a1a1a"}
                      letterSpacing="-0.01em"
                    >
                      {label}
                    </text>
                  );
                })}
              </g>
            </svg>
          </div>
        </TransformComponent>
      </TransformWrapper>
    </div>
  );
});

MapViewer.displayName = 'MapViewer';
