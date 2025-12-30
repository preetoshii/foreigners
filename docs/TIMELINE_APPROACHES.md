# Timeline Approaches: On-the-Fly vs Pre-Computed

> A decision document for how the previewer should handle event timing.

---

## The Problem

We have:
- **Parsed JSON events** from the parser (location, text, pause, etc.)
- **Audio files** for each character/state
- **A goal:** Play through events with audio, synced to text length

**The question:** How do we determine timing for each event?

Each `text` event needs a **duration** (estimated from word count). That duration determines:
- How long the audio portion plays
- How long the subtitle shows
- When to advance to the next event

---

## The Two Approaches

### Approach A: On-the-Fly

**Compute duration when you need it, as you play.**

```javascript
playEvent(event) {
  const duration = estimateDuration(event);  // compute now
  playAudio(event, duration);
  showSubtitle(event.text);
  setTimeout(() => playNextEvent(), duration);
}
```

**The player owns all timing logic.** No separate data structure. Just walk through events and compute as you go.

---

### Approach B: Pre-Computed Timeline

**Generate a timeline with all timings upfront, then play from that.**

```javascript
// Generate timeline once at startup
const timeline = events.map((event, i) => ({
  ...event,
  duration: estimateDuration(event),
  startTime: sumOfPreviousDurations,
  endTime: sumOfPreviousDurations + duration,
  audioStart: pickRandomStart(event, seed),
}));

// Player uses pre-computed values
playEvent(timelineEntry) {
  playAudio(timelineEntry.audioStart, timelineEntry.duration);
  showSubtitle(timelineEntry.text);
}
```

**Timing is computed once, stored, then consumed.** The timeline is a new data structure with enriched timing info.

---

## Comparison

| Aspect | On-the-Fly | Pre-Computed |
|--------|------------|--------------|
| **Simplicity** | ✓ Simpler — no extra data structure | More code, separate timeline object |
| **Total duration** | Compute by iterating | ✓ Instant lookup |
| **Timestamp seeking** | Hard — must replay from start | ✓ Easy — lookup by time |
| **Event-based navigation** | ✓ Easy — just jump to event index | ✓ Easy |
| **Configuration changes** | ✓ Apply immediately | Must regenerate timeline |
| **Sync drift risk** | Possible over long episodes | ✓ Lower — all times pre-calculated |
| **Debugging** | Ephemeral — can't inspect timing | ✓ Inspectable — timeline is data |
| **Export to video** | Works (real-time capture) | Works (real-time capture) |
| **Future extensibility** | Good for simple features | ✓ Better for complex animations |

---

## Deep Dive: Key Considerations

### Seeking

**On-the-fly:** Seeking by event index is easy. Seeking by timestamp (e.g., "go to 2:30") requires computing cumulative durations up to that point.

**Pre-computed:** Seeking by timestamp is instant — just find the event where `startTime <= t < endTime`.

**Our take:** Event-based navigation ("go to line 5") may actually be better UX for a script-based tool. Timestamp seeking isn't essential.

---

### Export to Video

The spec says we'll use `canvas.captureStream()` — real-time recording of playback. Both approaches work equally well for this. Pre-computed would only matter if we did frame-by-frame rendering (e.g., ffmpeg), which isn't planned.

---

### Sync Drift

On-the-fly relies on `setTimeout` or `audio.onended` to advance between events. These can accumulate small errors over many events.

Pre-computed could schedule everything against Web Audio API's `audioContext.currentTime`, which is high-precision.

**Mitigation:** Careful implementation with Web Audio API can avoid drift in on-the-fly too. Not a dealbreaker.

---

### Future Features

| Future Feature | On-the-Fly | Pre-Computed |
|----------------|------------|--------------|
| Transitions (fade, cut) | Works | Works |
| Sound effects `[sfx:]` | Works | Works |
| Music cues | Works | Works |
| Explicit pauses `[pause: 2s]` | Works | Works |
| Camera movements spanning multiple events | Harder — don't know total span duration | ✓ Easier — durations are known |
| Visual timeline scrubber | Harder | ✓ Easier |
| Server-side rendering | Would need pre-computed anyway | ✓ Ready |

---

## Arguments For On-the-Fly

1. **Simpler to start** — No extra data structure to define and maintain
2. **No "doubling up" feeling** — Just the original JSON, enriched on demand
3. **Configuration is immediate** — Change padding, duration formula, etc. without regenerating
4. **Sufficient for first life** — We don't need timestamp seeking or visual scrubbers
5. **Aligns with principle** — "Every piece justifies its existence toward the goal"

---

## Arguments For Pre-Computed

1. **More inspectable** — Timeline is data you can log, debug, share
2. **Future-proof for complex features** — Camera movements, multi-track audio, animations
3. **Lower sync drift risk** — All timing calculated from single source of truth
4. **Know total duration instantly** — Useful for validation and UI
5. **Seeking is trivial** — If we ever want timestamp-based navigation
6. **Not much extra code** — ~20 lines to generate the timeline

---

## What We Lose With Each Choice

### If we choose On-the-Fly:
- Timestamp seeking becomes expensive
- Visual scrubber is harder to build
- Slightly higher sync drift risk (mitigatable)
- If we later need pre-computed for a feature, we refactor

### If we choose Pre-Computed:
- Extra data structure to maintain
- Must regenerate when config changes
- Slightly more upfront complexity
- "Redundancy" feeling (though it's really enrichment, not duplication)

---

## Our Current Lean

**On-the-fly for first life.**

Reasoning:
- Simpler, and simplicity is a principle
- No features currently require pre-computed
- Event-based navigation is arguably better UX than timestamp seeking
- Export uses real-time capture, not frame rendering
- We can refactor if a compelling need emerges

---

## Open Question

Is the simplicity of on-the-fly worth the potential refactor later if we need:
- Complex animations spanning events?
- Frame-accurate/server-side rendering?
- Visual timeline editing?

Or should we build the slightly more complex pre-computed approach now to avoid future pain?

---

*This document captures our thinking as of now. Decision pending.*

