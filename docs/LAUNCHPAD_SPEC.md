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

| First Life | Future |
|------------|--------|
| 2 characters, 3 emotions each, front angle only | Multiple angles (side, back, 3/4) |
| 2 locations with background images | Exposition shots, ambient audio, acoustic profiles |
| FSL scripting language (MVP syntax) | Extended FSL syntax (title cards, transitions, etc.) |
| Hand-written parser | — |
| Canvas-based preview in browser | Export to video file |
| Single location per script | Multi-location scripts with automatic transitions |
| Basic conversation shot (speaker/non-speaker) | Multiple shot types (close-up, wide, etc.) |
| Gibberish audio timed to text length | Variant selection, intensity modifiers |
| Hot reload on script change | VS Code extension (syntax highlighting, autocomplete) |

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

**Dev Server:** Node with file watching

Why: Standard dev server pattern. Watches `.foreigners` files and asset folders, notifies browser on changes via WebSocket. Well-understood, reliable.

**Key Dependencies:**
- `chokidar` or native `fs.watch` for file watching
- WebSocket library (or simple polling) for hot reload
- Standard Node HTTP server (no framework needed for first life)

---

## System Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                        Dev Server (Node)                     │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────────────┐  │
│  │ File Watcher │  │   Parser    │  │  Asset Discovery    │  │
│  │ (.foreigners)│  │   (FSL)     │  │  (folder scanner)   │  │
│  └──────┬──────┘  └──────┬──────┘  └──────────┬──────────┘  │
│         │                │                     │             │
│         └────────────────┼─────────────────────┘             │
│                          │                                   │
│                    ┌─────▼─────┐                             │
│                    │   API     │                             │
│                    │ (serves   │                             │
│                    │ parsed    │                             │
│                    │ script +  │                             │
│                    │ assets)   │                             │
│                    └─────┬─────┘                             │
└──────────────────────────┼───────────────────────────────────┘
                           │ HTTP + WebSocket
                           ▼
┌─────────────────────────────────────────────────────────────┐
│                      Browser (Renderer)                      │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────────────┐  │
│  │  Playback   │  │   Canvas    │  │     Web Audio       │  │
│  │  Engine     │──▶  Compositor │  │     (gibberish)     │  │
│  │ (timing,    │  │ (background,│  │                     │  │
│  │  sequencing)│  │  characters,│  │                     │  │
│  │             │  │  subtitles) │  │                     │  │
│  └─────────────┘  └─────────────┘  └─────────────────────┘  │
└─────────────────────────────────────────────────────────────┘
```

**Components:**

- **File Watcher:** Monitors the `.foreigners` script file for changes
- **Parser:** Transforms FSL text into structured data (lines, emotions, locations)
- **Asset Discovery:** Scans asset folders, builds inventory of available characters/emotions/locations
- **API:** Serves parsed script and asset metadata to browser; notifies on changes
- **Playback Engine:** Steps through parsed script, manages timing and sequencing
- **Canvas Compositor:** Renders background, character videos, and subtitles to canvas
- **Web Audio:** Plays gibberish clips timed to each line

---

## Data Flow

**On startup:**
1. Server scans asset folders → builds asset inventory
2. Server parses `.foreigners` file → produces structured script data
3. Browser fetches script data + asset inventory
4. Browser loads required assets (videos, audio) for the script

**On script change:**
1. File watcher detects change
2. Server re-parses script
3. Server notifies browser via WebSocket
4. Browser fetches updated script data
5. Browser re-renders from current position (or restarts)

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
- WebM format with alpha channel for transparency

**Audio assets:**
- Gibberish "language" unique to the character
- Phrases/sounds organized by emotion
- Short clips that can be sequenced to fill any dialogue length

**Key property:** A character can exist with minimal assets (one emotion, a handful of sounds) and still be fully functional. The system discovers capabilities from what exists in the folders.

### Locations

A **location** is where a scene takes place — for first life, just a background image.

**First life:** Single background image per location.

**Future:** Ambient audio, acoustic profiles, exposition shots.

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
      emotions/
        happy/
          video.webm        # or multiple variants: smile-1.webm, smile-2.webm
        sad/
          video.webm
        angry/
          video.webm
      audio/
        happy/
          phrase-1.mp3
          phrase-2.mp3
        sad/
          phrase-1.mp3
        angry/
          phrase-1.mp3
          phrase-2.mp3
    luigi/
      emotions/
        ...
      audio/
        ...
  
  locations/
    rainbow-cafe/
      background.jpg
    bridge/
      background.jpg
```

**Rules:**
- Character emotions are discovered from folder names
- Multiple video/audio files in a folder = variants (randomly selected unless specified)
- Missing assets don't break the system — they just limit options

---

## Launchpad Milestones

> ⚠️ **WORK IN PROGRESS** — These milestones are a rough draft. Parth and Preet need to review and refine these together before building begins. The breakdown, ordering, and scope of each milestone may change.

Each milestone is a vertical slice — small but complete, testable. We're growing a cupcake into a cake, not building incomplete layers.

### Milestone 1: The skeleton speaks

**Outcome:** A static "hello world" renders in the browser — one character on a background with a subtitle.

- Project initialized (TypeScript, Node, basic dev server)
- Placeholder assets in place (one character video, one background, one audio clip)
- Canvas renders: background image + character video (playing) + hardcoded subtitle text
- No parsing yet — everything hardcoded

**Done when:** Open browser, see Mario on a background saying "Hello World"

---

### Milestone 2: The script drives the scene

**Outcome:** A `.foreigners` file controls what appears on screen.

- FSL parser built (hand-written, handles MVP syntax)
- Server parses script on startup, serves to browser
- Browser reads parsed script, renders first line
- Manual "next line" button advances through script
- Character + emotion changes based on script

**Done when:** Edit the script, refresh, see different content

---

### Milestone 3: Assets are discovered, not hardcoded

**Outcome:** Drop files in folders, system finds them.

- Server scans asset folders on startup
- Builds inventory: which characters exist, which emotions each has, which audio clips
- Parser validates script against inventory (warns if emotion doesn't exist)
- Browser uses discovered assets

**Done when:** Add a new emotion folder with video/audio, it appears as an option

---

### Milestone 4: Characters talk to each other

**Outcome:** Two characters, conversation shot, speaker switches.

- Canvas renders two characters (speaker in focus, non-speaker blurred)
- When speaker changes, visuals update
- Subtitle shows current line
- Still manual advancement

**Done when:** Click through a two-person dialogue, see speaker swap back and forth

---

### Milestone 5: They have voices

**Outcome:** Gibberish audio plays for each line.

- Audio clips loaded for each character's emotions
- Duration estimated from text length
- Clips selected and sequenced to fill duration
- Small gaps between clips for natural rhythm

**Done when:** Each line has gibberish audio that roughly matches the subtitle length

---

### Milestone 6: It plays itself (First Life)

**Outcome:** Press play, watch the whole scene unfold automatically.

- Automatic advancement: line completes → next line starts
- Timing synced: video emotion, audio playback, subtitle display
- Hot reload: save script, browser updates

**Done when:** Write a script, save it, watch it play in the browser — **THIS IS FIRST LIFE**

---

## Open Questions

*To be resolved through building, not planning:*

1. **Conversation shot layout:** Exact positioning, scale, blur amount for speaker vs. non-speaker. Will figure out through experimentation once we have real assets.

2. **Gibberish timing algorithm:** Exact formula for text length → audio duration. Start simple (word count × constant), refine based on how it feels.

3. **Asset consistency:** How much visual consistency is needed across recordings? Trust design instincts for now.

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
