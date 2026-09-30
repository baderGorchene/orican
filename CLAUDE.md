# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project

ORICAN is a Next.js 15 (App Router, React 19, TypeScript strict) app for 3D garment proofing: users pick a garment model, place a 3D design (OBJ mesh, optionally textured with a PNG/JPG) inside the garment's print zone, and export a flat mockup JPG and a print-area PNG. Rendering is plain Three.js (no react-three-fiber). The repo root is the Next app (the README's `cd orican-next` step is outdated).

## Commands

```bash
npm install
npm run dev      # http://localhost:3000 (root redirects to /studio)
npm run build    # production build; also the main type-check
npx tsc --noEmit # type-check only
```

There is no test suite, and ESLint is not installed, so `npm run lint` (`next lint`) will prompt to set it up rather than lint.

## Architecture

- `app/page.tsx` just redirects to `/studio` (the landing page was removed on `staging`). `app/studio/page.tsx` is the only real page: a client component that owns selected model/color/size/technique state and lays out a 3-column grid of `components/studio/*` (ModelLibrary | ViewportCanvas | ControlsPanel) under StudioNavbar. It also reads `?model=<id>&color=<hex>` URL params on mount.
- `hooks/useGarmentViewer.ts` bridges React and the imperative engine: it creates the viewer once from `canvasRef`/`containerRef`, holds it in a ref, loads `public/samples/sample-diamond.obj` as the default design (octahedron fallback), and exposes handlers for color/model/scale/move/reset, OBJ and texture file uploads, and exports (data-URL → anchor download). UI state like `scaleValue` and toasts lives here, not in the engine.
- `hooks/useStudioFilters.ts` filters `GARMENT_MODELS` by search/tier/category.
- `lib/three-shirt-engine.ts` — `createGarmentViewer(canvas, opts)` returns a `ShirtViewerInstance` (interface in `lib/types.ts`); all Three.js state is closure-local. Key mechanics:
  - The garment is a flat `PlaneGeometry` textured by a 2D canvas that draws the model's SVG `silhouettePath` (`drawGarment`), so recoloring/switching models redraws the canvas, not geometry.
  - The design mesh hangs off a `designAnchor` positioned at `printZone.center + offset`; offsets are clamped to the print-zone half extents.
  - The print zone is enforced two ways: WebGL local clipping planes on the design material (`makePrintAreaClipTemplates`), and four DOM "mask bands" appended to `maskContainer` and repositioned each frame from the projected screen rect.
  - Exports spin up separate temporary `WebGLRenderer`s on offscreen canvases and render a clone of the design mesh; the main renderer uses `preserveDrawingBuffer` when `exportable`.
  - `destroy()` must dispose everything and remove window listeners; keep it in sync when adding resources/listeners.
  - Legacy aliases (`drawShirt`, `makeShirtTexture`, `createShirtViewer`) still exist.
- `lib/constants.ts` is the data catalog: SVG silhouette paths + their `pathSize`, `STANDARD_COLORS`, `PRINT_FEE`, and `GARMENT_MODELS` (each with `planeWidth/Height` and a `printZone` of `wFrac`/`hFrac` fractions of the plane plus a local `center`). Adding a garment = adding an entry here; the engine derives clip planes and limits from it.
- `lib/obj-parser.ts` — custom `parseOBJ` (vertices, UVs, face triangulation, planar UV generation when missing) returning a `BufferGeometry`.

## Conventions

- Anything touching Three.js/`window` must be a `'use client'` module; the engine is only created inside `useEffect`.
- Import via the `@/*` alias (maps to repo root).
- Styling is mostly inline `style={{}}` objects in components plus design tokens (CSS variables such as `--paper`, `--navy`, `--blue`, `--font-title`/`--font-sans`) in `app/globals.css`. Fonts are Boldonse + Inter.
- Icons use `lucide-react` and the `<iconify-icon>` web component (loaded via script in `app/layout.tsx`; JSX typing in `types/global.d.ts`).
