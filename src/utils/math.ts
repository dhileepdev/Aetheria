import { SunMoonData } from '../types/terrarium';

/**
 * Deterministic pseudo-random number generator (Mulberry32).
 */
export function createRNG(seed: number) {
  let s = Math.imul(seed ^ 0x6d2b79f5, 1);
  return function next(): number {
    s = (s + 0x6d2b79f5) | 0;
    let t = Math.imul(s ^ (s >>> 15), 1 | s);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/**
 * Range random helper using a given generator.
 */
export function rangeRandom(rng: () => number, min: number, max: number): number {
  return min + rng() * (max - min);
}

/**
 * Lerps between two RGB hex colors.
 */
export function lerpColor(hexA: string, hexB: string, t: number): string {
  const clampT = Math.max(0, Math.min(1, t));
  const parse = (c: string) => {
    const num = parseInt(c.replace('#', ''), 16);
    return [(num >> 16) & 255, (num >> 8) & 255, num & 255];
  };
  const [r1, g1, b1] = parse(hexA);
  const [r2, g2, b2] = parse(hexB);

  const r = Math.round(r1 + (r2 - r1) * clampT);
  const g = Math.round(g1 + (g2 - g1) * clampT);
  const b = Math.round(b1 + (b2 - b1) * clampT);

  return `#${((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1)}`;
}

/**
 * Computes solar and lunar positions, colors, and intensities from hour (0 - 24).
 */
export function calculateSunMoon(hour: number): SunMoonData {
  const normTime = (hour % 24) / 24;
  const sunAngle = normTime * Math.PI * 2 - Math.PI / 2; // Sunrise at ~6:00, noon at ~12:00
  const sunDistance = 14;

  const sunX = Math.cos(sunAngle) * sunDistance;
  const sunY = Math.sin(sunAngle) * sunDistance;
  const sunZ = Math.sin(sunAngle * 0.5) * 4;

  // Moon is antipodal
  const moonX = -sunX;
  const moonY = -sunY;
  const moonZ = -sunZ;

  const sunElevation = sunY / sunDistance; // -1 to 1
  const isNight = sunElevation < -0.05;

  let sunIntensity = 0;
  let sunColor = '#ffffff';
  let skyColor = '#0a0e17';
  let groundFogColor = '#060910';
  let ambientIntensity = 0.25;

  if (sunElevation >= -0.15 && sunElevation <= 0.2) {
    // Dawn (around 5:00 - 7:30) or Dusk (around 17:30 - 20:00)
    const t = (sunElevation + 0.15) / 0.35;
    const isDawn = normTime < 0.5;

    if (isDawn) {
      sunColor = lerpColor('#ff6b4a', '#ffe4aa', t);
      skyColor = lerpColor('#1b1429', '#3b3857', t);
      groundFogColor = lerpColor('#14101e', '#2e273a', t);
    } else {
      sunColor = lerpColor('#ff5522', '#ffaa55', t);
      skyColor = lerpColor('#13182b', '#4a2d3e', t);
      groundFogColor = lerpColor('#101322', '#361d2d', t);
    }
    sunIntensity = Math.max(0, t * 1.6);
    ambientIntensity = 0.3 + t * 0.2;
  } else if (sunElevation > 0.2) {
    // Full Daytime (midday)
    const t = Math.min(1, (sunElevation - 0.2) / 0.7);
    sunColor = lerpColor('#ffe4aa', '#fff7e6', t);
    skyColor = lerpColor('#3b3857', '#1a2936', t);
    groundFogColor = lerpColor('#2e273a', '#101d28', t);
    sunIntensity = 1.6 + t * 0.9;
    ambientIntensity = 0.5 + t * 0.25;
  } else {
    // Deep Night
    sunIntensity = 0.0;
    sunColor = '#05070a';
    skyColor = '#080d1a';
    groundFogColor = '#050811';
    ambientIntensity = 0.18;
  }

  // Moon intensity peaks when sun is lowest
  const moonElevation = moonY / sunDistance;
  const moonIntensity = moonElevation > 0 ? Math.min(0.65, moonElevation * 0.7) : 0;

  return {
    sunPosition: [sunX, Math.max(-2, sunY), sunZ],
    moonPosition: [moonX, Math.max(-2, moonY), moonZ],
    sunIntensity: Math.max(0, sunIntensity),
    moonIntensity,
    sunColor,
    skyColor,
    groundFogColor,
    ambientIntensity,
    isNight,
  };
}

/**
 * Golden ratio phyllotaxis coordinates for spiral succulent leaves.
 */
export function calculatePhyllotaxis(index: number, count: number, maxRadius: number) {
  const goldenAngle = 137.5 * (Math.PI / 180);
  const phi = index * goldenAngle;
  const r = Math.sqrt(index / count) * maxRadius;
  return {
    x: Math.cos(phi) * r,
    z: Math.sin(phi) * r,
    angle: phi,
    radius: r,
  };
}

/**
 * Format decimal hours to 12-hour or 24-hour time string.
 */
export function formatTimeOfDay(hour: number): string {
  const h = Math.floor(hour % 24);
  const m = Math.floor(((hour % 24) - h) * 60);
  const pad = (n: number) => n.toString().padStart(2, '0');
  const period = h >= 12 ? 'PM' : 'AM';
  const displayH = h % 12 === 0 ? 12 : h % 12;
  return `${displayH}:${pad(m)} ${period}`;
}
