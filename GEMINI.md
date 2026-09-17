# GEMINI.md — ORICAN Project Context & Developer Guidelines

> **Project:** ORICAN Next.js 3D T-Shirt Proofing & Print Studio  
> **Repository:** `orican-next` (`orican-solutions/orican`)  
> **Framework:** Next.js 15 (App Router, React 19, TypeScript)  
> **Last Updated:** September 2026

---

## 1. Project Overview & Vision

**ORICAN** is a high-precision, production-grade 3D garment proofing web application designed to eliminate the gap between digital design files and physical screen printing or Direct-to-Garment (DTG) presses.

### Core Value Proposition
- *"Print what you actually designed"* — The application creates a live 3D bridge between customer design assets (.OBJ meshes, raster textures) and industrial print machinery.
- Real-time 3D simulation of garment drape, lighting, and placement with sub-millimeter print registration.
- Hardware-enforced print boundaries that prevent designs from extending beyond valid press areas.
- Automated extraction of high-resolution composite product mockups (JPG) and isolated native-resolution print files (PNG).

---

## 2. Tech Stack & Environment

| Layer | Technology | Details |
| :--- | :--- | :--- |
| **Framework** | Next.js 15.1.7 | App Router architecture, Server & Client Components |
| **UI Library** | React 19.0.0 | React DOM 19, modern hooks (`useRef`, `useState`, `useEffect`) |
| **Language** | TypeScript 5.7.3 | Strict typing, ES2020 target, path alias `@/*` -> `./*` |
| **Smooth Scroll** | Lenis 1.3.26 | Studio Freight/Darkroom smooth scroll (`lenis/react`), native CSS normalization |
| **3D Graphics** | Three.js 0.173.0 | Pure WebGL renderer, custom render loops, zero heavy wrapper overhead |
| **Styling** | Vanilla CSS | Custom CSS variable design system (`globals.css`), scoped `<style jsx>` |
| **Icons** | Lucide React & Iconify | `lucide-react` (0.475.0), `@iconify/react` (6.0.2), Iconify CDN script |
| **Typography** | Google Fonts | Boldonse (Titles), Inter (Body & UI) — Strict 2-font system |
| **Host OS** | Windows (PowerShell/CMD) | Note execution policy gotcha below |

---

## 3. Critical Developer Conventions & Gotchas

### ⚠️ Windows PowerShell Script Execution Policy
On Windows, executing `npm` directly in PowerShell can fail with `PSSecurityException` (`npm.ps1 cannot be loaded because running scripts is disabled on this system`).
- **Standard execution format:** Always invoke npm commands via `cmd /c`:
  ```powershell
  cmd /c "npm run dev"
  cmd /c "npm run build"
  cmd /c "npm run lint"
  ```

### ⚠️ Three.js Lifecycle & Memory Management
- Three.js requires browser-only APIs (`HTMLCanvasElement`, `window.devicePixelRatio`, `requestAnimationFrame`).
- Any component instantiating Three.js **must** have `'use client'` at the top.
- Always implement comprehensive teardown inside `useEffect` cleanup return functions:
  - Cancel animation frame (`cancelAnimationFrame(animId)`)
  - Remove all DOM and window event listeners (`pointerdown`, `pointermove`, `pointerup`, `resize`)
  - Explicitly dispose all geometries (`geo.dispose()`), materials (`mat.dispose()`), textures (`tex.dispose()`), and renderers (`renderer.dispose()`)
  - Remove DOM mask elements to prevent memory leaks and zombie render loops.

### ⚠️ No Tailwind CSS
The project deliberately uses **pure Vanilla CSS** (`app/globals.css`) with tokens, CSS custom properties, and inline/scoped styling. **Do not introduce Tailwind CSS** or Tailwind utility classes unless explicitly requested by the user.

### ⚠️ Remote Images Configuration
When adding external images via `next/image`, verify `next.config.js`. Currently allowed domains:
- `d8j0ntlcm91z4.cloudfront.net` (AWS CloudFront CDN for garment photography)

---

## 4. Repository Architecture & Directory Map

```
orican-next/
├── app/
│   ├── globals.css          # Comprehensive design system, CSS variables, utility classes, and keyframes
│   ├── layout.tsx           # Root HTML layout with Google Font preconnects, viewport, & Iconify script
│   ├── page.tsx             # Narrative landing page with 270-frame scrub parallax, multi-garment & tier showcases
│   └── studio/              # Dedicated 3D Customization Studio
│       └── page.tsx         # Full-screen 3D CAD/DAW workstation with Base/Community/Paid model browser
├── components/              # Modular UI components
│   ├── CatalogSection.tsx   # Garment blank cards with color swatches & price breakdowns
│   ├── Footer.tsx           # Studio footer with legal, typography credits, & branding
│   ├── Header.tsx           # Frosted glass sticky navigation with live press engine indicator
│   ├── HeroSection.tsx      # Dark studio hero with typography, decorative rings, & primary CTAs
│   ├── LiveStudioSection.tsx# Split section featuring real-time mini 3D shirt viewer & color switchers
│   ├── ScrutinyGallery.tsx  # 3-column macro garment scrutiny cards (weave, stitching, collar)
│   ├── StatsBar.tsx         # Metrics bar (12K+ proofs, 4.9 rating, 98% accuracy, 24h turnaround)
│   ├── StoryBanner.tsx      # Full-bleed photographic call-to-action editorial banner
│   ├── WorkflowSteps.tsx    # 3-step proofing process cards
│   └── studio/              # 3D Customization Studio modal sub-components
│       ├── ControlsPanel.tsx# Color picker, scale slider, D-pad offsets, size selector, & pricing
│       ├── ProofModal.tsx   # Top-level modal frame managing views, state, and toasts
│       ├── ResultView.tsx   # Final proof display, certificate badge, and JPG/PNG downloads
│       └── ThreeViewer.tsx  # Canvas viewport wrapper with .OBJ & image texture upload handlers
├── lib/                     # Core business logic & 3D rendering engines
│   ├── constants.ts         # Garment dimensions, SVG path data (Shirt, Hoodie, Pants, Jacket), 3D catalog
│   ├── obj-parser.ts        # Pure TypeScript Wavefront .OBJ parser with planar UV auto-generation
│   ├── three-shirt-engine.ts# Multi-garment Three.js engine with dynamic silhouette swapping & WebGL clipping
│   └── types.ts             # Shared interfaces (GarmentCategory, ModelTier, GarmentModel, ShirtViewerInstance)
├── public/
│   ├── samples/
│   │   └── sample-diamond.obj # Default 3D crest mesh for immediate user testing
│   └── video/
│       └── frame_001.jpg ... frame_270.jpg # 270-frame high-res 60fps image sequence for canvas scrub
├── types/
│   └── global.d.ts          # Global JSX type declarations (e.g. for custom <iconify-icon>)
├── next.config.js           # Next.js build configuration & image domain patterns
├── package.json             # Dependencies and build scripts
└── tsconfig.json            # Strict TypeScript configuration with @/* path aliases
```

---

## 5. Key Technical Systems Deep-Dive

### 5.1 Multi-Garment 2D-to-3D Garment Engine (`lib/three-shirt-engine.ts`)
Rather than relying on a static, rigid 3D polygon model, ORICAN uses a hybrid parametric vector-to-texture mapping approach:
1. **Dynamic Vector Silhouettes**: Silhouettes for T-Shirts (`SHIRT_PATH_D`), Hoodies (`HOODIE_PATH_D`), Pants (`PANTS_PATH_D`), and Jackets (`JACKET_PATH_D`) are dynamically drawn onto an offscreen canvas in user-selected garment colors with high-contrast outlines.
2. **On-the-Fly Garment Swapping (`setGarmentModel`)**: Switching models updates the canvas dimensions, adjusts the Three.js plane geometry aspect ratio, moves the design anchor, and recalculates GPU hardware clipping planes seamlessly without recreating the WebGL context.
3. **Hardware WebGL Clipping**: Garment-specific printable boundaries (e.g. chest print zone, thigh zone, placket offset) are locked using 4 hardware clipping planes (`THREE.Plane`). Any geometry placed outside this boundary is hardware-clipped by the GPU.
4. **DOM Viewport Mask**: Screen coordinates of the printable boundary are continuously calculated via `camera.project()`, driving 4 overlay mask bands (`.print-mask-band`) with a subtle tinted backdrop filter.

### 5.2 3D Model Asset Ecosystem & Tiers (`lib/constants.ts`, `lib/types.ts`)
Garment blanks are organized across three distinct tiers and categories:
- **Base Tier**: Production essentials included free with every print order (Heavyweight Tee, French Terry Hoodie, Relaxed Fleece Sweatpants).
- **Community Tier**: Streetwear cuts created by 3D designers (Boxy Dropped-Shoulder Tee, Vintage Pigment Crewneck, Skate Heavy Shorts).
- **Paid / Pro Tier**: Commercial CAD master meshes with multi-panel seam maps and press RIP integration profiles (Utility Cargo Pants, Technical Windbreaker, Canvas Coach Jacket).
- **Categories**: Tops, Bottoms, Outerwear.

### 5.3 Wavefront OBJ Parser & UV Generator (`lib/obj-parser.ts`)
A zero-dependency parser tailored for rapid user file processing:
- Parses vertex positions (`v`), texture coordinates (`vt`), and face indexes (`f`).
- Triangulates arbitrary n-gons into triangle fans.
- **Automatic Planar UV Generation**: When UV maps are absent, `parseOBJ` calculates the bounding box span and projects planar coordinates $(x - \min_x) / \text{span}_x$, allowing bitmap textures to seamlessly wrap onto imported 3D shapes.
- Automatically centers geometry and calculates vertex normals and bounding spheres.

### 5.4 Hero Scroll Scrubbing System (`app/page.tsx`)
The landing page hero features a sticky 270-frame canvas image scrub experience:
- Container with extended scroll height binds window scroll offset to frame sequence index $(1 \dots 270)$.
- High-performance HTML5 `<canvas>` renders each frame with progressive preloading and nearest-neighbor fallbacks for zero flicker.
- Angle-matched scroll parallax continues smoothly across sections as the user scrolls down the page.
- Synchronized multi-phase headline transitions driven by scroll progress:
  - **Phase 0 (0% – 32%)**: *"Customize like a Pro"*
  - **Phase 1 (32% – 66%)**: *"Rotate & Inspect in 360°"*
  - **Phase 2 (66% – 100%)**: *"Beyond T-Shirts: Pants, Hoodies & Jackets"*
- Interactive step-dot indicators allowing users to jump directly to specific phases.

### 5.5 Proof & Mockup Export Pipeline
The studio generates two distinct export artifacts without server-side processing:
1. **Flat 2D Composite Mockup (`exportMockupJPG`)**:
   - Composite canvas matching native garment texture resolution.
   - Renders studio backdrop + garment silhouette + design rendered within the garment print area.
   - Output: High-res JPEG (`image/jpeg`, 0.92 quality).
2. **Isolated Print-Area File (`exportPrintFileCrop`)**:
   - Crops WebGL canvas using the calculated screen projection coordinates multiplied by device pixel ratio.
   - Output: Lossless PNG (`image/png`) matching the exact bounded print file for press RIP software.

---

## 6. Architecture Status & Clean Separation

### Complete Separation of Concerns
1. **`app/page.tsx` (Landing / Storytelling)**:
   - Centered entirely around the visual introduction, 270-frame canvas scroll scrub parallax, multi-phase prompts, multi-garment showcase, and 3D model tier ecosystem teaser.
   - All interactive CTAs (`[ Enter 3D Studio &mdash; Try It Free ]`, `[ Launch 3D Studio ]`, `[ Open in 3D Studio ]`) link directly to `/studio`.
2. **`app/studio/page.tsx` (3D Studio Workstation)**:
   - Dedicated full-screen CAD/DAW experience.
   - Left panel: 3D Model asset library with Base / Community / Paid tabs, category filters (Tops / Bottoms / Outerwear), and search.
   - Center panel: Interactive WebGL 3D canvas with OrbitControls, sample model preloading, .OBJ file drop, and image texture uploads.
   - Right panel: Precision print controls (dye colors, artwork scaling slider, sub-mm D-pad offset, size pills, DTG vs Screen Print techniques, live press cost calculation, and high-res JPEG mockup & PNG print file export).

---

## 7. Color Palette & Design Tokens (60-30-10 Rule)

The studio utilizes an intentional, high-contrast **60-30-10** color distribution:
- **60% (Dominant Base - `#F0EEE6`)**: Warm natural linen for global backgrounds, garment backdrops, surfaces, and card backgrounds.
- **30% (Secondary Structural - `#6592C5`)**: Slate blue for structural borders, badges, sub-headings, frame borders, 3D print boundary tint, and step indicators.
- **10% (Focal Contrast - `#242C47`)**: Deep midnight slate for high-contrast typography, primary CTAs, active states, and grounding headers/footers.

```css
:root {
  /* 60% — Dominant Base */
  --paper:         #F0EEE6;       /* Warm natural linen backdrop */
  --paper-surface: #E8E4DA;       /* Secondary neutral surface */
  --paper-deep:    #DDD8CC;
  --white:         #FFFFFF;       /* Pure white card face */

  /* 30% — Secondary Structural */
  --blue:          #6592C5;       /* Slate blue accent */
  --blue-bright:   #7EA5D3;
  --accent-orange: #6592C5;       /* Mapped to slate blue */
  --amber:         #517AA8;
  --line:          #B0C6DC;       /* Structural tint border */

  /* 10% — Focal Contrast */
  --navy:          #242C47;       /* Midnight slate base */
  --navy-deep:     #1A2035;       /* Deepest contrast anchor */
  --ink:           #242C47;       /* High-contrast dark typography */
  --ink-soft:      #55627F;       /* Mid-contrast slate secondary text */
}
```

### Standard Garment Swatches (`lib/constants.ts`)
- **Canvas White**: `#F6F4EE` (Blank: $14.00)
- **Ink Black**: `#1B1C1E` (Blank: $14.00)
- **Undyed Natural**: `#CBA97A` (Blank: $15.00)
- **Electric Cyan**: `#00AEEF` (Blank: $16.00)
- **Process Magenta**: `#DD0072` (Blank: $16.00)
- **Fixed Print Proofing Fee**: `$14.00`

---

## 8. Development & Verification Commands

```powershell
# Install dependencies
cmd /c "npm install"

# Start development server (runs on http://localhost:3000)
cmd /c "npm run dev"

# Build production bundle and run TypeScript typecheck (Verified passing)
cmd /c "npm run build"

# ESLint validation (Note: Next.js prompts for configuration if uninitialized)
cmd /c "npm run lint"
```

