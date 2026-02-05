#!/usr/bin/env node
/**
 * Builds woodland camo deer variants using raster compositing (SVG patterns
 * don't render reliably in ImageMagick's delegate). Uses camo-woodland.png
 * (tiles well) or camo-woodland-6xdpi.png for higher-res output.
 *
 * - deer-camo-woodland-on-black-400dpi.png
 * - deer-camo-woodland-on-white-400dpi.png
 * - deer-orange-on-woodland-camo-400dpi.png
 *
 * Run: node scripts/build-deer-woodland-camo.js
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const ROOT = path.join(__dirname, '..');
const DEER_BLACK_SVG = path.join(ROOT, 'assets/brand/deer/deer-black.svg');
const DEER_WHITE_SVG = path.join(ROOT, 'assets/brand/deer/deer-white.svg');
const CAMO_PNG = path.join(ROOT, 'assets/brand/camo/camo-woodland.png');
const DEER_DIR = path.join(ROOT, 'assets/brand/deer');
const DPI = 400;

// Output size from deer SVG viewBox (1332.78 x 1293.15) at 400 DPI
const W = Math.round(1332.7773 * DPI / 72);
const H = Math.round(1293.1544 * DPI / 72);

const tmpDir = path.join(ROOT, 'scripts', '_tmp_woodland');
if (!fs.existsSync(tmpDir)) fs.mkdirSync(tmpDir, { recursive: true });

const deerBlackPng = path.join(tmpDir, 'deer-black-400.png');
const deerWhitePng = path.join(tmpDir, 'deer-white-400.png');
const deerOutlinePng = path.join(tmpDir, 'deer-outline-400.png');
const deerOrangePng = path.join(tmpDir, 'deer-orange-400.png');
const camoResized = path.join(tmpDir, 'camo-resized.png');

function run(cmd) {
  execSync(cmd, { stdio: 'pipe' });
}

console.log('Building woodland camo deer variants (raster compositing)...\n');

// 1. Render deer at 400 DPI
run(`magick -density ${DPI} -background none "${DEER_BLACK_SVG}" "${deerBlackPng}"`);
run(`magick -density ${DPI} -background none "${DEER_WHITE_SVG}" "${deerWhitePng}"`);

// 2. Resize camo to cover output (tile if needed)
run(`magick "${CAMO_PNG}" -resize ${W}x${H}^ -gravity center -extent ${W}x${H} "${camoResized}"`);

// 3. Camo deer on black: black bg + (camo masked by deer shape)
const camoOnBlack = path.join(DEER_DIR, 'deer-camo-woodland-on-black-400dpi.png');
run(`magick -size ${W}x${H} xc:black \\( "${camoResized}" "${deerBlackPng}" -compose CopyOpacity -composite \\) -composite "${camoOnBlack}"`);
console.log('  deer-camo-woodland-on-black-400dpi.png');

// 4. Camo deer on white
const camoOnWhite = path.join(DEER_DIR, 'deer-camo-woodland-on-white-400dpi.png');
run(`magick -size ${W}x${H} xc:white \\( "${camoResized}" "${deerBlackPng}" -compose CopyOpacity -composite \\) -composite "${camoOnWhite}"`);
console.log('  deer-camo-woodland-on-white-400dpi.png');

// 5. Orange deer on camo: camo bg + black outline + orange deer
run(`magick "${deerBlackPng}" -alpha extract -morphology Dilate Diamond:8 -background black -alpha shape "${deerOutlinePng}"`);
run(`magick "${deerWhitePng}" -alpha extract -background "#FF6600" -alpha shape "${deerOrangePng}"`);

const orangeOnCamo = path.join(DEER_DIR, 'deer-orange-on-woodland-camo-400dpi.png');
run(`magick "${camoResized}" \\( "${deerOutlinePng}" -alpha off -fill black \\) -composite \\( "${deerOrangePng}" \\) -composite "${orangeOnCamo}"`);
console.log('  deer-orange-on-woodland-camo-400dpi.png');

// 6. Regenerate SVGs (for web use - may not show camo in all viewers but structure is correct)
const deerSvg = fs.readFileSync(DEER_BLACK_SVG, 'utf8');
const viewBoxMatch = deerSvg.match(/viewBox="([^"]*)"/);
const deerViewBox = viewBoxMatch ? viewBoxMatch[1] : '0 0 1332.7773 1293.1544';
const [,, vw, vh] = deerViewBox.split(/\s+/).map(Number);
const camoBase64 = fs.readFileSync(CAMO_PNG).toString('base64');
const patternDef = `<pattern id="camoPattern" patternUnits="userSpaceOnUse" x="0" y="0" width="600" height="400">
  <image href="data:image/png;base64,${camoBase64}" x="0" y="0" width="600" height="400" preserveAspectRatio="xMidYMid slice"/>
</pattern>`;

const mainPathMatch = deerSvg.match(/<path\s+[^>]*d="[^"]*"[^>]*\/>/);
const gMatch = deerSvg.match(/<g[^>]*transform="([^"]*)"[^>]*>([\s\S]*?)<\/g>/);
let deerContent = '';
if (mainPathMatch && gMatch) {
  deerContent = mainPathMatch[0] + `\n  <g transform="${gMatch[1]}">\n    ${gMatch[2]}\n  </g>`;
} else if (gMatch) {
  deerContent = `<g transform="${gMatch[1]}">${gMatch[2]}</g>`;
}
const clipPaths = deerContent.replace(/\s+style="[^"]*"/g, ' fill="black"');
const orangePaths = deerContent.replace(/\s+style="[^"]*"/g, '');

const svgCamoOnBlack = `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink"
  width="${vw}" height="${vh}" viewBox="${deerViewBox}" preserveAspectRatio="xMidYMid meet">
<defs><clipPath id="deerClip">${clipPaths}</clipPath>${patternDef}</defs>
<rect width="${vw}" height="${vh}" fill="#000"/>
<rect width="${vw}" height="${vh}" fill="url(#camoPattern)" clip-path="url(#deerClip)"/>
</svg>`;

const svgCamoOnWhite = `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink"
  width="${vw}" height="${vh}" viewBox="${deerViewBox}" preserveAspectRatio="xMidYMid meet">
<defs><clipPath id="deerClip">${clipPaths}</clipPath>${patternDef}</defs>
<rect width="${vw}" height="${vh}" fill="#fff"/>
<rect width="${vw}" height="${vh}" fill="url(#camoPattern)" clip-path="url(#deerClip)"/>
</svg>`;

const svgOrangeOnCamo = `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink"
  width="${vw}" height="${vh}" viewBox="${deerViewBox}" preserveAspectRatio="xMidYMid meet">
<defs>${patternDef}</defs>
<rect width="${vw}" height="${vh}" fill="url(#camoPattern)"/>
<g fill="#FF6600" stroke="#000" stroke-width="32">${orangePaths}</g>
</svg>`;

fs.writeFileSync(path.join(DEER_DIR, 'deer-camo-woodland-on-black.svg'), svgCamoOnBlack);
fs.writeFileSync(path.join(DEER_DIR, 'deer-camo-woodland-on-white.svg'), svgCamoOnWhite);
fs.writeFileSync(path.join(DEER_DIR, 'deer-orange-on-woodland-camo.svg'), svgOrangeOnCamo);

// Copy to 400dpi folder
const dpiDir = path.join(ROOT, 'assets/brand/400dpi');
for (const name of ['deer-camo-woodland-on-black', 'deer-camo-woodland-on-white', 'deer-orange-on-woodland-camo']) {
  fs.copyFileSync(path.join(DEER_DIR, `${name}-400dpi.png`), path.join(dpiDir, `${name}-400dpi.png`));
}

// Cleanup
[deerBlackPng, deerWhitePng, deerOutlinePng, deerOrangePng, camoResized].forEach(p => {
  if (fs.existsSync(p)) fs.unlinkSync(p);
});
try { fs.rmdirSync(tmpDir); } catch (_) {}

console.log('\nDone. SVGs + 400 DPI PNGs written. PNGs use raster compositing (camo visible).');
