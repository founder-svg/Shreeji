import { PLOTS_GEOMETRY, LINES_GEOMETRY, SVG_VIEWBOX, SVG_WIDTH, SVG_HEIGHT } from './plotsGeometry';
import plotsJson from './plots.json';
import { CombinedPlot, PlotMetadata, PlotStatus } from '@/types';

const rawPlotsMetadata = plotsJson as Record<string, PlotMetadata>;

// Fixed amenity accent colors matching reference design
export const AMENITY_COLORS: Record<string, string> = {
  'sardar sarovar': '#4caf50',     // Garden green / Party plot
  'party plot': '#4caf50',
  'satsang hall': '#b58ad8',       // Soft luxury purple / Hotel
  'hotel': '#b58ad8',
  'police parade ground': '#6495ed', // Cornflower blue
  'office': '#6495ed',
  'cc': '#d88961',                 // Terracotta / Clubhouse
  'clubhouse': '#d88961',
  'shop': '#06b6d4',               // Cyan
  'parking': '#64748b',            // Slate
  'sps': '#475569',                // Deep slate
};

export const DEFAULT_PLOT_FILL = '#EDE0C8'; // Warm light cream / beige matching reference

export const STATUS_COLORS = {
  available: '#1e88e5', // Reference blue (or #22c55e green)
  sold: '#e53935',      // Reference red
  builder: '#f9a825',   // Reference yellow / amber
};

export const allPlots: CombinedPlot[] = PLOTS_GEOMETRY.map((geom) => {
  const meta: PlotMetadata = rawPlotsMetadata[geom.id] || {
    id: geom.id,
    plotNumber: geom.label || geom.id,
    title: `Plot ${geom.label || geom.id}`,
    type: 'plot',
    status: 'available',
    areaSqYd: 250,
    areaSqFt: 2250,
    dimensions: "35' x 65'",
    facing: 'East',
    price: '₹45 Lakhs',
    features: ['Clear Title', 'Immediate Registry'],
    description: 'Scenic farmland plot with road frontage and premium estate access.'
  };

  const lowerLabel = (geom.label || '').toLowerCase();
  const isCommon = Boolean(
    AMENITY_COLORS[lowerLabel] ||
    lowerLabel.includes('police parade') ||
    lowerLabel.includes('shop') ||
    lowerLabel.includes('parking') ||
    lowerLabel.includes('sardar sarovar') ||
    lowerLabel.includes('satsang') ||
    lowerLabel.includes('sps') ||
    lowerLabel.includes('cc') ||
    meta.isCommonArea
  );

  if (isCommon) {
    meta.type = 'amenity';
    meta.isCommonArea = true;
  }

  return {
    ...geom,
    metadata: meta,
  };
});

export const plotMap = new Map<string, CombinedPlot>();
allPlots.forEach((p) => {
  plotMap.set(p.id, p);
  plotMap.set(p.metadata.plotNumber.toLowerCase(), p);
});

export function getPlotById(id: string): CombinedPlot | undefined {
  return plotMap.get(id);
}

export function getPlotCounts(): { available: number; sold: number; builder: number; total: number } {
  let available = 0;
  let sold = 0;
  let builder = 0;

  allPlots.forEach((p) => {
    if (p.metadata.status === 'available') available++;
    else if (p.metadata.status === 'sold') sold++;
    else if (p.metadata.status === 'builder') builder++;
  });

  return {
    available,
    sold,
    builder,
    total: allPlots.length,
  };
}

export { LINES_GEOMETRY, SVG_VIEWBOX, SVG_WIDTH, SVG_HEIGHT };
