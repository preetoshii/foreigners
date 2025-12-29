# Foreigners

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

---

### Project-Specific Principles

These emerged from what we kept returning to — fears, motivations, and convictions that should guide every decision.

#### 5. The system always works with what exists

No asset should be *required* for the system to function. If a character only has two emotions, scenes can still be made with those two emotions. If a location has no ambient sound, it still works — just silent. Missing assets never block creation; they just limit options. The UI surfaces what's available, and that's always enough to proceed.

- **ASK:** "If this asset didn't exist, would the system still run?"

#### 6. Additions are additive, never breaking

Backwards compatibility isn't just nice-to-have — it's structural. Adding a new dimension (angles, camera moves, transitions) should *never* require going back to retrofit old content. Old scenes keep working. Old characters keep working. The system is designed for accretion: you can always add more, and the past remains intact.

- **ASK:** "Does this change require touching anything that already exists?"

#### 7. Speed to interesting results

We lose interest in long build-ups. The MVP must produce *something watchable* quickly — not polished, not complete, but *engaging*. Every architectural decision should be evaluated against this: does it get us to our first real scene faster, or slower? We can iterate and deepen once we have momentum, but momentum requires early wins.

- **ASK:** "How soon can we watch something we made?"

#### 8. Constraints as style

The system's limitations — the looping gibberish, the static poses, the simple compositions — are not bugs to be fixed later. They're the aesthetic. Lean into them. A character who only has three emotions isn't broken; they're *that character*. The lo-fi quality is the point.

- **ASK:** "Are we fighting this constraint, or featuring it?"

---

## Core Concepts

### Characters (Foreigners)

A **character** is a digital puppet — a collection of video and audio assets that can be composed into scenes.

**Video assets:**
- Recorded against a removable backdrop (green screen or similar)
- Silent footage of the character "speaking" — mouth moving, body expressing
- Organized by **emotion** (neutral, happy, sad, angry, etc.)
- Potentially organized by **angle** (front, side, 3/4, back) — but angles are optional; front-only is valid

**Audio assets:**
- Gibberish "language" unique to the character
- Phrases/sounds organized by emotion
- Short, loopable or sequenceable clips that can be strung together to match dialogue length

**Key property:** A character can exist with minimal assets (one emotion, one angle, a handful of sounds) and still be fully functional. Richness is added over time, not required upfront. The UI surfaces exactly what exists in the folders — if a character only has one angle and two emotions, those are the only options available. The system discovers capabilities from assets, not from configuration.

### Locations (Settings)

A **location** is where a scene takes place — the spatial and sonic context.

**Components:**
- **Background:** An image or video that serves as the backdrop
- **Ambience:** Optional looping audio (café chatter, wind, city noise)
- **Acoustic profile:** Optional audio processing applied to character speech (reverb, EQ) to sell the space
- **Exposition shot:** Optional exterior/establishing shot shown before entering the location (like a sitcom's "outside the building" beat)

Locations, like characters, work with whatever assets exist. A location with just a background image is valid.

### Jingles

**Jingles** are short musical phrases that can accompany exposition shots or transitions. They live in their own global pool — not tied to specific locations.

- If a jingle isn't specified, one is chosen randomly from available options
- You can override and specify a particular jingle when you want control
- This follows the general pattern: unspecified = random from what exists, specified = your choice

### Location Transitions

When the script changes location, the engine automatically handles the transition:

1. Show the new location's **exposition shot** (if one exists)
2. Play a **jingle** (random or specified)
3. Continue with dialogue in the new location

This means a location change in the script *implies* a transition moment — you don't need to manually script "show exterior, play music, then enter." The engine knows that switching from "bridge" to "rainbow-cafe" means it's time for Rainbow Cafe's establishing shot.

### Scenes

A **scene** is the fundamental unit of a script. Scenes have a **type** that determines their structure and parameters.

**Scene types:**

- **Dialogue scene** (the default): Characters at a location, speaking and emoting. This is the core of Foreigners.
- **Title card scene**: Text displayed over a background — for things like "A few moments later..." or episode titles. Parameters might include: text, background, font, duration.
- **Transition scene**: An exposition shot + jingle, marking a shift. Often auto-generated when locations change, but can be manually specified.
- **Future types**: Montage, narrator, flashback, etc. — the system is open to new scene types as needed.

For the MVP, almost every scene will be a dialogue scene. But the architecture acknowledges that scripts contain different *kinds* of moments.

**Dialogue scene structure:**
- A location
- One or more characters
- A sequence of **lines** — each line specifying:
  - Which character speaks
  - What they say (the subtitle text)
  - Their emotion (which selects the appropriate video/audio assets)
  - Optionally: angle, intensity, or other dimensions if they exist

**Behavior:**
- The engine assembles the scene by pulling the appropriate assets and compositing them
- Gibberish audio duration matches the length of the subtitle text (longer lines = longer audio)
- If a line is too long, it may be split across multiple "beats"
- Emotions can change mid-line (a character starts neutral, becomes angry)

### The Script Format

The script is written in **FSL (Foreigners Scripting Language)** — a custom DSL designed for human-writability and speed. No YAML nesting, no JSON brackets — just intuitive, typeable syntax.

**Design goals:**
- Fast to hand-write
- Easy for AI to generate ("vibe-codeable")
- Inline emotion changes without awkward structure
- Self-evident to read

**Example (this is the vibe we're going for):**

```
@rainbow-cafe

mario: [[happy]] Hey Luigi, what's up?
luigi: [[neutral]] Not much, just chilling.
mario: [[excited]] Want to go to the bridge?

@bridge

mario: [[peaceful]] Ah, nice view.
luigi: [[sad]] I miss the old days.
```

*We love how this reads — simple, fast to type, and it'll be fun to script episodes this way. This is the north star for the DSL design.*

**For full syntax documentation, see [fsl/FSL.md](fsl/FSL.md).**

Sample scripts are in `fsl/sample-scripts/`:
- `mvp.foreigners` — MVP syntax only
- `future-imagination.foreigners` — Full future vision

---

## The Experience

### For the Creator

The primary interface is **writing scripts in VS Code/Cursor** — not a custom GUI. The scripting language *is* the UI.

1. **Open a `.foreigners` file** in VS Code/Cursor. The extension activates.

2. **Write your script.** Type locations, characters, dialogue, emotions. The editor provides:
   - **Syntax highlighting** — characters, emotions, locations are color-coded
   - **Autocomplete** — as you type, it suggests available characters, emotions, locations from your asset folders
   - **Error diagnostics** — if you reference an emotion that doesn't exist, it tells you inline

3. **Preview instantly.** A preview pane (webview in VS Code, or a separate browser window watching the file) renders the scene in real-time as you type. No manual "compile" step.

4. **Iterate.** Change a line, tweak an emotion, reorder dialogue. The preview updates. The loop is fast.

5. **Export.** When satisfied, export to video. (Details TBD — possibly screen capture of preview, possibly direct render.)

**Why this approach:**
- No new UI to learn — you're already in your code editor
- Keyboard-centric, fast to type
- Vibe-codeable — AI can write scripts with you
- Autocomplete surfaces what's available without memorization
- Errors caught immediately, not at render time

**Future:** If complexity grows and a visual GUI becomes valuable (drag-and-drop scene arrangement, timeline editing), it can be built *on top of* the script format. The script remains the source of truth.

### For the Viewer

What they see is a lo-fi sitcom: characters at locations, speaking expressively in nonsense languages, with subtitles revealing the actual dialogue. It's funny. It's weird. It's weirdly compelling. The style is consistent — clearly "a Foreigners thing" — even as the stories vary wildly.

---

## Components and Parameters

A cleaner way to think about the system:

**Components** are the building blocks you create and manage:
- **Characters** — the puppets (video + audio assets)
- **Locations** — the settings (backgrounds, ambience, exposition shots)
- **Jingles** — musical stings for transitions

**Engine behaviors** (baked into code, not configured via files):
- **Shot types** — ways the engine knows how to frame a scene (e.g., conversation shot, close-up). For MVP: one shot type where the speaker is in front/focus, the other character's back is shown blurred. Automatically switches based on who's speaking.

**Parameters** are attributes that modify how components appear in a script:
- **Emotion** — how a character is feeling (selects video/audio variant)
- **Angle** — camera angle on the character (front, side, back) — *future*
- **Intensity** — subtle vs. extreme versions of emotions — *future*
- **Variant** — if multiple clips exist for the same emotion/angle, which one — *future, usually random*

**The pattern:**
- Components live in asset folders
- Parameters are specified (or omitted) in the script
- Unspecified parameters get random or default values
- Adding new parameters never breaks existing scripts — old scripts just don't use them

**Future expansions (planned seams):**
- Camera parameters (zoom, pan)
- Transition parameters (cut, fade, wipe)
- Character actions beyond speaking (walking, gesturing)
- Background music/score

Each expansion:
- Creates new asset slots or script syntax
- Surfaces new options in autocomplete (if assets exist)
- Defaults gracefully when not specified
- Never requires retrofitting old content

---

## Technical Direction

*These are signals and inclinations, not final decisions. Implementation will be detailed in a later phase.*

### Asset Format
- **Video:** WebM with alpha channel (VP9 or VP8) for transparent background videos — works natively in modern browsers
- **Audio:** Standard formats (MP3, WAV, OGG), short clips that can be sequenced
- **Organization:** Folder-based, with structure reflecting components and parameters. Multiple variants can exist at any level:

```
characters/
  mario/
    emotions/
      angry/
        front/
          pretty-upset.webm
          crazy-looking-anger.webm
          subtle-frustration.webm
        side/
          angry-side-1.webm
      happy/
        front/
          big-smile.webm
    audio/
      angry/
        phrase-1.mp3
        phrase-2.mp3
        phrase-3.mp3

locations/
  rainbow-cafe/
    background.jpg
    ambience.mp3
    exposition.mp4

jingles/
  piano-sting.mp3
  upbeat-intro.mp3
```

When multiple variants exist, the engine picks randomly unless a specific variant is specified in the script. Start with one variant per slot; add more when you want variety.

### Compositing
- **Browser-based rendering** for both preview and export — one renderer, two modes
- Preview: runs live in the browser as you write, instant feedback
- Export: same renderer, but captured cleanly via headless browser or canvas capture API
- This avoids discrepancies between preview and final output

**Export options (to be decided):**
- Real-time canvas capture (`captureStream` + `MediaRecorder`) — simpler, usually works for straightforward scenes
- Frame-by-frame capture — render each frame deliberately, stitch together; guarantees no frame drops, but more complex
- Headless browser recording (Puppeteer/Playwright) — runs the preview in controlled environment, captures video

We'll start with the simpler approach; upgrade to frame-by-frame if reliability becomes an issue.

### Audio Processing
- **Web Audio API** (or equivalent) for real-time effects like reverb based on location acoustics
- Gibberish clips sequenced and timed to match subtitle length — possibly with slight randomization for natural feel

### Editor
- **VS Code/Cursor extension** as the primary interface
- Provides syntax highlighting, autocomplete from asset folders, error diagnostics
- Hover tooltips for additional context (e.g., showing location images) — nice-to-have
- Preview via webview panel in VS Code or separate browser window watching the script file

### Preview Renderer
- Web-based (likely a simple HTML/JS app that parses the script and renders the scene)
- Uses HTML5 video/canvas for compositing, Web Audio API for sound
- Could run as VS Code webview or standalone in browser

### Randomization and Defaults
- Unspecified parameters (which angle, which gibberish clip, which variant, which jingle) are chosen randomly
- This fills in decisions without requiring explicit choices for every detail
- Creators can override any random choice by specifying it in the script

**Seed for determinism:**
- Each script has a **seed** value (explicit or auto-generated)
- The seed determines all random choices — same seed = same result every time
- This makes previews stable and reproducible
- If you don't like the random picks, change the seed or override specific choices
- The randomness is functional (filling gaps), not theatrical (surprising you each time)

---

## Open Questions

*To be resolved as we move toward implementation.*

1. **Asset consistency:** When recording new angles or emotions for an existing character, how much visual consistency is needed? Does wearing different clothes across recordings break immersion, or does the lo-fi aesthetic absorb that as "shape-shifting"? One idea: record in neutral base clothing (solid black) that could be styled/replaced later. For now, we trust our design instincts to maintain reasonable consistency, but this may need revisiting.

2. **Gibberish timing:** Resolved — simple algorithm:
   - Estimate duration from text length (character/word/syllable count → seconds)
   - Pick gibberish clips to fill that duration without going way over or under
   - Add small gaps between clips for natural breathing room
   - No fancy audio stretching needed; just selection and sequencing

3. **Folder structure:** What's the exact schema for organizing assets so the system can discover them?

4. **Export pipeline:** Leaning toward browser-based (canvas capture or headless browser recording). Real-time capture vs. frame-by-frame to be decided based on reliability needs.

5. **Script format:** YAML? JSON? Custom DSL? What's the right balance of human-readability and machine-parseability?

6. **Preview architecture:** Resolved — WebM with alpha plays natively in browsers. Layer `<video>` elements or composite on `<canvas>`. No special render step needed for preview.

7. **Multi-character scenes:** For MVP, automatic positioning — speaker in front (front view, in focus), non-speaker behind (back view, blurred). Switches based on who's speaking. Manual control and additional shot types can come later.

---

## MVP Scope

The first working version:

- **2 characters**, each with 3 emotions (front angle only)
- **2 locations**, each with at least a background image
- **The scripting language (DSL)** — defined, parseable, documented
- **Preview renderer** — browser-based, plays the scene from the script
- **Instant preview** — see your scene as you write it

**Not required for MVP:**
- VS Code extension (fast-follow — syntax highlighting first, then autocomplete)
- Export to video (comes once preview is solid)
- Multiple angles, advanced shot types, transitions

**The goal:** Make *something watchable* as fast as possible. Edit a `.foreigners` file in any text editor, open the preview, see your scene. From there, we deepen: add the extension for a better writing experience, add export, add more characters/emotions/angles. But the foundation comes first, and the foundation must produce results immediately.

---

## The Name

**Foreigners** — because the characters speak languages we don't understand, and yet we understand them completely. They're foreign to us, and we're foreign to them, and somehow, through subtitles and emotion, stories get told anyway.

It's also a little absurd. Which fits.

