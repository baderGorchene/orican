# ORICAN — Next.js 3D T-Shirt Proofing & Print Studio

A production-grade Next.js web application for real-time 3D garment proofing, vector-accurate garment mapping, custom 3D OBJ positioning, and high-resolution print file extraction.

## Features

- **Real-Time Three.js 3D Engine**:
  - Dynamically rendered organic vector shirt geometry (`SHIRT_PATH_D`) with crisp outlines independent of garment color.
  - Directional & ambient lighting with soft ground shadow projection.
  - True bounding box chest print area clipping via hardware WebGL clipping planes.
  - Viewport DOM mask overlay highlighting the exact printable window.
- **Custom 3D Model (.OBJ) Importer**:
  - Robust parser supporting vertices, UVs, and face triangulation.
  - Automatic planar UV coordinate generator for OBJ files lacking UV maps.
  - Auto-centering, bounding sphere radius computation, and clearance compensation.
- **Dynamic Texture Mapper**:
  - Map raster images (PNG, JPG) directly onto the 3D model with NPOT (non-power-of-two) linear filtering.
- **Live Interactive Controls**:
  - Rotate via pointer dragging.
  - Pan via middle-click drag or 4-way D-Pad nudges.
  - Scale via logarithmic curve slider (0.15x to 50x).
  - Center/reset positioning button.
  - Garment color swatches (*Canvas White*, *Ink Black*, *Undyed Natural*, *Electric Cyan*, *Process Magenta*).
  - Garment size selector (S, M, L, XL, 2XL).
- **Proof & Mockup Export Engine**:
  - **Flat 2D Composite Mockup**: High-res flat garment shot with the design composited into the chest print window (JPG).
  - **Isolated Print-Area File**: Exact bounded pixel crop of the print area at native renderer resolution (PNG).
- **Cinematic Landing Page**:
  - Interactive Dark Studio hero with typography and glow effects.
  - Real-time embedded Mini 3D shirt viewer with live color switching.
  - Credibility metrics (12K+ proofs, 4.9 rating, 98% accuracy, 24h turnaround).
  - Macro garment scrutiny gallery (weave, seams, collar).
  - Blank catalog cards with direct customizer triggers.
  - 3-step proofing workflow guide.
  - Editorial banner & clean responsive footer.

## Quick Start

```bash
cd orican-next
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) to view the application.

## Tech Stack

- **Framework**: Next.js 15 (App Router, React 19, TypeScript)
- **3D Graphics**: Three.js
- **Icons**: Lucide React
- **Styling**: Vanilla CSS with curated dark palette & glassmorphism
