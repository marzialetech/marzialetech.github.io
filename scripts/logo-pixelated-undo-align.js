#!/usr/bin/env node
/**
 * Undo the align step: restore Technologies rects to original positions/size
 * (staggered layout, original scale). Inverse of logo-pixelated-align.js transform.
 */

const fs = require('fs');
const path = require('path');

const inputPath = path.resolve(__dirname, 'logo-pixelated.svg');
const svg = fs.readFileSync(inputPath, 'utf8');

const rectRe = /<rect x="([^"]+)" y="([^"]+)" width="([^"]+)" height="([^"]+)"\/>/g;
const rects = [];
let m;
while ((m = rectRe.exec(svg)) !== null) {
  rects.push({
    x: parseFloat(m[1]),
    y: parseFloat(m[2]),
    w: parseFloat(m[3]),
    h: parseFloat(m[4])
  });
}

// Current file: left = MARZIALE (unchanged), right = Technologies (was scaled+translated)
// In aligned file Technologies starts at 620 (leftBox.maxX + gap)
const splitX = 620;
const leftRects = rects.filter(r => r.x + r.w / 2 < splitX);
const rightRects = rects.filter(r => r.x + r.w / 2 >= splitX);

// Transform constants (from align: scale = leftHeight/originalRightHeight, tx/ty for placement)
const rightCenterX = 888.33;
const rightCenterY = 461.67;
const scale = 120 / 243.33;
const tx = -126.13;
const ty = -63.34;
const cell = 10 / 3;  // original 360x240 cell size

function inverseTransform(r) {
  return {
    x: rightCenterX + (r.x - tx - rightCenterX) / scale,
    y: rightCenterY + (r.y - ty - rightCenterY) / scale,
    w: cell,
    h: cell
  };
}

const round = (v) => Math.round(v * 100) / 100;
const restoredRight = rightRects.map(inverseTransform);
const outRects = [...leftRects, ...restoredRight].sort((a, b) => (a.x - b.x) || (a.y - b.y));
const rectLines = outRects.map(r =>
  `<rect x="${round(r.x)}" y="${round(r.y)}" width="${round(r.w)}" height="${round(r.h)}"/>`
);

const newSvg = svg.replace(
  /<g fill="currentColor" stroke="none">[\s\S]*?<\/g>/,
  '<g fill="currentColor" stroke="none">\n' + rectLines.join('\n') + '\n</g>'
);

fs.writeFileSync(inputPath, newSvg, 'utf8');
console.log('Reverted logo-pixelated.svg to pre-align state (staggered, original sizes).');
