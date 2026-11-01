import * as THREE from 'three';
import { getGroundHeightAt } from '../flora/Substrate';
import { FaunaEntity, FaunaState } from '../../types/terrarium';

export class PygmyGeckoModel extends THREE.Group {
  public entity: FaunaEntity;
  private legs: THREE.Mesh[] = [];
  private tailSegments: THREE.Mesh[] = [];
  private walkCycle: number = 0;

  constructor(id: string = 'gecko_1', startX: number = 0.5, startZ: number = -0.4) {
    super();

    this.entity = {
      id,
      species: 'pygmy_gecko',
      name: 'Emerald Pygmy Gecko',
      scientificName: 'Sphaerodactylus elegans',
      x: startX,
      y: getGroundHeightAt(startX, startZ),
      z: startZ,
      rotationY: Math.random() * Math.PI * 2,
      state: 'wandering',
      hunger: 40,
      energy: 90,
      favoriteFood: 'Tiny micro-crickets & sweet flower nectar',
      speed: 0.42,
      targetX: startX,
      targetZ: startZ,
      stateTimer: 4.0,
    };

    const geckoMat = new THREE.MeshStandardMaterial({
      color: 0x3f9152,
      roughness: 0.65,
      metalness: 0.1,
    });

    const underbellyMat = new THREE.MeshStandardMaterial({
      color: 0xc4dc9b,
      roughness: 0.6,
    });

    const eyeMat = new THREE.MeshStandardMaterial({
      color: 0x111111,
      roughness: 0.1,
    });

    const bodyGroup = new THREE.Group();
    bodyGroup.position.y = 0.04;

    // 1. Torso
    const torsoGeo = new THREE.SphereGeometry(0.065, 10, 8);
    torsoGeo.scale(0.7, 0.45, 1.4);
    const torso = new THREE.Mesh(torsoGeo, geckoMat);
    torso.castShadow = true;
    bodyGroup.add(torso);

    // 2. Underbelly
    const bellyGeo = new THREE.SphereGeometry(0.06, 8, 6);
    bellyGeo.scale(0.65, 0.35, 1.3);
    const belly = new THREE.Mesh(bellyGeo, underbellyMat);
    belly.position.y = -0.01;
    bodyGroup.add(belly);

    // 3. Head with snout & eyes
    const headGroup = new THREE.Group();
    headGroup.position.set(0, 0.015, 0.085);

    const headGeo = new THREE.ConeGeometry(0.045, 0.075, 8);
    headGeo.rotateX(Math.PI / 2);
    headGeo.scale(0.9, 0.6, 1.0);
    const head = new THREE.Mesh(headGeo, geckoMat);
    head.castShadow = true;
    headGroup.add(head);

    // Orbital Eyes
    const eyeGeo = new THREE.SphereGeometry(0.012, 6, 6);
    const leftEye = new THREE.Mesh(eyeGeo, eyeMat);
    leftEye.position.set(0.025, 0.012, 0.01);
    const rightEye = new THREE.Mesh(eyeGeo, eyeMat);
    rightEye.position.set(-0.025, 0.012, 0.01);
    headGroup.add(leftEye, rightEye);
    bodyGroup.add(headGroup);

    // 4. Undulating Tail (3 segments)
    let prevSeg: THREE.Object3D = bodyGroup;
    for (let t = 0; t < 3; t++) {
      const tailSeg = new THREE.Group();
      tailSeg.position.set(0, 0, t === 0 ? -0.08 : -0.06);

      const radius = 0.035 - t * 0.009;
      const tGeo = new THREE.CylinderGeometry(radius * 0.7, radius, 0.06, 6);
      tGeo.rotateX(Math.PI / 2);
      const tMesh = new THREE.Mesh(tGeo, geckoMat);
      tMesh.castShadow = true;
      tailSeg.add(tMesh);

      prevSeg.add(tailSeg);
      prevSeg = tailSeg;
      this.tailSegments.push(tMesh);
    }

    // 5. Four Splayed Limbs
    const limbGeo = new THREE.CylinderGeometry(0.007, 0.005, 0.065, 5);
    limbGeo.translate(0, -0.03, 0);

    const limbPositions = [
      { x: 0.045, z: 0.04, side: 1 },
      { x: -0.045, z: 0.04, side: -1 },
      { x: 0.045, z: -0.04, side: 1 },
      { x: -0.045, z: -0.04, side: -1 },
    ];

    limbPositions.forEach((lp) => {
      const leg = new THREE.Mesh(limbGeo, geckoMat);
      leg.position.set(lp.x, 0, lp.z);
      leg.rotation.z = -lp.side * 0.6;
      bodyGroup.add(leg);
      this.legs.push(leg);
    });

    this.add(bodyGroup);
    this.scale.setScalar(1.2);
    this.position.set(this.entity.x, this.entity.y, this.entity.z);
    this.rotation.y = this.entity.rotationY;
  }

  public update(delta: number) {
    this.entity.stateTimer -= delta;

    if (this.entity.stateTimer <= 0) {
      if (this.entity.state === 'wandering') {
        const nextState = Math.random() > 0.5 ? 'eating' : 'resting';
        this.setState(nextState);
      } else {
        this.setState('wandering');
      }
    }

    if (this.entity.state === 'wandering' || this.entity.state === 'alert') {
      const speed = this.entity.state === 'alert' ? this.entity.speed * 2.5 : this.entity.speed;
      const dx = this.entity.targetX - this.entity.x;
      const dz = this.entity.targetZ - this.entity.z;
      const dist = Math.sqrt(dx * dx + dz * dz);

      if (dist > 0.06) {
        const targetAngle = Math.atan2(dx, dz);
        let angleDiff = targetAngle - this.entity.rotationY;
        while (angleDiff > Math.PI) angleDiff -= Math.PI * 2;
        while (angleDiff < -Math.PI) angleDiff += Math.PI * 2;
        this.entity.rotationY += angleDiff * Math.min(1, delta * 4);

        const step = Math.min(dist, speed * delta);
        this.entity.x += Math.sin(this.entity.rotationY) * step;
        this.entity.z += Math.cos(this.entity.rotationY) * step;

        this.walkCycle += delta * (speed * 20);

        // Quadruped walk swing
        for (let i = 0; i < this.legs.length; i++) {
          const phase = i === 0 || i === 3 ? 0 : Math.PI;
          this.legs[i].rotation.x = Math.sin(this.walkCycle + phase) * 0.45;
        }

        // Tail swish
        const swish = Math.sin(this.walkCycle) * 0.35;
        this.tailSegments.forEach((seg, idx) => {
          seg.rotation.y = swish * (idx + 1) * 0.5;
        });
      } else {
        const angle = Math.random() * Math.PI * 2;
        const rad = 0.2 + Math.random() * 1.2;
        this.entity.targetX = Math.cos(angle) * rad;
        this.entity.targetZ = Math.sin(angle) * rad;
      }
    } else if (this.entity.state === 'resting') {
      // Gentle breathing idle
      const breath = Math.sin(Date.now() * 0.003) * 0.04;
      this.scale.set(1.2 + breath, 1.2, 1.2);
    }

    this.entity.y = getGroundHeightAt(this.entity.x, this.entity.z);
    this.position.set(this.entity.x, this.entity.y, this.entity.z);
    this.rotation.y = this.entity.rotationY;
  }

  public setState(state: FaunaState) {
    this.entity.state = state;
    if (state === 'wandering') {
      this.entity.stateTimer = 4.0 + Math.random() * 4.0;
    } else if (state === 'eating') {
      this.entity.stateTimer = 3.0 + Math.random() * 2.0;
    } else if (state === 'resting') {
      this.entity.stateTimer = 3.5 + Math.random() * 3.0;
    } else if (state === 'alert') {
      this.entity.stateTimer = 2.0;
      const awayAngle = this.entity.rotationY + Math.PI + (Math.random() - 0.5);
      this.entity.targetX = Math.cos(awayAngle) * 0.9;
      this.entity.targetZ = Math.sin(awayAngle) * 0.9;
    }
  }

  public interact() {
    this.setState('alert');
  }
}
