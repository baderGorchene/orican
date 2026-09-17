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
  GARMENT_MODELS,
} from './constants';
import { GarmentModel, ScreenRect, ShirtViewerInstance } from './types';

export function makePrintAreaClipTemplates(
  centerLocal: { x: number; y: number },
  printHalfW: number = PRINT_HALF_W,
  printHalfH: number = PRINT_HALF_H
): THREE.Plane[] {
  const left = centerLocal.x - printHalfW;
  const right = centerLocal.x + printHalfW;
  const top = centerLocal.y + printHalfH;
  const bottom = centerLocal.y - printHalfH;

  return [
    new THREE.Plane(new THREE.Vector3(1, 0, 0), -left),
    new THREE.Plane(new THREE.Vector3(-1, 0, 0), right),
    new THREE.Plane(new THREE.Vector3(0, -1, 0), top),
    new THREE.Plane(new THREE.Vector3(0, 1, 0), -bottom),
  ];
}

export function drawGarment(
  ctx: CanvasRenderingContext2D,
  w: number,
  h: number,
  color: string,
  model?: GarmentModel
): void {
  ctx.clearRect(0, 0, w, h);

  const pathD = model?.silhouettePath || SHIRT_PATH_D;
  const pathSize = model?.pathSize || SHIRT_PATH_SIZE;

  const scale = Math.min((w * 0.94) / pathSize.w, (h * 0.94) / pathSize.h);
  const dw = pathSize.w * scale;
  const dh = pathSize.h * scale;
  const dx = (w - dw) / 2;
  const dy = (h - dh) / 2;

  ctx.save();
  ctx.translate(dx, dy);
  ctx.scale(scale, scale);

  const path = new Path2D(pathD);

  // Fill garment color
  ctx.fillStyle = color;
  ctx.fill(path);

  // Smooth studio outline
  ctx.lineJoin = 'round';
  ctx.lineWidth = Math.max(0.7, (w * 0.005) / scale);
  ctx.strokeStyle = '#242C47';
  ctx.stroke(path);

  ctx.restore();
}

export const drawShirt = drawGarment;

export function makeGarmentTexture(
  color: string,
  model?: GarmentModel
): {
  tex: THREE.CanvasTexture;
  canvas: HTMLCanvasElement;
  ctx: CanvasRenderingContext2D;
} {
  const canvas = document.createElement('canvas');
  canvas.width = 1024;
  canvas.height = 1280;
  const ctx = canvas.getContext('2d')!;
  drawGarment(ctx, canvas.width, canvas.height, color, model);

  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.needsUpdate = true;
  return { tex, canvas, ctx };
}

export const makeShirtTexture = makeGarmentTexture;

export interface ViewerOptions {
  color?: string;
  model?: GarmentModel;
  exportable?: boolean;
  onScreenRectChange?: (rect: ScreenRect) => void;
  maskContainer?: HTMLElement | null;
}

export function createGarmentViewer(
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

  // Lighting setup
  const ambientLight = new THREE.AmbientLight(0xffffff, 0.88);
  scene.add(ambientLight);

  const keyLight = new THREE.DirectionalLight(0xffffff, 0.95);
  keyLight.position.set(2.5, 3.2, 4);
  scene.add(keyLight);

  const fillLight = new THREE.DirectionalLight(0xffffff, 0.42);
  fillLight.position.set(-3, -1, 2);
  scene.add(fillLight);

  let currentModel: GarmentModel = opts.model || GARMENT_MODELS[0];
  let currentColor = opts.color || '#F6F4EE';
  let garmentData = makeGarmentTexture(currentColor, currentModel);

  let currentPlaneW = currentModel.planeWidth || PLANE_WIDTH;
  let currentPlaneH = currentModel.planeHeight || PLANE_HEIGHT;
  let geo = new THREE.PlaneGeometry(currentPlaneW, currentPlaneH);
  const garmentMat = new THREE.MeshBasicMaterial({
    map: garmentData.tex,
    transparent: true,
  });
  const garmentMesh = new THREE.Mesh(geo, garmentMat);
  scene.add(garmentMesh);

  // Design Anchor
  const designAnchor = new THREE.Object3D();
  designAnchor.position.set(currentModel.printZone.center.x, currentModel.printZone.center.y, 0.12);
  designAnchor.rotation.x = -0.08;
  scene.add(designAnchor);

  // Dynamic clipping planes
  let currentHalfW = (currentModel.printZone.wFrac * currentPlaneW) / 2;
  let currentHalfH = (currentModel.printZone.hFrac * currentPlaneH) / 2;
  let clipPlanes = makePrintAreaClipTemplates(currentModel.printZone.center, currentHalfW, currentHalfH);

  // Design Mesh State
  let designMesh: THREE.Mesh | null = null;
  let designSphereRadius = 0;
  let designBaseScale = 1;
  let designMultiplier = 1;
  const designMinMultiplier = 0.55;
  const designMaxMultiplier = 1.95;
  let pendingTextureImg: HTMLImageElement | null = null;
  let offsetX = 0;
  let offsetY = 0;

  function redrawGarmentTexture() {
    drawGarment(garmentData.ctx, garmentData.canvas.width, garmentData.canvas.height, currentColor, currentModel);
    garmentData.tex.needsUpdate = true;
  }

  function updateAnchorTransform() {
    const limits = {
      x: Math.max(0.05, currentHalfW - 0.05),
      y: Math.max(0.05, currentHalfH - 0.05),
    };
    offsetX = Math.max(-limits.x, Math.min(limits.x, offsetX));
    offsetY = Math.max(-limits.y, Math.min(limits.y, offsetY));
    designAnchor.position.set(
      currentModel.printZone.center.x + offsetX,
      currentModel.printZone.center.y + offsetY,
      0.12
    );
  }

  function applyOffset(dx: number, dy: number) {
    offsetX += dx;
    offsetY += dy;
    updateAnchorTransform();
  }

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

    const mat = designMesh.material as THREE.MeshStandardMaterial;
    mat.map = tex;
    mat.color.set('#ffffff');
    mat.needsUpdate = true;
  }

  function centerGeometry(geometry: THREE.BufferGeometry) {
    geometry.computeBoundingBox();
    const box = geometry.boundingBox!;
    const center = new THREE.Vector3();
    box.getCenter(center);
    geometry.translate(-center.x, -center.y, -center.z);
    geometry.computeBoundingSphere();
  }

  // Radial ground shadow
  const shadowCanvas = document.createElement('canvas');
  shadowCanvas.width = 256;
  shadowCanvas.height = 256;
  const sCtx = shadowCanvas.getContext('2d')!;
  const grad = sCtx.createRadialGradient(128, 128, 10, 128, 128, 120);
  grad.addColorStop(0, 'rgba(36, 44, 71, 0.22)');
  grad.addColorStop(0.5, 'rgba(36, 44, 71, 0.08)');
  grad.addColorStop(1, 'rgba(240, 238, 230, 0)');
  sCtx.fillStyle = grad;
  sCtx.fillRect(0, 0, 256, 256);
  const shadowTex = new THREE.CanvasTexture(shadowCanvas);
  const shadowGeo = new THREE.PlaneGeometry(3.6, 1.2);
  const shadowMat = new THREE.MeshBasicMaterial({
    map: shadowTex,
    transparent: true,
    depthWrite: false,
  });
  const shadowMesh = new THREE.Mesh(shadowGeo, shadowMat);
  shadowMesh.position.set(0, -1.95, 0.01);
  scene.add(shadowMesh);

  // DOM Print Boundary Mask Bands
  const maskBands: {
    top?: HTMLDivElement;
    bottom?: HTMLDivElement;
    left?: HTMLDivElement;
    right?: HTMLDivElement;
  } = {};

  if (opts.maskContainer) {
    const parent = opts.maskContainer;
    ['top', 'bottom', 'left', 'right'].forEach((side) => {
      const el = document.createElement('div');
      el.className = `print-mask-band print-mask-${side}`;
      el.style.position = 'absolute';
      el.style.pointerEvents = 'none';
      el.style.backgroundColor = 'rgba(240, 238, 230, 0.65)';
      el.style.backdropFilter = 'blur(3px)';
      el.style.setProperty('-webkit-backdrop-filter', 'blur(3px)');
      el.style.zIndex = '15';
      parent.appendChild(el);
      maskBands[side as keyof typeof maskBands] = el;
    });
  }

  function updateMaskDom(rect: ScreenRect) {
    if (!opts.maskContainer) return;
    const { top, bottom, left, right } = rect;

    if (maskBands.top) {
      maskBands.top.style.top = '0';
      maskBands.top.style.left = '0';
      maskBands.top.style.right = '0';
      maskBands.top.style.height = `${Math.max(0, top)}px`;
    }
    if (maskBands.bottom) {
      maskBands.bottom.style.top = `${bottom}px`;
      maskBands.bottom.style.left = '0';
      maskBands.bottom.style.right = '0';
      maskBands.bottom.style.bottom = '0';
    }
    if (maskBands.left) {
      maskBands.left.style.top = `${top}px`;
      maskBands.left.style.left = '0';
      maskBands.left.style.width = `${Math.max(0, left)}px`;
      maskBands.left.style.height = `${Math.max(0, bottom - top)}px`;
    }
    if (maskBands.right) {
      maskBands.right.style.top = `${top}px`;
      maskBands.right.style.left = `${right}px`;
      maskBands.right.style.right = '0';
      maskBands.right.style.height = `${Math.max(0, bottom - top)}px`;
    }
  }

  function getScreenCoords(centerLocal: { x: number; y: number }): ScreenRect {
    const p1 = new THREE.Vector3(
      centerLocal.x - currentHalfW,
      centerLocal.y + currentHalfH,
      0
    );
    const p2 = new THREE.Vector3(
      centerLocal.x + currentHalfW,
      centerLocal.y - currentHalfH,
      0
    );

    p1.project(camera);
    p2.project(camera);

    const w = canvasEl.clientWidth;
    const h = canvasEl.clientHeight;

    const x1 = ((p1.x + 1) / 2) * w;
    const y1 = ((-p1.y + 1) / 2) * h;
    const x2 = ((p2.x + 1) / 2) * w;
    const y2 = ((-p2.y + 1) / 2) * h;

    return {
      left: Math.min(x1, x2),
      right: Math.max(x1, x2),
      top: Math.min(y1, y2),
      bottom: Math.max(y1, y2),
    };
  }

  // Pointer Interaction
  let isDragging = false;
  let isPanning = false;
  let lastPointerX = 0;
  let lastPointerY = 0;

  const onPointerDown = (e: PointerEvent) => {
    if (e.button === 1 || (e.button === 0 && e.shiftKey)) {
      isPanning = true;
      e.preventDefault();
    } else if (e.button === 0) {
      isDragging = true;
    }
    lastPointerX = e.clientX;
    lastPointerY = e.clientY;
    canvasEl.setPointerCapture(e.pointerId);
  };

  const onPointerMove = (e: PointerEvent) => {
    if (!isDragging && !isPanning) return;
    const dx = e.clientX - lastPointerX;
    const dy = e.clientY - lastPointerY;
    lastPointerX = e.clientX;
    lastPointerY = e.clientY;

    if (isPanning) {
      const panSpeed = 0.005;
      applyOffset(dx * panSpeed, -dy * panSpeed);
    } else if (isDragging && designMesh) {
      designMesh.rotation.y += dx * 0.015;
      designMesh.rotation.x += dy * 0.015;
    }
  };

  const onPointerUp = (e: PointerEvent) => {
    isDragging = false;
    isPanning = false;
    try {
      canvasEl.releasePointerCapture(e.pointerId);
    } catch {}
  };

  const onAuxClick = (e: MouseEvent) => {
    if (e.button === 1) e.preventDefault();
  };

  canvasEl.addEventListener('pointerdown', onPointerDown);
  canvasEl.addEventListener('auxclick', onAuxClick);
  window.addEventListener('pointermove', onPointerMove);
  window.addEventListener('pointerup', onPointerUp);

  function resize() {
    const w = canvasEl.clientWidth;
    const h = canvasEl.clientHeight;
    if (w === 0 || h === 0) return;

    renderer.setSize(w, h, false);
    camera.aspect = w / h;
    camera.updateProjectionMatrix();

    const screenRect = getScreenCoords(currentModel.printZone.center);
    updateMaskDom(screenRect);
    opts.onScreenRectChange?.(screenRect);
  }

  let animId = 0;
  let isDestroyed = false;

  function animate() {
    if (isDestroyed) return;
    animId = requestAnimationFrame(animate);

    // Idle design breath
    if (designMesh && !isDragging) {
      designMesh.rotation.y += 0.003;
    }

    renderer.render(scene, camera);
  }

  resize();
  animate();
  window.addEventListener('resize', resize);

  // Flat Composite Mockup Rendering (JPG)
  function renderFlatMockupCanvas(): HTMLCanvasElement {
    const compCanvas = document.createElement('canvas');
    compCanvas.width = 1200;
    compCanvas.height = 1500;
    const cCtx = compCanvas.getContext('2d')!;

    // Clean white studio backdrop
    cCtx.fillStyle = '#FFFFFF';
    cCtx.fillRect(0, 0, compCanvas.width, compCanvas.height);

    // Garment silhouette
    drawGarment(cCtx, compCanvas.width, compCanvas.height, currentColor, currentModel);

    // Render design within print boundary
    const snapCanvas = document.createElement('canvas');
    snapCanvas.width = 512;
    snapCanvas.height = 512;
    const snapRenderer = new THREE.WebGLRenderer({
      canvas: snapCanvas,
      antialias: true,
      alpha: true,
      preserveDrawingBuffer: true,
    });
    snapRenderer.setSize(512, 512, false);
    const snapCamera = new THREE.PerspectiveCamera(30, 1, 0.1, 20);
    snapCamera.position.set(0, 0, 4);

    const snapScene = new THREE.Scene();
    const snapLight = new THREE.DirectionalLight(0xffffff, 1.2);
    snapLight.position.set(1, 2, 3);
    snapScene.add(snapLight);
    snapScene.add(new THREE.AmbientLight(0xffffff, 0.7));

    if (designMesh) {
      const cloneMesh = designMesh.clone();
      cloneMesh.material = (designMesh.material as THREE.Material).clone();
      snapScene.add(cloneMesh);
      snapRenderer.render(snapScene, snapCamera);

      const zoneW = compCanvas.width * currentModel.printZone.wFrac;
      const zoneH = compCanvas.height * currentModel.printZone.hFrac;
      const zoneX = (compCanvas.width - zoneW) / 2 + (offsetX / currentHalfW) * (zoneW * 0.35);
      const zoneY = (compCanvas.height - zoneH) / 2 - (offsetY / currentHalfH) * (zoneH * 0.35);

      cCtx.drawImage(snapCanvas, zoneX, zoneY, zoneW, zoneH);
      cloneMesh.geometry.dispose();
      (cloneMesh.material as THREE.Material).dispose();
    }
    snapRenderer.dispose();

    return compCanvas;
  }

  // Print-Area Crop File (Lossless PNG)
  function renderPrintAreaCropCanvas(): HTMLCanvasElement {
    const cropCanvas = document.createElement('canvas');
    cropCanvas.width = 1024;
    cropCanvas.height = 1024;
    const crCtx = cropCanvas.getContext('2d')!;

    crCtx.clearRect(0, 0, 1024, 1024);

    if (designMesh) {
      const snapRenderer = new THREE.WebGLRenderer({
        canvas: cropCanvas,
        antialias: true,
        alpha: true,
        preserveDrawingBuffer: true,
      });
      snapRenderer.setSize(1024, 1024, false);
      const snapCamera = new THREE.PerspectiveCamera(30, 1, 0.1, 20);
      snapCamera.position.set(0, 0, 3.8);

      const snapScene = new THREE.Scene();
      snapScene.add(new THREE.DirectionalLight(0xffffff, 1.2));
      snapScene.add(new THREE.AmbientLight(0xffffff, 0.8));

      const cloneMesh = designMesh.clone();
      cloneMesh.material = (designMesh.material as THREE.Material).clone();
      snapScene.add(cloneMesh);
      snapRenderer.render(snapScene, snapCamera);
      cloneMesh.geometry.dispose();
      (cloneMesh.material as THREE.Material).dispose();
      snapRenderer.dispose();
    }

    return cropCanvas;
  }

  return {
    setColor(c: string) {
      currentColor = c;
      redrawGarmentTexture();
    },

    setGarmentModel(model: GarmentModel) {
      currentModel = model;
      currentPlaneW = model.planeWidth || PLANE_WIDTH;
      currentPlaneH = model.planeHeight || PLANE_HEIGHT;

      // Update geometry & canvas texture
      geo.dispose();
      geo = new THREE.PlaneGeometry(currentPlaneW, currentPlaneH);
      garmentMesh.geometry = geo;
      redrawGarmentTexture();

      // Recalculate print boundaries & clipping planes
      currentHalfW = (model.printZone.wFrac * currentPlaneW) / 2;
      currentHalfH = (model.printZone.hFrac * currentPlaneH) / 2;
      clipPlanes = makePrintAreaClipTemplates(model.printZone.center, currentHalfW, currentHalfH);

      if (designMesh) {
        (designMesh.material as THREE.MeshStandardMaterial).clippingPlanes = clipPlanes;
      }

      offsetX = 0;
      offsetY = 0;
      updateAnchorTransform();
      resize();
    },

    getGarmentModel(): GarmentModel {
      return currentModel;
    },

    setDesignGeometry(geometry: THREE.BufferGeometry, color?: string) {
      if (designMesh) {
        designAnchor.remove(designMesh);
        designMesh.geometry.dispose();
        (designMesh.material as THREE.Material).dispose();
      }

      centerGeometry(geometry);
      const size = new THREE.Vector3();
      geometry.boundingBox!.getSize(size);
      const maxDim = Math.max(size.x, size.y, size.z) || 1;
      const initialScale = 0.82 / maxDim;

      const mat = new THREE.MeshStandardMaterial({
        color: color || '#DD0072',
        roughness: 0.45,
        metalness: 0.08,
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
      if (designMesh) {
        designMesh.rotation.set(0, 0, 0);
      }
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

      Object.values(maskBands).forEach((b) => b?.remove());

      if (designMesh) {
        designMesh.geometry.dispose();
        (designMesh.material as THREE.Material).dispose();
      }

      geo.dispose();
      garmentMat.dispose();
      garmentData.tex.dispose();
      shadowMesh.geometry.dispose();
      (shadowMesh.material as THREE.Material).dispose();
      shadowTex.dispose();
      renderer.dispose();
    },
  };
}

export const createShirtViewer = createGarmentViewer;
