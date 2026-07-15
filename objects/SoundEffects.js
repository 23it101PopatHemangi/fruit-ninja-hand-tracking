export default class SoundEffects {
    constructor() {
        this.ctx = null;
        this.isMuted = false;
        
        // Load mute state from localStorage
        const storedMute = localStorage.getItem('fruit_slice_muted');
        if (storedMute !== null) {
            this.isMuted = storedMute === 'true';
        }
    }

    /**
     * Initializes the AudioContext. Must be triggered via a user gesture.
     */
    init() {
        if (this.ctx) return;
        try {
            const AudioContextClass = window.AudioContext || window.webkitAudioContext;
            this.ctx = new AudioContextClass();
        } catch (e) {
            console.warn("Web Audio API not supported in this browser.", e);
        }
    }

    /**
     * Resumes the AudioContext if suspended (browser security policy)
     */
    resume() {
        this.init();
        if (this.ctx && this.ctx.state === 'suspended') {
            this.ctx.resume();
        }
    }

    /**
     * Toggles the mute state and persists it
     */
    toggleMute() {
        this.isMuted = !this.isMuted;
        localStorage.setItem('fruit_slice_muted', this.isMuted);
        return this.isMuted;
    }

    /**
     * Generates a noise buffer for realistic slicing/explosion sounds
     */
    getNoiseBuffer() {
        if (!this.ctx) return null;
        
        const bufferSize = this.ctx.sampleRate * 1.5; // 1.5 seconds of noise
        const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
        const data = buffer.getChannelData(0);
        
        for (let i = 0; i < bufferSize; i++) {
            data[i] = Math.random() * 2 - 1;
        }
        
        return buffer;
    }

    /**
     * A swoosh sound followed by a wet crunch for fruit slicing
     */
    playSlice() {
        this.resume();
        if (this.isMuted || !this.ctx) return;

        const now = this.ctx.currentTime;
        
        // 1. Swoosh (Sine wave frequency sweep)
        const osc = this.ctx.createOscillator();
        const oscGain = this.ctx.createGain();
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(1000, now);
        osc.frequency.exponentialRampToValueAtTime(180, now + 0.12);
        oscGain.gain.setValueAtTime(0.12, now);
        oscGain.gain.exponentialRampToValueAtTime(0.001, now + 0.12);
        osc.connect(oscGain);
        oscGain.connect(this.ctx.destination);
        osc.start(now);
        osc.stop(now + 0.12);

        // 2. Wet Crunch (Filtered noise burst)
        const noise = this.ctx.createBufferSource();
        const noiseBuffer = this.getNoiseBuffer();
        if (noiseBuffer) {
            noise.buffer = noiseBuffer;
            
            const filter = this.ctx.createBiquadFilter();
            filter.type = 'bandpass';
            filter.frequency.setValueAtTime(600, now);
            filter.frequency.exponentialRampToValueAtTime(150, now + 0.08);

            const noiseGain = this.ctx.createGain();
            noiseGain.gain.setValueAtTime(0.18, now);
            noiseGain.gain.exponentialRampToValueAtTime(0.001, now + 0.08);

            noise.connect(filter);
            filter.connect(noiseGain);
            noiseGain.connect(this.ctx.destination);
            
            noise.start(now);
            noise.stop(now + 0.08);
        }
    }

    /**
     * Plays a deep liquid splat sound when fruit hits the ground or walls
     */
    playSplash() {
        this.resume();
        if (this.isMuted || !this.ctx) return;

        const now = this.ctx.currentTime;
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();

        osc.type = 'sine';
        osc.frequency.setValueAtTime(180, now);
        osc.frequency.linearRampToValueAtTime(45, now + 0.25);

        gain.gain.setValueAtTime(0.2, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.25);

        osc.connect(gain);
        gain.connect(this.ctx.destination);

        osc.start(now);
        osc.stop(now + 0.25);
    }

    /**
     * Synthesizes a massive, booming explosion with sub-bass rumble
     */
    playExplosion() {
        this.resume();
        if (this.isMuted || !this.ctx) return;

        const now = this.ctx.currentTime;

        // 1. High-frequency explosion crash (Noise)
        const noise = this.ctx.createBufferSource();
        const noiseBuffer = this.getNoiseBuffer();
        if (noiseBuffer) {
            noise.buffer = noiseBuffer;
            
            const filter = this.ctx.createBiquadFilter();
            filter.type = 'lowpass';
            filter.frequency.setValueAtTime(1000, now);
            filter.frequency.exponentialRampToValueAtTime(100, now + 0.6);

            const noiseGain = this.ctx.createGain();
            noiseGain.gain.setValueAtTime(0.45, now);
            noiseGain.gain.exponentialRampToValueAtTime(0.001, now + 0.6);

            noise.connect(filter);
            filter.connect(noiseGain);
            noiseGain.connect(this.ctx.destination);

            noise.start(now);
            noise.stop(now + 0.6);
        }

        // 2. Sub-bass boom (Sine wave rumble)
        const subOsc = this.ctx.createOscillator();
        const subGain = this.ctx.createGain();
        
        subOsc.type = 'sine';
        subOsc.frequency.setValueAtTime(90, now);
        subOsc.frequency.exponentialRampToValueAtTime(20, now + 0.8);
        
        subGain.gain.setValueAtTime(0.55, now);
        subGain.gain.exponentialRampToValueAtTime(0.001, now + 0.8);
        
        subOsc.connect(subGain);
        subGain.connect(this.ctx.destination);
        
        subOsc.start(now);
        subOsc.stop(now + 0.8);
    }

    /**
     * Plays a pleasant arpeggio chime for slices combos
     */
    playCombo(sliceCount = 3) {
        this.resume();
        if (this.isMuted || !this.ctx) return;

        const now = this.ctx.currentTime;
        const notes = [523.25, 659.25, 783.99, 1046.50]; // C5, E5, G5, C6
        const count = Math.min(sliceCount, notes.length);

        for (let i = 0; i < count; i++) {
            const timeOffset = i * 0.08;
            const osc = this.ctx.createOscillator();
            const gain = this.ctx.createGain();
            
            osc.type = 'triangle';
            osc.frequency.setValueAtTime(notes[i], now + timeOffset);
            
            gain.gain.setValueAtTime(0.12, now + timeOffset);
            gain.gain.exponentialRampToValueAtTime(0.001, now + timeOffset + 0.3);
            
            osc.connect(gain);
            gain.connect(this.ctx.destination);
            
            osc.start(now + timeOffset);
            osc.stop(now + timeOffset + 0.3);
        }
    }

    /**
     * Plays a sad, descending series of notes for Game Over
     */
    playGameOver() {
        this.resume();
        if (this.isMuted || !this.ctx) return;

        const now = this.ctx.currentTime;
        const notes = [329.63, 293.66, 261.63, 196.00]; // E4, D4, C4, G3

        for (let i = 0; i < notes.length; i++) {
            const timeOffset = i * 0.15;
            const osc = this.ctx.createOscillator();
            const gain = this.ctx.createGain();
            
            osc.type = 'sawtooth';
            osc.frequency.setValueAtTime(notes[i], now + timeOffset);
            
            gain.gain.setValueAtTime(0.15, now + timeOffset);
            gain.gain.exponentialRampToValueAtTime(0.001, now + timeOffset + 0.4);
            
            osc.connect(gain);
            gain.connect(this.ctx.destination);
            
            osc.start(now + timeOffset);
            osc.stop(now + timeOffset + 0.4);
        }
    }

    /**
     * Plays a short metallic ping when time slows down (freeze fruit)
     */
    playFreeze() {
        this.resume();
        if (this.isMuted || !this.ctx) return;

        const now = this.ctx.currentTime;
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();

        osc.type = 'sine';
        osc.frequency.setValueAtTime(1500, now);
        osc.frequency.exponentialRampToValueAtTime(600, now + 0.5);

        gain.gain.setValueAtTime(0.15, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.5);

        osc.connect(gain);
        gain.connect(this.ctx.destination);

        osc.start(now);
        osc.stop(now + 0.5);
    }

    /**
     * Plays a short UI button click sound
     */
    playClick() {
        this.resume();
        if (this.isMuted || !this.ctx) return;

        const now = this.ctx.currentTime;
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();

        osc.type = 'sine';
        osc.frequency.setValueAtTime(600, now);
        osc.frequency.linearRampToValueAtTime(100, now + 0.05);

        gain.gain.setValueAtTime(0.15, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.05);

        osc.connect(gain);
        gain.connect(this.ctx.destination);

        osc.start(now);
        osc.stop(now + 0.05);
    }
}
