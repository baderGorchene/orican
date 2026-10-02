# Garment models

Prepared garment meshes loaded by the 3D configurator (`lib/configurator/garment-build.ts`).

Each file is one tintable mesh: meters, Y-up, front facing +Z, white material, UVs kept
(knit texture tiles in UV units), compressed with EXT_meshopt_compression + KHR_mesh_quantization.

| File | Source | Author | License | Changes |
| --- | --- | --- | --- | --- |
| `tee-classic.glb` | [T Shirt](https://sketchfab.com/3d-models/t-shirt-c1a3e5eb9b5445f4b7d4be82f1127eba) | funlab117 | [CC BY 4.0](http://creativecommons.org/licenses/by/4.0/) | Removed viewer root rotation and hidden inner fabric layers, merged into one mesh, single neutral material, meshopt-compressed |

CC BY models must stay credited in the UI (the `credit` field in `lib/configurator/garments.ts`).

## Preparing a new garment

With [glTF-Transform](https://gltf-transform.dev) (`@gltf-transform/core`, `/functions`, `/extensions`, `meshoptimizer`):
identity root transforms → drop hidden meshes → single double-sided white material →
`flatten`, `join`, `weld`, `dedup`, `prune({ keepAttributes: true })` →
`reorder`, `quantize({ pattern: /^(POSITION|NORMAL)$/ })`, `meshopt`.
Then add a `source: 'model'` entry in `lib/configurator/garments.ts` with hotspots in garment-local meters
(the mesh is re-centered on its bounding box at load time).
