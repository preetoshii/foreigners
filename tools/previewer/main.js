/**
 * Foreigners Previewer
 * 
 * Minimal, preview-focused playback of FSL episodes.
 */

import { parse } from '../parser/parser.js';
import { createAudioManager } from './audio.js';
import { generateTimeline } from './timeline.js';

// ===== State =====
let manifest = null;
let audioManager = null;
let timeline = null;
let currentEventIndex = 0;
let isPlaying = false;
let stopRequested = false;
let currentScript = '';

// ===== DOM Elements =====
const episodeSelect = document.getElementById('episode-select');
const loadBtn = document.getElementById('load-btn');
const playBtn = document.getElementById('play-btn');
const prevBtn = document.getElementById('prev-btn');
const nextBtn = document.getElementById('next-btn');
const locationDisplay = document.getElementById('location');
const speakerDisplay = document.getElementById('speaker');
const subtitleDisplay = document.getElementById('subtitle');
const progressFill = document.getElementById('progress-fill');
const timeDisplay = document.getElementById('time-display');
const eventDisplay = document.getElementById('event-display');
const drawerToggle = document.getElementById('drawer-toggle');
const drawer = document.getElementById('drawer');
const drawerClose = document.getElementById('drawer-close');
const drawerTabs = document.querySelectorAll('.drawer-tabs button');
const scriptContent = document.getElementById('script-content');
const timelineContent = document.getElementById('timeline-content');

// ===== Initialize =====
async function init() {
  // Load manifest
  try {
    const response = await fetch('../../assets/manifest.json');
    manifest = await response.json();
  } catch (e) {
    console.error('Failed to load manifest:', e);
    subtitleDisplay.textContent = 'Error loading assets';
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
  drawerToggle.addEventListener('click', toggleDrawer);
  drawerClose.addEventListener('click', () => drawer.classList.remove('open'));
  
  drawerTabs.forEach(tab => {
    tab.addEventListener('click', () => switchTab(tab.dataset.tab));
  });

  // Keyboard shortcuts
  document.addEventListener('keydown', handleKeydown);
}

// ===== Episode List =====
async function loadEpisodeList() {
  try {
    // Fetch the episodes directory listing
    // Since we can't list directories from browser, we'll use a manifest approach
    // For now, try to load known episodes
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

  subtitleDisplay.textContent = 'Loading...';
  subtitleDisplay.classList.add('empty');

  try {
    // Fetch the episode file
    const response = await fetch(`../../episodes/${filename}`);
    if (!response.ok) throw new Error('Episode not found');
    
    currentScript = await response.text();
    scriptContent.value = currentScript;

    // Parse the script
    const parsed = parse(currentScript);
    
    if (parsed.events.length === 0) {
      subtitleDisplay.textContent = 'No events in script';
      return;
    }

    // Generate timeline
    timeline = await generateTimeline(parsed, manifest, audioManager);
    currentEventIndex = 0;

    // Update timeline display
    timelineContent.textContent = JSON.stringify(timeline, null, 2);

    // Enable controls
    playBtn.disabled = false;
    prevBtn.disabled = false;
    nextBtn.disabled = false;

    // Show first event
    updateDisplay();
    updateProgress();

    subtitleDisplay.classList.remove('empty');

  } catch (e) {
    console.error('Failed to load episode:', e);
    subtitleDisplay.textContent = 'Error: ' + e.message;
  }
}

const PLAY_ICON = '<svg viewBox="0 0 24 24"><path d="M8 5v14l11-7z"/></svg>';
const PAUSE_ICON = '<svg viewBox="0 0 24 24"><path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z"/></svg>';

function handlePlayPause() {
  if (isPlaying) {
    stopRequested = true;
    playBtn.innerHTML = PLAY_ICON;
  } else {
    play();
  }
}

function handlePrev() {
  if (!timeline) return;
  
  // Find previous text event
  for (let i = currentEventIndex - 1; i >= 0; i--) {
    if (timeline.events[i].type === 'text') {
      currentEventIndex = i;
      updateDisplay();
      updateProgress();
      break;
    }
  }
}

function handleNext() {
  if (!timeline) return;
  
  // Find next text event
  for (let i = currentEventIndex + 1; i < timeline.events.length; i++) {
    if (timeline.events[i].type === 'text') {
      currentEventIndex = i;
      updateDisplay();
      updateProgress();
      break;
    }
  }
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

function switchTab(tab) {
  drawerTabs.forEach(t => t.classList.toggle('active', t.dataset.tab === tab));
  scriptContent.style.display = tab === 'script' ? 'block' : 'none';
  timelineContent.style.display = tab === 'timeline' ? 'block' : 'none';
}

// ===== Display Updates =====
function updateDisplay() {
  if (!timeline || currentEventIndex >= timeline.events.length) {
    locationDisplay.textContent = '—';
    speakerDisplay.textContent = '';
    subtitleDisplay.textContent = 'End of episode';
    subtitleDisplay.classList.add('empty');
    return;
  }

  const event = timeline.events[currentEventIndex];

  // Find current location (scan backwards)
  let currentLocation = '—';
  for (let i = currentEventIndex; i >= 0; i--) {
    if (timeline.events[i].type === 'location') {
      currentLocation = timeline.events[i].location;
      break;
    }
  }
  locationDisplay.textContent = currentLocation;

  // Update based on event type
  switch (event.type) {
    case 'text':
      speakerDisplay.textContent = event.character;
      subtitleDisplay.textContent = event.text;
      subtitleDisplay.classList.remove('empty');
      break;
    case 'pause':
      speakerDisplay.textContent = event.character || '';
      subtitleDisplay.textContent = '...';
      subtitleDisplay.classList.remove('empty');
      break;
    case 'location':
      speakerDisplay.textContent = '';
      subtitleDisplay.textContent = '📍 ' + event.location;
      subtitleDisplay.classList.add('empty');
      break;
    default:
      speakerDisplay.textContent = '';
      subtitleDisplay.textContent = '';
  }
}

function updateProgress() {
  if (!timeline) {
    progressFill.style.width = '0%';
    timeDisplay.textContent = '0:00 / 0:00';
    eventDisplay.textContent = '— / —';
    return;
  }

  const event = timeline.events[currentEventIndex];
  const progress = event ? (event.startTime / timeline.totalDuration) * 100 : 0;
  progressFill.style.width = `${progress}%`;

  const currentTime = event ? event.startTime : 0;
  timeDisplay.textContent = `${formatTime(currentTime)} / ${formatTime(timeline.totalDuration)}`;
  eventDisplay.textContent = `${currentEventIndex + 1} / ${timeline.events.length}`;
}

function formatTime(ms) {
  const seconds = Math.floor(ms / 1000);
  const minutes = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${minutes}:${secs.toString().padStart(2, '0')}`;
}

// ===== Playback =====
async function play() {
  if (!timeline || timeline.events.length === 0) return;
  if (isPlaying) return;

  isPlaying = true;
  stopRequested = false;
  playBtn.innerHTML = PAUSE_ICON;

  for (let i = currentEventIndex; i < timeline.events.length; i++) {
    if (stopRequested) break;

    currentEventIndex = i;
    const event = timeline.events[i];

    updateDisplay();
    updateProgress();

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
  }

  isPlaying = false;
  playBtn.innerHTML = PLAY_ICON;
  
  if (!stopRequested) {
    // Finished - reset to start
    currentEventIndex = 0;
    updateDisplay();
    updateProgress();
  }
}

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

// ===== Init =====
document.addEventListener('DOMContentLoaded', init);
