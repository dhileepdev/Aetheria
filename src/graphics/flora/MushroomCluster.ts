import * as THREE from 'three';
import { createContactShadowTexture } from '../textures';

export class MushroomClusterModel extends THREE.Group {
  public growthGroup: THREE.Group;
  private capMaterials: THREE.MeshStandardMaterial[] = [];
  public glowLight: THREE.PointLight;

  constructor(scale: number = 1.0, growthStage: number = 1.0, glowColorHex: number = 0x2af2b5) {
    super();

    this.growthGroup = new THREE.Group();
    this.add(this.growthGroup);

    // Ground Contact Shadow
    const shadowGeo = new THREE.PlaneGeometry(0.65, 0.65);
    const shadowMat = new THREE.MeshBasicMaterial({
      map: createContactShadowTexture(),
      transparent: true,
      depthWrite: false,
      opacity: 0.55,
    });
    const shadow = new THREE.Mesh(shadowGeo, shadowMat);
    shadow.rotation.x = -Math.PI / 2;
    shadow.position.y = 0.005;
    this.growthGroup.add(shadow);

    // Stalk Material
    const stalkMat = new THREE.MeshStandardMaterial({
      color: 0xd9e5d6,
      roughness: 0.8,
      metalness: 0.05,
      emissive: glowColorHex,
      emissiveIntensity: 0.12,
    });

    // Cap Material with Emissive Glow
    const capMat = new THREE.MeshStandardMaterial({
      color: 0x16423b,
      roughness: 0.35,
      metalness: 0.15,
      emissive: glowColorHex,
      emissiveIntensity: 0.45,
    });
    this.capMaterials.push(capMat);

    // Gills Material
    const gillsMat = new THREE.MeshStandardMaterial({
      color: 0x0f2b25,
      roughness: 0.6,
      emissive: glowColorHex,
      emissiveIntensity: 0.6,
    });
    this.capMaterials.push(gillsMat);

    // Subtle Night Glow Point Light
    this.glowLight = new THREE.PointLight(glowColorHex, 0.4, 2.5);
    this.glowLight.position.set(0, 0.45, 0);
    this.growthGroup.add(this.glowLight);

    // Mushroom specifications: height, radius, x, z, leanAngle
    const mushrooms = [
      { height: 0.55, capR: 0.18, x: 0, z: 0, lean: 0.12, leanDir: 0.4 },
      { height: 0.42, capR: 0.14, x: 0.16, z: 0.08, lean: 0.18, leanDir: 1.2 },
      { height: 0.32, capR: 0.11, x: -0.14, z: 0.1, lean: 0.22, leanDir: -0.8 },
      { height: 0.22, capR: 0.08, x: 0.08, z: -0.15, lean: 0.15, leanDir: 2.5 },
    ];

    mushrooms.forEach((m) => {
      const shroomGroup = new THREE.Group();
      shroomGroup.position.set(m.x, 0, m.z);

      // Stalk curve
      const stalkTopX = Math.cos(m.leanDir) * m.lean * m.height;
      const stalkTopZ = Math.sin(m.leanDir) * m.lean * m.height;

      const curve = new THREE.CatmullRomCurve3([
        new THREE.Vector3(0, 0, 0),
        new THREE.Vector3(stalkTopX * 0.4, m.height * 0.5, stalkTopZ * 0.4),
        new THREE.Vector3(stalkTopX, m.height, stalkTopZ),
      ]);

      const stalkGeo = new THREE.TubeGeometry(curve, 12, m.capR * 0.22, 8, false);
      const stalkMesh = new THREE.Mesh(stalkGeo, stalkMat);
      stalkMesh.castShadow = true;
      stalkMesh.receiveShadow = true;
      shroomGroup.add(stalkMesh);

      // Cap using LatheGeometry for smooth organic bell profile
      const points: THREE.Vector2[] = [];
      const steps = 10;
      for (let i = 0; i <= steps; i++) {
        const u = i / steps; // 0 (tip) to 1 (rim)
        const rad = Math.sin(u * Math.PI * 0.5) * m.capR;
        const y = (1.0 - Math.cos(u * Math.PI * 0.5)) * -m.capR * 0.75;
        points.push(new THREE.Vector2(rad, y));
      }
      // Inner rim tuck
      points.push(new THREE.Vector2(m.capR * 0.85, -m.capR * 0.72));
      points.push(new THREE.Vector2(m.capR * 0.3, -m.capR * 0.6));

      const capGeo = new THREE.LatheGeometry(points, 16);
      const capMesh = new THREE.Mesh(capGeo, capMat);
      capMesh.position.set(stalkTopX, m.height + m.capR * 0.4, stalkTopZ);
      capMesh.rotation.z = Math.cos(m.leanDir) * m.lean * 0.8;
      capMesh.rotation.x = Math.sin(m.leanDir) * m.lean * 0.8;
      capMesh.castShadow = true;
      capMesh.receiveShadow = true;
      shroomGroup.add(capMesh);

      // Radial Gills disc underneath
      const gillsGeo = new THREE.CylinderGeometry(m.capR * 0.82, m.capR * 0.82, 0.02, 16);
      const gillsMesh = new THREE.Mesh(gillsGeo, gillsMat);
      gillsMesh.position.set(stalkTopX, m.height - 0.02, stalkTopZ);
      gillsMesh.rotation.copy(capMesh.rotation);
      shroomGroup.add(gillsMesh);

      this.growthGroup.add(shroomGroup);
    });

    this.applyScaleAndGrowth(scale, growthStage);
  }

  public setNightGlow(isNight: boolean, timeOfDay: number) {
    // Bioluminescence glows strongest in darkness
    const nightIntensity = isNight ? 1.0 : 0.2;
    this.capMaterials.forEach((mat) => {
      mat.emissiveIntensity = 0.2 + nightIntensity * 0.7;
    });
    this.glowLight.intensity = 0.1 + nightIntensity * 0.65;
  }

  public applyScaleAndGrowth(scale: number, growth: number) {
    const effectiveGrowth = Math.max(0.25, growth);
    this.growthGroup.scale.set(scale * effectiveGrowth, scale * effectiveGrowth, scale * effectiveGrowth);
  }
}
