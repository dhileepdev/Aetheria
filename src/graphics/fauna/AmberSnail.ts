import * as THREE from 'three';
import { getGroundHeightAt } from '../flora/Substrate';
import { FaunaEntity, FaunaState } from '../../types/terrarium';

export class AmberSnailModel extends THREE.Group {
  public entity: FaunaEntity;
  private eyestalks: THREE.Group[] = [];
  private shellMesh: THREE.Mesh;

  constructor(id: string = 'snail_1', startX: number = -0.7, startZ: number = -0.3) {
    super();

    this.entity = {
      id,
      species: 'amber_snail',
      name: 'Golden Amber Snail',
      scientificName: 'Succinea putris',
      x: startX,
      y: getGroundHeightAt(startX, startZ),
      z: startZ,
      rotationY: Math.random() * Math.PI * 2,
      state: 'wandering',
      hunger: 50,
      energy: 70,
      favoriteFood: 'Tender succulent leaves & microscopic lichen',
      speed: 0.12,
      targetX: startX,
      targetZ: startZ,
      stateTimer: 5.0,
    };

    const bodyGroup = new THREE.Group();
    bodyGroup.position.y = 0.02;

    // Fleshy Foot/Body
    const footMat = new THREE.MeshStandardMaterial({
      color: 0xded2be,
      roughness: 0.5,
      metalness: 0.05,
    });

    const footGeo = new THREE.SphereGeometry(0.045, 8, 6);
    footGeo.scale(0.6, 0.4, 1.6);
    const foot = new THREE.Mesh(footGeo, footMat);
    foot.castShadow = true;
    bodyGroup.add(foot);

    // Spiral Amber Shell
    const shellMat = new THREE.MeshStandardMaterial({
      color: 0xd9822b,
      roughness: 0.25,
      metalness: 0.15,
    });

    const shellGeo = new THREE.SphereGeometry(0.05, 12, 10);
    shellGeo.scale(0.8, 1.1, 1.0);
    this.shellMesh = new THREE.Mesh(shellGeo, shellMat);
    this.shellMesh.position.set(0, 0.045, -0.02);
    this.shellMesh.rotation.x = -0.3;
    this.shellMesh.castShadow = true;
    bodyGroup.add(this.shellMesh);

    // Retractable Eyestalks
    for (let side = -1; side <= 1; side += 2) {
      const stalkGroup = new THREE.Group();
      stalkGroup.position.set(side * 0.015, 0.025, 0.055);

      const stalkGeo = new THREE.CylinderGeometry(0.002, 0.003, 0.035, 4);
      stalkGeo.translate(0, 0.017, 0);
      const stalkMesh = new THREE.Mesh(stalkGeo, footMat);
      stalkMesh.rotation.x = 0.4;
      stalkMesh.rotation.z = -side * 0.25;
      stalkGroup.add(stalkMesh);

      // Dark eye tip
      const eyeTip = new THREE.Mesh(
        new THREE.SphereGeometry(0.004, 4, 4),
        new THREE.MeshBasicMaterial({ color: 0x111111 })
      );
      eyeTip.position.set(0, 0.034, 0.015);
      stalkGroup.add(eyeTip);

      bodyGroup.add(stalkGroup);
      this.eyestalks.push(stalkGroup);
    }

    this.add(bodyGroup);
    this.scale.setScalar(1.2);
    this.position.set(this.entity.x, this.entity.y, this.entity.z);
    this.rotation.y = this.entity.rotationY;
  }

  public update(delta: number) {
    this.entity.stateTimer -= delta;

    if (this.entity.stateTimer <= 0) {
      if (this.entity.state === 'wandering') {
        const nextState = Math.random() > 0.4 ? 'eating' : 'resting';
        this.setState(nextState);
      } else {
        this.setState('wandering');
      }
    }

    if (this.entity.state === 'wandering') {
      const dx = this.entity.targetX - this.entity.x;
      const dz = this.entity.targetZ - this.entity.z;
      const dist = Math.sqrt(dx * dx + dz * dz);

      if (dist > 0.04) {
        const targetAngle = Math.atan2(dx, dz);
        let angleDiff = targetAngle - this.entity.rotationY;
        while (angleDiff > Math.PI) angleDiff -= Math.PI * 2;
        while (angleDiff < -Math.PI) angleDiff += Math.PI * 2;
        this.entity.rotationY += angleDiff * Math.min(1, delta * 1.5);

        const step = Math.min(dist, this.entity.speed * delta);
        this.entity.x += Math.sin(this.entity.rotationY) * step;
        this.entity.z += Math.cos(this.entity.rotationY) * step;

        // Eyestalks gently extended
        this.eyestalks.forEach((st) => st.scale.setScalar(1.0));
      } else {
        const angle = Math.random() * Math.PI * 2;
        const rad = 0.2 + Math.random() * 1.1;
        this.entity.targetX = Math.cos(angle) * rad;
        this.entity.targetZ = Math.sin(angle) * rad;
      }
    } else if (this.entity.state === 'alert') {
      // Retract eyestalks into shell!
      this.eyestalks.forEach((st) => st.scale.setScalar(0.2));
    }

    this.entity.y = getGroundHeightAt(this.entity.x, this.entity.z);
    this.position.set(this.entity.x, this.entity.y, this.entity.z);
    this.rotation.y = this.entity.rotationY;
  }

  public setState(state: FaunaState) {
    this.entity.state = state;
    if (state === 'wandering') {
      this.entity.stateTimer = 6.0 + Math.random() * 4.0;
    } else if (state === 'eating') {
      this.entity.stateTimer = 4.0 + Math.random() * 3.0;
    } else if (state === 'resting') {
      this.entity.stateTimer = 5.0 + Math.random() * 3.0;
    } else if (state === 'alert') {
      this.entity.stateTimer = 3.0;
    }
  }

  public interact() {
    this.setState('alert');
  }
}
