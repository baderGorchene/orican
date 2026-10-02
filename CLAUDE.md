# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project

ORICAN is a Next.js 15 (App Router, React 19, TypeScript strict) app for 3D garment customization. It has two independent studios:

- **`/configurator` (3D Studio, default route)** — React Three Fiber + drei + three-mesh-bvh + zustand. Users print images onto a 3D garment and snap 3D hardware/uploaded `.glb` attachments to its surface; exports PNG, turntable WebM and GLB. Code in `components/configurator/` and `lib/configurator/`.
- **`/studio` (Print Proofing, legacy)** — plain imperative Three.js on a flat garment plane with a rectangular print zone; exports a mockup JPG and a print-area PNG. Code in `components/studio/`, `hooks/`, and `lib/three-shirt-engine.ts`.

The two share only `lib/constants.ts` (colors and some silhouette paths). The repo root is the Next app (the README's `cd orican-next` step is outdated).

## Commands

```bash
npm install
npm run dev      # http://localhost:3000 (root redirects to /configurator)
npm run build    # production build; also the main type-check
npx tsc --noEmit # type-check only
```

There is no test suite, and ESLint is not installed, so `npm run lint` (`next lint`) will prompt to set it up rather than lint.

## Architecture: 3D Studio (`/configurator`)

- `app/configurator/page.tsx` → `ConfiguratorClient` (dynamic import, `ssr: false`) → `ConfiguratorApp` (TopNav, Sidebar, Viewport, AdvancedDrawer, keyboard shortcuts). Styles are a CSS module (`configurator.module.css`, Poppins); don't reuse bare element selectors like `nav` — `app/globals.css` styles them globally.
- **State** — `lib/configurator/store.ts` (zustand `useStudio`). `items` are `DesignItem` (image printed as a decal) or `AccessoryItem` (rigid 3D part referenced by `assetKey`), each with a serializable `Placement` (`position`/`normal` in garment-local meters, `yaw`, `scale`, `offset`). Undo/redo snapshots `{garmentId, garmentColor, items}`: call `checkpoint()` once *before* a change (drags checkpoint lazily on first move), then mutate with `updatePlacement`/`updateItem`, which don't record history.
- **Non-serializable state lives outside the store**: Three.js assets in the `lib/configurator/assets.ts` registry (built-in hardware built lazily; uploads registered by ingestion), live renderer/scene/root/garment handles in `scene-refs.ts`, and per-pointer-move hover/drag state in `placement.ts` (`interaction`), so hover doesn't re-render React.
- **Garments** (`garments.ts`) are a union on `source`. `loadGarmentBuild()` (`garment-build.ts`) resolves either kind to a cached `GarmentBuild` (centered body geometry in meters + `MeshBVH` + `toLocal` for hotspots); `StudioScene` keeps the previous garment on screen while the next loads.
  - `source: 'model'` — a prepared `.glb` in `public/models/` (one mesh, white double-sided material, UVs in pattern mm, meshopt + quantized; see `public/models/README.md` for the glTF-Transform recipe). Quantized attributes are expanded to Float32 before baking transforms. Hotspots are garment-local meters. Fabric uses a tiling knit normal map (`knitTile` = UV units per tile). Models with a `credit` (e.g. CC BY) must stay credited — it's shown in the status bar.
  - `source: 'procedural'` — placeholders (hoodie, jacket, pants) until real models exist: each is an SVG outline (path units, y-down) + real height/depth, neck/hood opening, stitch/seam paths and hotspots; `garment-geometry.ts` inflates the outline into a closed front/back shell (distance field → thickness, noise drape folds, collar tube) and attaches a `MeshBVH`. `fabric.ts` paints a knit/stitch normal map in the garment's UV layout (front shell u∈[0,.5], back u∈[.5,1], planar in path space) and builds the `MeshPhysicalMaterial` (sheen). 
- **Mounting convention** (`surface.ts`, shared with `assets.ts`/`ingest.ts`): attachments face +Z with their base on z=0. `surfaceFrame(normal, yaw)` aligns +Z to the surface normal and +Y to garment-up projected on the tangent plane (stable yaw). `fitAttachment` raycasts the footprint corners, averages normals and lifts the part so no corner sinks. Normals come from `interpolatedNormal` (vertex normals), not face normals.
- **Decals** (`decal.ts`): the BVH `shapecast` gathers only front-facing triangles inside the projector box, then `DecalGeometry` clips that subset (fast enough for dragging). Decals are children of the garment mesh, so garment pointer handlers must use the garment's own entry in `e.intersections` (bubbled events carry the decal's face).
- **Uploads** (`components/configurator/useUploads.ts`): images are rasterized to ≤2048px PNG and placed at the center-chest hotspot; `.glb`/self-contained `.gltf` go through `ingest.ts` (15 MB, 20k triangles, textures ≤2048px, strips lights/cameras/animations, bakes transforms incl. mirrored winding, reorients the thinnest axis to Z, scales to 5 cm), then enter placement mode with a ghost preview.
- `bvh-setup.ts` patches `Mesh.prototype.raycast` with `acceleratedRaycast`; the Canvas uses `raycaster={{ firstHitOnly: true }}`.
- On garment switch `resnapItems()` re-projects items along ±Z; items landing on steep edges move to the default spot.
- Exports (`export.ts`) hide objects with `userData[NO_EXPORT]` (gizmo, ghost). PNG/video composite the CSS background (`backgrounds.ts`) under the transparent WebGL canvas; video drives the root rotation from `recordClock`.

## Architecture: Print Proofing (`/studio`, legacy)

- `app/studio/page.tsx` is a client component that owns selected model/color/size/technique state and lays out a 3-column grid of `components/studio/*` (ModelLibrary | ViewportCanvas | ControlsPanel) under StudioNavbar. It also reads `?model=<id>&color=<hex>` URL params on mount.
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

- Anything touching Three.js/`window`/`document` must be a `'use client'` module; the legacy engine is only created inside `useEffect`, and the configurator is loaded with `ssr: false`.
- The headless Chromium in cloud sessions has no GPU: WebGL runs on SwiftShader at a few FPS and Google Fonts are blocked, so judge layout, not performance or typography, from screenshots there.
- Import via the `@/*` alias (maps to repo root).
- Legacy studio styling is mostly inline `style={{}}` objects in components plus design tokens (CSS variables such as `--paper`, `--navy`, `--blue`, `--font-title`/`--font-sans`) in `app/globals.css`. Fonts are Boldonse + Inter.
- Icons use `lucide-react` and the `<iconify-icon>` web component (loaded via script in `app/layout.tsx`; JSX typing in `types/global.d.ts`).
