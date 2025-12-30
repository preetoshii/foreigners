/**
 * Foreigners Previewer
 * 
 * Minimal, preview-focused playback of FSL episodes.
 */

import { parse } from '../parser/parser.js';
import { createAudioManager } from './audio.js';
import { generateTimeline } from './timeline.js';
import { createRenderer } from './renderer.js';

// ===== State =====
let manifest = null;
let audioManager = null;
let renderer = null;
let timeline = null;
let currentEventIndex = 0;
let isPlaying = false;
let stopRequested = false;
let currentScript = '';
let playbackStartTime = 0;
let playbackStartOffset = 0;
let animationFrameId = null;

// ===== DOM Elements =====
const episodeSelect = document.getElementById('episode-select');
const loadBtn = document.getElementById('load-btn');
const playBtn = document.getElementById('play-btn');
const prevBtn = document.getElementById('prev-btn');
const nextBtn = document.getElementById('next-btn');
const previewContainer = document.getElementById('preview-container');
const previewCanvas = document.getElementById('preview-canvas');
const overlay = document.getElementById('overlay');
const transport = document.querySelector('.transport');
const progressFill = document.getElementById('progress-fill');
const progressDots = document.getElementById('progress-dots');
const progressTrack = document.getElementById('progress-track');
const timeDisplay = document.getElementById('time-display');
const eventDisplay = document.getElementById('event-display');
const drawerToggle = document.getElementById('drawer-toggle');
const drawer = document.getElementById('drawer');
const drawerClose = document.getElementById('drawer-close');
const drawerTabs = document.querySelectorAll('.drawer-tabs button');
const scriptContent = document.getElementById('script-content');
const timelineContent = document.getElementById('timeline-content');

// Debug bar
const debugToggle = document.getElementById('debug-toggle');
const debugBar = document.getElementById('debug-bar');
const debugLocation = document.getElementById('debug-location');
const debugCharacter = document.getElementById('debug-character');
const debugState = document.getElementById('debug-state');

// Overlay visibility
let overlayTimeout = null;
const OVERLAY_HIDE_DELAY = 1500; // 1.5 seconds

// LocalStorage keys for persistence
const STORAGE_EPISODE = 'foreigners_lastEpisode';
const STORAGE_EVENT = 'foreigners_lastEvent';

// ===== Initialize =====
async function init() {
  // Initialize renderer
  renderer = createRenderer(previewCanvas);
  resizeCanvas();
  window.addEventListener('resize', resizeCanvas);
  
  // Show initial state
  renderer.setState({
    subtitle: 'Select an episode to begin',
    isSubtitleEmpty: true,
  });

  // Load manifest
  try {
    const response = await fetch('../../assets/manifest.json');
    manifest = await response.json();
  } catch (e) {
    console.error('Failed to load manifest:', e);
    renderer.setState({ subtitle: 'Error loading assets', isSubtitleEmpty: true });
    return;
  }

  // Initialize audio manager
  audioManager = createAudioManager();

  // Load episode list
  await loadEpisodeList();

  // Wire up events
  episodeSelect.addEventListener('change', handleEpisodeSelect);
  loadBtn.addEventListener('click', handleLoad);
  playBtn.addEventListener('click', handlePlayPause);
  prevBtn.addEventListener('click', handlePrev);
  nextBtn.addEventListener('click', handleNext);
  progressTrack.addEventListener('click', handleProgressClick);
  drawerToggle.addEventListener('click', toggleDrawer);
  drawerClose.addEventListener('click', () => drawer.classList.remove('open'));
  debugToggle.addEventListener('click', toggleDebug);
  
  drawerTabs.forEach(tab => {
    tab.addEventListener('click', () => switchTab(tab.dataset.tab));
  });

  // Keyboard shortcuts
  document.addEventListener('keydown', handleKeydown);

  // Overlay visibility (YouTube-style)
  previewContainer.addEventListener('mousemove', showOverlay);
  previewContainer.addEventListener('mouseenter', showOverlay);
  previewContainer.addEventListener('mouseleave', hideOverlayDelayed);
  previewContainer.addEventListener('click', handleContainerClick);
  
  // Initially show overlay
  showOverlay();

  // Restore last session
  const lastEpisode = localStorage.getItem(STORAGE_EPISODE);
  const lastEvent = localStorage.getItem(STORAGE_EVENT);
  
  if (lastEpisode && episodeSelect.querySelector(`option[value="${lastEpisode}"]`)) {
    episodeSelect.value = lastEpisode;
    loadBtn.disabled = false;
    
    // Auto-load the episode
    await handleLoad();
    
    // Jump to last event position
    if (lastEvent && timeline) {
      const eventIndex = parseInt(lastEvent, 10);
      if (eventIndex > 0 && eventIndex < timeline.events.length) {
        jumpToEvent(eventIndex);
      }
    }
  }
}

function resizeCanvas() {
  const rect = previewContainer.getBoundingClientRect();
  renderer.resize(rect.width, rect.height);
}

// ===== Overlay Visibility =====
function showOverlay() {
  clearTimeout(overlayTimeout);
  overlay.classList.remove('hidden');
  
  // Only auto-hide if playing
  if (isPlaying) {
    overlayTimeout = setTimeout(hideOverlay, OVERLAY_HIDE_DELAY);
  }
}

function hideOverlay() {
  // Don't hide if paused or no timeline loaded
  if (!isPlaying || !timeline) return;
  overlay.classList.add('hidden');
}

function hideOverlayDelayed() {
  clearTimeout(overlayTimeout);
  if (isPlaying) {
    overlayTimeout = setTimeout(hideOverlay, 150);
  }
}

function handleContainerClick(e) {
  // If clicking on canvas (not controls), toggle play
  if (e.target === previewCanvas) {
    handlePlayPause();
  }
}

// ===== Episode List =====
async function loadEpisodeList() {
  try {
    const knownEpisodes = ['test.episode', 'first-life.episode'];
    
    for (const filename of knownEpisodes) {
      try {
        const response = await fetch(`../../episodes/${filename}`, { method: 'HEAD' });
        if (response.ok) {
          const option = document.createElement('option');
          option.value = filename;
          option.textContent = filename.replace('.episode', '');
          episodeSelect.appendChild(option);
        }
      } catch (e) {
        // Episode doesn't exist, skip
      }
    }
  } catch (e) {
    console.error('Failed to load episode list:', e);
  }
}

// ===== Event Handlers =====
function handleEpisodeSelect() {
  loadBtn.disabled = !episodeSelect.value;
}

async function handleLoad() {
  const filename = episodeSelect.value;
  if (!filename) return;

  renderer.setState({ subtitle: 'Loading...', isSubtitleEmpty: true });

  try {
    // Fetch the episode file
    const response = await fetch(`../../episodes/${filename}`);
    if (!response.ok) throw new Error('Episode not found');
    
    currentScript = await response.text();
    scriptContent.textContent = currentScript;

    // Parse the script
    const parsed = parse(currentScript);
    
    if (parsed.events.length === 0) {
      renderer.setState({ subtitle: 'No events in script', isSubtitleEmpty: true });
      return;
    }

    // Generate timeline
    timeline = await generateTimeline(parsed, manifest, audioManager);
    currentEventIndex = 0;

    // Update timeline display
    timelineContent.textContent = JSON.stringify(timeline, null, 2);

    // Enable and show controls
    playBtn.disabled = false;
    prevBtn.disabled = false;
    nextBtn.disabled = false;
    transport.classList.add('visible');

    // Create event dots
    createEventDots();

    // Show first event
    updateDisplay();
    updateProgress();

    // Save to localStorage
    localStorage.setItem(STORAGE_EPISODE, filename);
    localStorage.setItem(STORAGE_EVENT, '0');

  } catch (e) {
    console.error('Failed to load episode:', e);
    renderer.setState({ subtitle: 'Error: ' + e.message, isSubtitleEmpty: true });
  }
}

const PLAY_ICON = '<svg viewBox="0 0 24 24"><path d="M8 5v14l11-7z"/></svg>';
const PAUSE_ICON = '<svg viewBox="0 0 24 24"><path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z"/></svg>';

function handlePlayPause() {
  if (isPlaying) {
    stopRequested = true;
    audioManager.pause(); // Suspend audio context - freezes all audio in place
    playBtn.innerHTML = PLAY_ICON;
    showOverlay(); // Show overlay when paused
  } else {
    audioManager.resume(); // Resume audio context if it was paused
    play();
  }
}

function handlePrev() {
  if (!timeline) return;
  
  // Find previous text event
  for (let i = currentEventIndex - 1; i >= 0; i--) {
    if (timeline.events[i].type === 'text') {
      jumpToEvent(i);
      break;
    }
  }
}

function handleNext() {
  if (!timeline) return;
  
  // Find next text event
  for (let i = currentEventIndex + 1; i < timeline.events.length; i++) {
    if (timeline.events[i].type === 'text') {
      jumpToEvent(i);
      break;
    }
  }
}

function handleProgressClick(e) {
  if (!timeline) return;
  
  const rect = progressTrack.getBoundingClientRect();
  const clickX = e.clientX - rect.left;
  const clickPercent = clickX / rect.width;
  const clickTime = clickPercent * timeline.totalDuration;
  
  // Find the event at this time
  for (let i = timeline.events.length - 1; i >= 0; i--) {
    if (timeline.events[i].startTime <= clickTime) {
      jumpToEvent(i);
      break;
    }
  }
}

function jumpToEvent(index) {
  if (isPlaying) {
    stopRequested = true;
  }
  currentEventIndex = index;
  localStorage.setItem(STORAGE_EVENT, String(index));
  updateDisplay();
  updateProgress();
  updateDotStates();
}

function handleKeydown(e) {
  if (e.target.tagName === 'TEXTAREA' || e.target.tagName === 'INPUT') return;
  
  switch (e.code) {
    case 'Space':
      e.preventDefault();
      handlePlayPause();
      break;
    case 'ArrowLeft':
      handlePrev();
      break;
    case 'ArrowRight':
      handleNext();
      break;
    case 'Escape':
      drawer.classList.remove('open');
      break;
  }
}

// ===== Drawer =====
function toggleDrawer() {
  drawer.classList.toggle('open');
  drawerToggle.textContent = drawer.classList.contains('open') ? 'Hide Details ↓' : 'Show Details ↑';
}

function toggleDebug() {
  debugBar.classList.toggle('visible');
}

function updateDebugBar(location, character, state) {
  debugLocation.textContent = location || '—';
  debugCharacter.textContent = character || '—';
  debugState.textContent = state || '—';
}

function switchTab(tab) {
  drawerTabs.forEach(t => t.classList.toggle('active', t.dataset.tab === tab));
  scriptContent.style.display = tab === 'script' ? 'block' : 'none';
  timelineContent.style.display = tab === 'timeline' ? 'block' : 'none';
}

// ===== Event Dots =====
function createEventDots() {
  progressDots.innerHTML = '';
  
  if (!timeline) return;
  
  timeline.events.forEach((event, index) => {
    // Only show dots for text events (not locations or instant events)
    if (event.type !== 'text' && event.type !== 'pause') return;
    
    const dot = document.createElement('div');
    dot.className = 'progress-dot';
    if (event.type === 'text') dot.classList.add('text-event');
    
    const position = (event.startTime / timeline.totalDuration) * 100;
    dot.style.left = `${position}%`;
    dot.dataset.index = index;
    
    dot.addEventListener('click', (e) => {
      e.stopPropagation();
      jumpToEvent(index);
    });
    
    progressDots.appendChild(dot);
  });
  
  updateDotStates();
}

function updateDotStates() {
  const dots = progressDots.querySelectorAll('.progress-dot');
  dots.forEach(dot => {
    const index = parseInt(dot.dataset.index);
    dot.classList.toggle('active', index === currentEventIndex);
  });
}

// ===== Display Updates =====
function updateDisplay() {
  if (!timeline || currentEventIndex >= timeline.events.length) {
    renderer.setState({
      location: null,
      speaker: null,
      subtitle: 'End of episode',
      isSubtitleEmpty: true,
    });
    return;
  }

  const event = timeline.events[currentEventIndex];

  // Find current location (scan backwards)
  let currentLocation = null;
  for (let i = currentEventIndex; i >= 0; i--) {
    if (timeline.events[i].type === 'location') {
      currentLocation = timeline.events[i].location;
      break;
    }
  }

  // Update renderer based on event type
  switch (event.type) {
    case 'text':
      renderer.setState({
        location: currentLocation,
        speaker: event.character,
        speakerState: event.state,
        subtitle: event.text,
        isSubtitleEmpty: false,
      });
      updateDebugBar(currentLocation, event.character, event.state);
      break;
    case 'pause':
      renderer.setState({
        location: currentLocation,
        speaker: event.character || null,
        subtitle: '...',
        isSubtitleEmpty: false,
      });
      updateDebugBar(currentLocation, event.character, null);
      break;
    case 'location':
      renderer.setState({
        location: currentLocation,
        speaker: null,
        subtitle: null,
        isSubtitleEmpty: true,
      });
      updateDebugBar(currentLocation, null, null);
      break;
    default:
      renderer.setState({
        location: currentLocation,
        speaker: null,
        subtitle: '',
        isSubtitleEmpty: true,
      });
      updateDebugBar(currentLocation, null, null);
  }
}

function updateProgress(currentTime = null) {
  if (!timeline) {
    progressFill.style.width = '0%';
    timeDisplay.textContent = '0:00 / 0:00';
    eventDisplay.textContent = '— / —';
    return;
  }

  // Use provided time or event start time
  const event = timeline.events[currentEventIndex];
  const time = currentTime !== null ? currentTime : (event ? event.startTime : 0);
  const progress = (time / timeline.totalDuration) * 100;
  progressFill.style.width = `${Math.min(100, progress)}%`;

  timeDisplay.textContent = `${formatTime(time)} / ${formatTime(timeline.totalDuration)}`;
  eventDisplay.textContent = `${currentEventIndex + 1} / ${timeline.events.length}`;
}

function formatTime(ms) {
  const seconds = Math.floor(ms / 1000);
  const minutes = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${minutes}:${secs.toString().padStart(2, '0')}`;
}

// ===== Smooth Progress Animation =====
function startProgressAnimation(eventStartTime, eventDuration) {
  playbackStartTime = performance.now();
  playbackStartOffset = eventStartTime;
  
  function animate() {
    if (!isPlaying || stopRequested) {
      cancelAnimationFrame(animationFrameId);
      return;
    }
    
    const elapsed = performance.now() - playbackStartTime;
    const currentTime = playbackStartOffset + elapsed;
    updateProgress(currentTime);
    
    if (elapsed < eventDuration) {
      animationFrameId = requestAnimationFrame(animate);
    }
  }
  
  animationFrameId = requestAnimationFrame(animate);
}

function stopProgressAnimation() {
  if (animationFrameId) {
    cancelAnimationFrame(animationFrameId);
    animationFrameId = null;
  }
}

// ===== Playback =====
async function play() {
  if (!timeline || timeline.events.length === 0) return;
  if (isPlaying) return;

  isPlaying = true;
  stopRequested = false;
  playBtn.innerHTML = PAUSE_ICON;
  
  // Start overlay hide timer
  overlayTimeout = setTimeout(hideOverlay, OVERLAY_HIDE_DELAY);

  for (let i = currentEventIndex; i < timeline.events.length; i++) {
    if (stopRequested) break;

    currentEventIndex = i;
    const event = timeline.events[i];

    // Wait for any gap before this event (e.g., speaker change gap)
    if (i > 0) {
      const prevEvent = timeline.events[i - 1];
      const gap = event.startTime - prevEvent.endTime;
      if (gap > 0) {
        await sleep(gap);
        if (stopRequested) break;
      }
    }

    updateDisplay();
    updateDotStates();

    // Start smooth progress animation
    if (event.duration > 0) {
      startProgressAnimation(event.startTime, event.duration);
    } else {
      updateProgress(event.startTime);
    }

    // Handle event
    if (event.type === 'text' && event.audioPath) {
      try {
        await audioManager.play(event.audioPath, event.audioStart, event.audioDuration);
      } catch (e) {
        console.error('Audio error:', e);
        await sleep(event.duration);
      }
    } else if (event.duration > 0) {
      await sleep(event.duration);
    }
    
    stopProgressAnimation();
  }

  isPlaying = false;
  playBtn.innerHTML = PLAY_ICON;
  stopProgressAnimation();
  showOverlay(); // Show overlay when stopped
  
  if (!stopRequested) {
    // Finished - reset to start
    currentEventIndex = 0;
    updateDisplay();
    updateProgress();
    updateDotStates();
  }
}

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

// ===== Init =====
document.addEventListener('DOMContentLoaded', init);
