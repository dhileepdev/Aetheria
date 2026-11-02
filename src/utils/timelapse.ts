import { TimelapseFrame } from '../types/timelapse';
import { WeatherType } from '../types/terrarium';
import { formatTimeOfDay } from './math';

/**
 * Formats a clean default label for a timelapse frame.
 */
export function formatFrameLabel(timeOfDay: number, plantCount: number, weather: WeatherType): string {
  const solarTime = formatTimeOfDay(timeOfDay);
  const weatherTitle = weather.charAt(0).toUpperCase() + weather.slice(1);
  return `${solarTime} • ${weatherTitle} • ${plantCount} Plant${plantCount === 1 ? '' : 's'}`;
}

/**
 * Triggers browser download for a single frame PNG image.
 */
export function downloadFrameAsPng(frame: TimelapseFrame) {
  const a = document.createElement('a');
  a.href = frame.dataUrl;
  const timeStr = formatTimeOfDay(frame.timeOfDay).replace(/[: ]/g, '-');
  a.download = `terrarium-frame-${timeStr}-${frame.id.slice(-6)}.png`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
}

/**
 * Exports all captured frames as a standalone interactive HTML Timelapse Player file.
 * The generated file contains all base64 images embedded along with an offline player.
 */
export function exportInteractiveHtmlTimelapse(frames: TimelapseFrame[], title: string = 'Terrarium Growth & Solar Timelapse') {
  if (frames.length === 0) return;

  const jsonFrames = JSON.stringify(frames);
  const htmlContent = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${title}</title>
  <style>
    body { margin: 0; background: #0a0e17; color: #e2e8f0; font-family: system-ui, -apple-system, sans-serif; display: flex; flex-direction: column; align-items: center; justify-content: center; min-height: 100vh; padding: 20px; box-sizing: border-box; }
    .card { background: #131b2e; border: 1px solid #1e293b; border-radius: 16px; padding: 20px; max-width: 900px; width: 100%; box-shadow: 0 25px 50px -12px rgba(0,0,0,0.5); }
    h1 { font-size: 1.25rem; margin: 0 0 16px 0; color: #10b981; display: flex; justify-content: space-between; align-items: center; }
    .viewscreen { width: 100%; aspect-ratio: 16/9; background: #000; border-radius: 12px; overflow: hidden; position: relative; }
    .viewscreen img { width: 100%; height: 100%; object-fit: contain; }
    .badge { position: absolute; top: 12px; left: 12px; background: rgba(15,23,42,0.85); border: 1px solid rgba(255,255,255,0.1); padding: 6px 12px; border-radius: 20px; font-size: 0.85rem; font-family: monospace; color: #34d399; backdrop-filter: blur(8px); }
    .controls { margin-top: 16px; display: flex; flex-direction: column; gap: 12px; }
    .slider { width: 100%; accent-color: #10b981; cursor: pointer; }
    .btn-group { display: flex; gap: 8px; justify-content: center; align-items: center; }
    button { background: #1e293b; color: #e2e8f0; border: 1px solid #334155; padding: 8px 16px; border-radius: 8px; font-size: 0.9rem; font-weight: 500; cursor: pointer; transition: all 0.2s; }
    button:hover { background: #334155; color: #fff; }
    button.active { background: #059669; border-color: #10b981; color: #fff; }
  </style>
</head>
<body>
  <div class="card">
    <h1><span>Aetheria Terrarium Timelapse</span> <span style="font-size:0.85rem; color:#64748b; font-weight:normal;">${frames.length} Captured Frames</span></h1>
    <div class="viewscreen">
      <img id="stage" src="" alt="Timelapse Frame" />
      <div id="badge" class="badge"></div>
    </div>
    <div class="controls">
      <input type="range" id="timeline" class="slider" min="0" max="${frames.length - 1}" value="0" />
      <div class="btn-group">
        <button id="btnPlay">▶ Play</button>
        <button id="btnSpeed1" class="active">1x</button>
        <button id="btnSpeed2">2x</button>
        <button id="btnSpeed4">4x</button>
      </div>
    </div>
  </div>
  <script>
    const frames = ${jsonFrames};
    let currentIndex = 0;
    let isPlaying = false;
    let fps = 4;
    let timer = null;

    const imgEl = document.getElementById('stage');
    const badgeEl = document.getElementById('badge');
    const timelineEl = document.getElementById('timeline');
    const btnPlay = document.getElementById('btnPlay');

    function renderFrame(idx) {
      currentIndex = idx;
      const f = frames[idx];
      imgEl.src = f.dataUrl;
      badgeEl.textContent = f.label + ' (' + (idx + 1) + '/' + frames.length + ')';
      timelineEl.value = idx;
    }

    function step() {
      renderFrame((currentIndex + 1) % frames.length);
    }

    function togglePlay() {
      isPlaying = !isPlaying;
      if (isPlaying) {
        btnPlay.textContent = '⏸ Pause';
        btnPlay.classList.add('active');
        timer = setInterval(step, 1000 / fps);
      } else {
        btnPlay.textContent = '▶ Play';
        btnPlay.classList.remove('active');
        clearInterval(timer);
      }
    }

    btnPlay.addEventListener('click', togglePlay);
    timelineEl.addEventListener('input', (e) => renderFrame(parseInt(e.target.value)));

    [
      { id: 'btnSpeed1', speed: 4 },
      { id: 'btnSpeed2', speed: 8 },
      { id: 'btnSpeed4', speed: 16 }
    ].forEach(cfg => {
      document.getElementById(cfg.id).addEventListener('click', (e) => {
        document.querySelectorAll('.btn-group button').forEach(b => { if (b.id.startsWith('btnSpeed')) b.classList.remove('active'); });
        e.target.classList.add('active');
        fps = cfg.speed;
        if (isPlaying) { clearInterval(timer); timer = setInterval(step, 1000 / fps); }
      });
    });

    renderFrame(0);
  </script>
</body>
</html>`;

  const blob = new Blob([htmlContent], { type: 'text/html' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `aetheria-timelapse-${Date.now()}.html`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

/**
 * Downloads full frames data as a JSON file backup.
 */
export function downloadFramesAsJson(frames: TimelapseFrame[]) {
  if (frames.length === 0) return;
  const jsonStr = JSON.stringify(frames, null, 2);
  const blob = new Blob([jsonStr], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `terrarium-timelapse-history-${Date.now()}.json`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
