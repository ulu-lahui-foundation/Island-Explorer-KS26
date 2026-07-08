import * as THREE from "three";

// ── ʻŌhiʻa Lehua procedural tree ──
export function createOhiaTree() {
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
    fruitGrp.add(new THREE.Mesh(new THREE.SphereGeometry(coreRadius, 10, 10), fruitMat));

    const numBumps = 80;
    const phi = Math.PI * (3 - Math.sqrt(5));
    for (let i = 0; i < numBumps; i++) {
      const y = 1 - (i / (numBumps - 1)) * 2;
      const r = Math.sqrt(1 - y * y);
      const theta = phi * i;
      const bump = new THREE.Mesh(fruitBumpGeo, fruitMat);
      bump.position.set(Math.cos(theta) * r * coreRadius * 0.95, y * coreRadius * 0.95, Math.sin(theta) * r * coreRadius * 0.95);
      bump.scale.set(1, 1, 0.4);
      fruitGrp.add(bump);
    }

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
      group.scale.set(0.6, 0.6, 0.6);
      break;
    }
    case "ohia": {
      const ohia = createOhiaTree();
      group.add(ohia);
      group.scale.set(5, 5, 5);
      break;
    }
    case "naupaka": {
      const naupaka = createNaupakaBush();
      group.add(naupaka);
      group.scale.set(8, 8, 8);
      break;
    }
    case "pohinahina": {
      const bush = new THREE.Mesh(new THREE.DodecahedronGeometry(0.4, 0), plantMat);
      bush.position.y = 0.25;
      bush.scale.set(1.2, 0.6, 1.2);
      group.add(bush);
      break;
    }
    case "kupukupu": {
      const fern = createKupukupuFern();
      group.add(fern);
      group.scale.set(4, 4, 4);
      break;
    }
    case "palapalai": {
      const palapalai = createPalapalai();
      group.add(palapalai);
      group.scale.set(0.8, 0.8, 0.8);
      break;
    }
    case "hapuu": {
      const hapuu = createHapuu();
      group.add(hapuu);
      group.scale.set(0.5, 0.5, 0.5);
      break;
    }
    case "loulu": {
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
      break;
    }
    case "ilima": {
      const bush = new THREE.Mesh(new THREE.DodecahedronGeometry(0.3, 0), plantMat);
      bush.position.y = 0.2;
      bush.scale.set(1, 0.7, 1);
      group.add(bush);
      for (let i = 0; i < 4; i++) {
        const flower = new THREE.Mesh(new THREE.SphereGeometry(0.08, 6, 6), new THREE.MeshStandardMaterial({ color: 0xFFD700, roughness: 0.5 }));
        flower.position.set((Math.random() - 0.5) * 0.4, 0.4 + Math.random() * 0.2, (Math.random() - 0.5) * 0.4);
        group.add(flower);
      }
      break;
    }
    case "aalii": {
      const bush = new THREE.Mesh(new THREE.DodecahedronGeometry(0.35, 0), plantMat);
      bush.position.y = 0.3;
      group.add(bush);
      for (let i = 0; i < 6; i++) {
        const pod = new THREE.Mesh(new THREE.CapsuleGeometry(0.03, 0.15, 4, 4), new THREE.MeshStandardMaterial({ color: 0x8B0000, roughness: 0.6 }));
        pod.position.set((Math.random() - 0.5) * 0.5, 0.5 + Math.random() * 0.2, (Math.random() - 0.5) * 0.5);
        group.add(pod);
      }
      break;
    }
    case "ulu": {
      const ulu = createUluTree();
      group.add(ulu);
      group.scale.set(0.55, 0.55, 0.55);
      break;
    }
    case "lai": {
      for (let i = 0; i < 5; i++) {
        const leaf = new THREE.Mesh(new THREE.PlaneGeometry(0.15, 0.8), plantMat);
        leaf.position.set((Math.random() - 0.5) * 0.2, 0.3 + i * 0.15, (Math.random() - 0.5) * 0.2);
        leaf.rotation.y = Math.random() * Math.PI * 2;
        leaf.rotation.x = -0.2;
        group.add(leaf);
      }
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

  return group;
}
