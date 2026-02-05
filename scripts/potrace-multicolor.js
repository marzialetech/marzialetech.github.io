#!/usr/bin/env node
/**
 * Potrace an image to SVG while retaining all colors.
 * Quantizes to N colors, traces each color layer separately, combines into one SVG.
 * Requires: ImageMagick (magick), potrace.
 * Usage: node potrace-multicolor.js <input.png> [output.svg] [numColors]
 */
const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const numColors = parseInt(process.argv[4], 10) || 4;
const inputPath = path.resolve(process.argv[2] || '');
const outputPath = process.argv[3]
  ? path.resolve(process.argv[3])
  : inputPath.replace(/\.(png|jpg|jpeg)$/i, '-traced.svg');

if (!inputPath || !fs.existsSync(inputPath)) {
  console.error('Usage: node potrace-multicolor.js <input.png> [output.svg] [numColors]');
  process.exit(1);
}

const scriptDir = path.dirname(__filename);
const tmpDir = path.join(scriptDir, '_potrace_multicolor_tmp');
if (!fs.existsSync(tmpDir)) fs.mkdirSync(tmpDir, { recursive: true });

const quantizedPath = path.join(tmpDir, 'quantized.png');
const colorsTxtPath = path.join(tmpDir, 'colors.txt');

try {
  // 1. Quantize to N colors (request extra to ensure we get at least numColors - IM sometimes merges similar colors)
  const quantizeRequest = Math.max(numColors + 2, 6);
  console.log(`1. Quantizing to ${numColors} colors (requesting ${quantizeRequest} for better separation)...`);
  execSync(`magick "${inputPath}" -colors ${quantizeRequest} +dither -colors ${quantizeRequest} "${quantizedPath}"`, {
    stdio: 'inherit'
  });

  // 2. Get unique colors (hex)
  const colorsOutput = execSync(
    `magick "${quantizedPath}" -format "%c" -depth 8 -unique-colors txt:-`,
    { encoding: 'utf8' }
  );
  const colorMatches = colorsOutput.matchAll(/#[0-9A-Fa-f]{6}/g);
  const colors = [...new Set([...colorMatches].map(m => m[0]))];
  if (colors.length === 0) {
    // Fallback: parse srgb(...) format
    const srgbMatch = colorsOutput.match(/srgba?\((\d+),(\d+),(\d+)/);
    if (srgbMatch) {
      const r = parseInt(srgbMatch[1], 10).toString(16).padStart(2, '0');
      const g = parseInt(srgbMatch[2], 10).toString(16).padStart(2, '0');
      const b = parseInt(srgbMatch[3], 10).toString(16).padStart(2, '0');
      colors.push('#' + r + g + b);
    }
  }
  // If still empty, use unique-colors txt format
  if (colors.length === 0) {
    const lines = colorsOutput.trim().split('\n').filter(l => l.includes(':'));
    const seen = new Set();
    for (const line of lines) {
      const m = line.match(/#[0-9A-Fa-f]{6}/);
      if (m && !seen.has(m[0])) {
        seen.add(m[0]);
        colors.push(m[0]);
      }
    }
  }
  if (colors.length === 0) {
    console.error('Could not extract colors from image.');
    process.exit(1);
  }
  // If we got fewer than numColors, re-quantize with higher request to force more separation
  let finalColors = colors;
  if (colors.length < numColors) {
    const retryRequest = Math.max(quantizeRequest + 2, numColors + 4);
    execSync(`magick "${inputPath}" -colors ${retryRequest} +dither -colors ${retryRequest} "${quantizedPath}"`, {
      stdio: 'pipe'
    });
    const retryOutput = execSync(`magick "${quantizedPath}" -unique-colors txt:-`, { encoding: 'utf8' });
    const retryMatches = retryOutput.matchAll(/#[0-9A-Fa-f]{6}/g);
    finalColors = [...new Set([...retryMatches].map(m => m[0]))];
    if (finalColors.length < numColors) {
      console.warn(`   Warning: got ${finalColors.length} colors (requested ${numColors}). Using all available.`);
    }
  } else if (colors.length > numColors) {
    // Pick numColors most spread by luminance
    const luminance = (hex) => {
      const r = parseInt(hex.slice(1, 3), 16) / 255;
      const g = parseInt(hex.slice(3, 5), 16) / 255;
      const b = parseInt(hex.slice(5, 7), 16) / 255;
      return 0.299 * r + 0.587 * g + 0.114 * b;
    };
    const sorted = [...colors].sort((a, b) => luminance(a) - luminance(b));
    const step = (sorted.length - 1) / Math.max(numColors - 1, 1);
    finalColors = [];
    for (let i = 0; i < numColors; i++) {
      finalColors.push(sorted[Math.round(i * step)]);
    }
  }
  console.log('   Colors:', finalColors.join(', '));

  // 3. For each color: create mask, potrace, collect paths
  const allPaths = [];
  let viewBox = '0 0 100 100';
  const dims = execSync(`magick identify -format "%w %h" "${quantizedPath}"`, { encoding: 'utf8' }).trim().split(/\s+/);
  const w = parseInt(dims[0], 10);
  const h = parseInt(dims[1], 10);

  for (let i = 0; i < finalColors.length; i++) {
    const c = finalColors[i];
    const pbmPath = path.join(tmpDir, `mask_${i}.pbm`);
    const svgPath = path.join(tmpDir, `layer_${i}.svg`);
    console.log(`2.${i + 1}. Tracing layer ${i + 1} (${c})...`);
    // Mask: this color = black (for potrace), rest = white
    execSync(
      `magick "${quantizedPath}" -fill black -fuzz 8% -opaque "${c}" -fill white +opaque black -alpha off -colorspace gray "${pbmPath}"`,
      { stdio: 'pipe' }
    );
    execSync(`potrace "${pbmPath}" -s -r 72 --tight -o "${svgPath}"`, { stdio: 'inherit' });
    let svg = fs.readFileSync(svgPath, 'utf8');
    // Extract viewBox from first layer (for final SVG)
    if (i === 0) {
      const vbMatch = svg.match(/viewBox="([^"]+)"/);
      if (vbMatch) {
      const parts = vbMatch[1].split(/\s+/).map(parseFloat);
      viewBox = `0 0 ${Math.round(parts[2])} ${Math.round(parts[3])}`;
    }
    }
    // Extract path content, set fill (paths may be in <g> with transform - we keep d only)
    const pathRegex = /<path[^>]*d="([^"]+)"[^>]*\/?>/g;
    let m;
    while ((m = pathRegex.exec(svg)) !== null) {
      allPaths.push({ d: m[1], fill: c });
    }
  }

  // 4. Build combined SVG (lightest/bg first - sort by luminance)
  const lum = (hex) => {
    const r = parseInt(hex.slice(1, 3), 16) / 255;
    const g = parseInt(hex.slice(3, 5), 16) / 255;
    const b = parseInt(hex.slice(5, 7), 16) / 255;
    return 0.299 * r + 0.587 * g + 0.114 * b;
  };
  allPaths.sort((a, b) => lum(a.fill) - lum(b.fill));

  // Potrace uses a transform in <g> - we need to include it. Parse from first layer.
  const firstSvg = fs.readFileSync(path.join(tmpDir, 'layer_0.svg'), 'utf8');
  const gMatch = firstSvg.match(/<g[^>]*transform="([^"]+)"[^>]*>/);
  const transform = gMatch ? gMatch[1] : '';
  const svgContent = `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" viewBox="${viewBox}" width="${w}" height="${h}">
<g transform="${transform}" fill="none" stroke="none">
${allPaths.map(({ d, fill }) => `  <path fill="${fill}" d="${d}"/>`).join('\n')}
</g>
</svg>`;
  fs.writeFileSync(outputPath, svgContent, 'utf8');

  // Cleanup
  fs.readdirSync(tmpDir).forEach(f => fs.unlinkSync(path.join(tmpDir, f)));
  fs.rmdirSync(tmpDir);

  console.log('Done:', outputPath);
} catch (err) {
  console.error(err.message || err);
  process.exit(1);
}
