# Hey Parth and Preet — Answer These Before Building

This doc captures everything that's deferred, unresolved, or needs your input before we start building. Go through these together, make decisions, then update the spec accordingly.

---

## 🔴 Must Decide Before Building

### 1. Conversation Shot Layout
How exactly should the two-character shot look?

- **Speaker position:** Always right? Always where they were? Swap sides?
- **Non-speaker position:** Left? Behind? How far back?
- **Scale difference:** Is the speaker bigger? By how much?
- **Blur amount:** How blurry is the non-speaker? Subtle or obvious?
- **Transition:** Hard cut when speaker changes? Any animation?

**Current assumption:** Speaker right/larger/clear, non-speaker left/smaller/blurred, hard swap on speaker change. But this needs confirmation or iteration.

### 2. Review the Milestones
The 6 milestones in the spec are a rough draft. Review them together:

- Are they in the right order?
- Is each one small enough to complete quickly?
- Is anything missing?
- Is anything unnecessary for first life?

**The milestones:**
1. One character renders on screen
2. Script file controls what renders
3. Assets load from folders automatically
4. Two characters in a conversation shot
5. Gibberish audio plays for each line
6. Full automatic playback — FIRST LIFE

### 3. Test Assets
Before building, you need placeholder assets:

- [ ] **2 character videos** — WebM with alpha, mouth moving, ~10 seconds each
- [ ] **3 emotions per character** — happy, sad, angry (or whatever you pick)
- [ ] **Gibberish audio clips** — several short phrases per emotion per character
- [ ] **2 background images** — rainbow-cafe and bridge (or whatever)

Do you want to record real assets first, or use placeholder/dummy content to test the system?

---

## 🟡 Deferred Questions (Figure Out While Building)

These don't need answers now — you'll figure them out as you build.

### Gibberish Timing Algorithm
How to calculate audio duration from text? Start with something simple like:
- `duration = wordCount * 0.4 seconds`
- Adjust based on how it feels

### Asset Consistency
When recording new emotions/angles, how consistent do you need to be with clothing, hair, etc.? Trust your design instincts — the lo-fi aesthetic absorbs some inconsistency.

### Exact Folder Structure
The spec shows a general structure. Exact naming conventions will emerge as you build the asset scanner.

---

## 🟢 Already Decided

These are locked in (from our Q&A session):

- ✅ **Language:** TypeScript
- ✅ **Framework:** Vanilla (no React/Vue/Svelte)
- ✅ **Rendering:** Canvas compositing
- ✅ **Video format:** WebM with alpha
- ✅ **Preview:** Standalone browser app
- ✅ **Hot reload:** Node server with file watching
- ✅ **Asset discovery:** Folder scanning (no manifest)
- ✅ **Parser:** Hand-written TypeScript
- ✅ **DSL:** FSL (Foreigners Scripting Language) — syntax defined

---

## Next Steps

1. Go through the 🔴 **Must Decide** items together
2. Update the spec with your decisions
3. Get placeholder assets ready (or decide to record real ones first)
4. Start building Milestone 1

---

*Once you've answered these, delete this file or move it to `/docs/archive/` — it's served its purpose.*

