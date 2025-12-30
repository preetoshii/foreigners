/**
 * Audio Manager
 * 
 * Handles loading and playing audio using Web Audio API.
 * Caches loaded audio buffers for reuse.
 */

export function createAudioManager() {
  const audioContext = new (window.AudioContext || window.webkitAudioContext)();
  const cache = new Map(); // path -> AudioBuffer

  /**
   * Load an audio file and cache it.
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
    return audioBuffer;
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
    play,
    pause,
    resume,
    preloadAll,
    get context() { return audioContext; }
  };
}

