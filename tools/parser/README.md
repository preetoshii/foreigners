# FSL Parser

The parser converts FSL (Foreigners Scripting Language) scripts into a flat stream of events that the playback engine can consume.

---

## Usage

```javascript
// In browser, include parser.js first
const result = parse(fslText);
console.log(result.seed);    // number or null
console.log(result.events);  // array of events
```

---

## Input

Plain text FSL script:

```fsl
seed: 12345

@rainbow-cafe

mario: Hey Luigi.
luigi: [happy] Hey!
mario: [curious] What's up? [concerned] You okay?
luigi: [sad] [...]
```

---

## Output

JSON structure with a flat event stream:

```json
{
  "seed": 12345,
  "events": [
    { "type": "location", "location": "rainbow-cafe" },
    { "type": "text", "character": "mario", "state": "neutral", "text": "Hey Luigi." },
    { "type": "text", "character": "luigi", "state": "happy", "text": "Hey!" },
    { "type": "text", "character": "mario", "state": "curious", "text": "What's up?" },
    { "type": "text", "character": "mario", "state": "concerned", "text": "You okay?" },
    { "type": "pause", "character": "luigi", "state": "sad" }
  ]
}
```

---

## Event Types

### `location`

Sets the current location for the scene.

```json
{ "type": "location", "location": "rainbow-cafe" }
```

### `text`

A piece of dialogue to display and vocalize.

```json
{ 
  "type": "text", 
  "character": "mario", 
  "state": "happy", 
  "text": "Hello there!" 
}
```

### `pause`

A silent beat — character is visible in their state but doesn't speak.

```json
{ 
  "type": "pause", 
  "character": "luigi", 
  "state": "sad" 
}
```

### `shot` (Future)

Changes the camera framing.

```json
{ "type": "shot", "shot": "single" }
```

---

## Design Decisions

### Why Flat Events?

We considered nested structures (dialogue lines containing segments) but chose flat events because:

1. **Simpler consumer** — The playback engine just iterates through events in order. No nested loops.

2. **Each event is self-contained** — Has all the context it needs (character, state, text).

3. **Easier to extend** — Adding new event types (pause, shot, sfx) just adds to the stream.

4. **Natural timeline** — Events are ordered. The array index *is* the sequence.

### State Stickiness

The parser tracks each character's last state. If a line has no `[state]` tag, the character continues with their previous state. Default is `"neutral"`.

This means the consumer doesn't need to track state — each event already has the correct state attached.

### Mid-Line State Changes

A single FSL line can produce multiple events:

```fsl
mario: [happy] Hey! [sad] What's wrong?
```

Becomes:

```json
{ "type": "text", "character": "mario", "state": "happy", "text": "Hey!" },
{ "type": "text", "character": "mario", "state": "sad", "text": "What's wrong?" }
```

The parser splits on `[...]` tags and emits separate events.

### Seeded Randomness

The `seed` value is preserved in the output for the playback engine to use. Same seed = same random choices (audio start points, etc.) = deterministic playback.

---

## Testing

Open `index.html` in a browser (serve the folder with any static server):

```bash
cd tools/parser
python3 -m http.server 8080
# Open http://localhost:8080
```

Left pane: FSL input
Right pane: JSON output

Auto-parses on input change.

---

## Files

| File | Purpose |
|------|---------|
| `parser.js` | The parser (pure function, no dependencies) |
| `main.js` | Wires up the tester UI |
| `index.html` | Tester interface |

