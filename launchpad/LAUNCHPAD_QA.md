# Foreigners — Launchpad Q&A

*Decisions made en route to first life.*

---

## Q1: Language/framework for the core system?

**Decision:** TypeScript + Vanilla (no framework)

**Rationale:**
- TypeScript for type safety, editor support, and vibe-codeability
- Vanilla (no React/Svelte/Vue) because the preview is more like a media player than a complex UI
- Working directly with DOM, `<video>`, `<canvas>`, and Web Audio API
- Keeps us close to the metal, no abstractions to fight
- If complexity grows later, we can introduce a lightweight framework (Svelte) incrementally

---

## Q2: Where does the preview run?

**Decision:** Standalone web app in browser

**Rationale:**
- Simplest to build — just a web page served locally
- Full browser DevTools for debugging during development
- Natural workflow: VS Code on one side, browser preview on the other
- No dependency on VS Code extension (which is fast-follow)
- Same preview code can later be embedded in VS Code webview with minimal changes
- Local server watches script file and hot-reloads the preview

---

## Q3: How does the preview connect to the script?

**Decision:** Static file server + browser does all the work

**Rationale:**
- Server is just a dumb file server (`npx serve .` or `python3 -m http.server`)
- No custom server code at all — zero fucking backend logic
- Browser fetches the raw `.foreigners` file, parses it in JavaScript
- All the smarts are in the browser: parsing, asset loading, rendering
- Edit script, save, refresh browser — done
- Simpler than fuck, fewer moving parts, faster to first life

---

## Q4: How do we discover assets?

**Decision:** Scan folders + watch for changes

**Rationale:**
- Folder structure *is* the configuration — no separate manifest to maintain
- Adding a new emotion = dropping a file in the right folder
- Server walks the asset directory tree, builds inventory
- Watches for changes — add assets while running, they appear immediately
- Aligns with principle: "the system works with what exists"
- No manifest to forget to update

---

## Q5: What's the exact DSL syntax?

**Decision:** Custom DSL called FSL (Foreigners Scripting Language)

**MVP Syntax:**
- `#` comments
- `seed: NUMBER` for determinism
- `@location` for scene locations
- `character: text` for dialogue
- `[[emotion]]` inline tags, can appear multiple times per line
- `...` for silent beats
- Emotion stickiness (last emotion persists)
- Default emotion is `neutral` if never specified

**Behavior:**
- Location changes auto-trigger transitions (exposition + jingle)
- Mid-line emotions shift the emotion at that point in the dialogue

**Documentation:** See [fsl/FSL.md](fsl/FSL.md) for full syntax reference.

**Sample scripts:** `fsl/sample-scripts/mvp.foreigners` and `future-imagination.foreigners`

---

## Q6: How do we parse the DSL?

**Decision:** Hand-written TypeScript parser

**Rationale:**
- FSL is simple — line-based, predictable patterns
- Each line is one of: comment, seed, location, or dialogue
- Regex handles `[[emotion]]` extraction cleanly
- No learning curve, no dependencies
- Easy to debug, easy to modify
- ~100-200 lines of TypeScript
- If complexity grows, we can swap in a grammar-based parser later

---

## Q7: Canvas compositing or layered HTML elements?

**Decision:** Canvas compositing

**Rationale:**
- Building a "video renderer" — canvas is the natural fit
- Export is trivial with `canvas.captureStream()`
- One rendering path, not two (preview and export use the same code)
- Full control over positioning and effects
- No weird edge cases where CSS and capture don't match
- Slightly more code upfront (~50-80 lines vs ~20), but cleaner architecture

---

## Q8: How do we handle the conversation shot layout?

**Decision:** Deferred — open question

**Notes:**
- MVP needs: speaker in front/focus, non-speaker behind/blurred
- Open questions: exact positioning, scale differences, blur amount, whether positions swap or stay fixed
- Will figure out through experimentation once we have assets and a working renderer
- Initial sketch: speaker right/larger/clear, non-speaker left/smaller/blurred, swap on speaker change

---

## Q9: What exactly is "first life"?

**Decision:** Defined

**First life is when you can:**
1. Write a `.foreigners` script in any text editor
2. Run a command (`npm run dev`)
3. Open a browser and see your scene rendered
4. Change the script, save, and see it update

**What you see:**
- A background image (location)
- Two characters with transparent video (mouth moving, emoting)
- Gibberish audio playing, timed to dialogue
- Subtitles showing what they're "saying"
- When speaker changes, visuals update

**NOT required for first life:**
- VS Code extension
- Export to video
- Multiple angles or shot types
- Exposition shots or transitions
- Polished UI or error handling
- Multiple locations in one script

**The "Hello World" test:**
```
@rainbow-cafe

mario: [[happy]] Hello Luigi!
luigi: [[neutral]] Hey Mario.
mario: [[excited]] Let's make a video!
```

When this produces a watchable scene with audio and subtitles — that's first life.

---

