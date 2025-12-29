# Foreigners — Launchpad Spec

> A lo-fi sitcom engine — modular, programmatic, and intentionally quirky.

---

## The Vision

**Foreigners** is a system for creating episodic video content featuring characters who speak fictional "foreign" languages — expressive gibberish paired with subtitles that reveal what they're actually saying. Think of it as a 16-bit sitcom: not striving for realism, but embracing its constraints as aesthetic. The limitations of the system *become* the style.

At its heart, Foreigners is a **screenplay adapter**. You write what happens — who speaks, what they say, how they feel, where they are — and the engine assembles it into watchable scenes using pre-recorded modular assets. No frame-by-frame editing. No complex video software. Just composition.

The result is something between a puppet show and a sitcom, with real people (or characters) acting as digital marionettes — their emotions, movements, and voices all drawn from a library of interchangeable parts that combine into something unexpectedly alive.

---

## Why This Exists

We want to tell stories quickly.

Traditional video production is slow. Writing, shooting, editing — each step introduces friction. Foreigners removes that friction by separating *creation* from *composition*. You record assets once (a character's emotional states, a location's ambience), and then you write freely, knowing the engine will handle assembly.

This is a creativity multiplier. When the barrier to making a scene is just *typing what happens*, you make more scenes. You experiment. You iterate. You don't lose interest waiting for renders or wrestling with timeline editors.

The lo-fi aesthetic isn't a compromise — it's a commitment. We're not trying to simulate reality. We're making something that *feels* made, that has texture and character precisely because it doesn't pretend to be anything else.

---

## Development Principles

*Adapted from [Nisuboy Principles](PRINCIPLES.md) for this project.*

### 1. Every piece justifies its existence toward the goal

Build only what's needed to make scenes. If a feature doesn't directly serve the ability to compose, preview, or export a scene, it doesn't get built yet. Ambition is welcome — this system could grow into something rich — but every addition must earn its place *now*, not in some imagined future.

- **ASK:** "Does this help us make a scene today?"

### 2. Flexibility goes in chosen spots, not everywhere

The asset system is *designed* for flexibility: new characters, emotions, angles, locations can be added at any time. But the scene format, the folder structure, the core primitives — these should be stable and simple. Don't over-engineer the engine in anticipation of features that don't exist yet. Leave clear seams where expansion will happen (and name them), but keep everything else direct. That said, don't artificially constrain when genuine expansion is needed — use judgment.

- **ASK:** "Am I building a door we'll actually walk through, or just a trapdoor to nowhere?"

### 3. Grow by deepening, not by multiplying

When we want richer scenes, first ask: can existing primitives handle it? Can a character gain a new emotion without changing the system? Can a location gain ambient sound without new architecture? The system should get more *capable* without getting more *complex*. New moving parts are a last resort — but don't over-collapse when a new structure genuinely earns its place. Fight *unnecessary* multiplication, not legitimate expansion.

- **ASK:** "Does this make the system smarter, or just bigger?"

### 4. Every part knows the whole it belongs to

You're building a harmonious system, not a pile of parts. Each piece should understand what it connects to and what depends on it. When you touch one thing, you should be able to trace its connections outward without surprise. The exact hierarchy will emerge through implementation — but the principle of coherence guides us there.

- **ASK:** "Where does this fit, and what else does it touch?"

### 5. The system always works with what exists

No asset should be *required* for the system to function. If a character only has two emotions, scenes can still be made with those two emotions. If a location has no ambient sound, it still works — just silent. Missing assets never block creation; they just limit options.

- **ASK:** "If this asset didn't exist, would the system still run?"

### 6. Additions are additive, never breaking

Backwards compatibility isn't just nice-to-have — it's structural. Adding a new dimension (angles, camera moves, transitions) should *never* require going back to retrofit old content. Old scenes keep working. Old characters keep working. The system is designed for accretion: you can always add more, and the past remains intact.

- **ASK:** "Does this change require touching anything that already exists?"

### 7. Speed to interesting results

We lose interest in long build-ups. The MVP must produce *something watchable* quickly — not polished, not complete, but *engaging*. Every architectural decision should be evaluated against this: does it get us to our first real scene faster, or slower? We can iterate and deepen once we have momentum, but momentum requires early wins.

- **ASK:** "How soon can we watch something we made?"

### 8. Constraints as style

The system's limitations — the looping gibberish, the static poses, the simple compositions — are not bugs to be fixed later. They're the aesthetic. Lean into them. A character who only has three emotions isn't broken; they're *that character*. The lo-fi quality is the point.

- **ASK:** "Are we fighting this constraint, or featuring it?"

---

## Scope Definition

| First Life | Future Ideas |
|------------|--------------|
| 2 characters, 3 states each, front-34 + back-34 angles | Additional angles (full front, full side, full back, etc.) |
| 2 locations with left/right perspective backgrounds | Two-shot backgrounds, ambient audio, acoustic profiles |
| FSL scripting language (characters, states, locations) | Extended FSL syntax (title cards, transitions, `[shot:]`) |
| Hand-written parser | — |
| Canvas-based preview in browser | Export to video file |
| Single location per script (architecture supports multi-location) | Multi-location scripts with exposition shots + jingles |
| OTS (over-the-shoulder) shot only, auto-switches on speaker change | Multiple shot types (two-shot, single, etc.) |
| Gibberish audio timed to text length | Variant selection, intensity modifiers |
| Manual refresh to see changes | VS Code extension (syntax highlighting, autocomplete) |

---

## Tech Stack

**Language:** TypeScript

Why: Type safety, excellent editor support, vibe-codes well with AI assistance. The compilation step is trivial and the benefits are substantial.

**Runtime:** Node.js (server) + Browser (renderer)

**Rendering:** Canvas API

Why: Building a video renderer — canvas is the natural fit. One rendering path for both preview and eventual export. `canvas.captureStream()` makes export trivial later. Full control over compositing.

**Video Format:** WebM with alpha channel (VP9)

Why: Transparent video that plays natively in browsers. No plugins, no special handling.

**Audio:** Web Audio API

Why: Native browser API for audio playback, timing, and (eventually) effects like reverb for location acoustics.

**Dev Server:** Any static file server

Why: Just serves files. That's it. No custom server code needed — use `npx serve .` or `python3 -m http.server`. The browser does all the parsing and rendering. Refresh to see changes.

**Key Dependencies:**
- Any static file server (no custom code)
- That's literally it

---

## System Architecture

```
┌──────────────────────────────────────┐
│   Static File Server                 │
│   (npx serve . or python -m http)    │
│                                      │
│   Just serves files, nothing else    │
└──────────────────┬───────────────────┘
                   │ HTTP
                   ▼
┌─────────────────────────────────────────────────────────────┐
│                      Browser (does everything)               │
│                                                              │
│  ┌─────────────┐  ┌─────────────────────┐                   │
│  │   Parser    │  │  Asset Discovery    │                   │
│  │   (FSL)     │  │  (reads asset list) │                   │
│  └──────┬──────┘  └──────────┬──────────┘                   │
│         │                     │                              │
│         └──────────┬──────────┘                              │
│                    ▼                                         │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────────────┐  │
│  │  Playback   │  │   Canvas    │  │     Web Audio       │  │
│  │  Engine     │──▶  Compositor │  │     (gibberish)     │  │
│  │ (timing,    │  │ (background,│  │                     │  │
│  │  sequencing)│  │  characters,│  │                     │  │
│  │             │  │  subtitles) │  │                     │  │
│  └─────────────┘  └─────────────┘  └─────────────────────┘  │
└─────────────────────────────────────────────────────────────┘
```

**Components (explained simply):**

*Everything runs in the browser. The server just serves files.*

- **Parser** — *The translator.* 
  Reads your `.foreigners` script and turns it into data the computer understands. Like translating a recipe written in English into step-by-step instructions a robot can follow. "Mario says hello with a happy emotion" becomes structured data the engine can work with.

- **Asset Discovery** — *The inventory checker.*
  Reads a list of what characters, emotions, and locations you have available. Like checking what ingredients are in your kitchen before cooking. "Okay, we have Mario with happy/sad/angry, and Luigi with happy/neutral..."

- **Playback Engine** — *The conductor.*
  Knows the timing and order of everything. "First Mario talks, then Luigi responds, then Mario again..." It tells everyone else what to do and when. Like a conductor leading an orchestra through a piece of music.

- **Canvas Compositor** — *The painter.*
  Draws everything onto the screen — background first, then characters on top, then subtitles on top of that. Layers them like a collage. Every frame, it paints the whole picture fresh.

- **Web Audio** — *The DJ.*
  Plays the gibberish sounds at the right time, synced to the dialogue. Picks the right audio clips, strings them together, and makes sure they match the timing of the subtitles.

---

## Data Flow

**On page load:**
1. Browser fetches the `.foreigners` script file (just a text file)
2. Browser parses it into structured data (JavaScript does this)
3. Browser reads the asset manifest to know what's available
4. Browser loads required assets (videos, audio) for the script

**On script change:**
1. You edit and save the script
2. You refresh the browser
3. Browser fetches and re-parses the script
4. Browser re-renders from the beginning

**During playback:**
1. Playback engine reads next line from parsed script
2. Engine determines: which character, what emotion, what text
3. Compositor draws: background → non-speaker (blurred) → speaker → subtitle
4. Audio plays: selects gibberish clips to fill estimated duration
5. When audio completes → advance to next line
6. Repeat until end of script

---

## Core Concepts

### Characters (Foreigners)

A **character** is a digital puppet — a collection of video and audio assets that can be composed into scenes.

**Video assets:**
- Recorded against a removable backdrop (green screen or similar)
- Silent footage of the character "speaking" — mouth moving, body expressing
- Organized by **emotion** (neutral, happy, sad, angry, etc.)
- Each emotion has **angles** (front-34, back-34) for different shot compositions
- WebM format with alpha channel for transparency

**Audio assets:**
- Gibberish "language" unique to the character
- Phrases/sounds organized by emotion
- Short clips that can be sequenced to fill any dialogue length

**Key property:** A character can exist with minimal assets (one emotion, a handful of sounds) and still be fully functional. The system discovers capabilities from what exists in the folders.

### Locations

A **location** is where a scene takes place — but crucially, locations aren't just single backgrounds. They're **perspectives on a space**.

When you're shooting an over-the-shoulder shot focused on Mario, the background shows *what's behind Mario* (i.e., what he's looking at). When you flip to focus on Luigi, the background shows *what's behind Luigi* — a different part of the same space.

**Background perspectives:**
- `left.jpg/webm` — View from the left character's side (what's behind them)
- `right.jpg/webm` — View from the right character's side (what's behind them)

The engine automatically chooses the correct perspective based on who's speaking. For first life, Mario is always camera-left, Luigi is always camera-right.

**Exposition shots:**
- Short video clips that establish the location (exterior shot, establishing shot)
- Played automatically during location transitions
- Not tied to any camera/shot type — they're their own thing

**First life:** Two background perspectives per location (left/right).

**Future:** Wide shot backgrounds, ambient audio, acoustic profiles.

### Camera (Shot Types)

**The key insight:** Instead of controlling character angles directly in scripts, you control **shot types**. The engine figures out which angles and backgrounds to use.

**Why this matters:**

In an over-the-shoulder shot, when the speaker changes, *everything changes*:
- The speaker shows their front-34 angle (facing camera)
- The listener shows their back-34 angle (facing away, often blurred)
- The background perspective flips (showing what's behind the new speaker)

If you had to manually specify all of this in the script, it would be tedious and error-prone. Instead, you specify **what kind of shot**, and the engine handles the composition.

**How shot types are implemented:**

Shot types are **baked into the engine code**, not configured via text files. Each shot type is code that knows:
- Which character angles to use
- Which background perspective to use
- How to position and composite everything
- What blur/focus effects to apply

---

#### Shot Type Reference

**`ots` — Over-the-Shoulder** *(First Life)*

The classic dialogue shot. Speaker in focus, non-speaker visible but secondary.

| Element | Specification |
|---------|---------------|
| **Speaker** | Front-34 angle, in focus, positioned on opposite side from their "seat" |
| **Non-speaker** | Back-34 angle, blurred (heavy blur), positioned in foreground corner |
| **Background** | Perspective from speaker's side (left.jpg if speaker is camera-left) |
| **On speaker change** | Everything swaps — angles flip, background flips, positions swap |

*This is the only shot type for first life. No FSL syntax needed — it's the default.*

---

**`two-shot` — Two-Shot / Profile** *(Future)*

Both characters visible in frame, typically in profile facing each other.

| Element | Specification |
|---------|---------------|
| **Left character** | Side/profile angle, positioned left of center |
| **Right character** | Side/profile angle, positioned right of center |
| **Background** | Wide background (backgrounds/wide.webm) |
| **Focus** | Both characters in focus, no blur |
| **On speaker change** | Characters stay in place, subtitle indicates speaker |

*Requires: side angle assets for characters, wide background for location.*

---

**`single` — Single Shot** *(Future)*

Just one character fills the frame. Intimate, dramatic.

| Element | Specification |
|---------|---------------|
| **Speaker** | Front-34 angle (or front angle), scaled up / zoomed in, centered |
| **Non-speaker** | Not visible |
| **Background** | Speaker's perspective background, possibly with zoom/crop |
| **Focus** | Full focus on speaker |

*Requires: No new assets — uses existing front-34 angles, just composed differently.*

---

**Future FSL syntax:**
```fsl
[shot: ots]
mario: [[happy]] Hey, what's up?

[shot: two-shot]
mario: [[frustrated]] I hate capitalism.
luigi: [[sad]] Yeah, I'm with you there.

[shot: single]
mario: [[emotional]] I just... I can't do this anymore.
```

*Note: `[shot:]` controls framing/composition. `[camera:]` is reserved for future movement commands (pan, zoom, dolly).*

**Missing assets = clear errors:**

If a shot type requires an asset that doesn't exist (e.g., two-shot needs a wide background), the system errors clearly: "Two-shot requires `backgrounds/wide.webm` for location 'rainbow-cafe'." No silent fallbacks that produce broken visuals.

### The Script (FSL)

Scripts are written in **FSL (Foreigners Scripting Language)** — a custom DSL designed for human-writability.

**Example:**
```
@rainbow-cafe

mario: [[happy]] Hey Luigi, what's up?
luigi: [[neutral]] Not much, just chilling.
mario: [[excited]] Want to go to the bridge?
```

**For full syntax documentation, see [fsl/FSL.md](fsl/FSL.md).**

---

## Asset Organization

Assets are discovered by scanning folders. The folder structure *is* the configuration.

```
assets/
  characters/
    mario/
      states/
        happy/
          front-34/
            video.webm      # or multiple variants: smile-1.webm, smile-2.webm
          back-34/
            video.webm
          audio/
            phrase-1.mp3
            phrase-2.mp3
        sad/
          front-34/
            video.webm
          back-34/
            video.webm
          audio/
            phrase-1.mp3
        angry/
          front-34/
            video.webm
          back-34/
            video.webm
          audio/
            phrase-1.mp3
            phrase-2.mp3
    luigi/
      states/
        ...
  
  locations/
    rainbow-cafe/
      backgrounds/
        left.jpg            # View from left character's side (can be .jpg, .png, .webm)
        right.jpg           # View from right character's side
        wide.webm           # (Future) For wide shots
      exposition/
        exterior.mp4        # Establishing shot, played during transitions
    bridge/
      backgrounds/
        left.webm
        right.webm
      exposition/
        approach.mp4
  
  jingles/                  # Global — not per-location
    upbeat-1.mp3
    dramatic-sting.mp3
    peaceful.mp3
```

**Rules:**
- Character states (emotions) are discovered from folder names
- Each state contains angle folders (front-34, back-34) and an audio folder
- Multiple files in a folder = variants (randomly selected unless specified)
- Location backgrounds are perspectives (left/right), not single images
- Exposition shots are per-location, jingles are global
- Missing assets don't break the system — they just limit options

---

## Launchpad Milestones

> ⚠️ **WORK IN PROGRESS** — These milestones are a rough draft. Parth and Preet need to review and refine these together before building begins. The breakdown, ordering, and scope of each milestone may change.

Each milestone is a vertical slice — small but complete, testable. We're growing a cupcake into a cake, not building incomplete layers.

### Milestone 1: One character renders on screen

**Outcome:** Open browser, see a character video playing on a background with subtitle text.

- Project initialized (TypeScript, Node, basic dev server)
- Placeholder assets in place (one character video, one background)
- Canvas renders: background image + character video (looping) + hardcoded subtitle
- Everything hardcoded — no parsing yet

**Done when:** Browser shows Mario on the Rainbow Cafe background with "Hello World" subtitle

---

### Milestone 2: Script file controls what renders

**Outcome:** Edit a `.foreigners` file, refresh browser, see the changes.

- FSL parser built (hand-written, handles MVP syntax)
- Server parses script on startup, serves to browser
- Browser reads parsed script, renders first line
- Manual "next line" button to step through
- Character and emotion change based on script content

**Done when:** Change a line in the script, refresh, see the new content

---

### Milestone 3: Assets load from folders automatically

**Outcome:** Drop a new emotion folder with video/audio, system finds and uses it.

- Server scans asset folders on startup
- Builds inventory: which characters exist, what emotions each has, what audio clips
- Browser loads assets based on discovered inventory
- Parser warns if script references something that doesn't exist

**Done when:** Add a new emotion folder, restart server, new emotion is available

---

### Milestone 4: Two characters in an over-the-shoulder (OTS) shot

**Outcome:** See two characters on screen, speaker in focus, non-speaker blurred in foreground.

- Canvas renders two characters positioned appropriately
- Speaker is clear/prominent (front-34), non-speaker is blurred (back-34)
- Background switches based on who's speaking (left/right perspectives)
- When speaker changes (click next), everything swaps
- Subtitle shows current speaker's line

**Done when:** Click through a dialogue between Mario and Luigi, see them swap focus with backgrounds flipping

---

### Milestone 5: Gibberish audio plays for each line

**Outcome:** Each line has audio that plays while the subtitle is shown.

- Audio clips load for each character's emotions
- Duration calculated from text length
- Clips selected and sequenced to fill the duration
- Small gaps between clips for natural rhythm

**Done when:** Click next, hear gibberish that lasts roughly as long as the subtitle

---

### Milestone 6: Full automatic playback — FIRST LIFE

**Outcome:** Press play, watch the entire scene unfold with no interaction.

- Automatic advancement: when audio finishes, next line starts
- Timing synced: video, audio, and subtitles all coordinated
- Manual refresh: save script, refresh browser to see changes

**Done when:** Write a script, save it, press play, watch the whole thing — **THIS IS FIRST LIFE**

---

## Open Questions

*To be resolved through building, not planning:*

1. **OTS shot layout:** Exact positioning, scale, blur amount for speaker vs. non-speaker. Will figure out through experimentation once we have real assets.

2. **Gibberish timing algorithm:** Exact formula for text length → audio duration. Start simple (word count × constant), refine based on how it feels.

3. **Asset consistency:** How much visual consistency is needed across recordings? Trust design instincts for now.

4. **Character positioning:** For first life, Mario is always camera-left, Luigi is always camera-right. Future: Should this be configurable per-scene? Per-script?

---

## The Name

**Foreigners** — because the characters speak languages we don't understand, and yet we understand them completely. They're foreign to us, and we're foreign to them, and somehow, through subtitles and emotion, stories get told anyway.

It's also a little absurd. Which fits.

---

## A Note on This Document

This is a **Launchpad Spec**. It plans to first life — the point where the thing is alive, working end-to-end, tangible, usable. Not polished, not complete, but breathing.

We are not planning the whole journey here. Once Foreigners is alive, we'll know things we can't know now. Further direction emerges from building and using, not from speculation.

This spec will become a historical document — a snapshot of what we knew and decided at the start. And that's exactly what it should be.

*What comes next? Build Milestone 1.*
