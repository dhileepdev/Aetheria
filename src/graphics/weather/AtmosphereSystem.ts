import * as THREE from 'three';
import { WeatherType } from '../../types/terrarium';

export class AtmosphereSystem extends THREE.Group {
  // Rain
  private rainGeo: THREE.BufferGeometry;
  private rainMat: THREE.PointsMaterial;
  private rainPoints: THREE.Points;
  private rainCount = 450;
  private rainVelocities: Float32Array;

  // Mist / Fog
  private mistGeo: THREE.BufferGeometry;
  private mistMat: THREE.PointsMaterial;
  private mistPoints: THREE.Points;
  private mistCount = 200;

  // Dust Motes / Spores
  private sporeGeo: THREE.BufferGeometry;
  private sporeMat: THREE.PointsMaterial;
  private sporePoints: THREE.Points;
  private sporeCount = 150;

  // Bioluminescent Fireflies
  private fireflyGeo: THREE.BufferGeometry;
  private fireflyMat: THREE.PointsMaterial;
  private fireflyPoints: THREE.Points;
  private fireflyCount = 45;
  private fireflyData: { x: number; y: number; z: number; phase: number; speed: number }[] = [];

  constructor() {
    super();

    // 1. Rain setup
    this.rainGeo = new THREE.BufferGeometry();
    const rainPositions = new Float32Array(this.rainCount * 3);
    this.rainVelocities = new Float32Array(this.rainCount);

    for (let i = 0; i < this.rainCount; i++) {
      rainPositions[i * 3] = (Math.random() - 0.5) * 3.6;
      rainPositions[i * 3 + 1] = Math.random() * 3.5;
      rainPositions[i * 3 + 2] = (Math.random() - 0.5) * 3.6;
      this.rainVelocities[i] = 4.0 + Math.random() * 3.0;
    }
    this.rainGeo.setAttribute('position', new THREE.BufferAttribute(rainPositions, 3));

    this.rainMat = new THREE.PointsMaterial({
      color: 0x9bc0ff,
      size: 0.035,
      transparent: true,
      opacity: 0.0,
      depthWrite: false,
    });
    this.rainPoints = new THREE.Points(this.rainGeo, this.rainMat);
    this.add(this.rainPoints);

    // 2. Mist setup
    this.mistGeo = new THREE.BufferGeometry();
    const mistPositions = new Float32Array(this.mistCount * 3);
    for (let i = 0; i < this.mistCount; i++) {
      mistPositions[i * 3] = (Math.random() - 0.5) * 3.2;
      mistPositions[i * 3 + 1] = 0.1 + Math.random() * 1.5;
      mistPositions[i * 3 + 2] = (Math.random() - 0.5) * 3.2;
    }
    this.mistGeo.setAttribute('position', new THREE.BufferAttribute(mistPositions, 3));

    this.mistMat = new THREE.PointsMaterial({
      color: 0xd8e8e8,
      size: 0.18,
      transparent: true,
      opacity: 0.0,
      depthWrite: false,
    });
    this.mistPoints = new THREE.Points(this.mistGeo, this.mistMat);
    this.add(this.mistPoints);

    // 3. Spore motes setup
    this.sporeGeo = new THREE.BufferGeometry();
    const sporePositions = new Float32Array(this.sporeCount * 3);
    for (let i = 0; i < this.sporeCount; i++) {
      sporePositions[i * 3] = (Math.random() - 0.5) * 3.0;
      sporePositions[i * 3 + 1] = 0.1 + Math.random() * 2.2;
      sporePositions[i * 3 + 2] = (Math.random() - 0.5) * 3.0;
    }
    this.sporeGeo.setAttribute('position', new THREE.BufferAttribute(sporePositions, 3));

    this.sporeMat = new THREE.PointsMaterial({
      color: 0xffe8aa,
      size: 0.045,
      transparent: true,
      opacity: 0.35,
      depthWrite: false,
    });
    this.sporePoints = new THREE.Points(this.sporeGeo, this.sporeMat);
    this.add(this.sporePoints);

    // 4. Bioluminescent Fireflies
    this.fireflyGeo = new THREE.BufferGeometry();
    const fireflyPositions = new Float32Array(this.fireflyCount * 3);
    for (let i = 0; i < this.fireflyCount; i++) {
      const x = (Math.random() - 0.5) * 2.6;
      const y = 0.2 + Math.random() * 1.8;
      const z = (Math.random() - 0.5) * 2.6;
      fireflyPositions[i * 3] = x;
      fireflyPositions[i * 3 + 1] = y;
      fireflyPositions[i * 3 + 2] = z;
      this.fireflyData.push({
        x,
        y,
        z,
        phase: Math.random() * Math.PI * 2,
        speed: 0.8 + Math.random() * 1.2,
      });
    }
    this.fireflyGeo.setAttribute('position', new THREE.BufferAttribute(fireflyPositions, 3));

    this.fireflyMat = new THREE.PointsMaterial({
      color: 0x6effaa,
      size: 0.08,
      transparent: true,
      opacity: 0.0,
      depthWrite: false,
    });
    this.fireflyPoints = new THREE.Points(this.fireflyGeo, this.fireflyMat);
    this.add(this.fireflyPoints);
  }

  public setWeather(weather: WeatherType, isNight: boolean, rainIntensity: number, mistDensity: number) {
    // Opacity transitions
    if (weather === 'rain') {
      this.rainMat.opacity = 0.65 * rainIntensity;
      this.mistMat.opacity = 0.25;
      this.sporeMat.opacity = 0.05;
      this.fireflyMat.opacity = 0.0;
    } else if (weather === 'mist') {
      this.rainMat.opacity = 0.0;
      this.mistMat.opacity = 0.45 * mistDensity;
      this.sporeMat.opacity = 0.2;
      this.fireflyMat.opacity = isNight ? 0.35 : 0.0;
    } else if (weather === 'fireflies') {
      this.rainMat.opacity = 0.0;
      this.mistMat.opacity = 0.15;
      this.sporeMat.opacity = 0.1;
      this.fireflyMat.opacity = 0.95;
    } else {
      // Sunny
      this.rainMat.opacity = 0.0;
      this.mistMat.opacity = 0.0;
      this.sporeMat.opacity = 0.4;
      this.fireflyMat.opacity = isNight ? 0.85 : 0.0;
    }
  }

  public update(delta: number, windStrength: number, time: number) {
    // 1. Update Rain
    if (this.rainMat.opacity > 0.01) {
      const pos = this.rainGeo.attributes.position as THREE.BufferAttribute;
      for (let i = 0; i < this.rainCount; i++) {
        let y = pos.getY(i) - this.rainVelocities[i] * delta;
        let x = pos.getX(i) + windStrength * delta * 0.8;
        if (y < -0.1) {
          y = 3.2;
          x = (Math.random() - 0.5) * 3.6;
        }
        pos.setXY(i, x, y);
      }
      pos.needsUpdate = true;
    }

    // 2. Update Mist
    if (this.mistMat.opacity > 0.01) {
      const pos = this.mistGeo.attributes.position as THREE.BufferAttribute;
      for (let i = 0; i < this.mistCount; i++) {
        const x = pos.getX(i) + Math.cos(time * 0.4 + i) * 0.003 + windStrength * delta * 0.3;
        const z = pos.getZ(i) + Math.sin(time * 0.4 + i) * 0.003;
        pos.setX(i, x > 1.8 ? -1.8 : x);
        pos.setZ(i, z > 1.8 ? -1.8 : z);
      }
      pos.needsUpdate = true;
    }

    // 3. Update Spores
    if (this.sporeMat.opacity > 0.01) {
      const pos = this.sporeGeo.attributes.position as THREE.BufferAttribute;
      for (let i = 0; i < this.sporeCount; i++) {
        const y = pos.getY(i) + Math.sin(time * 1.2 + i) * 0.002;
        const x = pos.getX(i) + Math.cos(time * 0.8 + i) * 0.002 + windStrength * delta * 0.15;
        pos.setXY(i, x > 1.6 ? -1.6 : x, y);
      }
      pos.needsUpdate = true;
    }

    // 4. Update Fireflies
    if (this.fireflyMat.opacity > 0.01) {
      const pos = this.fireflyGeo.attributes.position as THREE.BufferAttribute;
      for (let i = 0; i < this.fireflyCount; i++) {
        const d = this.fireflyData[i];
        const t = time * d.speed + d.phase;
        // Lissajous flutter
        const fx = d.x + Math.sin(t * 0.8) * 0.25;
        const fy = d.y + Math.cos(t * 1.4) * 0.15;
        const fz = d.z + Math.sin(t * 1.1) * 0.25;
        pos.setXYZ(i, fx, fy, fz);
      }
      pos.needsUpdate = true;

      // Pulse glow size
      const pulse = 0.07 + Math.sin(time * 4) * 0.02;
      this.fireflyMat.size = pulse;
    }
  }
}
