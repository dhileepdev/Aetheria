import * as THREE from 'three';
import { createContactShadowTexture } from '../textures';

export class OrchidModel extends THREE.Group {
  public growthGroup: THREE.Group;

  constructor(scale: number = 0.85, growthStage: number = 1.0) {
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

    // Thick basal leaves
    const leafGeo = new THREE.ConeGeometry(0.08, 0.35, 6);
    leafGeo.scale(1.2, 1, 0.35);
    const leafMat = new THREE.MeshStandardMaterial({
      color: 0x225528,
      roughness: 0.4,
      metalness: 0.1,
    });

    for (let i = 0; i < 4; i++) {
      const l = new THREE.Mesh(leafGeo, leafMat);
      const angle = (i * Math.PI) / 2 + 0.3;
      l.position.set(Math.cos(angle) * 0.12, 0.08, Math.sin(angle) * 0.12);
      l.rotation.z = Math.cos(angle) * 0.7;
      l.rotation.x = -Math.sin(angle) * 0.7;
      l.castShadow = true;
      this.growthGroup.add(l);
    }

    // Flower spike stem
    const spikeCurve = new THREE.CatmullRomCurve3([
      new THREE.Vector3(0, 0, 0),
      new THREE.Vector3(0.04, 0.25, 0.02),
      new THREE.Vector3(0.12, 0.5, -0.04),
      new THREE.Vector3(0.18, 0.7, 0.02),
    ]);
    const stemGeo = new THREE.TubeGeometry(spikeCurve, 14, 0.012, 6, false);
    const stemMat = new THREE.MeshStandardMaterial({ color: 0x3d5c2a, roughness: 0.7 });
    const stemMesh = new THREE.Mesh(stemGeo, stemMat);
    stemMesh.castShadow = true;
    this.growthGroup.add(stemMesh);

    // Blossoms at stem tips
    const flowerLocations = [
      new THREE.Vector3(0.09, 0.45, -0.02),
      new THREE.Vector3(0.16, 0.62, 0.0),
      new THREE.Vector3(0.2, 0.74, 0.03),
    ];

    const petalMat = new THREE.MeshStandardMaterial({
      color: 0xf5dded,
      roughness: 0.3,
      metalness: 0.05,
    });

    const lipMat = new THREE.MeshStandardMaterial({
      color: 0xc82b82,
      roughness: 0.25,
      metalness: 0.1,
    });

    flowerLocations.forEach((loc, idx) => {
      const blossom = new THREE.Group();
      blossom.position.copy(loc);

      // 5 Petals
      for (let p = 0; p < 5; p++) {
        const petalGeo = new THREE.SphereGeometry(0.06, 8, 8);
        petalGeo.scale(0.5, 1.2, 0.2);
        const petalMesh = new THREE.Mesh(petalGeo, petalMat);
        const pAngle = (p * Math.PI * 2) / 5;
        petalMesh.position.set(Math.cos(pAngle) * 0.04, Math.sin(pAngle) * 0.04, 0);
        petalMesh.rotation.z = pAngle;
        petalMesh.castShadow = true;
        blossom.add(petalMesh);
      }

      // Central Lip / Labellum
      const lipGeo = new THREE.SphereGeometry(0.04, 8, 8);
      lipGeo.scale(1.2, 1.4, 0.6);
      const lipMesh = new THREE.Mesh(lipGeo, lipMat);
      lipMesh.position.set(0, -0.04, 0.02);
      blossom.add(lipMesh);

      blossom.scale.setScalar(0.7 + idx * 0.15);
      this.growthGroup.add(blossom);
    });

    this.applyScaleAndGrowth(scale, growthStage);
  }

  public applyScaleAndGrowth(scale: number, growth: number) {
    const effectiveGrowth = Math.max(0.3, growth);
    this.growthGroup.scale.set(scale * effectiveGrowth, scale * effectiveGrowth, scale * effectiveGrowth);
  }
}
