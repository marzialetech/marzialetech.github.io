#!/usr/bin/env node
/**
 * Trace 5 client logo PNGs to white-on-transparent SVGs via potrace.
 * Copy the 5 PNGs into client-sources/ (see clients[].png filenames below), or
 * run from a machine where .cursor/.../assets/ exists. Output: client-shue.svg, etc.
 * Requires: ImageMagick (magick), potrace. Run: node build-client-logos.js
 */
const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const dir = path.resolve(__dirname);
const assetsDir = path.join(dir, 'client-sources');
const outDir = dir;

const clients = [
  { name: 'shue', png: '1A013992-3129-483B-AA79-7F58CF241B04-0e947464-ebba-4888-ab48-e302d93152ee.png' },
  { name: 'pixamation', png: 'pixamation-7fc80def-3202-49e2-a04c-1c7bb5c1fbcf.png' },
  { name: 'redbarn', png: '9BF5767A-303A-4507-9B46-904F44A8B7DC-21d6493b-4107-48c6-b21c-2dc7fca0a816.png' },
  { name: 'blizzard', png: '351FE7A3-6297-442A-B9AD-D1FF38B9D1D2-fdc37530-d5cb-439b-be69-7a5b39c966e9.png' },
  { name: 'moose', png: 'C37E7FCD-FAC2-48C7-87C2-BB3B5C5D59F0-23b8bb08-50b1-4ce4-971f-33351565f24c.png' },
];

// Fallback: Cursor assets path derived from project dir (works after moving the repo)
const projectSlug = dir.replace(/^\/+/, '').replace(/\//g, '-');
const cursorAssets = path.join(process.env.HOME || '', '.cursor', 'projects', projectSlug, 'assets');

function findPng(name, pngFile) {
  const inSources = path.join(assetsDir, pngFile);
  const inCursor = path.join(cursorAssets, pngFile);
  if (fs.existsSync(inSources)) return inSources;
  if (fs.existsSync(inCursor)) return inCursor;
  return null;
}

function traceToWhiteSvg(pngPath, svgPath) {
  const pbmPath = path.join(outDir, '_tmp.pbm');
  try {
    // Black shape on white background for potrace. If logo is white on black, use -negate.
    execSync(`magick "${pngPath}" -colorspace gray -threshold 50% "${pbmPath}"`, { stdio: 'inherit' });
    execSync(`potrace "${pbmPath}" -s -o "${svgPath}"`, { stdio: 'inherit' });
  } catch (e) {
    try {
      execSync(`magick "${pngPath}" -colorspace gray -negate -threshold 50% "${pbmPath}"`, { stdio: 'inherit' });
      execSync(`potrace "${pbmPath}" -s -o "${svgPath}"`, { stdio: 'inherit' });
    } catch (e2) {
      console.error('Trace failed for', pngPath, e2.message);
      throw e2;
    }
  }
  if (fs.existsSync(pbmPath)) fs.unlinkSync(pbmPath);
  let svg = fs.readFileSync(svgPath, 'utf8');
  svg = svg.replace(/fill="#?[^"]*"/gi, 'fill="#fff"');
  fs.writeFileSync(svgPath, svg, 'utf8');
}

if (!fs.existsSync(assetsDir)) fs.mkdirSync(assetsDir, { recursive: true });

for (const c of clients) {
  const pngPath = findPng(c.name, c.png);
  if (!pngPath) {
    console.warn('Skip', c.name, '- copy', c.png, 'to client-sources/');
    continue;
  }
  const svgPath = path.join(outDir, `client-${c.name}.svg`);
  console.log('Tracing', c.name, '...');
  traceToWhiteSvg(pngPath, svgPath);
  console.log('  ->', svgPath);
}
console.log('Done.');
