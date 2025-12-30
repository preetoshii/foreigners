/**
 * Timeline Generator
 * 
 * Takes parsed events and generates a timeline with computed timings.
 * Each event gets: duration, startTime, endTime
 * Text events also get: audioPath, audioStart
 */

import { createRandom } from './seeded-random.js';
import { config } from './config.js';

/**
 * Estimate how long a piece of text should take to "speak"
 */
function estimateDuration(text) {
  const words = text.trim().split(/\s+/).filter(w => w.length > 0);
  const wordMs = words.length * config.msPerWord;
  return Math.max(config.minDurationMs, wordMs);
}

/**
 * Resolve the audio path for a character/state combination
 */
function resolveAudioPath(character, state, manifest) {
  const charLower = character.toLowerCase();
  const stateLower = state.toLowerCase();
  
  const charData = manifest.characters?.[charLower];
  if (!charData) {
    console.warn(`Character not found in manifest: ${character}`);
    return null;
  }
  
  const stateData = charData.states?.[stateLower];
  if (!stateData) {
    console.warn(`State not found for ${character}: ${state}`);
    // Fall back to neutral if available
    const neutralState = charData.states?.neutral;
    if (neutralState?.audio?.length > 0) {
      return `../../assets/characters/${charLower}/states/neutral/audio/${neutralState.audio[0]}`;
    }
    return null;
  }
  
  if (!stateData.audio || stateData.audio.length === 0) {
    console.warn(`No audio files for ${character}/${state}`);
    return null;
  }
  
  // Use the first audio file in the folder
  const audioFile = stateData.audio[0];
  return `../../assets/characters/${charLower}/states/${stateLower}/audio/${audioFile}`;
}

/**
 * Generate a timeline from parsed events.
 * 
 * @param {Object} parsed - Output from parser { seed, events }
 * @param {Object} manifest - Asset manifest
 * @param {Object} audioManager - Audio manager instance (for getting durations)
 * @returns {Object} - Timeline with enriched events
 */
export async function generateTimeline(parsed, manifest, audioManager) {
  const { seed, events } = parsed;
  const random = createRandom(seed || 12345);
  
  // First pass: collect all audio paths we need to load
  const audioPaths = new Set();
  for (const event of events) {
    if (event.type === 'text') {
      const path = resolveAudioPath(event.character, event.state || 'neutral', manifest);
      if (path) audioPaths.add(path);
    }
  }
  
  // Preload all audio
  await audioManager.preloadAll([...audioPaths]);
  
  // Second pass: generate timeline with timings
  let currentTime = 0;
  let lastSpeaker = null;
  const timeline = [];
  
  for (const event of events) {
    const entry = { ...event };
    
    switch (event.type) {
      case 'text': {
        // Add speaker gap if speaker changed
        if (lastSpeaker !== null && lastSpeaker !== event.character) {
          currentTime += config.speakerGapMs;
        }
        lastSpeaker = event.character;
        
        // Compute duration from text length
        entry.duration = estimateDuration(event.text);
        
        // Resolve audio path
        entry.audioPath = resolveAudioPath(event.character, event.state || 'neutral', manifest);
        
        // Pick random start point in the audio
        if (entry.audioPath) {
          const audioDuration = audioManager.getDuration(entry.audioPath);
          const playDuration = entry.duration / 1000; // Convert to seconds
          
          // Make sure we have room for the clip
          const maxStart = Math.max(0, audioDuration - playDuration);
          entry.audioStart = random.range(0, maxStart);
          entry.audioDuration = Math.min(playDuration, audioDuration - entry.audioStart);
        }
        break;
      }
      
      case 'pause': {
        // Use explicit duration if provided, otherwise default
        entry.duration = event.duration || config.pauseDurationMs;
        break;
      }
      
      case 'location': {
        // Location changes can have configurable duration
        entry.duration = config.locationDurationMs;
        lastSpeaker = null; // Reset speaker context on location change
        break;
      }
      
      default: {
        // Unknown event types are instant
        entry.duration = 0;
      }
    }
    
    // Set timing
    entry.startTime = currentTime;
    entry.endTime = currentTime + entry.duration;
    currentTime = entry.endTime;
    
    timeline.push(entry);
  }
  
  return {
    seed: seed || 12345,
    totalDuration: currentTime,
    events: timeline
  };
}

