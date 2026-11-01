import * as THREE from 'three';

/**
 * Creates a soft radial contact shadow texture.
 */
export function createContactShadowTexture(): THREE.CanvasTexture {
  const size = 256;
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext('2d')!;

  const gradient = ctx.createRadialGradient(size / 2, size / 2, 0, size / 2, size / 2, size / 2);
  gradient.addColorStop(0, 'rgba(0, 0, 0, 0.7)');
  gradient.addColorStop(0.35, 'rgba(0, 0, 0, 0.45)');
  gradient.addColorStop(0.7, 'rgba(0, 0, 0, 0.15)');
  gradient.addColorStop(1, 'rgba(0, 0, 0, 0.0)');

  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, size, size);

  const texture = new THREE.CanvasTexture(canvas);
  texture.needsUpdate = true;
  return texture;
}

/**
 * Creates procedural tree bark texture.
 */
export function createBarkTexture(): { map: THREE.CanvasTexture; roughnessMap: THREE.CanvasTexture } {
  const width = 512;
  const height = 512;
  
  // Albedo
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d')!;

  ctx.fillStyle = '#3a2417';
  ctx.fillRect(0, 0, width, height);

  // Vertical fibrous grain
  for (let i = 0; i < 400; i++) {
    const x = Math.random() * width;
    const w = 1 + Math.random() * 4;
    const alpha = 0.08 + Math.random() * 0.14;
    const isDark = Math.random() > 0.45;
    ctx.fillStyle = isDark ? `rgba(28, 16, 9, ${alpha})` : `rgba(74, 50, 34, ${alpha})`;
    ctx.fillRect(x, 0, w, height);
  }

  // Furrows and fissures
  for (let y = 0; y < height; y += 12) {
    ctx.strokeStyle = 'rgba(18, 10, 5, 0.25)';
    ctx.lineWidth = 2 + Math.random() * 2;
    ctx.beginPath();
    ctx.moveTo(0, y);
    for (let x = 0; x < width; x += 30) {
      ctx.lineTo(x, y + (Math.random() - 0.5) * 8);
    }
    ctx.stroke();
  }

  const map = new THREE.CanvasTexture(canvas);
  map.wrapS = THREE.RepeatWrapping;
  map.wrapT = THREE.RepeatWrapping;
  map.repeat.set(2, 4);
  map.colorSpace = THREE.SRGBColorSpace;

  // Roughness
  const roughCanvas = document.createElement('canvas');
  roughCanvas.width = 256;
  roughCanvas.height = 256;
  const rCtx = roughCanvas.getContext('2d')!;
  rCtx.fillStyle = '#cccccc'; // mostly rough
  rCtx.fillRect(0, 0, 256, 256);

  for (let i = 0; i < 150; i++) {
    const x = Math.random() * 256;
    rCtx.fillStyle = Math.random() > 0.5 ? 'rgba(255,255,255,0.2)' : 'rgba(120,120,120,0.3)';
    rCtx.fillRect(x, 0, 2 + Math.random() * 3, 256);
  }

  const roughnessMap = new THREE.CanvasTexture(roughCanvas);
  roughnessMap.wrapS = THREE.RepeatWrapping;
  roughnessMap.wrapT = THREE.RepeatWrapping;
  roughnessMap.repeat.set(2, 4);

  return { map, roughnessMap };
}

/**
 * Creates procedural velvety moss texture with fine pores and organic variation.
 */
export function createMossTexture(): { map: THREE.CanvasTexture; bumpMap: THREE.CanvasTexture } {
  const size = 512;
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext('2d')!;

  // Base lush forest green
  ctx.fillStyle = '#224416';
  ctx.fillRect(0, 0, size, size);

  // Micro stippling & pores
  for (let i = 0; i < 15000; i++) {
    const x = Math.random() * size;
    const y = Math.random() * size;
    const rad = 0.8 + Math.random() * 2.2;
    const rand = Math.random();

    if (rand < 0.35) {
      ctx.fillStyle = 'rgba(56, 98, 30, 0.35)'; // bright emerald
    } else if (rand < 0.7) {
      ctx.fillStyle = 'rgba(24, 48, 14, 0.4)'; // deep olive
    } else {
      ctx.fillStyle = 'rgba(74, 128, 38, 0.25)'; // chartreuse highlight
    }
    ctx.beginPath();
    ctx.arc(x, y, rad, 0, Math.PI * 2);
    ctx.fill();
  }

  const map = new THREE.CanvasTexture(canvas);
  map.wrapS = THREE.RepeatWrapping;
  map.wrapT = THREE.RepeatWrapping;
  map.repeat.set(4, 4);
  map.colorSpace = THREE.SRGBColorSpace;

  // Bump map
  const bumpCanvas = document.createElement('canvas');
  bumpCanvas.width = 256;
  bumpCanvas.height = 256;
  const bCtx = bumpCanvas.getContext('2d')!;
  bCtx.fillStyle = '#808080';
  bCtx.fillRect(0, 0, 256, 256);

  for (let i = 0; i < 6000; i++) {
    const x = Math.random() * 256;
    const y = Math.random() * 256;
    const rad = 1 + Math.random() * 2.5;
    bCtx.fillStyle = Math.random() > 0.5 ? 'rgba(255,255,255,0.4)' : 'rgba(0,0,0,0.4)';
    bCtx.beginPath();
    bCtx.arc(x, y, rad, 0, Math.PI * 2);
    bCtx.fill();
  }

  const bumpMap = new THREE.CanvasTexture(bumpCanvas);
  bumpMap.wrapS = THREE.RepeatWrapping;
  bumpMap.wrapT = THREE.RepeatWrapping;
  bumpMap.repeat.set(4, 4);

  return { map, bumpMap };
}

/**
 * Creates procedural leaf vein pattern.
 */
export function createLeafTexture(tintHex: string = '#2a7c36'): THREE.CanvasTexture {
  const width = 256;
  const height = 512;
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d')!;

  ctx.fillStyle = tintHex;
  ctx.fillRect(0, 0, width, height);

  // Central midrib vein
  ctx.strokeStyle = 'rgba(180, 230, 120, 0.6)';
  ctx.lineWidth = 4;
  ctx.beginPath();
  ctx.moveTo(width / 2, height);
  ctx.lineTo(width / 2, 20);
  ctx.stroke();

  // Lateral secondary veins
  ctx.strokeStyle = 'rgba(160, 210, 100, 0.35)';
  ctx.lineWidth = 2;
  for (let y = height - 40; y > 40; y -= 36) {
    // Left
    ctx.beginPath();
    ctx.moveTo(width / 2, y);
    ctx.quadraticCurveTo(width / 2 - 40, y - 25, 20, y - 50);
    ctx.stroke();

    // Right
    ctx.beginPath();
    ctx.moveTo(width / 2, y);
    ctx.quadraticCurveTo(width / 2 + 40, y - 25, width - 20, y - 50);
    ctx.stroke();
  }

  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  return texture;
}

/**
 * Creates procedural water condensation droplet normal map for the glass interior.
 */
export function createCondensationNormalMap(): THREE.CanvasTexture {
  const size = 512;
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext('2d')!;

  // Neutral normal map base RGB(128, 128, 255) => flat
  ctx.fillStyle = 'rgb(128, 128, 255)';
  ctx.fillRect(0, 0, size, size);

  // Draw randomized teardrop and spherical droplet bead normals
  for (let i = 0; i < 450; i++) {
    const x = Math.random() * size;
    const y = Math.random() * size;
    const radius = 2 + Math.random() * 5;

    // A hemispherical drop creates a radial gradient in normal space:
    // Left side: Red < 128, Right side: Red > 128
    // Top side: Green < 128, Bottom side: Green > 128
    const grad = ctx.createRadialGradient(x - radius * 0.3, y - radius * 0.3, 0, x, y, radius);
    grad.addColorStop(0, 'rgb(150, 150, 255)');
    grad.addColorStop(0.5, 'rgb(128, 128, 255)');
    grad.addColorStop(1, 'rgb(110, 110, 255)');

    ctx.fillStyle = grad;
    ctx.beginPath();
    ctx.arc(x, y, radius, 0, Math.PI * 2);
    ctx.fill();

    // Occasional trickle run
    if (Math.random() > 0.88) {
      ctx.strokeStyle = 'rgba(120, 140, 255, 0.4)';
      ctx.lineWidth = radius * 0.5;
      ctx.beginPath();
      ctx.moveTo(x, y);
      ctx.lineTo(x + (Math.random() - 0.5) * 6, y + 15 + Math.random() * 25);
      ctx.stroke();
    }
  }

  const texture = new THREE.CanvasTexture(canvas);
  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.RepeatWrapping;
  texture.repeat.set(3, 3);
  return texture;
}
