#!/usr/bin/env node
/**
 * Process "stay on your feet!" logo (black text on white):
 * 1. Black on transparent PNG
 * 2. White on transparent PNG
 * 3. Black on transparent SVG (potrace)
 * 4. White on transparent SVG (potrace)
 * Requires: ImageMagick (magick), potrace.
 * Run: node build-feet.js [source.png]
 */
const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const scriptDir = path.resolve(__dirname);
const repoRoot = path.join(scriptDir, '..');
const assetsDir = path.join(repoRoot, 'assets', 'brand');

const defaultSource = 'image-68ec4170-f943-4b69-a4bf-6ef0a6ee6698.png';
const sourceArg = process.argv[2] || defaultSource;

const cursorAssets = path.join(process.env.HOME || '', '.cursor', 'projects', 'Users-jjmarzia-marzialetech-github-io', 'assets');
const sourcePath = fs.existsSync(sourceArg)
  ? path.resolve(sourceArg)
  : path.join(cursorAssets, path.basename(sourceArg));

if (!fs.existsSync(sourcePath)) {
  console.error('Source not found:', sourcePath);
  process.exit(1);
}

const blackPng = path.join(assetsDir, 'feet-black.png');
const whitePng = path.join(assetsDir, 'feet-white.png');
const blackSvg = path.join(assetsDir, 'feet-black.svg');
const whiteSvg = path.join(assetsDir, 'feet-white.svg');
const pbmPath = path.join(scriptDir, '_tmp_feet.pbm');
const maskPath = path.join(scriptDir, '_tmp_feet_mask.png');

// 1. Extract mask: black text on white bg → threshold gives black shape, negate for white=text
console.log('1. Extracting mask...');
execSync(`magick "${sourcePath}" -colorspace gray -threshold 50% -negate "${maskPath}"`, { stdio: 'inherit' });

// 2. Black on transparent: pure #000 where mask is white, transparent where black
console.log('2. Creating black-on-transparent PNG...');
execSync(`magick "${maskPath}" -background black -alpha shape "${blackPng}"`, { stdio: 'inherit' });

// 3. White on transparent: pure #fff where mask is white, transparent where black
console.log('3. Creating white-on-transparent PNG...');
execSync(`magick "${maskPath}" -background white -alpha shape "${whitePng}"`, { stdio: 'inherit' });

// 4. Black SVG via potrace
console.log('4. Creating black-on-transparent SVG (potrace)...');
execSync(`magick "${blackPng}" -background white -flatten -colorspace gray -threshold 50% "${pbmPath}"`, { stdio: 'inherit' });
execSync(`potrace "${pbmPath}" -s -o "${blackSvg}"`, { stdio: 'inherit' });
let svg = fs.readFileSync(blackSvg, 'utf8');
svg = svg.replace(/fill="#?[^"]*"/gi, 'fill="#000"');
fs.writeFileSync(blackSvg, svg, 'utf8');

// 5. White SVG via potrace
console.log('5. Creating white-on-transparent SVG (potrace)...');
execSync(`magick "${whitePng}" -background black -flatten -negate -colorspace gray -threshold 50% "${pbmPath}"`, { stdio: 'inherit' });
execSync(`potrace "${pbmPath}" -s -o "${whiteSvg}"`, { stdio: 'inherit' });
svg = fs.readFileSync(whiteSvg, 'utf8');
svg = svg.replace(/fill="#?[^"]*"/gi, 'fill="#fff"');
fs.writeFileSync(whiteSvg, svg, 'utf8');

if (fs.existsSync(pbmPath)) fs.unlinkSync(pbmPath);
if (fs.existsSync(maskPath)) fs.unlinkSync(maskPath);

console.log('Done.');
console.log('  ', blackPng);
console.log('  ', whitePng);
console.log('  ', blackSvg);
console.log('  ', whiteSvg);
