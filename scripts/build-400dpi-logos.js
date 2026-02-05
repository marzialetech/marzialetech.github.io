#!/usr/bin/env node
/**
 * Generates 400 DPI PNG copies of black/white logo variants.
 * Converts from SVG with transparent background.
 *
 * Run: node scripts/build-400dpi-logos.js
 */
const path = require('path');
const { execSync } = require('child_process');
const fs = require('fs');

const repoRoot = path.join(__dirname, '..');
const brandDir = path.join(repoRoot, 'assets', 'brand');

const DPI = 400;

// [dir, blackSvg, whiteSvg] - SVG basenames
const variants = [
  ['angel-silhouette', 'angel-silhouette-pixelated.svg', 'angel-silhouette-pixelated-white.svg'],
  ['man-on-boat', 'man-on-boat-pixelated.svg', 'man-on-boat-pixelated-white.svg'],
  ['martechtext', 'martechtext-pixelated.svg', 'martechtext-pixelated-white.svg'],
  ['la-text', 'la-text-black.svg', 'la-text-white.svg'],
  ['feet', 'feet-black.svg', 'feet-white.svg'],
  ['deer', 'deer-black.svg', 'deer-white.svg'],
  ['pizza-delivery', 'pizza-delivery-black.svg', 'pizza-delivery-white.svg'],
  ['metal-band', 'metal-band-black.svg', 'metal-band-white.svg'],
];

function svgTo400dpi(svgPath, pngPath) {
  if (!fs.existsSync(svgPath)) {
    console.warn('  Skip (no SVG):', svgPath);
    return;
  }
  try {
    execSync(`magick -density ${DPI} -background none "${svgPath}" "${pngPath}"`, { stdio: 'pipe' });
    console.log('  ', path.basename(pngPath));
  } catch (e) {
    console.warn('  Failed:', path.basename(pngPath));
  }
}

console.log('Generating 400 DPI PNGs...\n');

for (const [dir, blackSvg, whiteSvg] of variants) {
  const dirPath = path.join(brandDir, dir);
  if (!fs.existsSync(dirPath)) {
    console.warn('Dir not found:', dir);
    continue;
  }
  console.log(dir + ':');
  svgTo400dpi(
    path.join(dirPath, blackSvg),
    path.join(dirPath, blackSvg.replace('.svg', '-400dpi.png'))
  );
  svgTo400dpi(
    path.join(dirPath, whiteSvg),
    path.join(dirPath, whiteSvg.replace('.svg', '-400dpi.png'))
  );
  console.log('');
}

// Copy to 400dpi folder for preview
const dpiDir = path.join(brandDir, '400dpi');
function copyTo400dpi(srcPath) {
  if (fs.existsSync(srcPath) && fs.existsSync(dpiDir)) {
    const name = path.basename(srcPath);
    fs.copyFileSync(srcPath, path.join(dpiDir, name));
  }
}

// Camo deer variants (from build-deer-camo.js)
const deerDir = path.join(brandDir, 'deer');
const camoSvgs = ['deer-camo.svg', 'deer-orange-on-camo.svg'];
if (fs.existsSync(deerDir)) {
  console.log('deer (camo):');
  for (const svg of camoSvgs) {
    svgTo400dpi(
      path.join(deerDir, svg),
      path.join(deerDir, svg.replace('.svg', '-400dpi.png'))
    );
  }
  console.log('');
}

// Marziale wordmark (PNG sources)
const logoDir = path.join(brandDir, 'logo');
function pngTo400dpi(srcPath, destPath) {
  if (!fs.existsSync(srcPath)) {
    console.warn('  Skip (no source):', srcPath);
    return;
  }
  try {
    execSync(`magick "${srcPath}" -density 72 -resample 400 "${destPath}"`, { stdio: 'pipe' });
    console.log('  ', path.basename(destPath));
  } catch (e) {
    console.warn('  Failed:', path.basename(destPath));
  }
}
if (fs.existsSync(logoDir)) {
  console.log('LANL style (marziale-wordmark):');
  pngTo400dpi(path.join(logoDir, 'marziale-wordmark-black.png'), path.join(dpiDir, 'marziale-wordmark-black-400dpi.png'));
  pngTo400dpi(path.join(logoDir, 'marziale-wordmark-white.png'), path.join(dpiDir, 'marziale-wordmark-white-400dpi.png'));
  console.log('');
}

// Lake Street Bakery logos
const lakestreetDir = path.join(repoRoot, 'assets', 'lakestreetbakery');
if (fs.existsSync(lakestreetDir)) {
  console.log('Lake Street Bakery:');
  pngTo400dpi(path.join(lakestreetDir, 'lakestreetbakery-logo.png'), path.join(dpiDir, 'lakestreetbakery-logo-400dpi.png'));
  pngTo400dpi(path.join(lakestreetDir, 'lakestreetbakery-logo-white.png'), path.join(dpiDir, 'lakestreetbakery-logo-white-400dpi.png'));
  console.log('');
}

// Copy pizza-delivery and metal-band fill variants to 400dpi folder
for (const dir of ['pizza-delivery', 'metal-band']) {
  const dirPath = path.join(brandDir, dir);
  if (fs.existsSync(dirPath)) {
    for (const name of [`${dir}-black-400dpi.png`, `${dir}-white-400dpi.png`]) {
      copyTo400dpi(path.join(dirPath, name));
    }
  }
}

console.log('Done.');
