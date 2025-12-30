/**
 * Canvas Renderer
 * 
 * Handles all visual rendering on the preview canvas.
 * Layers (drawn in order):
 *   0. Background - location visuals
 *   1. Characters - character video/images
 *   2. Subtitles  - speaker name + dialogue text
 *   3. Effects    - post-processing, transitions
 */

export function createRenderer(canvas) {
  const ctx = canvas.getContext('2d');
  
  // State
  let width = canvas.width;
  let height = canvas.height;
  
  // Current frame data
  let currentState = {
    location: null,
    speaker: null,
    speakerState: null,
    subtitle: null,
    isSubtitleEmpty: false,
  };

  /**
   * Resize canvas (call when container size changes)
   */
  function resize(w, h) {
    // Use device pixel ratio for crisp rendering
    const dpr = window.devicePixelRatio || 1;
    canvas.width = w * dpr;
    canvas.height = h * dpr;
    canvas.style.width = `${w}px`;
    canvas.style.height = `${h}px`;
    ctx.scale(dpr, dpr);
    width = w;
    height = h;
    render();
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
    ctx.fillStyle = '#0a0a0a';
    ctx.fillRect(0, 0, width, height);
    
    // Location badge (top-left)
    if (currentState.location) {
      ctx.save();
      
      // Badge background
      ctx.fillStyle = 'rgba(0, 0, 0, 0.6)';
      const badgeText = currentState.location.toUpperCase();
      ctx.font = '600 12px "Instrument Sans", system-ui, sans-serif';
      const metrics = ctx.measureText(badgeText);
      const badgePadX = 12;
      const badgePadY = 8;
      const badgeX = 24;
      const badgeY = 24;
      
      roundRect(ctx, badgeX, badgeY, metrics.width + badgePadX * 2, 28, 4);
      ctx.fill();
      
      // Badge text
      ctx.fillStyle = '#666';
      ctx.textBaseline = 'middle';
      ctx.fillText(badgeText, badgeX + badgePadX, badgeY + 14);
      
      ctx.restore();
    }
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
    
    // Speaker name (above subtitle)
    if (currentState.speaker && !currentState.isSubtitleEmpty) {
      ctx.font = '400 14px "Instrument Sans", system-ui, sans-serif';
      ctx.fillStyle = '#666';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'bottom';
      ctx.letterSpacing = '0.5px';
      ctx.fillText(currentState.speaker.toUpperCase(), centerX, centerY - 20);
    }
    
    // Subtitle text
    ctx.font = currentState.isSubtitleEmpty 
      ? '400 16px "Instrument Sans", system-ui, sans-serif'
      : '600 32px "Instrument Sans", system-ui, sans-serif';
    ctx.fillStyle = currentState.isSubtitleEmpty ? '#666' : '#fff';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    
    // Text shadow for readability
    if (!currentState.isSubtitleEmpty) {
      ctx.shadowColor = 'rgba(0, 0, 0, 0.8)';
      ctx.shadowBlur = 20;
      ctx.shadowOffsetY = 2;
    }
    
    // Word wrap for long subtitles
    const maxWidth = width * 0.8;
    const lines = wrapText(currentState.subtitle, maxWidth);
    const lineHeight = currentState.isSubtitleEmpty ? 24 : 44;
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
  
  function roundRect(ctx, x, y, w, h, r) {
    ctx.beginPath();
    ctx.moveTo(x + r, y);
    ctx.lineTo(x + w - r, y);
    ctx.quadraticCurveTo(x + w, y, x + w, y + r);
    ctx.lineTo(x + w, y + h - r);
    ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
    ctx.lineTo(x + r, y + h);
    ctx.quadraticCurveTo(x, y + h, x, y + h - r);
    ctx.lineTo(x, y + r);
    ctx.quadraticCurveTo(x, y, x + r, y);
    ctx.closePath();
  }

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

