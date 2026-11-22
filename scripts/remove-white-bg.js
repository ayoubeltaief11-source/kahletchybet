const sharp = require('sharp');
const fs = require('fs');
const path = require('path');

const ASSETS_DIR = path.join(__dirname, '..', 'public', 'assets');
const ORIGINAL_DIR = path.join(__dirname, '..', 'public', 'assets_original');
const THRESHOLD = 240;

const TARGET_FILES = ['character.png', 'logo.png'];
const SYMBOL_PATTERN = /^s\d+\.png$/i;

function isNearWhite(r, g, b) {
  return r >= THRESHOLD && g >= THRESHOLD && b >= THRESHOLD;
}

function floodFill(width, height, data, startX, startY) {
  const visited = new Uint8Array(width * height);
  const result = [];
  const stack = [[startX, startY]];
  while (stack.length > 0) {
    const [x, y] = stack.pop();
    if (x < 0 || y < 0 || x >= width || y >= height) continue;
    const idx = y * width + x;
    if (visited[idx]) continue;
    visited[idx] = 1;
    const pIdx = idx * 4;
    const r = data[pIdx], g = data[pIdx + 1], b = data[pIdx + 2];
    if (!isNearWhite(r, g, b)) continue;
    result.push(idx);
    stack.push([x + 1, y], [x - 1, y], [x, y + 1], [x, y - 1]);
  }
  return result;
}

async function processImage(inputPath, outputPath) {
  const image = sharp(inputPath);
  const meta = await image.metadata();
  if (!meta.width || !meta.height) return { changed: false, reason: 'no dimensions' };
  const { data, info } = await image.ensureAlpha().raw().toBuffer({ resolveWithObject: true });
  const { width, height, channels } = info;
  const bgSet = new Set();
  const seeds = [
    [0, 0], [width - 1, 0], [0, height - 1], [width - 1, height - 1],
    [Math.floor(width / 2), 0], [Math.floor(width / 2), height - 1],
    [0, Math.floor(height / 2)], [width - 1, Math.floor(height / 2)],
    [Math.floor(width / 4), 0], [Math.floor(width * 3 / 4), 0],
    [Math.floor(width / 4), height - 1], [Math.floor(width * 3 / 4), height - 1],
    [0, Math.floor(height / 4)], [0, Math.floor(height * 3 / 4)],
    [width - 1, Math.floor(height / 4)], [width - 1, Math.floor(height * 3 / 4)]
  ];
  for (const [x, y] of seeds) {
    const filled = floodFill(width, height, data, x, y);
    for (const i of filled) bgSet.add(i);
  }
  if (bgSet.size === 0) return { changed: false, reason: 'no white background at edges' };
  const isBg = new Uint8Array(width * height);
  for (const i of bgSet) isBg[i] = 1;
  const output = Buffer.alloc(width * height * 4);
  for (let i = 0; i < width * height; i++) {
    const p = i * 4;
    const r = data[p], g = data[p + 1], b = data[p + 2], a = data[p + 3];
    if (isBg[i]) {
      output[p] = 0; output[p + 1] = 0; output[p + 2] = 0; output[p + 3] = 0;
    } else {
      const x = i % width, y = Math.floor(i / width);
      let nearBg = 0;
      for (let dy = -2; dy <= 2; dy++) {
        for (let dx = -2; dx <= 2; dx++) {
          if (dx === 0 && dy === 0) continue;
          const nx = x + dx, ny = y + dy;
          if (nx >= 0 && nx < width && ny >= 0 && ny < height) {
            if (isBg[ny * width + nx]) nearBg++;
          }
        }
      }
      if (nearBg > 0 && isNearWhite(r, g, b)) {
        const fade = Math.max(0.3, 1 - nearBg / 24);
        output[p] = r; output[p + 1] = g; output[p + 2] = b;
        output[p + 3] = Math.round(255 * fade);
      } else {
        output[p] = r; output[p + 1] = g; output[p + 2] = b; output[p + 3] = a;
      }
    }
  }
  await sharp(output, { raw: { width: width, height: height, channels: 4 } }).png().toFile(outputPath);
  return { changed: true, bgPixels: bgSet.size, total: width * height };
}

function copyRecursive(src, dst) {
  fs.mkdirSync(dst, { recursive: true });
  const entries = fs.readdirSync(src, { withFileTypes: true });
  for (const e of entries) {
    if (e.name === 'assets_original') continue;
    const s = path.join(src, e.name);
    const d = path.join(dst, e.name);
    if (e.isDirectory()) copyRecursive(s, d);
    else fs.copyFileSync(s, d);
  }
}

async function main() {
  if (!fs.existsSync(ORIGINAL_DIR)) {
    copyRecursive(ASSETS_DIR, ORIGINAL_DIR);
    console.log('Copied assets -> assets_original');
  } else {
    console.log('assets_original already exists, using it as source');
  }
  const files = [];
  function collect(dir) {
    const entries = fs.readdirSync(dir, { withFileTypes: true });
    for (const e of entries) {
      const full = path.join(dir, e.name);
      if (e.isDirectory()) {
        if (e.name === 'assets_original') continue;
        collect(full);
      } else {
        const shouldProcess =
          TARGET_FILES.includes(e.name.toLowerCase()) ||
          SYMBOL_PATTERN.test(e.name);
        if (shouldProcess) {
          const rel = path.relative(ASSETS_DIR, full);
          files.push({ full: full, rel: rel });
        }
      }
    }
  }
  collect(ASSETS_DIR);
  console.log('Found ' + files.length + ' images to process');
  const stats = { processed: 0, changed: 0, skipped: 0, errors: 0 };
  const skippedList = [];
  const changedList = [];
  for (const f of files) {
    const originalPath = path.join(ORIGINAL_DIR, f.rel);
    try {
      const info = await processImage(originalPath, f.full);
      stats.processed++;
      if (info.changed) {
        stats.changed++;
        const pct = ((info.bgPixels / info.total) * 100).toFixed(1);
        console.log('  OK  ' + f.rel + ' (' + info.bgPixels + ' bg px, ' + pct + '%)');
        changedList.push(f.rel);
      } else {
        stats.skipped++;
        console.log('  --  ' + f.rel + ' (' + info.reason + ')');
        skippedList.push(f.rel + ' :: ' + info.reason);
      }
    } catch (err) {
      stats.errors++;
      console.error('  ERR ' + f.rel + ' -> ' + err.message);
    }
  }
  console.log('');
  console.log('='.repeat(70));
  console.log('SUMMARY');
  console.log('='.repeat(70));
  console.log('Processed: ' + stats.processed);
  console.log('Changed:   ' + stats.changed);
  console.log('Skipped:   ' + stats.skipped);
  console.log('Errors:    ' + stats.errors);
  if (skippedList.length > 0) {
    console.log('');
    console.log('SKIPPED (no changes applied):');
    for (const s of skippedList) console.log('  - ' + s);
  }
}

main().catch(function (err) { console.error(err); process.exit(1); });
