#!/usr/bin/env node
/**
 * Process deer logo (antlers + MARZIALE Technologies):
 * 1. Black on transparent PNG (keep black, make non-black transparent)
 * 2. Black on transparent SVG (potrace)
 * 3. White PNG (black PNG negated)
 * 4. White SVG (potrace of white PNG)
 * Requires: ImageMagick (magick), potrace.
 * Run: node build-deer.js [source.png]
 */
const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const scriptDir = path.resolve(__dirname);
const repoRoot = path.join(scriptDir, '..');
const assetsDir = path.join(repoRoot, 'assets', 'brand');

const defaultSource = 'deer-1e254472-a421-4a53-b661-f98cdd0fa9ae.png';
const sourceArg = process.argv[2] || defaultSource;

const cursorAssets = path.join(process.env.HOME || '', '.cursor', 'projects', 'Users-jjmarzia-marzialetech-github-io', 'assets');
const sourcePath = fs.existsSync(sourceArg)
  ? path.resolve(sourceArg)
  : path.join(cursorAssets, path.basename(sourceArg));

if (!fs.existsSync(sourcePath)) {
  console.error('Source not found:', sourcePath);
  process.exit(1);
}

const blackPng = path.join(assetsDir, 'deer-black.png');
const blackSvg = path.join(assetsDir, 'deer-black.svg');
const whiteSvg = path.join(assetsDir, 'deer-white.svg');
const whitePng = path.join(assetsDir, 'deer-white.png');
const pbmPath = path.join(scriptDir, '_tmp_deer.pbm');
const maskPath = path.join(scriptDir, '_tmp_deer_mask.png');

// 1. Black on transparent: keep black, make white transparent
console.log('1. Creating black-on-transparent PNG...');
execSync(`magick "${sourcePath}" -colorspace gray -threshold 50% -negate "${maskPath}"`, { stdio: 'inherit' });
execSync(`magick "${maskPath}" -background black -alpha shape "${blackPng}"`, { stdio: 'inherit' });

// 2. Black SVG (potrace)
console.log('2. Creating black SVG...');
execSync(`magick "${blackPng}" -background white -flatten -colorspace gray -threshold 50% "${pbmPath}"`, { stdio: 'inherit' });
execSync(`potrace "${pbmPath}" -s -o "${blackSvg}"`, { stdio: 'inherit' });
let svg = fs.readFileSync(blackSvg, 'utf8');
svg = svg.replace(/fill="#?[^"]*"/gi, 'fill="#000"');
fs.writeFileSync(blackSvg, svg, 'utf8');

// 3. White PNG (black shape → white shape, keep transparent bg)
console.log('3. Creating white PNG...');
execSync(`magick "${blackPng}" -alpha extract -background white -alpha shape "${whitePng}"`, { stdio: 'inherit' });

// 4. White SVG (potrace of white PNG)
console.log('4. Creating white SVG...');
execSync(`magick "${whitePng}" -background black -flatten -negate -colorspace gray -threshold 50% "${pbmPath}"`, { stdio: 'inherit' });
execSync(`potrace "${pbmPath}" -s -o "${whiteSvg}"`, { stdio: 'inherit' });
svg = fs.readFileSync(whiteSvg, 'utf8');
svg = svg.replace(/fill="#?[^"]*"/gi, 'fill="#fff"');
fs.writeFileSync(whiteSvg, svg, 'utf8');

[ pbmPath, maskPath ].forEach(p => { if (fs.existsSync(p)) fs.unlinkSync(p); });

console.log('Done.');
console.log('  ', blackPng);
console.log('  ', blackSvg);
console.log('  ', whiteSvg);
console.log('  ', whitePng);
