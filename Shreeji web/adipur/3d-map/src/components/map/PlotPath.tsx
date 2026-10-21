'use client';

import React from 'react';
import { CombinedPlot, PlotStatus } from '@/types';
import { AMENITY_COLORS, DEFAULT_PLOT_FILL, STATUS_COLORS } from '@/data/plotHelper';

interface PlotPathProps {
  plot: CombinedPlot;
  isSelected: boolean;
  statusColorsEnabled: boolean;
  filterStatus: PlotStatus | 'all';
  onSelect: (plot: CombinedPlot | null) => void;
}

export const PlotPath: React.FC<PlotPathProps> = ({
  plot,
  isSelected,
  statusColorsEnabled,
  filterStatus,
  onSelect,
}) => {
  const { id, d, metadata, stats } = plot;
  const lowerLabel = (metadata.plotNumber || '').toLowerCase();
  const isCommonArea = Boolean(metadata.isCommonArea);

  // 1. Determine fill color
  const amenityColor = AMENITY_COLORS[lowerLabel];
  let fillColor = DEFAULT_PLOT_FILL; // #EDE0C8 (warm cream/beige)

  if (amenityColor) {
    fillColor = amenityColor;
  } else if (isSelected && !isCommonArea) {
    // Solid bright accent blue when selected
    fillColor = '#2E86F5';
  } else if (statusColorsEnabled) {
    // Apply status colors when Status toggle is ON
    fillColor = STATUS_COLORS[metadata.status] || DEFAULT_PLOT_FILL;
  }

  // Check filter match
  const isFilteredOut = !isCommonArea && filterStatus !== 'all' && metadata.status !== filterStatus;
  const opacity = isFilteredOut ? 0.2 : 1;

  // Stroke logic: sharp polygon edge with clean dark divider or dashed white when selected
  let strokeColor = 'rgba(0, 0, 0, 0.5)';
  let strokeWidth = '0.12';
  let strokeDasharray = undefined;

  if (!isCommonArea) {
    if (isSelected) {
      strokeColor = '#ffffff';
      strokeWidth = '0.45';
      strokeDasharray = '1.2, 0.8';
    }
  }

  return (
    <g className="plot-group">
      <path
        id={id}
        d={d}
        fill={fillColor}
        fillOpacity={opacity}
        stroke={strokeColor}
        strokeWidth={strokeWidth}
        strokeDasharray={strokeDasharray}
        strokeLinejoin="miter"
        strokeLinecap="butt"
        className={`plot-path transition-all duration-150 ${
          isCommonArea
            ? 'cursor-default pointer-events-none'
            : `cursor-pointer ${isSelected ? 'is-selected' : ''}`
        }`}
        onClick={(e) => {
          if (isCommonArea) return;
          e.stopPropagation();
          onSelect(isSelected ? null : plot);
        }}
        style={{
          transformOrigin: `${stats.centerX}px ${stats.centerY}px`,
        }}
      />
    </g>
  );
};
