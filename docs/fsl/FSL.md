# Foreigners Scripting Language (FSL)

> The scripting language for composing Foreigners episodes.

---

## Overview

FSL is a custom domain-specific language designed for:
- **Human-writability** — fast to type, intuitive to read
- **Vibe-codeability** — AI can help write it
- **Minimal ceremony** — no brackets, nesting, or boilerplate

The language prioritizes feeling like writing a screenplay, not programming.

---

## First Life vs Future

This document distinguishes between:
- **First Life Syntax** — What works in the initial implementation
- **Future Syntax** — Planned extensions (not yet implemented)

First life is intentionally minimal. We build the foundation, then expand.

---

## First Life Syntax

### Comments

```fsl
# This is a comment
# Comments are ignored by the parser
```

Lines starting with `#` are ignored.

### Seed (Optional)

```fsl
seed: 42069
```

Sets the random seed for deterministic output. Same seed = same random choices (variant selection, etc.) every time. Useful for reproducibility.

### Location Declaration

```fsl
@rainbow-cafe
```

Sets the location for the script. The location determines which background perspectives are used.

**First Life:** Scripts have **one location**. Place `@location` at the start of your script. Multi-location scripts are a future feature.

### Dialogue Lines

```fsl
mario: Hello there!
luigi: Hey, what's up?
```

Format: `character: text`

The character name must match a character folder in `assets/characters/`. Case-sensitive.

### State Tags

```fsl
mario: [happy] Hey Luigi!
luigi: [sad] I've been better.
mario: [curious] What's wrong? [concerned] You look upset.
```

- `[state]` sets the character's state (emotional expression)
- Can appear anywhere in the line
- Multiple tags in one line = state shifts mid-dialogue
- States are **sticky** — last state persists until changed

**Note:** The state name must match a state folder in the character's `states/` directory (e.g., `assets/characters/mario/states/happy/`).

### Silent Beats

```fsl
mario: [sad] ...
luigi: [thoughtful] ...
```

Use `...` as the dialogue text for a silent moment. The character displays their state but doesn't speak (no audio, no subtitle text).

---

## Grammar Summary (First Life)

| Syntax | Meaning | Required |
|--------|---------|----------|
| `# text` | Comment (ignored) | No |
| `seed: NUMBER` | Set random seed | No |
| `@location-name` | Set location | Yes (once, at start) |
| `character: text` | Dialogue line | Yes |
| `[state]` | State tag (inline) | No (defaults to neutral) |
| `...` | Silent beat (as dialogue text) | No |

---

## Behavior Rules

### State Stickiness

If a line has no `[state]` tag, the character continues with their last used state.

```fsl
mario: [happy] Great to see you!
mario: How have you been?        # Still happy
mario: [curious] What's new?     # Now curious
mario: Tell me everything.       # Still curious
```

### Default State

If a character has never had a state specified, they default to `neutral`.

```fsl
@rainbow-cafe
mario: Hey there.                # Mario is neutral (no state set yet)
mario: [happy] Good to see you!  # Now Mario is happy
luigi: What's up?                # Luigi is neutral (his first line, no state set)
```

### Mid-Line State Changes

When multiple `[state]` tags appear in one line, the state shifts at that point in the dialogue:

```fsl
luigi: [calm] I thought about it and [angry] I'm furious!
```

The character starts calm, then shifts to angry mid-line. The subtitle and audio reflect this shift.

### Shot Type (OTS)

For first life, all dialogue uses the **over-the-shoulder (OTS)** shot automatically:
- Speaker shows front-34 angle, in focus
- Non-speaker shows back-34 angle, blurred
- Background perspective matches speaker's side
- Everything swaps when speaker changes

No FSL syntax needed — OTS is the default and only shot type for first life.

---

## Future Syntax (Planned)

These features are **not part of first life** but are clearly on the roadmap.

### Multi-Location Scripts

```fsl
@rainbow-cafe
mario: [happy] Let's go to the bridge!

@bridge
mario: [peaceful] Ah, here we are.
```

When location changes, the engine will automatically show:
1. The new location's exposition shot (if it exists)
2. A jingle (randomly selected)

*Requires: exposition shots and jingles in asset folders.*

### Shot Types

```fsl
mario: [happy] [shot: ots] Hey, what's up?
luigi: [neutral] Not much.

mario: [frustrated] [shot: two-shot] This affects both of us.
luigi: [sad] I know.

mario: [emotional] [shot: single] I just... I can't do this anymore.
```

Shot types are inline (like states), can appear mid-line, and are sticky until changed:

```fsl
mario: [happy] [shot: ots] Hey, what's up? [shot: single] Listen, I need to tell you something.
```

This cuts from OTS to single shot mid-line while Mario is speaking.

**Shot types:**
- `[shot: ots]` — Over-the-shoulder (first life default)
- `[shot: two-shot]` — Both characters visible in profile, wide background
- `[shot: single]` — Just the speaker, zoomed in

The `shot:` prefix distinguishes shot tags from state tags, making parsing unambiguous.

*Note: `[camera:]` is reserved for future movement commands (pan, zoom, dolly).*

---

## Future Ideas

These are ideas we might explore later. Nothing official — just possibilities.

- **Title cards** — `[title-card] "Three weeks earlier..."` for scene headers
- **Transitions** — Fade, cut, or other transitions between scenes
- **Sound effects** — `[sfx: door-slam]`, `[sfx: drumroll]`
- **Music cues** — `[music: tense]`, `[music: stop]`
- **Pauses** — `[pause: 2s]` for explicit timing
- **Narrator** — `[narrator] And so, the brothers understood...`
- **Specific variants** — `[angry:crazy-looking]` to pick a specific asset variant
- **Camera movements** — `[camera: zoom]`, `[camera: pan-left]`

---

## Pattern Summary (First Life)

| Pattern | Type | Example |
|---------|------|---------|
| `# text` | Comment | `# Scene 1` |
| `seed: NUMBER` | Seed | `seed: 42069` |
| `@location` | Location | `@rainbow-cafe` |
| `character: text` | Dialogue | `mario: Hello!` |
| `[state]` | Inline tag | `[happy]` |
| `...` | Silent beat | `mario: ...` |

---

## Sample Scripts

See `sample-scripts/` for complete examples:
- `mvp.foreigners` — First life syntax only

---

## Open Questions

*To be resolved through building and iteration:*

1. **Exact timing of mid-line state shifts** — Where does the subtitle split? How does audio transition?
2. **Escape sequences** — What if dialogue needs literal `[` or `@`?
3. **Character aliases** — Shorthand for long character names?
4. **Include/import** — Splitting long episodes across files?

---

*This document is the source of truth for FSL syntax. It will evolve as we build.*
