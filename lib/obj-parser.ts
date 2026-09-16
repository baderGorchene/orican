import * as THREE from 'three';

export interface ParsedOBJResult {
  geometry: THREE.BufferGeometry;
  vertexCount: number;
  faceCount: number;
  hasUVs: boolean;
}

/**
 * Minimal, robust .OBJ parser that reads vertex positions, texture coordinates,
 * and faces. If the mesh lacks UV coordinates, planar UVs are automatically generated
 * so image textures can map onto the geometry cleanly.
 */
export function parseOBJ(text: string): ParsedOBJResult {
  const vPositions: number[][] = [];
  const vUVs: number[][] = [];
  const outPositions: number[] = [];
  const outUVs: number[] = [];
  const indices: number[] = [];
  const indexMap = new Map<string, number>();
  let hasRealUVs = false;

  function getIndex(vi: number, vti: number | null): number {
    const key = `${vi}/${vti === null ? '' : vti}`;
    const cached = indexMap.get(key);
    if (cached !== undefined) return cached;

    const idx = outPositions.length / 3;
    const p = vPositions[vi] || [0, 0, 0];
    outPositions.push(p[0], p[1], p[2]);

    if (vti !== null && vUVs[vti]) {
      outUVs.push(vUVs[vti][0], vUVs[vti][1]);
    } else {
      outUVs.push(0, 0); // placeholder, filled by planar UV generator below if needed
    }

    indexMap.set(key, idx);
    return idx;
  }

  const lines = text.split(/\r?\n/);
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();
    if (line.length === 0 || line.startsWith('#')) continue;

    if (line.startsWith('v ')) {
      const p = line.split(/\s+/);
      vPositions.push([
        parseFloat(p[1]) || 0,
        parseFloat(p[2]) || 0,
        parseFloat(p[3]) || 0,
      ]);
    } else if (line.startsWith('vt ')) {
      const p = line.split(/\s+/);
      vUVs.push([
        parseFloat(p[1]) || 0,
        parseFloat(p[2] ?? '0') || 0,
      ]);
      hasRealUVs = true;
    } else if (line.startsWith('f ')) {
      const tokens = line.split(/\s+/).slice(1);
      const faceIdx: number[] = [];

      for (let j = 0; j < tokens.length; j++) {
        const bits = tokens[j].split('/');
        let vi = parseInt(bits[0], 10);
        if (isNaN(vi)) continue;
        if (vi < 0) vi = vPositions.length + vi + 1;
        vi -= 1;

        let vti: number | null = null;
        if (bits[1] && bits[1] !== '') {
          vti = parseInt(bits[1], 10);
          if (vti < 0) vti = vUVs.length + vti + 1;
          vti -= 1;
        }

        faceIdx.push(getIndex(vi, vti));
      }

      // Triangulate n-gons into triangle fan
      for (let k = 1; k < faceIdx.length - 1; k++) {
        indices.push(faceIdx[0], faceIdx[k], faceIdx[k + 1]);
      }
    }
  }

  if (outPositions.length === 0 || indices.length === 0) {
    throw new Error('No valid 3D polygon geometry found in this .obj file.');
  }

  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute(
    'position',
    new THREE.BufferAttribute(new Float32Array(outPositions), 3)
  );
  geometry.setIndex(indices);

  // Auto-generate planar UV mapping if the file has none
  if (!hasRealUVs) {
    let minX = Infinity,
      maxX = -Infinity,
      minY = Infinity,
      maxY = -Infinity;

    for (let i = 0; i < outPositions.length; i += 3) {
      const x = outPositions[i];
      const y = outPositions[i + 1];
      if (x < minX) minX = x;
      if (x > maxX) maxX = x;
      if (y < minY) minY = y;
      if (y > maxY) maxY = y;
    }

    const spanX = maxX - minX || 1;
    const spanY = maxY - minY || 1;

    for (let i = 0, u = 0; i < outPositions.length; i += 3, u += 2) {
      outUVs[u] = (outPositions[i] - minX) / spanX;
      outUVs[u + 1] = (outPositions[i + 1] - minY) / spanY;
    }
  }

  geometry.setAttribute(
    'uv',
    new THREE.BufferAttribute(new Float32Array(outUVs), 2)
  );

  geometry.center();
  geometry.computeVertexNormals();
  geometry.computeBoundingBox();
  geometry.computeBoundingSphere();

  return {
    geometry,
    vertexCount: outPositions.length / 3,
    faceCount: indices.length / 3,
    hasUVs: hasRealUVs,
  };
}
