#!/usr/bin/env node
/**
 * Process LA logo (Marziale Technologies - white text on dark blue):
 * 1. Black on transparent PNG (remove dark bg, invert to black)
 * 2. White on transparent PNG (remove dark bg, keep white)
 * 3. Black on transparent SVG (potrace)
 * 4. White on transparent SVG (potrace)
 * 5. White on navy, forest green, pink PNG and SVG
 * Requires: ImageMagick (magick), potrace.
 * Run: node build-la-logo.js [source.png]
 */
const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const scriptDir = path.resolve(__dirname);
const repoRoot = path.join(scriptDir, '..');
const assetsDir = path.join(repoRoot, 'assets', 'brand');

const defaultSource = 'AA980A8C-6F7D-4CC6-9F40-7E178793D7E9-0cba71e1-fa61-4ea8-aa3b-0f23938c0692.png';
const sourceArg = process.argv[2] || defaultSource;

const cursorAssets = path.join(process.env.HOME || '', '.cursor', 'projects', 'Users-jjmarzia-marzialetech-github-io', 'assets');
const sourcePath = fs.existsSync(sourceArg)
  ? path.resolve(sourceArg)
  : path.join(cursorAssets, path.basename(sourceArg));

if (!fs.existsSync(sourcePath)) {
  console.error('Source not found:', sourcePath);
  process.exit(1);
}

const blackPng = path.join(assetsDir, 'la-text-black.png');
const whitePng = path.join(assetsDir, 'la-text-white.png');
const blackSvg = path.join(assetsDir, 'la-text-black.svg');
const whiteSvg = path.join(assetsDir, 'la-text-white.svg');
const pbmPath = path.join(scriptDir, '_tmp_la.pbm');
const maskPath = path.join(scriptDir, '_tmp_la_mask.png');

const variants = [
  { name: 'navy', color: '#001f3f', file: 'la-text-white-on-navy' },
  { name: 'forest-green', color: '#1a472a', file: 'la-text-white-on-forest-green' },
  { name: 'pink', color: '#f8b4d9', file: 'la-text-white-on-pink' }
];

// 1. Extract clean mask: white text vs dark bg → grayscale threshold (white=text, black=bg)
console.log('1. Extracting mask...');
execSync(`magick "${sourcePath}" -colorspace gray -threshold 35% "${maskPath}"`, { stdio: 'inherit' });

// 2. White on transparent: pure #fff where mask is white, transparent where black
console.log('2. Creating white-on-transparent PNG (pure white)...');
execSync(`magick "${maskPath}" -background white -alpha shape "${whitePng}"`, { stdio: 'inherit' });

// 3. Black on transparent: pure #000 where mask is white, transparent where black
console.log('3. Creating black-on-transparent PNG (pure black)...');
execSync(`magick "${maskPath}" -background black -alpha shape "${blackPng}"`, { stdio: 'inherit' });

// 4. Black SVG via potrace (black on white for potrace)
console.log('4. Creating black-on-transparent SVG (potrace)...');
execSync(`magick "${blackPng}" -background white -flatten -colorspace gray -threshold 50% "${pbmPath}"`, { stdio: 'inherit' });
execSync(`potrace "${pbmPath}" -s -o "${blackSvg}"`, { stdio: 'inherit' });
let svg = fs.readFileSync(blackSvg, 'utf8');
svg = svg.replace(/fill="#?[^"]*"/gi, 'fill="#000"');
fs.writeFileSync(blackSvg, svg, 'utf8');

// 5. White SVG via potrace (white shape = flatten on black, negate, then potrace)
console.log('5. Creating white-on-transparent SVG (potrace)...');
execSync(`magick "${whitePng}" -background black -flatten -negate -colorspace gray -threshold 50% "${pbmPath}"`, { stdio: 'inherit' });
execSync(`potrace "${pbmPath}" -s -o "${whiteSvg}"`, { stdio: 'inherit' });
svg = fs.readFileSync(whiteSvg, 'utf8');
svg = svg.replace(/fill="#?[^"]*"/gi, 'fill="#fff"');
fs.writeFileSync(whiteSvg, svg, 'utf8');

// 6. White on colored backgrounds (navy, forest green, pink)
for (const v of variants) {
  console.log(`6. Creating white-on-${v.name} PNG...`);
  const pngPath = path.join(assetsDir, `${v.file}.png`);
  execSync(`magick "${whitePng}" -background "${v.color}" -flatten "${pngPath}"`, { stdio: 'inherit' });

  console.log(`7. Creating white-on-${v.name} SVG...`);
  const svgPath = path.join(assetsDir, `${v.file}.svg`);
  execSync(`magick "${whitePng}" -background black -flatten -negate -colorspace gray -threshold 50% "${pbmPath}"`, { stdio: 'inherit' });
  execSync(`potrace "${pbmPath}" -s -o "${svgPath}"`, { stdio: 'inherit' });
  let vSvg = fs.readFileSync(svgPath, 'utf8');
  vSvg = vSvg.replace(/fill="#?[^"]*"/gi, 'fill="#fff"');
  const vbMatch = vSvg.match(/viewBox="([^"]+)"/);
  const [vx, vy, vw, vh] = vbMatch ? vbMatch[1].split(/\s+/).map(Number) : [0, 0, 1200, 800];
  vSvg = vSvg.replace(/<svg([^>]*)>/, `<svg$1>\n<rect x="${vx}" y="${vy}" width="${vw}" height="${vh}" fill="${v.color}"/>`);
  fs.writeFileSync(svgPath, vSvg, 'utf8');
}

if (fs.existsSync(pbmPath)) fs.unlinkSync(pbmPath);
if (fs.existsSync(maskPath)) fs.unlinkSync(maskPath);

console.log('Done.');
console.log('  Base:', blackPng, whitePng, blackSvg, whiteSvg);
console.log('  White-on-color:', variants.map(v => `${v.file}.png/.svg`).join(', '));
