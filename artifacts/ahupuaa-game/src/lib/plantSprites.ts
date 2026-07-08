import * as THREE from "three";
import { buildPlantModel } from "./plantModels";

const spriteCache = new Map<string, string>();
const pending = new Map<string, Promise<string>>();

let sharedRenderer: THREE.WebGLRenderer | null = null;
let sharedScene: THREE.Scene | null = null;
let sharedCamera: THREE.OrthographicCamera | null = null;
let queueTail: Promise<void> = Promise.resolve();

function getSharedRenderer(size: number): THREE.WebGLRenderer {
  if (!sharedRenderer) {
    const canvas = document.createElement("canvas");
    canvas.width = size;
    canvas.height = size;
    sharedRenderer = new THREE.WebGLRenderer({
      canvas,
      antialias: true,
      alpha: true,
      preserveDrawingBuffer: true,
    });
    sharedRenderer.setPixelRatio(1);
    sharedRenderer.setClearColor(0x1a2b1f, 1);
  }
  sharedRenderer.setSize(size, size);
  return sharedRenderer;
}

function getSharedScene(): THREE.Scene {
  if (!sharedScene) {
    sharedScene = new THREE.Scene();
    sharedScene.add(new THREE.AmbientLight(0xffffff, 0.7));
    const dir = new THREE.DirectionalLight(0xffffff, 1.2);
    dir.position.set(5, 8, 5);
    sharedScene.add(dir);
    const back = new THREE.DirectionalLight(0xaaccff, 0.4);
    back.position.set(-3, 2, -5);
    sharedScene.add(back);
  }
  return sharedScene;
}

function getSharedCamera(): THREE.OrthographicCamera {
  if (!sharedCamera) {
    const half = 0.8;
    sharedCamera = new THREE.OrthographicCamera(-half, half, half, -half, 0.01, 200);
    sharedCamera.position.set(0, 0, 10);
    sharedCamera.lookAt(0, 0, 0);
  }
  return sharedCamera;
}

/** Dispose all geometries and materials in an object tree. */
function disposeObject(obj: THREE.Object3D) {
  obj.traverse((child) => {
    if (child instanceof THREE.Mesh) {
      child.geometry.dispose();
      const materials = Array.isArray(child.material) ? child.material : [child.material];
      materials.forEach((m) => {
        if (m instanceof THREE.Material) m.dispose();
      });
    }
  });
}

function renderSpriteFor(plantId: string, size: number): string {
  const renderer = getSharedRenderer(size);
  const scene = getSharedScene();
  const camera = getSharedCamera();

  // Remove and dispose previous plant objects
  const toRemove: THREE.Object3D[] = [];
  scene.traverse((child) => {
    if (child !== scene && !(child instanceof THREE.Light)) {
      toRemove.push(child);
    }
  });
  toRemove.forEach((obj) => {
    if (obj.parent) obj.parent.remove(obj);
    disposeObject(obj);
  });

  const plant = buildPlantModel(plantId);
  scene.add(plant);
  plant.updateMatrixWorld(true);

  // Accurate world-space bounds via per-vertex traversal
  const trueBox = new THREE.Box3();
  const v = new THREE.Vector3();
  plant.traverse((child) => {
    if (child instanceof THREE.Mesh) {
      const pos = child.geometry.getAttribute("position");
      const mat = child.matrixWorld;
      for (let i = 0; i < pos.count; i++) {
        v.fromBufferAttribute(pos, i);
        v.applyMatrix4(mat);
        trueBox.expandByPoint(v);
      }
    }
  });

  const center = trueBox.getCenter(new THREE.Vector3());
  const bSize = trueBox.getSize(new THREE.Vector3());
  plant.position.sub(center);

  const maxDim = Math.max(bSize.x, bSize.y, bSize.z);
  if (maxDim > 0) plant.scale.setScalar(1.0 / maxDim);

  renderer.render(scene, camera);

  const dataUrl = (renderer.domElement as HTMLCanvasElement).toDataURL("image/png");

  // Dispose the rendered plant to free GPU memory immediately
  scene.remove(plant);
  disposeObject(plant);

  return dataUrl;
}

/** Global render queue: strictly serializes all sprite renders to prevent jank. */
export async function generatePlantSprite(plantId: string, size = 128): Promise<string> {
  if (spriteCache.has(plantId)) return spriteCache.get(plantId)!;
  if (pending.has(plantId)) return pending.get(plantId)!;

  const promise = new Promise<string>((resolve) => {
    queueTail = queueTail.then(() => {
      const dataUrl = renderSpriteFor(plantId, size);
      spriteCache.set(plantId, dataUrl);
      resolve(dataUrl);
    });
  });

  pending.set(plantId, promise);
  try {
    return await promise;
  } finally {
    pending.delete(plantId);
  }
}

export function getCachedPlantSprite(plantId: string): string | undefined {
  return spriteCache.get(plantId);
}

/** Batch-generate sprites with small delays to avoid frame drops. */
export async function generateAllPlantSprites(plantIds: string[], size = 128): Promise<void> {
  for (const id of plantIds) {
    await generatePlantSprite(id, size);
    await new Promise((r) => setTimeout(r, 50));
  }
}

/** Tear down all shared WebGL resources. Call on app unload if needed. */
export function teardownPlantSprites() {
  if (sharedRenderer) {
    const scene = getSharedScene();
    const toRemove: THREE.Object3D[] = [];
    scene.traverse((child) => {
      if (child !== scene && !(child instanceof THREE.Light)) {
        toRemove.push(child);
      }
    });
    toRemove.forEach((obj) => {
      if (obj.parent) obj.parent.remove(obj);
      disposeObject(obj);
    });
    sharedRenderer.dispose();
    sharedRenderer.forceContextLoss();
    sharedRenderer = null;
  }
  sharedScene = null;
  sharedCamera = null;
  spriteCache.clear();
  pending.clear();
  queueTail = Promise.resolve();
}
