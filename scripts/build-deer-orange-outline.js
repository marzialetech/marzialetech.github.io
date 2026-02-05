#!/usr/bin/env node
/**
 * Builds hunter orange deer with black outline.
 * Uses raster compositing: dilate shape for outline, then composite.
 *
 * Output:
 *   deer/deer-orange-outline.svg (for reference; PNG is authoritative)
 *   deer/deer-orange-400dpi.png
 *   (copied to) 400dpi/deer-orange-400dpi.png
 *
 * Run: node scripts/build-deer-orange-outline.js
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const ROOT = path.join(__dirname, '..');
const DEER_BLACK_SVG = path.join(ROOT, 'assets/brand/deer/deer-black.svg');
const DEER_DIR = path.join(ROOT, 'assets/brand/deer');
const DPI_DIR = path.join(ROOT, 'assets/brand/400dpi');
const DPI = 400;

// Dilate radius for outline (pixels at 400 DPI). 40 gives clearly visible outline.
const OUTLINE_DILATE = 40;

function run(cmd) {
  execSync(cmd, { stdio: 'pipe' });
}

const tmpDir = path.join(ROOT, 'scripts', '_tmp_deer_orange');
if (!fs.existsSync(tmpDir)) fs.mkdirSync(tmpDir, { recursive: true });

const deerPng = path.join(tmpDir, 'deer-400.png');
const deerMask = path.join(tmpDir, 'deer-mask.png');
const deerOutlineMask = path.join(tmpDir, 'deer-outline-mask.png');
const deerOutlinePng = path.join(tmpDir, 'deer-outline-400.png');
const deerOrangePng = path.join(tmpDir, 'deer-orange-400.png');

console.log('Building hunter orange deer with black outline (raster compositing)...\n');

// 1. Render deer at 400 DPI
run(`magick -density ${DPI} -background none "${DEER_BLACK_SVG}" "${deerPng}"`);

// 2. Get dimensions and add padding for outline
const identify = execSync(`magick identify -format "%w %h" "${deerPng}"`, { encoding: 'utf8' });
const [origW, origH] = identify.trim().split(' ').map(Number);
const PAD = OUTLINE_DILATE + 10; // Extra padding beyond dilate radius
const W = origW + PAD * 2;
const H = origH + PAD * 2;
console.log(`  Original: ${origW}x${origH}, Padded: ${W}x${H}`);

// 2b. Extend canvas with transparent padding
const deerPadded = path.join(tmpDir, 'deer-padded.png');
run(`magick "${deerPng}" -gravity center -background none -extent ${W}x${H} "${deerPadded}"`);

// 3. Extract mask from padded image (white where deer, black elsewhere)
run(`magick "${deerPadded}" -alpha extract "${deerMask}"`);

// 4. Dilate mask for outline
run(`magick "${deerMask}" -morphology Dilate Diamond:${OUTLINE_DILATE} "${deerOutlineMask}"`);

// 5. Create black outline PNG (solid black canvas + dilated mask as alpha)
run(`magick -size ${W}x${H} xc:black "${deerOutlineMask}" -compose CopyOpacity -composite "${deerOutlinePng}"`);

// 6. Create orange deer PNG (solid orange canvas + original mask as alpha)
run(`magick -size ${W}x${H} "xc:#FF6600" "${deerMask}" -compose CopyOpacity -composite "${deerOrangePng}"`);

// 7. Composite: orange first, outline behind (DstOver puts second image behind first)
const pngOut = path.join(DEER_DIR, 'deer-orange-400dpi.png');
run(`magick "${deerOrangePng}" "${deerOutlinePng}" -compose DstOver -composite "${pngOut}"`);
console.log('  deer-orange-400dpi.png');

// 8. Copy to 400dpi folder
fs.copyFileSync(pngOut, path.join(DPI_DIR, 'deer-orange-400dpi.png'));
console.log('  Copied to 400dpi/deer-orange-400dpi.png');

// 9. Keep SVG for reference
const deerSvg = fs.readFileSync(DEER_BLACK_SVG, 'utf8');
const viewBoxMatch = deerSvg.match(/viewBox="([^"]*)"/);
const deerViewBox = viewBoxMatch ? viewBoxMatch[1] : '0 0 1332.7773 1293.1544';
const [,, vw, vh] = deerViewBox.split(/\s+/).map(Number);
const mainPathMatch = deerSvg.match(/<path\s+[^>]*d="[^"]*"[^>]*\/>/);
const gMatch = deerSvg.match(/<g[^>]*transform="([^"]*)"[^>]*>([\s\S]*?)<\/g>/);
let deerContent = '';
if (mainPathMatch && gMatch) {
  deerContent = mainPathMatch[0] + `\n  <g transform="${gMatch[1]}">\n    ${gMatch[2]}\n  </g>`;
} else if (gMatch) {
  deerContent = `<g transform="${gMatch[1]}">${gMatch[2]}</g>`;
}
const pathsNoStyle = deerContent.replace(/\s+style="[^"]*"/g, '');
const svgOut = path.join(DEER_DIR, 'deer-orange-outline.svg');
const outputSvg = `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg"
  width="${vw}" height="${vh}" viewBox="${deerViewBox}" preserveAspectRatio="xMidYMid meet">
<g fill="#FF6600" stroke="#000" stroke-width="24" stroke-linejoin="round">
${pathsNoStyle}
</g>
</svg>`;
fs.writeFileSync(svgOut, outputSvg, 'utf8');

// Cleanup
[deerPng, deerPadded, deerMask, deerOutlineMask, deerOutlinePng, deerOrangePng].forEach(p => {
  if (fs.existsSync(p)) fs.unlinkSync(p);
});
try { fs.rmdirSync(tmpDir); } catch (_) {}

console.log('\nDone. Hunter orange deer with black outline.');
