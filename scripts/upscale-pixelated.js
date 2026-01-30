#!/usr/bin/env node
/**
 * Upscales logo-pixelated.svg by 1.5x resolution.
 * Current: 240x160 grid, 5x5 cells. New: 360x240 grid, (10/3)x(10/3) cells.
 * Reads stdin or first arg, writes to stdout or second arg.
 */

const fs = require('fs');

const input = process.argv[2]
  ? fs.readFileSync(process.argv[2], 'utf8')
  : require('fs').readFileSync(0, 'utf8');

const rectRe = /<rect x="([^"]+)" y="([^"]+)" width="5" height="5"\/>/g;
const oldCells = new Set();
let m;
while ((m = rectRe.exec(input)) !== null) {
  const x = Math.round(parseFloat(m[1]));
  const y = Math.round(parseFloat(m[2]));
  const i = x / 5;
  const j = y / 5;
  oldCells.add(`${i},${j}`);
}

const OLD_W = 240;
const OLD_H = 160;
const NEW_W = 360;  // 1.5 * 240
const NEW_H = 240;  // 1.5 * 160
const VB_W = 1200;
const VB_H = 800;
const cellW = VB_W / NEW_W;
const cellH = VB_H / NEW_H;

const rects = [];
for (let nj = 0; nj < NEW_H; nj++) {
  for (let ni = 0; ni < NEW_W; ni++) {
    const oi = Math.floor(ni / 1.5);
    const oj = Math.floor(nj / 1.5);
    if (oi >= 0 && oi < OLD_W && oj >= 0 && oj < OLD_H && oldCells.has(`${oi},${oj}`)) {
      rects.push({ x: ni * cellW, y: nj * cellH });
    }
  }
}

const svg = `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${VB_W} ${VB_H}" preserveAspectRatio="xMidYMid meet" role="img" aria-label="Marziale Technologies (pixelated)">
<g fill="currentColor" stroke="none">
${rects.map(({ x, y }) => `<rect x="${x}" y="${y}" width="${cellW}" height="${cellH}"/>`).join('\n')}
</g>
</svg>
`;

if (process.argv[3]) {
  fs.writeFileSync(process.argv[3], svg, 'utf8');
  console.log('Wrote', process.argv[3], '(', rects.length, 'pixels, 1.5x resolution)');
} else {
  process.stdout.write(svg);
}
