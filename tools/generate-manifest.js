/**
 * Asset Manifest Generator
 * 
 * Scans the assets folder and generates a manifest.json
 * that the previewer uses to know what files exist.
 * 
 * Run with: node tools/generate-manifest.js
 */

const fs = require('fs');
const path = require('path');

const ASSETS_DIR = path.join(__dirname, '..', 'assets');
const OUTPUT_FILE = path.join(ASSETS_DIR, 'manifest.json');

function getFilesInDir(dir, extensions) {
  if (!fs.existsSync(dir)) return [];
  return fs.readdirSync(dir)
    .filter(file => extensions.some(ext => file.endsWith(ext)))
    .map(file => file);
}

function scanCharacters() {
  const charactersDir = path.join(ASSETS_DIR, 'characters');
  if (!fs.existsSync(charactersDir)) return {};

  const characters = {};
  
  for (const charName of fs.readdirSync(charactersDir)) {
    const charPath = path.join(charactersDir, charName);
    if (!fs.statSync(charPath).isDirectory()) continue;

    const statesDir = path.join(charPath, 'states');
    if (!fs.existsSync(statesDir)) continue;

    characters[charName] = { states: {} };

    for (const stateName of fs.readdirSync(statesDir)) {
      const statePath = path.join(statesDir, stateName);
      if (!fs.statSync(statePath).isDirectory()) continue;

      const audioDir = path.join(statePath, 'audio');
      const videoDir = path.join(statePath, 'video');

      characters[charName].states[stateName] = {
        audio: getFilesInDir(audioDir, ['.wav', '.mp3', '.ogg']),
        video: getFilesInDir(videoDir, ['.webm', '.mp4'])
      };
    }
  }

  return characters;
}

function generateManifest() {
  const manifest = {
    generated: new Date().toISOString(),
    characters: scanCharacters()
  };

  fs.writeFileSync(OUTPUT_FILE, JSON.stringify(manifest, null, 2));
  console.log(`Manifest generated: ${OUTPUT_FILE}`);
  console.log(JSON.stringify(manifest, null, 2));
}

generateManifest();

