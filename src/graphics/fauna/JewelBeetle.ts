import * as THREE from 'three';
import { getGroundHeightAt } from '../flora/Substrate';
import { FaunaEntity, FaunaState } from '../../types/terrarium';

export class JewelBeetleModel extends THREE.Group {
  public entity: FaunaEntity;
  private legs: THREE.Mesh[] = [];
  private antennae: THREE.Mesh[] = [];
  private headGroup: THREE.Group;
  private walkCycle: number = 0;

  constructor(id: string = 'beetle_1', startX: number = -0.4, startZ: number = 0.5) {
    super();

    this.entity = {
      id,
      species: 'jewel_beetle',
      name: 'Emerald Jewel Scarab',
      scientificName: 'Chrysina gloriosa',
      x: startX,
      y: getGroundHeightAt(startX, startZ),
      z: startZ,
      rotationY: Math.random() * Math.PI * 2,
      state: 'wandering',
      hunger: 35,
      energy: 80,
      favoriteFood: 'Tender moss spores & fungal mycelium',
      speed: 0.35,
      targetX: startX,
      targetZ: startZ,
      stateTimer: 3.0,
    };

    // Body Group
    const bodyGroup = new THREE.Group();
    bodyGroup.position.y = 0.035;

    // Iridescent metallic green carapace material
    const carapaceMat = new THREE.MeshStandardMaterial({
      color: 0x1db954,
      metalness: 0.85,
      roughness: 0.22,
    });

    const blackChitinMat = new THREE.MeshStandardMaterial({
      color: 0x111612,
      metalness: 0.5,
      roughness: 0.4,
    });

    // 1. Thorax (mid body)
    const thoraxGeo = new THREE.SphereGeometry(0.045, 10, 8);
    thoraxGeo.scale(0.85, 0.6, 0.8);
    const thoraxMesh = new THREE.Mesh(thoraxGeo, carapaceMat);
    thoraxMesh.position.set(0, 0, 0);
    thoraxMesh.castShadow = true;
    bodyGroup.add(thoraxMesh);

    // 2. Head with beady black eyes
    this.headGroup = new THREE.Group();
    this.headGroup.position.set(0, -0.005, 0.045);

    const headGeo = new THREE.SphereGeometry(0.025, 8, 8);
    headGeo.scale(0.9, 0.6, 0.8);
    const headMesh = new THREE.Mesh(headGeo, blackChitinMat);
    headMesh.castShadow = true;
    this.headGroup.add(headMesh);

    // Eyes
    const eyeGeo = new THREE.SphereGeometry(0.008, 6, 6);
    const eyeMat = new THREE.MeshStandardMaterial({ color: 0x050505, roughness: 0.1 });
    const leftEye = new THREE.Mesh(eyeGeo, eyeMat);
    leftEye.position.set(0.015, 0.005, 0.015);
    const rightEye = new THREE.Mesh(eyeGeo, eyeMat);
    rightEye.position.set(-0.015, 0.005, 0.015);
    this.headGroup.add(leftEye, rightEye);

    // Antennae
    const antGeo = new THREE.CylinderGeometry(0.002, 0.001, 0.035, 4);
    antGeo.translate(0, 0.017, 0);
    const antMat = new THREE.MeshStandardMaterial({ color: 0x1a2e20, roughness: 0.4 });

    const leftAnt = new THREE.Mesh(antGeo, antMat);
    leftAnt.position.set(0.01, 0.01, 0.02);
    leftAnt.rotation.set(0.6, 0, -0.4);
    const rightAnt = new THREE.Mesh(antGeo, antMat);
    rightAnt.position.set(-0.01, 0.01, 0.02);
    rightAnt.rotation.set(0.6, 0, 0.4);
    this.headGroup.add(leftAnt, rightAnt);
    this.antennae.push(leftAnt, rightAnt);

    bodyGroup.add(this.headGroup);

    // 3. Elytra (dual wing cases)
    const elytraGeo = new THREE.SphereGeometry(0.055, 10, 8);
    elytraGeo.scale(0.85, 0.58, 1.2);
    const elytraLeft = new THREE.Mesh(elytraGeo, carapaceMat);
    elytraLeft.position.set(0.022, 0.002, -0.055);
    elytraLeft.rotation.y = 0.05;
    elytraLeft.castShadow = true;

    const elytraRight = new THREE.Mesh(elytraGeo, carapaceMat);
    elytraRight.position.set(-0.022, 0.002, -0.055);
    elytraRight.rotation.y = -0.05;
    elytraRight.castShadow = true;
    bodyGroup.add(elytraLeft, elytraRight);

    // 4. Six articulated legs
    const legGeo = new THREE.CylinderGeometry(0.003, 0.002, 0.045, 4);
    legGeo.translate(0, -0.02, 0);

    const legZOffsets = [0.02, -0.01, -0.04];
    for (let i = 0; i < 3; i++) {
      // Left leg
      const lLeg = new THREE.Mesh(legGeo, blackChitinMat);
      lLeg.position.set(0.035, -0.005, legZOffsets[i]);
      lLeg.rotation.z = -0.8;
      bodyGroup.add(lLeg);
      this.legs.push(lLeg);

      // Right leg
      const rLeg = new THREE.Mesh(legGeo, blackChitinMat);
      rLeg.position.set(-0.035, -0.005, legZOffsets[i]);
      rLeg.rotation.z = 0.8;
      bodyGroup.add(rLeg);
      this.legs.push(rLeg);
    }

    this.add(bodyGroup);
    this.scale.setScalar(1.2);
    this.position.set(this.entity.x, this.entity.y, this.entity.z);
    this.rotation.y = this.entity.rotationY;
  }

  public update(delta: number) {
    this.entity.stateTimer -= delta;

    // State machine updates
    if (this.entity.stateTimer <= 0) {
      if (this.entity.state === 'wandering') {
        const nextState = Math.random() > 0.4 ? 'eating' : 'resting';
        this.setState(nextState);
      } else {
        this.setState('wandering');
      }
    }

    // Walking behavior
    if (this.entity.state === 'wandering' || this.entity.state === 'alert') {
      const speed = this.entity.state === 'alert' ? this.entity.speed * 2.2 : this.entity.speed;
      const dx = this.entity.targetX - this.entity.x;
      const dz = this.entity.targetZ - this.entity.z;
      const dist = Math.sqrt(dx * dx + dz * dz);

      if (dist > 0.05) {
        // Turn towards target
        const targetAngle = Math.atan2(dx, dz);
        let angleDiff = targetAngle - this.entity.rotationY;
        while (angleDiff > Math.PI) angleDiff -= Math.PI * 2;
        while (angleDiff < -Math.PI) angleDiff += Math.PI * 2;
        this.entity.rotationY += angleDiff * Math.min(1, delta * 5);

        // Move forward
        const step = Math.min(dist, speed * delta);
        this.entity.x += Math.sin(this.entity.rotationY) * step;
        this.entity.z += Math.cos(this.entity.rotationY) * step;

        // Tripodal gait leg animation
        this.walkCycle += delta * (speed * 28);
        for (let i = 0; i < this.legs.length; i++) {
          const phase = (i % 2 === 0 ? 0 : Math.PI) + (Math.floor(i / 2) * 0.7);
          const swing = Math.sin(this.walkCycle + phase) * 0.4;
          this.legs[i].rotation.x = swing;
        }
      } else {
        // Pick new random target within ground radius 1.5
        const angle = Math.random() * Math.PI * 2;
        const rad = 0.2 + Math.random() * 1.3;
        this.entity.targetX = Math.cos(angle) * rad;
        this.entity.targetZ = Math.sin(angle) * rad;
      }
    } else if (this.entity.state === 'eating') {
      // Nibble animation (head bobbing)
      const bob = Math.sin(Date.now() * 0.008) * 0.008;
      this.headGroup.position.y = -0.005 + bob;
      this.headGroup.rotation.x = 0.2 + bob * 10;
      this.entity.hunger = Math.max(0, this.entity.hunger - delta * 4);
    } else if (this.entity.state === 'resting') {
      // Antennae twitch
      const twitch = Math.sin(Date.now() * 0.005) * 0.15;
      this.antennae[0].rotation.y = twitch;
      this.antennae[1].rotation.y = -twitch;
    }

    // Ground clamping & orientation
    this.entity.y = getGroundHeightAt(this.entity.x, this.entity.z);
    this.position.set(this.entity.x, this.entity.y, this.entity.z);
    this.rotation.y = this.entity.rotationY;
  }

  public setState(state: FaunaState) {
    this.entity.state = state;
    if (state === 'wandering') {
      this.entity.stateTimer = 4.0 + Math.random() * 4.0;
    } else if (state === 'eating') {
      this.entity.stateTimer = 3.0 + Math.random() * 3.0;
    } else if (state === 'resting') {
      this.entity.stateTimer = 2.5 + Math.random() * 3.0;
    } else if (state === 'alert') {
      this.entity.stateTimer = 2.0;
      // Scuttle away towards random spot
      const awayAngle = this.entity.rotationY + Math.PI + (Math.random() - 0.5);
      this.entity.targetX = Math.cos(awayAngle) * 0.8;
      this.entity.targetZ = Math.sin(awayAngle) * 0.8;
    }
  }

  public interact() {
    // Player poked or clicked the beetle!
    this.setState('alert');
  }
}
