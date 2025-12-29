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

## MVP Syntax

### Comments

```fsl
# This is a comment
# Comments are ignored by the parser
```

### Seed (Optional)

```fsl
seed: 42069
```

Sets the random seed for deterministic output. Same seed = same random choices every time.

### Location Declaration

```fsl
@rainbow-cafe
@bridge
@downtown-alley
```

Sets the current location. When location changes, the engine automatically triggers:
1. The new location's exposition shot (if it exists)
2. A jingle (random or specified)

### Dialogue Lines

```fsl
mario: Hello there!
luigi: Hey, what's up?
```

Format: `character: text`

### Emotion Tags

```fsl
mario: [[happy]] Hey Luigi!
luigi: [[sad]] I've been better.
mario: [[curious]] What's wrong? [[concerned]] You look upset.
```

- `[[emotion]]` can appear anywhere in the line
- Multiple emotions in one line = emotion shifts mid-dialogue
- Emotions are "sticky" — last emotion persists until changed

### Silent Beats

```fsl
mario: [[sad]] ...
luigi: [[thoughtful]] ...
```

Use `...` as the dialogue text for a silent moment where the character emotes but doesn't speak.

---

## Grammar Summary

| Syntax | Meaning |
|--------|---------|
| `# text` | Comment (ignored) |
| `seed: NUMBER` | Set random seed |
| `@location-name` | Set location |
| `character: text` | Dialogue line |
| `[[emotion]]` | Emotion tag (inline) |
| `...` | Silent beat |

---

## Behavior Rules

### Emotion Stickiness

If a line has no `[[emotion]]` tag, the character continues with their last used emotion.

```fsl
mario: [[happy]] Great to see you!
mario: How have you been?        # Still happy
mario: [[curious]] What's new?   # Now curious
mario: Tell me everything.       # Still curious
```

### Default Emotion

If a character has never had an emotion specified, they default to `neutral`.

### Mid-Line Emotion Changes

When multiple `[[emotion]]` tags appear in one line, the emotion shifts at that point in the dialogue:

```fsl
luigi: [[calm]] I thought about it and [[angry]] I'm furious!
```

The subtitle and audio will reflect this shift — starting calm, becoming angry.

### Location Transitions

Changing location triggers an automatic transition:

```fsl
@rainbow-cafe
mario: [[happy]] Let's go to the bridge!

@bridge
mario: [[peaceful]] Ah, here we are.
```

Between `@rainbow-cafe` and `@bridge`, the engine shows:
1. The bridge's exposition shot (exterior/establishing shot)
2. A jingle (randomly selected or specified)

---

## Future Syntax (Planned)

These features are not part of MVP but show where the language will grow.

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

### Angles

```fsl
mario: [[angry]] [[side]] I can't believe you!
luigi: [[sad]] [[front]] I'm sorry...
```

### Camera (Shot Types)

Shot types control how characters are composed on screen. The engine handles all the details — which angles to use, which background perspective to show, how to position everything.

```fsl
[camera: conversation]
mario: [[happy]] Hey, what's up?
luigi: [[neutral]] Not much.

[camera: wide]
mario: [[frustrated]] This affects both of us.
luigi: [[sad]] I know.

[camera: close-up]
mario: [[angry]] This is UNACCEPTABLE!
```

**How it works:**
- `conversation` — Speaker in focus (front-34), non-speaker blurred (back-34), background shows speaker's perspective. Auto-switches when speaker changes.
- `wide` — Both characters visible, uses wide background.
- `close-up` — Just the speaker, zoomed in.

Shot types are **baked into the engine** — each one is code that knows exactly how to composite the scene. You don't control angles directly; you control the shot, and the engine figures out the rest.

### Specific Variants

```fsl
mario: [[angry:crazy-looking]] I'VE HAD ENOUGH!
```

### Audio Cues

```fsl
[music: tension-building]
[sfx: door-slam]
[music: stop]
```

### Actions

```fsl
[action] mario walks to window
[action] luigi sits down
```

### Pauses

```fsl
[pause: 2s]
```

### Narrator

```fsl
[narrator] And so, the brothers understood each other at last.
```

---

## Pattern Summary

| Pattern | Type | Example |
|---------|------|---------|
| `[[...]]` | Inline modifier | `[[happy]]`, `[[angry:intense]]` |
| `[...]` | Block directive | `[camera: wide]`, `[music: x]`, `[title-card]` |
| `@...` | Location | `@rainbow-cafe` |
| `#` | Comment | `# Scene 1` |

Inline modifiers flow with dialogue. Block directives are standalone moments.

**Note:** Shot types use block directives (`[camera: X]`), not inline modifiers. You set the camera once and it persists until changed. The engine handles all angle and background selection automatically.

---

## Sample Scripts

See `sample-scripts/` for complete examples:
- `mvp.foreigners` — MVP syntax only
- `future-imagination.foreigners` — Full future vision

---

## Open Questions

*To be resolved through iteration:*

1. **Exact timing of mid-line emotion shifts** — where exactly does the subtitle split?
2. **Multi-character simultaneous reactions** — how to show both characters reacting at once?
3. **Escape sequences** — what if dialogue needs literal `[[` or `@`?
4. **Character aliases** — shorthand for long character names?
5. **Include/import** — splitting long episodes across files?

---

*This document will evolve as we build and iterate on the language.*

