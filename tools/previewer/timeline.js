/**
 * Timeline Generator
 * 
 * Takes parsed events and generates a timeline with computed timings.
 * Each event gets: duration, startTime, endTime
 * Text events also get: audioPath, audioStart
 * 
 * Uses energy analysis to find natural cut points in audio,
 * avoiding mid-syllable cuts for more natural playback.
 */

import { createRandom } from './seeded-random.js';
import { config } from './config.js';

// How far to search for low-energy points (seconds)
const ENERGY_SEARCH_RANGE = 0.2; // 200ms

/**
 * Estimate how long a piece of text should take to "speak"
 */
function estimateDuration(text) {
  const words = text.trim().split(/\s+/).filter(w => w.length > 0);
  const wordMs = words.length * config.msPerWord;
  return Math.max(config.minDurationMs, wordMs);
}

/**
 * Find the nearest low-energy point AT or AFTER the given time.
 * Returns the original time if no suitable point found within range.
 * 
 * @param {number} time - Target time in seconds
 * @param {number[]} lowPoints - Array of low-energy timestamps
 * @param {number} maxSearch - Max distance to search (seconds)
 * @returns {number} - Snapped time (>= original time)
 */
function findLowEnergyAfter(time, lowPoints, maxSearch = ENERGY_SEARCH_RANGE) {
  const maxTime = time + maxSearch;
  
  for (const point of lowPoints) {
    if (point >= time && point <= maxTime) {
      return point;
    }
    // Since lowPoints is sorted, we can stop early
    if (point > maxTime) break;
  }
  
  // No suitable point found, return original
  return time;
}

/**
 * Find the nearest low-energy point AT or BEFORE the given time.
 * Returns the original time if no suitable point found within range.
 * 
 * @param {number} time - Target time in seconds
 * @param {number[]} lowPoints - Array of low-energy timestamps
 * @param {number} maxSearch - Max distance to search (seconds)
 * @returns {number} - Snapped time (<= original time)
 */
function findLowEnergyBefore(time, lowPoints, maxSearch = ENERGY_SEARCH_RANGE) {
  const minTime = time - maxSearch;
  let bestPoint = time; // Default to original
  
  for (const point of lowPoints) {
    if (point >= minTime && point <= time) {
      bestPoint = point; // Keep updating to get the closest one before time
    }
    // Since lowPoints is sorted, we can stop once past our target
    if (point > time) break;
  }
  
  return bestPoint;
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
  let lastState = null;
  const timeline = [];
  
  for (const event of events) {
    const entry = { ...event };
    
    switch (event.type) {
      case 'text': {
        const eventState = event.state || 'neutral';
        
        // Add gap if speaker or state changed
        if (lastSpeaker !== null && lastSpeaker !== event.character) {
          // Different speaker
          currentTime += config.speakerGapMs;
        } else if (lastSpeaker === event.character && lastState !== null && lastState !== eventState) {
          // Same speaker, different state
          currentTime += config.stateChangeGapMs;
        }
        
        lastSpeaker = event.character;
        lastState = eventState;
        
        // Compute duration from text length
        entry.duration = estimateDuration(event.text);
        
        // Resolve audio path
        entry.audioPath = resolveAudioPath(event.character, event.state || 'neutral', manifest);
        
        // Pick random start point in the audio, snapped to low-energy points
        if (entry.audioPath) {
          const audioDuration = audioManager.getDuration(entry.audioPath);
          const targetPlayDuration = entry.duration / 1000; // Convert to seconds
          const lowPoints = audioManager.getLowEnergyPoints(entry.audioPath);
          
          // Make sure we have room for the clip
          const maxStart = Math.max(0, audioDuration - targetPlayDuration);
          const rawStart = random.range(0, maxStart);
          
          // Snap start to low-energy point AT or AFTER rawStart
          // (audio can start slightly later, never earlier)
          const snappedStart = findLowEnergyAfter(rawStart, lowPoints);
          
          // Calculate target end and snap to low-energy point AT or BEFORE
          // (audio can end slightly earlier, never later)
          const targetEnd = snappedStart + targetPlayDuration;
          const snappedEnd = findLowEnergyBefore(targetEnd, lowPoints);
          
          // Final values
          entry.audioStart = snappedStart;
          entry.audioDuration = Math.max(0.1, snappedEnd - snappedStart); // Min 100ms
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
        lastSpeaker = null; // Reset context on location change
        lastState = null;
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

