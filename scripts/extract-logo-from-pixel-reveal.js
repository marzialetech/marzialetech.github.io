#!/usr/bin/env node
/**
 * Extracts the logo SVG from pixel-reveal.html (figLogo) and writes logo-pixelated.svg.
 * Run: node extract-logo-from-pixel-reveal.js
 */

const fs = require('fs');
const path = require('path');

const htmlPath = path.resolve(__dirname, 'pixel-reveal.html');
const outPath = path.resolve(__dirname, 'logo-pixelated.svg');
const html = fs.readFileSync(htmlPath, 'utf8');

const startMarker = '<div class="figure" id="figLogo">\n';
const endMarker = '\n            <span>Logo</span>';
const i = html.indexOf(startMarker);
if (i === -1) {
  console.error('figLogo div not found');
  process.exit(1);
}
const afterStart = i + startMarker.length;
const j = html.indexOf(endMarker, afterStart);
if (j === -1) {
  console.error('Logo span not found after figLogo');
  process.exit(1);
}
let svg = html.slice(afterStart, j).trim();
if (!svg.startsWith('<svg')) {
  console.error('Expected content to start with <svg');
  process.exit(1);
}
const out = '<?xml version="1.0" encoding="UTF-8"?>\n' + svg + '\n';
fs.writeFileSync(outPath, out, 'utf8');
console.log('Wrote logo-pixelated.svg (extracted from pixel-reveal.html).');
console.log('  Length:', out.length, 'chars,', (svg.match(/<rect/g) || []).length, 'rects');
process.exit(0);
