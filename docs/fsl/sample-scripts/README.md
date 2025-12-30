# Sample Scripts

Reference scripts demonstrating the Foreigners scripting language.

## Files

### `mvp.foreigners`
Uses **only MVP syntax** — what we're building first. This script should work with the initial implementation.

**Features demonstrated:**
- `# comments` — ignored by parser
- `seed: NUMBER` — deterministic randomness
- `@location` — location declarations
- `character: text` — dialogue lines
- `[[emotion]]` — emotion tags (inline)
- `[[emotion1]] text [[emotion2]] text` — mid-line emotion changes
- `...` — silent beats (emote without speaking)
- Emotion stickiness — last emotion persists until changed
- Default emotion — `neutral` if never specified

### `future-imagination.foreigners`
A **vision script** that imagines the full future syntax working together. This won't run until we implement these features, but it shows where the language can go.

**Additional features imagined:**
- `[title-card]` scenes with text/duration/background
- `[transition]` with jingle and style
- `[music:]` and `[sfx:]` audio cues
- `[shot:]` types (ots, two-shot, single)
- `[camera:]` movements (pan, zoom, dolly) — future
- `[action]` character movements
- `[pause:]` explicit timing
- `[narrator]` voiceover
- `[[emotion:variant]]` specific variant selection

---

*These scripts serve as our "quick brown fox" — comprehensive examples to test and demonstrate the language.*

