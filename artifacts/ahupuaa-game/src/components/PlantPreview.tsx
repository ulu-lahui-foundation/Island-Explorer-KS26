import { useRef, useEffect } from "react";
import * as THREE from "three";
import { buildPlantModel } from "@/lib/plantModels";
import { getSharedPlantRenderer } from "@/lib/sharedPlantRenderer";

export function PlantPreview({ plantId, className = "" }: { plantId: string; className?: string }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    // Unique key for this instance in the shared renderer registry
    const key = Symbol(plantId);

    // Size the backing store to match the displayed CSS size so drawImage is sharp
    const syncSize = () => {
      const w = canvas.clientWidth;
      const h = canvas.clientHeight;
      if (w > 0 && h > 0 && (canvas.width !== w || canvas.height !== h)) {
        canvas.width = w;
        canvas.height = h;
      }
    };
    syncSize();

    // Build the Three.js scene (no renderer — the shared renderer owns GL)
    const scene = new THREE.Scene();
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

    // Compute tight bounding box from actual geometry vertices
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

    const aspect = (canvas.width || 1) / (canvas.height || 1);
    const maxDim = Math.max(size.x, size.y, size.z);
    const half = (maxDim / 2) * 1.3;
    const camera = new THREE.OrthographicCamera(
      -half * aspect, half * aspect,
      half, -half,
      0.01, 200,
    );
    camera.position.set(0, 0, 10);
    camera.lookAt(0, 0, 0);

    // Register with the shared renderer — it owns the RAF loop from here
    getSharedPlantRenderer().register(key, { canvas, scene, camera, plant });

    // Sync canvas backing size on resize
    const ro = new ResizeObserver(() => syncSize());
    ro.observe(canvas);

    return () => {
      ro.disconnect();
      getSharedPlantRenderer().unregister(key);
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
