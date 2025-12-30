# Agent Guidelines

> Concise instructions for AI coding assistants working on Foreigners.

## Project

**Foreigners** — A lo-fi sitcom engine. Scripts (FSL) → Parser → Timeline → Previewer → Export.

## Structure

```
tools/parser/     # FSL → JSON events
tools/previewer/  # Timeline playback with Web Audio
episodes/         # .episode script files
assets/           # characters/{name}/states/{state}/audio|video/
launchpad/        # Specs and principles (detailed docs)
docs/             # FSL syntax, timeline approaches
```

## Commands

```bash
# Serve previewer (from project root)
python3 -m http.server 8001

# Regenerate asset manifest
node tools/generate-manifest.js
```

## Principles (Concise)

1. **Justify existence** — Build only what serves the goal. No "just in case."
2. **Chosen flexibility** — Hardcode unless you can name the future change.
3. **Deepen, don't multiply** — Extend existing > create parallel.
4. **Know the whole** — Understand connections before changing parts.
5. **Always works** — Missing assets limit options, never block.
6. **Additive only** — Never break old content.
7. **Speed to interesting** — Early wins > perfect architecture.
8. **Constraints as style** — Limitations are the aesthetic.

## Git Workflow

**Don't auto-commit every turn.** Instead:
- Commit at meaningful progress points (feature complete, bug fixed, refactor done)
- **Ask before committing** — "This looks like a good checkpoint. Want me to commit?"
- Group related changes into single commits
- Use clear commit messages: `feat:`, `fix:`, `refactor:`, `docs:`

## Allowed Without Asking

- Read/search files
- Run local dev server
- Run lints, format code
- Make code changes discussed in conversation

## Ask First

- `git commit` / `git push`
- Install new packages
- Delete files
- Major refactors affecting multiple systems
- Creating new top-level directories

