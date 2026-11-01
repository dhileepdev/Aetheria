/**
 * Procedural Web Audio Sound Generator for Terrarium Atmosphere
 * 100% synthesized in code (zero external audio files).
 */

class TerrariumAudio {
  private ctx: AudioContext | null = null;
  private isMuted: boolean = true;
  private masterGain: GainNode | null = null;

  // Sound nodes
  private windGain: GainNode | null = null;
  private rainGain: GainNode | null = null;
  private cricketGain: GainNode | null = null;

  private cricketIntervalId: number | null = null;

  private init() {
    if (this.ctx) return;
    const AudioContextClass = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    if (!AudioContextClass) return;

    this.ctx = new AudioContextClass();
    this.masterGain = this.ctx.createGain();
    this.masterGain.gain.value = 0.35;
    this.masterGain.connect(this.ctx.destination);

    // Setup noise buffer
    const bufferSize = this.ctx.sampleRate * 2;
    const noiseBuffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const output = noiseBuffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      output[i] = Math.random() * 2 - 1;
    }

    // 1. Wind synthesis
    const windSource = this.ctx.createBufferSource();
    windSource.buffer = noiseBuffer;
    windSource.loop = true;

    const windFilter = this.ctx.createBiquadFilter();
    windFilter.type = 'bandpass';
    windFilter.frequency.value = 320;
    windFilter.Q.value = 3.0;

    this.windGain = this.ctx.createGain();
    this.windGain.gain.value = 0.05;

    windSource.connect(windFilter);
    windFilter.connect(this.windGain);
    this.windGain.connect(this.masterGain);
    windSource.start(0);

    // 2. Rain synthesis
    const rainSource = this.ctx.createBufferSource();
    rainSource.buffer = noiseBuffer;
    rainSource.loop = true;

    const rainFilter = this.ctx.createBiquadFilter();
    rainFilter.type = 'lowpass';
    rainFilter.frequency.value = 1200;

    this.rainGain = this.ctx.createGain();
    this.rainGain.gain.value = 0.0;

    rainSource.connect(rainFilter);
    rainFilter.connect(this.rainGain);
    this.rainGain.connect(this.masterGain);
    rainSource.start(0);

    // 3. Cricket synthesis setup
    this.cricketGain = this.ctx.createGain();
    this.cricketGain.gain.value = 0.0;
    this.cricketGain.connect(this.masterGain);

    this.startCricketLoop();
  }

  private startCricketLoop() {
    if (this.cricketIntervalId) return;

    const chirp = () => {
      if (!this.ctx || this.isMuted || !this.cricketGain || this.cricketGain.gain.value < 0.01) {
        return;
      }
      try {
        const now = this.ctx.currentTime;
        const osc = this.ctx.createOscillator();
        const chirpGain = this.ctx.createGain();

        osc.type = 'sine';
        osc.frequency.setValueAtTime(4600 + Math.random() * 300, now);

        chirpGain.gain.setValueAtTime(0, now);
        chirpGain.gain.linearRampToValueAtTime(0.04, now + 0.02);
        chirpGain.gain.exponentialRampToValueAtTime(0.001, now + 0.12);

        osc.connect(chirpGain);
        chirpGain.connect(this.cricketGain);

        osc.start(now);
        osc.stop(now + 0.13);
      } catch {
        // audio context might be suspended
      }
    };

    this.cricketIntervalId = window.setInterval(() => {
      if (Math.random() > 0.4) {
        chirp();
        setTimeout(chirp, 140);
        if (Math.random() > 0.5) setTimeout(chirp, 280);
      }
    }, 1200);
  }

  public setEnabled(enabled: boolean) {
    if (enabled && !this.ctx) {
      this.init();
    }
    if (this.ctx && this.ctx.state === 'suspended' && enabled) {
      this.ctx.resume();
    }
    this.isMuted = !enabled;
    if (this.masterGain && this.ctx) {
      const now = this.ctx.currentTime;
      this.masterGain.gain.cancelScheduledValues(now);
      this.masterGain.gain.linearRampToValueAtTime(enabled ? 0.35 : 0.0, now + 0.1);
    }
  }

  public playWaterDrop() {
    if (!this.ctx || this.isMuted || this.ctx.state === 'suspended') return;
    try {
      const now = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(900 + Math.random() * 400, now);
      osc.frequency.exponentialRampToValueAtTime(320, now + 0.22);

      gain.gain.setValueAtTime(0.08, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.25);

      osc.connect(gain);
      if (this.masterGain) gain.connect(this.masterGain);

      osc.start(now);
      osc.stop(now + 0.26);
    } catch {
      // Ignore
    }
  }

  public updateAtmosphere(wind: number, rain: number, isNight: boolean) {
    if (!this.ctx || this.isMuted) return;
    const now = this.ctx.currentTime;

    if (this.windGain) {
      this.windGain.gain.linearRampToValueAtTime(Math.min(0.25, 0.02 + wind * 0.18), now + 0.3);
    }
    if (this.rainGain) {
      this.rainGain.gain.linearRampToValueAtTime(rain * 0.3, now + 0.3);
    }
    if (this.cricketGain) {
      const targetCricket = isNight && rain < 0.2 ? 0.4 : 0.0;
      this.cricketGain.gain.linearRampToValueAtTime(targetCricket, now + 0.5);
    }
  }

  public dispose() {
    if (this.cricketIntervalId) {
      clearInterval(this.cricketIntervalId);
      this.cricketIntervalId = null;
    }
    if (this.ctx) {
      this.ctx.close();
      this.ctx = null;
    }
  }
}

export const terrariumAudio = new TerrariumAudio();
