#!/usr/bin/env node
/**
 * Process metal-band (MARZIALE gothic) logo:
 * 1. Black on transparent PNG (remove white bg)
 * 2. White on transparent PNG
 * 3. Black on transparent SVG (potrace)
 * 4. White on transparent SVG (potrace)
 * 5. Outline white-on-pink (base + thick) and white-on-black (2x thick) PNG and SVG
 * Requires: ImageMagick (magick), potrace.
 * Run: node build-metal-band.js [source.png]
 */
const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const scriptDir = path.resolve(__dirname);
const repoRoot = path.join(scriptDir, '..');
const assetsDir = path.join(repoRoot, 'assets', 'brand');
const metalBandDir = path.join(assetsDir, 'metal-band');

const defaultSource = '32280345-8BE8-43F9-82AD-0E6FE020C430-5487a398-d1c2-4464-bce2-58445f318bbb.png';
const sourceArg = process.argv[2] || defaultSource;

const cursorAssets = path.join(process.env.HOME || '', '.cursor', 'projects', 'Users-jjmarzia-marzialetech-github-io', 'assets');
const sourcePath = fs.existsSync(sourceArg)
  ? path.resolve(sourceArg)
  : path.join(cursorAssets, path.basename(sourceArg));

if (!fs.existsSync(sourcePath)) {
  console.error('Source not found:', sourcePath);
  process.exit(1);
}

const blackPng = path.join(metalBandDir, 'metal-band-black.png');
const whitePng = path.join(metalBandDir, 'metal-band-white.png');
const blackSvg = path.join(metalBandDir, 'metal-band-black.svg');
const whiteSvg = path.join(metalBandDir, 'metal-band-white.svg');
const pbmPath = path.join(scriptDir, '_tmp_marziale.pbm');
const maskPath = path.join(scriptDir, '_tmp_marziale_mask.png');
const outlinePath = path.join(scriptDir, '_tmp_marziale_outline.png');
const PINK = '#f8b4d9';
const BLACK = '#000';

// 1. Extract mask: black text on white bg → threshold gives black shape, negate for white=text
console.log('1. Extracting mask...');
execSync(`magick "${sourcePath}" -colorspace gray -threshold 50% -negate "${maskPath}"`, { stdio: 'inherit' });

// 2. Black on transparent: pure #000 where mask is white, transparent where black
console.log('2. Creating black-on-transparent PNG (pure black)...');
execSync(`magick "${maskPath}" -background black -alpha shape "${blackPng}"`, { stdio: 'inherit' });

// 3. White on transparent: pure #fff where mask is white, transparent where black
console.log('3. Creating white-on-transparent PNG (pure white)...');
execSync(`magick "${maskPath}" -background white -alpha shape "${whitePng}"`, { stdio: 'inherit' });

// 4. Black SVG via potrace (need black on white for potrace)
console.log('4. Creating black-on-transparent SVG (potrace)...');
execSync(`magick "${blackPng}" -background white -flatten -colorspace gray -threshold 50% "${pbmPath}"`, { stdio: 'inherit' });
execSync(`potrace "${pbmPath}" -s -o "${blackSvg}"`, { stdio: 'inherit' });
let svg = fs.readFileSync(blackSvg, 'utf8');
svg = svg.replace(/fill="#?[^"]*"/gi, 'fill="#000"');
fs.writeFileSync(blackSvg, svg, 'utf8');

// 5. White SVG via potrace (white shape = negate first for potrace)
console.log('5. Creating white-on-transparent SVG (potrace)...');
execSync(`magick "${whitePng}" -background black -flatten -negate -colorspace gray -threshold 50% "${pbmPath}"`, { stdio: 'inherit' });
execSync(`potrace "${pbmPath}" -s -o "${whiteSvg}"`, { stdio: 'inherit' });
svg = fs.readFileSync(whiteSvg, 'utf8');
svg = svg.replace(/fill="#?[^"]*"/gi, 'fill="#fff"');
fs.writeFileSync(whiteSvg, svg, 'utf8');

// 6. Outline extraction (EdgeOut) - same as pizza
console.log('6. Extracting outline...');
execSync(`magick "${maskPath}" -morphology EdgeOut Diamond "${outlinePath}"`, { stdio: 'inherit' });

// 7. White outline on transparent
const outlineWhitePng = path.join(metalBandDir, 'metal-band-outline-white.png');
const outlineWhiteSvg = path.join(metalBandDir, 'metal-band-outline-white.svg');
const outlineWhite400dpi = path.join(metalBandDir, 'metal-band-outline-white-400dpi.png');
execSync(`magick "${outlinePath}" -background white -alpha shape "${outlineWhitePng}"`, { stdio: 'inherit' });

// 7b. Outline-white SVG (pixel-perfect) + 400 DPI PNG
const pixelSvgScript = path.join(scriptDir, 'png-to-pixel-svg.js');
console.log('7b. Creating outline-white SVG and 400DPI PNG...');
execSync(`node "${pixelSvgScript}" "${outlineWhitePng}" "${outlineWhiteSvg}"`, { stdio: 'inherit', env: { ...process.env, FILL: '#fff' } });
try {
  const tmpPath = outlineWhite400dpi.replace(/\.png$/, '-tmp.png');
  execSync(`magick -density 400 -background none "${outlineWhiteSvg}" "${tmpPath}"`, { stdio: 'pipe' });
  execSync(`magick "${tmpPath}" -morphology Dilate "Diamond:6" -background none "${outlineWhite400dpi}"`, { stdio: 'pipe' });
  try { fs.unlinkSync(tmpPath); } catch (_) {}
  console.log('  400 DPI:', outlineWhite400dpi);
} catch (e) {
  console.warn('  (400 DPI PNG skip)');
}

// 7c. Outline-black 400 DPI: negate white outline
const outlineBlack400dpi = path.join(metalBandDir, 'metal-band-outline-black-400dpi.png');
const dpiDir = path.join(assetsDir, '400dpi');
if (fs.existsSync(outlineWhite400dpi)) {
  console.log('7c. Creating outline-black 400 DPI (negate white)...');
  execSync(`magick "${outlineWhite400dpi}" -channel RGB -negate +channel "${outlineBlack400dpi}"`, { stdio: 'pipe' });
  if (fs.existsSync(dpiDir)) {
    fs.copyFileSync(outlineBlack400dpi, path.join(dpiDir, 'metal-band-outline-black-400dpi.png'));
  }
  console.log('  400 DPI:', outlineBlack400dpi);
}

// 8. Base white-on-pink (no dilate) - same as pizza-delivery-outline-white-on-pink
console.log('7. Creating white-on-pink PNG (base)...');
const whiteOnPinkPng = path.join(metalBandDir, 'metal-band-outline-white-on-pink.png');
execSync(`magick "${outlineWhitePng}" -background "${PINK}" -flatten "${whiteOnPinkPng}"`, { stdio: 'inherit' });

// 9. Thick white-on-pink (Dilate Diamond:0.5) - same as pizza-delivery-outline-white-on-pink-thick
console.log('8. Creating white-on-pink-thick PNG...');
const whiteOnPinkThickPng = path.join(metalBandDir, 'metal-band-outline-white-on-pink-thick.png');
execSync(`magick "${outlineWhitePng}" -morphology Dilate "Diamond:0.5" -background "${PINK}" -flatten "${whiteOnPinkThickPng}"`, { stdio: 'inherit' });

// 10. Base white-on-pink SVG
console.log('9. Creating white-on-pink SVG (base)...');
const whiteOnPinkSvg = path.join(metalBandDir, 'metal-band-outline-white-on-pink.svg');
execSync(`magick "${outlineWhitePng}" -background black -flatten -negate -colorspace gray -threshold 50% "${pbmPath}"`, { stdio: 'inherit' });
execSync(`potrace "${pbmPath}" -s -o "${whiteOnPinkSvg}"`, { stdio: 'inherit' });
svg = fs.readFileSync(whiteOnPinkSvg, 'utf8');
svg = svg.replace(/fill="#?[^"]*"/gi, 'fill="#fff"');
const viewBoxMatch = svg.match(/viewBox="([^"]+)"/);
const [x, y, w, h] = viewBoxMatch ? viewBoxMatch[1].split(/\s+/).map(Number) : [0, 0, 1200, 800];
svg = svg.replace(/<svg([^>]*)>/, `<svg$1>\n<rect x="${x}" y="${y}" width="${w}" height="${h}" fill="${PINK}"/>`);
fs.writeFileSync(whiteOnPinkSvg, svg, 'utf8');

// 11. Thick white-on-pink SVG
console.log('10. Creating white-on-pink-thick SVG...');
const whiteOnPinkThickSvg = path.join(metalBandDir, 'metal-band-outline-white-on-pink-thick.svg');
execSync(`magick "${outlineWhitePng}" -morphology Dilate "Diamond:0.5" -background black -flatten -negate -colorspace gray -threshold 50% "${pbmPath}"`, { stdio: 'inherit' });
execSync(`potrace "${pbmPath}" -s -o "${whiteOnPinkThickSvg}"`, { stdio: 'inherit' });
svg = fs.readFileSync(whiteOnPinkThickSvg, 'utf8');
svg = svg.replace(/fill="#?[^"]*"/gi, 'fill="#fff"');
const viewBoxMatch2 = svg.match(/viewBox="([^"]+)"/);
const [x2, y2, w2, h2] = viewBoxMatch2 ? viewBoxMatch2[1].split(/\s+/).map(Number) : [0, 0, 1200, 800];
svg = svg.replace(/<svg([^>]*)>/, `<svg$1>\n<rect x="${x2}" y="${y2}" width="${w2}" height="${h2}" fill="${PINK}"/>`);
fs.writeFileSync(whiteOnPinkThickSvg, svg, 'utf8');

// 12. White outline on black, 2x thickness (Dilate Diamond:1.0 = 2x Diamond:0.5)
console.log('11. Creating white-on-black PNG (2x thick)...');
const whiteOnBlackPng = path.join(metalBandDir, 'metal-band-outline-white-on-black.png');
execSync(`magick "${outlineWhitePng}" -morphology Dilate "Diamond:1.0" -background "${BLACK}" -flatten "${whiteOnBlackPng}"`, { stdio: 'inherit' });

// 13. White-on-black SVG
console.log('12. Creating white-on-black SVG...');
const whiteOnBlackSvg = path.join(metalBandDir, 'metal-band-outline-white-on-black.svg');
execSync(`magick "${outlineWhitePng}" -morphology Dilate "Diamond:1.0" -background black -flatten -negate -colorspace gray -threshold 50% "${pbmPath}"`, { stdio: 'inherit' });
execSync(`potrace "${pbmPath}" -s -o "${whiteOnBlackSvg}"`, { stdio: 'inherit' });
svg = fs.readFileSync(whiteOnBlackSvg, 'utf8');
svg = svg.replace(/fill="#?[^"]*"/gi, 'fill="#fff"');
const viewBoxMatch3 = svg.match(/viewBox="([^"]+)"/);
const [x3, y3, w3, h3] = viewBoxMatch3 ? viewBoxMatch3[1].split(/\s+/).map(Number) : [0, 0, 1200, 800];
svg = svg.replace(/<svg([^>]*)>/, `<svg$1>\n<rect x="${x3}" y="${y3}" width="${w3}" height="${h3}" fill="${BLACK}"/>`);
fs.writeFileSync(whiteOnBlackSvg, svg, 'utf8');

[ pbmPath, maskPath, outlinePath ].forEach(p => { if (fs.existsSync(p)) fs.unlinkSync(p); });

console.log('Done.');
console.log('  Filled:', blackPng, whitePng, blackSvg, whiteSvg);
console.log('  White-on-pink:', whiteOnPinkPng, whiteOnPinkSvg);
console.log('  White-on-pink-thick:', whiteOnPinkThickPng, whiteOnPinkThickSvg);
console.log('  White-on-black (2x thick):', whiteOnBlackPng, whiteOnBlackSvg);
console.log('  400 DPI PNG: metal-band-outline-white-400dpi.png');
