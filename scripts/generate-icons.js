/**
 * Generate PWA icons from SVG logo
 * Creates PNG icons at different sizes with and without maskable padding
 */

import sharp from 'sharp'
import { readFileSync } from 'fs'
import { fileURLToPath } from 'url'
import { dirname, join } from 'path'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

const LOGO_PATH = join(__dirname, '../public/logo.svg')
const OUTPUT_DIR = join(__dirname, '../public')

// Icon sizes to generate
const SIZES = [
  { size: 192, name: 'icon-192.png' },
  { size: 512, name: 'icon-512.png' }
]

// Maskable icons (with safe zone padding)
const MASKABLE_SIZES = [
  { size: 192, name: 'icon-maskable-192.png', padding: 38 }, // 20% padding
  { size: 512, name: 'icon-maskable-512.png', padding: 102 }  // 20% padding
]

async function generateIcon(inputSvg, size, outputPath, padding = 0) {
  try {
    let svgBuffer = readFileSync(inputSvg)

    if (padding > 0) {
      // Add padding for maskable icons by creating a larger canvas
      const canvas = `
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${size} ${size}">
          <rect width="${size}" height="${size}" fill="#0b1020"/>
          <svg x="${padding}" y="${padding}" width="${size - padding * 2}" height="${size - padding * 2}" viewBox="0 0 200 200">
            ${svgBuffer.toString().replace(/<svg[^>]*>/, '').replace(/<\/svg>/, '')}
          </svg>
        </svg>
      `
      svgBuffer = Buffer.from(canvas)
    }

    await sharp(svgBuffer)
      .resize(size, size, {
        fit: 'contain',
        background: { r: 11, g: 16, b: 32, alpha: 1 }
      })
      .png()
      .toFile(outputPath)

    console.log(`✓ Generated ${outputPath}`)
  } catch (error) {
    console.error(`✗ Failed to generate ${outputPath}:`, error.message)
  }
}

async function generateAllIcons() {
  console.log('Generating PWA icons from logo.svg...\n')

  // Generate standard icons
  for (const { size, name } of SIZES) {
    const outputPath = join(OUTPUT_DIR, name)
    await generateIcon(LOGO_PATH, size, outputPath)
  }

  // Generate maskable icons with padding
  for (const { size, name, padding } of MASKABLE_SIZES) {
    const outputPath = join(OUTPUT_DIR, name)
    await generateIcon(LOGO_PATH, size, outputPath, padding)
  }

  console.log('\n✓ All icons generated successfully!')
}

generateAllIcons().catch(console.error)
