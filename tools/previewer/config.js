/**
 * Previewer Configuration
 * 
 * Timing and duration settings for episode playback.
 */

export const config = {
  // ===== Speech Duration =====
  
  // Milliseconds per word when estimating speech duration
  msPerWord: 400,
  
  // Minimum duration for any text (handles short words like "Oh")
  minDurationMs: 500,
  
  // ===== Pauses & Gaps =====
  
  // Duration for explicit pause events [...] (ms)
  pauseDurationMs: 2000,
  
  // Gap when speaker changes (ms)
  speakerGapMs: 500,
  
  // Gap when same speaker changes emotional state (ms)
  stateChangeGapMs: 200,
  
  // ===== Location Changes =====
  
  // Duration for location change (0 = instant)
  locationDurationMs: 0,

  // ===== Audio =====
  
  // Micro-fade duration at start/end of audio clips (ms)
  // Helps smooth any remaining clicks after energy detection
  audioFadeMs: 100,
};

