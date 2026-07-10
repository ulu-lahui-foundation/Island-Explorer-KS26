import { useRef, useEffect, useState, useCallback } from "react";
import { useGame, Zone, PLANT_DATABASE, Plant } from "@/lib/GameContext";
import { motion, AnimatePresence } from "framer-motion";
import { Leaf } from "lucide-react";

import * as THREE from "three";
import { buildPlantModel } from "@/lib/plantModels";
import { PlantPreview } from "@/components/PlantPreview";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";
import { ImprovedNoise } from "three/examples/jsm/math/ImprovedNoise.js";

/** Deduplicate inventory by plant id, returning unique plants with a count */
function deduplicateInventory(inventory: Plant[]): { plant: Plant; count: number }[] {
  const map = new Map<string, { plant: Plant; count: number }>();
  for (const p of inventory) {
    const existing = map.get(p.id);
    if (existing) existing.count++;
    else map.set(p.id, { plant: p, count: 1 });
  }
  return Array.from(map.values());
}

/* Zone validator: which zone can this plant live in? */
function getExpectedZone(plantId: string): Zone {
  const p = PLANT_DATABASE.find(x => x.id === plantId);
  return p?.zone ?? 'kula';
}

function hasWebGL(): boolean {
  try {
    const canvas = document.createElement("canvas");
    return !!(window.WebGLRenderingContext && canvas.getContext("webgl"));
  } catch {
    return false;
  }
}

export function MapPage() {
  const { inventory, placedPlants, placePlant, removePlacedPlant } = useGame();
  const [selectedPlantIdx, setSelectedPlantIdx] = useState<number | null>(null);
  const [inventoryOpen, setInventoryOpen] = useState(false);
  const [zoneError, setZoneError] = useState<string | null>(null);
  const zoneErrorTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const showZoneError = useCallback((msg: string) => {
    if (zoneErrorTimer.current) clearTimeout(zoneErrorTimer.current);
    setZoneError(msg);
    zoneErrorTimer.current = setTimeout(() => setZoneError(null), 3000);
  }, []);

  const [webglAvailable, setWebglAvailable] = useState<boolean | null>(null);

  // Camera zoom target (null = overview, else 3D target pos)
  const cameraTargetRef = useRef<{
    target: THREE.Vector3;
    distance: number;
    height: number;
    active: boolean;
  } | null>(null);

  // Drag ghost state
  const [dragGhost, setDragGhost] = useState<{ plant: Plant; x: number; y: number } | null>(null);

  useEffect(() => {
    setWebglAvailable(hasWebGL());
  }, []);

  const containerRef = useRef<HTMLDivElement>(null);
  const sceneRef = useRef<{
    scene: THREE.Scene;
    camera: THREE.PerspectiveCamera;
    renderer: THREE.WebGLRenderer;
    controls: OrbitControls;
    terrain: THREE.Mesh;
    backdrop: THREE.Mesh;
    raycaster: THREE.Raycaster;
    mouse: THREE.Vector2;
    spawnedPlants: THREE.Group[];
    plantBoundingSpheres: THREE.Sphere[];
    cleanup: () => void;
    spawnPlant3D: (plantId: string, position: THREE.Vector3) => void;
    removePlant3D: (index: number) => void;
  } | null>(null);

  /* ── Init Three.js scene ── */
  useEffect(() => {
    if (!webglAvailable) return;
    const container = containerRef.current;
    if (!container) return;

    let renderer: THREE.WebGLRenderer;
    try {
      renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    } catch {
      setWebglAvailable(false);
      return;
    }

    // Scene
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x87ceeb);

    const camera = new THREE.PerspectiveCamera(
      45,
      container.clientWidth / container.clientHeight,
      0.1,
      1000,
    );

    renderer.setSize(container.clientWidth, container.clientHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.5));
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFShadowMap;
    container.appendChild(renderer.domElement);

    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.05;
    controls.maxPolarAngle = Math.PI / 2 - 0.12;
    controls.minDistance = 45;
    controls.maxDistance = 480;
    controls.zoomSpeed = 5;
    controls.minAzimuthAngle = -Math.PI / 2.2;
    controls.maxAzimuthAngle = Math.PI / 2.2;
    // Mobile: one-finger pan, two-finger pinch-to-zoom
    controls.touches = {
      ONE: THREE.TOUCH.PAN,
      TWO: THREE.TOUCH.DOLLY_PAN,
    };

    // Celestial
    const sunMesh = new THREE.Mesh(
      new THREE.SphereGeometry(25, 32, 32),
      new THREE.MeshBasicMaterial({ color: 0xfff5e6 }),
    );
    // Fixed daytime position — high in the sky, slightly to the side for nice shadows
    sunMesh.position.set(300, 400, -200);
    scene.add(sunMesh);

    const moonMesh = new THREE.Mesh(
      new THREE.SphereGeometry(18, 32, 32),
      new THREE.MeshBasicMaterial({ color: 0xddeeff }),
    );
    // Hidden below the horizon permanently
    moonMesh.position.set(0, -500, 0);
    scene.add(moonMesh);

    // Stars
    const starsPositions: number[] = [];
    for (let i = 0; i < 800; i++) {
      const x = (Math.random() - 0.5) * 2000;
      const y = (Math.random() - 0.5) * 2000;
      const z = (Math.random() - 0.5) * 2000;
      if (Math.sqrt(x * x + y * y + z * z) > 600) starsPositions.push(x, y, z);
    }
    const starsGeo = new THREE.BufferGeometry();
    starsGeo.setAttribute("position", new THREE.Float32BufferAttribute(starsPositions, 3));
    const starsMat = new THREE.PointsMaterial({ color: 0xffffff, size: 2, transparent: true, opacity: 0 });
    const starsGroup = new THREE.Group();
    starsGroup.add(new THREE.Points(starsGeo, starsMat));
    scene.add(starsGroup);

    // Lighting
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.4);
    scene.add(ambientLight);

    const dirLight = new THREE.DirectionalLight(0xfff5e6, 1.2);
    dirLight.position.set(300, 400, -200); // matches fixed sun position
    dirLight.castShadow = true;
    dirLight.shadow.mapSize.set(1024, 1024);
    dirLight.shadow.camera.near = 0.1;
    dirLight.shadow.camera.far = 1500;
    dirLight.shadow.camera.left = -200;
    dirLight.shadow.camera.right = 200;
    dirLight.shadow.camera.top = 200;
    dirLight.shadow.camera.bottom = -200;
    dirLight.shadow.bias = -0.001;
    scene.add(dirLight);

    const moonLight = new THREE.DirectionalLight(0x88bbff, 0);
    moonLight.castShadow = false;
    moonLight.position.set(0, -500, 0); // permanently below horizon
    scene.add(moonLight);

    // ── Terrain ──
    const terrainWidth = 120;
    const terrainLength = 250;
    const segmentsW = 128;
    const segmentsL = 256;
    const noise = new ImprovedNoise();

    const geometry = new THREE.PlaneGeometry(terrainWidth, terrainLength, segmentsW, segmentsL);
    geometry.rotateX(-Math.PI / 2);
    const posAttr = geometry.attributes.position;
    const colors: number[] = [];
    const color = new THREE.Color();

    for (let i = 0; i < posAttr.count; i++) {
      let x = posAttr.getX(i);
      let z = posAttr.getZ(i);
      const normZ = (z + terrainLength / 2) / terrainLength;
      const zFactor = 1 - normZ;

      let baseHeight = 72 * Math.pow(zFactor, 2.0);
      const distFromCenter = Math.abs(x) / (terrainWidth / 2);
      const cornerTaper = 1.0 - Math.pow(zFactor, 1.5) * Math.pow(distFromCenter, 2.0);
      const ridgeHeight = 42 * Math.pow(distFromCenter, 3.2) * Math.pow(zFactor, 1.4) * cornerTaper;

      let noiseVal = noise.noise(x * 0.05, z * 0.05, 0) * 5;
      noiseVal += noise.noise(x * 0.15, z * 0.15, 0) * 2;
      noiseVal *= zFactor;

      const meander = Math.sin(normZ * Math.PI * 3) * 5;
      const distToRiver = Math.abs(x - meander);
      const currentRiverWidth = 3.0 + normZ * 6.0;
      let riverInfluence = 0;
      if (distToRiver < currentRiverWidth && normZ < 0.95) {
        riverInfluence = 1 - distToRiver / currentRiverWidth;
        noiseVal *= 1 - riverInfluence;
      }

      let y = baseHeight + ridgeHeight + noiseVal;
      if (riverInfluence > 0) y -= riverInfluence * 3.5;
      if (normZ > 0.75) {
        const beachFactor = (normZ - 0.75) / 0.25;
        y = THREE.MathUtils.lerp(y, riverInfluence > 0 ? -4.5 : -3.5, beachFactor * beachFactor);
      }
      posAttr.setY(i, y);

      if (riverInfluence > 0.001 && normZ < 0.95) {
        color.setHex(0x2774a8).lerp(new THREE.Color(0x1e5a84), riverInfluence);
      } else if (y > 45) {
        color.setHex(0x1f3d14);
        if (noiseVal > 1) color.offsetHSL(0, 0, -0.03);
      } else if (y > 20) {
        color.setHex(0x3a5f22);
        if (noiseVal > 1) color.offsetHSL(0, 0, -0.05);
      } else if (normZ > 0.75 && y < 3.5) {
        color.setHex(0xe8ddb5);
      } else {
        color.setHex(0x5c8a33);
      }
      colors.push(color.r, color.g, color.b);
    }
    geometry.setAttribute("color", new THREE.Float32BufferAttribute(colors, 3));
    geometry.computeVertexNormals();

    const material = new THREE.MeshStandardMaterial({
      vertexColors: true,
      roughness: 0.8,
      metalness: 0.1,
      flatShading: true,
    });
    const terrain = new THREE.Mesh(geometry, material);
    terrain.receiveShadow = true;
    terrain.castShadow = true;
    scene.add(terrain);

    // ── Backdrop island ──
    const islandGeo = new THREE.PlaneGeometry(1200, 1200, 160, 160);
    islandGeo.rotateX(-Math.PI / 2);
    const bdPos = islandGeo.attributes.position;
    const bdColors: number[] = [];
    const bdColor = new THREE.Color();

    for (let i = 0; i < bdPos.count; i++) {
      let x = bdPos.getX(i);
      let z = bdPos.getZ(i);
      const originX = 0;
      const originZ = -80;
      const maxRadius = 500;
      const distToPeak = Math.sqrt((x - originX) ** 2 + (z - originZ) ** 2);
      let islandDome = Math.max(0, 1 - distToPeak / maxRadius);
      const sideTaper = Math.max(0.25, 1 - Math.abs(x) / 250);
      let newY = islandDome * (160 * sideTaper);

      let n = noise.noise(x * 0.015, z * 0.015, 0) * 55;
      n += noise.noise(x * 0.05, z * 0.05, 0) * 15;
      newY += (n * islandDome) * sideTaper;

      if (z > 20) {
        const centerFocus = Math.max(0, 1 - Math.abs(x) / 450);
        const dropFactor = Math.min(1, (z - 20) / 120);
        newY -= Math.pow(dropFactor * centerFocus, 1.5) * 250;
      }
      newY = Math.max(-25, newY);
      if (distToPeak > maxRadius - 80) {
        newY = THREE.MathUtils.lerp(newY, -25, (distToPeak - (maxRadius - 80)) / 80);
      }

      // Blend to ahupua'a edge
      const nearestX = Math.max(-58, Math.min(58, x));
      const nearestZ = Math.max(-123, Math.min(123, z));
      const normZ = (nearestZ + 125) / 250;
      const zFactor = 1 - normZ;
      const bHeight = 72 * Math.pow(zFactor, 2.0);
      const dCenter = Math.abs(nearestX) / 60;
      const ct = 1.0 - Math.pow(zFactor, 1.5) * Math.pow(dCenter, 2.0);
      const rHeight = 42 * Math.pow(dCenter, 3.2) * Math.pow(zFactor, 1.4) * ct;
      let edgeNoise = noise.noise(nearestX * 0.05, nearestZ * 0.05, 0) * 5;
      edgeNoise += noise.noise(nearestX * 0.15, nearestZ * 0.15, 0) * 2;
      edgeNoise *= zFactor;
      const m = Math.sin(normZ * Math.PI * 3) * 5;
      const dR = Math.abs(nearestX - m);
      const cRW = 3.0 + normZ * 6.0;
      let rI = 0;
      if (dR < cRW && normZ < 0.95) {
        rI = 1 - dR / cRW;
        edgeNoise *= 1 - rI;
      }
      let edgeHeight = bHeight + rHeight + edgeNoise;
      if (rI > 0) edgeHeight -= rI * 3.5;
      if (normZ > 0.75) {
        const bf = (normZ - 0.75) / 0.25;
        edgeHeight = THREE.MathUtils.lerp(edgeHeight, rI > 0 ? -4.5 : -3, bf * bf);
      }

      const isInside = x === nearestX && z === nearestZ;
      if (isInside) {
        newY = edgeHeight - 0.5;
      } else {
        const distToEdge = Math.sqrt((x - nearestX) ** 2 + (z - nearestZ) ** 2);
        if (distToEdge < 70) {
          let blend = distToEdge / 70;
          blend = blend * blend * (3 - 2 * blend);
          newY = THREE.MathUtils.lerp(edgeHeight, newY, blend);
        }
      }
      bdPos.setY(i, newY);

      if (rI > 0.001 && normZ < 0.95) bdColor.setHex(0x2774a8).lerp(new THREE.Color(0x1e5a84), rI);
      else if (newY > 45) bdColor.setHex(0x1f3d14);
      else if (newY > 20) bdColor.setHex(0x3a5f22);
      else if (normZ > 0.75 && newY < 3.5) bdColor.setHex(0xe8ddb5);
      else if (newY > -2) bdColor.setHex(0x5c8a33);
      else bdColor.setHex(0xe8ddb5);
      bdColors.push(bdColor.r, bdColor.g, bdColor.b);
    }
    islandGeo.setAttribute("color", new THREE.Float32BufferAttribute(bdColors, 3));
    islandGeo.computeVertexNormals();
    const backdropMat = new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 0.9, metalness: 0.05, flatShading: true });
    const backdrop = new THREE.Mesh(islandGeo, backdropMat);
    backdrop.receiveShadow = true;
    backdrop.castShadow = true;
    scene.add(backdrop);

    // ── Surrounding forest ──
    const treeCount = 1500;
    const trunkGeo = new THREE.CylinderGeometry(0.3, 0.5, 2.5, 5);
    const leavesGeo = new THREE.DodecahedronGeometry(2.5, 0);
    leavesGeo.translate(0, 2.2, 0);
    const trunkMat = new THREE.MeshStandardMaterial({ color: 0x4a3c31, roughness: 0.9, flatShading: true });
    const leavesMat = new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.8, flatShading: true });
    const trunkInstanced = new THREE.InstancedMesh(trunkGeo, trunkMat, treeCount);
    const leavesInstanced = new THREE.InstancedMesh(leavesGeo, leavesMat, treeCount);
    trunkInstanced.castShadow = true;
    trunkInstanced.receiveShadow = true;
    leavesInstanced.castShadow = true;
    leavesInstanced.receiveShadow = true;

    const dummyTree = new THREE.Object3D();
    const treeColor = new THREE.Color();
    let treesPlaced = 0;
    while (treesPlaced < treeCount) {
      let x = (Math.random() - 0.5) * 1000;
      let z = (Math.random() - 0.5) * 1000;
      const originX = 0, originZ = -80, maxR = 500;
      const distToPeak = Math.sqrt((x - originX) ** 2 + (z - originZ) ** 2);
      if (distToPeak > maxR - 20) continue;
      let islandDome = Math.max(0, 1 - distToPeak / maxR);
      const sideTaper = Math.max(0.25, 1 - Math.abs(x) / 250);
      let treeY = islandDome * (160 * sideTaper);
      let n = noise.noise(x * 0.015, z * 0.015, 0) * 55;
      n += noise.noise(x * 0.05, z * 0.05, 0) * 15;
      treeY += (n * islandDome) * sideTaper;
      if (z > 20) {
        const cf = Math.max(0, 1 - Math.abs(x) / 450);
        const df = Math.min(1, (z - 20) / 120);
        treeY -= Math.pow(df * cf, 1.5) * 250;
      }
      treeY = Math.max(-25, treeY);
      if (distToPeak > maxR - 80) treeY = THREE.MathUtils.lerp(treeY, -25, (distToPeak - (maxR - 80)) / 80);

      const nearestX = Math.max(-58, Math.min(58, x));
      const nearestZ = Math.max(-123, Math.min(123, z));
      if (x === nearestX && z === nearestZ) continue;

      const normZ = (nearestZ + 125) / 250;
      const zFactor = 1 - normZ;
      const bHeight = 72 * Math.pow(zFactor, 2.0);
      const dCenter = Math.abs(nearestX) / 60;
      const ct = 1.0 - Math.pow(zFactor, 1.5) * Math.pow(dCenter, 2.0);
      const rHeight = 42 * Math.pow(dCenter, 3.2) * Math.pow(zFactor, 1.4) * ct;
      let eNoise = noise.noise(nearestX * 0.05, nearestZ * 0.05, 0) * 5;
      eNoise += noise.noise(nearestX * 0.15, nearestZ * 0.15, 0) * 2;
      eNoise *= zFactor;
      const meander = Math.sin(normZ * Math.PI * 3) * 5;
      const dR = Math.abs(nearestX - meander);
      const cRW = 3.0 + normZ * 6.0;
      let rI = 0;
      if (dR < cRW && normZ < 0.95) {
        rI = 1 - dR / cRW;
        eNoise *= 1 - rI;
      }
      let edgeHeight = bHeight + rHeight + eNoise;
      if (rI > 0) edgeHeight -= rI * 3.5;
      if (normZ > 0.75) {
        const bf = (normZ - 0.75) / 0.25;
        edgeHeight = THREE.MathUtils.lerp(edgeHeight, rI > 0 ? -4.5 : -3, bf * bf);
      }
      const distToEdge = Math.sqrt((x - nearestX) ** 2 + (z - nearestZ) ** 2);
      if (distToEdge < 70) {
        let blend = distToEdge / 70;
        blend = blend * blend * (3 - 2 * blend);
        treeY = THREE.MathUtils.lerp(edgeHeight, treeY, blend);
      }

      if (treeY > 2 && treeY < 90) {
        const scale = 0.6 + Math.random() * 0.8;
        dummyTree.position.set(x, treeY - 0.2, z);
        dummyTree.scale.set(scale, scale * (0.8 + Math.random() * 0.5), scale);
        dummyTree.rotation.set((Math.random() - 0.5) * 0.2, Math.random() * Math.PI * 2, (Math.random() - 0.5) * 0.2);
        dummyTree.updateMatrix();
        trunkInstanced.setMatrixAt(treesPlaced, dummyTree.matrix);
        leavesInstanced.setMatrixAt(treesPlaced, dummyTree.matrix);
        treeColor.setHex(0x4b7022).offsetHSL((Math.random() - 0.5) * 0.1, (Math.random() - 0.5) * 0.15, (Math.random() - 0.5) * 0.1);
        leavesInstanced.setColorAt(treesPlaced, treeColor);
        treesPlaced++;
      }
    }
    scene.add(trunkInstanced);
    scene.add(leavesInstanced);

    // ── Ocean ──
    const oceanGeo = new THREE.PlaneGeometry(2000, 2000, 32, 32);
    oceanGeo.rotateX(-Math.PI / 2);
    const oceanMat = new THREE.MeshStandardMaterial({ color: 0x0077be, transparent: true, opacity: 0.75, roughness: 0.1, metalness: 0.6 });
    const ocean = new THREE.Mesh(oceanGeo, oceanMat);
    ocean.position.set(0, -1, 0);
    ocean.receiveShadow = true;
    scene.add(ocean);
    const oceanInitialPositions = JSON.parse(JSON.stringify(oceanGeo.attributes.position.array));

    // ── Rocks ──
    const rockGeo = new THREE.DodecahedronGeometry(1, 0);
    const rockMat = new THREE.MeshStandardMaterial({ color: 0x3d3d3d, roughness: 0.9, flatShading: true });
    for (let i = 0; i < 20; i++) {
      const rx = (Math.random() - 0.5) * 110;
      const rz = (Math.random() - 0.5) * 230;
      const rock = new THREE.Mesh(rockGeo, rockMat);
      const scale = 0.5 + Math.random() * 2.5;
      rock.scale.set(scale, scale * (0.6 + Math.random() * 0.8), scale);
      rock.position.set(rx, -scale * 0.3, rz);
      rock.rotation.set(Math.random() * Math.PI, Math.random() * Math.PI, Math.random() * Math.PI);
      rock.castShadow = true;
      rock.receiveShadow = true;
      scene.add(rock);
    }
    for (let i = 0; i < 35; i++) {
      const rock = new THREE.Mesh(rockGeo, rockMat);
      const rx = (Math.random() - 0.5) * 600, rz = 150 + Math.random() * 350;
      const sx = 2 + Math.random() * 12, sy = 4 + Math.random() * 25, sz = 2 + Math.random() * 12;
      rock.scale.set(sx, sy, sz);
      rock.position.set(rx, -(sy * 0.6) - Math.random() * 8, rz);
      rock.rotation.set((Math.random() - 0.5) * 0.4, Math.random() * Math.PI, (Math.random() - 0.5) * 0.4);
      rock.castShadow = true;
      rock.receiveShadow = true;
      scene.add(rock);
    }

    // ── Clouds ──
    const clouds: { mesh: THREE.Group; speed: number }[] = [];
    const cloudMat = new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 1.0, flatShading: true, transparent: true, opacity: 0.9 });
    const puffGeo = new THREE.IcosahedronGeometry(1, 0);
    for (let i = 0; i < 20; i++) {
      const cloud = new THREE.Group();
      const numPuffs = 4 + Math.floor(Math.random() * 5);
      for (let j = 0; j < numPuffs; j++) {
        const puff = new THREE.Mesh(puffGeo, cloudMat);
        puff.position.set((Math.random() - 0.5) * 15, (Math.random() - 0.5) * 5, (Math.random() - 0.5) * 15);
        const s = 4 + Math.random() * 8;
        puff.scale.set(s, s, s);
        puff.castShadow = false;
        puff.receiveShadow = false;
        cloud.add(puff);
      }
      cloud.position.set((Math.random() - 0.5) * 1000, 120 + Math.random() * 60, (Math.random() - 0.5) * 1000);
      scene.add(cloud);
      clouds.push({ mesh: cloud, speed: 0.1 + Math.random() * 0.2 });
    }

    // ── Birds ──
    interface Bird { mesh: THREE.Group; rightWing: THREE.Mesh; leftWing: THREE.Mesh; speed: number; flapSpeed: number; turnSpeed: number; baseY: number; offset: number }
    const birds: Bird[] = [];
    const birdColors = [0xcc0000, 0xdd2222, 0xcccc00, 0xaaaa00];
    for (let i = 0; i < 25; i++) {
      const birdGroup = new THREE.Group();
      const birdMat = new THREE.MeshStandardMaterial({ color: birdColors[Math.floor(Math.random() * birdColors.length)], roughness: 0.6, flatShading: true });
      const bodyGeo = new THREE.CapsuleGeometry(0.25, 0.8, 8, 8);
      bodyGeo.rotateX(Math.PI / 2);
      birdGroup.add(new THREE.Mesh(bodyGeo, birdMat));
      const head = new THREE.Mesh(new THREE.SphereGeometry(0.3, 8, 8), birdMat);
      head.position.set(0, 0.1, 0.5);
      birdGroup.add(head);
      const beak = new THREE.Mesh(new THREE.ConeGeometry(0.08, 0.5, 8), new THREE.MeshStandardMaterial({ color: 0x111111 }));
      beak.geometry.rotateX(Math.PI / 2);
      beak.position.set(0, 0.05, 0.8);
      birdGroup.add(beak);
      const wingGeo = new THREE.PlaneGeometry(1.5, 0.8, 2, 2);
      wingGeo.translate(0.75, 0, 0);
      const rightWing = new THREE.Mesh(wingGeo, birdMat);
      rightWing.position.set(0, 0.1, 0);
      const leftWing = new THREE.Mesh(wingGeo, birdMat);
      leftWing.scale.x = -1;
      leftWing.position.set(0, 0.1, 0);
      birdGroup.add(rightWing);
      birdGroup.add(leftWing);
      birdGroup.position.set((Math.random() - 0.5) * 200, 30 + Math.random() * 50, (Math.random() - 0.5) * 200);
      birdGroup.rotation.y = Math.random() * Math.PI * 2;
      scene.add(birdGroup);
      birds.push({ mesh: birdGroup, rightWing, leftWing, speed: 0.2 + Math.random() * 0.3, flapSpeed: 10 + Math.random() * 10, turnSpeed: (Math.random() - 0.5) * 0.02, baseY: birdGroup.position.y, offset: Math.random() * 100 });
    }

    // ── Sea Animals ──
    const seaAnimals: any[] = [];
    const honuShellMat = new THREE.MeshStandardMaterial({ color: 0x3a4b18, roughness: 0.8, flatShading: true });
    const honuSkinMat = new THREE.MeshStandardMaterial({ color: 0x556b2f, roughness: 0.7, flatShading: true });
    const honuBellyMat = new THREE.MeshStandardMaterial({ color: 0xe8ddb5, roughness: 0.8, flatShading: true });
    for (let i = 0; i < 5; i++) {
      const honu = new THREE.Group();
      const shell = new THREE.Mesh(new THREE.SphereGeometry(1.5, 12, 10, 0, Math.PI * 2, 0, Math.PI / 2), honuShellMat);
      shell.scale.set(1, 0.6, 1.2);
      honu.add(shell);
      const belly = new THREE.Mesh(new THREE.CylinderGeometry(1.48, 1.48, 0.1, 12), honuBellyMat);
      belly.scale.set(1, 1, 1.2);
      honu.add(belly);
      const headGeo = new THREE.CapsuleGeometry(0.3, 0.4, 8, 8);
      headGeo.rotateX(Math.PI / 2);
      const head = new THREE.Mesh(headGeo, honuSkinMat);
      head.position.set(0, 0.1, 1.7);
      honu.add(head);
      const flipperFrontGeo = new THREE.CapsuleGeometry(0.2, 1.8, 8, 8);
      flipperFrontGeo.rotateZ(Math.PI / 2);
      flipperFrontGeo.scale(1, 0.2, 0.5);
      const flipperBackGeo = new THREE.CapsuleGeometry(0.15, 1.0, 8, 8);
      flipperBackGeo.rotateZ(Math.PI / 2);
      flipperBackGeo.scale(1, 0.15, 0.4);
      const flL = new THREE.Mesh(flipperFrontGeo, honuSkinMat);
      flL.position.set(-1.2, 0, 0.8);
      flL.rotation.y = -Math.PI / 4;
      honu.add(flL);
      const flR = new THREE.Mesh(flipperFrontGeo, honuSkinMat);
      flR.position.set(1.2, 0, 0.8);
      flR.rotation.y = Math.PI / 4;
      honu.add(flR);
      const flBackL = new THREE.Mesh(flipperBackGeo, honuSkinMat);
      flBackL.position.set(-0.8, 0, -1.2);
      flBackL.rotation.y = Math.PI / 6;
      honu.add(flBackL);
      const flBackR = new THREE.Mesh(flipperBackGeo, honuSkinMat);
      flBackR.position.set(0.8, 0, -1.2);
      flBackR.rotation.y = -Math.PI / 6;
      honu.add(flBackR);
      honu.position.set((Math.random() - 0.5) * 400, -1, 130 + Math.random() * 300);
      honu.rotation.y = Math.random() * Math.PI * 2;
      scene.add(honu);
      seaAnimals.push({ mesh: honu, type: "honu", speed: 0.05 + Math.random() * 0.05, turnSpeed: (Math.random() - 0.5) * 0.01, baseY: -1 - Math.random() * 1.5, animCycle: Math.random() * Math.PI * 2, flipperL: flL, flipperR: flR });
    }

    const naiaMat = new THREE.MeshStandardMaterial({ color: 0x7393b3, roughness: 0.4, flatShading: true });
    for (let i = 0; i < 20; i++) {
      const naia = new THREE.Group();
      const bodyGeo = new THREE.CapsuleGeometry(0.6, 2.5, 12, 12);
      bodyGeo.rotateX(Math.PI / 2);
      naia.add(new THREE.Mesh(bodyGeo, naiaMat));
      const snoutGeo = new THREE.CapsuleGeometry(0.15, 0.6, 8, 8);
      snoutGeo.rotateX(Math.PI / 2);
      const snout = new THREE.Mesh(snoutGeo, naiaMat);
      snout.position.set(0, -0.1, 1.8);
      naia.add(snout);
      const dorsalGeo = new THREE.ConeGeometry(0.3, 1.0, 8);
      dorsalGeo.rotateX(-0.2);
      const dorsal = new THREE.Mesh(dorsalGeo, naiaMat);
      dorsal.position.set(0, 0.8, 0.2);
      naia.add(dorsal);
      const pecGeo = new THREE.CapsuleGeometry(0.1, 1.0, 8, 8);
      pecGeo.rotateZ(Math.PI / 2);
      pecGeo.scale(1, 0.2, 0.4);
      const pecL = new THREE.Mesh(pecGeo, naiaMat);
      pecL.position.set(-0.6, -0.2, 0.8);
      pecL.rotation.y = -Math.PI / 4;
      pecL.rotation.z = -0.2;
      naia.add(pecL);
      const pecR = new THREE.Mesh(pecGeo, naiaMat);
      pecR.position.set(0.6, -0.2, 0.8);
      pecR.rotation.y = Math.PI / 4;
      pecR.rotation.z = 0.2;
      naia.add(pecR);
      const flukeGeo = new THREE.CapsuleGeometry(0.1, 1.8, 8, 8);
      flukeGeo.rotateZ(Math.PI / 2);
      flukeGeo.scale(1, 0.2, 0.4);
      const fluke = new THREE.Mesh(flukeGeo, naiaMat);
      fluke.position.set(0, 0, -1.8);
      naia.add(fluke);
      naia.position.set((Math.random() - 0.5) * 400, -1, 130 + Math.random() * 300);
      naia.rotation.y = Math.random() * Math.PI * 2;
      scene.add(naia);
      seaAnimals.push({ mesh: naia, type: "naia", speed: 0.25 + Math.random() * 0.25, turnSpeed: (Math.random() - 0.5) * 0.02, animCycle: Math.random() * Math.PI * 2, baseY: -2 });
    }

    // ── Fish schools ──
    const fishSchools: any[] = [];
    const schoolColors = [0xffd700, 0x00aaff, 0xff8c00, 0xee55ff];
    const fishBodyGeo = new THREE.ConeGeometry(0.2, 0.8, 4);
    fishBodyGeo.rotateX(Math.PI / 2);
    fishBodyGeo.scale(0.3, 1, 0.8);
    for (let i = 0; i < 8; i++) {
      const schoolGroup = new THREE.Group();
      const schoolColor = schoolColors[Math.floor(Math.random() * schoolColors.length)];
      const fishMat = new THREE.MeshStandardMaterial({ color: schoolColor, roughness: 0.4, flatShading: true });
      const numFish = 15 + Math.floor(Math.random() * 15);
      const fishMeshes: any[] = [];
      for (let j = 0; j < numFish; j++) {
        const fish = new THREE.Mesh(fishBodyGeo, fishMat);
        fish.position.set((Math.random() - 0.5) * 8, (Math.random() - 0.5) * 3, (Math.random() - 0.5) * 8);
        schoolGroup.add(fish);
        fishMeshes.push({ mesh: fish, offset: Math.random() * Math.PI * 2, baseX: fish.position.x });
      }
      schoolGroup.position.set((Math.random() - 0.5) * 200, -1.5 - Math.random() * 2, 95 + Math.random() * 105);
      schoolGroup.rotation.y = Math.random() * Math.PI * 2;
      scene.add(schoolGroup);
      fishSchools.push({ group: schoolGroup, fishes: fishMeshes, speed: 0.03 + Math.random() * 0.04, turnSpeed: (Math.random() - 0.5) * 0.015, baseY: schoolGroup.position.y, animCycle: Math.random() * Math.PI * 2 });
    }

    // ── Particles ──
    const riverParticleCount = 200;
    const riverParticleGeo = new THREE.BufferGeometry();
    const riverParticlePos = new Float32Array(riverParticleCount * 3);
    const riverParticleData: any[] = [];
    for (let i = 0; i < riverParticleCount; i++) {
      let z = -120 + Math.random() * 210;
      const normZ = (z + 125) / 250;
      const meander = Math.sin(normZ * Math.PI * 3) * 5;
      const currentRiverWidth = 3.0 + normZ * 6.0;
      const xOffset = (Math.random() - 0.5) * currentRiverWidth * 0.6;
      const x = meander + xOffset;
      const zFactor = 1 - normZ;
      let y = 72 * Math.pow(zFactor, 2.0);
      if (normZ > 0.75) {
        const beachFactor = (normZ - 0.75) / 0.25;
        y = THREE.MathUtils.lerp(y, -4.5, beachFactor * beachFactor);
      } else {
        y -= 2.8;
      }
      riverParticlePos[i * 3] = x;
      riverParticlePos[i * 3 + 1] = y;
      riverParticlePos[i * 3 + 2] = z;
      riverParticleData.push({ offset: xOffset / currentRiverWidth, speed: 0.15 + Math.random() * 0.25 });
    }
    riverParticleGeo.setAttribute("position", new THREE.BufferAttribute(riverParticlePos, 3));
    const riverParticleMat = new THREE.PointsMaterial({ color: 0xffffff, size: 0.6, transparent: true, opacity: 0.7, blending: THREE.AdditiveBlending });
    const riverParticles = new THREE.Points(riverParticleGeo, riverParticleMat);
    scene.add(riverParticles);

    // ── Camera position ──
    camera.position.set(0, 200, 400);
    controls.target.set(0, 0, 0);
    controls.update();

    // ── Spawn helpers ──
    const spawnedPlants: THREE.Group[] = [];
    const plantBoundingSpheres: THREE.Sphere[] = [];

    const spawnPlant3D = (plantId: string, position: THREE.Vector3) => {
      const group = buildPlantModel(plantId);
      group.position.copy(position);
      scene.add(group);
      spawnedPlants.push(group);
      // Pre-compute a world-space bounding sphere for fast tap detection
      group.updateMatrixWorld(true);
      const box = new THREE.Box3().setFromObject(group);
      const sphere = new THREE.Sphere();
      box.getBoundingSphere(sphere);
      plantBoundingSpheres.push(sphere);

      // Subtle white outline ring at plant base — child of group so it's
      // automatically removed when the group is removed from the scene
      const scaleF = group.scale.x;
      const worldRingOuter = Math.min(sphere.radius * 0.38, 10);
      const localOuter = worldRingOuter / scaleF;
      const localInner = localOuter * 0.70;
      const ringGeo = new THREE.RingGeometry(localInner, localOuter, 36);
      ringGeo.rotateX(-Math.PI / 2);
      const ringMat = new THREE.MeshBasicMaterial({
        color: 0xffffff,
        transparent: true,
        opacity: 0.30,
        side: THREE.DoubleSide,
        depthWrite: false,
        polygonOffset: true,
        polygonOffsetFactor: -1,
        polygonOffsetUnits: -4,
      });
      const ring = new THREE.Mesh(ringGeo, ringMat);
      ring.position.y = 0.3 / scaleF;
      group.add(ring);
    };

    const removePlant3D = (index: number) => {
      const group = spawnedPlants[index];
      if (group) {
        scene.remove(group);
        spawnedPlants.splice(index, 1);
        plantBoundingSpheres.splice(index, 1);
      }
    };

    // ── Raycaster for drop placement ──
    const raycaster = new THREE.Raycaster();
    const mouse = new THREE.Vector2();

    // ── Animation loop ──
    const clock = new THREE.Clock();
    let animId = 0;

    const animate = () => {
      animId = requestAnimationFrame(animate);
      const time = clock.getElapsedTime();

      controls.update();

      // Smooth camera zoom (lerp)
      const zoomTarget = cameraTargetRef.current;
      if (zoomTarget && zoomTarget.active) {
        const s = sceneRef.current;
        if (s) {
          const cam = s.camera;
          const targetPos = zoomTarget.target.clone();
          const desiredCamPos = targetPos.clone().add(
            new THREE.Vector3(0, zoomTarget.height, zoomTarget.distance)
          );
          const alpha = 0.04; // smooth speed
          cam.position.lerp(desiredCamPos, alpha);
          controls.target.lerp(targetPos, alpha);
          controls.update();
          controls.enablePan = false;
          controls.enableZoom = false;
          controls.enableRotate = false;
        }
      } else if (zoomTarget && !zoomTarget.active) {
        // Returning to overview — controls already re-enabled at deselect time;
        // just smoothly move the camera position back without fighting user input
        const cam = camera;
        const overviewPos = new THREE.Vector3(0, 200, 400);
        cam.position.lerp(overviewPos, 0.06);
        controls.update();
        if (cam.position.distanceTo(overviewPos) < 5) {
          cameraTargetRef.current = null;
        }
      }

      // Stars always hidden (permanent daytime)
      starsMat.opacity = 0;

      // Ocean waves
      const oceanPos = oceanGeo.attributes.position;
      for (let i = 0; i < oceanPos.count; i++) {
        const x = oceanPos.getX(i);
        const z = oceanPos.getZ(i);
        const y = Math.sin(x * 0.05 + time * 0.5) * 0.5 + Math.cos(z * 0.03 + time * 0.3) * 0.3;
        oceanPos.setY(i, (oceanInitialPositions as any)[i * 3 + 1] + y);
      }
      oceanPos.needsUpdate = true;

      // Clouds
      clouds.forEach((cloud) => {
        cloud.mesh.position.x += cloud.speed;
        if (cloud.mesh.position.x > 600) cloud.mesh.position.x = -600;
      });

      // Birds
      birds.forEach((bird) => {
        const bTime = time + bird.offset;
        bird.mesh.position.x += Math.cos(bird.mesh.rotation.y) * bird.speed;
        bird.mesh.position.z += Math.sin(bird.mesh.rotation.y) * bird.speed;
        bird.mesh.position.y = bird.baseY + Math.sin(bTime * 0.5) * 3;
        bird.mesh.rotation.y += bird.turnSpeed;
        bird.rightWing.rotation.x = Math.sin(bTime * bird.flapSpeed) * 0.6;
        bird.leftWing.rotation.x = Math.sin(bTime * bird.flapSpeed) * 0.6;
        if (Math.abs(bird.mesh.position.x) > 300 || Math.abs(bird.mesh.position.z) > 300) {
          bird.mesh.rotation.y += Math.PI;
        }
      });

      // Sea animals
      seaAnimals.forEach((sa) => {
        const sTime = time + sa.animCycle;
        sa.mesh.position.x += Math.cos(sa.mesh.rotation.y) * sa.speed;
        sa.mesh.position.z += Math.sin(sa.mesh.rotation.y) * sa.speed;
        sa.mesh.rotation.y += sa.turnSpeed;
        sa.mesh.position.y = sa.baseY + Math.sin(sTime) * 0.3;
        if (sa.type === "honu") {
          sa.flipperL.rotation.z = Math.sin(sTime * 2) * 0.3;
          sa.flipperR.rotation.z = Math.sin(sTime * 2 + Math.PI) * 0.3;
        } else if (sa.type === "naia") {
          sa.mesh.rotation.z = Math.sin(sTime * 3) * 0.05;
        }
        if (Math.abs(sa.mesh.position.x) > 300 || Math.abs(sa.mesh.position.z) > 400) {
          sa.mesh.rotation.y += Math.PI + (Math.random() - 0.5);
        }
      });

      // Fish schools
      fishSchools.forEach((school) => {
        const sTime = time + school.animCycle;
        school.group.position.x += Math.cos(school.group.rotation.y) * school.speed;
        school.group.position.z += Math.sin(school.group.rotation.y) * school.speed;
        school.group.rotation.y += school.turnSpeed;
        school.group.position.y = school.baseY + Math.sin(sTime) * 0.5;
        school.fishes.forEach((fish: any) => {
          fish.mesh.position.x = fish.baseX + Math.sin(sTime * 2 + fish.offset) * 0.5;
        });
        if (Math.abs(school.group.position.x) > 250 || Math.abs(school.group.position.z) > 250) {
          school.group.rotation.y += Math.PI;
        }
      });

      // River particles
      const rPos = riverParticleGeo.attributes.position;
      for (let i = 0; i < riverParticleCount; i++) {
        let z = rPos.getZ(i);
        z += riverParticleData[i].speed;
        if (z > 125) z = -120;
        const normZ = (z + 125) / 250;
        const meander = Math.sin(normZ * Math.PI * 3) * 5;
        const currentRiverWidth = 3.0 + normZ * 6.0;
        const x = meander + riverParticleData[i].offset * currentRiverWidth;
        rPos.setX(i, x);
        rPos.setZ(i, z);
      }
      rPos.needsUpdate = true;

      renderer.render(scene, camera);
    };
    animate();

    // Resize handler
    const onResize = () => {
      const w = container.clientWidth;
      const h = container.clientHeight;
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h);
    };
    window.addEventListener("resize", onResize);

    // Cancel any auto-zoom the moment the user manually interacts with the camera
    const onUserInteract = () => {
      cameraTargetRef.current = null;
    };
    controls.addEventListener("start", onUserInteract);

    // Canvas tap handler: bounding-sphere check instead of recursive mesh raycast
    const onCanvasTap = (e: PointerEvent) => {
      const s = sceneRef.current;
      if (!s) return;
      // If zoomed in, tapping empty ground zooms back out
      if (cameraTargetRef.current?.active) {
        cameraTargetRef.current.active = false;
        // Re-enable controls immediately — don't make user wait for the lerp to finish
        controls.enablePan = true;
        controls.enableZoom = true;
        controls.enableRotate = true;
        controls.target.set(0, 0, 0);
        controls.update();
        setSelectedPlantIdx(null);
        return;
      }
      if (s.spawnedPlants.length === 0) return;
      const rect = s.renderer.domElement.getBoundingClientRect();
      s.mouse.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
      s.mouse.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;
      s.raycaster.setFromCamera(s.mouse, s.camera);
      const ray = s.raycaster.ray;
      // O(n) sphere check — no recursive child traversal
      for (let i = 0; i < s.spawnedPlants.length; i++) {
        if (ray.intersectsSphere(s.plantBoundingSpheres[i])) {
          const sphere = s.plantBoundingSpheres[i];
          const fov = s.camera.fov * (Math.PI / 180);
          const dist = sphere.radius / Math.tan(fov / 2) * 1.5;
          cameraTargetRef.current = {
            target: sphere.center.clone(),
            distance: dist,
            height: 0,
            active: true,
          };
          setSelectedPlantIdx(i);
          return;
        }
      }
    };
    renderer.domElement.addEventListener("pointerdown", onCanvasTap);

    sceneRef.current = { scene, camera, renderer, controls, terrain, backdrop, raycaster, mouse, spawnedPlants, plantBoundingSpheres, spawnPlant3D, removePlant3D, cleanup: () => {
      cancelAnimationFrame(animId);
      window.removeEventListener("resize", onResize);
      renderer.domElement.removeEventListener("pointerdown", onCanvasTap);
      controls.removeEventListener("start", onUserInteract);
      controls.dispose();
      renderer.dispose();
      if (renderer.domElement.parentElement) renderer.domElement.parentElement.removeChild(renderer.domElement);
    }};

    // Restore previously placed plants into the 3D scene
    for (const pp of placedPlants) {
      if (pp.wx !== undefined && pp.wy !== undefined && pp.wz !== undefined) {
        spawnPlant3D(pp.plantId, new THREE.Vector3(pp.wx, pp.wy, pp.wz));
      }
    }

    return () => {
      sceneRef.current?.cleanup();
      sceneRef.current = null;
    };
  }, [webglAvailable]);

  /* ── Handle drop from React inventory onto 3D scene ── */
  const handleDrop = useCallback((clientX: number, clientY: number, plantId: string, xPct?: number, yPct?: number) => {
    const s = sceneRef.current;
    if (!s) return false;

    const rect = s.renderer.domElement.getBoundingClientRect();
    s.mouse.x = ((clientX - rect.left) / rect.width) * 2 - 1;
    s.mouse.y = -((clientY - rect.top) / rect.height) * 2 + 1;

    s.raycaster.setFromCamera(s.mouse, s.camera);
    const intersects = s.raycaster.intersectObjects([s.terrain, s.backdrop]);

    if (intersects.length > 0) {
      const point = intersects[0].point;
      if (point.y > -4.5) {
        let zone: Zone;
        if (point.y > 20) zone = 'uka';
        else if (point.y > 3.5) zone = 'kula';
        else zone = 'kai';

        const expected = getExpectedZone(plantId);
        if (zone !== expected) {
          const name = PLANT_DATABASE.find(p => p.id === plantId)?.name ?? plantId;
          showZoneError(`${name} lives in ${expected} — try there!`);
          return false;
        }

        const _xPct = xPct ?? (clientX / window.innerWidth) * 100;
        const _yPct = yPct ?? (clientY / window.innerHeight) * 100;
        const success = placePlant(plantId, zone, _xPct, _yPct, point.x, point.y, point.z);
        if (success) {
          s.spawnPlant3D(plantId, point);
        }
        return success;
      }
    }
    return false;
  }, [placePlant, showZoneError]);

  /* ── Drag end handler for inventory items ── */
  const handleDragEnd = (e: any, info: any, plantId: string) => {
    const point = info.point;
    const xPct = (point.x / window.innerWidth) * 100;
    const yPct = (point.y / window.innerHeight) * 100;
    handleDrop(point.x, point.y, plantId, xPct, yPct);
  };

  const dedupedInventory = deduplicateInventory(inventory);
  const getPlacedForZone = (zone: Zone) => placedPlants.filter(p => p.zone === zone);

  /* ── 2D drag handler (used when WebGL unavailable) ── */
  const handleDragEnd2D = (e: any, info: any, plantId: string) => {
    const y = info.point.y;
    const x = info.point.x;
    const vw = window.innerWidth;
    const vh = window.innerHeight;
    let targetZone: Zone | null = null;
    if (y < vh * 0.4) targetZone = "uka";
    else if (y < vh * 0.7) targetZone = "kula";
    else if (y < vh * 0.9) targetZone = "kai";
    if (targetZone) {
      const plant = PLANT_DATABASE.find(p => p.id === plantId);
      const xPct = (x / vw) * 100;
      const yPct = (y / vh) * 100;
      const success = placePlant(plantId, targetZone, xPct, yPct);
      if (!success) {
        showZoneError(`${plant?.name ?? plantId} lives in ${plant?.zone} — try there!`);
      }
    }
  };

  /* ── Shared inventory tray ── */
  const inventoryTray = (
    <div className="absolute bottom-20 left-0 right-0 flex items-end px-3 pb-2 pointer-events-none z-20">
      <button
        onClick={() => setInventoryOpen((o) => !o)}
        className="relative shrink-0 w-14 h-14 rounded-2xl shadow-xl flex items-center justify-center pointer-events-auto z-20 transition-transform active:scale-95"
        style={{ background: "rgba(246,241,231,0.97)", border: "1.5px solid rgba(47,111,78,0.22)" }}
        aria-label="Toggle inventory"
      >
        <Leaf size={22} style={{ color: "#2F6F4E" }} />
        {inventory.length > 0 && (
          <span className="absolute -top-1.5 -right-1.5 min-w-[20px] h-5 px-1 rounded-full text-[11px] font-bold flex items-center justify-center"
            style={{ background: "#2F6F4E", color: "#F6F1E7" }}>
            {inventory.length}
          </span>
        )}
      </button>

      <AnimatePresence>
        {inventoryOpen && (
          <motion.div
            key="tray"
            initial={{ opacity: 0, width: 0 }}
            animate={{ opacity: 1, width: "auto" }}
            exit={{ opacity: 0, width: 0 }}
            transition={{ type: "spring", damping: 28, stiffness: 260 }}
            className="ml-2 pointer-events-auto overflow-hidden"
          >
            <div className="flex items-end gap-3 overflow-x-auto pb-1 pt-1 pr-2 hide-scrollbar"
              style={{ maxWidth: "calc(100vw - 80px)" }}>
              {dedupedInventory.length === 0 ? (
                <div className="h-14 px-4 flex items-center rounded-2xl text-sm font-medium whitespace-nowrap"
                  style={{ background: "rgba(246,241,231,0.92)", color: "rgba(38,52,47,0.45)", border: "1.5px dashed rgba(47,111,78,0.25)" }}>
                  No plants yet — go scan!
                </div>
              ) : (
                dedupedInventory.map(({ plant, count }) => (
                  <motion.div
                    key={plant.id}
                    drag="y"
                    dragSnapToOrigin
                    onDragStart={() => setDragGhost({ plant, x: 0, y: 0 })}
                    onDrag={(_e, info) => setDragGhost({ plant, x: info.point.x, y: info.point.y })}
                    onDragEnd={(e, info) => {
                      setDragGhost(null);
                      webglAvailable ? handleDragEnd(e, info, plant.id) : handleDragEnd2D(e, info, plant.id);
                    }}
                    whileDrag={{ opacity: 0.3 }}
                    className="relative shrink-0 w-20 h-20 rounded-2xl overflow-hidden shadow-lg cursor-grab active:cursor-grabbing"
                    style={{ border: "2px solid rgba(47,111,78,0.25)" }}
                  >
                    <PlantPreview plantId={plant.id} />
                    {/* Name label at bottom */}
                    <div className="absolute bottom-0 left-0 right-0 py-0.5 text-center text-[9px] font-bold pointer-events-none"
                      style={{ background: "rgba(38,52,47,0.65)", color: "#F6F1E7", lineHeight: 1.1 }}>
                      {plant.name}
                    </div>
                    {count > 1 && (
                      <span className="absolute top-0.5 right-0.5 min-w-[18px] h-[18px] px-1 rounded-full text-[10px] font-bold flex items-center justify-center pointer-events-none"
                        style={{ background: "rgba(47,111,78,0.90)", color: "#F6F1E7" }}>
                        {count}
                      </span>
                    )}
                  </motion.div>
                ))
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );

  /* ── Selected-plant close-up: only Dig Up button top-right ── */
  const selectedPlant = selectedPlantIdx !== null ? placedPlants[selectedPlantIdx] : null;

  const handleDigUp = () => {
    if (selectedPlantIdx !== null) {
      if (cameraTargetRef.current) {
        cameraTargetRef.current.active = false;
      }
      // Re-enable controls immediately so the user isn't locked out after digging
      const s = sceneRef.current;
      if (s) {
        s.controls.enablePan = true;
        s.controls.enableZoom = true;
        s.controls.enableRotate = true;
        s.controls.target.set(0, 0, 0);
        s.controls.update();
      }
      s?.removePlant3D(selectedPlantIdx);
      removePlacedPlant(selectedPlantIdx);
    }
    setSelectedPlantIdx(null);
  };

  const plantNameLabel = selectedPlant && cameraTargetRef.current?.active
    ? PLANT_DATABASE.find(p => p.id === selectedPlant.plantId)
    : null;

  // Zoomed-in UI: name at top center + Dig Up at top right
  const plantDetailOverlay = selectedPlant && cameraTargetRef.current?.active && plantNameLabel ? (
    <>
      {/* Name label — top center */}
      <motion.div
        initial={{ opacity: 0, y: -12 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -12 }}
        transition={{ type: "spring", damping: 20, stiffness: 260 }}
        className="absolute top-4 left-1/2 -translate-x-1/2 z-[200]"
      >
        <div
          className="px-5 py-2 rounded-full text-sm font-bold shadow-xl whitespace-nowrap"
          style={{ background: "rgba(246,241,231,0.95)", color: "#26342F", border: "2px solid rgba(47,111,78,0.2)" }}
        >
          {plantNameLabel.name}
        </div>
      </motion.div>
      {/* Dig Up button — top right */}
      <motion.div
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.8 }}
        transition={{ type: "spring", damping: 20, stiffness: 260 }}
        className="absolute top-4 right-4 z-[200]"
      >
        <button
          onClick={handleDigUp}
          className="px-4 py-2 rounded-full text-sm font-bold shadow-xl transition-transform active:scale-90"
          style={{ background: "#b94040", color: "#fff", border: "2.5px solid rgba(255,255,255,0.5)", whiteSpace: "nowrap" }}
        >
          Dig Up
        </button>
      </motion.div>
    </>
  ) : null;

  /* ── 2D fallback (no WebGL) ── */
  if (webglAvailable === false) {
    return (
      <div className="relative w-full h-full pb-20 overflow-hidden flex flex-col" style={{ background: "#26342F" }}>
        <div className="flex-1 flex flex-col w-full relative">
          {/* UKA */}
          <div className="flex-[0.4] w-full relative overflow-hidden"
            style={{ background: "linear-gradient(180deg, #1a3d2b 0%, #2F6F4E 100%)" }}>
            <div className="absolute top-8 left-[-10%] w-[60%] h-[130%] rounded-[100%] opacity-40" style={{ background: "#1a3d2b" }} />
            <div className="absolute top-16 right-[-18%] w-[75%] h-[150%] rounded-[100%] opacity-35" style={{ background: "#122a1e" }} />
            <div className="absolute bottom-0 left-[10%] w-[35%] h-[55%] rounded-[100%] opacity-25" style={{ background: "#7BC96F" }} />
            <div className="absolute bottom-0 left-[40%] w-[40%] h-[45%] rounded-[100%] opacity-20" style={{ background: "#7BC96F" }} />
            <div className="absolute top-[30%] left-[44%] w-5 h-full blur-sm opacity-50"
              style={{ background: "linear-gradient(180deg, #a8d8f0 0%, #6fb8e8 100%)", transform: "rotate(-8deg)" }} />
            <div className="absolute top-4 right-4 px-3 py-1 rounded-full text-xs font-bold z-10"
              style={{ background: "rgba(246,241,231,0.18)", backdropFilter: "blur(8px)", color: "#F6F1E7" }}>Uka</div>
          </div>

          {/* KULA */}
          <div className="flex-[0.3] w-full relative overflow-hidden"
            style={{ background: "linear-gradient(180deg, #3d8f62 0%, #7BC96F 100%)" }}>
            <div className="absolute inset-0 opacity-[0.07]"
              style={{ backgroundImage: "repeating-linear-gradient(45deg,transparent,transparent 10px,#26342F 10px,#26342F 20px)" }} />
            <div className="absolute top-0 left-[38%] w-6 h-full blur-sm opacity-40"
              style={{ background: "linear-gradient(180deg, #a8d8f0 0%, #6fb8e8 100%)", transform: "rotate(-4deg)" }} />
            <div className="absolute top-[28%] left-[18%] w-7 h-5 rounded-sm opacity-60" style={{ background: "#2F6F4E" }} />
            <div className="absolute top-[15%] left-[17%] w-9 h-5 opacity-60"
              style={{ background: "#26342F", clipPath: "polygon(50% 0%, 0% 100%, 100% 100%)" }} />
            <div className="absolute top-4 right-4 px-3 py-1 rounded-full text-xs font-bold z-10"
              style={{ background: "rgba(246,241,231,0.20)", backdropFilter: "blur(8px)", color: "#F6F1E7" }}>Kula</div>
          </div>

          {/* KAI */}
          <div className="flex-[0.3] w-full relative overflow-hidden"
            style={{ background: "linear-gradient(180deg, #c8b98a 0%, #5ba3c9 55%, #2a6fa8 100%)" }}>
            <div className="absolute top-0 left-0 right-0 h-5 blur-sm opacity-80" style={{ background: "#d4c088" }} />
            <div className="absolute top-0 left-[35%] w-10 h-[45%] blur-sm opacity-35"
              style={{ background: "#a8d8f0", transform: "rotate(5deg)" }} />
            <div className="absolute top-4 right-4 px-3 py-1 rounded-full text-xs font-bold z-10"
              style={{ background: "rgba(246,241,231,0.20)", backdropFilter: "blur(8px)", color: "#F6F1E7" }}>Kai</div>
            {/* 2D water sparkles */}
            <div className="absolute inset-0 pointer-events-none z-0">
              {Array.from({ length: 18 }).map((_, i) => (
                <div key={i} className="absolute rounded-full"
                  style={{
                    width: 2 + Math.random() * 2,
                    height: 2 + Math.random() * 2,
                    left: `${Math.random() * 100}%`,
                    top: `${10 + Math.random() * 90}%`,
                    background: 'rgba(255,255,255,0.6)',
                    animation: `kaiSparkle ${1.5 + Math.random() * 2.5}s ease-in-out infinite`,
                    animationDelay: `${Math.random() * 3}s`,
                  }}
                />
              ))}
            </div>
          </div>
        </div>

        {/* Placed plant badges — exact drop positions */}
        <div className="absolute inset-0 z-10">
          {placedPlants.map((p, i) => {
            const plant = PLANT_DATABASE.find(db => db.id === p.plantId);
            return plant ? (
              <motion.button
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                key={i}
                onClick={() => setSelectedPlantIdx(i)}
                className="absolute w-14 h-14 rounded-full overflow-hidden shadow-lg"
                style={{
                  left: `${p.x ?? 10}%`,
                  top: `${p.y ?? 50}%`,
                  transform: 'translate(-50%, -50%)',
                  border: "3px solid rgba(246,241,231,0.5)",
                  cursor: "pointer",
                }}
              >
                <img src={plant.image} alt={plant.name} className="w-full h-full object-cover" />
              </motion.button>
            ) : null;
          })}
        </div>

        {plantDetailOverlay}
        {inventoryTray}
        {/* Drag ghost */}
        {dragGhost && dragGhost.x !== 0 && (
          <div
            className="fixed pointer-events-none z-[999] rounded-2xl overflow-hidden shadow-2xl"
            style={{
              width: 72, height: 72,
              left: dragGhost.x - 36,
              top: dragGhost.y - 36,
              border: "3px solid rgba(92,200,130,0.85)",
            }}
          >
            <img src={dragGhost.plant.image} alt={dragGhost.plant.name} className="w-full h-full object-cover" />
          </div>
        )}
      </div>
    );
  }

  /* ── 3D view (WebGL available or still detecting) ── */
  return (
    <div className="relative w-full h-full overflow-hidden" style={{ background: "#26342F" }}>
      {/* 3D Canvas container */}
      <div ref={containerRef} className="absolute inset-0 w-full h-full" />

      {/* Zone labels overlay */}
      <div className="absolute inset-0 pointer-events-none z-10">
        <div className="absolute top-4 right-4 px-3 py-1 rounded-full text-xs font-bold"
          style={{ background: "rgba(246,241,231,0.18)", backdropFilter: "blur(8px)", color: "#F6F1E7" }}>
          Uka
        </div>
        <div className="absolute top-[40%] right-4 px-3 py-1 rounded-full text-xs font-bold"
          style={{ background: "rgba(246,241,231,0.18)", backdropFilter: "blur(8px)", color: "#F6F1E7" }}>
          Kula
        </div>
        <div className="absolute bottom-[30%] right-4 px-3 py-1 rounded-full text-xs font-bold"
          style={{ background: "rgba(246,241,231,0.18)", backdropFilter: "blur(8px)", color: "#F6F1E7" }}>
          Kai
        </div>

        {/* Placed plants are rendered inside the 3D canvas */}
      </div>

      {plantDetailOverlay}
      {inventoryTray}

      {/* Zone error banner — fully controlled, no toast/animation weirdness */}
      <AnimatePresence>
        {zoneError && (
          <motion.div
            key="zone-error"
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.2 }}
            className="absolute top-4 left-1/2 -translate-x-1/2 z-[300] pointer-events-none"
          >
            <div
              className="px-5 py-2.5 rounded-full text-sm font-bold shadow-xl whitespace-nowrap"
              style={{ background: "#b94040", color: "#fff", border: "2px solid rgba(255,255,255,0.3)" }}
            >
              ⚠️ {zoneError}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Drag ghost */}
      {dragGhost && dragGhost.x !== 0 && (
        <div
          className="fixed pointer-events-none z-[999] rounded-2xl overflow-hidden shadow-2xl"
          style={{
            width: 72, height: 72,
            left: dragGhost.x - 36,
            top: dragGhost.y - 36,
            border: "3px solid rgba(92,200,130,0.85)",
            background: "#1a2b1f",
          }}
        >
          <PlantPreview plantId={dragGhost.plant.id} className="w-full h-full" />
        </div>
      )}
    </div>
  );
}
