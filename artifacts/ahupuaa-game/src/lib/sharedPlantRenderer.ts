/**
 * Shared WebGL renderer for PlantPreview cards.
 *
 * All preview cards share ONE WebGLRenderer (one GL context). Each frame the
 * singleton renders every registered scene in sequence and blits the result
 * onto the card's 2D canvas via drawImage. This keeps total GL contexts at 1
 * regardless of how many cards are on screen.
 */
import * as THREE from "three";

const RENDER_SIZE = 256; // px — internal resolution for all previews

interface Entry {
  canvas: HTMLCanvasElement;
  scene: THREE.Scene;
  camera: THREE.OrthographicCamera;
  plant: THREE.Group;
}

class SharedPlantRenderer {
  private gl: THREE.WebGLRenderer | null = null;
  private offscreen: HTMLCanvasElement;
  private entries = new Map<symbol, Entry>();
  private rafId = 0;

  constructor() {
    this.offscreen = document.createElement("canvas");
    this.offscreen.width = RENDER_SIZE;
    this.offscreen.height = RENDER_SIZE;
  }

  private getRenderer(): THREE.WebGLRenderer {
    if (!this.gl) {
      this.gl = new THREE.WebGLRenderer({
        canvas: this.offscreen,
        antialias: true,
        alpha: true,
        preserveDrawingBuffer: true,
      });
      this.gl.setPixelRatio(Math.min(window.devicePixelRatio, 2));
      this.gl.setSize(RENDER_SIZE, RENDER_SIZE, false);
      this.gl.setClearColor(0x1a2b1f, 1);
    }
    return this.gl;
  }

  register(key: symbol, entry: Entry): void {
    this.entries.set(key, entry);
    if (this.rafId === 0) this.loop();
  }

  unregister(key: symbol): void {
    this.entries.delete(key);
    if (this.entries.size === 0 && this.rafId !== 0) {
      cancelAnimationFrame(this.rafId);
      this.rafId = 0;
    }
  }

  private loop = () => {
    this.rafId = requestAnimationFrame(this.loop);
    if (this.entries.size === 0) return;

    const renderer = this.getRenderer();

    for (const entry of this.entries.values()) {
      const { canvas, scene, camera, plant } = entry;

      // Skip if card is not laid out yet
      const w = canvas.clientWidth;
      const h = canvas.clientHeight;
      if (w === 0 || h === 0) continue;

      plant.rotation.y += 0.008;

      // Render to shared offscreen GL canvas at fixed resolution
      renderer.render(scene, camera);

      // Blit to the card's 2D canvas, scaled to fit
      const ctx = canvas.getContext("2d");
      if (ctx) {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        ctx.drawImage(this.offscreen, 0, 0, canvas.width, canvas.height);
      }
    }
  };
}

// Module-level singleton — created lazily on first use
let instance: SharedPlantRenderer | null = null;

export function getSharedPlantRenderer(): SharedPlantRenderer {
  if (!instance) instance = new SharedPlantRenderer();
  return instance;
}
