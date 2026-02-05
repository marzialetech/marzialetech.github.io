#!/usr/bin/env node
/**
 * Regenerate all pizza-delivery graphics from pizza-delivery-black.png.
 * Source: assets/brand/pizza-delivery/pizza-delivery-black.png
 *
 * Generates pixel-perfect SVGs (one rect per pixel) + PDFs from those:
 * - white on transparent (png/svg/pdf)
 * - outline black (png/svg/pdf)
 * - outline white (png/svg/pdf)
 * - outline white on pink (png/svg/pdf)
 * - outline white on pink THICK (png/svg/pdf)
 * - outline white on pink 1.25x (png)
 * - outline white on pink pixelated (svg/pdf)
 *
 * Requires: ImageMagick (magick).
 * Run: node build-pizza-delivery.js [pizza-delivery-black.png]
 */
const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const scriptDir = path.resolve(__dirname);
const repoRoot = path.join(scriptDir, '..');
const pizzaDir = path.join(repoRoot, 'assets', 'brand', 'pizza-delivery');
const pixelSvgScript = path.join(scriptDir, 'png-to-pixel-svg.js');

const defaultSource = path.join(pizzaDir, 'pizza-delivery-black.png');
const sourceArg = process.argv[2] || defaultSource;
const sourcePath = path.resolve(sourceArg);

if (!fs.existsSync(sourcePath)) {
  console.error('Source not found:', sourcePath);
  process.exit(1);
}

const maskPath = path.join(scriptDir, '_tmp_pizza_mask.png');
const outlinePath = path.join(scriptDir, '_tmp_pizza_outline.png');
const PINK = '#f8b4d9';

// Output paths (all in pizza-delivery/)
const blackPng = path.join(pizzaDir, 'pizza-delivery-black.png');
const whitePng = path.join(pizzaDir, 'pizza-delivery-white.png');
const blackSvg = path.join(pizzaDir, 'pizza-delivery-black.svg');
const whiteSvg = path.join(pizzaDir, 'pizza-delivery-white.svg');
const outlineBlackPng = path.join(pizzaDir, 'pizza-delivery-outline-black.png');
const outlineWhitePng = path.join(pizzaDir, 'pizza-delivery-outline-white.png');
const outlineBlackSvg = path.join(pizzaDir, 'pizza-delivery-outline-black.svg');
const outlineWhiteSvg = path.join(pizzaDir, 'pizza-delivery-outline-white.svg');
const whiteOnPinkPng = path.join(pizzaDir, 'pizza-delivery-outline-white-on-pink.png');
const whiteOnPinkSvg = path.join(pizzaDir, 'pizza-delivery-outline-white-on-pink.svg');
const whiteOnPinkThickPng = path.join(pizzaDir, 'pizza-delivery-outline-white-on-pink-thick.png');
const whiteOnPinkThickSvg = path.join(pizzaDir, 'pizza-delivery-outline-white-on-pink-thick.svg');
const whiteOnPink125Png = path.join(pizzaDir, 'pizza-delivery-outline-white-on-pink-1.25x.png');
const whiteOnPinkPixelatedSvg = path.join(pizzaDir, 'pizza-delivery-outline-white-on-pink-pixelated.svg');
// 200 DPI PNG variants
const black200dpi = path.join(pizzaDir, 'pizza-delivery-black-200dpi.png');
const white200dpi = path.join(pizzaDir, 'pizza-delivery-white-200dpi.png');
const outlineBlack200dpi = path.join(pizzaDir, 'pizza-delivery-outline-black-200dpi.png');
const outlineWhite200dpi = path.join(pizzaDir, 'pizza-delivery-outline-white-200dpi.png');
const outlineWhite400dpi = path.join(pizzaDir, 'pizza-delivery-outline-white-400dpi.png');
const whiteOnPink200dpi = path.join(pizzaDir, 'pizza-delivery-outline-white-on-pink-200dpi.png');
const whiteOnPinkThick200dpi = path.join(pizzaDir, 'pizza-delivery-outline-white-on-pink-thick-200dpi.png');

function pixelSvg(pngPath, svgPath, opts = {}) {
  const env = { ...process.env };
  if (opts.fill) env.FILL = opts.fill;
  if (opts.background) env.BACKGROUND = opts.background;
  execSync(`node "${pixelSvgScript}" "${pngPath}" "${svgPath}"`, {
    stdio: 'inherit',
    env
  });
}

const HIGH_DPI = 200; // DPI for high-res PNGs from PDFs (>150)

function svgToPdf(svgPath) {
  const pdfPath = svgPath.replace(/\.svg$/, '.pdf');
  try {
    execSync(`magick "${svgPath}" "${pdfPath}"`, { stdio: 'pipe' });
    console.log('  PDF:', pdfPath);
  } catch (e) {
    console.warn('  (PDF skip:', path.basename(pdfPath), '- magick may need rsvg/inkscape)');
  }
}

function svgToHighResPng(svgPath, pngPath, dpi = HIGH_DPI, dilate = null) {
  try {
    const tmpPath = pngPath.replace(/\.png$/, '-tmp.png');
    execSync(`magick -density ${dpi} -background none "${svgPath}" "${tmpPath}"`, { stdio: 'pipe' });
    if (dilate) {
      execSync(`magick "${tmpPath}" -morphology Dilate "Diamond:${dilate}" -background none "${pngPath}"`, { stdio: 'pipe' });
      try { fs.unlinkSync(tmpPath); } catch (_) {}
    } else {
      fs.renameSync(tmpPath, pngPath);
    }
    console.log(`  ${dpi}DPI PNG:`, pngPath);
  } catch (e) {
    console.warn('  (High-DPI PNG skip:', path.basename(pngPath), ')');
  }
}

// 1. Extract mask from black.png
console.log('1. Extracting mask from black.png...');
execSync(`magick "${sourcePath}" -alpha extract -threshold 20% "${maskPath}"`, { stdio: 'inherit' });

// 2. White on transparent PNG
console.log('2. Creating white-on-transparent PNG...');
execSync(`magick "${maskPath}" -background white -alpha shape "${whitePng}"`, { stdio: 'inherit' });

// 3. Black SVG (pixel-perfect)
console.log('3. Creating black SVG (pixel-perfect)...');
pixelSvg(blackPng, blackSvg, { fill: '#000' });
svgToPdf(blackSvg);
svgToHighResPng(blackSvg, black200dpi);

// 4. White SVG (pixel-perfect)
console.log('4. Creating white SVG (pixel-perfect)...');
pixelSvg(whitePng, whiteSvg, { fill: '#fff' });
svgToPdf(whiteSvg);
svgToHighResPng(whiteSvg, white200dpi);

// 5. Outline extraction
console.log('5. Extracting outlines...');
execSync(`magick "${maskPath}" -morphology EdgeOut Diamond "${outlinePath}"`, { stdio: 'inherit' });

// 6. Outline black PNG
console.log('6. Creating outline-black PNG...');
execSync(`magick "${outlinePath}" -background black -alpha shape "${outlineBlackPng}"`, { stdio: 'inherit' });

// 7. Outline white PNG
console.log('7. Creating outline-white PNG...');
execSync(`magick "${outlinePath}" -background white -alpha shape "${outlineWhitePng}"`, { stdio: 'inherit' });

// 8. Outline black SVG (pixel-perfect)
console.log('8. Creating outline-black SVG (pixel-perfect)...');
pixelSvg(outlineBlackPng, outlineBlackSvg, { fill: '#000' });
svgToPdf(outlineBlackSvg);
svgToHighResPng(outlineBlackSvg, outlineBlack200dpi, HIGH_DPI, 3);

// 9. Outline white SVG (pixel-perfect)
console.log('9. Creating outline-white SVG (pixel-perfect)...');
pixelSvg(outlineWhitePng, outlineWhiteSvg, { fill: '#fff' });
svgToPdf(outlineWhiteSvg);

// 9b. High-DPI PNGs from outline-white SVG (white outline on transparent, Diamond:3)
console.log('9b. Creating outline-white 200DPI PNG...');
svgToHighResPng(outlineWhiteSvg, outlineWhite200dpi, HIGH_DPI, 3);
console.log('9c. Creating outline-white 400DPI PNG...');
svgToHighResPng(outlineWhiteSvg, outlineWhite400dpi, 400, 3);

// 10. White outline on pink (base) PNG
console.log('10. Creating outline-white-on-pink PNG...');
execSync(`magick "${outlineWhitePng}" -background "${PINK}" -flatten "${whiteOnPinkPng}"`, { stdio: 'inherit' });

// 11. White outline on pink SVG (pixel-perfect - PNG has pink bg + white shape)
console.log('11. Creating outline-white-on-pink SVG (pixel-perfect)...');
pixelSvg(whiteOnPinkPng, whiteOnPinkSvg, { background: PINK }); // one pink rect + white shape pixels
svgToPdf(whiteOnPinkSvg);
svgToHighResPng(whiteOnPinkSvg, whiteOnPink200dpi);

// 12. Thick white outline on pink PNG
console.log('12. Creating outline-white-on-pink-thick PNG...');
execSync(`magick "${outlineWhitePng}" -morphology Dilate "Diamond:0.5" -background "${PINK}" -flatten "${whiteOnPinkThickPng}"`, { stdio: 'inherit' });

// 13. Thick white outline on pink SVG (pixel-perfect)
console.log('13. Creating outline-white-on-pink-thick SVG (pixel-perfect)...');
pixelSvg(whiteOnPinkThickPng, whiteOnPinkThickSvg, { background: PINK });
svgToPdf(whiteOnPinkThickSvg);
svgToHighResPng(whiteOnPinkThickSvg, whiteOnPinkThick200dpi);

// 14. 1.25x scaled white-on-pink PNG
console.log('14. Creating outline-white-on-pink-1.25x PNG...');
execSync(`magick "${whiteOnPinkPng}" -resize 125% "${whiteOnPink125Png}"`, { stdio: 'inherit' });

// 15. Pixelated SVG (already rect-based, from white-on-pink)
console.log('15. Creating outline-white-on-pink-pixelated SVG...');
execSync(`node "${path.join(scriptDir, 'pizza-pixelated-to-svg.js')}" 720 "${whiteOnPinkPng}" "${whiteOnPinkPixelatedSvg}"`, { stdio: 'inherit' });
svgToPdf(whiteOnPinkPixelatedSvg);

// Cleanup
[maskPath, outlinePath].forEach(p => { if (fs.existsSync(p)) fs.unlinkSync(p); });

console.log('\nDone. All SVGs and PDFs are pixel-perfect.');
console.log('  200 DPI PNGs: black, white, outline-black, outline-white, white-on-pink, white-on-pink-thick');
console.log('  400 DPI PNG: outline-white');
