/**
 * Audio Manager
 * 
 * Handles loading and playing audio using Web Audio API.
 * Caches loaded audio buffers for reuse.
 * Analyzes audio energy for natural cut points.
 */

// Energy analysis config
const ENERGY_WINDOW_MS = 20;    // Analyze in 20ms windows
const ENERGY_THRESHOLD = 0.08;  // RMS below this = low energy (tune as needed)

export function createAudioManager() {
  const audioContext = new (window.AudioContext || window.webkitAudioContext)();
  const cache = new Map();       // path -> AudioBuffer
  const energyCache = new Map(); // path -> array of low-energy timestamps

  /**
   * Load an audio file and cache it.
   * Also analyzes energy and caches low-energy points.
   * Returns the AudioBuffer.
   */
  async function load(path) {
    // Return cached if we have it
    if (cache.has(path)) {
      return cache.get(path);
    }

    const response = await fetch(path);
    if (!response.ok) {
      throw new Error(`Failed to load audio: ${path} (${response.status})`);
    }

    const arrayBuffer = await response.arrayBuffer();
    const audioBuffer = await audioContext.decodeAudioData(arrayBuffer);
    
    cache.set(path, audioBuffer);
    
    // Analyze energy and cache low-energy points
    const lowEnergyPoints = analyzeEnergy(audioBuffer);
    energyCache.set(path, lowEnergyPoints);
    
    return audioBuffer;
  }

  /**
   * Analyze audio buffer and return array of low-energy timestamps (seconds).
   * These are good points to start/end audio without cutting mid-syllable.
   */
  function analyzeEnergy(audioBuffer) {
    const sampleRate = audioBuffer.sampleRate;
    const samples = audioBuffer.getChannelData(0); // Use first channel
    const windowSize = Math.floor(sampleRate * ENERGY_WINDOW_MS / 1000);
    const lowPoints = [];
    
    for (let i = 0; i < samples.length; i += windowSize) {
      // Calculate RMS (root mean square) for this window
      let sum = 0;
      const end = Math.min(i + windowSize, samples.length);
      for (let j = i; j < end; j++) {
        sum += samples[j] * samples[j];
      }
      const rms = Math.sqrt(sum / (end - i));
      
      // If energy is below threshold, record this timestamp
      if (rms < ENERGY_THRESHOLD) {
        const timestamp = i / sampleRate;
        lowPoints.push(timestamp);
      }
    }
    
    return lowPoints;
  }

  /**
   * Get cached low-energy points for an audio file.
   * Returns array of timestamps (seconds) or empty array if not analyzed.
   */
  function getLowEnergyPoints(path) {
    return energyCache.get(path) || [];
  }

  /**
   * Get the duration (in seconds) of a loaded audio file.
   */
  function getDuration(path) {
    const buffer = cache.get(path);
    if (!buffer) {
      throw new Error(`Audio not loaded: ${path}`);
    }
    return buffer.duration;
  }

  /**
   * Play a portion of an audio file.
   * 
   * @param {string} path - Path to the audio file (must be loaded first)
   * @param {number} startTime - Where to start in the audio (seconds)
   * @param {number} duration - How long to play (seconds)
   * @returns {Promise} - Resolves when playback completes
   */
  function play(path, startTime, duration) {
    const buffer = cache.get(path);
    if (!buffer) {
      throw new Error(`Audio not loaded: ${path}`);
    }

    // Resume context if suspended (browser autoplay policy)
    if (audioContext.state === 'suspended') {
      audioContext.resume();
    }

    return new Promise((resolve) => {
      const source = audioContext.createBufferSource();
      source.buffer = buffer;
      source.connect(audioContext.destination);

      // Clamp startTime to valid range
      const safeStart = Math.max(0, Math.min(startTime, buffer.duration - 0.1));
      // Clamp duration so we don't exceed buffer
      const safeDuration = Math.min(duration, buffer.duration - safeStart);

      source.onended = resolve;
      source.start(0, safeStart, safeDuration);
    });
  }

  /**
   * Pause all audio (suspends the AudioContext).
   * All sources freeze in place and can be resumed.
   */
  function pause() {
    if (audioContext.state === 'running') {
      audioContext.suspend();
    }
  }

  /**
   * Resume all audio (resumes the AudioContext).
   * All sources continue from where they paused.
   */
  function resume() {
    if (audioContext.state === 'suspended') {
      audioContext.resume();
    }
  }

  /**
   * Preload multiple audio files.
   */
  async function preloadAll(paths) {
    await Promise.all(paths.map(p => load(p)));
  }

  return {
    load,
    getDuration,
    getLowEnergyPoints,
    play,
    pause,
    resume,
    preloadAll,
    get context() { return audioContext; }
  };
}

