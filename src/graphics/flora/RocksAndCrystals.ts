import * as THREE from 'three';
import { createContactShadowTexture } from '../textures';

export class RockGeodeModel extends THREE.Group {
  public growthGroup: THREE.Group;

  constructor(scale: number = 0.9, growthStage: number = 1.0) {
    super();

    this.growthGroup = new THREE.Group();
    this.add(this.growthGroup);

    // Ground Contact Shadow
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

    // 1. Faceted Outer Slate Rock
    const rockGeo = new THREE.DodecahedronGeometry(0.28, 1);
    // Perturb rock vertices for chiseled look
    const pos = rockGeo.attributes.position;
    for (let i = 0; i < pos.count; i++) {
      const vx = pos.getX(i);
      const vy = pos.getY(i);
      const vz = pos.getZ(i);
      const jitter = 0.88 + ((i * 37) % 25) / 100;
      pos.setXYZ(i, vx * jitter, Math.max(0.01, vy * jitter * 0.8), vz * jitter);
    }
    rockGeo.computeVertexNormals();

    const slateMat = new THREE.MeshStandardMaterial({
      color: 0x3d3d44,
      roughness: 0.88,
      metalness: 0.12,
    });
    const rockMesh = new THREE.Mesh(rockGeo, slateMat);
    rockMesh.position.y = 0.12;
    rockMesh.castShadow = true;
    rockMesh.receiveShadow = true;
    this.growthGroup.add(rockMesh);

    // 2. Sparkling Amethyst Crystal Spikes in Cavity
    const crystalGeo = new THREE.ConeGeometry(0.045, 0.18, 6);
    crystalGeo.translate(0, 0.09, 0);

    const crystalMat = new THREE.MeshStandardMaterial({
      color: 0x9b51e0,
      roughness: 0.15,
      metalness: 0.2,
      emissive: 0x4a1873,
      emissiveIntensity: 0.35,
    });

    const crystalConfigs = [
      { x: 0.02, y: 0.12, z: 0.04, rx: 0.2, rz: 0.1, s: 1.1 },
      { x: -0.06, y: 0.14, z: 0.02, rx: -0.3, rz: -0.2, s: 0.9 },
      { x: 0.08, y: 0.11, z: -0.03, rx: 0.4, rz: 0.3, s: 0.8 },
      { x: -0.02, y: 0.15, z: -0.05, rx: -0.2, rz: 0.4, s: 1.0 },
      { x: 0.05, y: 0.16, z: 0.06, rx: 0.1, rz: -0.3, s: 0.75 },
    ];

    crystalConfigs.forEach((cfg) => {
      const c = new THREE.Mesh(crystalGeo, crystalMat);
      c.position.set(cfg.x, cfg.y, cfg.z);
      c.rotation.x = cfg.rx;
      c.rotation.z = cfg.rz;
      c.scale.setScalar(cfg.s);
      c.castShadow = true;
      this.growthGroup.add(c);
    });

    this.applyScaleAndGrowth(scale, growthStage);
  }

  public applyScaleAndGrowth(scale: number, growth: number) {
    const effectiveGrowth = Math.max(0.3, growth);
    this.growthGroup.scale.set(scale * effectiveGrowth, scale * effectiveGrowth, scale * effectiveGrowth);
  }
}
