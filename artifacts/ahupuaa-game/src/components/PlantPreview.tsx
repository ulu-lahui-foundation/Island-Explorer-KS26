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

    // Orthographic camera: no perspective distortion, perfect predictable sizing
    const aspect = canvas.clientWidth / canvas.clientHeight;
    const halfSize = 1; // temporary, recalculated below
    const camera = new THREE.OrthographicCamera(
      -halfSize * aspect,
      halfSize * aspect,
      halfSize,
      -halfSize,
      0.01,
      200
    );
    camera.position.set(0, 0, 10);
    camera.lookAt(0, 0, 0);

    // Lights
    const ambient = new THREE.AmbientLight(0xffffff, 0.6);
    scene.add(ambient);
    const dir = new THREE.DirectionalLight(0xffffff, 1.2);
    dir.position.set(5, 8, 5);
    scene.add(dir);
    const back = new THREE.DirectionalLight(0xaaccff, 0.4);
    back.position.set(-3, 2, -5);
    scene.add(back);

    // Plant model
    const plant = buildPlantModel(plantId);
    scene.add(plant);

    // Force update matrices so bounding calculations are accurate
    plant.updateMatrixWorld(true);

    // Measure tight bounding box from every transformed vertex
    const worldVertices: THREE.Vector3[] = [];
    plant.traverse((child) => {
      if (child instanceof THREE.Mesh) {
        const posAttr = child.geometry.getAttribute("position");
        const worldMat = child.matrixWorld;
        const v = new THREE.Vector3();
        for (let i = 0; i < posAttr.count; i++) {
          v.fromBufferAttribute(posAttr, i);
          v.applyMatrix4(worldMat);
          worldVertices.push(v.clone());
        }
      }
    });
    const tightBox = new THREE.Box3().setFromPoints(worldVertices);
    const center = tightBox.getCenter(new THREE.Vector3());
    const size = tightBox.getSize(new THREE.Vector3());

    // Center the model so it rotates around its own middle
    plant.position.sub(center);

    // Orthographic frustum: fit the largest dimension (width or height) with padding.
    // A 1.3× padding guarantees nothing clips even for asymmetric shapes during rotation.
    const maxDim = Math.max(size.x, size.y, size.z);
    const paddedHalf = (maxDim / 2) * 1.3;
    camera.left = -paddedHalf * aspect;
    camera.right = paddedHalf * aspect;
    camera.top = paddedHalf;
    camera.bottom = -paddedHalf;
    camera.updateProjectionMatrix();

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
