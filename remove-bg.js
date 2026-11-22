const sharp = require('sharp');
const fs = require('fs');
const path = require('path');

const assetsDir = path.join(__dirname, 'public', 'assets');
const folders = fs.readdirSync(assetsDir).filter(f => fs.statSync(path.join(assetsDir, f)).isDirectory());

let processed = 0;
let skipped = 0;

folders.forEach(folder => {
  const charPath = path.join(assetsDir, folder, 'character.png');
  if (!fs.existsSync(charPath)) {
    skipped++;
    return;
  }
  
  sharp(charPath)
    .ensureAlpha()
    .raw()
    .toBuffer({ resolveWithObject: true })
    .then(({ data, info }) => {
      const { width, height, channels } = info;
      const output = Buffer.alloc(width * height * 4);
      
      for (let i = 0; i < width * height; i++) {
        const r = data[i * channels];
        const g = data[i * channels + 1];
        const b = data[i * channels + 2];
        
        // إذا البكسل أبيض (أو قريب من الأبيض) → اجعله شفاف
        if (r > 240 && g > 240 && b > 240) {
          output[i * 4] = 0;
          output[i * 4 + 1] = 0;
          output[i * 4 + 2] = 0;
          output[i * 4 + 3] = 0; // شفاف
        } else {
          output[i * 4] = r;
          output[i * 4 + 1] = g;
          output[i * 4 + 2] = b;
          output[i * 4 + 3] = 255; // معتم
        }
      }
      
      return sharp(output, { raw: { width, height, channels: 4 } })
        .png()
        .toFile(charPath.replace('.png', '.tmp.png'));
    })
    .then(() => {
      fs.renameSync(charPath.replace('.png', '.tmp.png'), charPath);
      processed++;
      console.log(`✓ ${folder}/character.png`);
    })
    .catch(err => console.error(`✗ ${folder}: ${err.message}`));
});

setTimeout(() => {
  console.log(`\nDone: ${processed} processed, ${skipped} skipped`);
  process.exit(0);
}, 10000);
