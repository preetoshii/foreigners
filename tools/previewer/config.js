/**
 * Previewer Configuration
 * 
 * Timing and duration settings for episode playback.
 * Adjust these to fine-tune the feel of the preview.
 */

export const config = {
  // ===== Duration Estimation =====
  
  // Base milliseconds per word when estimating speech duration
  msPerWord: 300,
  
  // Milliseconds per character (used for very short text like "Oh")
  msPerCharacter: 50,
  
  // Minimum duration for any text event (ms)
  minDurationMs: 500,
  
  // Multiplier applied to estimated durations (1.0 = normal, 1.5 = 50% slower)
  durationMultiplier: 1.0,
  
  // ===== Pauses & Gaps =====
  
  // Default duration for explicit pause events [...] (ms)
  pauseDurationMs: 800,
  
  // Gap inserted when speaker changes (ms)
  // This adds a natural breath/beat between different characters
  // Does NOT apply between consecutive lines from the same speaker
  speakerGapMs: 200,
  
  // ===== Location Changes =====
  
  // Duration to display location change (ms)
  // Set to 0 for instant, or add time for the location to "breathe"
  locationDurationMs: 0,
};

