import * as THREE from 'three';
import {
  PLANE_HEIGHT,
  PLANE_WIDTH,
  PRINT_BASE_CENTER,
  PRINT_HALF_H,
  PRINT_HALF_W,
  PRINT_SIZE,
  MOVE_LIMITS,
  MOVE_STEP,
  SHIRT_PATH_D,
  SHIRT_PATH_SIZE,
} from './constants';
import { ScreenRect, ShirtViewerInstance } from './types';

export function makePrintAreaClipTemplates(centerLocal: { x: number; y: number }): THREE.Plane[] {
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

export function drawShirt(
  ctx: CanvasRenderingContext2D,
  w: number,
  h: number,
  color: string
): void {
  ctx.clearRect(0, 0, w, h);

  const scale = Math.min((w * 0.94) / SHIRT_PATH_SIZE.w, (h * 0.94) / SHIRT_PATH_SIZE.h);
  const dw = SHIRT_PATH_SIZE.w * scale;
  const dh = SHIRT_PATH_SIZE.h * scale;
  const dx = (w - dw) / 2;
  const dy = (h - dh) / 2;

  ctx.save();
  ctx.translate(dx, dy);
  ctx.scale(scale, scale);

  const path = new Path2D(SHIRT_PATH_D);

  // Fill garment color
  ctx.fillStyle = color;
  ctx.fill(path);

  // Thin crisp outline
  ctx.lineJoin = 'round';
  ctx.lineWidth = Math.max(0.6, (w * 0.005) / scale);
  ctx.strokeStyle = '#000000';
  ctx.stroke(path);

  ctx.restore();
}

export function makeShirtTexture(color: string): {
  tex: THREE.CanvasTexture;
  canvas: HTMLCanvasElement;
  ctx: CanvasRenderingContext2D;
} {
  const canvas = document.createElement('canvas');
  canvas.width = 1024;
  canvas.height = 1280;
  const ctx = canvas.getContext('2d')!;
  drawShirt(ctx, canvas.width, canvas.height, color);

  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.needsUpdate = true;
  return { tex, canvas, ctx };
}

export interface ViewerOptions {
  color?: string;
  exportable?: boolean;
  onScreenRectChange?: (rect: ScreenRect) => void;
  maskContainer?: HTMLElement | null;
}

export function createShirtViewer(
  canvasEl: HTMLCanvasElement,
  opts: ViewerOptions = {}
): ShirtViewerInstance {
  const renderer = new THREE.WebGLRenderer({
    canvas: canvasEl,
    antialias: true,
    alpha: true,
    preserveDrawingBuffer: !!opts.exportable,
  });

  renderer.setPixelRatio(Math.min(typeof window !== 'undefined' ? window.devicePixelRatio : 1, 2));
  renderer.localClippingEnabled = true;

  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(32, 1, 0.1, 100);
  camera.position.set(0, 0, 6.2);

  // Lighting
  const ambientLight = new THREE.AmbientLight(0xffffff, 0.85);
  scene.add(ambientLight);

  const keyLight = new THREE.DirectionalLight(0xffffff, 0.95);
  keyLight.position.set(2.5, 3, 4);
  scene.add(keyLight);

  const fillLight = new THREE.DirectionalLight(0xffffff, 0.4);
  fillLight.position.set(-3, -1, 2);
  scene.add(fillLight);

  let currentColor = opts.color || '#F6F4EE';
  let shirtData = makeShirtTexture(currentColor);

  const geo = new THREE.PlaneGeometry(PLANE_WIDTH, PLANE_HEIGHT);
  const shirtMat = new THREE.MeshBasicMaterial({
    map: shirtData.tex,
    transparent: true,
  });
  const shirtMesh = new THREE.Mesh(geo, shirtMat);
  scene.add(shirtMesh);

  // Design Anchor
  const designAnchor = new THREE.Object3D();
  designAnchor.position.set(PRINT_BASE_CENTER.x, PRINT_BASE_CENTER.y, 0.12);
  designAnchor.rotation.x = -0.08;
  scene.add(designAnchor);

  // Fixed clipping planes
  const clipPlanes = makePrintAreaClipTemplates(PRINT_BASE_CENTER);

  // State
  let designMesh: THREE.Mesh | null = null;
  let designSphereRadius = 0;
  let designBaseScale = 1;
  let designMultiplier = 1;
  const designMinMultiplier = 0.15;
  const designMaxMultiplier = 50;
  let offsetX = 0;
  let offsetY = 0;
  let pendingTextureImg: HTMLImageElement | null = null;

  function updateAnchorTransform() {
    const clearanceRadius = designMesh
      ? designSphereRadius * designBaseScale * designMultiplier
      : 0;
    designAnchor.position.set(
      PRINT_BASE_CENTER.x + offsetX,
      PRINT_BASE_CENTER.y + offsetY,
      0.02 + clearanceRadius + 0.06
    );
  }

  function applyOffset(dxLocal: number, dyLocal: number) {
    offsetX = Math.max(-MOVE_LIMITS.x, Math.min(MOVE_LIMITS.x, offsetX + dxLocal));
    offsetY = Math.max(-MOVE_LIMITS.y, Math.min(MOVE_LIMITS.y, offsetY + dyLocal));
    updateAnchorTransform();
  }

  // Ground drop shadow
  const shadowCanvas = document.createElement('canvas');
  shadowCanvas.width = 256;
  shadowCanvas.height = 128;
  const sctx = shadowCanvas.getContext('2d')!;
  const rg = sctx.createRadialGradient(128, 64, 10, 128, 64, 120);
  rg.addColorStop(0, 'rgba(0,0,0,0.22)');
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

  // DOM Mask bands (if container provided)
  const maskContainer = opts.maskContainer || canvasEl.parentElement;
  const maskBands: Record<string, HTMLDivElement> = {};
  if (maskContainer) {
    ['top', 'bottom', 'left', 'right'].forEach((key) => {
      const band = document.createElement('div');
      band.className = 'print-mask-band';
      band.style.position = 'absolute';
      band.style.pointerEvents = 'none';
      band.style.zIndex = '2';
      band.style.backgroundColor = 'rgba(101, 146, 197, 0.22)';
      band.style.backdropFilter = 'blur(0.5px)';
      maskContainer.appendChild(band);
      maskBands[key] = band;
    });
  }

  function computeScreenRect(w: number, h: number): ScreenRect {
    camera.updateMatrixWorld();
    const half = new THREE.Vector3(
      PRINT_BASE_CENTER.x + PRINT_HALF_W,
      PRINT_BASE_CENTER.y + PRINT_HALF_H,
      0.02
    );
    const other = new THREE.Vector3(
      PRINT_BASE_CENTER.x - PRINT_HALF_W,
      PRINT_BASE_CENTER.y - PRINT_HALF_H,
      0.02
    );

    half.project(camera);
    other.project(camera);

    const x1 = ((half.x + 1) / 2) * w;
    const x2 = ((other.x + 1) / 2) * w;
    const y1 = ((1 - half.y) / 2) * h;
    const y2 = ((1 - other.y) / 2) * h;

    const rect: ScreenRect = {
      left: Math.min(x1, x2),
      right: Math.max(x1, x2),
      top: Math.min(y1, y2),
      bottom: Math.max(y1, y2),
    };

    if (opts.onScreenRectChange) {
      opts.onScreenRectChange(rect);
    }
    return rect;
  }

  function updateMask(w: number, h: number) {
    if (!maskBands.top) return;
    const { left, right, top, bottom } = computeScreenRect(w, h);

    maskBands.top.style.cssText = `position:absolute;left:0px;top:0px;width:${w}px;height:${Math.max(
      0,
      top
    )}px;pointer-events:none;z-index:2;background:rgba(101,146,197,0.22);`;
    maskBands.bottom.style.cssText = `position:absolute;left:0px;top:${bottom}px;width:${w}px;height:${Math.max(
      0,
      h - bottom
    )}px;pointer-events:none;z-index:2;background:rgba(101,146,197,0.22);`;
    maskBands.left.style.cssText = `position:absolute;left:0px;top:${top}px;width:${Math.max(
      0,
      left
    )}px;height:${Math.max(0, bottom - top)}px;pointer-events:none;z-index:2;background:rgba(101,146,197,0.22);`;
    maskBands.right.style.cssText = `position:absolute;left:${right}px;top:${top}px;width:${Math.max(
      0,
      w - right
    )}px;height:${Math.max(0, bottom - top)}px;pointer-events:none;z-index:2;background:rgba(101,146,197,0.22);`;
  }

  function renderPrintAreaCropCanvas(): HTMLCanvasElement {
    renderer.render(scene, camera);
    const w = canvasEl.clientWidth;
    const h = canvasEl.clientHeight;
    const rect = computeScreenRect(w, h);
    const ratio = renderer.getPixelRatio();
    const sx = rect.left * ratio;
    const sy = rect.top * ratio;
    const sw = Math.max(1, (rect.right - rect.left) * ratio);
    const sh = Math.max(1, (rect.bottom - rect.top) * ratio);

    const c = document.createElement('canvas');
    c.width = Math.round(sw);
    c.height = Math.round(sh);
    const ctx = c.getContext('2d')!;
    ctx.drawImage(renderer.domElement, sx, sy, sw, sh, 0, 0, c.width, c.height);
    return c;
  }

  function renderFlatMockupCanvas(): HTMLCanvasElement {
    const W = shirtData.canvas.width;
    const H = shirtData.canvas.height;
    const out = document.createElement('canvas');
    out.width = W;
    out.height = H;
    const octx = out.getContext('2d')!;

    octx.fillStyle = '#FFFFFF';
    octx.fillRect(0, 0, W, H);
    octx.drawImage(shirtData.canvas, 0, 0);

    if (designMesh) {
      const cropCanvas = renderPrintAreaCropCanvas();
      const fracCenterX = 0.5 + PRINT_BASE_CENTER.x / PLANE_WIDTH;
      const fracCenterY = 0.5 - PRINT_BASE_CENTER.y / PLANE_HEIGHT;
      const pw = PRINT_SIZE.wFrac * W;
      const ph = PRINT_SIZE.hFrac * H;
      const px = fracCenterX * W - pw / 2;
      const py = fracCenterY * H - ph / 2;
      octx.drawImage(cropCanvas, px, py, pw, ph);
    }
    return out;
  }

  let lastW = 0;
  let lastH = 0;

  function resize() {
    const w = canvasEl.clientWidth;
    const h = canvasEl.clientHeight;
    if (w === 0 || h === 0 || (w === lastW && h === lastH)) return;
    lastW = w;
    lastH = h;
    renderer.setSize(w, h, false);
    camera.aspect = w / h;
    camera.updateProjectionMatrix();
    updateMask(w, h);
  }

  function redraw() {
    drawShirt(shirtData.ctx, shirtData.canvas.width, shirtData.canvas.height, currentColor);
    shirtData.tex.needsUpdate = true;
  }

  // Pointer interactions
  const raycaster = new THREE.Raycaster();
  const mouseVec = new THREE.Vector2();
  let objectDrag = false;
  let panDrag = false;
  let lastX = 0;
  let lastY = 0;

  function hitDesignMesh(clientX: number, clientY: number): boolean {
    if (!designMesh) return false;
    const rect = canvasEl.getBoundingClientRect();
    mouseVec.x = ((clientX - rect.left) / rect.width) * 2 - 1;
    mouseVec.y = -((clientY - rect.top) / rect.height) * 2 + 1;
    raycaster.setFromCamera(mouseVec, camera);
    return raycaster.intersectObject(designMesh).length > 0;
  }

  function onPointerDown(e: PointerEvent) {
    if (e.button === 1) {
      // Middle-click pan
      e.preventDefault();
      panDrag = true;
      lastX = e.clientX;
      lastY = e.clientY;
      canvasEl.style.cursor = 'move';
      return;
    }
    if (hitDesignMesh(e.clientX, e.clientY)) {
      objectDrag = true;
      lastX = e.clientX;
      lastY = e.clientY;
      canvasEl.style.cursor = 'grabbing';
    }
  }

  function onAuxClick(e: MouseEvent) {
    if (e.button === 1) e.preventDefault();
  }

  function onPointerMove(e: PointerEvent) {
    if (panDrag) {
      const rect = canvasEl.getBoundingClientRect();
      const dxLocal = (e.clientX - lastX) * (PLANE_WIDTH / rect.width);
      const dyLocal = -(e.clientY - lastY) * (PLANE_HEIGHT / rect.height);
      lastX = e.clientX;
      lastY = e.clientY;
      applyOffset(dxLocal, dyLocal);
      return;
    }
    if (!objectDrag || !designMesh) return;
    const dx = e.clientX - lastX;
    const dy = e.clientY - lastY;
    designMesh.rotation.y += dx * 0.012;
    designMesh.rotation.x += dy * 0.012;
    lastX = e.clientX;
    lastY = e.clientY;
  }

  function onPointerUp() {
    if (objectDrag || panDrag) {
      canvasEl.style.cursor = 'grab';
    }
    objectDrag = false;
    panDrag = false;
  }

  canvasEl.addEventListener('pointerdown', onPointerDown);
  canvasEl.addEventListener('auxclick', onAuxClick);
  window.addEventListener('pointermove', onPointerMove);
  window.addEventListener('pointerup', onPointerUp);

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
  setTimeout(resize, 60);

  function applyTextureToMesh(img: HTMLImageElement) {
    if (!designMesh) return;
    const tex = new THREE.Texture(img);
    tex.colorSpace = THREE.SRGBColorSpace;
    tex.wrapS = THREE.ClampToEdgeWrapping;
    tex.wrapT = THREE.ClampToEdgeWrapping;
    tex.generateMipmaps = false;
    tex.minFilter = THREE.LinearFilter;
    tex.magFilter = THREE.LinearFilter;
    tex.needsUpdate = true;

    (designMesh.material as THREE.MeshStandardMaterial).map = tex;
    (designMesh.material as THREE.MeshStandardMaterial).color.set('#ffffff');
    (designMesh.material as THREE.MeshStandardMaterial).needsUpdate = true;
  }

  return {
    setColor(c: string) {
      currentColor = c;
      redraw();
    },

    setDesignGeometry(geometry: THREE.BufferGeometry, color: string = '#6592C5') {
      if (designMesh) {
        designAnchor.remove(designMesh);
        designMesh.geometry.dispose();
        (designMesh.material as THREE.Material).dispose();
      }

      const size = new THREE.Vector3();
      geometry.boundingBox?.getSize(size);
      const maxDim = Math.max(size.x, size.y, size.z) || 1;
      const initialScale = 0.82 / maxDim;

      const mat = new THREE.MeshStandardMaterial({
        color,
        roughness: 0.45,
        metalness: 0.1,
        clippingPlanes: clipPlanes,
        clipShadows: true,
        side: THREE.DoubleSide,
      });

      const mesh = new THREE.Mesh(geometry, mat);
      mesh.scale.setScalar(initialScale);
      designAnchor.add(mesh);

      designMesh = mesh;
      designBaseScale = initialScale;
      designMultiplier = 1;
      designSphereRadius = geometry.boundingSphere?.radius || 1;
      updateAnchorTransform();

      if (pendingTextureImg) {
        applyTextureToMesh(pendingTextureImg);
      }
    },

    setDesignSize(t: number) {
      if (!designMesh) return;
      const clampedT = Math.max(0, Math.min(1, t));
      const mult =
        designMinMultiplier *
        Math.pow(designMaxMultiplier / designMinMultiplier, clampedT);
      designMultiplier = mult;
      designMesh.scale.setScalar(designBaseScale * mult);
      updateAnchorTransform();
    },

    moveDesign(dx: number, dy: number) {
      applyOffset(dx * MOVE_STEP, dy * MOVE_STEP);
    },

    panDesign(dxLocal: number, dyLocal: number) {
      applyOffset(dxLocal, dyLocal);
    },

    resetPosition() {
      offsetX = 0;
      offsetY = 0;
      updateAnchorTransform();
    },

    setDesignTexture(img: HTMLImageElement) {
      pendingTextureImg = img;
      if (designMesh) applyTextureToMesh(img);
    },

    exportMockupJPG(): string {
      return renderFlatMockupCanvas().toDataURL('image/jpeg', 0.95);
    },

    exportPrintFileCrop(): string {
      return renderPrintAreaCropCanvas().toDataURL('image/png');
    },

    resize,

    destroy() {
      isDestroyed = true;
      cancelAnimationFrame(animId);
      window.removeEventListener('resize', resize);
      canvasEl.removeEventListener('pointerdown', onPointerDown);
      canvasEl.removeEventListener('auxclick', onAuxClick);
      window.removeEventListener('pointermove', onPointerMove);
      window.removeEventListener('pointerup', onPointerUp);

      Object.values(maskBands).forEach((b) => b.remove());

      if (designMesh) {
        designMesh.geometry.dispose();
        (designMesh.material as THREE.Material).dispose();
      }

      geo.dispose();
      shirtMat.dispose();
      shirtData.tex.dispose();
      shadowMesh.geometry.dispose();
      (shadowMesh.material as THREE.Material).dispose();
      shadowTex.dispose();
      renderer.dispose();
    },
  };
}
