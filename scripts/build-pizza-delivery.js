#!/usr/bin/env node
/**
 * Process Marziale pizza delivery logo (red on beige):
 * 1. Black/white PNG and SVG on transparent (same as feet/metal-band)
 * 2. Outline versions: outlines of the red regions only (black and white)
 * Requires: ImageMagick (magick), potrace.
 * Run: node build-pizza-delivery.js [source.png]
 */
const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const scriptDir = path.resolve(__dirname);
const repoRoot = path.join(scriptDir, '..');
const assetsDir = path.join(repoRoot, 'assets', 'brand');

const defaultSource = '0755877A-3C05-477B-9240-485127B91743-b21b7572-112e-4feb-98e9-67a81b7a0234.png';
const sourceArg = process.argv[2] || defaultSource;

const cursorAssets = path.join(process.env.HOME || '', '.cursor', 'projects', 'Users-jjmarzia-marzialetech-github-io', 'assets');
const sourcePath = fs.existsSync(sourceArg)
  ? path.resolve(sourceArg)
  : path.join(cursorAssets, path.basename(sourceArg));

if (!fs.existsSync(sourcePath)) {
  console.error('Source not found:', sourcePath);
  process.exit(1);
}

const pbmPath = path.join(scriptDir, '_tmp_pizza.pbm');
const maskPath = path.join(scriptDir, '_tmp_pizza_mask.png');
const outlinePath = path.join(scriptDir, '_tmp_pizza_outline.png');

// Beige/cream background to make transparent; red becomes the shape
const BEIGE = '#e8dcc8';
const FUZZ = 25;

const blackPng = path.join(assetsDir, 'pizza-delivery-black.png');
const whitePng = path.join(assetsDir, 'pizza-delivery-white.png');

// 1. Extract mask: red on beige → make beige transparent, alpha extract gives white=red shape, black=bg
console.log('1. Extracting mask (red regions)...');
execSync(`magick "${sourcePath}" -fuzz ${FUZZ}% -transparent "${BEIGE}" -alpha extract -threshold 20% "${maskPath}"`, { stdio: 'inherit' });

// 2. Black on transparent
console.log('2. Creating black-on-transparent PNG...');
execSync(`magick "${maskPath}" -background black -alpha shape "${blackPng}"`, { stdio: 'inherit' });

// 3. White on transparent
console.log('3. Creating white-on-transparent PNG...');
execSync(`magick "${maskPath}" -background white -alpha shape "${whitePng}"`, { stdio: 'inherit' });

// 4. Black SVG (potrace)
console.log('4. Creating black-on-transparent SVG (potrace)...');
const blackSvg = path.join(assetsDir, 'pizza-delivery-black.svg');
execSync(`magick "${blackPng}" -background white -flatten -colorspace gray -threshold 50% "${pbmPath}"`, { stdio: 'inherit' });
execSync(`potrace "${pbmPath}" -s -o "${blackSvg}"`, { stdio: 'inherit' });
let svg = fs.readFileSync(blackSvg, 'utf8');
svg = svg.replace(/fill="#?[^"]*"/gi, 'fill="#000"');
fs.writeFileSync(blackSvg, svg, 'utf8');

// 5. White SVG (potrace)
console.log('5. Creating white-on-transparent SVG (potrace)...');
const whiteSvg = path.join(assetsDir, 'pizza-delivery-white.svg');
execSync(`magick "${whitePng}" -background black -flatten -negate -colorspace gray -threshold 50% "${pbmPath}"`, { stdio: 'inherit' });
execSync(`potrace "${pbmPath}" -s -o "${whiteSvg}"`, { stdio: 'inherit' });
svg = fs.readFileSync(whiteSvg, 'utf8');
svg = svg.replace(/fill="#?[^"]*"/gi, 'fill="#fff"');
fs.writeFileSync(whiteSvg, svg, 'utf8');

// 6. Outline extraction: morphology edge on mask
console.log('6. Extracting outlines...');
execSync(`magick "${maskPath}" -morphology EdgeOut Diamond "${outlinePath}"`, { stdio: 'inherit' });

// 7. Outline black PNG
console.log('7. Creating outline-black PNG...');
const outlineBlackPng = path.join(assetsDir, 'pizza-delivery-outline-black.png');
execSync(`magick "${outlinePath}" -background black -alpha shape "${outlineBlackPng}"`, { stdio: 'inherit' });

// 8. Outline white PNG
console.log('8. Creating outline-white PNG...');
const outlineWhitePng = path.join(assetsDir, 'pizza-delivery-outline-white.png');
execSync(`magick "${outlinePath}" -background white -alpha shape "${outlineWhitePng}"`, { stdio: 'inherit' });

// 9. Outline black SVG (potrace)
console.log('9. Creating outline-black SVG (potrace)...');
const outlineBlackSvg = path.join(assetsDir, 'pizza-delivery-outline-black.svg');
execSync(`magick "${outlineBlackPng}" -background white -flatten -colorspace gray -threshold 50% "${pbmPath}"`, { stdio: 'inherit' });
execSync(`potrace "${pbmPath}" -s -o "${outlineBlackSvg}"`, { stdio: 'inherit' });
svg = fs.readFileSync(outlineBlackSvg, 'utf8');
svg = svg.replace(/fill="#?[^"]*"/gi, 'fill="#000"');
fs.writeFileSync(outlineBlackSvg, svg, 'utf8');

// 10. Outline white SVG (potrace)
console.log('10. Creating outline-white SVG (potrace)...');
const outlineWhiteSvg = path.join(assetsDir, 'pizza-delivery-outline-white.svg');
execSync(`magick "${outlineWhitePng}" -background black -flatten -negate -colorspace gray -threshold 50% "${pbmPath}"`, { stdio: 'inherit' });
execSync(`potrace "${pbmPath}" -s -o "${outlineWhiteSvg}"`, { stdio: 'inherit' });
svg = fs.readFileSync(outlineWhiteSvg, 'utf8');
svg = svg.replace(/fill="#?[^"]*"/gi, 'fill="#fff"');
fs.writeFileSync(outlineWhiteSvg, svg, 'utf8');

// Cleanup
[ pbmPath, maskPath, outlinePath ].forEach(p => { if (fs.existsSync(p)) fs.unlinkSync(p); });

console.log('Done.');
console.log('  Filled:', blackPng, whitePng, blackSvg, whiteSvg);
console.log('  Outline:', outlineBlackPng, outlineWhitePng, outlineBlackSvg, outlineWhiteSvg);
