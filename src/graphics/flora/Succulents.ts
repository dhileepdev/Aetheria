import * as THREE from 'three';
import { calculatePhyllotaxis } from '../../utils/math';
import { createContactShadowTexture } from '../textures';

export class SucculentModel extends THREE.Group {
  public growthGroup: THREE.Group;

  constructor(scale: number = 0.85, growthStage: number = 1.0) {
    super();

    this.growthGroup = new THREE.Group();
    this.add(this.growthGroup);

    // Ground Contact Shadow
    const shadowGeo = new THREE.PlaneGeometry(0.55, 0.55);
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

    // Base root core
    const coreGeo = new THREE.ConeGeometry(0.12, 0.14, 8);
    const coreMat = new THREE.MeshStandardMaterial({
      color: 0x3d4a36,
      roughness: 0.8,
    });
    const coreMesh = new THREE.Mesh(coreGeo, coreMat);
    coreMesh.rotation.x = Math.PI;
    coreMesh.position.y = 0.05;
    this.growthGroup.add(coreMesh);

    // Leaf shape for ExtrudeGeometry
    const shape = new THREE.Shape();
    shape.moveTo(0, 0);
    shape.quadraticCurveTo(0.06, 0.15, 0.05, 0.35);
    shape.quadraticCurveTo(0, 0.44, 0, 0.46);
    shape.quadraticCurveTo(-0.05, 0.35, -0.06, 0.15);
    shape.closePath();

    const extrudeSettings: THREE.ExtrudeGeometryOptions = {
      depth: 0.04,
      bevelEnabled: true,
      bevelSegments: 3,
      steps: 1,
      bevelSize: 0.02,
      bevelThickness: 0.025,
    };

    const leafGeo = new THREE.ExtrudeGeometry(shape, extrudeSettings);
    leafGeo.center();

    // 22 leaves arranged in phyllotaxis
    const totalLeaves = 22;
    const maxRadius = 0.28;

    for (let i = 0; i < totalLeaves; i++) {
      const { angle, radius } = calculatePhyllotaxis(i, totalLeaves, maxRadius);
      const heightY = 0.04 + (i / totalLeaves) * 0.14;

      // Color variation: inner leaves are fresher mint, outer leaves develop blush/coral edges
      const isOuter = i < 8;
      const leafMat = new THREE.MeshStandardMaterial({
        color: isOuter ? 0x6e907d : 0x88b79e,
        roughness: 0.35,
        metalness: 0.05,
      });

      const leafMesh = new THREE.Mesh(leafGeo, leafMat);
      
      // Position leaf
      leafMesh.position.set(Math.cos(angle) * radius, heightY, Math.sin(angle) * radius);
      
      // Orient outwards and tilt upwards (inner leaves point higher)
      const outwardTilt = THREE.MathUtils.lerp(0.85, 0.25, i / totalLeaves);
      leafMesh.rotation.y = -angle + Math.PI / 2;
      leafMesh.rotation.x = outwardTilt;

      const leafScale = THREE.MathUtils.lerp(1.2, 0.45, i / totalLeaves);
      leafMesh.scale.set(leafScale, leafScale, leafScale);
      leafMesh.castShadow = true;
      leafMesh.receiveShadow = true;

      this.growthGroup.add(leafMesh);
    }

    this.applyScaleAndGrowth(scale, growthStage);
  }

  public applyScaleAndGrowth(scale: number, growth: number) {
    const effectiveGrowth = Math.max(0.3, growth);
    this.growthGroup.scale.set(scale * effectiveGrowth, scale * effectiveGrowth, scale * effectiveGrowth);
  }
}
