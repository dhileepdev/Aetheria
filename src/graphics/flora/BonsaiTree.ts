import * as THREE from 'three';
import { createBarkTexture, createContactShadowTexture } from '../textures';

export class BonsaiTreeModel extends THREE.Group {
  public growthGroup: THREE.Group;
  private foliageMeshes: THREE.Mesh[] = [];

  constructor(scale: number = 1.0, growthStage: number = 1.0) {
    super();

    this.growthGroup = new THREE.Group();
    this.add(this.growthGroup);

    const { map: barkMap, roughnessMap: barkRough } = createBarkTexture();
    const barkMaterial = new THREE.MeshStandardMaterial({
      map: barkMap,
      roughnessMap: barkRough,
      roughness: 0.78,
      metalness: 0.08,
      color: 0x4a3325,
    });

    const leafMaterial = new THREE.MeshStandardMaterial({
      color: 0x275525,
      roughness: 0.65,
      metalness: 0.1,
    });

    // 1. Trunk Contact Shadow
    const shadowGeo = new THREE.PlaneGeometry(0.7, 0.7);
    const shadowMat = new THREE.MeshBasicMaterial({
      map: createContactShadowTexture(),
      transparent: true,
      depthWrite: false,
      opacity: 0.6,
    });
    const shadow = new THREE.Mesh(shadowGeo, shadowMat);
    shadow.rotation.x = -Math.PI / 2;
    shadow.position.y = 0.005;
    this.growthGroup.add(shadow);

    // 2. Trunk Curve using CatmullRomCurve3
    const trunkCurve = new THREE.CatmullRomCurve3([
      new THREE.Vector3(0, 0, 0),
      new THREE.Vector3(0.06, 0.25, 0.03),
      new THREE.Vector3(-0.08, 0.55, -0.04),
      new THREE.Vector3(0.04, 0.85, 0.06),
      new THREE.Vector3(-0.02, 1.15, 0.0),
    ]);

    const trunkGeo = new THREE.TubeGeometry(trunkCurve, 20, 0.075, 10, false);
    // Taper trunk geometry along Y
    const pos = trunkGeo.attributes.position;
    for (let i = 0; i < pos.count; i++) {
      const y = pos.getY(i);
      const factor = Math.max(0.4, 1.0 - (y / 1.2) * 0.55);
      pos.setX(i, pos.getX(i) * factor);
      pos.setZ(i, pos.getZ(i) * factor);
    }
    trunkGeo.computeVertexNormals();

    const trunkMesh = new THREE.Mesh(trunkGeo, barkMaterial);
    trunkMesh.castShadow = true;
    trunkMesh.receiveShadow = true;
    this.growthGroup.add(trunkMesh);

    // 3. Aerial anchor roots
    const rootPoints1 = [
      new THREE.Vector3(0, 0.15, 0),
      new THREE.Vector3(0.12, 0.06, 0.08),
      new THREE.Vector3(0.24, 0.0, 0.15),
    ];
    const rootGeo1 = new THREE.TubeGeometry(new THREE.CatmullRomCurve3(rootPoints1), 8, 0.025, 6, false);
    const rootMesh1 = new THREE.Mesh(rootGeo1, barkMaterial);
    rootMesh1.castShadow = true;
    this.growthGroup.add(rootMesh1);

    const rootPoints2 = [
      new THREE.Vector3(0, 0.18, 0),
      new THREE.Vector3(-0.14, 0.08, -0.06),
      new THREE.Vector3(-0.25, 0.0, -0.12),
    ];
    const rootGeo2 = new THREE.TubeGeometry(new THREE.CatmullRomCurve3(rootPoints2), 8, 0.022, 6, false);
    const rootMesh2 = new THREE.Mesh(rootGeo2, barkMaterial);
    rootMesh2.castShadow = true;
    this.growthGroup.add(rootMesh2);

    // 4. Primary Branches
    const branchCurve1 = new THREE.CatmullRomCurve3([
      new THREE.Vector3(-0.08, 0.55, -0.04),
      new THREE.Vector3(-0.28, 0.68, -0.12),
      new THREE.Vector3(-0.48, 0.72, -0.18),
    ]);
    const branchGeo1 = new THREE.TubeGeometry(branchCurve1, 10, 0.035, 6, false);
    const branch1 = new THREE.Mesh(branchGeo1, barkMaterial);
    branch1.castShadow = true;
    this.growthGroup.add(branch1);

    const branchCurve2 = new THREE.CatmullRomCurve3([
      new THREE.Vector3(0.04, 0.85, 0.06),
      new THREE.Vector3(0.32, 0.96, 0.12),
      new THREE.Vector3(0.55, 1.02, 0.16),
    ]);
    const branchGeo2 = new THREE.TubeGeometry(branchCurve2, 10, 0.03, 6, false);
    const branch2 = new THREE.Mesh(branchGeo2, barkMaterial);
    branch2.castShadow = true;
    this.growthGroup.add(branch2);

    // 5. Tiered Cloud-like Foliage Canopy Pads
    const foliageLocations = [
      { pos: new THREE.Vector3(-0.5, 0.75, -0.2), rx: 0.28, ry: 0.14, rz: 0.24, color: 0x224c20 },
      { pos: new THREE.Vector3(0.58, 1.05, 0.18), rx: 0.32, ry: 0.15, rz: 0.28, color: 0x295826 },
      { pos: new THREE.Vector3(-0.02, 1.25, 0.02), rx: 0.38, ry: 0.18, rz: 0.34, color: 0x2f662c },
      { pos: new THREE.Vector3(0.15, 1.35, -0.12), rx: 0.26, ry: 0.13, rz: 0.22, color: 0x367232 },
    ];

    foliageLocations.forEach((pad) => {
      const padGroup = new THREE.Group();
      padGroup.position.copy(pad.pos);

      // Main cloud cushion
      const padGeo = new THREE.SphereGeometry(1, 14, 10);
      padGeo.scale(pad.rx, pad.ry, pad.rz);
      const padMat = new THREE.MeshStandardMaterial({
        color: pad.color,
        roughness: 0.7,
        metalness: 0.05,
      });
      const padMesh = new THREE.Mesh(padGeo, padMat);
      padMesh.castShadow = true;
      padMesh.receiveShadow = true;
      padGroup.add(padMesh);
      this.foliageMeshes.push(padMesh);

      // Micro accent rosettes
      for (let j = 0; j < 3; j++) {
        const subGeo = new THREE.DodecahedronGeometry(pad.ry * 0.9, 1);
        const subMat = new THREE.MeshStandardMaterial({
          color: pad.color + 0x051205,
          roughness: 0.65,
        });
        const subMesh = new THREE.Mesh(subGeo, subMat);
        subMesh.position.set((Math.random() - 0.5) * pad.rx * 0.8, pad.ry * 0.4, (Math.random() - 0.5) * pad.rz * 0.8);
        subMesh.castShadow = true;
        padGroup.add(subMesh);
        this.foliageMeshes.push(subMesh);
      }

      this.growthGroup.add(padGroup);
    });

    this.applyScaleAndGrowth(scale, growthStage);
  }

  public applyScaleAndGrowth(scale: number, growth: number) {
    const effectiveGrowth = Math.max(0.2, growth);
    this.growthGroup.scale.set(scale * effectiveGrowth, scale * effectiveGrowth, scale * effectiveGrowth);
    
    // Foliage pads expand more as the tree matures
    this.foliageMeshes.forEach((mesh) => {
      mesh.scale.setScalar(0.4 + effectiveGrowth * 0.6);
    });
  }
}
