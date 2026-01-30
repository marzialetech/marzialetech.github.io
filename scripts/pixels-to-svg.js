#!/usr/bin/env node
/**
 * Reads ImageMagick txt:- format from stdin, outputs SVG with one rect per dark pixel.
 * Usage: magick input.png txt:- | node pixels-to-svg.js <width> <height> <viewBoxWidth> <viewBoxHeight>
 */
const args = process.argv.slice(2);
const pxW = parseInt(args[0], 10) || 48;
const pxH = parseInt(args[1], 10) || 32;
const vbW = parseInt(args[2], 10) || 1200;
const vbH = parseInt(args[3], 10) || 800;

const cellW = vbW / pxW;
const cellH = vbH / pxH;

let input = '';
process.stdin.setEncoding('utf8');
process.stdin.on('data', (chunk) => { input += chunk; });
process.stdin.on('end', () => {
  const rects = [];
  const lines = input.split('\n');
  for (const line of lines) {
    const m = line.match(/^(\d+),(\d+):\s*\((\d+)/);
    if (m) {
      const x = parseInt(m[1], 10);
      const y = parseInt(m[2], 10);
      const gray = parseInt(m[3], 10);
      if (gray < 128) {
        rects.push({ x, y });
      }
    }
  }
  const svg = `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${vbW} ${vbH}" preserveAspectRatio="xMidYMid meet" role="img">
<g fill="currentColor" stroke="none">
${rects.map(({ x, y }) => `<rect x="${x * cellW}" y="${y * cellH}" width="${cellW}" height="${cellH}"/>`).join('\n')}
</g>
</svg>`;
  process.stdout.write(svg);
});
