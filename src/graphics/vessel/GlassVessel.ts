import * as THREE from 'three';
import { GlassTint, VesselType } from '../../types/terrarium';
import { createCondensationNormalMap } from '../textures';

export class GlassVesselModel extends THREE.Group {
  public lidGroup: THREE.Group;
  public baseGroup: THREE.Group;
  public glassMaterial: THREE.MeshPhysicalMaterial;
  private metalMaterial: THREE.MeshStandardMaterial;
  private condensationTexture: THREE.CanvasTexture;
  private currentVesselType: VesselType = 'bell_jar';
  private isSoftwareGl: boolean;

  constructor(isSoftwareGl: boolean = false) {
    super();
    this.isSoftwareGl = isSoftwareGl;

    this.baseGroup = new THREE.Group();
    this.lidGroup = new THREE.Group();
    this.add(this.baseGroup);
    this.add(this.lidGroup);

    this.condensationTexture = createCondensationNormalMap();

    // PBR Glass Material
    this.glassMaterial = new THREE.MeshPhysicalMaterial({
      color: 0xffffff,
      transmission: isSoftwareGl ? 0 : 0.94,
      roughness: 0.06,
      metalness: 0.08,
      ior: 1.52,
      thickness: 1.2,
      clearcoat: 1.0,
      clearcoatRoughness: 0.05,
      transparent: true,
      opacity: isSoftwareGl ? 0.22 : 1.0,
      depthWrite: false, // Ensures interior plants render cleanly without sorting artifacts
    });

    // Metallic Brass Base & Trims
    this.metalMaterial = new THREE.MeshStandardMaterial({
      color: 0xc89d58,
      metalness: 0.88,
      roughness: 0.28,
    });

    this.buildVessel('bell_jar');
  }

  public setGlassTint(tint: GlassTint) {
    switch (tint) {
      case 'clear':
        this.glassMaterial.color.setHex(0xffffff);
        this.glassMaterial.attenuationColor?.setHex(0xffffff);
        break;
      case 'emerald':
        this.glassMaterial.color.setHex(0xd6f7e8);
        this.glassMaterial.attenuationColor?.setHex(0x38b27d);
        break;
      case 'amber':
        this.glassMaterial.color.setHex(0xfcefd7);
        this.glassMaterial.attenuationColor?.setHex(0xd69e2e);
        break;
      case 'smoky':
        this.glassMaterial.color.setHex(0xced3db);
        this.glassMaterial.attenuationColor?.setHex(0x4a5568);
        break;
    }
  }

  public setHumidity(humidity: number) {
    // Show condensation droplets when humidity > 60%
    if (humidity > 60) {
      this.glassMaterial.normalMap = this.condensationTexture;
      const factor = (humidity - 60) / 40;
      this.glassMaterial.normalScale.set(factor * 0.4, factor * 0.4);
    } else {
      this.glassMaterial.normalMap = null;
    }
    this.glassMaterial.needsUpdate = true;
  }

  public setLidProgress(progress: number) {
    // Smoothly lift the glass dome upwards
    this.lidGroup.position.y = progress * 2.2;
    this.lidGroup.rotation.y = progress * 0.25;
  }

  public buildVessel(type: VesselType) {
    this.currentVesselType = type;

    // Clear existing children
    while (this.baseGroup.children.length > 0) {
      this.baseGroup.remove(this.baseGroup.children[0]);
    }
    while (this.lidGroup.children.length > 0) {
      this.lidGroup.remove(this.lidGroup.children[0]);
    }

    // 1. Polished Metal Base Rim (shared pedestal)
    const basePedestalGeo = new THREE.CylinderGeometry(2.05, 2.15, 0.14, 48);
    const basePedestal = new THREE.Mesh(basePedestalGeo, this.metalMaterial);
    basePedestal.position.y = -0.58;
    basePedestal.castShadow = true;
    basePedestal.receiveShadow = true;
    this.baseGroup.add(basePedestal);

    const rimRingGeo = new THREE.TorusGeometry(1.98, 0.035, 12, 48);
    rimRingGeo.rotateX(Math.PI / 2);
    const rimRing = new THREE.Mesh(rimRingGeo, this.metalMaterial);
    rimRing.position.y = -0.48;
    this.baseGroup.add(rimRing);

    if (type === 'bell_jar') {
      this.buildBellJar();
    } else if (type === 'wardian_geo') {
      this.buildWardianGeo();
    } else if (type === 'hex_pagoda') {
      this.buildHexPagoda();
    } else if (type === 'sphere_bowl') {
      this.buildSphereBowl();
    }
  }

  private buildBellJar() {
    // Cylindrical dome with curved top hemisphere using LatheGeometry
    const points: THREE.Vector2[] = [];
    const r = 1.95;
    const cylinderHeight = 1.6;
    const domeHeight = 0.9;

    // Bottom lip
    points.push(new THREE.Vector2(r + 0.04, -0.45));
    points.push(new THREE.Vector2(r, -0.45));

    // Vertical cylinder body
    const vertSteps = 12;
    for (let i = 0; i <= vertSteps; i++) {
      const y = -0.45 + (i / vertSteps) * cylinderHeight;
      points.push(new THREE.Vector2(r, y));
    }

    // Curved top dome
    const domeSteps = 16;
    for (let i = 0; i <= domeSteps; i++) {
      const phi = (i / domeSteps) * (Math.PI / 2);
      const rad = Math.cos(phi) * r;
      const y = -0.45 + cylinderHeight + Math.sin(phi) * domeHeight;
      points.push(new THREE.Vector2(rad, y));
    }

    const clocheGeo = new THREE.LatheGeometry(points, 48);
    const clocheMesh = new THREE.Mesh(clocheGeo, this.glassMaterial);
    clocheMesh.castShadow = !this.isSoftwareGl;
    clocheMesh.receiveShadow = true;
    this.lidGroup.add(clocheMesh);

    // Turned brass finial handle on top
    const finialGeo = new THREE.SphereGeometry(0.12, 16, 12);
    const finial = new THREE.Mesh(finialGeo, this.metalMaterial);
    finial.position.y = -0.45 + cylinderHeight + domeHeight + 0.08;
    finial.castShadow = true;
    this.lidGroup.add(finial);

    const finialNeckGeo = new THREE.CylinderGeometry(0.04, 0.08, 0.1, 16);
    const finialNeck = new THREE.Mesh(finialNeckGeo, this.metalMaterial);
    finialNeck.position.y = -0.45 + cylinderHeight + domeHeight + 0.02;
    this.lidGroup.add(finialNeck);
  }

  private buildWardianGeo() {
    // Faceted geodesic dodecahedron glass terrarium
    const radius = 2.15;
    const geo = new THREE.DodecahedronGeometry(radius, 1);
    
    // Glass panels
    const glassMesh = new THREE.Mesh(geo, this.glassMaterial);
    glassMesh.position.y = 0.9;
    this.lidGroup.add(glassMesh);

    // Copper solder wireframe seams
    const wireGeo = new THREE.WireframeGeometry(geo);
    const wireMat = new THREE.LineBasicMaterial({
      color: 0xb87333,
      linewidth: 2,
    });
    const wireMesh = new THREE.LineSegments(wireGeo, wireMat);
    wireMesh.position.y = 0.9;
    this.lidGroup.add(wireMesh);
  }

  private buildHexPagoda() {
    // Hexagonal greenhouse pagoda vessel
    const hexRadius = 2.0;
    const wallHeight = 1.8;

    // Hexagonal prism lower body
    const bodyGeo = new THREE.CylinderGeometry(hexRadius, hexRadius, wallHeight, 6, 1, true);
    const bodyMesh = new THREE.Mesh(bodyGeo, this.glassMaterial);
    bodyMesh.position.y = -0.45 + wallHeight / 2;
    this.lidGroup.add(bodyMesh);

    // Hexagonal pitched roof pyramid
    const roofHeight = 1.0;
    const roofGeo = new THREE.ConeGeometry(hexRadius * 1.05, roofHeight, 6, 1, false);
    const roofMesh = new THREE.Mesh(roofGeo, this.glassMaterial);
    roofMesh.position.y = -0.45 + wallHeight + roofHeight / 2;
    this.lidGroup.add(roofMesh);

    // Brass corner strut rib columns
    for (let i = 0; i < 6; i++) {
      const angle = (i * Math.PI * 2) / 6;
      const strutGeo = new THREE.CylinderGeometry(0.025, 0.025, wallHeight, 8);
      const strut = new THREE.Mesh(strutGeo, this.metalMaterial);
      strut.position.set(Math.cos(angle) * hexRadius, -0.45 + wallHeight / 2, Math.sin(angle) * hexRadius);
      this.lidGroup.add(strut);
    }
  }

  private buildSphereBowl() {
    // Spherical bio-bowl with top circular opening
    const sphereRadius = 2.1;
    // Sphere with phiLength leaving top open
    const bowlGeo = new THREE.SphereGeometry(
      sphereRadius,
      48,
      32,
      0,
      Math.PI * 2,
      0.45, // starts with opening at top
      Math.PI - 0.45
    );
    const bowlMesh = new THREE.Mesh(bowlGeo, this.glassMaterial);
    bowlMesh.position.y = 0.8;
    this.lidGroup.add(bowlMesh);

    // Polished brass ring at top aperture
    const topRingRadius = Math.sin(0.45) * sphereRadius;
    const topRingGeo = new THREE.TorusGeometry(topRingRadius, 0.035, 12, 48);
    topRingGeo.rotateX(Math.PI / 2);
    const topRing = new THREE.Mesh(topRingGeo, this.metalMaterial);
    topRing.position.y = 0.8 + Math.cos(0.45) * sphereRadius;
    this.lidGroup.add(topRing);
  }
}
