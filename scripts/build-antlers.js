#!/usr/bin/env node
/**
 * Process antlers silhouette:
 * 1. Black on transparent PNG/SVG
 * 2. White on transparent PNG/SVG
 * 3. Camo print + white outline on black background (PNG)
 * 4. Camo print, no outline, on black background (PNG)
 * 5. Orange on camo background (PNG)
 * 6. Black on hunting orange background (PNG/SVG)
 * Requires: ImageMagick (magick), potrace.
 * Run: node build-antlers.js [source.png]
 */
const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const scriptDir = path.resolve(__dirname);
const repoRoot = path.join(scriptDir, '..');
const assetsDir = path.join(repoRoot, 'assets', 'brand');

const defaultSource = '5F4FDFB4-CED3-4D3C-867E-10AC32CD48D5_copy_2-665ec030-814b-470e-bd1d-f77f235dbd41.png';
const sourceArg = process.argv[2] || defaultSource;

const cursorAssets = path.join(process.env.HOME || '', '.cursor', 'projects', 'Users-jjmarzia-marzialetech-github-io', 'assets');
const sourcePath = fs.existsSync(sourceArg)
  ? path.resolve(sourceArg)
  : path.join(cursorAssets, path.basename(sourceArg));

if (!fs.existsSync(sourcePath)) {
  console.error('Source not found:', sourcePath);
  process.exit(1);
}

const blackPng = path.join(assetsDir, 'antlers-black.png');
const whitePng = path.join(assetsDir, 'antlers-white.png');
const blackSvg = path.join(assetsDir, 'antlers-black.svg');
const whiteSvg = path.join(assetsDir, 'antlers-white.svg');
const pbmPath = path.join(scriptDir, '_tmp_antlers.pbm');
const maskPath = path.join(scriptDir, '_tmp_antlers_mask.png');
const camoPath = path.join(scriptDir, '_tmp_antlers_camo.png');

const HUNTING_ORANGE = '#FF6600';
const ORANGE = '#FF8C00';

// 1. Extract mask: black shape on transparent → alpha extract gives white=shape
console.log('1. Extracting mask...');
execSync(`magick "${sourcePath}" -alpha extract -threshold 20% "${maskPath}"`, { stdio: 'inherit' });

// 2. Black on transparent
console.log('2. Creating black-on-transparent PNG...');
execSync(`magick "${maskPath}" -background black -alpha shape "${blackPng}"`, { stdio: 'inherit' });

// 3. White on transparent
console.log('3. Creating white-on-transparent PNG...');
execSync(`magick "${maskPath}" -background white -alpha shape "${whitePng}"`, { stdio: 'inherit' });

// 4. Black SVG (potrace)
console.log('4. Creating black-on-transparent SVG...');
execSync(`magick "${blackPng}" -background white -flatten -colorspace gray -threshold 50% "${pbmPath}"`, { stdio: 'inherit' });
execSync(`potrace "${pbmPath}" -s -o "${blackSvg}"`, { stdio: 'inherit' });
let svg = fs.readFileSync(blackSvg, 'utf8');
svg = svg.replace(/fill="#?[^"]*"/gi, 'fill="#000"');
fs.writeFileSync(blackSvg, svg, 'utf8');

// 5. White SVG (potrace)
console.log('5. Creating white-on-transparent SVG...');
execSync(`magick "${whitePng}" -background black -flatten -negate -colorspace gray -threshold 50% "${pbmPath}"`, { stdio: 'inherit' });
execSync(`potrace "${pbmPath}" -s -o "${whiteSvg}"`, { stdio: 'inherit' });
svg = fs.readFileSync(whiteSvg, 'utf8');
svg = svg.replace(/fill="#?[^"]*"/gi, 'fill="#fff"');
fs.writeFileSync(whiteSvg, svg, 'utf8');

// 6. Generate camo texture (green/brown/tan organic pattern)
console.log('6. Generating camo texture...');
execSync(`magick -size 512x512 xc:'#4a5d23' +noise Random -virtual-pixel tile -blur 0x12 -normalize -posterize 4 -colorspace sRGB "${camoPath}"`, { stdio: 'inherit' });
// Colorize the posterized levels to camo colors
execSync(`magick "${camoPath}" -fill '#4a5d23' -opaque white -fill '#6b4423' -opaque gray50 -fill '#8b7355' -opaque gray75 -fill '#3d4d1f' -opaque black "${camoPath}"`, { stdio: 'inherit' });

// 7. Camo + white outline on black background
console.log('7. Creating camo + white outline on black PNG...');
const camoWhiteOutlinePng = path.join(assetsDir, 'antlers-camo-white-outline-on-black.png');
execSync(`magick "${camoPath}" -resize 512x512 \\( "${sourcePath}" -resize 512x512 -alpha extract \\) -compose CopyOpacity -composite "${scriptDir}/_tmp_camo_antlers.png"`, { stdio: 'inherit' });
execSync(`magick "${sourcePath}" -resize 512x512 -alpha extract -morphology EdgeOut Diamond -background white -alpha shape "${scriptDir}/_tmp_outline.png"`, { stdio: 'inherit' });
execSync(`magick -size 512x512 xc:black "${scriptDir}/_tmp_camo_antlers.png" -composite "${scriptDir}/_tmp_outline.png" -composite "${camoWhiteOutlinePng}"`, { stdio: 'inherit' });

// 8. Camo, no outline, on black background
console.log('8. Creating camo no outline on black PNG...');
const camoNoOutlinePng = path.join(assetsDir, 'antlers-camo-on-black.png');
execSync(`magick -size 512x512 xc:black "${scriptDir}/_tmp_camo_antlers.png" -composite "${camoNoOutlinePng}"`, { stdio: 'inherit' });

// 9. Orange on camo background
console.log('9. Creating orange on camo PNG...');
const orangeOnCamoPng = path.join(assetsDir, 'antlers-orange-on-camo.png');
execSync(`magick "${camoPath}" -resize 512x512 \\( "${whitePng}" -resize 512x512 -alpha extract -background "${ORANGE}" -alpha shape \\) -compose Over -composite "${orangeOnCamoPng}"`, { stdio: 'inherit' });

// 10. Black on hunting orange background
console.log('10. Creating black on hunting orange PNG/SVG...');
const blackOnOrangePng = path.join(assetsDir, 'antlers-black-on-orange.png');
const blackOnOrangeSvg = path.join(assetsDir, 'antlers-black-on-orange.svg');
execSync(`magick "${blackPng}" -background "${HUNTING_ORANGE}" -flatten "${blackOnOrangePng}"`, { stdio: 'inherit' });
execSync(`magick "${blackPng}" -background black -flatten -colorspace gray -threshold 50% "${pbmPath}"`, { stdio: 'inherit' });
execSync(`potrace "${pbmPath}" -s -o "${blackOnOrangeSvg}"`, { stdio: 'inherit' });
svg = fs.readFileSync(blackOnOrangeSvg, 'utf8');
svg = svg.replace(/fill="#?[^"]*"/gi, 'fill="#000"');
const vbMatch = svg.match(/viewBox="([^"]+)"/);
const [vx, vy, vw, vh] = vbMatch ? vbMatch[1].split(/\s+/).map(Number) : [0, 0, 1200, 800];
svg = svg.replace(/<svg([^>]*)>/, `<svg$1>\n<rect x="${vx}" y="${vy}" width="${vw}" height="${vh}" fill="${HUNTING_ORANGE}"/>`);
fs.writeFileSync(blackOnOrangeSvg, svg, 'utf8');

// Cleanup
[ pbmPath, maskPath, camoPath,
  path.join(scriptDir, '_tmp_camo_fill.png'),
  path.join(scriptDir, '_tmp_camo_antlers.png'),
  path.join(scriptDir, '_tmp_outline.png')
].forEach(p => { if (fs.existsSync(p)) fs.unlinkSync(p); });

console.log('Done.');
console.log('  Black/white on transparent:', blackPng, whitePng, blackSvg, whiteSvg);
console.log('  Camo + white outline on black:', camoWhiteOutlinePng);
console.log('  Camo no outline on black:', camoNoOutlinePng);
console.log('  Orange on camo:', orangeOnCamoPng);
console.log('  Black on hunting orange:', blackOnOrangePng, blackOnOrangeSvg);
