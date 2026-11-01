import * as THREE from 'three';
import { createContactShadowTexture } from '../textures';

export class FernModel extends THREE.Group {
  public growthGroup: THREE.Group;
  private frondGroups: { group: THREE.Group; baseAngle: number; archFactor: number }[] = [];

  constructor(scale: number = 1.0, growthStage: number = 1.0) {
    super();

    this.growthGroup = new THREE.Group();
    this.add(this.growthGroup);

    // Ground Contact Shadow
    const shadowGeo = new THREE.PlaneGeometry(0.7, 0.7);
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

    const stemMat = new THREE.MeshStandardMaterial({
      color: 0x3d6628,
      roughness: 0.65,
      metalness: 0.05,
    });

    const leafMat = new THREE.MeshStandardMaterial({
      color: 0x2e7834,
      roughness: 0.55,
      metalness: 0.08,
      side: THREE.DoubleSide,
    });

    // Fronds radiating out
    const numFronds = 7;
    for (let f = 0; f < numFronds; f++) {
      const frondAngle = (f / numFronds) * Math.PI * 2 + (f % 2) * 0.2;
      const frondGroup = new THREE.Group();
      frondGroup.rotation.y = frondAngle;

      const frondLength = 0.65 + (f % 3) * 0.12;
      const archFactor = 0.35 + (f % 2) * 0.1;

      // Rachis curve
      const stemCurve = new THREE.CatmullRomCurve3([
        new THREE.Vector3(0, 0, 0),
        new THREE.Vector3(frondLength * 0.3, frondLength * 0.45, 0),
        new THREE.Vector3(frondLength * 0.7, frondLength * 0.55, 0),
        new THREE.Vector3(frondLength, frondLength * 0.35 - archFactor * 0.2, 0),
      ]);

      const stemGeo = new THREE.TubeGeometry(stemCurve, 12, 0.012, 6, false);
      const stemMesh = new THREE.Mesh(stemGeo, stemMat);
      stemMesh.castShadow = true;
      frondGroup.add(stemMesh);

      // Pinnae leaflets
      const pinnaeCount = 10;
      for (let p = 1; p <= pinnaeCount; p++) {
        const u = p / pinnaeCount;
        const pt = stemCurve.getPoint(u);
        const pinnaScale = Math.sin(u * Math.PI) * 0.14;

        // Leaf geometry
        const leafGeo = new THREE.PlaneGeometry(pinnaScale, pinnaScale * 0.45);
        leafGeo.translate(pinnaScale * 0.5, 0, 0);

        // Left leaflet
        const leftLeaf = new THREE.Mesh(leafGeo, leafMat);
        leftLeaf.position.set(pt.x, pt.y, pt.z + 0.01);
        leftLeaf.rotation.x = 0.2;
        leftLeaf.rotation.y = 0.4;
        leftLeaf.castShadow = true;
        frondGroup.add(leftLeaf);

        // Right leaflet
        const rightLeaf = new THREE.Mesh(leafGeo, leafMat);
        rightLeaf.position.set(pt.x, pt.y, pt.z - 0.01);
        rightLeaf.rotation.x = -0.2;
        rightLeaf.rotation.y = -0.4;
        rightLeaf.castShadow = true;
        frondGroup.add(rightLeaf);
      }

      this.frondGroups.push({ group: frondGroup, baseAngle: frondAngle, archFactor });
      this.growthGroup.add(frondGroup);
    }

    this.applyScaleAndGrowth(scale, growthStage);
  }

  public updateWind(time: number, windStrength: number) {
    if (windStrength < 0.01) return;
    this.frondGroups.forEach((fg, idx) => {
      const sway = Math.sin(time * 2.5 + idx * 1.3) * windStrength * 0.08;
      fg.group.rotation.z = sway;
    });
  }

  public applyScaleAndGrowth(scale: number, growth: number) {
    const effectiveGrowth = Math.max(0.3, growth);
    this.growthGroup.scale.set(scale * effectiveGrowth, scale * effectiveGrowth, scale * effectiveGrowth);
  }
}
