#!/usr/bin/env node
/**
 * Regenerates metal-band-outline-black-400dpi.png by negating the white outline.
 * Run after build-metal-band.js (which creates the white 400dpi).
 *
 * Run: node scripts/build-metal-band-outline-black.js
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const ROOT = path.join(__dirname, '..');
const metalBandDir = path.join(ROOT, 'assets/brand/metal-band');
const dpiDir = path.join(ROOT, 'assets/brand/400dpi');
const outlineWhite = path.join(metalBandDir, 'metal-band-outline-white-400dpi.png');
const outlineBlack = path.join(metalBandDir, 'metal-band-outline-black-400dpi.png');

if (!fs.existsSync(outlineWhite)) {
  console.error('metal-band-outline-white-400dpi.png not found. Run build-metal-band.js first.');
  process.exit(1);
}

console.log('Creating metal-band-outline-black-400dpi.png (negate RGB only, keep alpha)...');
execSync(`magick "${outlineWhite}" -channel RGB -negate +channel "${outlineBlack}"`, { stdio: 'pipe' });
if (fs.existsSync(dpiDir)) {
  fs.copyFileSync(outlineBlack, path.join(dpiDir, 'metal-band-outline-black-400dpi.png'));
  console.log('  Copied to 400dpi/');
}
console.log('Done.');
