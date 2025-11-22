import sharp from 'sharp';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const publicDir = path.join(__dirname, '..', 'public');
const logoPath = path.join(publicDir, 'logo.svg');

// Icon sizes to generate
const sizes = [
  { name: 'pwa-64x64.png', size: 64 },
  { name: 'pwa-192x192.png', size: 192 },
  { name: 'pwa-512x512.png', size: 512 },
  { name: 'apple-touch-icon.png', size: 180 },
  { name: 'favicon.ico', size: 32 }
];

// Generate maskable icon (with safe zone)
async function generateMaskableIcon() {
  const size = 512;
  const safeZoneSize = Math.floor(size * 0.8); // 80% safe zone
  const offset = Math.floor((size - safeZoneSize) / 2);

  // Create white background
  const background = await sharp({
    create: {
      width: size,
      height: size,
      channels: 4,
      background: { r: 12, g: 13, b: 16, alpha: 1 }
    }
  }).png().toBuffer();

  // Resize logo to fit safe zone
  const logo = await sharp(logoPath)
    .resize(safeZoneSize, safeZoneSize, {
      fit: 'contain',
      background: { r: 0, g: 0, b: 0, alpha: 0 }
    })
    .toBuffer();

  // Composite logo onto background
  await sharp(background)
    .composite([{
      input: logo,
      top: offset,
      left: offset
    }])
    .png()
    .toFile(path.join(publicDir, 'maskable-icon-512x512.png'));

  console.log('✓ Generated maskable-icon-512x512.png');
}

// Generate standard icons
async function generateIcons() {
  console.log('🎨 Generating PWA icons...\n');

  for (const { name, size } of sizes) {
    try {
      const outputPath = path.join(publicDir, name);

      if (name.endsWith('.ico')) {
        // Generate favicon
        await sharp(logoPath)
          .resize(size, size, { fit: 'contain', background: { r: 12, g: 13, b: 16, alpha: 1 } })
          .png()
          .toFile(outputPath.replace('.ico', '.png'));

        // Rename to .ico (browsers accept PNG as .ico)
        fs.renameSync(outputPath.replace('.ico', '.png'), outputPath);
      } else {
        // Generate PNG
        await sharp(logoPath)
          .resize(size, size, { fit: 'contain', background: { r: 12, g: 13, b: 16, alpha: 1 } })
          .png()
          .toFile(outputPath);
      }

      console.log(`✓ Generated ${name}`);
    } catch (error) {
      console.error(`✗ Failed to generate ${name}:`, error.message);
    }
  }

  // Generate maskable icon
  await generateMaskableIcon();

  console.log('\n✅ All PWA icons generated successfully!');
}

generateIcons().catch(console.error);
