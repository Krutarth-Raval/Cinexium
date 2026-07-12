const fs = require('fs');
const path = require('path');
const sharp = require('sharp');

async function generateIcons() {
  const publicDir = path.join(__dirname, 'public');
  
  const logoMarkSvg = fs.readFileSync(path.join(publicDir, 'logo-mark.svg'));
  const logoFullSvg = fs.readFileSync(path.join(publicDir, 'logo-full.svg'));

  console.log('Generating icon-192.png...');
  await sharp(logoMarkSvg)
    .resize(192, 192)
    .png()
    .toFile(path.join(publicDir, 'icon-192.png'));

  console.log('Generating icon-512.png...');
  await sharp(logoMarkSvg)
    .resize(512, 512)
    .png()
    .toFile(path.join(publicDir, 'icon-512.png'));

  console.log('Generating apple-touch-icon.png...');
  await sharp(logoMarkSvg)
    .resize(180, 180)
    .png()
    .toFile(path.join(publicDir, 'apple-touch-icon.png'));

  console.log('Generating og-image.png...');
  // For OG Image, usually 1200x630, let's put the full logo in the center of a dark background
  await sharp({
    create: {
      width: 1200,
      height: 630,
      channels: 4,
      background: { r: 15, g: 17, b: 21, alpha: 1 } // #0f1115
    }
  })
  .composite([
    {
      input: await sharp(logoFullSvg).resize({ width: 800 }).toBuffer(),
      gravity: 'center'
    }
  ])
  .png()
  .toFile(path.join(publicDir, 'og-image.png'));

  console.log('All icons generated successfully!');
}

generateIcons().catch(console.error);
