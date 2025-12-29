# Hey Parth and Preet — Answer These Before Building

This doc captures everything that's deferred, unresolved, or needs your input before we start building. Go through these together, make decisions, then update the spec accordingly.

---

## 🔴 Must Decide Before Building

### 1. ✅ ~~Conversation Shot Layout~~ → Now: OTS Shot Layout
**RESOLVED** — We've defined the OTS (over-the-shoulder) shot:

| Element | Specification |
|---------|---------------|
| **Speaker** | Front-34 angle, in focus, positioned on opposite side from their "seat" |
| **Non-speaker** | Back-34 angle, heavy blur, positioned in foreground corner |
| **Background** | Perspective from speaker's side (left.jpg if Mario speaks, right.jpg if Luigi speaks) |
| **On speaker change** | Everything swaps — angles flip, background flips, positions swap |

**Still need to figure out through building:** Exact positioning, scale, blur amount. Will iterate with real assets.

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
4. Two characters in an OTS shot
5. Gibberish audio plays for each line
6. Full automatic playback — FIRST LIFE

### 3. Test Assets
Before building, you need placeholder assets matching the new structure:

**Characters (per character, per state):**
- [ ] **front-34 video** — WebM with alpha, mouth moving, looping
- [ ] **back-34 video** — WebM with alpha, back of head/shoulder
- [ ] **audio clips** — several short gibberish phrases

**Minimum for first life:**
- [ ] 2 characters (Mario, Luigi)
- [ ] 3 states each (happy, sad, angry or similar)
- [ ] 2 angles per state (front-34, back-34)

**Locations (per location):**
- [ ] **left.jpg/webm** — perspective from left character's side
- [ ] **right.jpg/webm** — perspective from right character's side

**Minimum for first life:**
- [ ] 2 locations (rainbow-cafe, bridge)
- [ ] 2 background perspectives each

Do you want to record real assets first, or use placeholder/dummy content to test the system?

---

## 🟡 Deferred Questions (Figure Out While Building)

These don't need answers now — you'll figure them out as you build.

### Gibberish Timing Algorithm
How to calculate audio duration from text? Start with something simple like:
- `duration = wordCount * 0.4 seconds`
- Adjust based on how it feels

### Asset Consistency
When recording new states/angles, how consistent do you need to be with clothing, hair, etc.? Trust your design instincts — the lo-fi aesthetic absorbs some inconsistency.

### Character Positioning
For first life, Mario is always camera-left, Luigi is always camera-right. Future: should this be configurable per-scene?

---

## 🟢 Already Decided

These are locked in (from our Q&A session):

- ✅ **Language:** TypeScript
- ✅ **Framework:** Vanilla (no React/Vue/Svelte)
- ✅ **Rendering:** Canvas compositing
- ✅ **Video format:** WebM with alpha
- ✅ **Preview:** Standalone browser app
- ✅ **Server:** Static file server (`npx serve .`) — manual refresh to see changes
- ✅ **Asset discovery:** Folder scanning (no manifest)
- ✅ **Parser:** Hand-written TypeScript (runs in browser)
- ✅ **DSL:** FSL (Foreigners Scripting Language) — syntax defined
- ✅ **Shot type:** OTS (over-the-shoulder) for first life, `[shot:]` syntax for future
- ✅ **Location backgrounds:** Left/right perspectives, auto-switch based on speaker
- ✅ **Asset structure:** states/ with angle folders (front-34/, back-34/) and audio/

---

## Next Steps

1. Go through the remaining 🔴 **Must Decide** items together (milestones, test assets)
2. Get placeholder assets ready (or decide to record real ones first)
3. Start building Milestone 1

---

*Once you've answered these, delete this file or move it to `/docs/archive/` — it's served its purpose.*

