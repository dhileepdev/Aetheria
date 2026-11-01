import * as THREE from 'three';
import { createBarkTexture, createContactShadowTexture, createMossTexture } from '../textures';

/**
 * Returns the undulating terrain height at ground coordinates (x, z).
 */
export function getGroundHeightAt(x: number, z: number): number {
  const dist = Math.sqrt(x * x + z * z);
  if (dist > 1.95) return -0.4;
  
  // Gentle organic mounds: higher slightly in the back and center, dipping near edges
  const mound1 = Math.exp(-((x + 0.3) ** 2 + (z + 0.2) ** 2) * 1.5) * 0.22;
  const mound2 = Math.exp(-((x - 0.7) ** 2 + (z - 0.5) ** 2) * 2.2) * 0.16;
  const mound3 = Math.exp(-((x + 0.8) ** 2 + (z - 0.6) ** 2) * 2.0) * 0.14;
  const ripple = Math.sin(x * 3.5) * Math.cos(z * 3.5) * 0.04;

  return 0.12 + mound1 + mound2 + mound3 + ripple;
}

export class SubstrateModel extends THREE.Group {
  public mossMesh: THREE.Mesh;
  public contactShadow: THREE.Mesh;

  constructor() {
    super();

    // 1. Terrarium base contact shadow under entire vessel
    const shadowGeo = new THREE.PlaneGeometry(5.2, 5.2);
    const shadowMat = new THREE.MeshBasicMaterial({
      map: createContactShadowTexture(),
      transparent: true,
      depthWrite: false,
      opacity: 0.75,
    });
    this.contactShadow = new THREE.Mesh(shadowGeo, shadowMat);
    this.contactShadow.rotation.x = -Math.PI / 2;
    this.contactShadow.position.y = -0.65;
    this.add(this.contactShadow);

    // 2. Visible Geological Stratification (pebbles, charcoal, soil)
    // Layer 1: Drainage pebbles at very bottom
    const gravelGeo = new THREE.CylinderGeometry(1.82, 1.78, 0.25, 48);
    const gravelMat = new THREE.MeshStandardMaterial({
      color: 0x5a544d,
      roughness: 0.9,
      metalness: 0.1,
    });
    const gravelMesh = new THREE.Mesh(gravelGeo, gravelMat);
    gravelMesh.position.y = -0.5;
    gravelMesh.receiveShadow = true;
    this.add(gravelMesh);

    // Layer 2: Activated Charcoal filtration layer
    const charcoalGeo = new THREE.CylinderGeometry(1.84, 1.82, 0.18, 48);
    const charcoalMat = new THREE.MeshStandardMaterial({
      color: 0x1f1f22,
      roughness: 0.95,
      metalness: 0.05,
    });
    const charcoalMesh = new THREE.Mesh(charcoalGeo, charcoalMat);
    charcoalMesh.position.y = -0.32;
    charcoalMesh.receiveShadow = true;
    this.add(charcoalMesh);

    // Layer 3: Organic rich loam soil layer
    const soilGeo = new THREE.CylinderGeometry(1.88, 1.84, 0.28, 48);
    const soilMat = new THREE.MeshStandardMaterial({
      color: 0x2b1c11,
      roughness: 0.92,
      metalness: 0.0,
    });
    const soilMesh = new THREE.Mesh(soilGeo, soilMat);
    soilMesh.position.y = -0.12;
    soilMesh.receiveShadow = true;
    this.add(soilMesh);

    // 3. Living Undulating Moss Ground Carpet
    const mossRadius = 1.9;
    const mossSegments = 48;
    const mossGeo = new THREE.CircleGeometry(mossRadius, mossSegments);
    mossGeo.rotateX(-Math.PI / 2);

    // Displace vertices to form organic mounds
    const pos = mossGeo.attributes.position;
    for (let i = 0; i < pos.count; i++) {
      const vx = pos.getX(i);
      const vz = pos.getZ(i);
      const vy = getGroundHeightAt(vx, vz);
      pos.setY(i, vy);
    }
    mossGeo.computeVertexNormals();

    const { map: mossMap, bumpMap: mossBump } = createMossTexture();
    const mossMat = new THREE.MeshStandardMaterial({
      map: mossMap,
      bumpMap: mossBump,
      bumpScale: 0.05,
      roughness: 0.85,
      metalness: 0.05,
    });

    this.mossMesh = new THREE.Mesh(mossGeo, mossMat);
    this.mossMesh.receiveShadow = true;
    this.mossMesh.name = 'ground_moss';
    this.add(this.mossMesh);

    // 4. Subtle accent pebbles scattered on the moss
    this.buildScatterPebbles();
  }

  private buildScatterPebbles() {
    const pebbleGeo = new THREE.DodecahedronGeometry(0.06, 0);
    const pebbleMat = new THREE.MeshStandardMaterial({
      color: 0x7c7365,
      roughness: 0.8,
      metalness: 0.15,
    });

    const pebbleGroup = new THREE.Group();
    const pebbleCoords = [
      [-0.9, 0.4], [0.8, -0.7], [-0.3, -1.2], [1.1, 0.5],
      [-1.3, -0.4], [0.4, 1.2], [1.3, -0.2], [-0.5, 0.9]
    ];

    pebbleCoords.forEach(([px, pz], idx) => {
      const p = new THREE.Mesh(pebbleGeo, pebbleMat);
      const py = getGroundHeightAt(px, pz);
      p.position.set(px, py + 0.02, pz);
      const scale = 0.6 + (idx % 3) * 0.4;
      p.scale.set(scale * 1.3, scale * 0.7, scale);
      p.rotation.set(idx, idx * 2, idx * 0.5);
      p.castShadow = true;
      p.receiveShadow = true;
      pebbleGroup.add(p);
    });

    this.add(pebbleGroup);
  }
}
