import * as THREE from "three";

// ── Per-session model cache: build each plant type once, clone thereafter ──
const _modelCache = new Map<string, THREE.Group>();

// ── ʻŌhiʻa Lehua procedural tree (instanced leaves & stamens) ──
export function createOhiaTree() {
  const treeGroup = new THREE.Group();
  const trunkMaterial = new THREE.MeshStandardMaterial({ color: 0x8a8377, roughness: 1.0 });
  const leafMaterial = new THREE.MeshStandardMaterial({ color: 0x2b3d26, roughness: 0.9 });
  const blossomMaterial = new THREE.MeshStandardMaterial({ color: 0xe61515, roughness: 0.4 });
  const maxDepth = 4;

  function buildBranch(parent: THREE.Object3D, length: number, radius: number, depth: number) {
    const branchGroup = new THREE.Group();
    parent.add(branchGroup);
    const branchGeo = new THREE.CylinderGeometry(radius * 0.65, radius, length, 8);
    const branchMesh = new THREE.Mesh(branchGeo, trunkMaterial);
    branchMesh.position.y = length / 2;
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
      addFoliageMarkers(tip);
    }
    return branchGroup;
  }

  // Place lightweight marker Object3Ds; positions are resolved after updateMatrixWorld
  function addFoliageMarkers(parent: THREE.Object3D) {
    const numLeafClusters = 8 + Math.floor(Math.random() * 6);
    for (let l = 0; l < numLeafClusters; l++) {
      const m = new THREE.Object3D();
      m.userData.ohiaType = 'leaf';
      m.userData.r = 0.4 + Math.random() * 0.6;
      m.position.set(
        (Math.random() - 0.5) * 2.0,
        (Math.random() - 0.5) * 1.5,
        (Math.random() - 0.5) * 2.0
      );
      parent.add(m);
    }
    const numBlossoms = 4 + Math.floor(Math.random() * 5);
    for (let i = 0; i < numBlossoms; i++) {
      const bx = (Math.random() - 0.5) * 2.5;
      const by = 0.5 + Math.random() * 1.5;
      const bz = (Math.random() - 0.5) * 2.5;
      const numStamens = 30 + Math.floor(Math.random() * 20);
      for (let s = 0; s < numStamens; s++) {
        const m = new THREE.Object3D();
        m.userData.ohiaType = 'stamen';
        m.position.set(bx, by, bz);
        m.rotation.x = Math.random() * Math.PI;
        m.rotation.y = Math.random() * Math.PI * 2;
        parent.add(m);
      }
    }
  }

  buildBranch(treeGroup, 4.0, 0.8, maxDepth);

  // Resolve world-space positions and collapse into two InstancedMeshes
  treeGroup.updateMatrixWorld(true);

  const leafMarkers: THREE.Object3D[] = [];
  const stamenMarkers: THREE.Object3D[] = [];
  treeGroup.traverse((obj) => {
    if (obj.userData.ohiaType === 'leaf') leafMarkers.push(obj);
    else if (obj.userData.ohiaType === 'stamen') stamenMarkers.push(obj);
  });

  const dummy = new THREE.Object3D();
  const wPos = new THREE.Vector3();
  const wQuat = new THREE.Quaternion();

  if (leafMarkers.length > 0) {
    const leafGeo = new THREE.SphereGeometry(1, 5, 5);
    const leafInst = new THREE.InstancedMesh(leafGeo, leafMaterial, leafMarkers.length);
    leafMarkers.forEach((m, i) => {
      m.getWorldPosition(wPos);
      dummy.position.copy(wPos);
      dummy.scale.setScalar(m.userData.r);
      dummy.rotation.set(0, 0, 0);
      dummy.updateMatrix();
      leafInst.setMatrixAt(i, dummy.matrix);
      m.parent?.remove(m);
    });
    leafInst.instanceMatrix.needsUpdate = true;
    treeGroup.add(leafInst);
  }

  if (stamenMarkers.length > 0) {
    const stamenGeo = new THREE.CylinderGeometry(0.015, 0.015, 0.6, 3);
    stamenGeo.translate(0, 0.3, 0);
    const stamenInst = new THREE.InstancedMesh(stamenGeo, blossomMaterial, stamenMarkers.length);
    stamenMarkers.forEach((m, i) => {
      m.getWorldPosition(wPos);
      m.getWorldQuaternion(wQuat);
      dummy.position.copy(wPos);
      dummy.quaternion.copy(wQuat);
      dummy.scale.set(1, 1, 1);
      dummy.updateMatrix();
      stamenInst.setMatrixAt(i, dummy.matrix);
      m.parent?.remove(m);
    });
    stamenInst.instanceMatrix.needsUpdate = true;
    treeGroup.add(stamenInst);
  }

  return treeGroup;
}

// ── Naupaka Kahakai procedural bush ──
export function createNaupakaBush() {
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

// ── Limu Kohu (Asparagopsis taxiformis) procedural model ──
export function createLimuKohu() {
  const limuGroup = new THREE.Group();

  const colorStem     = new THREE.Color(0x5a0b18);
  const colorBase     = new THREE.Color(0x8a1329);
  const colorTip      = new THREE.Color(0xeb6e8b);
  const colorRock     = new THREE.Color(0x2a3036);

  // Rock base (noisy icosahedron)
  const rockGeo = new THREE.IcosahedronGeometry(0.55, 3);
  const rPos = rockGeo.attributes.position as THREE.BufferAttribute;
  for (let i = 0; i < rPos.count; i++) {
    const v = new THREE.Vector3().fromBufferAttribute(rPos, i);
    v.multiplyScalar(1 + (Math.random() - 0.5) * 0.3);
    if (v.y < -0.2) v.y = -0.2;
    rPos.setXYZ(i, v.x, v.y, v.z);
  }
  rockGeo.computeVertexNormals();
  const rock = new THREE.Mesh(rockGeo, new THREE.MeshStandardMaterial({ color: colorRock, roughness: 0.9, metalness: 0.2 }));
  rock.position.y = -0.2;
  limuGroup.add(rock);

  // Rhizome runner
  const rhizomeCurve = new THREE.CatmullRomCurve3([
    new THREE.Vector3(-0.5, 0.08, -0.15),
    new THREE.Vector3(-0.1, 0.12, 0.2),
    new THREE.Vector3(0.25, 0.08, 0.08),
    new THREE.Vector3(0.55, 0.04, -0.15),
  ]);
  const rhizomeMat = new THREE.MeshStandardMaterial({ color: colorStem, roughness: 0.8, metalness: 0.1, side: THREE.DoubleSide });
  limuGroup.add(new THREE.Mesh(new THREE.TubeGeometry(rhizomeCurve, 16, 0.04, 5, false), rhizomeMat));

  // Branchlet geometry — tapered drooping cylinder
  const bentGeo = new THREE.CylinderGeometry(0.002, 0.012, 1, 4, 3);
  bentGeo.translate(0, 0.5, 0);
  bentGeo.rotateX(Math.PI / 2);
  const bPos = bentGeo.attributes.position as THREE.BufferAttribute;
  for (let i = 0; i < bPos.count; i++) {
    const z = bPos.getZ(i);
    bPos.setY(i, bPos.getY(i) - z * z * 0.3);
  }
  bentGeo.computeVertexNormals();

  const fluffMat = new THREE.MeshStandardMaterial({ roughness: 0.8, metalness: 0.1, side: THREE.DoubleSide });
  const dummy = new THREE.Object3D();
  const colorHelper = new THREE.Color();

  const numStalks  = 4 + Math.floor(Math.random() * 2);
  const whorls     = 80;
  const bPerWhorl  = 6;

  for (let i = 0; i < numStalks; i++) {
    const stalkGroup = new THREE.Group();
    const tR = (i / (numStalks - 1)) * 0.8 + 0.1;
    const spawnPos = rhizomeCurve.getPoint(tR);
    const height = 1.8 + Math.random() * 1.0;
    const endPos = new THREE.Vector3(
      spawnPos.x + (Math.random() - 0.5) * 0.9,
      spawnPos.y + height,
      spawnPos.z + (Math.random() - 0.5) * 0.9,
    );
    const midPos = new THREE.Vector3(
      (spawnPos.x + endPos.x) / 2 + (Math.random() - 0.5) * 0.4,
      (spawnPos.y + endPos.y) / 2,
      (spawnPos.z + endPos.z) / 2 + (Math.random() - 0.5) * 0.4,
    );
    const stalkCurve = new THREE.QuadraticBezierCurve3(spawnPos, midPos, endPos);
    stalkGroup.add(new THREE.Mesh(new THREE.TubeGeometry(stalkCurve, 16, 0.028, 5, false), rhizomeMat));

    const totalInst = whorls * bPerWhorl;
    const fluff = new THREE.InstancedMesh(bentGeo, fluffMat, totalInst);
    let idx = 0;

    for (let j = 0; j < whorls; j++) {
      const t = j / whorls;
      let profile = 0;
      if (t > 0.05) {
        profile = Math.pow(1 - t, 0.7) * Math.min(1, (t - 0.05) * 8);
      }
      if (profile === 0) continue;

      const pos = stalkCurve.getPoint(t);
      const tan = stalkCurve.getTangent(t);
      const grad = t * 0.6 + Math.random() * 0.4;
      colorHelper.copy(colorBase).lerp(colorTip, grad);

      for (let b = 0; b < bPerWhorl; b++) {
        dummy.position.copy(pos);
        dummy.lookAt(pos.clone().add(tan));
        dummy.rotateZ((j * 1.6180339 + b / bPerWhorl) * Math.PI * 2);
        dummy.rotateX(Math.PI * 0.35 + Math.random() * 0.2);
        const len = 0.25 * profile * (1 + (Math.random() - 0.5) * 0.4);
        dummy.scale.set(1 + Math.random() * 0.5, 1 + Math.random() * 0.5, len);
        dummy.updateMatrix();
        fluff.setMatrixAt(idx, dummy.matrix);
        fluff.setColorAt(idx, colorHelper);
        idx++;
      }
    }

    fluff.count = idx;
    fluff.instanceMatrix.needsUpdate = true;
    if (fluff.instanceColor) fluff.instanceColor.needsUpdate = true;
    stalkGroup.add(fluff);
    limuGroup.add(stalkGroup);
  }

  return limuGroup;
}

// ── ʻAʻaliʻi (Dodonaea viscosa) procedural model ──
export function createAalii() {
  const aaliiGroup = new THREE.Group();
  const dummy = new THREE.Object3D();
  const colorHelper = new THREE.Color();

  const maxBranchDepth = 3;
  const trunkCount = 7;
  const leavesPerUnit = 25;

  const branchMat = new THREE.MeshStandardMaterial({ color: 0x5c544d, roughness: 0.9, metalness: 0.0 });
  const leafMat   = new THREE.MeshStandardMaterial({ color: 0x1f5c18, roughness: 0.2, metalness: 0.05, side: THREE.DoubleSide });

  type BranchData = { curve: THREE.QuadraticBezierCurve3; length: number; radius: number; depth: number };
  const allBranches: BranchData[] = [];

  function generateBranch(startPt: THREE.Vector3, dir: THREE.Vector3, length: number, radius: number, depth: number) {
    const midPt = startPt.clone()
      .add(dir.clone().multiplyScalar(length * 0.5))
      .add(new THREE.Vector3(dir.x * length * 0.2, length * 0.2, dir.z * length * 0.2));
    const endPt = startPt.clone()
      .add(dir.clone().multiplyScalar(length))
      .add(new THREE.Vector3(0, -length * 0.15, 0));

    const curve = new THREE.QuadraticBezierCurve3(startPt, midPt, endPt);
    allBranches.push({ curve, length, radius, depth });

    const segs = Math.max(4, 10 - depth * 2);
    aaliiGroup.add(new THREE.Mesh(new THREE.TubeGeometry(curve, segs, radius, 4, false), branchMat));

    if (depth < maxBranchDepth) {
      const numChildren = depth === 0 ? 4 : depth === 1 ? 3 : 2;
      for (let i = 0; i < numChildren; i++) {
        const t = 0.3 + (i / numChildren) * 0.6 + Math.random() * 0.1;
        const spawnPt  = curve.getPointAt(t);
        const parentTan = curve.getTangentAt(t).normalize();
        const spreadAngle = Math.random() * Math.PI * 2;
        const spreadOut   = 0.6 + Math.random() * 0.4;
        const binormal = new THREE.Vector3().crossVectors(parentTan, new THREE.Vector3(0, 1, 0)).normalize();
        if (binormal.length() < 0.1) binormal.set(1, 0, 0);
        const normal = new THREE.Vector3().crossVectors(binormal, parentTan).normalize();
        const childDir = parentTan.clone().multiplyScalar(1 - spreadOut)
          .add(binormal.clone().multiplyScalar(Math.cos(spreadAngle) * spreadOut))
          .add(normal.clone().multiplyScalar(Math.sin(spreadAngle) * spreadOut))
          .normalize();
        childDir.y += 0.4;
        childDir.normalize();
        generateBranch(spawnPt, childDir, length * (0.6 + Math.random() * 0.3), radius * 0.65, depth + 1);
      }
    }
  }

  for (let t = 0; t < trunkCount; t++) {
    const angle = (t / trunkCount) * Math.PI * 2 + Math.random() * 0.5;
    const startPos = new THREE.Vector3(Math.cos(angle) * 0.2, 0, Math.sin(angle) * 0.2);
    const baseDir  = new THREE.Vector3(Math.cos(angle) * 0.6, 1.0, Math.sin(angle) * 0.6).normalize();
    generateBranch(startPos, baseDir, 2.0 + Math.random() * 1.0, 0.05, 0);
  }

  // Narrow glossy leaf geometry
  const leafLen = 0.25;
  const leafGeo = new THREE.CylinderGeometry(0.01, 0.01, leafLen, 5, 4);
  leafGeo.translate(0, leafLen / 2, 0);
  const leafPos = leafGeo.attributes.position as THREE.BufferAttribute;
  for (let i = 0; i < leafPos.count; i++) {
    const y = leafPos.getY(i);
    const t = y / leafLen;
    const wp = Math.sin(t * Math.PI) * Math.pow(1 - t, 0.2);
    const x = leafPos.getX(i) * wp * 5.0;
    let z = leafPos.getZ(i) * 0.15;
    z += Math.abs(x) * 0.15;
    z -= Math.sin(t * Math.PI) * 0.02;
    leafPos.setXYZ(i, x, y, z);
  }
  leafGeo.computeVertexNormals();

  let totalLeaves = 0;
  allBranches.forEach(b => { if (b.depth >= 2) totalLeaves += Math.floor(b.length * leavesPerUnit); });

  const leavesInst = new THREE.InstancedMesh(leafGeo, leafMat, totalLeaves);
  aaliiGroup.add(leavesInst);
  let leafIdx = 0;

  allBranches.forEach(branch => {
    if (branch.depth < 2) return;
    const num = Math.floor(branch.length * leavesPerUnit);
    for (let i = 0; i < num && leafIdx < totalLeaves; i++) {
      const t = Math.random();
      const point   = branch.curve.getPointAt(t);
      const tangent = branch.curve.getTangentAt(t).normalize();
      const binormal = new THREE.Vector3().crossVectors(tangent, new THREE.Vector3(0, 1, 0)).normalize();
      const normal   = new THREE.Vector3().crossVectors(binormal, tangent).normalize();
      const angle    = i * 2.39996 + Math.random();
      const leafOut  = new THREE.Vector3()
        .addScaledVector(binormal, Math.cos(angle))
        .addScaledVector(normal,   Math.sin(angle))
        .normalize();
      const leafDir = leafOut.clone().multiplyScalar(0.7)
        .add(tangent.clone().multiplyScalar(0.3))
        .add(new THREE.Vector3(0, 0.5, 0))
        .normalize();
      dummy.position.copy(point);
      dummy.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), leafDir);
      dummy.rotateY(Math.random() * 0.6 - 0.3);
      dummy.rotateX(Math.random() * 0.3);
      const s = 0.7 + Math.random() * 0.5;
      dummy.scale.set(s, s, s);
      dummy.updateMatrix();
      const isHighlight = Math.random() > 0.7;
      colorHelper.setHSL(isHighlight ? 0.28 : 0.33, isHighlight ? 0.8 : 0.6, isHighlight ? 0.45 : 0.25);
      leavesInst.setMatrixAt(leafIdx, dummy.matrix);
      leavesInst.setColorAt(leafIdx, colorHelper);
      leafIdx++;
    }
  });

  leavesInst.instanceMatrix.needsUpdate = true;
  if (leavesInst.instanceColor) leavesInst.instanceColor.needsUpdate = true;

  return aaliiGroup;
}

// ── Lāʻī (Ti / Cordyline fruticosa) procedural model ──
export function createLai() {
  const plantGroup = new THREE.Group();

  const caneTan      = new THREE.Color(0xd9cbb3);
  const caneDarkTan  = new THREE.Color(0x91795c);
  const leafBase     = new THREE.Color(0x8bc940);
  const leafBody     = new THREE.Color(0x5fb023);
  const leafTipDead  = new THREE.Color(0xd6a849);
  const midribColor  = 0x98d44c;

  // Segmented trunk cane with alternating node colors + organic bend
  function createSegmentedCane(height: number, radius: number, numSegments: number, bendX: number, bendZ: number) {
    const heightSegments = numSegments * 6;
    const geo = new THREE.CylinderGeometry(radius, radius, height, 10, heightSegments);
    geo.translate(0, height / 2, 0);
    const pos = geo.attributes.position as THREE.BufferAttribute;
    const vertexColors = new Float32Array(pos.count * 3);
    const v = new THREE.Vector3();
    const segH = height / numSegments;

    for (let i = 0; i < pos.count; i++) {
      v.fromBufferAttribute(pos, i);
      const safeY = Math.max(0, v.y);
      const segFrac = safeY / segH;
      const segIdx  = Math.floor(segFrac);
      const localY  = segFrac - segIdx;
      const c = segIdx % 2 === 0 ? caneTan : caneDarkTan;
      vertexColors[i * 3]     = c.r;
      vertexColors[i * 3 + 1] = c.g;
      vertexColors[i * 3 + 2] = c.b;
      let bulge = 1.0;
      if (localY > 0.85)      bulge = 1.0 + (localY - 0.85) * 1.5;
      else if (localY < 0.1)  bulge = 1.0 + (0.1 - localY) * 0.8;
      const noise = (Math.random() - 0.5) * 0.01;
      v.x = v.x * bulge + noise;
      v.z = v.z * bulge + noise;
      const t = Math.min(1, safeY / height);
      const bf = Math.pow(t, 1.5);
      v.x += bendX * bf;
      v.z += bendZ * bf;
      pos.setXYZ(i, v.x, v.y, v.z);
    }
    geo.setAttribute("color", new THREE.BufferAttribute(vertexColors, 3));
    geo.computeVertexNormals();
    return new THREE.Mesh(geo, new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 0.95, metalness: 0.0 }));
  }

  // Sword-shaped Ti leaf with V-fold, longitudinal arch, vertex color aging, and midrib
  function createLeaf(length: number, width: number, ageRatio: number) {
    const leafGroup = new THREE.Group();
    const bladeGeo = new THREE.PlaneGeometry(width, length, 8, 20);
    bladeGeo.translate(0, length / 2, 0);
    const pos = bladeGeo.attributes.position as THREE.BufferAttribute;
    const vertexColors = new Float32Array(pos.count * 3);
    const v = new THREE.Vector3();
    const tc = new THREE.Color();
    const arch = length * (0.02 + 0.12 * (1.0 - ageRatio));

    for (let i = 0; i < pos.count; i++) {
      v.fromBufferAttribute(pos, i);
      const ny = Math.max(0, Math.min(1, v.y / length));
      const nx = Math.abs(v.x) / (width / 2);
      let wScale = ny < 0.22 ? 0.06 : 0.06 + Math.sin(((ny - 0.22) / 0.78) * Math.PI) * 0.94;
      v.x *= wScale;
      v.z += nx * (width * 0.15);
      v.z -= Math.pow(ny, 1.5) * arch;
      pos.setXYZ(i, v.x, v.y, v.z);

      if (ny < 0.22) {
        tc.copy(leafBase);
      } else {
        tc.copy(leafBase).lerp(leafBody, (ny - 0.22) / 0.78);
        if (ageRatio < 0.35 && ny > 0.6) {
          tc.lerp(leafTipDead, (1.0 - ageRatio / 0.35) * ((ny - 0.6) / 0.4));
        }
      }
      vertexColors[i * 3] = tc.r; vertexColors[i * 3 + 1] = tc.g; vertexColors[i * 3 + 2] = tc.b;
    }
    bladeGeo.setAttribute("color", new THREE.BufferAttribute(vertexColors, 3));
    bladeGeo.computeVertexNormals();
    const bladeMat = new THREE.MeshStandardMaterial({ color: 0xffffff, vertexColors: true, roughness: 0.15, metalness: 0.05, side: THREE.DoubleSide });
    leafGroup.add(new THREE.Mesh(bladeGeo, bladeMat));

    // Midrib
    const sGeo = new THREE.CylinderGeometry(width * 0.025, width * 0.015, length, 4, 20);
    sGeo.translate(0, length / 2, 0);
    const sPos = sGeo.attributes.position as THREE.BufferAttribute;
    const sv = new THREE.Vector3();
    for (let i = 0; i < sPos.count; i++) {
      sv.fromBufferAttribute(sPos, i);
      const ny = Math.max(0, Math.min(1, sv.y / length));
      sv.z -= Math.pow(ny, 1.5) * arch + width * 0.015;
      sPos.setXYZ(i, sv.x, sv.y, sv.z);
    }
    sGeo.computeVertexNormals();
    leafGroup.add(new THREE.Mesh(sGeo, new THREE.MeshStandardMaterial({ color: midribColor, roughness: 0.8, metalness: 0.0 })));
    return leafGroup;
  }

  // Mother stump
  const motherH = THREE.MathUtils.randFloat(0.6, 1.0);
  const motherR = THREE.MathUtils.randFloat(0.10, 0.14);
  plantGroup.add(createSegmentedCane(motherH, motherR, Math.max(2, Math.floor(motherH / 0.3)), 0, 0));

  const numCanes = THREE.MathUtils.randInt(3, 4);
  const phi = 137.5 * (Math.PI / 180);

  for (let i = 0; i < numCanes; i++) {
    const caneH   = THREE.MathUtils.randFloat(2.5, 4.5);
    const caneR   = THREE.MathUtils.randFloat(0.05, 0.08);
    const numSeg  = Math.max(3, Math.floor(caneH / 0.3));
    const angleOut = (i / numCanes) * Math.PI * 2 + THREE.MathUtils.randFloat(-0.2, 0.2);
    const spread  = THREE.MathUtils.randFloat(0.3, 0.7);
    const bendX   = Math.cos(angleOut) * spread;
    const bendZ   = Math.sin(angleOut) * spread;

    const trunk = createSegmentedCane(caneH, caneR, numSeg, bendX, bendZ);
    trunk.position.set(Math.cos(angleOut) * motherR * 0.5, motherH - 0.1, Math.sin(angleOut) * motherR * 0.5);
    plantGroup.add(trunk);

    const numLeaves = THREE.MathUtils.randInt(16, 24);
    const leafStartFraction = 0.92;

    for (let j = 0; j < numLeaves; j++) {
      const ageRatio = j / numLeaves;
      const t = leafStartFraction + (1.0 - leafStartFraction) * ageRatio;
      const bf = Math.pow(t, 1.5);
      const attachX = trunk.position.x + bendX * bf;
      const attachY = trunk.position.y + t * caneH;
      const attachZ = trunk.position.z + bendZ * bf;

      const lenScale = 1.0 - Math.pow(ageRatio, 1.3);
      const maxLen   = THREE.MathUtils.randFloat(1.8, 2.5);
      const leafLen  = maxLen * (0.3 + 0.7 * lenScale);
      const leafWid  = leafLen * THREE.MathUtils.randFloat(0.28, 0.38);

      const leaf = createLeaf(leafLen, leafWid, ageRatio);
      const trunkTangent = new THREE.Vector3(1.5 * bendX * Math.pow(t, 0.5), caneH, 1.5 * bendZ * Math.pow(t, 0.5)).normalize();

      const leafPivot = new THREE.Group();
      leafPivot.position.set(attachX, attachY, attachZ);
      leafPivot.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), trunkTangent);
      leaf.rotation.order = "YXZ";
      leaf.rotation.y = j * phi;
      leaf.rotation.x = -THREE.MathUtils.lerp(Math.PI * 0.55, -Math.PI * 0.1, Math.pow(ageRatio, 0.7));
      leaf.rotation.z = (Math.random() - 0.5) * 0.25;
      leafPivot.add(leaf);
      plantGroup.add(leafPivot);
    }
  }

  // Center horizontally
  const box = new THREE.Box3().setFromObject(plantGroup);
  const center = box.getCenter(new THREE.Vector3());
  plantGroup.position.set(-center.x, 0, -center.z);

  return plantGroup;
}

// ── Pōhinahina (Vitex rotundifolia) procedural model ──
export function createPohinahina() {
  const pohinahinaGroup = new THREE.Group();
  const dummy = new THREE.Object3D();
  const colorHelper = new THREE.Color();

  const numMainStems = 10;
  const subStemsPerMain = 2;
  const leafPairsPerUnit = 4;

  const stemMat = new THREE.MeshStandardMaterial({ color: 0x8a8175, roughness: 0.8, metalness: 0.0 });
  const leafMat = new THREE.MeshStandardMaterial({ color: 0x8ba192, roughness: 0.9, metalness: 0.1, side: THREE.DoubleSide });
  const flowerMat = new THREE.MeshStandardMaterial({ color: 0x826ca3, roughness: 0.6, metalness: 0.0 });

  // Build stems (main + sub-branches)
  type StemData = { curve: THREE.CatmullRomCurve3; length: number; isMain: boolean };
  const stems: StemData[] = [];

  for (let i = 0; i < numMainStems; i++) {
    const angle = (i / numMainStems) * Math.PI * 2 + Math.random() * 0.4;
    const length = 2.0 + Math.random() * 2.0;
    const mainCurve = new THREE.CatmullRomCurve3([
      new THREE.Vector3(0, 0, 0),
      new THREE.Vector3(Math.cos(angle) * length * 0.3, 0.4 + Math.random() * 0.6, Math.sin(angle) * length * 0.3),
      new THREE.Vector3(Math.cos(angle) * length * 0.7, 0.3 + Math.random() * 0.4, Math.sin(angle) * length * 0.7),
      new THREE.Vector3(Math.cos(angle) * length, 0.05 + Math.random() * 0.15, Math.sin(angle) * length),
    ]);
    stems.push({ curve: mainCurve, length, isMain: true });

    for (let j = 0; j < subStemsPerMain; j++) {
      const tStart = 0.2 + (j / subStemsPerMain) * 0.6 + Math.random() * 0.1;
      const startPt = mainCurve.getPointAt(tStart);
      const subLen = 1.0 + Math.random() * 1.5;
      const dir = Math.random() > 0.5 ? 1 : -1;
      const subAngle = angle + dir * (0.4 + Math.random() * 0.4);
      stems.push({
        curve: new THREE.CatmullRomCurve3([
          startPt,
          startPt.clone().add(new THREE.Vector3(Math.cos(subAngle) * subLen * 0.5, 0.2 + Math.random() * 0.3, Math.sin(subAngle) * subLen * 0.5)),
          startPt.clone().add(new THREE.Vector3(Math.cos(subAngle) * subLen, 0.05 + Math.random() * 0.1, Math.sin(subAngle) * subLen)),
        ]),
        length: subLen,
        isMain: false,
      });
    }
  }

  // Render stem tubes
  stems.forEach(({ curve, isMain }) => {
    pohinahinaGroup.add(new THREE.Mesh(
      new THREE.TubeGeometry(curve, 16, isMain ? 0.025 : 0.015, 5, false),
      stemMat
    ));
  });

  // Oval/spoon leaf geometry (deformed cylinder)
  const leafLength = 0.25;
  const leafGeo = new THREE.CylinderGeometry(0.01, 0.01, leafLength, 8, 4);
  leafGeo.translate(0, leafLength / 2, 0);
  const leafPos = leafGeo.attributes.position as THREE.BufferAttribute;
  for (let i = 0; i < leafPos.count; i++) {
    const t = leafPos.getY(i) / leafLength;
    const widthProfile = Math.sin(t * Math.PI);
    const x = leafPos.getX(i) * widthProfile * 12.0;
    let z = leafPos.getZ(i) * 0.1;
    z += Math.abs(x) * 0.15;
    z -= Math.sin(t * Math.PI) * 0.05;
    leafPos.setXYZ(i, x, leafPos.getY(i), z);
  }
  leafGeo.computeVertexNormals();

  // Pre-compute total leaf count
  let totalLeaves = 0;
  stems.forEach(({ length }) => { totalLeaves += Math.floor(length * leafPairsPerUnit) * 2; });

  const leavesInst = new THREE.InstancedMesh(leafGeo, leafMat, totalLeaves);
  pohinahinaGroup.add(leavesInst);
  let leafIdx = 0;

  const flowerGeo = new THREE.SphereGeometry(0.015, 5, 5);
  const flowerInst = new THREE.InstancedMesh(flowerGeo, flowerMat, stems.length * 20);
  pohinahinaGroup.add(flowerInst);
  let flowerIdx = 0;

  const up = new THREE.Vector3(0, 1, 0);

  stems.forEach(({ curve, length }) => {
    const numPairs = Math.floor(length * leafPairsPerUnit);

    for (let i = 1; i <= numPairs; i++) {
      const t = i / (numPairs + 1);
      const point = curve.getPointAt(t);
      const tangent = curve.getTangentAt(t).normalize();
      const binormal = new THREE.Vector3().crossVectors(tangent, up).normalize();
      const angleOffset = i % 2 === 0 ? 0 : Math.PI / 2;
      const sizeScale = THREE.MathUtils.lerp(1.2, 0.6, t);
      colorHelper.setHSL(0.38 + (Math.random() * 0.04 - 0.02), 0.15 + t * 0.05, 0.55 + Math.random() * 0.1);

      for (const ang of [angleOffset, angleOffset + Math.PI]) {
        if (leafIdx >= totalLeaves) break;
        const leafOut = binormal.clone().applyAxisAngle(tangent, ang).normalize();
        const leafDir = leafOut.clone()
          .add(tangent.clone().multiplyScalar(0.6))
          .add(new THREE.Vector3(0, 0.2, 0))
          .normalize();
        dummy.position.copy(point);
        dummy.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), leafDir);
        dummy.rotateY((Math.random() - 0.5) * 0.2);
        dummy.scale.setScalar(sizeScale);
        dummy.updateMatrix();
        leavesInst.setMatrixAt(leafIdx, dummy.matrix);
        leavesInst.setColorAt(leafIdx, colorHelper);
        leafIdx++;
      }
    }

    // Flower clusters at ~70% of stem tips
    if (Math.random() > 0.3) {
      const tipPt = curve.getPointAt(0.98);
      const tipTan = curve.getTangentAt(0.98).normalize();
      const tipBi = new THREE.Vector3().crossVectors(tipTan, up).normalize();
      const tipNorm = new THREE.Vector3().crossVectors(tipBi, tipTan).normalize();
      const numF = 6 + Math.floor(Math.random() * 8);

      for (let f = 0; f < numF && flowerIdx < stems.length * 20; f++) {
        const fR = 0.03 + Math.random() * 0.04;
        const fA = Math.random() * Math.PI * 2;
        const offset = new THREE.Vector3()
          .addScaledVector(tipBi, Math.cos(fA) * fR)
          .addScaledVector(tipNorm, Math.sin(fA) * fR)
          .addScaledVector(tipTan, (Math.random() - 0.2) * 0.08);
        dummy.position.copy(tipPt).add(offset);
        dummy.scale.setScalar(0.8 + Math.random() * 0.6);
        dummy.rotation.set(Math.random() * Math.PI, Math.random() * Math.PI, Math.random() * Math.PI);
        dummy.updateMatrix();
        colorHelper.setHSL(0.72 + Math.random() * 0.05, 0.4 + Math.random() * 0.2, 0.5 + Math.random() * 0.1);
        flowerInst.setMatrixAt(flowerIdx, dummy.matrix);
        flowerInst.setColorAt(flowerIdx, colorHelper);
        flowerIdx++;
      }
    }
  });

  leavesInst.instanceMatrix.needsUpdate = true;
  if (leavesInst.instanceColor) leavesInst.instanceColor.needsUpdate = true;
  flowerInst.instanceMatrix.needsUpdate = true;
  if (flowerInst.instanceColor) flowerInst.instanceColor.needsUpdate = true;

  return pohinahinaGroup;
}

// ── Loulu (Pritchardia palm) procedural model ──
export function createLoulu() {
  const louluGroup = new THREE.Group();
  const dummy = new THREE.Object3D();
  const colorHelper = new THREE.Color();

  const trunkHeight = 8.0;
  const trunkBaseRadius = 0.45;
  const trunkTopRadius = 0.25;
  const numRings = 30;
  const numLeaves = 20;
  const numDeadLeaves = 4;
  const segmentsPerLeaf = 20;
  const fruitStalks = 3;
  const fruitsPerStalk = 20;

  const trunkMat = new THREE.MeshStandardMaterial({ color: 0x7a7167, roughness: 0.9, metalness: 0.0 });
  const ringMat  = new THREE.MeshStandardMaterial({ color: 0x595148, roughness: 1.0, metalness: 0.0 });
  const stalkMat = new THREE.MeshStandardMaterial({ color: 0x6a7d51, roughness: 0.7, metalness: 0.0 });
  const deadStalkMat = new THREE.MeshStandardMaterial({ color: 0x6e634f, roughness: 0.9, metalness: 0.0 });
  const leafMat  = new THREE.MeshStandardMaterial({ color: 0x4a7a30, roughness: 0.4, metalness: 0.05, side: THREE.DoubleSide });
  const deadLeafMat = new THREE.MeshStandardMaterial({ color: 0x8b7d5e, roughness: 0.8, metalness: 0.0, side: THREE.DoubleSide });
  const fruitMat = new THREE.MeshStandardMaterial({ color: 0x1a2e12, roughness: 0.3, metalness: 0.1 });

  // Trunk with organic vertex noise
  const trunkGeo = new THREE.CylinderGeometry(trunkTopRadius, trunkBaseRadius, trunkHeight, 14, 10);
  trunkGeo.translate(0, trunkHeight / 2, 0);
  const trunkPos = trunkGeo.attributes.position;
  for (let i = 0; i < trunkPos.count; i++) {
    const noise = (Math.random() - 0.5) * 0.015;
    trunkPos.setX(i, trunkPos.getX(i) + noise);
    trunkPos.setZ(i, trunkPos.getZ(i) + noise);
  }
  trunkGeo.computeVertexNormals();
  louluGroup.add(new THREE.Mesh(trunkGeo, trunkMat));

  // Leaf-scar rings (instanced tori)
  const ringGeo = new THREE.TorusGeometry(1, 0.015, 6, 14);
  ringGeo.rotateX(Math.PI / 2);
  const ringsInst = new THREE.InstancedMesh(ringGeo, ringMat, numRings);
  louluGroup.add(ringsInst);
  for (let r = 0; r < numRings; r++) {
    const t = Math.pow(r / (numRings - 1), 0.9);
    const y = t * trunkHeight * 0.98;
    const curR = THREE.MathUtils.lerp(trunkBaseRadius, trunkTopRadius, y / trunkHeight);
    dummy.position.set(0, y, 0);
    dummy.scale.set(curR, 1, curR);
    dummy.rotation.set((Math.random() - 0.5) * 0.05, Math.random() * Math.PI, (Math.random() - 0.5) * 0.05);
    dummy.updateMatrix();
    ringsInst.setMatrixAt(r, dummy.matrix);
  }
  ringsInst.instanceMatrix.needsUpdate = true;

  // Fan-leaf segment geometry (shared between live and dead)
  const segLen = 2.0;
  const segGeo = new THREE.CylinderGeometry(0.005, 0.04, segLen, 4);
  segGeo.translate(0, segLen / 2, 0);

  const leavesInst = new THREE.InstancedMesh(segGeo, leafMat, numLeaves * segmentsPerLeaf);
  const deadInst   = new THREE.InstancedMesh(segGeo, deadLeafMat, numDeadLeaves * segmentsPerLeaf);
  louluGroup.add(leavesInst);
  louluGroup.add(deadInst);

  let liveIdx = 0;
  let deadIdx = 0;
  const totalFronds = numLeaves + numDeadLeaves;

  for (let i = 0; i < totalFronds; i++) {
    const isDead = i < numDeadLeaves;
    const tVal = isDead ? (i / numDeadLeaves) : ((i - numDeadLeaves) / numLeaves);
    const angle = i * 2.39996; // golden angle phyllotaxis
    const outDir = new THREE.Vector3(Math.cos(angle), 0, Math.sin(angle));

    const vertDir = isDead
      ? -1.5 + Math.random() * 0.5
      : THREE.MathUtils.lerp(-0.3, 1.8, tVal);
    const stalkEndDir = outDir.clone().add(new THREE.Vector3(0, vertDir, 0)).normalize();
    const stalkLen = isDead ? 0.8 + Math.random() * 0.4 : 1.2 + tVal * 0.5;
    const baseH = isDead
      ? trunkHeight - 0.5 + Math.random() * 0.3
      : trunkHeight - 0.2 + tVal * 0.4;

    const p0 = new THREE.Vector3(0, baseH, 0);
    const p1 = p0.clone().add(outDir.clone().multiplyScalar(stalkLen * 0.4)).add(new THREE.Vector3(0, isDead ? -0.2 : 0.5, 0));
    const p2 = p0.clone().add(stalkEndDir.clone().multiplyScalar(stalkLen));

    const stalkCurve = new THREE.QuadraticBezierCurve3(p0, p1, p2);
    const stalkMesh = new THREE.Mesh(new THREE.TubeGeometry(stalkCurve, 10, 0.035, 5, false), isDead ? deadStalkMat : stalkMat);
    louluGroup.add(stalkMesh);

    const tangent  = stalkCurve.getTangentAt(1).normalize();
    const up       = new THREE.Vector3(0, 1, 0);
    const binormal = new THREE.Vector3().crossVectors(tangent, up).normalize();
    const normal   = new THREE.Vector3().crossVectors(binormal, tangent).normalize();

    for (let s = 0; s < segmentsPerLeaf; s++) {
      const spreadFrac = s / (segmentsPerLeaf - 1);
      const spreadAngle = THREE.MathUtils.lerp(-Math.PI * 0.42, Math.PI * 0.42, spreadFrac);
      const dir = tangent.clone().applyAxisAngle(normal, spreadAngle);
      const outerDroop = Math.abs(spreadAngle) * (isDead ? 1.0 : 0.4);
      const fold = s % 2 === 0 ? 0.05 : -0.05;
      dir.applyAxisAngle(binormal, -outerDroop + fold);

      dummy.position.copy(p2);
      dummy.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), dir.normalize());
      const lenScale = 0.8 + Math.pow(Math.sin(spreadFrac * Math.PI), 0.5) * 0.3 + Math.random() * 0.1;
      dummy.scale.set(1, lenScale, 0.15);
      dummy.updateMatrix();

      if (isDead) {
        deadInst.setMatrixAt(deadIdx++, dummy.matrix);
      } else {
        colorHelper.setHSL(0.28 + Math.random() * 0.03, 0.5 + tVal * 0.2, 0.25 + tVal * 0.15);
        leavesInst.setMatrixAt(liveIdx, dummy.matrix);
        leavesInst.setColorAt(liveIdx, colorHelper);
        liveIdx++;
      }
    }
  }

  leavesInst.instanceMatrix.needsUpdate = true;
  if (leavesInst.instanceColor) leavesInst.instanceColor.needsUpdate = true;
  deadInst.instanceMatrix.needsUpdate = true;

  // Hanging fruit clusters
  const fruitGeo  = new THREE.SphereGeometry(0.04, 6, 6);
  const fruitInst = new THREE.InstancedMesh(fruitGeo, fruitMat, fruitStalks * fruitsPerStalk);
  louluGroup.add(fruitInst);
  let fruitIdx = 0;

  for (let fs = 0; fs < fruitStalks; fs++) {
    const fa  = (fs / fruitStalks) * Math.PI * 2 + Math.random();
    const fOut = new THREE.Vector3(Math.cos(fa), 0, Math.sin(fa));
    const fp0  = new THREE.Vector3(0, trunkHeight - 0.4, 0);
    const fp1  = fp0.clone().add(fOut.clone().multiplyScalar(0.6)).add(new THREE.Vector3(0, 0.2, 0));
    const fp2  = fp0.clone().add(fOut.clone().multiplyScalar(0.8)).add(new THREE.Vector3(0, -1.2, 0));
    const fStalkCurve = new THREE.QuadraticBezierCurve3(fp0, fp1, fp2);
    louluGroup.add(new THREE.Mesh(new THREE.TubeGeometry(fStalkCurve, 14, 0.02, 5, false), deadStalkMat));

    for (let f = 0; f < fruitsPerStalk; f++) {
      const ft  = 0.4 + Math.random() * 0.6;
      const fpt = fStalkCurve.getPointAt(ft);
      const rA  = Math.random() * Math.PI * 2;
      const rD  = Math.random() * 0.12;
      dummy.position.copy(fpt).add(new THREE.Vector3(Math.cos(rA) * rD, (Math.random() - 0.5) * 0.1, Math.sin(rA) * rD));
      dummy.scale.setScalar(0.7 + Math.random() * 0.5);
      dummy.updateMatrix();
      fruitInst.setMatrixAt(fruitIdx++, dummy.matrix);
    }
  }
  fruitInst.instanceMatrix.needsUpdate = true;

  return louluGroup;
}

// ── Palapalai (Hawaiian lace fern) procedural model ──
export function createPalapalai() {
  const plantGroup = new THREE.Group();
  const dummy = new THREE.Object3D();
  const upVector = new THREE.Vector3(0, 1, 0);

  const numFronds = 12;
  const branchesPerFrond = 18;
  const leavesPerBranch = 8;
  const fuzzPerFrond = 60;

  const totalBranches = numFronds * branchesPerFrond * 2;
  const totalLeaves = totalBranches * leavesPerBranch * 2;
  const totalFuzz = numFronds * fuzzPerFrond;

  const stemMat = new THREE.MeshStandardMaterial({ color: 0x4a3b2c, roughness: 0.95, metalness: 0.0 });
  const leafMat = new THREE.MeshStandardMaterial({ color: 0x6ca332, roughness: 0.6, metalness: 0.05, side: THREE.DoubleSide });

  const branchGeo = new THREE.CylinderGeometry(0.003, 0.001, 1, 4);
  branchGeo.translate(0, 0.5, 0);
  branchGeo.rotateX(Math.PI / 2);

  const leafGeo = new THREE.ConeGeometry(0.012, 0.06, 4);
  leafGeo.translate(0, 0.03, 0);
  leafGeo.rotateY(Math.PI / 4);
  leafGeo.scale(1, 1, 0.15);
  leafGeo.rotateX(Math.PI / 2);

  const fuzzGeo = new THREE.CylinderGeometry(0.0005, 0.0005, 0.02, 3);
  fuzzGeo.translate(0, 0.01, 0);
  fuzzGeo.rotateX(Math.PI / 2);

  const branchInst = new THREE.InstancedMesh(branchGeo, stemMat, totalBranches);
  const leafInst = new THREE.InstancedMesh(leafGeo, leafMat, totalLeaves);
  const fuzzInst = new THREE.InstancedMesh(fuzzGeo, stemMat, totalFuzz);

  let branchIdx = 0;
  let leafIdx = 0;
  let fuzzIdx = 0;

  for (let i = 0; i < numFronds; i++) {
    const frondAngle = (i / numFronds) * Math.PI * 2 + (Math.random() * 0.2 - 0.1);
    const frondScale = 0.6 + Math.pow(Math.random(), 2) * 0.6;
    const frondDroop = 0.5 + Math.random() * 0.7;

    const curve = new THREE.QuadraticBezierCurve3(
      new THREE.Vector3(0, 0, 0),
      new THREE.Vector3(0, frondScale * 1.8, frondScale * 0.4),
      new THREE.Vector3(0, frondScale * (1.5 - frondDroop), frondScale * 1.8)
    );
    const rotMat = new THREE.Matrix4().makeRotationY(frondAngle);
    curve.v1.applyMatrix4(rotMat);
    curve.v2.applyMatrix4(rotMat);

    const stemGeo = new THREE.TubeGeometry(curve, 24, 0.012, 4, false);
    plantGroup.add(new THREE.Mesh(stemGeo, stemMat));

    // Fuzz near stem base
    for (let f = 0; f < fuzzPerFrond && fuzzIdx < totalFuzz; f++) {
      const t = Math.pow(Math.random(), 2) * 0.35;
      const pt = curve.getPointAt(t);
      const tan = curve.getTangentAt(t);
      const randomDir = new THREE.Vector3(Math.random() - 0.5, Math.random() - 0.5, Math.random() - 0.5).normalize();
      const dot = randomDir.dot(tan);
      randomDir.sub(tan.clone().multiplyScalar(dot)).normalize();
      dummy.position.copy(pt).add(randomDir.clone().multiplyScalar(0.012));
      dummy.lookAt(dummy.position.clone().add(randomDir));
      dummy.scale.set(1, 1, Math.random() * 1.5 + 0.5);
      dummy.updateMatrix();
      fuzzInst.setMatrixAt(fuzzIdx++, dummy.matrix);
    }

    // Branches and leaflets
    for (let b = 0; b < branchesPerFrond; b++) {
      const t_branch = 0.15 + (b / branchesPerFrond) * 0.83;
      const branchPos = curve.getPointAt(t_branch);
      const branchTan = curve.getTangentAt(t_branch);

      let branchRight = new THREE.Vector3().crossVectors(branchTan, upVector).normalize();
      if (branchRight.lengthSq() < 0.001) branchRight.set(Math.cos(frondAngle), 0, -Math.sin(frondAngle)).normalize();
      const branchNormal = new THREE.Vector3().crossVectors(branchRight, branchTan).normalize();

      const taper = Math.sin(Math.PI * (t_branch - 0.15) / 0.85);
      const branchLength = ((1 - t_branch) * 0.7 + taper * 0.3) * frondScale * 0.45;

      for (const side of [-1, 1]) {
        if (branchIdx >= totalBranches) break;
        const dir = branchRight.clone().multiplyScalar(side)
          .add(branchTan.clone().multiplyScalar(0.6))
          .add(branchNormal.clone().multiplyScalar(-0.15))
          .normalize();
        const endPos = branchPos.clone().add(dir.clone().multiplyScalar(branchLength));

        dummy.position.copy(branchPos);
        dummy.lookAt(endPos);
        dummy.scale.set(1, 1, branchLength);
        dummy.updateMatrix();
        branchInst.setMatrixAt(branchIdx++, dummy.matrix);

        for (let l = 0; l < leavesPerBranch; l++) {
          if (leafIdx >= totalLeaves - 2) break;
          const t_leaf = (l + 0.5) / leavesPerBranch;
          const leafBasePos = branchPos.clone().lerp(endPos, t_leaf);
          const leafScale = (1 - t_leaf) * 0.7 + 0.3;
          const leafRight = new THREE.Vector3().crossVectors(dir, upVector).normalize();

          for (const lSide of [-1, 1]) {
            if (leafIdx >= totalLeaves) break;
            const lDir = leafRight.clone().multiplyScalar(lSide)
              .add(dir.clone().multiplyScalar(0.8))
              .add(upVector.clone().multiplyScalar(0.3))
              .normalize();
            dummy.position.copy(leafBasePos);
            dummy.lookAt(leafBasePos.clone().add(lDir));
            dummy.scale.setScalar(leafScale);
            dummy.updateMatrix();
            leafInst.setMatrixAt(leafIdx++, dummy.matrix);
          }
        }
      }
    }
  }

  branchInst.instanceMatrix.needsUpdate = true;
  leafInst.instanceMatrix.needsUpdate = true;
  fuzzInst.instanceMatrix.needsUpdate = true;

  plantGroup.add(branchInst);
  plantGroup.add(leafInst);
  plantGroup.add(fuzzInst);

  return plantGroup;
}

// ── Hāpuʻu (Hawaiian Tree Fern) procedural model ──
export function createHapuu() {
  const hapuuGroup = new THREE.Group();
  const dummy = new THREE.Object3D();
  const colorHelper = new THREE.Color();

  const trunkHeight = 3.5;
  const trunkRadiusBase = 0.4;
  const trunkRadiusTop = 0.3;
  const numFronds = 10;
  const numEmerging = 3;
  const numFiddleheads = 3;
  const totalLeaves = 3000;
  const totalFuzz = 2000;

  const barkMat = new THREE.MeshStandardMaterial({ color: 0x5c3a21, roughness: 0.9, metalness: 0.05 });
  const fiberMat = new THREE.MeshStandardMaterial({ color: 0x9e6c27, roughness: 1.0, metalness: 0.0 });
  const leafMat = new THREE.MeshStandardMaterial({ color: 0x3d6e27, roughness: 0.7, metalness: 0.0, side: THREE.DoubleSide });

  // Trunk
  const trunkGeo = new THREE.CylinderGeometry(trunkRadiusTop, trunkRadiusBase, trunkHeight, 10, 1);
  trunkGeo.translate(0, trunkHeight / 2, 0);
  hapuuGroup.add(new THREE.Mesh(trunkGeo, barkMat));

  // Pulu fuzz (instanced)
  const fuzzGeo = new THREE.CylinderGeometry(0.004, 0.001, 0.15, 3);
  fuzzGeo.translate(0, 0.075, 0);
  const fuzzInst = new THREE.InstancedMesh(fuzzGeo, fiberMat, totalFuzz);
  hapuuGroup.add(fuzzInst);
  let fuzzIdx = 0;

  const trunkFuzzCount = Math.floor(totalFuzz * 0.7);
  for (let i = 0; i < trunkFuzzCount && fuzzIdx < totalFuzz; i++) {
    const h = Math.random() * trunkHeight;
    const theta = Math.random() * Math.PI * 2;
    const r = trunkRadiusBase - (trunkRadiusBase - trunkRadiusTop) * (h / trunkHeight);
    dummy.position.set(Math.cos(theta) * r, h, Math.sin(theta) * r);
    const normal = new THREE.Vector3(Math.cos(theta), 0, Math.sin(theta));
    const droop = normal.clone().add(new THREE.Vector3(0, -0.6 + Math.random() * 0.2, 0)).normalize();
    dummy.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), droop);
    dummy.updateMatrix();
    fuzzInst.setMatrixAt(fuzzIdx++, dummy.matrix);
  }

  // Leaf instances
  const leafGeo = new THREE.ConeGeometry(0.05, 0.6, 4);
  leafGeo.translate(0, 0.3, 0);
  const leafInst = new THREE.InstancedMesh(leafGeo, leafMat, totalLeaves);
  hapuuGroup.add(leafInst);
  let leafIdx = 0;

  function createFrondCurve(angle: number, isEmerging: boolean): THREE.CatmullRomCurve3 {
    const start = new THREE.Vector3(0, trunkHeight - 0.1, 0);
    const length = isEmerging ? 2.0 + Math.random() * 0.5 : 3.5 + Math.random() * 1.0;
    const out = new THREE.Vector3(Math.cos(angle), 0, Math.sin(angle));
    const p1 = start.clone().add(out.clone().multiplyScalar(length * 0.3)).add(new THREE.Vector3(0, length * 0.5, 0));
    const p2h = isEmerging ? length * 0.7 : length * 0.3;
    const p2 = start.clone().add(out.clone().multiplyScalar(length * 0.7)).add(new THREE.Vector3(0, p2h, 0));
    const p3h = isEmerging ? length * 0.6 : -length * 0.2;
    const p3 = start.clone().add(out.clone().multiplyScalar(length)).add(new THREE.Vector3(0, p3h, 0));
    return new THREE.CatmullRomCurve3([start, p1, p2, p3]);
  }

  const totalStems = numFronds + numEmerging;
  for (let f = 0; f < totalStems; f++) {
    const isEmerging = f >= numFronds;
    const angle = (f / totalStems) * Math.PI * 2 + Math.random() * 0.2;
    const curve = createFrondCurve(angle, isEmerging);

    const stemGeo = new THREE.TubeGeometry(curve, 20, isEmerging ? 0.025 : 0.03, 4, false);
    hapuuGroup.add(new THREE.Mesh(stemGeo, barkMat));

    const numPairs = isEmerging ? 30 : 50;
    for (let p = 4; p < numPairs; p++) {
      if (leafIdx >= totalLeaves - 2) break;
      const t = p / numPairs;
      const position = curve.getPointAt(t);
      const tangent = curve.getTangentAt(t).normalize();
      const binormal = new THREE.Vector3().crossVectors(tangent, new THREE.Vector3(0, 1, 0)).normalize();
      const widthProfile = Math.pow(Math.sin(t * Math.PI), 0.7);
      const scaleFactor = widthProfile * (isEmerging ? 0.7 : 1.2);

      // fuzz near base of stems
      if (t < 0.2 && fuzzIdx < totalFuzz - 2) {
        dummy.position.copy(position).add(new THREE.Vector3((Math.random() - 0.5) * 0.05, (Math.random() - 0.5) * 0.05, (Math.random() - 0.5) * 0.05));
        dummy.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), new THREE.Vector3(Math.random() - 0.5, Math.random() - 0.5, Math.random() - 0.5).normalize());
        dummy.scale.setScalar(1);
        dummy.updateMatrix();
        fuzzInst.setMatrixAt(fuzzIdx++, dummy.matrix);
      }

      for (const dir of [1, -1]) {
        if (leafIdx >= totalLeaves) break;
        dummy.position.copy(position);
        const leafDir = binormal.clone().multiplyScalar(dir).add(tangent.clone().multiplyScalar(0.4)).normalize();
        const droop = new THREE.Vector3(0, -0.2 - (1 - widthProfile) * 0.3, 0);
        dummy.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), leafDir.add(droop).normalize());
        dummy.scale.set(scaleFactor, scaleFactor, 0.1);
        dummy.updateMatrix();

        const light = isEmerging ? 0.35 + t * 0.15 : 0.2 + t * 0.1;
        colorHelper.setHSL(0.28, 0.6, light);
        leafInst.setMatrixAt(leafIdx, dummy.matrix);
        leafInst.setColorAt(leafIdx, colorHelper);
        leafIdx++;
      }
    }
  }

  // Fiddleheads
  for (let fh = 0; fh < numFiddleheads; fh++) {
    const fhAngle = (fh / numFiddleheads) * Math.PI * 2;
    const spiralPts: THREE.Vector3[] = [];
    const origin = new THREE.Vector3(0, trunkHeight - 0.1, 0);
    const outDir = new THREE.Vector3(Math.cos(fhAngle), 0, Math.sin(fhAngle));
    const turns = 2.5;
    const ptCount = 40;

    for (let i = 0; i <= ptCount; i++) {
      const t = i / ptCount;
      const theta = t * turns * Math.PI * 2;
      const r = 0.2 * (1 - t);
      spiralPts.push(
        origin.clone()
          .add(outDir.clone().multiplyScalar(t * 0.4 + r * Math.cos(theta)))
          .add(new THREE.Vector3(0, 0.3 + r * Math.sin(theta), 0))
      );
    }

    const fhCurve = new THREE.CatmullRomCurve3(spiralPts);
    hapuuGroup.add(new THREE.Mesh(new THREE.TubeGeometry(fhCurve, 30, 0.04, 5, false), barkMat));

    for (let p = 0; p < ptCount * 6 && fuzzIdx < totalFuzz; p++) {
      const pt = fhCurve.getPointAt(Math.random());
      const tan = fhCurve.getTangentAt(Math.random()).normalize();
      const rand = new THREE.Vector3(Math.random() - 0.5, Math.random() - 0.5, Math.random() - 0.5).normalize();
      const out = new THREE.Vector3().crossVectors(tan, rand).normalize();
      dummy.position.copy(pt).add(out.clone().multiplyScalar(0.04));
      dummy.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), out);
      dummy.scale.setScalar(0.6);
      dummy.updateMatrix();
      fuzzInst.setMatrixAt(fuzzIdx++, dummy.matrix);
    }
  }

  fuzzInst.instanceMatrix.needsUpdate = true;
  leafInst.instanceMatrix.needsUpdate = true;
  if (leafInst.instanceColor) leafInst.instanceColor.needsUpdate = true;

  return hapuuGroup;
}

// ── ʻUlu (Breadfruit) procedural tree ──
export function createUluTree() {
  const treeGroup = new THREE.Group();

  const barkMat = new THREE.MeshStandardMaterial({ color: 0x6b6357, roughness: 0.85 });
  const leafMat = new THREE.MeshStandardMaterial({ color: 0x183b1a, roughness: 0.25, metalness: 0.05, side: THREE.DoubleSide });
  const fruitMat = new THREE.MeshStandardMaterial({ color: 0x8fb359, roughness: 0.7 });

  const baseLeafGeo = new THREE.SphereGeometry(1, 8, 8);
  const stemGeo = new THREE.CylinderGeometry(0.04, 0.06, 3, 5);
  stemGeo.translate(0, 1.5, 0);
  const fruitBumpGeo = new THREE.SphereGeometry(0.12, 6, 6);

  function addLeaves(branch: THREE.Group, branchLen: number) {
    const numLeaves = 6 + Math.floor(Math.random() * 4);
    for (let i = 0; i < numLeaves; i++) {
      const leafGrp = new THREE.Group();
      leafGrp.add(new THREE.Mesh(stemGeo, leafMat));

      const addLobe = (y: number, xOff: number, sX: number, sY: number, rotZ: number) => {
        const lobe = new THREE.Mesh(baseLeafGeo, leafMat);
        lobe.position.set(xOff, y, 0);
        lobe.scale.set(sX, sY, 0.08);
        lobe.rotation.z = rotZ;
        leafGrp.add(lobe);
      };
      addLobe(2.8,  0,    0.6, 0.9, 0);
      addLobe(2.2,  0.5,  0.5, 0.8, -Math.PI / 4);
      addLobe(2.2, -0.5,  0.5, 0.8,  Math.PI / 4);
      addLobe(1.5,  0.7,  0.6, 0.9, -Math.PI / 3.5);
      addLobe(1.5, -0.7,  0.6, 0.9,  Math.PI / 3.5);
      addLobe(0.8,  0.5,  0.5, 0.7, -Math.PI / 2.5);
      addLobe(0.8, -0.5,  0.5, 0.7,  Math.PI / 2.5);

      leafGrp.position.y = branchLen - Math.random() * 1.0;
      leafGrp.rotation.y = (Math.PI * 2 / numLeaves) * i + Math.random() * 0.3;
      leafGrp.rotation.z = Math.PI / 3 + Math.random() * 0.3;
      leafGrp.rotation.x = Math.random() * 0.2 - 0.1;
      const s = 0.8 + Math.random() * 0.4;
      leafGrp.scale.setScalar(s);
      branch.add(leafGrp);
    }
  }

  function addFruit(branch: THREE.Group, branchLen: number) {
    const fruitGrp = new THREE.Group();
    const coreRadius = 0.6;
    fruitGrp.add(new THREE.Mesh(new THREE.SphereGeometry(coreRadius, 8, 8), fruitMat));

    const numBumps = 80;
    const phi = Math.PI * (3 - Math.sqrt(5));
    const bumpInst = new THREE.InstancedMesh(fruitBumpGeo, fruitMat, numBumps);
    const _dummy = new THREE.Object3D();
    for (let i = 0; i < numBumps; i++) {
      const y = 1 - (i / (numBumps - 1)) * 2;
      const r = Math.sqrt(1 - y * y);
      const theta = phi * i;
      _dummy.position.set(Math.cos(theta) * r * coreRadius * 0.95, y * coreRadius * 0.95, Math.sin(theta) * r * coreRadius * 0.95);
      _dummy.scale.set(1, 1, 0.4);
      _dummy.updateMatrix();
      bumpInst.setMatrixAt(i, _dummy.matrix);
    }
    bumpInst.instanceMatrix.needsUpdate = true;
    fruitGrp.add(bumpInst);

    const fruitStemGeo = new THREE.CylinderGeometry(0.04, 0.04, 0.8);
    fruitStemGeo.translate(0, 0.4, 0);
    fruitGrp.add(new THREE.Mesh(fruitStemGeo, barkMat));
    fruitGrp.position.y = branchLen - 0.5 - Math.random();
    fruitGrp.rotation.z = -Math.PI / 4;
    branch.add(fruitGrp);
  }

  function buildBranch(
    parentGroup: THREE.Object3D, depth: number, maxDepth: number,
    length: number, startR: number, endR: number, angleY: number, angleZ: number
  ) {
    const branchGroup = new THREE.Group();
    const branchGeo = new THREE.CylinderGeometry(endR, startR, length, 7);
    branchGeo.translate(0, length / 2, 0);
    branchGroup.add(new THREE.Mesh(branchGeo, barkMat));
    branchGroup.rotation.y = angleY;
    branchGroup.rotation.z = angleZ;
    parentGroup.add(branchGroup);

    if (depth < maxDepth) {
      const numChildren = depth === 0 ? 4 : (Math.random() > 0.4 ? 3 : 2);
      for (let i = 0; i < numChildren; i++) {
        const childAngleY = (Math.PI * 2 / numChildren) * i + (Math.random() * 0.4 - 0.2);
        const childAngleZ = Math.PI / 4 + Math.random() * 0.2;
        const childLength = length * (0.6 + Math.random() * 0.15);
        const childBase = new THREE.Group();
        childBase.position.y = length * (0.8 + Math.random() * 0.2);
        branchGroup.add(childBase);
        buildBranch(childBase, depth + 1, maxDepth, childLength, endR, endR * 0.6, childAngleY, childAngleZ);
      }
    } else {
      addLeaves(branchGroup as THREE.Group, length);
      if (Math.random() > 0.4) addFruit(branchGroup as THREE.Group, length);
    }
  }

  buildBranch(treeGroup, 0, 3, 9, 0.8, 0.5, 0, 0);
  return treeGroup;
}

// ── Kukui (Candlenut) procedural tree ──
export function createKukuiTree() {
  const treeGroup = new THREE.Group();

  const barkMat = new THREE.MeshStandardMaterial({ color: 0x6e665d, roughness: 0.95 });
  const leafMatSilvery = new THREE.MeshStandardMaterial({ color: 0x9cb099, roughness: 0.6, side: THREE.DoubleSide });
  const leafMatMature = new THREE.MeshStandardMaterial({ color: 0x6b805f, roughness: 0.4, side: THREE.DoubleSide });
  const fruitMat = new THREE.MeshStandardMaterial({ color: 0x8a8a56, roughness: 0.8 });
  const flowerMat = new THREE.MeshStandardMaterial({ color: 0xfdfdf0, roughness: 0.5 });

  const lobeBaseGeo = new THREE.ConeGeometry(0.4, 1.5, 3);
  lobeBaseGeo.translate(0, 0.75, 0);
  const leafCenterBaseGeo = new THREE.SphereGeometry(0.3, 4, 3);
  const leafStemGeo = new THREE.CylinderGeometry(0.04, 0.06, 0.8, 3);
  leafStemGeo.translate(0, 0.4, 0);
  const nutGeo = new THREE.SphereGeometry(0.4, 6, 5);
  const flowerGeo = new THREE.SphereGeometry(0.15, 4, 3);

  function createStem(startVec: THREE.Vector3, endVec: THREE.Vector3, radius: number) {
    const vec = new THREE.Vector3().subVectors(endVec, startVec);
    const length = vec.length();
    const stemGeo = new THREE.CylinderGeometry(radius * 0.7, radius, length, 3);
    const stemMesh = new THREE.Mesh(stemGeo, barkMat);
    stemMesh.position.copy(startVec).add(vec.clone().multiplyScalar(0.5));
    const up = new THREE.Vector3(0, 1, 0);
    stemMesh.quaternion.setFromUnitVectors(up, vec.clone().normalize());
    return stemMesh;
  }

  function createLobedLeaf(mature: boolean) {
    const mat = mature ? leafMatMature : leafMatSilvery;
    const leafOrigin = new THREE.Group();
    const addLobe = (sx: number, sy: number, rz: number, py: number) => {
      const m = new THREE.Mesh(lobeBaseGeo, mat);
      m.scale.set(sx, sy, 0.05);
      m.rotation.z = rz;
      m.position.y = py;
      leafOrigin.add(m);
    };
    addLobe(1.0, 1.2, 0, 0.6);
    addLobe(0.8, 1.0, Math.PI / 4, 0.4);
    addLobe(0.8, 1.0, -Math.PI / 4, 0.4);
    addLobe(0.5, 0.7, Math.PI / 2.2, 0.2);
    addLobe(0.5, 0.7, -Math.PI / 2.2, 0.2);
    const center = new THREE.Mesh(leafCenterBaseGeo, mat);
    center.scale.set(1, 0.8, 0.05);
    center.position.y = 0.4;
    leafOrigin.add(center);
    leafOrigin.add(new THREE.Mesh(leafStemGeo, barkMat));
    return leafOrigin;
  }

  function addFruits(parent: THREE.Group) {
    const origin = new THREE.Vector3();
    for (let i = 0; i < Math.floor(Math.random() * 3) + 1; i++) {
      const pos = new THREE.Vector3(
        (Math.random() - 0.5) * 0.8, -0.5 - Math.random() * 0.5, (Math.random() - 0.5) * 0.8
      );
      const nut = new THREE.Mesh(nutGeo, fruitMat);
      nut.scale.set(1, 1.2, 1);
      nut.position.copy(pos);
      parent.add(nut);
      parent.add(createStem(origin, pos, 0.04));
    }
  }

  function addFlowers(parent: THREE.Group) {
    const pg = new THREE.Group();
    pg.position.y = 0.5;
    const base = new THREE.Vector3(0, -0.5, 0);
    const center = new THREE.Vector3(0, 0.5, 0);
    pg.add(createStem(base, center, 0.05));
    for (let i = 0; i < 15; i++) {
      const fp = new THREE.Vector3(
        (Math.random() - 0.5) * 1.5, Math.random() * 1.5, (Math.random() - 0.5) * 1.5
      );
      const f = new THREE.Mesh(flowerGeo, flowerMat);
      f.position.copy(fp);
      pg.add(f);
      pg.add(createStem(center, fp, 0.015));
    }
    parent.add(pg);
  }

  function addCluster(branchParent: THREE.Object3D, branchLength: number) {
    const cg = new THREE.Group();
    cg.position.y = branchLength;
    branchParent.add(cg);
    const numLeaves = Math.floor(Math.random() * 4) + 5;
    for (let i = 0; i < numLeaves; i++) {
      const leaf = createLobedLeaf(Math.random() > 0.6);
      leaf.rotation.y = (Math.PI * 2 / numLeaves) * i + Math.random() * 0.5;
      leaf.rotation.x = Math.PI / 2 + (Math.random() * 0.8 - 0.2);
      const s = 0.8 + Math.random() * 0.4;
      leaf.scale.setScalar(s);
      cg.add(leaf);
    }
    const r = Math.random();
    if (r > 0.85) addFruits(cg);
    else if (r > 0.70) addFlowers(cg);
  }

  const maxDepth = 4;

  function buildBranch(parent: THREE.Object3D, radius: number, length: number, depth: number) {
    const branchGeo = new THREE.CylinderGeometry(radius * 0.65, radius, length, 4);
    branchGeo.translate(0, length / 2, 0);
    parent.add(new THREE.Mesh(branchGeo, barkMat));

    if (depth > 0) {
      const numChildren = depth === maxDepth ? 6 : 3;
      for (let i = 0; i < numChildren; i++) {
        const cg = new THREE.Group();
        cg.position.y = length * (0.75 + Math.random() * 0.25);
        const tilt = 0.6 + Math.random() * 0.3;
        const radial = (Math.PI * 2 / numChildren) * i + (Math.random() * 0.3 - 0.15);
        cg.rotation.set(tilt, radial, 0, "YXZ");
        cg.quaternion.slerp(new THREE.Quaternion(), 0.4);
        parent.add(cg);
        buildBranch(cg, radius * 0.65, length * 0.75, depth - 1);
      }
      if (depth <= 2) {
        const extras = depth === 2 ? 1 : 2;
        for (let j = 0; j < extras; j++) {
          if (Math.random() > 0.3) addCluster(parent, length * (0.3 + Math.random() * 0.6));
        }
      }
    } else {
      addCluster(parent, length);
    }
  }

  buildBranch(treeGroup, 1.3, 7.0, maxDepth);
  return treeGroup;
}

// ── Kupukupu procedural fern ──
export function createKupukupuFern() {
  const fernGroup = new THREE.Group();
  const stemMaterial = new THREE.MeshStandardMaterial({ color: 0x5e482b, roughness: 0.8 });
  const leafMaterial = new THREE.MeshStandardMaterial({ color: 0x4a7c29, roughness: 0.6 });
  const leafGeo = new THREE.SphereGeometry(1, 6, 6);
  leafGeo.scale(0.35, 0.04, 0.09);
  leafGeo.translate(0.35, 0, 0);

  function buildFrond(lengthScale: number) {
    const frondGroup = new THREE.Group();
    const numSegments = 25 + Math.floor(Math.random() * 20);
    const spread = (1.5 + Math.random() * 1.5) * lengthScale;
    const height = (1.2 + Math.random() * 1.5) * lengthScale;
    const curvePoints: THREE.Vector3[] = [];
    const leafPlacements: { pos: THREE.Vector3; pitch: number; size: number }[] = [];

    for (let i = 0; i <= numSegments; i++) {
      const t = i / numSegments;
      const z = t * spread;
      const y = Math.sin(t * Math.PI * 0.85) * height;
      const pos = new THREE.Vector3(0, y, z);
      curvePoints.push(pos);
      if (i > 2 && i < numSegments) {
        const size = Math.sin(t * Math.PI) * (0.6 + Math.random() * 0.4) * lengthScale;
        const prevY = Math.sin(((i - 1) / numSegments) * Math.PI * 0.85) * height;
        const prevZ = ((i - 1) / numSegments) * spread;
        const pitch = Math.atan2(y - prevY, z - prevZ);
        leafPlacements.push({ pos, pitch, size });
      }
    }

    const curve = new THREE.CatmullRomCurve3(curvePoints);
    const stemGeo = new THREE.TubeGeometry(curve, numSegments, 0.015 * lengthScale, 5, false);
    const stemMesh = new THREE.Mesh(stemGeo, stemMaterial);
    stemMesh.castShadow = true;
    frondGroup.add(stemMesh);

    leafPlacements.forEach(placement => {
      const pairGroup = new THREE.Group();
      pairGroup.position.copy(placement.pos);
      pairGroup.rotation.x = -placement.pitch;
      const rightLeaf = new THREE.Mesh(leafGeo, leafMaterial);
      rightLeaf.scale.set(placement.size, placement.size, placement.size);
      rightLeaf.rotation.y = 0.15;
      rightLeaf.rotation.z = 0.15;
      rightLeaf.castShadow = true;
      pairGroup.add(rightLeaf);
      const leftLeaf = new THREE.Mesh(leafGeo, leafMaterial);
      leftLeaf.scale.set(placement.size, placement.size, placement.size);
      leftLeaf.rotation.y = Math.PI - 0.15;
      leftLeaf.rotation.z = -0.15;
      leftLeaf.castShadow = true;
      pairGroup.add(leftLeaf);
      frondGroup.add(pairGroup);
    });
    return frondGroup;
  }

  const numFronds = 70 + Math.floor(Math.random() * 30);
  for (let i = 0; i < numFronds; i++) {
    const lengthScale = 0.5 + Math.random() * 0.8;
    const frond = buildFrond(lengthScale);
    const baseAngle = (i / numFronds) * Math.PI * 2 + Math.random() * 0.2;
    frond.rotation.y = baseAngle;
    frond.position.x = (Math.random() - 0.5) * 3.5;
    frond.position.z = (Math.random() - 0.5) * 3.5;
    fernGroup.add(frond);
  }
  return fernGroup;
}

// ── Kalo (Taro) procedural plant ──
export function createKaloPlant() {
  const plantGroup = new THREE.Group();
  const matCorm = new THREE.MeshStandardMaterial({ color: 0x4a3225, roughness: 0.9, metalness: 0.05 });
  const matRoot = new THREE.MeshStandardMaterial({ color: 0x7a5c43, roughness: 0.95, metalness: 0.0 });
  const matLeafFlesh = new THREE.MeshStandardMaterial({ color: 0x366e2d, roughness: 0.85, metalness: 0.05, side: THREE.DoubleSide });
  const matVein = new THREE.MeshStandardMaterial({ color: 0x5a9e45, roughness: 0.7, metalness: 0.0 });
  const sphereGeo = new THREE.SphereGeometry(1, 16, 12);
  const cylinderGeo = new THREE.CylinderGeometry(1, 1, 1, 8);
  cylinderGeo.translate(0, 0.5, 0);

  // Corm
  const cormGroup = new THREE.Group();
  const numCormSlices = 10;
  const cormBaseHeight = 0.5;
  for (let i = 0; i < numCormSlices; i++) {
    const t = i / (numCormSlices - 1);
    const radius = Math.sin(t * Math.PI) * 2.5 + 0.8;
    const sliceGeo = new THREE.CylinderGeometry(radius * 0.9, radius, cormBaseHeight, 16);
    const slice = new THREE.Mesh(sliceGeo, matCorm);
    slice.position.set((Math.random() - 0.5) * 0.2, i * cormBaseHeight * 0.8, (Math.random() - 0.5) * 0.2);
    slice.castShadow = true;
    slice.receiveShadow = true;
    cormGroup.add(slice);
  }

  // Roots
  const numRoots = 45;
  for (let i = 0; i < numRoots; i++) {
    const rootGroup = new THREE.Group();
    const phi = Math.PI / 2 + Math.random() * (Math.PI / 2);
    const theta = Math.random() * Math.PI * 2;
    const radiusC = 2.0;
    let currP = new THREE.Vector3(
      radiusC * Math.sin(phi) * Math.cos(theta),
      (radiusC * Math.cos(phi)) + (cormBaseHeight * 3),
      radiusC * Math.sin(phi) * Math.sin(theta)
    );
    let currDir = currP.clone().normalize();
    currDir.y -= 0.5;
    currDir.normalize();
    const numSegments = 4 + Math.floor(Math.random() * 3);
    let currentThickness = 0.08;
    for (let k = 0; k < numSegments; k++) {
      const segLen = 0.4 + Math.random() * 0.5;
      const nextP = currP.clone().add(currDir.clone().multiplyScalar(segLen));
      const nextThickness = currentThickness * 0.7;
      const rGeo = new THREE.CylinderGeometry(nextThickness, currentThickness, segLen, 5);
      const rMesh = new THREE.Mesh(rGeo, matRoot);
      rMesh.position.copy(currP.clone().lerp(nextP, 0.5));
      rMesh.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), currDir);
      rootGroup.add(rMesh);
      currP = nextP;
      currentThickness = nextThickness;
      currDir.add(new THREE.Vector3((Math.random()-0.5)*0.8, (Math.random()-0.5)*0.4, (Math.random()-0.5)*0.8)).normalize();
    }
    cormGroup.add(rootGroup);
  }
  plantGroup.add(cormGroup);

  // Leaf builder
  function buildTaroLeaf(length: number, width: number) {
    const leafGroup = new THREE.Group();
    const heightLobe = length * 0.35;
    const numBodySteps = 16;
    const numLobeSteps = 8;
    const getZOffset = (x: number, y: number) => -0.04 * (x * x + Math.pow(Math.max(0, -y), 1.3));

    for (let i = 0; i <= numBodySteps; i++) {
      const t = i / numBodySteps;
      const y = -t * length;
      const widthF = (1 - Math.pow(t, 1.4)) * width;
      const zOffset = getZOffset(0, y) + i * 0.002;
      const flesh = new THREE.Mesh(sphereGeo, matLeafFlesh);
      flesh.position.set(0, y, zOffset);
      flesh.scale.set(widthF * 0.5, (length / numBodySteps) * 1.8, 0.06);
      flesh.castShadow = true;
      flesh.receiveShadow = true;
      leafGroup.add(flesh);
      if (i < numBodySteps) {
        const nextY = -((i + 1) / numBodySteps) * length;
        const nextZ = getZOffset(0, nextY);
        const veinLen = y - nextY;
        const vRadius1 = 0.18 * (1 - t) + 0.03;
        const vRadius2 = 0.18 * (1 - ((i + 1) / numBodySteps)) + 0.03;
        const vein = new THREE.Mesh(new THREE.CylinderGeometry(vRadius2, vRadius1, veinLen * 1.1, 6), matVein);
        vein.position.set(0, (y + nextY) / 2, (zOffset + nextZ) / 2 + 0.08);
        leafGroup.add(vein);
      }
      if (i > 1 && i < numBodySteps - 2 && i % 2 === 0) {
        const veinSpread = widthF * 0.85;
        const latLen = Math.sqrt(Math.pow(veinSpread / 2, 2) + Math.pow(length * 0.15, 2));
        const vThickness = 0.06 * (1 - t) + 0.02;
        const leftVein = new THREE.Mesh(new THREE.CylinderGeometry(0.01, vThickness, latLen, 5), matVein);
        leftVein.position.set(-veinSpread / 4, y - length * 0.075, zOffset + 0.06);
        leftVein.rotation.z = Math.atan2(length * 0.15, veinSpread / 2);
        leafGroup.add(leftVein);
        const rightVein = new THREE.Mesh(new THREE.CylinderGeometry(0.01, vThickness, latLen, 5), matVein);
        rightVein.position.set(veinSpread / 4, y - length * 0.075, zOffset + 0.06);
        rightVein.rotation.z = -Math.atan2(length * 0.15, veinSpread / 2);
        leafGroup.add(rightVein);
      }
    }

    for (const side of [-1, 1]) {
      for (let i = 0; i <= numLobeSteps; i++) {
        const t = i / numLobeSteps;
        const x = side * t * width * 0.42;
        const y = t * heightLobe;
        const widthF = (1 - Math.pow(t, 1.8)) * (width * 0.45);
        const flesh = new THREE.Mesh(sphereGeo, matLeafFlesh);
        const zOffset = getZOffset(x, y) + i * 0.002 - 0.02;
        flesh.position.set(x, y, zOffset);
        flesh.rotation.z = side * -Math.PI / 5 * t;
        flesh.scale.set(widthF, (heightLobe / numLobeSteps) * 2.0, 0.06);
        flesh.castShadow = true;
        flesh.receiveShadow = true;
        leafGroup.add(flesh);
        if (i < numLobeSteps) {
          const nextT = (i + 1) / numLobeSteps;
          const nextX = side * nextT * width * 0.42;
          const nextY = nextT * heightLobe;
          const vLen = Math.sqrt((nextX - x)**2 + (nextY - y)**2);
          const vRadius1 = 0.12 * (1 - t) + 0.02;
          const vRadius2 = 0.12 * (1 - nextT) + 0.02;
          const vein = new THREE.Mesh(new THREE.CylinderGeometry(vRadius2, vRadius1, vLen * 1.1, 6), matVein);
          vein.position.set((x + nextX) / 2, (y + nextY) / 2, zOffset + 0.08);
          vein.rotation.z = Math.atan2(y - nextY, x - nextX) + Math.PI / 2;
          leafGroup.add(vein);
        }
      }
    }
    return leafGroup;
  }

  // Stalks and leaves
  const numStalks = 6 + Math.floor(Math.random() * 3);
  const topOfCorm = numCormSlices * cormBaseHeight * 0.8;
  for (let i = 0; i < numStalks; i++) {
    const isCenterSprout = (i === 0);
    const angle = (i / numStalks) * Math.PI * 2 + (Math.random() * 0.5);
    const stalkHeight = isCenterSprout ? 28 : 20 + Math.random() * 10;
    const stalkLean = isCenterSprout ? 2 : 12 + Math.random() * 8;
    const p0 = new THREE.Vector3(Math.cos(angle) * 0.5, topOfCorm, Math.sin(angle) * 0.5);
    const p1 = new THREE.Vector3(Math.cos(angle) * stalkLean * 0.5, topOfCorm + stalkHeight * 0.4, Math.sin(angle) * stalkLean * 0.5);
    const p2 = new THREE.Vector3(Math.cos(angle) * stalkLean, topOfCorm + stalkHeight, Math.sin(angle) * stalkLean);
    const curve = new THREE.QuadraticBezierCurve3(p0, p1, p2);
    const stalkSegments = 12;
    const stalkGroup = new THREE.Group();
    for (let j = 0; j < stalkSegments; j++) {
      const t1 = j / stalkSegments;
      const t2 = (j + 1) / stalkSegments;
      const pt1 = curve.getPoint(t1);
      const pt2 = curve.getPoint(t2);
      const radius1 = THREE.MathUtils.lerp(1.8, 0.4, t1);
      const radius2 = THREE.MathUtils.lerp(1.8, 0.4, t2);
      const dist = pt1.distanceTo(pt2);
      const stalkMat = new THREE.MeshStandardMaterial({
        color: new THREE.Color().lerpColors(new THREE.Color(0x6b4f62), new THREE.Color(0x84b55e), t1),
        roughness: 0.6,
        metalness: 0.05
      });
      const segGeo = new THREE.CylinderGeometry(radius2, radius1, dist * 1.05, 12);
      const seg = new THREE.Mesh(segGeo, stalkMat);
      seg.position.copy(pt1.clone().lerp(pt2, 0.5));
      const dir = pt2.clone().sub(pt1).normalize();
      seg.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), dir);
      if (j < 3) seg.scale.set(1.2, 1, 0.8);
      seg.castShadow = true;
      seg.receiveShadow = true;
      stalkGroup.add(seg);
    }
    plantGroup.add(stalkGroup);

    if (isCenterSprout) {
      const sproutGroup = new THREE.Group();
      sproutGroup.position.copy(p2);
      const sproutDir = curve.getTangent(1).normalize();
      sproutGroup.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), sproutDir);
      const sMesh = new THREE.Mesh(
        new THREE.CylinderGeometry(0.05, 0.4, 8, 8),
        new THREE.MeshStandardMaterial({ color: 0x98d46a, roughness: 0.7 })
      );
      sMesh.position.y = 4;
      sproutGroup.add(sMesh);
      plantGroup.add(sproutGroup);
    } else {
      const leafLength = 16 + Math.random() * 6;
      const leafWidth = 10 + Math.random() * 5;
      const leaf = buildTaroLeaf(leafLength, leafWidth);
      leaf.position.copy(p2);
      const stalkTangent = curve.getTangent(1).normalize();
      const droopVector = new THREE.Vector3(0, -1.2, 0);
      const targetPos = p2.clone().add(stalkTangent).add(droopVector);
      leaf.lookAt(targetPos);
      leaf.rotateX(-Math.PI / 2);
      leaf.rotateY((Math.random() - 0.5) * 0.4);
      plantGroup.add(leaf);
    }
  }

  plantGroup.position.y = -topOfCorm * 0.5;
  return plantGroup;
}

// ── Build a simple generic placeholder plant ──
function createGenericPlant() {
  const group = new THREE.Group();
  const mat = new THREE.MeshStandardMaterial({ color: 0x4CAF50, roughness: 0.7, flatShading: true });
  const bush = new THREE.Mesh(new THREE.DodecahedronGeometry(0.3, 0), mat);
  bush.position.y = 0.25;
  group.add(bush);
  return group;
}

// ── Build a complete plant model group with per-plant scale ──
export function buildPlantModel(plantId: string): THREE.Group {
  // Return a clone of the cached model if available (shares geometry/material GPU buffers)
  const cached = _modelCache.get(plantId);
  if (cached) return cached.clone();

  const group = new THREE.Group();
  const plantMat = new THREE.MeshStandardMaterial({ color: 0x4CAF50, roughness: 0.7, flatShading: true });
  const trunkMat = new THREE.MeshStandardMaterial({ color: 0x5D4037, roughness: 0.9, flatShading: true });
  const flowerMat = new THREE.MeshStandardMaterial({ color: 0xE91E63, roughness: 0.6, flatShading: true });

  switch (plantId) {
    case "kalo":
    case "taro": {
      const kalo = createKaloPlant();
      group.add(kalo);
      group.scale.set(0.35, 0.35, 0.35);
      break;
    }
    case "kukui": {
      const kukui = createKukuiTree();
      group.add(kukui);
      group.scale.set(2.0, 2.0, 2.0);
      break;
    }
    case "ohia": {
      const ohia = createOhiaTree();
      group.add(ohia);
      group.scale.set(2.0, 2.0, 2.0);
      break;
    }
    case "naupaka": {
      const naupaka = createNaupakaBush();
      group.add(naupaka);
      group.scale.set(0.35, 0.35, 0.35);
      break;
    }
    case "pohinahina": {
      const pohinahina = createPohinahina();
      group.add(pohinahina);
      group.scale.set(0.45, 0.45, 0.45);
      break;
    }
    case "kupukupu": {
      const fern = createKupukupuFern();
      group.add(fern);
      group.scale.set(0.45, 0.45, 0.45);
      break;
    }
    case "hapuu": {
      const hapuu = createHapuu();
      group.add(hapuu);
      group.scale.set(2.0, 2.0, 2.0);
      break;
    }
    case "loulu": {
      const loulu = createLoulu();
      group.add(loulu);
      group.scale.set(2.0, 2.0, 2.0);
      break;
    }
    case "ulu": {
      const ulu = createUluTree();
      group.add(ulu);
      group.scale.set(2.0, 2.0, 2.0);
      break;
    }
    case "lai": {
      const lai = createLai();
      group.add(lai);
      group.scale.set(2.0, 2.0, 2.0);
      break;
    }
    case "limu": {
      const limu = createLimuKohu();
      group.add(limu);
      group.scale.set(0.35, 0.35, 0.35);
      break;
    }
    default: {
      group.add(createGenericPlant());
    }
  }

  // Ensure all meshes in the group cast/receive shadows
  group.traverse((child) => {
    if (child instanceof THREE.Mesh) {
      child.castShadow = true;
      child.receiveShadow = true;
    }
  });

  // Cache a clone so subsequent placements avoid rebuilding from scratch
  _modelCache.set(plantId, group.clone());

  return group;
}
