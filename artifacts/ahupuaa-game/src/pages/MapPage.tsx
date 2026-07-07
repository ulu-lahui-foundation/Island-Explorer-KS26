import { useRef, useEffect, useState, useCallback } from "react";
import { useGame, Zone, PLANT_DATABASE, Plant } from "@/lib/GameContext";
import { motion, AnimatePresence } from "framer-motion";
import { Leaf } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import * as THREE from "three";
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
  const { toast } = useToast();

  const [webglAvailable, setWebglAvailable] = useState<boolean | null>(null);

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
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    container.appendChild(renderer.domElement);

    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.05;
    controls.maxPolarAngle = Math.PI / 2 - 0.05;
    controls.minDistance = 15;
    controls.maxDistance = 1200;
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
    scene.add(sunMesh);

    const moonMesh = new THREE.Mesh(
      new THREE.SphereGeometry(18, 32, 32),
      new THREE.MeshBasicMaterial({ color: 0xddeeff }),
    );
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
    dirLight.castShadow = true;
    dirLight.shadow.mapSize.set(2048, 2048);
    dirLight.shadow.camera.near = 0.1;
    dirLight.shadow.camera.far = 1500;
    dirLight.shadow.camera.left = -200;
    dirLight.shadow.camera.right = 200;
    dirLight.shadow.camera.top = 200;
    dirLight.shadow.camera.bottom = -200;
    dirLight.shadow.bias = -0.001;
    scene.add(dirLight);

    const moonLight = new THREE.DirectionalLight(0x88bbff, 0);
    moonLight.castShadow = true;
    moonLight.shadow.mapSize.set(2048, 2048);
    moonLight.shadow.camera.copy(dirLight.shadow.camera);
    moonLight.shadow.bias = -0.001;
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
    const oceanGeo = new THREE.PlaneGeometry(2000, 2000, 64, 64);
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
        puff.castShadow = true;
        puff.receiveShadow = true;
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
    camera.position.set(0, 100, 200);
    controls.target.set(0, 30, 0);
    controls.update();

    // ── Spawn helpers ──
    const spawnedPlants: THREE.Group[] = [];

    // ── Ohia Lehua procedural tree ──
    function createOhiaTree() {
      const treeGroup = new THREE.Group();
      const trunkMaterial = new THREE.MeshStandardMaterial({ color: 0x8a8377, roughness: 1.0 });
      const leafMaterial = new THREE.MeshStandardMaterial({ color: 0x2b3d26, roughness: 0.9 });
      const blossomMaterial = new THREE.MeshStandardMaterial({ color: 0xe61515, roughness: 0.4 });
      const maxDepth = 4;

      function buildBranch(parent: THREE.Object3D, length: number, radius: number, depth: number) {
        const branchGroup = new THREE.Group();
        parent.add(branchGroup);
        const branchGeo = new THREE.CylinderGeometry(radius * 0.65, radius, length, 12);
        const branchMesh = new THREE.Mesh(branchGeo, trunkMaterial);
        branchMesh.position.y = length / 2;
        branchMesh.castShadow = true;
        branchMesh.receiveShadow = true;
        branchGroup.add(branchMesh);
        const tip = new THREE.Group();
        tip.position.y = length;
        branchGroup.add(tip);
        if (depth > 0) {
          const numChildren = 2 + Math.floor(Math.random() * 3);
          for (let i = 0; i < numChildren; i++) {
            const childRadius = radius * 0.7;
            const childLength = length * (0.6 + Math.random() * 0.3);
            const angleX = (Math.random() - 0.5) * 1.5;
            const angleZ = (Math.random() - 0.5) * 1.5;
            const angleY = Math.random() * Math.PI * 2;
            const childBranch = buildBranch(tip, childLength, childRadius, depth - 1);
            childBranch.rotation.set(angleX, angleY, angleZ);
          }
        } else {
          addFoliage(tip);
        }
        return branchGroup;
      }

      function addFoliage(parent: THREE.Object3D) {
        const numLeafClusters = 8 + Math.floor(Math.random() * 6);
        for (let l = 0; l < numLeafClusters; l++) {
          const leafRadius = 0.4 + Math.random() * 0.6;
          const leafGeo = new THREE.SphereGeometry(leafRadius, 5, 5);
          const leafMesh = new THREE.Mesh(leafGeo, leafMaterial);
          leafMesh.position.set(
            (Math.random() - 0.5) * 2.0,
            (Math.random() - 0.5) * 1.5,
            (Math.random() - 0.5) * 2.0
          );
          leafMesh.castShadow = true;
          parent.add(leafMesh);
        }
        const numBlossoms = 4 + Math.floor(Math.random() * 5);
        const stamenGeo = new THREE.CylinderGeometry(0.015, 0.015, 0.6, 3);
        stamenGeo.translate(0, 0.3, 0);
        for (let i = 0; i < numBlossoms; i++) {
          const blossomGroup = new THREE.Group();
          blossomGroup.position.set(
            (Math.random() - 0.5) * 2.5,
            0.5 + Math.random() * 1.5,
            (Math.random() - 0.5) * 2.5
          );
          const numStamens = 30 + Math.floor(Math.random() * 20);
          for (let s = 0; s < numStamens; s++) {
            const stamen = new THREE.Mesh(stamenGeo, blossomMaterial);
            stamen.rotation.x = Math.random() * Math.PI;
            stamen.rotation.y = Math.random() * Math.PI * 2;
            blossomGroup.add(stamen);
          }
          parent.add(blossomGroup);
        }
      }

      buildBranch(treeGroup, 4.0, 0.8, maxDepth);
      return treeGroup;
    }

    // ── Naupaka Kahakai procedural bush ──
    function createNaupakaBush() {
      const bushGroup = new THREE.Group();
      const stemMaterial = new THREE.MeshStandardMaterial({ color: 0x9c9681, roughness: 0.9 });
      const leafMaterial = new THREE.MeshStandardMaterial({ color: 0x6e9438, roughness: 0.5 });
      const flowerMaterial = new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.7 });
      const maxDepth = 3;

      function buildStem(parent: THREE.Object3D, length: number, radius: number, depth: number) {
        const stemGroup = new THREE.Group();
        parent.add(stemGroup);
        const stemGeo = new THREE.CylinderGeometry(radius * 0.7, radius, length, 8);
        const stemMesh = new THREE.Mesh(stemGeo, stemMaterial);
        stemMesh.position.y = length / 2;
        stemMesh.castShadow = true;
        stemMesh.receiveShadow = true;
        stemGroup.add(stemMesh);
        const tip = new THREE.Group();
        tip.position.y = length;
        stemGroup.add(tip);
        if (depth > 0) {
          const numChildren = 2 + Math.floor(Math.random() * 3);
          for (let i = 0; i < numChildren; i++) {
            const childRadius = radius * 0.75;
            const childLength = length * (0.7 + Math.random() * 0.3);
            const angleX = (Math.random() - 0.5) * 1.0;
            const angleZ = (Math.random() - 0.5) * 1.0;
            const angleY = Math.random() * Math.PI * 2;
            const childStem = buildStem(tip, childLength, childRadius, depth - 1);
            childStem.rotation.set(angleX, angleY, angleZ);
          }
        } else {
          addFoliageAndFlowers(tip);
        }
        return stemGroup;
      }

      function addFoliageAndFlowers(parent: THREE.Object3D) {
        const numLeaves = 6 + Math.floor(Math.random() * 5);
        const baseLeafGeo = new THREE.SphereGeometry(0.5, 8, 8);
        baseLeafGeo.scale(0.8, 1.5, 0.2);
        baseLeafGeo.translate(0, 0.75, 0);
        for (let l = 0; l < numLeaves; l++) {
          const leafMesh = new THREE.Mesh(baseLeafGeo, leafMaterial);
          const angle = (l / numLeaves) * Math.PI * 2;
          leafMesh.rotation.y = angle;
          leafMesh.rotation.x = 0.5 + Math.random() * 0.5;
          leafMesh.castShadow = true;
          parent.add(leafMesh);
        }
        if (Math.random() > 0.1) {
          const numFlowers = 2 + Math.floor(Math.random() * 4);
          const petalGeo = new THREE.SphereGeometry(0.15, 6, 6);
          petalGeo.scale(0.5, 2.0, 0.2);
          petalGeo.translate(0, 0.25, 0);
          for (let f = 0; f < numFlowers; f++) {
            const flowerGroup = new THREE.Group();
            flowerGroup.position.set(
              (Math.random() - 0.5) * 0.4,
              0.2 + Math.random() * 0.4,
              (Math.random() - 0.5) * 0.4
            );
            const numPetals = 5;
            for (let p = 0; p < numPetals; p++) {
              const petal = new THREE.Mesh(petalGeo, flowerMaterial);
              const petalAngle = (p / (numPetals - 1)) * Math.PI;
              petal.rotation.z = petalAngle - (Math.PI / 2);
              petal.rotation.x = 0.5;
              flowerGroup.add(petal);
            }
            flowerGroup.rotation.y = Math.random() * Math.PI * 2;
            parent.add(flowerGroup);
          }
        }
      }

      const numMainStems = 5 + Math.floor(Math.random() * 3);
      for (let i = 0; i < numMainStems; i++) {
        const length = 1.5 + Math.random() * 1.0;
        const mainStem = buildStem(bushGroup, length, 0.3, maxDepth);
        const baseAngle = (i / numMainStems) * Math.PI * 2;
        mainStem.rotation.y = baseAngle;
        mainStem.rotation.z = 0.4 + Math.random() * 0.6;
      }
      return bushGroup;
    }

    const spawnPlant3D = (plantId: string, position: THREE.Vector3) => {
      const group = new THREE.Group();
      group.position.copy(position);
      group.scale.set(15, 15, 15);

      // Simple 3D plant representation based on ID
      const plantMat = new THREE.MeshStandardMaterial({ color: 0x4CAF50, roughness: 0.7, flatShading: true });
      const trunkMat = new THREE.MeshStandardMaterial({ color: 0x5D4037, roughness: 0.9, flatShading: true });
      const flowerMat = new THREE.MeshStandardMaterial({ color: 0xE91E63, roughness: 0.6, flatShading: true });

      if (plantId === "kalo" || plantId === "taro") {
        // Heart-shaped leaves
        for (let i = 0; i < 3; i++) {
          const leaf = new THREE.Mesh(new THREE.SphereGeometry(0.4, 8, 8), plantMat);
          leaf.scale.set(1, 0.1, 1.2);
          leaf.position.set(Math.cos((i / 3) * Math.PI * 2) * 0.3, 0.4 + i * 0.1, Math.sin((i / 3) * Math.PI * 2) * 0.3);
          leaf.rotation.x = -0.3;
          group.add(leaf);
        }
        const stem = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.05, 0.4), plantMat);
        stem.position.y = 0.2;
        group.add(stem);
      } else if (plantId === "kukui") {
        // Canopy tree
        const trunk = new THREE.Mesh(new THREE.CylinderGeometry(0.15, 0.2, 1.5, 6), trunkMat);
        trunk.position.y = 0.75;
        group.add(trunk);
        const canopy = new THREE.Mesh(new THREE.DodecahedronGeometry(0.8, 1), plantMat);
        canopy.position.y = 1.6;
        group.add(canopy);
      } else if (plantId === "ohia") {
        // ʻŌhiʻa lehua procedural tree
        const ohia = createOhiaTree();
        group.add(ohia);
        group.scale.set(5, 5, 5); // smaller scale for the larger tree geometry
      } else if (plantId === "naupaka") {
        // Naupaka Kahakai procedural bush with half-flowers
        const naupaka = createNaupakaBush();
        group.add(naupaka);
        group.scale.set(8, 8, 8);
      } else if (plantId === "pohinahina") {
        // Low shrub (placeholder for now)
        const bush = new THREE.Mesh(new THREE.DodecahedronGeometry(0.4, 0), plantMat);
        bush.position.y = 0.25;
        bush.scale.set(1.2, 0.6, 1.2);
        group.add(bush);
      } else if (plantId === "palapalai" || plantId === "hapuu") {
        // Fern
        for (let i = 0; i < 5; i++) {
          const frond = new THREE.Mesh(new THREE.PlaneGeometry(0.3, 0.8), plantMat);
          frond.position.set((Math.random() - 0.5) * 0.3, 0.3 + Math.random() * 0.2, (Math.random() - 0.5) * 0.3);
          frond.rotation.y = Math.random() * Math.PI * 2;
          frond.rotation.x = -0.4;
          group.add(frond);
        }
      } else if (plantId === "loulu") {
        // Palm
        const trunk = new THREE.Mesh(new THREE.CylinderGeometry(0.1, 0.15, 2, 6), trunkMat);
        trunk.position.y = 1;
        group.add(trunk);
        for (let i = 0; i < 6; i++) {
          const frond = new THREE.Mesh(new THREE.PlaneGeometry(0.2, 1), plantMat);
          frond.position.set(Math.cos((i / 6) * Math.PI * 2) * 0.3, 2, Math.sin((i / 6) * Math.PI * 2) * 0.3);
          frond.rotation.y = (i / 6) * Math.PI * 2;
          frond.rotation.x = -0.6;
          group.add(frond);
        }
      } else if (plantId === "ilima") {
        // Yellow flower bush
        const bush = new THREE.Mesh(new THREE.DodecahedronGeometry(0.3, 0), plantMat);
        bush.position.y = 0.2;
        bush.scale.set(1, 0.7, 1);
        group.add(bush);
        for (let i = 0; i < 4; i++) {
          const flower = new THREE.Mesh(new THREE.SphereGeometry(0.08, 6, 6), new THREE.MeshStandardMaterial({ color: 0xFFD700, roughness: 0.5 }));
          flower.position.set((Math.random() - 0.5) * 0.4, 0.4 + Math.random() * 0.2, (Math.random() - 0.5) * 0.4);
          group.add(flower);
        }
      } else if (plantId === "aalii") {
        // Shrub with seed pods
        const bush = new THREE.Mesh(new THREE.DodecahedronGeometry(0.35, 0), plantMat);
        bush.position.y = 0.3;
        group.add(bush);
        for (let i = 0; i < 6; i++) {
          const pod = new THREE.Mesh(new THREE.CapsuleGeometry(0.03, 0.15, 4, 4), new THREE.MeshStandardMaterial({ color: 0x8B0000, roughness: 0.6 }));
          pod.position.set((Math.random() - 0.5) * 0.5, 0.5 + Math.random() * 0.2, (Math.random() - 0.5) * 0.5);
          group.add(pod);
        }
      } else if (plantId === "ulu") {
        // Breadfruit tree
        const trunk = new THREE.Mesh(new THREE.CylinderGeometry(0.2, 0.25, 1.8, 6), trunkMat);
        trunk.position.y = 0.9;
        group.add(trunk);
        const canopy = new THREE.Mesh(new THREE.DodecahedronGeometry(1, 1), plantMat);
        canopy.position.y = 2.2;
        group.add(canopy);
        for (let i = 0; i < 3; i++) {
          const fruit = new THREE.Mesh(new THREE.SphereGeometry(0.15, 6, 6), new THREE.MeshStandardMaterial({ color: 0x8BC34A, roughness: 0.6 }));
          fruit.position.set((Math.random() - 0.5) * 0.8, 2 + Math.random() * 0.3, (Math.random() - 0.5) * 0.8);
          group.add(fruit);
        }
      } else if (plantId === "lai") {
        // Ti plant
        for (let i = 0; i < 5; i++) {
          const leaf = new THREE.Mesh(new THREE.PlaneGeometry(0.15, 0.8), plantMat);
          leaf.position.set((Math.random() - 0.5) * 0.2, 0.3 + i * 0.15, (Math.random() - 0.5) * 0.2);
          leaf.rotation.y = Math.random() * Math.PI * 2;
          leaf.rotation.x = -0.2;
          group.add(leaf);
        }
      } else {
        // Generic plant
        const bush = new THREE.Mesh(new THREE.DodecahedronGeometry(0.3, 0), plantMat);
        bush.position.y = 0.25;
        group.add(bush);
      }

      group.traverse((child) => {
        if (child instanceof THREE.Mesh) {
          child.castShadow = true;
          child.receiveShadow = true;
        }
      });
      scene.add(group);
      spawnedPlants.push(group);
    };

    const removePlant3D = (index: number) => {
      const group = spawnedPlants[index];
      if (group) {
        scene.remove(group);
        spawnedPlants.splice(index, 1);
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

      // Sun / Moon orbit
      const sunAngle = time * 0.1;
      sunMesh.position.set(Math.cos(sunAngle) * 500, Math.sin(sunAngle) * 300 + 100, Math.sin(sunAngle) * 200);
      dirLight.position.copy(sunMesh.position);
      moonMesh.position.set(Math.cos(sunAngle + Math.PI) * 500, Math.sin(sunAngle + Math.PI) * 300 + 100, Math.sin(sunAngle + Math.PI) * 200);
      moonLight.position.copy(moonMesh.position);

      // Stars visibility based on sun height
      const sunHeight = sunMesh.position.y;
      starsMat.opacity = Math.max(0, 1 - (sunHeight + 50) / 200);

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

    // Canvas tap handler: raycast against spawned plant meshes
    const onCanvasTap = (e: PointerEvent) => {
      const s = sceneRef.current;
      if (!s || s.spawnedPlants.length === 0) return;
      const rect = s.renderer.domElement.getBoundingClientRect();
      s.mouse.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
      s.mouse.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;
      s.raycaster.setFromCamera(s.mouse, s.camera);
      // Check each spawned plant group
      for (let i = 0; i < s.spawnedPlants.length; i++) {
        const intersects = s.raycaster.intersectObjects(s.spawnedPlants[i].children, true);
        if (intersects.length > 0) {
          setSelectedPlantIdx(i);
          return;
        }
      }
    };
    renderer.domElement.addEventListener("pointerdown", onCanvasTap);

    sceneRef.current = { scene, camera, renderer, controls, terrain, backdrop, raycaster, mouse, spawnedPlants, spawnPlant3D, removePlant3D, cleanup: () => {
      cancelAnimationFrame(animId);
      window.removeEventListener("resize", onResize);
      renderer.domElement.removeEventListener("pointerdown", onCanvasTap);
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
          toast({
            title: "You can't plant it there!",
            description: `${PLANT_DATABASE.find(p => p.id === plantId)?.name} lives in ${expected}.`,
            variant: "destructive",
          });
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
  }, [placePlant, toast]);

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
        toast({
          title: "You can't plant it there!",
          description: `${plant?.name} lives in ${plant?.zone}.`,
          variant: "destructive",
        });
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
                    className="relative shrink-0 w-14 h-14 rounded-2xl overflow-hidden shadow-lg cursor-grab active:cursor-grabbing"
                    style={{ border: "2px solid rgba(47,111,78,0.25)" }}
                  >
                    <img src={plant.image} alt={plant.name} className="w-full h-full object-cover pointer-events-none" />
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

  /* ── Shared plant detail overlay (zoom-from-plant) ── */
  const selectedPlant = selectedPlantIdx !== null ? placedPlants[selectedPlantIdx] : null;
  const selectedPlantData = selectedPlant ? PLANT_DATABASE.find(p => p.id === selectedPlant.plantId) : null;

  const handleDigUp = () => {
    if (selectedPlantIdx !== null) {
      sceneRef.current?.removePlant3D(selectedPlantIdx);
      removePlacedPlant(selectedPlantIdx);
    }
    setSelectedPlantIdx(null);
  };

  /* Zoom-in plant detail card (single motion.div for AnimatePresence) */
  const plantDetailOverlay = selectedPlant && selectedPlantData ? (
    <AnimatePresence>
      <motion.div
        key="plant-zoom"
        initial={{ scale: 0, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0, opacity: 0 }}
        transition={{ type: "spring", damping: 22, stiffness: 300 }}
        className="absolute inset-0 z-[200] flex items-center justify-center"
        style={{ background: "rgba(0,0,0,0.45)", backdropFilter: "blur(3px)" }}
        onClick={() => setSelectedPlantIdx(null)}
      >
        <div
          className="relative flex flex-col items-center"
          style={{ width: "30vw", minWidth: 180 }}
          onClick={e => e.stopPropagation()}
        >
          {/* Dig Up button */}
          <button
            onClick={handleDigUp}
            className="absolute -top-5 -right-5 z-10 px-3 py-1.5 rounded-full text-xs font-bold shadow-xl transition-transform active:scale-90"
            style={{ background: "#b94040", color: "#fff", border: "2.5px solid rgba(255,255,255,0.5)", whiteSpace: "nowrap" }}
          >
            Dig Up
          </button>

          {/* Plant image */}
          <div className="w-full aspect-square rounded-2xl overflow-hidden shadow-2xl"
            style={{ border: "3px solid rgba(246,241,231,0.8)" }}>
            <img src={selectedPlantData.image} alt={selectedPlantData.name} className="w-full h-full object-cover" />
          </div>

          {/* Name label */}
          <div className="mt-2 px-4 py-1.5 rounded-xl text-center shadow"
            style={{ background: "rgba(246,241,231,0.97)" }}>
            <div className="text-sm font-bold" style={{ color: "#26342F" }}>{selectedPlantData.name}</div>
            <div className="text-[10px] mt-0.5 capitalize" style={{ color: "#2F6F4E" }}>{selectedPlantData.zone}</div>
          </div>
        </div>
      </motion.div>
    </AnimatePresence>
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
