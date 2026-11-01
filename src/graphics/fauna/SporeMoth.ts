import * as THREE from 'three';
import { getGroundHeightAt } from '../flora/Substrate';
import { FaunaEntity, FaunaState } from '../../types/terrarium';

export class SporeMothModel extends THREE.Group {
  public entity: FaunaEntity;
  private leftWings: THREE.Mesh[] = [];
  private rightWings: THREE.Mesh[] = [];
  private flapTime: number = 0;
  private flightY: number = 0.8;

  constructor(id: string = 'moth_1', startX: number = 0.2, startZ: number = 0.3) {
    super();

    this.flightY = getGroundHeightAt(startX, startZ) + 0.6;

    this.entity = {
      id,
      species: 'spore_moth',
      name: 'Luminescent Spore Moth',
      scientificName: 'Actias luna micro',
      x: startX,
      y: this.flightY,
      z: startZ,
      rotationY: Math.random() * Math.PI * 2,
      state: 'wandering',
      hunger: 30,
      energy: 85,
      favoriteFood: 'Night-blooming orchid nectar & phosphorescent spores',
      speed: 0.65,
      targetX: startX,
      targetZ: startZ,
      stateTimer: 4.0,
    };

    const bodyMat = new THREE.MeshStandardMaterial({
      color: 0x4a4439,
      roughness: 0.8,
    });

    const wingMat = new THREE.MeshStandardMaterial({
      color: 0x8ef4c8,
      roughness: 0.3,
      metalness: 0.1,
      emissive: 0x228855,
      emissiveIntensity: 0.45,
      side: THREE.DoubleSide,
      transparent: true,
      opacity: 0.88,
    });

    // Body
    const bodyGeo = new THREE.SphereGeometry(0.025, 8, 6);
    bodyGeo.scale(0.6, 0.5, 1.4);
    const body = new THREE.Mesh(bodyGeo, bodyMat);
    this.add(body);

    // Left Forewing
    const wingGeo = new THREE.PlaneGeometry(0.08, 0.05);
    wingGeo.translate(0.04, 0, 0);

    const lWing = new THREE.Mesh(wingGeo, wingMat);
    lWing.position.set(0.015, 0.01, 0.01);
    this.add(lWing);
    this.leftWings.push(lWing);

    // Right Forewing
    const rWing = new THREE.Mesh(wingGeo, wingMat);
    rWing.position.set(-0.015, 0.01, 0.01);
    rWing.scale.x = -1;
    this.add(rWing);
    this.rightWings.push(rWing);

    this.scale.setScalar(1.2);
    this.position.set(this.entity.x, this.entity.y, this.entity.z);
  }

  public update(delta: number) {
    this.entity.stateTimer -= delta;

    if (this.entity.stateTimer <= 0) {
      if (this.entity.state === 'wandering') {
        this.setState('resting'); // Perch on leaf
      } else {
        this.setState('wandering'); // Take flight
      }
    }

    if (this.entity.state === 'wandering' || this.entity.state === 'alert') {
      const speed = this.entity.state === 'alert' ? this.entity.speed * 2.0 : this.entity.speed;
      const dx = this.entity.targetX - this.entity.x;
      const dz = this.entity.targetZ - this.entity.z;
      const dist = Math.sqrt(dx * dx + dz * dz);

      if (dist > 0.08) {
        const targetAngle = Math.atan2(dx, dz);
        let angleDiff = targetAngle - this.entity.rotationY;
        while (angleDiff > Math.PI) angleDiff -= Math.PI * 2;
        while (angleDiff < -Math.PI) angleDiff += Math.PI * 2;
        this.entity.rotationY += angleDiff * Math.min(1, delta * 6);

        const step = Math.min(dist, speed * delta);
        this.entity.x += Math.sin(this.entity.rotationY) * step;
        this.entity.z += Math.cos(this.entity.rotationY) * step;

        // Flutter altitude
        this.flightY = 0.55 + Math.sin(Date.now() * 0.005) * 0.25;
        this.entity.y = this.flightY;

        // Rapid wing flapping
        this.flapTime += delta * 32;
        const flap = Math.sin(this.flapTime) * 0.9;
        this.leftWings.forEach((w) => (w.rotation.z = flap));
        this.rightWings.forEach((w) => (w.rotation.z = -flap));
      } else {
        const angle = Math.random() * Math.PI * 2;
        const rad = 0.2 + Math.random() * 1.1;
        this.entity.targetX = Math.cos(angle) * rad;
        this.entity.targetZ = Math.sin(angle) * rad;
      }
    } else {
      // Perched on leaf
      const ground = getGroundHeightAt(this.entity.x, this.entity.z);
      this.entity.y = THREE.MathUtils.lerp(this.entity.y, ground + 0.15, delta * 3);

      // Slow gentle wing fanning
      const fan = Math.sin(Date.now() * 0.003) * 0.3;
      this.leftWings.forEach((w) => (w.rotation.z = fan));
      this.rightWings.forEach((w) => (w.rotation.z = -fan));
    }

    this.position.set(this.entity.x, this.entity.y, this.entity.z);
    this.rotation.y = this.entity.rotationY;
  }

  public setState(state: FaunaState) {
    this.entity.state = state;
    if (state === 'wandering') {
      this.entity.stateTimer = 4.0 + Math.random() * 3.0;
    } else if (state === 'resting') {
      this.entity.stateTimer = 3.5 + Math.random() * 3.0;
    } else if (state === 'alert') {
      this.entity.stateTimer = 2.5;
      this.entity.targetX = (Math.random() - 0.5) * 1.8;
      this.entity.targetZ = (Math.random() - 0.5) * 1.8;
    }
  }

  public interact() {
    this.setState('alert');
  }
}
