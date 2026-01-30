#!/usr/bin/env node
/**
 * Puts "MARZIALE" and "Technologies" on the same line and same size in logo-pixelated.svg.
 * - Splits rects by x (left = MARZIALE, right = Technologies)
 * - Scales Technologies to match MARZIALE height
 * - Aligns both to same vertical center (same line)
 * - Places Technologies immediately after MARZIALE with a small gap
 */

const fs = require('fs');
const path = require('path');

const inputPath = path.resolve(__dirname, 'logo-pixelated.svg');
const outputPath = path.resolve(__dirname, 'logo-pixelated.svg');
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

// Split by x: find the gap between MARZIALE and Technologies (roughly middle)
const xs = rects.map(r => r.x).sort((a, b) => a - b);
const mid = (Math.min(...xs) + Math.max(...xs)) / 2;
const leftRects = rects.filter(r => r.x + r.w / 2 < mid);
const rightRects = rects.filter(r => r.x + r.w / 2 >= mid);

function bbox(rects) {
  if (rects.length === 0) return { minX: 0, minY: 0, maxX: 0, maxY: 0 };
  const minX = Math.min(...rects.map(r => r.x));
  const minY = Math.min(...rects.map(r => r.y));
  const maxX = Math.max(...rects.map(r => r.x + r.w));
  const maxY = Math.max(...rects.map(r => r.y + r.h));
  return { minX, minY, maxX, maxY, width: maxX - minX, height: maxY - minY };
}

const leftBox = bbox(leftRects);
const rightBox = bbox(rightRects);

const leftCenterY = (leftBox.minY + leftBox.maxY) / 2;
const rightCenterY = (rightBox.minY + rightBox.maxY) / 2;
const leftCenterX = (leftBox.minX + leftBox.maxX) / 2;
const rightCenterX = (rightBox.minX + rightBox.maxX) / 2;

// Scale Technologies so its height matches MARZIALE
const scale = leftBox.height / rightBox.height;
const gap = 20;

// MARZIALE: leave as-is
// Technologies: scale around (rightCenterX, rightCenterY), then translate so:
//   - vertical center = leftCenterY (same line)
//   - left edge of scaled Technologies = leftBox.maxX + gap
const scaledRightLeft = rightCenterX + (rightBox.minX - rightCenterX) * scale;
const tx = (leftBox.maxX + gap) - scaledRightLeft;
const ty = leftCenterY - rightCenterY;

function transformRect(r, isRight) {
  if (!isRight) return r;
  return {
    x: rightCenterX + (r.x - rightCenterX) * scale + tx,
    y: rightCenterY + (r.y - rightCenterY) * scale + ty,
    w: r.w * scale,
    h: r.h * scale
  };
}

const outRects = [];
leftRects.forEach(r => outRects.push(r));
rightRects.forEach(r => outRects.push(transformRect(r, true)));

const round = (v) => Math.round(v * 100) / 100;
const rectLines = outRects.map(r =>
  `<rect x="${round(r.x)}" y="${round(r.y)}" width="${round(r.w)}" height="${round(r.h)}"/>`
);

const newSvg = svg.replace(
  /<g fill="currentColor" stroke="none">[\s\S]*?<\/g>/,
  '<g fill="currentColor" stroke="none">\n' + rectLines.join('\n') + '\n</g>'
);

fs.writeFileSync(outputPath, newSvg, 'utf8');
console.log('Updated logo-pixelated.svg: same line, same size (MARZIALE + Technologies).');
console.log('  MARZIALE height:', leftBox.height.toFixed(1), '| Technologies scaled to match, gap:', gap);
console.log('  Left rects:', leftRects.length, '| Right rects:', rightRects.length);
