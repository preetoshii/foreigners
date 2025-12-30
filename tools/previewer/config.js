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
  // Does NOT apply between consecutive lines from same speaker
  speakerGapMs: 5000,
  
  // ===== Location Changes =====
  
  // Duration for location change (0 = instant)
  locationDurationMs: 0,
};

