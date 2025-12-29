# Transparent WebM on Canvas Test

A quick test to verify that WebM videos with alpha transparency render correctly on HTML5 Canvas.

## How to Test

1. **Add your test video:**
   - Place a WebM file with alpha/transparency in this folder
   - Name it `test-video.webm`
   - The video should have a transparent background (e.g., a character on green screen, keyed out)

2. **Run a local server:**
   ```bash
   # From this folder:
   npx serve .
   # or
   python3 -m http.server 8000
   ```

3. **Open in browser:**
   - Go to `http://localhost:3000` (or whatever port)
   - Click anywhere to play the video

4. **Check the result:**
   - **LEFT:** Native video playback
   - **RIGHT:** Canvas with magenta background
   - If you see **magenta showing through** the transparent areas on the canvas → ✅ IT WORKS
   - If the canvas shows a solid rectangle with no magenta → ❌ Transparency not working

## Expected Result

If transparency works, the canvas should show your video content with magenta visible wherever the video is transparent.

## After Testing

Once confirmed, delete this entire `_test-transparent-video` folder — it's not part of the project.

