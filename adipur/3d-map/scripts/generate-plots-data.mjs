import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');

// Helper to parse SVG path coordinates
function getPathPoints(d) {
  const points = [];
  let currentX = 0;
  let currentY = 0;
  
  const commands = d.match(/([a-df-z]|[-+]?[0-9]*\.?[0-9]+(?:e[-+]?[0-9]+)?)/gi) || [];
  let i = 0;
  let cmd = '';
  
  while (i < commands.length) {
    const token = commands[i];
    if (/^[a-df-z]$/i.test(token)) {
      cmd = token;
      i++;
    }
    
    if (cmd === 'm' || cmd === 'M') {
      const x = parseFloat(commands[i++]);
      const y = parseFloat(commands[i++]);
      if (cmd === 'm') {
        currentX += x;
        currentY += y;
      } else {
        currentX = x;
        currentY = y;
      }
      points.push({ x: currentX, y: currentY });
      cmd = (cmd === 'm') ? 'l' : 'L';
    } else if (cmd === 'l' || cmd === 'L') {
      const x = parseFloat(commands[i++]);
      const y = parseFloat(commands[i++]);
      if (cmd === 'l') {
        currentX += x;
        currentY += y;
      } else {
        currentX = x;
        currentY = y;
      }
      points.push({ x: currentX, y: currentY });
    } else if (cmd === 'h' || cmd === 'H') {
      const x = parseFloat(commands[i++]);
      if (cmd === 'h') currentX += x;
      else currentX = x;
      points.push({ x: currentX, y: currentY });
    } else if (cmd === 'v' || cmd === 'V') {
      const y = parseFloat(commands[i++]);
      if (cmd === 'v') currentY += y;
      else currentY = y;
      points.push({ x: currentX, y: currentY });
    } else if (cmd === 'c' || cmd === 'C') {
      const x1 = parseFloat(commands[i++]);
      const y1 = parseFloat(commands[i++]);
      const x2 = parseFloat(commands[i++]);
      const y2 = parseFloat(commands[i++]);
      const x = parseFloat(commands[i++]);
      const y = parseFloat(commands[i++]);
      if (cmd === 'c') {
        currentX += x;
        currentY += y;
      } else {
        currentX = x;
        currentY = y;
      }
      points.push({ x: currentX, y: currentY });
    } else if (cmd === 'z' || cmd === 'Z') {
      // closed
    } else {
      i++;
    }
  }
  return points;
}

// Clean polygon points (remove duplicate consecutive points)
function cleanPolygon(pts) {
  const clean = [];
  for (let i = 0; i < pts.length; i++) {
    const p = pts[i];
    if (clean.length === 0) {
      clean.push(p);
    } else {
      const prev = clean[clean.length - 1];
      const d = Math.hypot(p.x - prev.x, p.y - prev.y);
      if (d > 0.05) {
        clean.push(p);
      }
    }
  }
  if (clean.length > 2) {
    const first = clean[0];
    const last = clean[clean.length - 1];
    if (Math.hypot(first.x - last.x, first.y - last.y) < 0.05) {
      clean.pop();
    }
  }
  return clean;
}

function computeStats(points) {
  if (points.length === 0) {
    return { minX: 0, minY: 0, maxX: 0, maxY: 0, centerX: 0, centerY: 0, width: 0, height: 0, area: 0 };
  }
  let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
  let sumX = 0, sumY = 0;
  
  points.forEach(p => {
    minX = Math.min(minX, p.x);
    minY = Math.min(minY, p.y);
    maxX = Math.max(maxX, p.x);
    maxY = Math.max(maxY, p.y);
    sumX += p.x;
    sumY += p.y;
  });
  
  const width = maxX - minX;
  const height = maxY - minY;
  
  // Polygon centroid & area via Shoelace formula
  let area = 0;
  let cx = 0;
  let cy = 0;
  
  for (let i = 0; i < points.length; i++) {
    const j = (i + 1) % points.length;
    const factor = (points[i].x * points[j].y - points[j].x * points[i].y);
    area += factor;
    cx += (points[i].x + points[j].x) * factor;
    cy += (points[i].y + points[j].y) * factor;
  }
  
  area = area / 2;
  const absArea = Math.abs(area);
  
  let centerX, centerY;
  if (absArea > 0.001) {
    centerX = cx / (6 * area);
    centerY = cy / (6 * area);
  } else {
    centerX = (minX + maxX) / 2;
    centerY = (minY + maxY) / 2;
  }
  
  return {
    minX: Number(minX.toFixed(3)),
    minY: Number(minY.toFixed(3)),
    maxX: Number(maxX.toFixed(3)),
    maxY: Number(maxY.toFixed(3)),
    centerX: Number(centerX.toFixed(3)),
    centerY: Number(centerY.toFixed(3)),
    width: Number(width.toFixed(3)),
    height: Number(height.toFixed(3)),
    area: Number(absArea.toFixed(3))
  };
}

// Compute edge length dimensions and text orientation for selected polygon
const SCALE_METERS_PER_UNIT = 3.2; // Real-world scale factor

function computeEdges(points, centerX, centerY) {
  const edges = [];
  const n = points.length;
  if (n < 3) return edges;

  for (let i = 0; i < n; i++) {
    const p1 = points[i];
    const p2 = points[(i + 1) % n];
    const dx = p2.x - p1.x;
    const dy = p2.y - p1.y;
    const lenUnits = Math.hypot(dx, dy);
    
    if (lenUnits < 0.3) continue; // Ignore tiny artifacts

    const lenMeters = lenUnits * SCALE_METERS_PER_UNIT;
    const mx = (p1.x + p2.x) / 2;
    const my = (p1.y + p2.y) / 2;

    // Angle in degrees
    let angle = Math.atan2(dy, dx) * 180 / Math.PI;
    // Normalize angle so text is upright (-90 to +90)
    if (angle > 90) angle -= 180;
    if (angle < -90) angle += 180;

    // Normal vector pointing inward toward polygon centroid
    let nx = -dy / lenUnits;
    let ny = dx / lenUnits;
    
    // Check if (nx, ny) points toward (centerX, centerY)
    const toCentroidX = centerX - mx;
    const toCentroidY = centerY - my;
    const dot = nx * toCentroidX + ny * toCentroidY;
    if (dot < 0) {
      nx = -nx;
      ny = -ny;
    }

    edges.push({
      x1: Number(p1.x.toFixed(2)),
      y1: Number(p1.y.toFixed(2)),
      x2: Number(p2.x.toFixed(2)),
      y2: Number(p2.y.toFixed(2)),
      mx: Number(mx.toFixed(2)),
      my: Number(my.toFixed(2)),
      nx: Number(nx.toFixed(2)),
      ny: Number(ny.toFixed(2)),
      lengthM: Number(lenMeters.toFixed(2)),
      lengthText: `${lenMeters.toFixed(2)} m`,
      angle: Number(angle.toFixed(1))
    });
  }

  return edges;
}

function parsePaths(svgContent) {
  const paths = [];
  const regex = /<path([^>]+)\/?>/g;
  let match;
  while ((match = regex.exec(svgContent)) !== null) {
    const attrStr = match[1];
    const idMatch = attrStr.match(/id="([^"]+)"/);
    const dMatch = attrStr.match(/d="([^"]+)"/);
    const labelMatch = attrStr.match(/inkscape:label="([^"]+)"/);
    const styleMatch = attrStr.match(/style="([^"]+)"/);
    
    if (idMatch && dMatch) {
      paths.push({
        id: idMatch[1],
        label: labelMatch ? labelMatch[1] : undefined,
        d: dMatch[1],
        style: styleMatch ? styleMatch[1] : ''
      });
    }
  }
  return paths;
}

const fillsSvg = fs.readFileSync(path.join(rootDir, 'fills.svg'), 'utf8');
const linesSvg = fs.readFileSync(path.join(rootDir, 'lines.svg'), 'utf8');
const combinedSvg = fs.readFileSync(path.join(rootDir, '5A ,5B.svg'), 'utf8');

const fillPaths = parsePaths(fillsSvg);
const linePaths = parsePaths(linesSvg);
const combinedPaths = parsePaths(combinedSvg);

// Build label dictionary
const labelMap = {};
combinedPaths.forEach(p => {
  if (p.label) {
    labelMap[p.id] = p.label.trim();
  }
});

const specialTypes = {
  'sardar sarovar': { type: 'landmark', title: 'Sardar Sarovar Vista', status: 'available', price: '₹1.50 Cr', areaSqYd: 1200 },
  'satsang hall': { type: 'amenity', title: 'Community Satsang Hall', status: 'builder', price: 'Amenity', areaSqYd: 2800 },
  'police parade ground': { type: 'landmark', title: 'Grand Parade Arena', status: 'sold', price: 'Reserved', areaSqYd: 5500 },
  'shop': { type: 'commercial', title: 'Commercial Plaza & Arcade', status: 'available', price: '₹95,00,000', areaSqYd: 650 },
  'parking': { type: 'amenity', title: 'Visitor & Resident Parking', status: 'builder', price: 'Amenity', areaSqYd: 650 },
  'cc': { type: 'amenity', title: 'Clubhouse & Sports Center', status: 'builder', price: 'Amenity', areaSqYd: 980 },
  'sps': { type: 'amenity', title: 'Services & Substation Area', status: 'sold', price: 'Services', areaSqYd: 450 },
};

const facings = ['East', 'North', 'West', 'South', 'North-East', 'North-West'];
const processedPlots = [];
const plotsMetadata = {};

let plotIndex = 0;
for (const p of fillPaths) {
  const rawPts = getPathPoints(p.d);
  const pts = cleanPolygon(rawPts);
  const stats = computeStats(pts);
  const rawLabel = labelMap[p.id] || `Plot ${plotIndex + 1}`;
  const lowerLabel = rawLabel.toLowerCase();
  
  const edges = computeEdges(pts, stats.centerX, stats.centerY);

  // Exact real-world area conversions
  const areaM2 = Number((stats.area * (SCALE_METERS_PER_UNIT ** 2)).toFixed(2));
  const areaYd2 = Number((areaM2 * 1.19599).toFixed(2));

  let plotType = 'plot';
  let title = `Plot ${rawLabel}`;
  let status = 'available';
  let price = '₹45,00,000';
  let areaSqYd = Math.round(areaYd2);
  
  if (specialTypes[lowerLabel]) {
    const special = specialTypes[lowerLabel];
    plotType = special.type;
    title = special.title;
    status = special.status;
    price = special.price;
    areaSqYd = special.areaSqYd;
  } else {
    // Generate pseudorandom status based on plot ID hash
    const hash = p.id.split('').reduce((acc, c) => acc + c.charCodeAt(0), 0) + plotIndex * 17;
    const statusIdx = hash % 100;
    if (statusIdx < 50) {
      status = 'available';
    } else if (statusIdx < 82) {
      status = 'sold';
    } else {
      status = 'builder';
    }
    
    const pricePerSqYd = 12500 + ((hash % 15) * 500);
    const totalPrice = areaSqYd * pricePerSqYd;
    if (totalPrice >= 10000000) {
      price = `₹${(totalPrice / 10000000).toFixed(2)} Cr`;
    } else {
      price = `₹${Math.round(totalPrice / 100000)} Lakhs`;
    }
  }
  
  const facing = facings[plotIndex % facings.length];
  const areaSqFt = Math.round(areaSqYd * 9);
  const dimWidth = Math.max(25, Math.round(Math.sqrt(areaSqFt) * 0.75));
  const dimLength = Math.round(areaSqFt / dimWidth);
  const dimensions = `${dimWidth}' x ${dimLength}'`;
  
  const features = [];
  if (plotIndex % 3 === 0) features.push('Corner Plot');
  if (plotIndex % 2 === 0) features.push('Wide Road Facing');
  if (facing === 'East' || facing === 'North') features.push('100% Vastu Compliant');
  if (areaSqYd > 300) features.push('Premium Large Parcel');
  features.push('Immediate Registry', 'Clear Title with 7/12 Extract');
  
  const isCommon = Boolean(specialTypes[lowerLabel]);

  const plotObj = {
    id: p.id,
    label: rawLabel,
    d: p.d,
    stats: stats,
    areaM2: areaM2,
    areaYd2: areaYd2,
    edges: edges
  };
  
  const metaObj = {
    id: p.id,
    plotNumber: rawLabel,
    title: title,
    type: plotType,
    status: status,
    areaSqYd: areaSqYd,
    areaSqFt: areaSqFt,
    areaM2: areaM2,
    areaYd2: areaYd2,
    dimensions: dimensions,
    facing: facing,
    price: price,
    features: features,
    description: `Premium land plot located in prime sector with scenic open landscape, direct asphalt road access, underground utilities, and round-the-clock security.`,
    isCommonArea: isCommon
  };
  
  processedPlots.push(plotObj);
  plotsMetadata[p.id] = metaObj;
  plotIndex++;
}

// Prepare output dirs
const dataDir = path.join(rootDir, 'src', 'data');
const publicDir = path.join(rootDir, 'public');
const assetsDir = path.join(publicDir, 'assets');

if (!fs.existsSync(dataDir)) fs.mkdirSync(dataDir, { recursive: true });
if (!fs.existsSync(assetsDir)) fs.mkdirSync(assetsDir, { recursive: true });

// Copy SVGs to public/assets
fs.copyFileSync(path.join(rootDir, 'fills.svg'), path.join(assetsDir, 'fills.svg'));
fs.copyFileSync(path.join(rootDir, 'lines.svg'), path.join(assetsDir, 'lines.svg'));
fs.copyFileSync(path.join(rootDir, '5A ,5B.svg'), path.join(assetsDir, 'combined.svg'));

// Write plots.json
fs.writeFileSync(path.join(dataDir, 'plots.json'), JSON.stringify(plotsMetadata, null, 2), 'utf8');

// Write plotsGeometry.ts
const geometryCode = `// Auto-generated SVG layout geometry data with edge dimensions and area calculation
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
  areaM2: number;
  areaYd2: number;
  edges: PlotEdge[];
}

export interface LineGeometry {
  id: string;
  d: string;
  style: string;
}

export const SVG_VIEWBOX = "0 0 210 297";
export const SVG_WIDTH = 210;
export const SVG_HEIGHT = 297;

export const PLOTS_GEOMETRY: PlotGeometry[] = ${JSON.stringify(processedPlots, null, 2)};

export const LINES_GEOMETRY: LineGeometry[] = ${JSON.stringify(linePaths.map(l => ({
  id: l.id,
  d: l.d,
  style: l.style
})), null, 2)};
`;

fs.writeFileSync(path.join(dataDir, 'plotsGeometry.ts'), geometryCode, 'utf8');

console.log(`Successfully generated data with edge dimensions for ${processedPlots.length} plots and ${linePaths.length} line paths.`);
