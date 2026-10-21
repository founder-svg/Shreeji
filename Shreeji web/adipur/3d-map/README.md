# 3D Plot Layout

An interactive real-estate and farmland plot layout website built with Next.js (App Router), React, TypeScript, Tailwind CSS, Three.js, and react-zoom-pan-pinch.

## Features

- **Layered SVG Survey Map**: High-precision parcel geometry with crisp road boundary overlays (`fills.svg` + `lines.svg`).
- **Interactive Plot Inspection**: Centered plot numbers, dynamic selection state with solid blue fill, dashed white borders, and area measurements in square meters (`m²`) and square yards (`yd²`).
- **Smooth Camera Animations**: Automated ease-in-out zoom animations to focus on selected parcels and zoom back out to default overview.
- **Availability Status Toggle**: Switch between clean default layout and real-time status color coding (Available, Sold, Builder).
- **Decoupled Data Architecture**: All plot specifications, pricing, areas, and dimensions stored in `src/data/plots.json`.
- **Search, Gallery & Info Modals**: Autocomplete plot search, project photo gallery with lightbox, masterplan info, and WhatsApp booking enquiry.
- **3D Parcel Visualization**: Three.js scene with extruded parcels, shadows, and OrbitControls.

## Getting Started

### Prerequisites
- Node.js (v18+)
- npm

### Installation

```bash
npm install
```

### Run Locally

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser.

### Build for Production

```bash
npm run build
npm run start
```
