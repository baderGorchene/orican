'use client';

import React, { useEffect, useRef } from 'react';
import * as THREE from 'three';

/* ============================================================
   Shirt texture — vector shape traced into canvas
   ============================================================ */
const PLANE_WIDTH = 3.1, PLANE_HEIGHT = 3.875;
const PRINT_SIZE = { wFrac: 0.30, hFrac: 0.26 };
const PRINT_HALF_W = (PRINT_SIZE.wFrac * PLANE_WIDTH) / 2;
const PRINT_HALF_H = (PRINT_SIZE.hFrac * PLANE_HEIGHT) / 2;
const PRINT_BASE_CENTER = { x: 0, y: 0.29 };
const MOVE_LIMITS = { x: PRINT_HALF_W - 0.05, y: PRINT_HALF_H - 0.05 };
const MOVE_STEP = 0.16;

function makePrintAreaClipTemplates(centerLocal: { x: number; y: number }) {
  const left = centerLocal.x - PRINT_HALF_W;
  const right = centerLocal.x + PRINT_HALF_W;
  const top = centerLocal.y + PRINT_HALF_H;
  const bottom = centerLocal.y - PRINT_HALF_H;
  return [
    new THREE.Plane(new THREE.Vector3(1, 0, 0), -left),
    new THREE.Plane(new THREE.Vector3(-1, 0, 0), right),
    new THREE.Plane(new THREE.Vector3(0, -1, 0), top),
    new THREE.Plane(new THREE.Vector3(0, 1, 0), -bottom),
  ];
}

const SHIRT_PATH_D =
  "M 121.8,23.38 C 96.7,36.08 74.5,47.88 72.4,49.58 C 66.2,54.58 62.9,60.38 30.6,122.68 L 0,181.88 L 0,192.58 L 0,203.28 L 4.2,207.28 C 7.5,210.38 20.3,216.98 58.5,235.38 L 108.5,259.58 L 109,372.48 C 109.5,484.78 109.5,485.48 111.6,490.08 C 114.3,495.88 119.3,501.58 124.9,505.18 L 129.4,507.98 L 254,507.98 L 378.6,507.98 L 383.1,505.18 C 388.7,501.58 393.7,495.88 396.4,490.08 C 398.5,485.48 398.5,484.78 399,372.58 L 399.5,259.58 L 449.5,235.48 C 487.9,216.88 500.5,210.38 503.8,207.28 L 508,203.28 L 508,192.58 L 508,181.88 L 477.3,122.68 C 444.8,59.88 441.9,54.68 436.1,49.88 C 434.1,48.28 411.6,36.38 386,23.48 L 339.5,-0.02 L 326.9,-0.02 C 319.9,-0.02 311.9,0.48 308.9,0.98 C 277.3,6.98 241.1,7.28 205.6,1.98 C 197.2,0.68 188.3,0.08 180.1,0.08 L 167.5,0.28 L 121.8,23.38 Z";
const SHIRT_PATH_SIZE = { w: 508, h: 507.98 };

function drawShirt(ctx: CanvasRenderingContext2D, w: number, h: number, color: string) {
  ctx.clearRect(0, 0, w, h);
  const scale = Math.min((w * 0.94) / SHIRT_PATH_SIZE.w, (h * 0.94) / SHIRT_PATH_SIZE.h);
  const dw = SHIRT_PATH_SIZE.w * scale, dh = SHIRT_PATH_SIZE.h * scale;
  const dx = (w - dw) / 2, dy = (h - dh) / 2;

  ctx.save();
  ctx.translate(dx, dy);
  ctx.scale(scale, scale);
  const path = new Path2D(SHIRT_PATH_D);
  ctx.fillStyle = color;
  ctx.fill(path);

  ctx.lineJoin = 'round';
  ctx.lineWidth = Math.max(0.5, (w * 0.005) / scale);
  ctx.strokeStyle = '#000000';
  ctx.stroke(path);
  ctx.restore();
}

function makeShirtTexture(color: string) {
  const c = document.createElement('canvas');
  c.width = 512; c.height = 640;
  const ctx = c.getContext('2d')!;
  drawShirt(ctx, c.width, c.height, color);
  const tex = new THREE.CanvasTexture(c);
  tex.needsUpdate = true;
  return { tex, canvas: c, ctx };
}

function parseOBJ(text: string) {
  const vPositions: number[][] = [];
  const vUVs: number[][] = [];
  const outPositions: number[] = [];
  const outUVs: number[] = [];
  const indices: number[] = [];
  const indexMap = new Map<string, number>();
  let hasRealUVs = false;

  function getIndex(vi: number, vti: number | null) {
    const key = vi + '/' + (vti === null ? '' : vti);
    let idx = indexMap.get(key);
    if (idx !== undefined) return idx;
    idx = outPositions.length / 3;
    const p = vPositions[vi] || [0, 0, 0];
    outPositions.push(p[0], p[1], p[2]);
    if (vti !== null && vUVs[vti]) {
      outUVs.push(vUVs[vti][0], vUVs[vti][1]);
    } else {
      outUVs.push(0, 0);
    }
    indexMap.set(key, idx);
    return idx;
  }

  const lines = text.split('\n');
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();
    if (line.startsWith('v ')) {
      const p = line.split(/\s+/);
      vPositions.push([parseFloat(p[1]), parseFloat(p[2]), parseFloat(p[3])]);
    } else if (line.startsWith('vt ')) {
      const p = line.split(/\s+/);
      vUVs.push([parseFloat(p[1]), parseFloat(p[2] ?? 0)]);
      hasRealUVs = true;
    } else if (line.startsWith('f ')) {
      const tokens = line.split(/\s+/).slice(1);
      const faceIdx = tokens.map((tok) => {
        const bits = tok.split('/');
        let vi = parseInt(bits[0], 10);
        if (vi < 0) vi = vPositions.length + vi + 1;
        vi -= 1;
        let vti: number | null = null;
        if (bits[1] && bits[1] !== '') {
          vti = parseInt(bits[1], 10);
          if (vti < 0) vti = vUVs.length + vti + 1;
          vti -= 1;
        }
        return getIndex(vi, vti);
      });
      for (let k = 1; k < faceIdx.length - 1; k++) {
        indices.push(faceIdx[0], faceIdx[k], faceIdx[k + 1]);
      }
    }
  }

  if (outPositions.length === 0 || indices.length === 0) {
    throw new Error('No readable geometry found in this .obj');
  }

  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute('position', new THREE.BufferAttribute(new Float32Array(outPositions), 3));
  geometry.setIndex(indices);

  if (!hasRealUVs) {
    let minX = Infinity, maxX = -Infinity, minY = Infinity, maxY = -Infinity;
    for (let i = 0; i < outPositions.length; i += 3) {
      const x = outPositions[i], y = outPositions[i + 1];
      if (x < minX) minX = x; if (x > maxX) maxX = x;
      if (y < minY) minY = y; if (y > maxY) maxY = y;
    }
    const spanX = maxX - minX || 1, spanY = maxY - minY || 1;
    for (let i = 0, u = 0; i < outPositions.length; i += 3, u += 2) {
      outUVs[u] = (outPositions[i] - minX) / spanX;
      outUVs[u + 1] = (outPositions[i + 1] - minY) / spanY;
    }
  }
  geometry.setAttribute('uv', new THREE.BufferAttribute(new Float32Array(outUVs), 2));
  geometry.computeVertexNormals();
  return geometry;
}

function centerGeometry(geometry: THREE.BufferGeometry) {
  geometry.center();
  geometry.computeBoundingBox();
  geometry.computeBoundingSphere();
}

function createViewer(canvasEl: HTMLCanvasElement, opts?: { color?: string; exportable?: boolean }) {
  opts = opts || {};
  const renderer = new THREE.WebGLRenderer({
    canvas: canvasEl,
    antialias: true,
    alpha: true,
    preserveDrawingBuffer: !!opts.exportable,
  });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  renderer.localClippingEnabled = true;

  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(32, 1, 0.1, 100);
  camera.position.set(0, 0, 6.2);

  scene.add(new THREE.AmbientLight(0xffffff, 0.75));
  const keyLight = new THREE.DirectionalLight(0xffffff, 0.9);
  keyLight.position.set(2.5, 3, 4);
  scene.add(keyLight);
  const fillLight = new THREE.DirectionalLight(0xffffff, 0.35);
  fillLight.position.set(-3, -1, 2);
  scene.add(fillLight);

  const state = {
    color: opts.color || '#F6F4EE',
    designMesh: null as THREE.Mesh | null,
    designSphereRadius: 0,
    designBaseScale: 1,
    designMultiplier: 1,
    designMinMultiplier: 0.15,
    designMaxMultiplier: 50,
    offsetX: 0,
    offsetY: 0,
    pendingTextureImg: null as HTMLImageElement | null,
  };

  const shirtData = makeShirtTexture(state.color);
  const geo = new THREE.PlaneGeometry(3.1, 3.875);
  const shirtMat = new THREE.MeshBasicMaterial({ map: shirtData.tex, transparent: true });
  const shirtMesh = new THREE.Mesh(geo, shirtMat);
  scene.add(shirtMesh);

  const designAnchor = new THREE.Object3D();
  designAnchor.position.set(PRINT_BASE_CENTER.x, PRINT_BASE_CENTER.y, 0.12);
  designAnchor.rotation.x = -0.08;
  scene.add(designAnchor);

  const clipPlanes = makePrintAreaClipTemplates(PRINT_BASE_CENTER);

  function updateAnchorTransform() {
    const clearanceRadius = state.designMesh
      ? state.designSphereRadius * state.designBaseScale * state.designMultiplier
      : 0;
    designAnchor.position.set(
      PRINT_BASE_CENTER.x + state.offsetX,
      PRINT_BASE_CENTER.y + state.offsetY,
      0.02 + clearanceRadius + 0.06
    );
  }

  function applyOffset(dxLocal: number, dyLocal: number) {
    state.offsetX = Math.max(-MOVE_LIMITS.x, Math.min(MOVE_LIMITS.x, state.offsetX + dxLocal));
    state.offsetY = Math.max(-MOVE_LIMITS.y, Math.min(MOVE_LIMITS.y, state.offsetY + dyLocal));
    updateAnchorTransform();
  }

  const shadowCanvas = document.createElement('canvas');
  shadowCanvas.width = 256; shadowCanvas.height = 128;
  const sctx = shadowCanvas.getContext('2d')!;
  const rg = sctx.createRadialGradient(128, 64, 10, 128, 64, 120);
  rg.addColorStop(0, 'rgba(0,0,0,0.18)');
  rg.addColorStop(1, 'rgba(0,0,0,0)');
  sctx.fillStyle = rg;
  sctx.fillRect(0, 0, 256, 128);
  const shadowTex = new THREE.CanvasTexture(shadowCanvas);
  const shadowMesh = new THREE.Mesh(
    new THREE.PlaneGeometry(3.6, 1.8),
    new THREE.MeshBasicMaterial({ map: shadowTex, transparent: true })
  );
  shadowMesh.rotation.x = -Math.PI / 2;
  shadowMesh.position.y = -2.05;
  scene.add(shadowMesh);

  const maskContainer = canvasEl.parentElement!;
  const maskBands: Record<string, HTMLDivElement> = {};
  ['top', 'bottom', 'left', 'right'].forEach((key) => {
    const band = document.createElement('div');
    band.className = 'print-mask-band';
    maskContainer.appendChild(band);
    maskBands[key] = band;
  });

  function computeScreenRect(w: number, h: number) {
    camera.updateMatrixWorld();
    const half = new THREE.Vector3(PRINT_BASE_CENTER.x + PRINT_HALF_W, PRINT_BASE_CENTER.y + PRINT_HALF_H, 0.02);
    const other = new THREE.Vector3(PRINT_BASE_CENTER.x - PRINT_HALF_W, PRINT_BASE_CENTER.y - PRINT_HALF_H, 0.02);
    half.project(camera);
    other.project(camera);
    const x1 = ((half.x + 1) / 2) * w, x2 = ((other.x + 1) / 2) * w;
    const y1 = ((1 - half.y) / 2) * h, y2 = ((1 - other.y) / 2) * h;
    return {
      left: Math.min(x1, x2), right: Math.max(x1, x2),
      top: Math.min(y1, y2), bottom: Math.max(y1, y2),
    };
  }

  function updateMask(w: number, h: number) {
    const rect = computeScreenRect(w, h);
    const { left, right, top, bottom } = rect;
    maskBands.top.style.cssText = `left:0px;top:0px;width:${w}px;height:${Math.max(0, top)}px;`;
    maskBands.bottom.style.cssText = `left:0px;top:${bottom}px;width:${w}px;height:${Math.max(0, h - bottom)}px;`;
    maskBands.left.style.cssText = `left:0px;top:${top}px;width:${Math.max(0, left)}px;height:${Math.max(0, bottom - top)}px;`;
    maskBands.right.style.cssText = `left:${right}px;top:${top}px;width:${Math.max(0, w - right)}px;height:${Math.max(0, bottom - top)}px;`;
  }

  function renderPrintAreaCropCanvas() {
    renderer.render(scene, camera);
    const w = canvasEl.clientWidth, h = canvasEl.clientHeight;
    const rect = computeScreenRect(w, h);
    const ratio = renderer.getPixelRatio();
    const sx = rect.left * ratio, sy = rect.top * ratio;
    const sw = Math.max(1, (rect.right - rect.left) * ratio);
    const sh = Math.max(1, (rect.bottom - rect.top) * ratio);
    const c = document.createElement('canvas');
    c.width = Math.round(sw); c.height = Math.round(sh);
    c.getContext('2d')!.drawImage(renderer.domElement, sx, sy, sw, sh, 0, 0, c.width, c.height);
    return c;
  }

  function renderFlatMockupCanvas() {
    const W = shirtData.canvas.width, H = shirtData.canvas.height;
    const out = document.createElement('canvas');
    out.width = W; out.height = H;
    const octx = out.getContext('2d')!;
    octx.fillStyle = '#FFFFFF';
    octx.fillRect(0, 0, W, H);
    octx.drawImage(shirtData.canvas, 0, 0);
    if (state.designMesh) {
      const cropCanvas = renderPrintAreaCropCanvas();
      const fracCenterX = 0.5 + PRINT_BASE_CENTER.x / PLANE_WIDTH;
      const fracCenterY = 0.5 - PRINT_BASE_CENTER.y / PLANE_HEIGHT;
      const pw = PRINT_SIZE.wFrac * W, ph = PRINT_SIZE.hFrac * H;
      const px = fracCenterX * W - pw / 2, py = fracCenterY * H - ph / 2;
      octx.drawImage(cropCanvas, px, py, pw, ph);
    }
    return out;
  }

  let lastW = 0, lastH = 0;
  function resize() {
    const w = canvasEl.clientWidth, h = canvasEl.clientHeight;
    if (w === 0 || h === 0 || (w === lastW && h === lastH)) return;
    lastW = w; lastH = h;
    renderer.setSize(w, h, false);
    camera.aspect = w / h;
    camera.updateProjectionMatrix();
    updateMask(w, h);
  }

  function redraw() {
    drawShirt(shirtData.ctx, shirtData.canvas.width, shirtData.canvas.height, state.color);
    shirtData.tex.needsUpdate = true;
  }

  const raycaster = new THREE.Raycaster();
  const mouseVec = new THREE.Vector2();
  let objectDrag = false, panDrag = false, lastX = 0, lastY = 0;

  function hitDesignMesh(clientX: number, clientY: number) {
    if (!state.designMesh) return false;
    const rect = canvasEl.getBoundingClientRect();
    mouseVec.x = ((clientX - rect.left) / rect.width) * 2 - 1;
    mouseVec.y = -((clientY - rect.top) / rect.height) * 2 + 1;
    raycaster.setFromCamera(mouseVec, camera);
    return raycaster.intersectObject(state.designMesh).length > 0;
  }

  canvasEl.addEventListener('pointerdown', (e) => {
    if (e.button === 1) {
      e.preventDefault();
      panDrag = true;
      lastX = e.clientX; lastY = e.clientY;
      canvasEl.style.cursor = 'move';
      return;
    }
    if (hitDesignMesh(e.clientX, e.clientY)) {
      objectDrag = true;
      lastX = e.clientX; lastY = e.clientY;
      canvasEl.style.cursor = 'grabbing';
    }
  });
  canvasEl.addEventListener('auxclick', (e) => { if (e.button === 1) e.preventDefault(); });
  window.addEventListener('pointermove', (e) => {
    if (panDrag) {
      const rect = canvasEl.getBoundingClientRect();
      const dxLocal = (e.clientX - lastX) * (PLANE_WIDTH / rect.width);
      const dyLocal = -(e.clientY - lastY) * (PLANE_HEIGHT / rect.height);
      lastX = e.clientX; lastY = e.clientY;
      applyOffset(dxLocal, dyLocal);
      return;
    }
    if (!objectDrag || !state.designMesh) return;
    const dx = e.clientX - lastX, dy = e.clientY - lastY;
    state.designMesh.rotation.y += dx * 0.012;
    state.designMesh.rotation.x += dy * 0.012;
    lastX = e.clientX; lastY = e.clientY;
  });
  window.addEventListener('pointerup', () => {
    if (objectDrag || panDrag) canvasEl.style.cursor = 'grab';
    objectDrag = false;
    panDrag = false;
  });

  let isDestroyed = false;
  let animId: number;
  function animate() {
    if (isDestroyed) return;
    animId = requestAnimationFrame(animate);
    resize();
    renderer.render(scene, camera);
  }
  animate();
  window.addEventListener('resize', resize);
  setTimeout(resize, 50);

  function applyTextureToMesh(img: HTMLImageElement) {
    if (!state.designMesh) return;
    const tex = new THREE.Texture(img);
    tex.wrapS = THREE.ClampToEdgeWrapping;
    tex.wrapT = THREE.ClampToEdgeWrapping;
    tex.generateMipmaps = false;
    tex.minFilter = THREE.LinearFilter;
    tex.magFilter = THREE.LinearFilter;
    tex.needsUpdate = true;
    (state.designMesh.material as THREE.MeshStandardMaterial).map = tex;
    (state.designMesh.material as THREE.MeshStandardMaterial).color.set('#ffffff');
    (state.designMesh.material as THREE.MeshStandardMaterial).needsUpdate = true;
  }

  return {
    setColor(c: string) { state.color = c; redraw(); },
    setDesignGeometry(geometry: THREE.BufferGeometry, color?: string) {
      if (state.designMesh) {
        designAnchor.remove(state.designMesh);
        state.designMesh.geometry.dispose();
        (state.designMesh.material as THREE.Material).dispose();
      }
      centerGeometry(geometry);
      const size = new THREE.Vector3();
      geometry.boundingBox!.getSize(size);
      const maxDim = Math.max(size.x, size.y, size.z) || 1;
      const initialScale = 0.82 / maxDim;

      const mat = new THREE.MeshStandardMaterial({
        color: color || '#DD0072', roughness: 0.5, metalness: 0.08,
        clippingPlanes: clipPlanes, clipShadows: true, side: THREE.DoubleSide,
      });
      const mesh = new THREE.Mesh(geometry, mat);
      mesh.scale.setScalar(initialScale);
      designAnchor.add(mesh);

      state.designMesh = mesh;
      state.designBaseScale = initialScale;
      state.designMultiplier = 1;
      state.designSphereRadius = geometry.boundingSphere!.radius;
      updateAnchorTransform();

      if (state.pendingTextureImg) applyTextureToMesh(state.pendingTextureImg);
    },
    setDesignSize(t: number) {
      if (!state.designMesh) return;
      const clampedT = Math.max(0, Math.min(1, t));
      const mult = state.designMinMultiplier * Math.pow(state.designMaxMultiplier / state.designMinMultiplier, clampedT);
      state.designMultiplier = mult;
      state.designMesh.scale.setScalar(state.designBaseScale * mult);
      updateAnchorTransform();
    },
    moveDesign(dx: number, dy: number) { applyOffset(dx * MOVE_STEP, dy * MOVE_STEP); },
    panDesign(dxLocal: number, dyLocal: number) { applyOffset(dxLocal, dyLocal); },
    resetPosition() { state.offsetX = 0; state.offsetY = 0; updateAnchorTransform(); },
    setDesignTexture(img: HTMLImageElement) {
      state.pendingTextureImg = img;
      if (state.designMesh) applyTextureToMesh(img);
    },
    exportMockupJPG() { return renderFlatMockupCanvas().toDataURL('image/jpeg', 0.92); },
    exportPrintFileCrop() { return renderPrintAreaCropCanvas().toDataURL('image/png'); },
    resize,
    destroy() {
      isDestroyed = true;
      cancelAnimationFrame(animId);
      window.removeEventListener('resize', resize);
      Object.values(maskBands).forEach((b) => b.remove());
      renderer.dispose();
    },
  };
}

export default function Home() {
  const miniCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const mainCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const scrubWrapRef = useRef<HTMLDivElement | null>(null);
  const stageRef = useRef<HTMLElement | null>(null);

  const miniViewerRef = useRef<ReturnType<typeof createViewer> | null>(null);
  const mainViewerRef = useRef<ReturnType<typeof createViewer> | null>(null);

  const stageStateRef = useRef({ color: '#F6F4EE', name: 'Canvas White' });

  useEffect(() => {
    if (!miniCanvasRef.current || !mainCanvasRef.current) return;

    const miniViewer = createViewer(miniCanvasRef.current, { color: '#F6F4EE' });
    const mainViewer = createViewer(mainCanvasRef.current, { color: '#F6F4EE', exportable: true });
    miniViewerRef.current = miniViewer;
    mainViewerRef.current = mainViewer;

    // Toast helper
    const toast = document.getElementById('toast')!;
    let toastTimeout: NodeJS.Timeout;
    function showToast(msg: string, ms = 1800) {
      toast.textContent = msg;
      toast.classList.add('show');
      clearTimeout(toastTimeout);
      toastTimeout = setTimeout(() => toast.classList.remove('show'), ms);
    }

    const overlay = document.getElementById('overlay')!;
    const frameEl = document.querySelector('.frame')!;
    const sizeSlider = document.getElementById('sizeSlider') as HTMLInputElement;
    let mockupDataUrl = '', cropDataUrl = '';

    function downloadDataUrl(dataUrl: string, filename: string) {
      const link = document.createElement('a');
      link.href = dataUrl;
      link.download = filename;
      link.click();
    }

    const nextBtn = document.getElementById('nextBtn')!;
    const backToEditorBtn = document.getElementById('backToEditorBtn')!;
    const closeResult = document.getElementById('closeResult')!;
    const downloadMockupBtn = document.getElementById('downloadMockupBtn')!;
    const downloadCropBtn = document.getElementById('downloadCropBtn')!;

    const onNext = () => {
      mockupDataUrl = mainViewer.exportMockupJPG();
      cropDataUrl = mainViewer.exportPrintFileCrop();
      (document.getElementById('mockupImg') as HTMLImageElement).src = mockupDataUrl;
      (document.getElementById('cropImg') as HTMLImageElement).src = cropDataUrl;
      frameEl.classList.add('showing-result');
    };
    const onBack = () => frameEl.classList.remove('showing-result');
    const onDownloadMockup = () => {
      downloadDataUrl(mockupDataUrl, 'shirt-mockup.jpg');
      showToast('Mockup saved', 1600);
    };
    const onDownloadCrop = () => {
      downloadDataUrl(cropDataUrl, 'print-file.png');
      showToast('Print file saved', 1600);
    };

    nextBtn.addEventListener('click', onNext);
    backToEditorBtn.addEventListener('click', onBack);
    closeResult.addEventListener('click', onBack);
    downloadMockupBtn.addEventListener('click', onDownloadMockup);
    downloadCropBtn.addEventListener('click', onDownloadCrop);

    const onSizeInput = () => {
      const val = parseFloat(sizeSlider.value) / 100;
      mainViewer.setDesignSize(val);
      miniViewer.setDesignSize(val);
    };
    sizeSlider.addEventListener('input', onSizeInput);

    const dpadButtons = document.querySelectorAll('.dpad button[data-dx]');
    const onDpadClick = (btn: Element) => {
      const dx = +btn.getAttribute('data-dx')!, dy = +btn.getAttribute('data-dy')!;
      mainViewer.moveDesign(dx, dy);
      miniViewer.moveDesign(dx, dy);
    };
    dpadButtons.forEach((b) => b.addEventListener('click', () => onDpadClick(b)));

    const resetPosBtn = document.getElementById('resetPosBtn')!;
    const onReset = () => {
      mainViewer.resetPosition();
      miniViewer.resetPosition();
    };
    resetPosBtn.addEventListener('click', onReset);

    function openFrame(color?: string, name?: string) {
      overlay.classList.add('open');
      if (color) mainViewer.setColor(color);
      if (name) document.getElementById('productName')!.textContent = name;
      setTimeout(() => mainViewer.resize(), 60);
    }

    const stageCustomize = document.getElementById('stageCustomize');
    const storyCustomize = document.getElementById('storyCustomize');
    const thirdCustomize = document.getElementById('thirdCustomize');
    const onStageCustom = () => openFrame(stageStateRef.current.color, stageStateRef.current.name);

    stageCustomize?.addEventListener('click', onStageCustom);
    storyCustomize?.addEventListener('click', onStageCustom);
    thirdCustomize?.addEventListener('click', onStageCustom);

    const openFrameBtns = document.querySelectorAll('.openFrame');
    openFrameBtns.forEach((btn) => {
      btn.addEventListener('click', () => {
        const color = btn.getAttribute('data-color') || undefined;
        const name = btn.closest('.card')?.querySelector('.name')?.textContent || undefined;
        openFrame(color, name);
        document.querySelectorAll('#colorPicker .dot').forEach((d) =>
          d.classList.toggle('active', d.getAttribute('data-color') === color)
        );
      });
    });

    const closeFrame = document.getElementById('closeFrame')!;
    const onCloseFrame = () => {
      overlay.classList.remove('open');
      frameEl.classList.remove('showing-result');
    };
    closeFrame.addEventListener('click', onCloseFrame);

    const onOverlayClick = (e: MouseEvent) => {
      if (e.target === overlay) {
        overlay.classList.remove('open');
      }
    };
    overlay.addEventListener('click', onOverlayClick);

    // Modal color picker
    const modalDots = document.querySelectorAll('#colorPicker .dot');
    modalDots.forEach((dot) => {
      dot.addEventListener('click', () => {
        modalDots.forEach((d) => d.classList.remove('active'));
        dot.classList.add('active');
        const c = dot.getAttribute('data-color')!;
        mainViewer.setColor(c);
        miniViewer.setColor(c);
      });
    });

    // Size pills
    const sizePills = document.querySelectorAll('#sizePicker .size-pill');
    sizePills.forEach((p) => {
      p.addEventListener('click', () => {
        sizePills.forEach((x) => x.classList.remove('active'));
        p.classList.add('active');
      });
    });

    // Upload OBJ
    const fileInput = document.getElementById('fileInput') as HTMLInputElement;
    const uploadBtn = document.getElementById('uploadBtn')!;
    uploadBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      fileInput.click();
    });
    fileInput.addEventListener('click', (e) => e.stopPropagation());
    fileInput.addEventListener('change', (e: any) => {
      const file = e.target.files[0];
      if (!file) return;
      const reader = new FileReader();
      reader.onload = (ev) => {
        try {
          const geometry = parseOBJ(ev.target?.result as string);
          mainViewer.setDesignGeometry(geometry.clone());
          miniViewer.setDesignGeometry(geometry.clone());
          showToast('3D design placed on proof', 1800);
        } catch (err) {
          showToast("Couldn't read that .obj — try a simpler export", 2400);
        }
      };
      reader.readAsText(file);
    });

    // Upload Texture
    const textureInput = document.getElementById('textureInput') as HTMLInputElement;
    const textureBtn = document.getElementById('textureBtn')!;
    textureBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      textureInput.click();
    });
    textureInput.addEventListener('click', (e) => e.stopPropagation());
    textureInput.addEventListener('change', (e: any) => {
      const file = e.target.files[0];
      if (!file) return;
      const img = new Image();
      img.onload = () => {
        mainViewer.setDesignTexture(img);
        miniViewer.setDesignTexture(img);
        showToast('Texture applied to design', 1800);
      };
      img.onerror = () => showToast("Couldn't read that image", 2000);
      img.src = URL.createObjectURL(file);
    });

    // Hero color picker
    const heroDots = document.querySelectorAll('#heroColorPicker .dot');
    heroDots.forEach((dot) => {
      dot.addEventListener('click', () => {
        heroDots.forEach((d: any) => { d.style.borderColor = 'transparent'; });
        (dot as HTMLElement).style.borderColor = '#fff';
        const color = dot.getAttribute('data-color')!, name = dot.getAttribute('data-name')!;
        stageStateRef.current.color = color;
        stageStateRef.current.name = name;
        miniViewer.setColor(color);
      });
    });

    // Hero scroll scrub
    const wrap = scrubWrapRef.current;
    const video = videoRef.current;

    let ready = false;
    let ticking = false;

    function onScroll() {
      if (!wrap || !video || ticking) return;
      ticking = true;
      requestAnimationFrame(() => {
        const rect = wrap.getBoundingClientRect();
        const scrollable = wrap.offsetHeight - window.innerHeight;
        const progress = scrollable > 0 ? Math.min(1, Math.max(0, -rect.top / scrollable)) : 0;
        const dur = (video.duration && !isNaN(video.duration) && video.duration > 0) ? video.duration : 5.042;
        const t = progress * dur;
        if (isFinite(t)) {
          video.currentTime = t;
        }

        // Multi-phase text transitions driven by scroll progress
        // Phase 0: 0.00 to 0.32
        // Phase 1: 0.32 to 0.66
        // Phase 2: 0.66 to 1.00
        let activeIdx = 0;
        if (progress >= 0.66) {
          activeIdx = 2;
        } else if (progress >= 0.32) {
          activeIdx = 1;
        } else {
          activeIdx = 0;
        }

        const stepEls = [
          document.getElementById('stageStep0'),
          document.getElementById('stageStep1'),
          document.getElementById('stageStep2'),
        ];
        const indicatorDots = document.querySelectorAll('.stage-step-indicators .step-dot');

        stepEls.forEach((el, idx) => {
          if (!el) return;
          if (idx === activeIdx) {
            el.classList.add('active');
            el.classList.remove('exit');
          } else if (idx < activeIdx) {
            el.classList.remove('active');
            el.classList.add('exit');
          } else {
            el.classList.remove('active');
            el.classList.remove('exit');
          }
        });

        indicatorDots.forEach((dot, idx) => {
          dot.classList.toggle('active', idx === activeIdx);
        });

        ticking = false;
      });
    }

    const indicatorDots = document.querySelectorAll('.stage-step-indicators .step-dot');
    indicatorDots.forEach((dot) => {
      dot.addEventListener('click', () => {
        const stepTarget = parseInt(dot.getAttribute('data-step') || '0', 10);
        if (!wrap) return;
        const scrollable = wrap.offsetHeight - window.innerHeight;
        const targetRatios = [0.06, 0.46, 0.82];
        const targetScroll = wrap.offsetTop + scrollable * targetRatios[stepTarget];
        window.scrollTo({ top: targetScroll, behavior: 'smooth' });
      });
    });

    if (video) {
      video.muted = true;
      video.defaultMuted = true;
      video.playsInline = true;

      const markReady = () => {
        ready = true;
        onScroll();
      };

      if (video.readyState >= 1 || (video.duration && !isNaN(video.duration) && video.duration > 0)) {
        markReady();
      } else {
        video.addEventListener('loadedmetadata', markReady);
        video.addEventListener('loadeddata', markReady);
        video.addEventListener('canplay', markReady);
      }

      // Convert video to in-memory Blob URL for instantaneous, 60fps scrubbing without network lag
      fetch('/video/hero-scrub.mp4')
        .then((res) => res.blob())
        .then((blob) => {
          if (!video) return;
          const blobUrl = URL.createObjectURL(blob);
          const currentT = video.currentTime;
          video.src = blobUrl;
          video.currentTime = currentT;
          markReady();
        })
        .catch(() => {});

      video.load();
    }

    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', onScroll);
    onScroll();

    return () => {
      window.removeEventListener('scroll', onScroll);
      window.removeEventListener('resize', onScroll);
      miniViewer.destroy();
      mainViewer.destroy();
    };
  }, []);

  return (
    <>
      <div className="scrub-wrap" id="scrubWrap" ref={scrubWrapRef} style={{ position: 'relative', height: '300vh' }}>
        <section className="stage" ref={stageRef} style={{ position: 'sticky', top: 0 }}>
          <video
            ref={videoRef}
            id="heroScrubVideo"
            src="/video/hero-scrub.mp4"
            muted
            playsInline
            preload="auto"
            style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover', zIndex: 0 }}
          />
          <header className="stage-header">
            <a className="stage-brand" href="#" aria-label="Orican home">
              <svg viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
                <circle cx="16" cy="16" r="14" stroke="#fff" strokeWidth="1.6" />
                <path d="M16 4v24M4 16h24" stroke="#fff" strokeWidth="1.6" />
                <circle cx="16" cy="16" r="4" fill="#fff" />
              </svg>
              <span className="stage-brand__name">ORICAN</span>
            </a>
            <div className="stage-meta">
              <span>Live 3D proofing</span>
              <span>See it before it prints</span>
            </div>
            <button className="stage-try" id="stageCustomize">Customize a tee</button>
          </header>

          <div className="stage-copy">
            {/* Phase 1 */}
            <div className="stage-step active" id="stageStep0">
              <h1 id="stageTitle0"><span>Customize</span> <span>like a Pro</span></h1>
              <p id="stageCaption0">A live 3D layer between your file and the press &mdash; upload a design, place it, and see the exact shirt that gets printed.</p>
            </div>

            {/* Phase 2 */}
            <div className="stage-step" id="stageStep1">
              <h1 id="stageTitle1"><span>Rotate &amp; Inspect</span> <span>in 360&deg;</span></h1>
              <p id="stageCaption1">Spin the garment in real time, check natural fabric drape, and verify shadows before a single drop of ink touches cotton.</p>
            </div>

            {/* Phase 3 */}
            <div className="stage-step" id="stageStep2">
              <h1 id="stageTitle2"><span>Sub-Millimeter</span> <span>Print Registration</span></h1>
              <p id="stageCaption2">Hardware-clipped print boundaries ensure your high-res art and vector files land precisely where you positioned them.</p>
            </div>

            {/* Step Indicators */}
            <div className="stage-step-indicators" aria-label="Hero scrub sequence">
              <button type="button" className="step-dot active" data-step="0" aria-label="Phase 1: Customize like a Pro" />
              <button type="button" className="step-dot" data-step="1" aria-label="Phase 2: Rotate and Inspect" />
              <button type="button" className="step-dot" data-step="2" aria-label="Phase 3: Sub-Millimeter Registration" />
            </div>
          </div>
        </section>
      </div>

      <section style={{ background: 'var(--paper-surface)', color: 'var(--ink)', padding: '0 0 48px', borderTop: '1.5px solid var(--line)' }}>
        <div className="wrap stats-bar-grid">
          <div>
            <div style={{ fontFamily: "'Manrope',sans-serif", fontSize: '34px', fontWeight: 700, color: 'var(--ink)' }}>12K+</div>
            <div style={{ fontSize: '11px', color: 'var(--blue)', letterSpacing: '.06em', fontWeight: 600 }}>PROOFS GENERATED</div>
          </div>
          <div>
            <div style={{ fontFamily: "'Manrope',sans-serif", fontSize: '34px', fontWeight: 700, color: 'var(--ink)' }}>4.9</div>
            <div style={{ fontSize: '11px', color: 'var(--blue)', letterSpacing: '.06em', fontWeight: 600 }}>AVERAGE RATING</div>
          </div>
          <div>
            <div style={{ fontFamily: "'Manrope',sans-serif", fontSize: '34px', fontWeight: 700, color: 'var(--ink)' }}>98%</div>
            <div style={{ fontSize: '11px', color: 'var(--blue)', letterSpacing: '.06em', fontWeight: 600 }}>FIRST-PRINT ACCURACY</div>
          </div>
          <div>
            <div style={{ fontFamily: "'Manrope',sans-serif", fontSize: '34px', fontWeight: 700, color: 'var(--ink)' }}>24h</div>
            <div style={{ fontSize: '11px', color: 'var(--blue)', letterSpacing: '.06em', fontWeight: 600 }}>TURNAROUND</div>
          </div>
        </div>
      </section>

      <section style={{ background: 'var(--paper)', color: 'var(--ink)', padding: '64px 0', borderTop: '1.5px solid var(--line)' }}>
        <div className="wrap live-studio-grid">
          <div style={{ position: 'relative', width: 'min(420px,100%)', aspectRatio: '1/1', justifySelf: 'center', border: '1.5px solid var(--blue)', borderRadius: '12px', overflow: 'hidden', order: 1, background: 'var(--white)', boxShadow: '0 16px 36px -12px rgba(36,44,71,.14)' }}>
            <canvas ref={miniCanvasRef} id="miniCanvas" style={{ width: '100%', height: '100%', display: 'block' }} />
          </div>
          <div style={{ order: 2 }}>
            <div style={{ fontSize: '11px', fontFamily: "'IBM Plex Mono',monospace", color: 'var(--blue)', letterSpacing: '.08em', fontWeight: 600, marginBottom: '8px' }}>
              LIVE PROOFING PREVIEW
            </div>
            <h2 style={{ color: 'var(--ink)', fontFamily: "'Manrope',sans-serif", fontSize: 'clamp(26px,3.4vw,38px)', fontWeight: 700, marginBottom: '14px' }}>Design it live, right here</h2>
            <p style={{ color: 'var(--ink-soft)', fontSize: '14px', lineHeight: 1.7, maxWidth: '38ch', marginBottom: '24px' }}>Pick a garment color and watch it update in real time &mdash; this is the same live preview you'll use to place your own design.</p>
            <div style={{ display: 'flex', gap: '12px', marginBottom: '28px' }} id="heroColorPicker">
              <div className="dot active" style={{ width: '30px', height: '30px', borderRadius: '50%', cursor: 'pointer', border: '2.5px solid var(--blue)', background: '#F6F4EE', boxShadow: '0 2px 8px rgba(36,44,71,.15)' }} data-color="#F6F4EE" data-name="Canvas White" />
              <div className="dot" style={{ width: '30px', height: '30px', borderRadius: '50%', cursor: 'pointer', border: '2px solid rgba(101,146,197,.3)', background: '#1B1C1E', boxShadow: '0 2px 8px rgba(36,44,71,.15)' }} data-color="#1B1C1E" data-name="Ink Black" />
              <div className="dot" style={{ width: '30px', height: '30px', borderRadius: '50%', cursor: 'pointer', border: '2px solid rgba(101,146,197,.3)', background: '#CBA97A', boxShadow: '0 2px 8px rgba(36,44,71,.15)' }} data-color="#CBA97A" data-name="Undyed Natural" />
            </div>
            <button className="btn btn-primary" id="thirdCustomize" style={{ fontFamily: "'Manrope',sans-serif" }}>Customize a tee</button>
          </div>
        </div>
      </section>

      <section style={{ background: 'var(--paper-surface)', color: 'var(--ink)', padding: '24px 0 64px', borderTop: '1.5px solid var(--line)' }}>
        <div className="wrap">
          <div className="section-head">
            <div>
              <div style={{ fontSize: '11px', fontFamily: "'IBM Plex Mono',monospace", color: 'var(--blue)', letterSpacing: '.08em', fontWeight: 600, marginBottom: '6px' }}>
                GARMENT SCRUTINY
              </div>
              <h2 style={{ color: 'var(--ink)', fontFamily: "'Manrope',sans-serif", fontWeight: 700 }}>Built for scrutiny</h2>
            </div>
            <p style={{ color: 'var(--ink-soft)' }}>The white tee, up close &mdash; weave, stitching, and embroidery detail.</p>
          </div>
          <div className="scrutiny-grid">
            <div style={{ aspectRatio: '16/9', borderRadius: '8px', overflow: 'hidden', border: '1.5px solid var(--line)', background: 'var(--white)', boxShadow: '0 8px 24px -8px rgba(36,44,71,.1)' }}>
              <img src="https://d8j0ntlcm91z4.cloudfront.net/user_3CEJb1vs8I6xgnavY3H6CRY4bSJ/hf_20260915_082744_f9db9841-0a2f-47d8-a71f-6054f288935c.png" alt="Macro detail of embroidered logo on white cotton t-shirt" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
            </div>
            <div style={{ aspectRatio: '16/9', borderRadius: '8px', overflow: 'hidden', border: '1.5px solid var(--line)', background: 'var(--white)', boxShadow: '0 8px 24px -8px rgba(36,44,71,.1)' }}>
              <img src="https://d8j0ntlcm91z4.cloudfront.net/user_3CEJb1vs8I6xgnavY3H6CRY4bSJ/hf_20260915_082744_aeb7a148-4bf4-4cba-a335-123d93a5d9db.png" alt="Folded white t-shirt showing fabric weave and seam stitching" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
            </div>
            <div style={{ aspectRatio: '16/9', borderRadius: '8px', overflow: 'hidden', border: '1.5px solid var(--line)', background: 'var(--white)', boxShadow: '0 8px 24px -8px rgba(36,44,71,.1)' }}>
              <img src="https://d8j0ntlcm91z4.cloudfront.net/user_3CEJb1vs8I6xgnavY3H6CRY4bSJ/hf_20260915_082744_6506c085-41fe-4e67-b573-93c71e87b9a8.png" alt="Close-up of white t-shirt collar with embroidered emblem" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
            </div>
          </div>
        </div>
      </section>

      <section className="section" id="shop" style={{ background: 'var(--paper)', color: 'var(--ink)', borderTop: '1.5px solid var(--line)' }}>
        <div className="wrap">
          <div className="section-head">
            <div>
              <div style={{ fontSize: '11px', fontFamily: "'IBM Plex Mono',monospace", color: 'var(--blue)', letterSpacing: '.08em', fontWeight: 600, marginBottom: '6px' }}>
                PREMIUM BLANKS
              </div>
              <h2 style={{ color: 'var(--ink)', fontFamily: "'Manrope',sans-serif", fontWeight: 700 }}>Pick a blank to start on</h2>
            </div>
            <p style={{ color: 'var(--ink-soft)' }}>Every color opens the same proof frame &mdash; your design carries over.</p>
          </div>
          <div className="grid">
            <div className="card" style={{ background: 'var(--white)', borderColor: 'var(--line)', boxShadow: '0 12px 30px -12px rgba(36,44,71,.12)' }}>
              <div className="swatch" style={{ background: 'var(--paper-surface)' }}>
                <iconify-icon icon="mdi:tshirt-crew" style={{ fontSize: '96px', color: '#F6F4EE', filter: 'drop-shadow(0 4px 12px rgba(36,44,71,.18))' }} />
                <div className="material-badge" style={{ background: 'rgba(240,238,230,.92)', borderColor: 'var(--blue)', color: 'var(--ink)' }}>
                  <iconify-icon icon="mdi:cotton" style={{ color: 'var(--blue)' }} />
                  100% cotton
                </div>
              </div>
              <div className="body" style={{ borderColor: 'var(--line)' }}>
                <div className="name" style={{ color: 'var(--ink)' }}>Canvas White</div>
                <div className="price" style={{ color: 'var(--ink-soft)' }}>Blank &middot; $14.00</div>
                <button className="btn small openFrame" data-color="#F6F4EE" style={{ width: '100%' }}>Customize</button>
              </div>
            </div>
            <div className="card" style={{ background: 'var(--white)', borderColor: 'var(--line)', boxShadow: '0 12px 30px -12px rgba(36,44,71,.12)' }}>
              <div className="swatch" style={{ background: 'var(--paper-surface)' }}>
                <iconify-icon icon="mdi:tshirt-crew" style={{ fontSize: '96px', color: '#1B1C1E', filter: 'drop-shadow(0 4px 12px rgba(36,44,71,.25))' }} />
                <div className="material-badge" style={{ background: 'rgba(240,238,230,.92)', borderColor: 'var(--blue)', color: 'var(--ink)' }}>
                  <iconify-icon icon="mdi:cotton" style={{ color: 'var(--blue)' }} />
                  100% cotton
                </div>
              </div>
              <div className="body" style={{ borderColor: 'var(--line)' }}>
                <div className="name" style={{ color: 'var(--ink)' }}>Ink Black</div>
                <div className="price" style={{ color: 'var(--ink-soft)' }}>Blank &middot; $14.00</div>
                <button className="btn small openFrame" data-color="#1B1C1E" style={{ width: '100%' }}>Customize</button>
              </div>
            </div>
            <div className="card" style={{ background: 'var(--white)', borderColor: 'var(--line)', boxShadow: '0 12px 30px -12px rgba(36,44,71,.12)' }}>
              <div className="swatch" style={{ background: 'var(--paper-surface)' }}>
                <iconify-icon icon="mdi:tshirt-crew" style={{ fontSize: '96px', color: '#CBA97A', filter: 'drop-shadow(0 4px 12px rgba(36,44,71,.18))' }} />
                <div className="material-badge" style={{ background: 'rgba(240,238,230,.92)', borderColor: 'var(--blue)', color: 'var(--ink)' }}>
                  <iconify-icon icon="mdi:cotton" style={{ color: 'var(--blue)' }} />
                  100% cotton
                </div>
              </div>
              <div className="body" style={{ borderColor: 'var(--line)' }}>
                <div className="name" style={{ color: 'var(--ink)' }}>Undyed Natural</div>
                <div className="price" style={{ color: 'var(--ink-soft)' }}>Blank &middot; $15.00</div>
                <button className="btn small openFrame" data-color="#CBA97A" style={{ width: '100%' }}>Customize</button>
              </div>
            </div>
          </div>
        </div>

        <div className="wrap" style={{ marginTop: '64px' }}>
          <div className="section-head">
            <div>
              <div style={{ fontSize: '11px', fontFamily: "'IBM Plex Mono',monospace", color: 'var(--blue)', letterSpacing: '.08em', fontWeight: 600, marginBottom: '6px' }}>
                METHODOLOGY
              </div>
              <h2 style={{ color: 'var(--ink)', fontFamily: "'Manrope',sans-serif", fontWeight: 700 }}>How the proof frame works</h2>
            </div>
          </div>
          <div className="steps">
            <div className="step" style={{ borderLeft: '2.5px solid var(--blue)', paddingLeft: '18px' }}>
              <iconify-icon className="step-icon" icon="mdi:cloud-upload-outline" style={{ color: 'var(--blue)' }} />
              <h3 style={{ color: 'var(--ink)', fontFamily: "'Manrope',sans-serif", fontWeight: 600 }}>Upload your design in 3D</h3>
              <p style={{ color: 'var(--ink-soft)' }}>Drop a design file onto any blank. It reads straight into the proof frame.</p>
            </div>
            <div className="step" style={{ borderLeft: '2.5px solid var(--blue)', paddingLeft: '18px' }}>
              <iconify-icon className="step-icon" icon="mdi:cube-scan" style={{ color: 'var(--blue)' }} />
              <h3 style={{ color: 'var(--ink)', fontFamily: "'Manrope',sans-serif", fontWeight: 600 }}>The frame opens on the shirt</h3>
              <p style={{ color: 'var(--ink-soft)' }}>A live 3D proof opens right on the garment &mdash; not a flat sticker.</p>
            </div>
            <div className="step" style={{ borderLeft: '2.5px solid var(--blue)', paddingLeft: '18px' }}>
              <iconify-icon className="step-icon" icon="mdi:check-decagram-outline" style={{ color: 'var(--blue)' }} />
              <h3 style={{ color: 'var(--ink)', fontFamily: "'Manrope',sans-serif", fontWeight: 600 }}>Approve, then it goes to press</h3>
              <p style={{ color: 'var(--ink-soft)' }}>Once the proof looks right, the same file is what gets printed.</p>
            </div>
          </div>
        </div>
      </section>

      <section style={{ position: 'relative', minHeight: '70vh', display: 'flex', alignItems: 'flex-end', background: "url('https://d8j0ntlcm91z4.cloudfront.net/user_3CEJb1vs8I6xgnavY3H6CRY4bSJ/hf_20260915_081447_70ad87e7-29a2-4c17-94d6-02871420d66f.png') center/cover no-repeat" }}>
        <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(0deg, #242C47 15%, rgba(36,44,71,.75) 60%, rgba(101,146,197,.2) 100%)' }} />
        <div className="wrap" style={{ position: 'relative', padding: '64px 40px 56px', color: 'var(--paper)' }}>
          <h2 style={{ fontFamily: "'Manrope',sans-serif", fontWeight: 700, fontSize: 'clamp(28px,4.5vw,52px)', lineHeight: 1.25, letterSpacing: '-.02em', maxWidth: '640px', marginBottom: '22px', color: 'var(--paper)', textShadow: '0 2px 16px rgba(0,0,0,.45)' }}>
            One proof. No surprises. The shirt you saw is the shirt you get.
          </h2>
          <button className="btn" id="storyCustomize" style={{ fontFamily: "'Manrope',sans-serif", background: 'var(--paper)', color: 'var(--ink)', borderColor: 'var(--paper)' }}>Start designing</button>
        </div>
      </section>

      <footer style={{ background: 'var(--navy)', color: 'rgba(240,238,230,.75)', borderTop: '1.5px solid rgba(101,146,197,.3)', padding: '40px 0 50px' }}>
        <div className="wrap" style={{ display: 'flex', flexDirection: 'column', gap: '12px', width: '100%' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', width: '100%', flexWrap: 'wrap', gap: '8px', alignItems: 'center' }}>
            <span style={{ fontWeight: 700, color: 'var(--paper)', letterSpacing: '.04em' }}>ORICAN &mdash; a print-on-demand studio</span>
            <span style={{ fontSize: '11px', color: 'var(--blue)', fontFamily: "'IBM Plex Mono',monospace" }}>3D Vector Proofing Engine Active</span>
          </div>
          <div style={{ fontSize: '11px', color: 'rgba(240,238,230,.45)' }}>
            Curated 60-30-10 palette in Natural Linen (#F0EEE6), Slate Blue (#6592C5), and Midnight Slate (#242C47) &middot; &copy; {new Date().getFullYear()} ORICAN Studio. All rights reserved.
          </div>
        </div>
      </footer>

      {/* ============ THE FRAME (modal) ============ */}
      <div className="overlay" id="overlay">
        <div className="frame">
          <div className="corner tl" /><div className="corner tr" />
          <div className="corner bl" /><div className="corner br" />

          <div className="viewport">
            <button className="close-btn" id="closeFrame"><iconify-icon icon="mdi:close" /></button>
            <div className="corner-actions">
              <button className="corner-btn" id="uploadBtn" title="Upload your 3D design (.obj)">
                <iconify-icon icon="mdi:cube-send" />
                <input type="file" id="fileInput" accept=".obj" />
              </button>
              <button className="corner-btn secondary" id="textureBtn" title="Add a texture image to the design">
                <iconify-icon icon="mdi:image-plus-outline" />
                <input type="file" id="textureInput" accept="image/*" />
              </button>
            </div>
            <canvas ref={mainCanvasRef} id="mainCanvas" />
            <div className="hint">Drag the design to turn it &middot; middle-click drag to move it</div>
            <div className="toast" id="toast">3D design placed on proof</div>
          </div>

          <div className="controls">
            <div>
              <h3 id="productName">Canvas White</h3>
              <div className="sub">Proof updates live as you customize.</div>
            </div>

            <div>
              <div className="field-label">GARMENT COLOR</div>
              <div className="colors" id="colorPicker">
                <div className="dot active" style={{ background: '#F6F4EE', border: '1px solid #CFC9BA' }} data-color="#F6F4EE" />
                <div className="dot" style={{ background: '#1B1C1E' }} data-color="#1B1C1E" />
                <div className="dot" style={{ background: '#CBA97A' }} data-color="#CBA97A" />
                <div className="dot" style={{ background: '#00AEEF' }} data-color="#00AEEF" />
                <div className="dot" style={{ background: '#DD0072' }} data-color="#DD0072" />
              </div>
            </div>

            <div>
              <div className="field-label">DESIGN SIZE</div>
              <div className="slider-row">
                <span className="glyph">&minus;</span>
                <input type="range" id="sizeSlider" min="0" max="100" defaultValue="33" />
                <span className="glyph">+</span>
              </div>
            </div>

            <div>
              <div className="field-label">POSITION</div>
              <div className="dpad">
                <button className="up" data-dx="0" data-dy="1" title="Move up"><iconify-icon icon="mdi:arrow-up" /></button>
                <button className="left" data-dx="-1" data-dy="0" title="Move left"><iconify-icon icon="mdi:arrow-left" /></button>
                <button className="center" id="resetPosBtn" title="Center"><iconify-icon icon="mdi:circle-small" /></button>
                <button className="right" data-dx="1" data-dy="0" title="Move right"><iconify-icon icon="mdi:arrow-right" /></button>
                <button className="down" data-dx="0" data-dy="-1" title="Move down"><iconify-icon icon="mdi:arrow-down" /></button>
              </div>
            </div>

            <div>
              <div className="field-label">SIZE</div>
              <div className="sizes" id="sizePicker">
                <div className="size-pill" data-size="S">S</div>
                <div className="size-pill active" data-size="M">M</div>
                <div className="size-pill" data-size="L">L</div>
                <div className="size-pill" data-size="XL">XL</div>
              </div>
            </div>

            <div>
              <button className="btn" id="nextBtn" style={{ width: '100%' }}>Next</button>
            </div>

            <div className="price-row">
              <div>
                <div className="price">$28.00</div>
                <div className="sub" style={{ marginTop: '2px' }}>Blank + design proof</div>
              </div>
              <button className="btn">Add to cart</button>
            </div>
          </div>

          <div className="result-view" id="resultView">
            <button className="close-btn" id="closeResult"><iconify-icon icon="mdi:close" /></button>
            <div className="result-inner">
              <div className="result-main">
                <div className="field-label">FINAL IMAGE</div>
                <img id="mockupImg" className="mockup-img" alt="Final shirt mockup" />
              </div>
              <div className="result-side">
                <h3>Ready to print</h3>
                <div className="sub">The exact print file, and a flat preview of the finished tee.</div>
                <div className="field-label" style={{ marginTop: '18px' }}>PRINT FILE</div>
                <img id="cropImg" className="crop-img" alt="Print area file" />
                <div className="result-actions">
                  <button className="btn" id="downloadMockupBtn">Download JPG</button>
                  <button className="btn ghost" id="downloadCropBtn">Download print file</button>
                  <button className="btn ghost" id="backToEditorBtn">Back to editor</button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
