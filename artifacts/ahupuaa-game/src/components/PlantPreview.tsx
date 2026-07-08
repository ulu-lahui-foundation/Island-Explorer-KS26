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

    // Teardown helper — called when off-screen or on unmount
    const teardown = () => {
      cancelAnimationFrame(animId);
      animId = 0;
      if (renderer) {
        renderer.dispose();
        renderer = null;
      }
    };

    // Setup helper — called when the canvas enters the viewport
    const setup = () => {
      // Already running
      if (renderer) return;

      // Canvas may still have no layout size on first paint
      const w = canvas.clientWidth;
      const h = canvas.clientHeight;
      if (w === 0 || h === 0) return;

      // Guard: attempt to get a GL context first so we can bail gracefully
      // before handing the canvas to Three.js (which throws on null context)
      const testCtx = canvas.getContext("webgl2") ?? canvas.getContext("webgl");
      if (!testCtx) return; // context limit hit — skip silently

      try {
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

        // Measure tight bounding box from every transformed vertex
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
        // WebGL init failed — leave canvas blank, don't crash the app
        teardown();
      }
    };

    // Use IntersectionObserver so we only hold a GL context when visible
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
