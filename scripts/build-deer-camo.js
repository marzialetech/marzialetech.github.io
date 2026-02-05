#!/usr/bin/env node
/**
 * Builds deer-camo.svg: deer logo filled with camo-cream pattern.
 * Uses deer paths as clip path, camo pattern as fill.
 */

const fs = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, '..');
const DEER_SVG = path.join(ROOT, 'assets/brand/deer/deer-black.svg');
const CAMO_SVG = path.join(ROOT, 'assets/brand/camo/camo-cream.svg');
const OUTPUT_CAMO = path.join(ROOT, 'assets/brand/deer/deer-camo.svg');
const OUTPUT_ORANGE = path.join(ROOT, 'assets/brand/deer/deer-orange-on-camo.svg');

const deerSvg = fs.readFileSync(DEER_SVG, 'utf8');
const camoSvg = fs.readFileSync(CAMO_SVG, 'utf8');

// Extract deer content: supports both formats
// Old: single <g transform="..."> with paths
// New: top-level <path> + <g transform="..."> with paths
let deerContent = '';
let deerViewBox = '0 0 1170.000000 832.000000';
let outputWidth = 1170, outputHeight = 832;

const viewBoxMatch = deerSvg.match(/viewBox="([^"]*)"/);
if (viewBoxMatch) {
  deerViewBox = viewBoxMatch[1];
  const parts = deerViewBox.split(/\s+/);
  if (parts.length >= 4) {
    outputWidth = parseFloat(parts[2]) || 1170;
    outputHeight = parseFloat(parts[3]) || 832;
  }
}

// New format: path + g with paths
const mainPathMatch = deerSvg.match(/<path\s+[^>]*d="[^"]*"[^>]*\/>/);
const gMatch = deerSvg.match(/<g[^>]*transform="([^"]*)"[^>]*>([\s\S]*?)<\/g>/);

if (mainPathMatch && gMatch) {
  // New Inkscape/potrace format
  const mainPath = mainPathMatch[0];
  deerContent = mainPath + '\n  ' + `<g transform="${gMatch[1]}">\n    ${gMatch[2]}\n  </g>`;
} else if (gMatch) {
  // Old potrace format
  deerContent = `<g transform="${gMatch[1]}">${gMatch[2]}</g>`;
}

// For clip path: paths need fill for clipping (use black)
const clipPaths = deerContent.replace(/\s+style="[^"]*"/g, ' fill="black"');

// For orange deer: remove path styles so they inherit fill/stroke from parent g
const orangePaths = deerContent.replace(/\s+style="[^"]*"/g, '');

// Extract camo group for inline pattern (with viewBox-adjusted transform so it fits in pattern tile)
// Pattern tile is 514x483. Camo viewBox is 0 0 514 483.
// Use patternContentUnits so pattern content fits the tile
const camoGroupMatch = camoSvg.match(/<g[^>]*>([\s\S]*?)<\/g>/);
const camoGroup = camoGroupMatch ? camoGroupMatch[0] : '';

const output = `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink"
  width="${outputWidth}" height="${outputHeight}" viewBox="${deerViewBox}"
  preserveAspectRatio="xMidYMid meet">
<defs>
  <!-- Clip path: deer shape -->
  <clipPath id="deerClip">
    ${clipPaths}
  </clipPath>

  <!-- Pattern: camo-cream as embedded image (works with file://) -->
  <pattern id="camoPattern" patternUnits="userSpaceOnUse"
    x="0" y="0" width="514" height="483">
    <image href="data:image/svg+xml;base64,${Buffer.from(camoSvg, 'utf8').toString('base64')}" 
      x="0" y="0" width="514" height="483" preserveAspectRatio="xMidYMid meet"/>
  </pattern>
</defs>

<!-- Rect filled with camo pattern, clipped by deer shape -->
<rect x="0" y="0" width="${outputWidth}" height="${outputHeight}"
  fill="url(#camoPattern)"
  clip-path="url(#deerClip)"/>
</svg>
`;

// deer-orange-on-camo: camo background, hunter orange deer on top
const camoPatternDef = `  <pattern id="camoPattern" patternUnits="userSpaceOnUse"
    x="0" y="0" width="514" height="483">
    <image href="data:image/svg+xml;base64,${Buffer.from(camoSvg, 'utf8').toString('base64')}" 
      x="0" y="0" width="514" height="483" preserveAspectRatio="xMidYMid meet"/>
  </pattern>`;

const outputOrange = `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink"
  width="${outputWidth}" height="${outputHeight}" viewBox="${deerViewBox}"
  preserveAspectRatio="xMidYMid meet">
<defs>
  ${camoPatternDef}
</defs>

<!-- Camo background -->
<rect x="0" y="0" width="${outputWidth}" height="${outputHeight}" fill="url(#camoPattern)"/>

<!-- Hunter orange deer on top with black outline -->
<g fill="#FF6600" stroke="#000" stroke-width="32">
  ${orangePaths}
</g>
</svg>
`;

fs.writeFileSync(OUTPUT_CAMO, output, 'utf8');
fs.writeFileSync(OUTPUT_ORANGE, outputOrange, 'utf8');
console.log('Wrote', OUTPUT_CAMO);
console.log('Wrote', OUTPUT_ORANGE);
