export type PlotStatus = 'available' | 'sold' | 'builder';
export type PlotType = 'plot' | 'landmark' | 'amenity' | 'commercial';
export type ViewMode = '2d' | '3d';

export interface PlotEdge {
  x1: number;
  y1: number;
  x2: number;
  y2: number;
  mx: number;
  my: number;
  nx: number;
  ny: number;
  lengthM: number;
  lengthText: string;
  angle: number;
}

export interface PlotMetadata {
  id: string;
  plotNumber: string;
  title: string;
  type: PlotType;
  status: PlotStatus;
  areaSqYd: number;
  areaSqFt: number;
  areaM2?: number;
  areaYd2?: number;
  dimensions: string;
  facing: string;
  price: string;
  features: string[];
  description: string;
  isCommonArea?: boolean;
}

export interface PlotGeometry {
  id: string;
  label: string;
  d: string;
  stats: {
    minX: number;
    minY: number;
    maxX: number;
    maxY: number;
    centerX: number;
    centerY: number;
    width: number;
    height: number;
    area: number;
  };
  areaM2?: number;
  areaYd2?: number;
  edges?: PlotEdge[];
}

export interface CombinedPlot extends PlotGeometry {
  metadata: PlotMetadata;
}

export type ActiveModal = 'none' | 'gallery' | 'info' | 'enquiry' | 'search';
