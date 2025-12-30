/**
 * Seeded Random Number Generator
 * 
 * Uses a simple mulberry32 algorithm for deterministic random numbers.
 * Given the same seed, produces the same sequence every time.
 */

export function createRandom(seed) {
  // mulberry32 algorithm
  let state = seed;

  function next() {
    state |= 0;
    state = (state + 0x6d2b79f5) | 0;
    let t = Math.imul(state ^ (state >>> 15), 1 | state);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  }

  return {
    /** Returns a random float between 0 (inclusive) and 1 (exclusive) */
    random: next,

    /** Returns a random float between min (inclusive) and max (exclusive) */
    range(min, max) {
      return min + next() * (max - min);
    },

    /** Returns a random integer between min (inclusive) and max (inclusive) */
    int(min, max) {
      return Math.floor(min + next() * (max - min + 1));
    },

    /** Returns a random element from an array */
    pick(array) {
      if (array.length === 0) return undefined;
      return array[Math.floor(next() * array.length)];
    }
  };
}

