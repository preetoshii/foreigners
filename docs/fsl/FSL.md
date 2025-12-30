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

These features are **not part of first life** but show where the language will grow.

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
mario: [happy] [ots] Hey, what's up?
luigi: [neutral] Not much.

mario: [frustrated] [two-shot] This affects both of us.
luigi: [sad] I know.

mario: [emotional] [single] I just... I can't do this anymore.
```

Shot types work like states — inline, can appear mid-line, sticky until changed:

```fsl
mario: [happy] [ots] Hey, what's up? [single] Listen, I need to tell you something.
```

This cuts from OTS to single shot mid-line while Mario is speaking.

**Shot types:**
- `[ots]` — Over-the-shoulder (first life default)
- `[two-shot]` — Both characters visible in profile, wide background
- `[single]` — Just the speaker, zoomed in

*Note: `[camera:]` block directives are reserved for future movement commands (pan, zoom, dolly).*

### Scene Types

```fsl
[title-card]
text: "Three weeks earlier..."
duration: 2s
background: dark

[transition]
jingle: dramatic-sting
style: fade
```

### Specific Variants

```fsl
mario: [angry:crazy-looking] I'VE HAD ENOUGH!
```

Select a specific variant instead of random selection.

### Audio Cues

```fsl
[music: tension-building]
[sfx: door-slam]
[music: stop]
```

### Pauses

```fsl
[pause: 2s]
```

Explicit timing pause.

### Narrator

```fsl
[narrator] And so, the brothers understood each other at last.
```

---

## Pattern Summary

| Pattern | Type | Example | First Life? |
|---------|------|---------|-------------|
| `# text` | Comment | `# Scene 1` | ✅ |
| `seed: NUMBER` | Seed | `seed: 42069` | ✅ |
| `@location` | Location | `@rainbow-cafe` | ✅ (single) |
| `character: text` | Dialogue | `mario: Hello!` | ✅ |
| `[state]` | Inline tag | `[happy]` | ✅ |
| `[shot]` | Inline tag | `[ots]`, `[single]` | ❌ Future |
| `...` | Silent beat | `mario: ...` | ✅ |
| `[music: X]` | Block directive | `[music: tense]` | ❌ Future |
| `[title-card]` | Block directive | `[title-card]` | ❌ Future |

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
