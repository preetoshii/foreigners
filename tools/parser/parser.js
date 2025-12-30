// ============================================
// Regex Patterns
// ============================================

const COMMENT = /^#/;
const SEED = /^seed:\s*(\d+)$/;
const LOCATION = /^@([\w-]+)$/;
const DIALOGUE = /^(\w+):\s*(.*)$/;

// ============================================
// Tag Parsing
// ============================================

function categorizeTag(content) {
  // Silent beat / pause
  if (content === '...') {
    return { type: 'pause' };
  }

  // Keyed tag like "shot: ots"
  const keyedMatch = content.match(/^(\w+):\s*(.+)$/);
  if (keyedMatch) {
    const [, key, value] = keyedMatch;
    if (key === 'shot') {
      return { type: 'shot', value };
    }
    // Future: camera, sfx, etc.
    return { type: 'unknown', value: content };
  }

  // Plain word = state
  return { type: 'state', value: content };
}

// ============================================
// Dialogue Line Parsing
// ============================================

function parseDialogueLine(character, text, currentState) {
  const events = [];
  let state = currentState;

  // Split by [...] tags, capturing the content
  // "Hey [happy] there [shot: single] friend" 
  // → ["Hey ", "happy", " there ", "shot: single", " friend"]
  const parts = text.split(/\[([^\]]+)\]/);

  for (let i = 0; i < parts.length; i++) {
    if (i % 2 === 1) {
      // Odd indices are tag contents
      const tag = categorizeTag(parts[i]);
      
      switch (tag.type) {
        case 'state':
          state = tag.value;
          break;
        case 'shot':
          events.push({ type: 'shot', shot: tag.value });
          break;
        case 'pause':
          events.push({ type: 'pause', character, state });
          break;
        // unknown tags are ignored for now
      }
    } else {
      // Even indices are text
      const content = parts[i].trim();
      if (content) {
        events.push({ type: 'text', character, state, text: content });
      }
    }
  }

  return { events, lastState: state };
}

// ============================================
// Main Parser
// ============================================

function parse(input) {
  const lines = input.split('\n');
  const events = [];
  
  // Track state per character (sticky)
  const characterStates = {};
  
  let seed = null;

  for (const line of lines) {
    const trimmed = line.trim();
    
    // Skip empty lines and comments
    if (!trimmed || COMMENT.test(trimmed)) {
      continue;
    }

    // Seed
    const seedMatch = trimmed.match(SEED);
    if (seedMatch) {
      seed = parseInt(seedMatch[1], 10);
      continue;
    }

    // Location
    const locationMatch = trimmed.match(LOCATION);
    if (locationMatch) {
      events.push({ type: 'location', location: locationMatch[1] });
      continue;
    }

    // Dialogue
    const dialogueMatch = trimmed.match(DIALOGUE);
    if (dialogueMatch) {
      const [, character, text] = dialogueMatch;
      const currentState = characterStates[character] || 'neutral';
      
      const { events: lineEvents, lastState } = parseDialogueLine(
        character,
        text,
        currentState
      );
      
      // Update sticky state for this character
      characterStates[character] = lastState;
      
      // Add all events from this line
      events.push(...lineEvents);
      continue;
    }

    // Unknown line - skip for now
  }

  return { seed, events };
}

