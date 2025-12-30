/**
 * Canvas Renderer
 * 
 * Handles all visual rendering on the preview canvas.
 * Renders at a fixed internal resolution (1920x1080) and lets CSS scale.
 * This makes the canvas behave like a video - everything scales proportionally.
 * 
 * Layers (drawn in order):
 *   0. Background - location visuals
 *   1. Characters - character video/images
 *   2. Subtitles  - speaker name + dialogue text
 *   3. Effects    - post-processing, transitions
 */

// Fixed internal resolution (like a video)
const BASE_WIDTH = 1920;
const BASE_HEIGHT = 1080;

export function createRenderer(canvas) {
  const ctx = canvas.getContext('2d');
  
  // Set fixed internal resolution once
  canvas.width = BASE_WIDTH;
  canvas.height = BASE_HEIGHT;
  
  // Use fixed dimensions for all rendering
  const width = BASE_WIDTH;
  const height = BASE_HEIGHT;
  
  // Current frame data
  let currentState = {
    location: null,
    speaker: null,
    speakerState: null,
    subtitle: null,
    isSubtitleEmpty: false,
  };

  /**
   * Resize is now just CSS - internal resolution stays fixed
   */
  function resize(w, h) {
    // Canvas internal size is fixed, CSS handles scaling
    canvas.style.width = `${w}px`;
    canvas.style.height = `${h}px`;
    // No need to re-render - content stays the same
  }

  /**
   * Update the current state and re-render
   */
  function setState(newState) {
    currentState = { ...currentState, ...newState };
    render();
  }

  /**
   * Main render function - draws all layers
   */
  function render() {
    ctx.clearRect(0, 0, width, height);
    
    drawBackground();
    drawCharacters();
    drawSubtitles();
    drawEffects();
  }

  // ===== Layer 0: Background =====
  function drawBackground() {
    // For now, solid dark background
    // In the future, this will show location visuals
    ctx.fillStyle = '#0a0a0a';
    ctx.fillRect(0, 0, width, height);
  }

  // ===== Layer 1: Characters =====
  function drawCharacters() {
    // Placeholder - will draw character video frames here
    // For now, nothing to draw
  }

  // ===== Layer 2: Subtitles =====
  function drawSubtitles() {
    if (!currentState.subtitle) return;
    
    ctx.save();
    
    const centerX = width / 2;
    const centerY = height / 2;
    
    // Font sizes for 1080p - will scale with canvas
    const fontSize = currentState.isSubtitleEmpty ? 36 : 72;
    const lineHeight = currentState.isSubtitleEmpty ? 48 : 96;
    
    // Subtitle text only (no speaker name - we'll see the actual character)
    ctx.font = currentState.isSubtitleEmpty 
      ? `400 ${fontSize}px "Instrument Sans", system-ui, sans-serif`
      : `600 ${fontSize}px "Instrument Sans", system-ui, sans-serif`;
    ctx.fillStyle = currentState.isSubtitleEmpty ? '#666' : '#fff';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    
    // Text shadow for readability
    if (!currentState.isSubtitleEmpty) {
      ctx.shadowColor = 'rgba(0, 0, 0, 0.8)';
      ctx.shadowBlur = 40;
      ctx.shadowOffsetY = 4;
    }
    
    // Word wrap for long subtitles
    const maxWidth = width * 0.8;
    const lines = wrapText(currentState.subtitle, maxWidth);
    const totalHeight = lines.length * lineHeight;
    const startY = centerY - totalHeight / 2 + lineHeight / 2;
    
    lines.forEach((line, i) => {
      ctx.fillText(line, centerX, startY + i * lineHeight);
    });
    
    ctx.restore();
  }

  // ===== Layer 3: Effects =====
  function drawEffects() {
    // Placeholder - will draw transitions, filters, etc.
    // For now, nothing to draw
  }

  // ===== Helpers =====
  
  function wrapText(text, maxWidth) {
    const words = text.split(' ');
    const lines = [];
    let currentLine = '';
    
    for (const word of words) {
      const testLine = currentLine ? `${currentLine} ${word}` : word;
      const metrics = ctx.measureText(testLine);
      
      if (metrics.width > maxWidth && currentLine) {
        lines.push(currentLine);
        currentLine = word;
      } else {
        currentLine = testLine;
      }
    }
    
    if (currentLine) {
      lines.push(currentLine);
    }
    
    return lines.length ? lines : [text];
  }

  // Return public API
  return {
    resize,
    setState,
    render,
    get canvas() { return canvas; },
    get context() { return ctx; },
  };
}

