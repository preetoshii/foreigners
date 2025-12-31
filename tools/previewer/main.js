/**
 * Foreigners Previewer
 * 
 * Minimal, preview-focused playback of FSL episodes.
 */

import { parse } from '../parser/parser.js';
import { createAudioManager } from './audio.js';
import { generateTimeline } from './timeline.js';
import { createRenderer } from './renderer.js';
import { config } from './config.js';

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
const fullscreenBtn = document.getElementById('fullscreen-btn');
const progressFill = document.getElementById('progress-fill');
const progressDots = document.getElementById('progress-dots');
const progressTrack = document.getElementById('progress-track');
const timeDisplay = document.getElementById('time-display');
const eventDisplay = document.getElementById('event-display');
const drawerToggle = document.getElementById('drawer-toggle');
const drawer = document.getElementById('drawer');
const drawerHandle = document.getElementById('drawer-handle');
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

// Debug waveform
const debugWaveform = document.getElementById('debug-waveform');
const debugWaveformCanvas = document.getElementById('debug-waveform-canvas');
const debugWaveformPlayhead = document.getElementById('debug-waveform-playhead');
const debugEnergyCount = document.getElementById('debug-energy-count');
const debugAudioStart = document.getElementById('debug-audio-start');
const debugAudioEnd = document.getElementById('debug-audio-end');
const debugAudioDuration = document.getElementById('debug-audio-duration');
const debugFadeDuration = document.getElementById('debug-fade-duration');
const waveformCtx = debugWaveformCanvas.getContext('2d');

// Waveform playhead state
let waveformAudioInfo = null;
let waveformPlayheadAnimId = null;

// Overlay visibility
let overlayTimeout = null;
const OVERLAY_HIDE_DELAY = 400; // Quick fade after play starts

// LocalStorage keys for persistence
const STORAGE_EPISODE = 'foreigners_lastEpisode';
const STORAGE_EVENT = 'foreigners_lastEvent';
const STORAGE_PREVIEW_WIDTH = 'foreigners_previewWidth';

// ===== Initialize =====
async function init() {
  // Restore saved preview size
  restorePreviewSize();
  
  // Initialize renderer
  renderer = createRenderer(previewCanvas);
  resizeCanvas();
  window.addEventListener('resize', resizeCanvas);
  
  // Show initial state
  renderer.setState({
    subtitle: 'Select an episode to begin',
    isSubtitleEmpty: true,
  });

  // Load manifest (cache-bust to pick up asset changes)
  try {
    const response = await fetch(`../../assets/manifest.json?t=${Date.now()}`);
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
  drawerHandle.addEventListener('mousedown', startResize);
  debugToggle.addEventListener('click', toggleDebug);
  fullscreenBtn.addEventListener('click', toggleFullscreen);
  
  // Preview resize handles
  document.querySelectorAll('.resize-handle').forEach(handle => {
    handle.addEventListener('mousedown', startPreviewResize);
  });
  
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
    // Fetch the episode file (cache-bust to pick up script changes)
    const response = await fetch(`../../episodes/${filename}?t=${Date.now()}`);
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
    audioManager.stop();  // Stop current audio and resolve pending Promise
    audioManager.pause(); // Suspend audio context
    stopWaveformPlayhead();
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
  
  // Update debug waveform if visible
  if (debugWaveform.classList.contains('visible') && timeline) {
    const event = timeline.events[index];
    if (event && event.type === 'text' && event.audioPath) {
      drawDebugWaveform(event.audioPath, event.audioStart, event.audioDuration);
    } else {
      clearDebugWaveform();
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
    case 'ArrowUp':
    case 'ArrowDown':
      e.preventDefault();
      toggleDrawer();
      break;
    case 'Backslash':
    case 'Slash':
      toggleDebug();
      break;
    case 'KeyF':
      toggleFullscreen();
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
  debugWaveform.classList.toggle('visible');
  
  // Draw current event's waveform when toggled on
  if (debugWaveform.classList.contains('visible') && timeline) {
    const event = timeline.events[currentEventIndex];
    if (event && event.type === 'text' && event.audioPath) {
      drawDebugWaveform(event.audioPath, event.audioStart, event.audioDuration);
    } else {
      clearDebugWaveform();
    }
  }
}

function toggleFullscreen() {
  if (document.fullscreenElement || document.webkitFullscreenElement) {
    // Exit fullscreen
    if (document.exitFullscreen) {
      document.exitFullscreen();
    } else if (document.webkitExitFullscreen) {
      document.webkitExitFullscreen();
    }
  } else {
    // Enter fullscreen
    if (previewContainer.requestFullscreen) {
      previewContainer.requestFullscreen();
    } else if (previewContainer.webkitRequestFullscreen) {
      previewContainer.webkitRequestFullscreen();
    }
  }
}

// ===== Drawer Resize =====
let isResizing = false;
let startY = 0;
let startHeight = 0;

function startResize(e) {
  isResizing = true;
  startY = e.clientY;
  startHeight = drawer.offsetHeight;
  drawer.classList.add('dragging');
  document.addEventListener('mousemove', resize);
  document.addEventListener('mouseup', stopResize);
  e.preventDefault();
}

function resize(e) {
  if (!isResizing) return;
  const delta = startY - e.clientY;
  const newHeight = Math.min(Math.max(150, startHeight + delta), window.innerHeight - 100);
  drawer.style.height = newHeight + 'px';
}

function stopResize() {
  isResizing = false;
  drawer.classList.remove('dragging');
  document.removeEventListener('mousemove', resize);
  document.removeEventListener('mouseup', stopResize);
}

// ===== Preview Resize =====
let isPreviewResizing = false;
let previewStartX = 0;
let previewStartWidth = 0;
let previewCorner = null;

function startPreviewResize(e) {
  isPreviewResizing = true;
  previewCorner = e.target.dataset.corner;
  previewStartX = e.clientX;
  previewStartWidth = previewContainer.offsetWidth;
  document.addEventListener('mousemove', resizePreview);
  document.addEventListener('mouseup', stopPreviewResize);
  e.preventDefault();
  e.stopPropagation();
}

function resizePreview(e) {
  if (!isPreviewResizing) return;
  
  // Calculate delta based on which corner is being dragged
  let deltaX = e.clientX - previewStartX;
  
  // For left corners, invert the delta
  if (previewCorner === 'nw' || previewCorner === 'sw') {
    deltaX = -deltaX;
  }
  
  // Double the delta since we're resizing from center (both sides move)
  const newWidth = Math.min(Math.max(400, previewStartWidth + deltaX * 2), window.innerWidth - 64);
  
  previewContainer.style.width = newWidth + 'px';
  resizeCanvas();
}

function stopPreviewResize() {
  if (isPreviewResizing) {
    // Save the width
    localStorage.setItem(STORAGE_PREVIEW_WIDTH, previewContainer.offsetWidth);
  }
  isPreviewResizing = false;
  previewCorner = null;
  document.removeEventListener('mousemove', resizePreview);
  document.removeEventListener('mouseup', stopPreviewResize);
}

function restorePreviewSize() {
  const savedWidth = localStorage.getItem(STORAGE_PREVIEW_WIDTH);
  if (savedWidth) {
    const width = parseInt(savedWidth, 10);
    if (width >= 400 && width <= window.innerWidth - 64) {
      previewContainer.style.width = width + 'px';
    }
  }
}

function updateDebugBar(location, character, state) {
  debugLocation.textContent = location || '—';
  debugCharacter.textContent = character || '—';
  debugState.textContent = state || '—';
}

/**
 * Draw waveform visualization for debug panel.
 * Shows: waveform, low-energy markers, play region.
 */
function drawDebugWaveform(audioPath, startTime, duration) {
  const buffer = audioManager.getBuffer(audioPath);
  if (!buffer) {
    clearDebugWaveform();
    return;
  }
  
  const lowPoints = audioManager.getLowEnergyPoints(audioPath);
  const totalDuration = buffer.duration;
  const samples = buffer.getChannelData(0);
  const sampleRate = buffer.sampleRate;
  
  // Calculate zoomed view range (play segment + 20% padding on each side)
  const padding = duration * 0.2;
  const viewStart = Math.max(0, startTime - padding);
  const viewEnd = Math.min(totalDuration, startTime + duration + padding);
  const viewDuration = viewEnd - viewStart;
  
  // Store info for playhead animation
  stopWaveformPlayhead();
  waveformAudioInfo = {
    totalDuration,
    startTime,
    audioDuration: duration,
    viewStart,
    viewDuration,
    startedAt: null
  };
  
  // Update stats
  debugEnergyCount.textContent = lowPoints.length;
  debugAudioStart.textContent = startTime.toFixed(3) + 's';
  debugAudioEnd.textContent = (startTime + duration).toFixed(3) + 's';
  debugAudioDuration.textContent = duration.toFixed(3) + 's';
  debugFadeDuration.textContent = config.audioFadeMs + 'ms';
  
  // Set canvas size for HiDPI
  const rect = debugWaveformCanvas.getBoundingClientRect();
  const dpr = window.devicePixelRatio || 1;
  debugWaveformCanvas.width = rect.width * dpr;
  debugWaveformCanvas.height = rect.height * dpr;
  waveformCtx.scale(dpr, dpr);
  
  const width = rect.width;
  const height = rect.height;
  const midY = height / 2;
  
  // Helper: convert time to X position in zoomed view
  const timeToX = (t) => ((t - viewStart) / viewDuration) * width;
  
  // Clear canvas
  waveformCtx.fillStyle = '#0a0a0a';
  waveformCtx.fillRect(0, 0, width, height);
  
  // Draw play region background
  const regionStartX = timeToX(startTime);
  const regionEndX = timeToX(startTime + duration);
  waveformCtx.fillStyle = 'rgba(59, 130, 246, 0.15)';
  waveformCtx.fillRect(regionStartX, 0, regionEndX - regionStartX, height);
  
  // Draw fade regions
  const fadeDuration = config.audioFadeMs / 1000;
  const fadeWidthPx = (fadeDuration / viewDuration) * width;
  
  waveformCtx.fillStyle = 'rgba(251, 191, 36, 0.4)';
  // Fade-in region
  waveformCtx.fillRect(regionStartX, 0, fadeWidthPx, height);
  // Fade-out region
  waveformCtx.fillRect(regionEndX - fadeWidthPx, 0, fadeWidthPx, height);
  
  // Draw waveform (only the visible portion)
  const viewStartSample = Math.floor(viewStart * sampleRate);
  const viewEndSample = Math.floor(viewEnd * sampleRate);
  const viewSamples = viewEndSample - viewStartSample;
  const samplesPerPixel = Math.max(1, Math.floor(viewSamples / width));
  
  waveformCtx.strokeStyle = '#888';
  waveformCtx.lineWidth = 1;
  waveformCtx.beginPath();
  
  for (let x = 0; x < width; x++) {
    const sampleIndex = viewStartSample + Math.floor((x / width) * viewSamples);
    
    // Find min/max in this pixel's sample range
    let min = 0, max = 0;
    for (let i = 0; i < samplesPerPixel && sampleIndex + i < samples.length; i++) {
      const sample = samples[sampleIndex + i];
      if (sample < min) min = sample;
      if (sample > max) max = sample;
    }
    
    const yMin = midY + min * midY * 0.9;
    const yMax = midY + max * midY * 0.9;
    
    waveformCtx.moveTo(x, yMin);
    waveformCtx.lineTo(x, yMax);
  }
  waveformCtx.stroke();
  
  // Draw low-energy markers (only those in visible range)
  waveformCtx.fillStyle = '#4ade80';
  for (const point of lowPoints) {
    if (point >= viewStart && point <= viewEnd) {
      const x = timeToX(point);
      waveformCtx.fillRect(x - 0.5, 0, 1, height);
    }
  }
  
  // Draw start marker
  waveformCtx.strokeStyle = '#3b82f6';
  waveformCtx.lineWidth = 2;
  waveformCtx.beginPath();
  waveformCtx.moveTo(regionStartX, 0);
  waveformCtx.lineTo(regionStartX, height);
  waveformCtx.stroke();
  
  // Draw end marker
  waveformCtx.strokeStyle = '#ef4444';
  waveformCtx.beginPath();
  waveformCtx.moveTo(regionEndX, 0);
  waveformCtx.lineTo(regionEndX, height);
  waveformCtx.stroke();
  
  // Reset scale
  waveformCtx.setTransform(1, 0, 0, 1, 0, 0);
}

function clearDebugWaveform() {
  debugEnergyCount.textContent = '—';
  debugAudioStart.textContent = '—';
  debugAudioEnd.textContent = '—';
  debugAudioDuration.textContent = '—';
  debugFadeDuration.textContent = '—';
  
  stopWaveformPlayhead();
  waveformAudioInfo = null;
  
  const rect = debugWaveformCanvas.getBoundingClientRect();
  const dpr = window.devicePixelRatio || 1;
  debugWaveformCanvas.width = rect.width * dpr;
  debugWaveformCanvas.height = rect.height * dpr;
  waveformCtx.scale(dpr, dpr);
  waveformCtx.fillStyle = '#0a0a0a';
  waveformCtx.fillRect(0, 0, rect.width, rect.height);
  waveformCtx.setTransform(1, 0, 0, 1, 0, 0);
}

function startWaveformPlayhead() {
  if (!waveformAudioInfo) return;
  
  waveformAudioInfo.startedAt = audioManager.context.currentTime;
  debugWaveformPlayhead.classList.add('visible');
  
  function updatePlayhead() {
    if (!waveformAudioInfo) {
      stopWaveformPlayhead();
      return;
    }
    
    const elapsed = audioManager.context.currentTime - waveformAudioInfo.startedAt;
    const currentPos = waveformAudioInfo.startTime + elapsed;
    
    // Position playhead relative to zoomed view
    const { viewStart, viewDuration } = waveformAudioInfo;
    const progress = (currentPos - viewStart) / viewDuration;
    debugWaveformPlayhead.style.left = `${progress * 100}%`;
    
    // Stop if we've passed the end
    if (elapsed >= waveformAudioInfo.audioDuration) {
      stopWaveformPlayhead();
      return;
    }
    
    waveformPlayheadAnimId = requestAnimationFrame(updatePlayhead);
  }
  
  updatePlayhead();
}

function stopWaveformPlayhead() {
  if (waveformPlayheadAnimId) {
    cancelAnimationFrame(waveformPlayheadAnimId);
    waveformPlayheadAnimId = null;
  }
  debugWaveformPlayhead.classList.remove('visible');
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
      // Draw debug waveform if debug panel is visible
      if (debugWaveform.classList.contains('visible')) {
        drawDebugWaveform(event.audioPath, event.audioStart, event.audioDuration);
        startWaveformPlayhead();
      }
      try {
        await audioManager.play(event.audioPath, event.audioStart, event.audioDuration);
      } catch (e) {
        console.error('Audio error:', e);
        await sleep(event.duration);
      }
      stopWaveformPlayhead();
    } else if (event.duration > 0) {
      // Clear waveform for non-audio events
      if (debugWaveform.classList.contains('visible')) {
        clearDebugWaveform();
      }
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
