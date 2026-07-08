import { useRef, useEffect } from "react";
import * as THREE from "three";
import { buildPlantModel } from "@/lib/plantModels";

export function PlantPreview({ plantId, className = "" }: { plantId: string; className?: string }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const dpr = Math.min(window.devicePixelRatio, 2);
    const w = canvas.clientWidth * dpr;
    const h = canvas.clientHeight * dpr;

    // Renderer
    const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true });
    renderer.setSize(w, h);
    renderer.setPixelRatio(dpr);
    renderer.setClearColor(0x1a2b1f, 1); // dark green matching app theme

    // Scene
    const scene = new THREE.Scene();

    // Camera — perspective, positioned to look head-on at plant
    const camera = new THREE.PerspectiveCamera(35, canvas.clientWidth / canvas.clientHeight, 0.1, 100);
    camera.position.set(0, 0, 8);

    // Lights
    const ambient = new THREE.AmbientLight(0xffffff, 0.6);
    scene.add(ambient);
    const dir = new THREE.DirectionalLight(0xffffff, 1.2);
    dir.position.set(5, 5, 5);
    scene.add(dir);
    const back = new THREE.DirectionalLight(0xaaccff, 0.4);
    back.position.set(-3, 2, -5);
    scene.add(back);

    // Plant model
    const plant = buildPlantModel(plantId);
    scene.add(plant);

    // Frame plant to fill view
    const box = new THREE.Box3().setFromObject(plant);
    const center = box.getCenter(new THREE.Vector3());
    const size = box.getSize(new THREE.Vector3());
    const maxDim = Math.max(size.x, size.y, size.z);
    const fov = camera.fov * (Math.PI / 180);
    const desiredDist = (maxDim / 2) / Math.tan(fov / 2) * 1.3;
    camera.position.z = desiredDist;
    camera.lookAt(center);

    // Slow auto-rotate
    let animId = 0;
    const animate = () => {
      animId = requestAnimationFrame(animate);
      plant.rotation.y += 0.008;
      renderer.render(scene, camera);
    };
    animate();

    return () => {
      cancelAnimationFrame(animId);
      renderer.dispose();
      scene.clear();
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
