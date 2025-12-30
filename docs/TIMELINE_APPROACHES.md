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

## Concrete Examples: What's Genuinely Hard

### Easy With Both: Single-Event Look-Ahead

**Cross-fade audio between scenes** — ambiance from next location fades in 2s before current scene ends:

```javascript
// On-the-fly handles this fine
playEvent(event, nextEvent) {
  const duration = estimateDuration(event);  // you just computed this
  
  if (nextEvent?.type === 'location') {
    // Schedule fade-in 2s before this event ends
    setTimeout(() => fadeInAmbiance(nextEvent.location), duration - 2000);
  }
  // ...
}
```

You know your current event's duration, and you just peek at the next event's *type*. No future duration computation needed.

**Other easy cases:** Transitions between events, SFX triggered at event start, any effect that only needs to know the *current* event's duration.

---

### Genuinely Harder With On-the-Fly: Multi-Event Spans

These are where pre-computed genuinely helps:

#### Camera Zoom Across Multiple Dialogue Lines

```
PARTH: I have something to tell you.    ← zoom starts here (wide)
PREET: What is it?
PARTH: [upset] I ate your sandwich.     ← zoom ends here (tight)
```

Zoom speed = distance / **total duration of all 3 events**.

- **Pre-computed:** Total span duration is known. Set speed = distance / 8s.
- **On-the-fly:** When starting event 1, you don't know events 2-3 durations. Must compute them anyway — essentially mini-pre-computing.

#### Music Build-Up Over Several Events

```
[music: tension-build, ends-at: CLIMAX]
PARTH: Something feels wrong.
PREET: What do you mean?
PARTH: I don't know.
PREET: Look behind you.
PARTH: [upset] AHHH!   ← #CLIMAX - music peaks here
```

Music needs to know: "I have 15 seconds to build from quiet to peak."

- **Pre-computed:** Total span is known. Calculate build-up curve.
- **On-the-fly:** Must scan ahead and compute all event durations between start and climax.

#### Ken Burns Effect Spanning a Montage

Slow pan across multiple still images during a narration sequence. Each image's pan rate depends on knowing the total narration duration.

---

### The Pattern

| Effect Type | On-the-Fly | Pre-Computed |
|-------------|------------|--------------|
| Current event only | ✓ Easy | ✓ Easy |
| Peek at next event type | ✓ Easy | ✓ Easy |
| Span 2+ events (need total duration) | Harder — must look-ahead | ✓ Easy |
| Anticipate many events ahead | Much harder | ✓ Easy |

**Bottom line:** Single-event and next-event effects are easy with both. Multi-event spans favor pre-computed.

---

## On-the-Fly: Angel's Advocate

1. **Simplicity is a principle.** No extra data structure means less to understand, less to maintain, fewer moving parts.

2. **Event-based navigation is arguably better UX.** For a script-based tool, "go to line 5" is more natural than "go to 2:34". On-the-fly handles this perfectly.

3. **Configuration changes apply immediately.** Change padding, duration formula, etc. — no regeneration step. More interactive.

4. **No redundancy.** You're not storing derived data that could get out of sync with the source.

5. **YAGNI (You Aren't Gonna Need It).** We don't currently need timestamp seeking, visual scrubbers, or complex animations. Build what you need now.

6. **Easy to refactor later if needed.** If a compelling feature requires pre-computed, the refactor is straightforward. Not a one-way door.

7. **Avoids seeking complexity.** No state reconstruction, no interpolation math, no audio seeking fiddliness. Just play forward.

8. **Reacts to reality.** Can use actual `audio.onended` events rather than assuming pre-computed durations are perfect.

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

6. **State reconstruction when seeking.** Jump to event 15? You must rebuild the world: What location are we in? What's each character's emotional state? Is a camera mid-animation? On-the-fly always plays sequentially, so state naturally accumulates — no reconstruction needed.

7. **Interpolation complexity for mid-event scrubbing.** If a slow zoom spans 3 events and you scrub to the middle, you need keyframe animation math: start value, end value, easing curve, percentage complete. You're essentially building an animation engine.

8. **Audio seeking is fiddly.** Web Audio API doesn't have a simple "seek to 2.5s" method. You must: stop current audio, calculate new offset, create new buffer source, start at offset. Can cause clicks/pops at seek points.

9. **Reality drift.** Pre-computed assumes audio plays for *exactly* the computed duration. Browser quirks (sample rate conversions, scheduling delays) can cause actual playback to diverge from the timeline. On-the-fly can react to actual `audio.onended` events.

10. **Floating point accumulation.** If `startTime = sum of all previous durations`, floating point errors can accumulate over hundreds of events. Usually tiny, but worth noting.

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

## What Each Approach Avoids

### On-the-Fly avoids:
- State reconstruction logic (always plays sequentially)
- Interpolation math for mid-event states
- Audio seeking complexity (just plays start to finish)
- Timeline/reality drift concerns (reacts to actual audio events)
- Regeneration step on config changes

### Pre-Computed avoids:
- O(n) cost for timestamp seeking
- "Look-ahead" hacks for multi-event animations
- Recomputing durations repeatedly
- Uncertainty about total duration

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

2. **How likely are multi-event spanning animations?** (Single-event and next-event effects work fine with on-the-fly — only animations spanning 2+ events favor pre-computed.)

3. **Is the seeking complexity worth it?** Pre-computed enables timestamp scrubbing, but adds state reconstruction, interpolation math, and audio seeking fiddliness.

4. **Which aligns better with our principles?** "Justify existence" vs "future-proofing"?

---

## Clarifications From Discussion

- **Cross-fades and single-event effects** are easy with on-the-fly (just peek at next event type, use current duration).
- **Multi-event spans** (zoom across 3 lines, music build over many events) genuinely favor pre-computed.
- **Pre-computed has its own costs:** state reconstruction on seek, interpolation complexity, audio API fiddliness, potential reality drift.
- **Both approaches work for export** via `captureStream()` (real-time recording).

---

*Decision pending. This document aims to present both sides fairly.*

