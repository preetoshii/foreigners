# Tech Tests

Quick, self-contained tests to validate technical assumptions before building.

Each subfolder is a standalone test that can be run independently.

## Tests

### `transparent-webm-canvas/`
**Question:** Can we draw transparent WebM video onto HTML5 Canvas and preserve the alpha channel?

**Result:** ✅ **YES** — Works in Chrome/Firefox/Edge. The canvas correctly composites transparent video over a background.

**How to run:**
```bash
cd transparent-webm-canvas
npx serve .
```

