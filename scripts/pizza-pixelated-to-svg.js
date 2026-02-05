#!/usr/bin/env node
/**
 * Converts pizza-delivery pixelated PNG to SVG with pink bg + white rects.
 * Usage: node pizza-pixelated-to-svg.js <blocks> <input.png> <output.svg>
 * Example: node pizza-pixelated-to-svg.js 720 input.png output.svg
 */
const fs = require('fs');
const { execSync } = require('child_process');
const path = require('path');

const blocks = parseInt(process.argv[2], 10) || 720;
const inputPath = path.resolve(process.argv[3] || 'assets/brand/pizza-delivery/pizza-delivery-outline-white-on-pink.png');
const outputPath = path.resolve(process.argv[4] || 'assets/brand/pizza-delivery/pizza-delivery-outline-white-on-pink-pixelated.svg');

// Resize to blocks x blocks, output raw RGBA (white outline = bright pixels)
const rawPath = path.join(path.dirname(outputPath), '.pizza-pixel-raw.bin');
try {
  execSync(`magick "${inputPath}" -resize ${blocks}x${blocks} -depth 8 rgba:"${rawPath}"`, {
    stdio: 'inherit'
  });
} catch (e) {
  process.exit(1);
}

const buf = fs.readFileSync(rawPath);
fs.unlinkSync(rawPath);

const vb = 800;
const cell = vb / blocks;
const rects = [];

for (let y = 0; y < blocks; y++) {
  for (let x = 0; x < blocks; x++) {
    const i = (y * blocks + x) * 4;
    const r = buf[i];
    const g = buf[i + 1];
    const b = buf[i + 2];
    const gray = (r + g + b) / 3;
    if (gray >= 250) {
      rects.push({ x, y });
    }
  }
}

const rectStr = rects.map(({ x, y }) => `<rect x="${x * cell}" y="${y * cell}" width="${cell}" height="${cell}"/>`).join('\n');
const svg = `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${vb} ${vb}" preserveAspectRatio="xMidYMid meet" role="img" aria-label="Pizza delivery logo (pixelated)">
<rect width="${vb}" height="${vb}" fill="#f8b4d9"/>
<g fill="#fff" stroke="none">
${rectStr}
</g>
</svg>`;

fs.writeFileSync(outputPath, svg);
console.log(`Wrote ${outputPath} (${rects.length} rects, ${blocks}x${blocks} blocks)`);
