import * as THREE from 'three';
import { createContactShadowTexture } from '../textures';

export class PitcherPlantModel extends THREE.Group {
  public growthGroup: THREE.Group;

  constructor(scale: number = 0.9, growthStage: number = 1.0) {
    super();

    this.growthGroup = new THREE.Group();
    this.add(this.growthGroup);

    // Ground Contact Shadow
    const shadowGeo = new THREE.PlaneGeometry(0.5, 0.5);
    const shadowMat = new THREE.MeshBasicMaterial({
      map: createContactShadowTexture(),
      transparent: true,
      depthWrite: false,
      opacity: 0.5,
    });
    const shadow = new THREE.Mesh(shadowGeo, shadowMat);
    shadow.rotation.x = -Math.PI / 2;
    shadow.position.y = 0.005;
    this.growthGroup.add(shadow);

    const leafMat = new THREE.MeshStandardMaterial({
      color: 0x3d702b,
      roughness: 0.5,
    });

    const pitcherMat = new THREE.MeshStandardMaterial({
      color: 0x8a383b,
      roughness: 0.35,
      metalness: 0.1,
    });

    const peristomeMat = new THREE.MeshStandardMaterial({
      color: 0x4a8527,
      roughness: 0.2,
      metalness: 0.15,
    });

    // Pitchers hanging from leaves
    for (let i = 0; i < 3; i++) {
      const angle = (i * Math.PI * 2) / 3;
      const leafGroup = new THREE.Group();
      leafGroup.rotation.y = angle;

      // Leaf base
      const leafGeo = new THREE.CylinderGeometry(0.04, 0.02, 0.3, 6);
      leafGeo.rotateZ(Math.PI / 3);
      const leafMesh = new THREE.Mesh(leafGeo, leafMat);
      leafMesh.position.set(0.12, 0.15, 0);
      leafMesh.castShadow = true;
      leafGroup.add(leafMesh);

      // Pitcher cup (swollen lower body, cylindrical neck)
      const points: THREE.Vector2[] = [
        new THREE.Vector2(0, 0),
        new THREE.Vector2(0.06, 0.04),
        new THREE.Vector2(0.08, 0.12),
        new THREE.Vector2(0.06, 0.22),
        new THREE.Vector2(0.05, 0.26),
      ];
      const cupGeo = new THREE.LatheGeometry(points, 12);
      const cupMesh = new THREE.Mesh(cupGeo, pitcherMat);
      cupMesh.position.set(0.24, 0.02, 0);
      cupMesh.castShadow = true;
      leafGroup.add(cupMesh);

      // Ribbed peristome lip
      const torusGeo = new THREE.TorusGeometry(0.052, 0.012, 6, 16);
      torusGeo.rotateX(Math.PI / 2);
      const torusMesh = new THREE.Mesh(torusGeo, peristomeMat);
      torusMesh.position.set(0.24, 0.28, 0);
      leafGroup.add(torusMesh);

      // Pitcher lid hood
      const lidGeo = new THREE.CircleGeometry(0.05, 8);
      lidGeo.rotateX(Math.PI / 3);
      const lidMesh = new THREE.Mesh(lidGeo, pitcherMat);
      lidMesh.position.set(0.24, 0.31, 0.02);
      leafGroup.add(lidMesh);

      this.growthGroup.add(leafGroup);
    }

    this.applyScaleAndGrowth(scale, growthStage);
  }

  public applyScaleAndGrowth(scale: number, growth: number) {
    const effectiveGrowth = Math.max(0.3, growth);
    this.growthGroup.scale.set(scale * effectiveGrowth, scale * effectiveGrowth, scale * effectiveGrowth);
  }
}
