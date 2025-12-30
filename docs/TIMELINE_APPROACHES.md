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
// Generate timeline once at startup (instant - milliseconds)
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

**Note:** Timeline computation is instant (milliseconds for hundreds of events). Script changes don't cause any noticeable delay.

---

## What Both Approaches Share

Before diving into differences, note what's **equal**:

| Capability | On-the-Fly | Pre-Computed |
|------------|------------|--------------|
| Sequential playback | ✓ | ✓ |
| Event-based navigation ("go to event 5") | ✓ | ✓ |
| Pauses and silent beats | ✓ | ✓ |
| Configurable padding between events | ✓ | ✓ |
| Export via `captureStream()` | ✓ | ✓ |
| All planned future FSL features | ✓ | ✓ |

For basic playback and event navigation, they're equivalent.

---

## Where They Differ

| Capability | On-the-Fly | Pre-Computed |
|------------|------------|--------------|
| Timestamp-based seeking ("go to 2:30") | O(n) — walk through events | O(1) — instant lookup |
| Mid-event scrubbing (drag slider, see mid-zoom) | Possible but expensive | Fast |
| Know total duration | Iterate once to compute | Instant |
| Visual timeline scrubber | Harder to build | Easier to build |
| Configuration changes | Apply immediately | Regenerate timeline (instant) |
| Code complexity | Less | Slightly more (~20 lines) |

---

## Deep Dive: Key Considerations

### Navigation: Events vs Timestamps

**Both approaches let you show a list of events and click to jump to any one.** This is arguably the right UX for a script-based tool — you're navigating by script line, not by timestamp.

Timestamp seeking (drag a slider to 2:30) requires:
- **On-the-fly:** Walk through events, sum durations, find which event contains 2:30
- **Pre-computed:** Instant lookup

**Question to ask:** Do we actually want timestamp-based navigation, or is event-based better for our use case?

---

### Mid-Event Seeking (Scrubbing)

**Both approaches CAN support mid-event seeking** (e.g., see a camera zoom at 73% progress).

The difference:
- **Pre-computed:** Fast — you know event 5 spans 3200-4100ms, so seeking to 3500ms is trivial math
- **On-the-fly:** Must first compute when event 5 starts (walk events 1-4), then do the same math

If you want smooth scrubbing where dragging a slider instantly shows the mid-state, pre-computed is significantly better.

---

### Sync Drift

On-the-fly typically uses `setTimeout` or `audio.onended` to advance. These can accumulate small timing errors over many events.

Pre-computed can schedule everything against `audioContext.currentTime` (high-precision clock).

**However:** On-the-fly can also use `audioContext.currentTime` with careful implementation. Sync drift is mitigatable in both approaches.

---

### Export to Video

The spec uses `canvas.captureStream()` — real-time recording of what's playing. **Both approaches work equally well.** Pre-computed would only matter for frame-by-frame ffmpeg rendering, which isn't planned.

---

### Computation Time

**Both are instant after script changes.** Pre-computed timeline generation is O(n) simple math — microseconds for hundreds of events. You'd never notice a delay.

---

## On-the-Fly: Angel's Advocate

1. **Simplicity is a principle.** No extra data structure means less to understand, less to maintain, fewer moving parts.

2. **Event-based navigation is arguably better UX.** For a script-based tool, "go to line 5" is more natural than "go to 2:34". On-the-fly handles this perfectly.

3. **Configuration changes apply immediately.** Change padding, duration formula, etc. — no regeneration step. More interactive.

4. **No redundancy.** You're not storing derived data that could get out of sync with the source.

5. **YAGNI (You Aren't Gonna Need It).** We don't currently need timestamp seeking, visual scrubbers, or complex animations. Build what you need now.

6. **Easy to refactor later if needed.** If a compelling feature requires pre-computed, the refactor is straightforward. Not a one-way door.

---

## On-the-Fly: Devil's Advocate

1. **Timestamp seeking is expensive.** If you ever want a scrubber or "go to 2:30", you'll pay O(n) cost every time.

2. **Smooth scrubbing is hard.** Dragging a slider and seeing mid-event states in real-time won't feel snappy.

3. **Total duration requires iteration.** "Is this episode under 5 minutes?" needs a loop.

4. **Harder to debug timing issues.** Timing is ephemeral — you can't inspect "what's the start time of event 5?" without computing it.

5. **Future features might force a refactor.** Camera movements spanning events, multi-track audio sync, visual timeline editing — all easier with pre-computed.

6. **Sync drift risk.** With many events and sloppy implementation, audio/video could drift. (Mitigatable, but requires care.)

---

## Pre-Computed: Angel's Advocate

1. **Timestamp seeking is instant.** "Go to 2:30" is O(1). Scrubbing feels responsive.

2. **Mid-event states are trivial.** Know event 5 spans 3200-4100ms, seeking to 3500ms gives you the exact interpolated state.

3. **Total duration is free.** Just read the last event's `endTime`.

4. **Inspectable and debuggable.** Timeline is data — log it, inspect it, share it. Easier to find timing bugs.

5. **Future-proof.** Camera movements, animations spanning events, visual timeline editing — all straightforward.

6. **Not much extra code.** ~20 lines to generate the timeline. Low cost for high optionality.

7. **Single source of truth for timing.** All timing computed once from the same logic. Less chance of inconsistency.

---

## Pre-Computed: Devil's Advocate

1. **Extra data structure.** You now have both events AND timeline. Two things to keep in mind.

2. **Feels like redundancy.** The timeline is "just the events with extra fields." Philosophically unsatisfying to some.

3. **Regeneration on config change.** Change padding? Regenerate. Change duration formula? Regenerate. (Though it's instant, so maybe not a real issue.)

4. **Might be building for imaginary futures.** We don't need timestamp seeking or visual scrubbers for first life. Pre-computed solves problems we don't have.

5. **Violates "justify existence" principle?** If we don't need the extra capabilities now, why build them?

---

## Future Features Analysis

| Feature | On-the-Fly | Pre-Computed | Notes |
|---------|------------|--------------|-------|
| Transitions (fade, cut) | Works | Works | Compute transition duration at event start |
| Sound effects `[sfx:]` | Works | Works | Trigger when event plays |
| Music cues `[music:]` | Works | Works | Start/stop at events |
| Explicit pauses `[pause: 2s]` | Works | Works | Duration is in the event |
| Camera movements | Works (compute on demand) | Easier (durations known) | Multi-event spans favor pre-computed |
| Visual timeline scrubber | Harder | Easier | Need timestamp → event mapping |
| Server-side/batch rendering | Would need pre-computed | Ready | Major architecture change anyway |
| Episode length validation | Compute once | Instant | Minor difference |
| Thumbnail/keyframe generation | Replay to point | Instant lookup | Pre-computed wins |

**Verdict:** Most features work with both. Pre-computed has an edge for timeline UIs and complex animations, but nothing in first life requires it.

---

## The Real Question

**What kind of navigation do we want?**

- **Event-based** ("go to line 5, go to line 12"): Both approaches are equal
- **Timestamp-based** ("go to 2:30, scrub to any point"): Pre-computed is significantly better

For a script-based tool, event-based might actually be the right UX. You're working with a script, not a video timeline.

---

## Summary

| If you value... | Choose... |
|-----------------|-----------|
| Simplicity and minimalism | On-the-Fly |
| Building only what's needed now | On-the-Fly |
| Event-based navigation | Either (equal) |
| Timestamp-based seeking/scrubbing | Pre-Computed |
| Future-proofing for complex features | Pre-Computed |
| Inspectable timing data | Pre-Computed |

---

## Open Questions

1. **Do we actually want timestamp-based navigation?** Or is event-based better for a script tool?

2. **How likely are complex animations spanning events?** Camera movements, multi-track audio?

3. **Is the "extra data structure" a real cost?** Or is ~20 lines of code negligible?

4. **Which aligns better with our principles?** "Justify existence" vs "future-proofing"?

---

*Decision pending. This document aims to present both sides fairly.*

