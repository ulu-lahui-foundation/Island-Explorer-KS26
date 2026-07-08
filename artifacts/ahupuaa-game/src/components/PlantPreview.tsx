import { useRef, useEffect } from "react";
import * as THREE from "three";
import { buildPlantModel } from "@/lib/plantModels";

export function PlantPreview({ plantId, className = "" }: { plantId: string; className?: string }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    let animId = 0;
    let renderer: THREE.WebGLRenderer | null = null;

    // When we dispose a renderer we must stop Three.js's onContextRestore
    // handler from firing on the dead renderer. We do this by registering a
    // capture-phase listener that swallows the event before Three.js sees it.
    let restoreBlocker: ((e: Event) => void) | null = null;

    const blockRestore = () => {
      if (restoreBlocker) return; // already blocked
      const fn = (e: Event) => { e.stopImmediatePropagation(); };
      restoreBlocker = fn;
      canvas.addEventListener("webglcontextrestored", fn, true);
    };

    const unblockRestore = () => {
      if (!restoreBlocker) return;
      canvas.removeEventListener("webglcontextrestored", restoreBlocker, true);
      restoreBlocker = null;
    };

    const teardown = () => {
      cancelAnimationFrame(animId);
      animId = 0;
      if (renderer) {
        // Block Three.js's onContextRestore BEFORE dispose so it can't access
        // the now-dead renderer if the browser later restores the GL context.
        blockRestore();
        renderer.dispose();
        renderer = null;
      }
    };

    const setup = () => {
      if (renderer) return; // already running

      const w = canvas.clientWidth;
      const h = canvas.clientHeight;
      if (w === 0 || h === 0) return;

      // Pre-flight check — bail gracefully if context limit is hit
      const testCtx = canvas.getContext("webgl2") ?? canvas.getContext("webgl");
      if (!testCtx) return;

      try {
        // Remove the restore blocker (if any) before creating a new renderer
        // so Three.js can register its own handlers cleanly.
        unblockRestore();

        const dpr = Math.min(window.devicePixelRatio, 2);
        renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true });
        renderer.setSize(w, h, false);
        renderer.setPixelRatio(dpr);
        renderer.setClearColor(0x1a2b1f, 1);

        const scene = new THREE.Scene();

        const aspect = w / h;
        const camera = new THREE.OrthographicCamera(-aspect, aspect, 1, -1, 0.01, 200);
        camera.position.set(0, 0, 10);
        camera.lookAt(0, 0, 0);

        scene.add(new THREE.AmbientLight(0xffffff, 0.6));
        const dir = new THREE.DirectionalLight(0xffffff, 1.2);
        dir.position.set(5, 8, 5);
        scene.add(dir);
        const back = new THREE.DirectionalLight(0xaaccff, 0.4);
        back.position.set(-3, 2, -5);
        scene.add(back);

        const plant = buildPlantModel(plantId);
        scene.add(plant);
        plant.updateMatrixWorld(true);

        // Tight bounding box from actual vertices
        const verts: THREE.Vector3[] = [];
        plant.traverse((child) => {
          if (child instanceof THREE.Mesh) {
            const pos = child.geometry.getAttribute("position");
            const mat = child.matrixWorld;
            const v = new THREE.Vector3();
            for (let i = 0; i < pos.count; i++) {
              v.fromBufferAttribute(pos, i);
              v.applyMatrix4(mat);
              verts.push(v.clone());
            }
          }
        });

        const box = new THREE.Box3().setFromPoints(verts);
        const center = box.getCenter(new THREE.Vector3());
        const size = box.getSize(new THREE.Vector3());
        plant.position.sub(center);

        const maxDim = Math.max(size.x, size.y, size.z);
        const half = (maxDim / 2) * 1.3;
        camera.left = -half * aspect;
        camera.right = half * aspect;
        camera.top = half;
        camera.bottom = -half;
        camera.updateProjectionMatrix();

        const currentRenderer = renderer;
        const animate = () => {
          animId = requestAnimationFrame(animate);
          plant.rotation.y += 0.008;
          currentRenderer.render(scene, camera);
        };
        animate();
      } catch {
        teardown();
      }
    };

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) {
          setup();
        } else {
          teardown();
        }
      },
      { threshold: 0.01 }
    );
    observer.observe(canvas);

    return () => {
      observer.disconnect();
      teardown();
      // Clean up the restore blocker on unmount
      unblockRestore();
    };
  }, [plantId]);

  return (
    <canvas
      ref={canvasRef}
      className={`w-full h-full block ${className}`}
      style={{ imageRendering: "auto" }}
    />
  );
}
