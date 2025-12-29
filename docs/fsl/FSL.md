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

### Shot Types

```fsl
[[close-up]] mario: [[angry]] This is UNACCEPTABLE!
```

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

### Camera Movements

```fsl
[camera: zoom-in]
[camera: pan-left]
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
| `[[...]]` | Inline modifier | `[[happy]]`, `[[side]]`, `[[close-up]]` |
| `[...]` | Block directive | `[music: x]`, `[title-card]`, `[pause: 2s]` |
| `@...` | Location | `@rainbow-cafe` |
| `#` | Comment | `# Scene 1` |

Inline modifiers flow with dialogue. Block directives are standalone moments.

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

