// Web Audio API ambient sound generator
// Generates different noise types that simulate ambient environments

export type AmbientType = "cafe" | "rain" | "forest" | "cooking" | "chatter";

export interface AmbientSound {
  id: AmbientType;
  label: string;
  emoji: string;
}

export const AMBIENT_SOUNDS: AmbientSound[] = [
  { id: "cafe", label: "Coffee Shop", emoji: "☕" },
  { id: "rain", label: "Rainfall", emoji: "🌧️" },
  { id: "forest", label: "Forest", emoji: "🌲" },
  { id: "cooking", label: "Cooking", emoji: "🍳" },
  { id: "chatter", label: "Light Chatter", emoji: "💬" },
];

class AmbientEngine {
  private ctx: AudioContext | null = null;
  private gainNode: GainNode | null = null;
  private sources: AudioNode[] = [];
  private isPlaying = false;

  private getCtx() {
    if (!this.ctx) {
      this.ctx = new AudioContext();
      this.gainNode = this.ctx.createGain();
      this.gainNode.gain.value = 0.3;
      this.gainNode.connect(this.ctx.destination);
    }
    return { ctx: this.ctx, gain: this.gainNode! };
  }

  private createNoise(ctx: AudioContext, type: "white" | "brown" | "pink") {
    const bufferSize = 2 * ctx.sampleRate;
    const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
    const data = buffer.getChannelData(0);

    let b0 = 0, b1 = 0, b2 = 0, b3 = 0, b4 = 0, b5 = 0, b6 = 0;
    let lastOut = 0;

    for (let i = 0; i < bufferSize; i++) {
      const white = Math.random() * 2 - 1;
      if (type === "white") {
        data[i] = white * 0.5;
      } else if (type === "brown") {
        data[i] = (lastOut + 0.02 * white) / 1.02;
        lastOut = data[i];
        data[i] *= 3.5;
      } else {
        // Pink noise
        b0 = 0.99886 * b0 + white * 0.0555179;
        b1 = 0.99332 * b1 + white * 0.0750759;
        b2 = 0.969 * b2 + white * 0.153852;
        b3 = 0.8665 * b3 + white * 0.3104856;
        b4 = 0.55 * b4 + white * 0.5329522;
        b5 = -0.7616 * b5 - white * 0.016898;
        data[i] = (b0 + b1 + b2 + b3 + b4 + b5 + b6 + white * 0.5362) * 0.11;
        b6 = white * 0.115926;
      }
    }

    const src = ctx.createBufferSource();
    src.buffer = buffer;
    src.loop = true;
    return src;
  }

  play(type: AmbientType) {
    this.stop();
    const { ctx, gain } = this.getCtx();

    if (ctx.state === "suspended") ctx.resume();

    switch (type) {
      case "rain": {
        const noise = this.createNoise(ctx, "brown");
        const lpf = ctx.createBiquadFilter();
        lpf.type = "lowpass";
        lpf.frequency.value = 800;
        noise.connect(lpf);
        lpf.connect(gain);
        noise.start();
        this.sources.push(noise);
        // High frequency drips
        const drips = this.createNoise(ctx, "white");
        const bpf = ctx.createBiquadFilter();
        bpf.type = "bandpass";
        bpf.frequency.value = 4000;
        bpf.Q.value = 2;
        const dripGain = ctx.createGain();
        dripGain.gain.value = 0.08;
        drips.connect(bpf);
        bpf.connect(dripGain);
        dripGain.connect(gain);
        drips.start();
        this.sources.push(drips);
        break;
      }
      case "cafe": {
        // Mix of brown noise (base hum) + pink noise (chatter)
        const hum = this.createNoise(ctx, "brown");
        const lpf = ctx.createBiquadFilter();
        lpf.type = "lowpass";
        lpf.frequency.value = 500;
        const humGain = ctx.createGain();
        humGain.gain.value = 0.6;
        hum.connect(lpf);
        lpf.connect(humGain);
        humGain.connect(gain);
        hum.start();
        this.sources.push(hum);

        const chatter = this.createNoise(ctx, "pink");
        const bpf = ctx.createBiquadFilter();
        bpf.type = "bandpass";
        bpf.frequency.value = 1200;
        bpf.Q.value = 0.5;
        const chatGain = ctx.createGain();
        chatGain.gain.value = 0.3;
        chatter.connect(bpf);
        bpf.connect(chatGain);
        chatGain.connect(gain);
        chatter.start();
        this.sources.push(chatter);
        break;
      }
      case "forest": {
        // Soft pink noise + filtered high for birds
        const wind = this.createNoise(ctx, "pink");
        const lpf = ctx.createBiquadFilter();
        lpf.type = "lowpass";
        lpf.frequency.value = 600;
        const windGain = ctx.createGain();
        windGain.gain.value = 0.5;
        wind.connect(lpf);
        lpf.connect(windGain);
        windGain.connect(gain);
        wind.start();
        this.sources.push(wind);

        const birds = this.createNoise(ctx, "white");
        const hpf = ctx.createBiquadFilter();
        hpf.type = "highpass";
        hpf.frequency.value = 3000;
        const birdGain = ctx.createGain();
        birdGain.gain.value = 0.04;
        birds.connect(hpf);
        hpf.connect(birdGain);
        birdGain.connect(gain);
        birds.start();
        this.sources.push(birds);
        break;
      }
      case "cooking": {
        // Sizzle: filtered white noise
        const sizzle = this.createNoise(ctx, "white");
        const bpf = ctx.createBiquadFilter();
        bpf.type = "bandpass";
        bpf.frequency.value = 3000;
        bpf.Q.value = 1;
        const sizzleGain = ctx.createGain();
        sizzleGain.gain.value = 0.15;
        sizzle.connect(bpf);
        bpf.connect(sizzleGain);
        sizzleGain.connect(gain);
        sizzle.start();
        this.sources.push(sizzle);

        const bg = this.createNoise(ctx, "brown");
        const lpf = ctx.createBiquadFilter();
        lpf.type = "lowpass";
        lpf.frequency.value = 400;
        const bgGain = ctx.createGain();
        bgGain.gain.value = 0.3;
        bg.connect(lpf);
        lpf.connect(bgGain);
        bgGain.connect(gain);
        bg.start();
        this.sources.push(bg);
        break;
      }
      case "chatter": {
        const voices = this.createNoise(ctx, "pink");
        const bpf = ctx.createBiquadFilter();
        bpf.type = "bandpass";
        bpf.frequency.value = 800;
        bpf.Q.value = 0.3;
        voices.connect(bpf);
        bpf.connect(gain);
        voices.start();
        this.sources.push(voices);
        break;
      }
    }

    this.isPlaying = true;
  }

  stop() {
    this.sources.forEach((s) => {
      try {
        (s as AudioBufferSourceNode).stop();
      } catch { /* already stopped */ }
    });
    this.sources = [];
    this.isPlaying = false;
  }

  setVolume(v: number) {
    if (this.gainNode) this.gainNode.gain.value = v;
  }

  get playing() {
    return this.isPlaying;
  }
}

export const ambientEngine = new AmbientEngine();
