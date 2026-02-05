#!/usr/bin/env node
/**
 * Creates a pixel-perfect SVG from a PNG: one <rect> per opaque pixel.
 * No smoothing, no potrace - exact pixel copy.
 *
 * Usage: node png-to-pixel-svg.js <input.png> [output.svg]
 *   input.png: black/white/any on transparent (uses alpha to detect shape)
 *   output.svg: defaults to input name with -pixel.svg suffix
 *
 * Options via env:
 *   FILL=#000  - fill color for shape (overrides per-pixel color)
 *   BACKGROUND=#f8b4d9 - draw one full rect for bg first, then only non-bg pixels (saves rects)
 *   THRESHOLD=128 - alpha threshold (default: 1, any opacity = shape)
 */
const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const inputPath = path.resolve(process.argv[2] || '');
const outputPath = process.argv[3]
  ? path.resolve(process.argv[3])
  : inputPath.replace(/\.(png|jpg|jpeg)$/i, '-pixel.svg');

if (!inputPath || !fs.existsSync(inputPath)) {
  console.error('Usage: node png-to-pixel-svg.js <input.png> [output.svg]');
  process.exit(1);
}

const fill = process.env.FILL || null; // null = use actual pixel color
const background = process.env.BACKGROUND || null; // if set, draw 1 rect for bg, then only non-bg pixels
const alphaThreshold = parseInt(process.env.THRESHOLD, 10) || 1;

// Parse background hex for comparison (e.g. #f8b4d9 -> r,g,b)
const bgRgb = background ? (() => {
  const hex = background.replace(/^#/, '');
  return [parseInt(hex.slice(0,2), 16), parseInt(hex.slice(2,4), 16), parseInt(hex.slice(4,6), 16)];
})() : null;

// Get dimensions
const identify = execSync(`magick identify -format "%w %h" "${inputPath}"`, { encoding: 'utf8' });
const [width, height] = identify.trim().split(/\s+/).map(Number);

// Read raw RGBA
const rawPath = path.join(path.dirname(outputPath), '.png-to-svg-raw.bin');
execSync(`magick "${inputPath}" -depth 8 rgba:"${rawPath}"`, { stdio: 'pipe' });
const buf = fs.readFileSync(rawPath);
fs.unlinkSync(rawPath);

const rects = [];
for (let y = 0; y < height; y++) {
  for (let x = 0; x < width; x++) {
    const i = (y * width + x) * 4;
    const r = buf[i];
    const g = buf[i + 1];
    const b = buf[i + 2];
    const a = buf[i + 3];
    if (a >= alphaThreshold) {
      const pixelFill = fill !== null
        ? fill
        : '#' + [r, g, b].map(v => v.toString(16).padStart(2, '0')).join('');
      // If BACKGROUND set, skip pixels that match it (we'll draw one full rect)
      if (bgRgb && Math.abs(r - bgRgb[0]) < 3 && Math.abs(g - bgRgb[1]) < 3 && Math.abs(b - bgRgb[2]) < 3) {
        continue; // skip background pixels
      }
      rects.push({ x, y, fill: pixelFill });
    }
  }
}

// Group by fill color for slightly smaller output
const byFill = {};
for (const r of rects) {
  const k = r.fill;
  if (!byFill[k]) byFill[k] = [];
  byFill[k].push(r);
}

let groups = Object.entries(byFill)
  .map(([fillColor, list]) => {
    const rectStr = list.map(({ x, y }) => `<rect x="${x}" y="${y}" width="1" height="1"/>`).join('\n');
    return `<g fill="${fillColor}" stroke="none">\n${rectStr}\n</g>`;
  })
  .join('\n');

// If BACKGROUND set, draw full rect first
if (background) {
  groups = `<rect width="${width}" height="${height}" fill="${background}"/>\n${groups}`;
}

const svg = `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${width} ${height}" preserveAspectRatio="xMidYMid meet">
${groups}
</svg>`;

fs.writeFileSync(outputPath, svg);
console.log(`Wrote ${outputPath} (${rects.length} pixels, ${width}x${height})`);
