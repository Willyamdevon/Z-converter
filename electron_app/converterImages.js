const sharp = require('sharp');
const ico = require('icojs');
const { GIFEncoder, quantize, applyPalette } = require('gifenc');

async function convertPngToGif(inputPath, outputPath) {
  try {
    const image = sharp(inputPath);
    const { data, info } = await image.raw().toBuffer({ resolveWithObject: true });

    const palette = quantize(data, 256);
    const indexedPixels = applyPalette(data, palette);

    const gif = GIFEncoder({
      width: info.width,
      height: info.height,
      palette: palette,
    });

    gif.writeFrame(indexedPixels, info.width, info.height, {
      palette,
      delay: 100,
    });

    gif.finish();
    const gifBuffer = gif.bytes();

    await sharp(gifBuffer, { animated: true }).toFile(outputPath);
    
    console.log(`Конвертация завершена: ${outputPath}`);
  } catch (err) {
    console.error('Ошибка при конвертации:', err);
  }
}

async function convertJpgToGif(inputPath, outputPath, options = {}) {
  try {
    const { delay = 100, quality = 256 } = options;

    const { data, info } = await sharp(inputPath)
      .ensureAlpha()
      .raw()
      .toBuffer({ resolveWithObject: true });

    const palette = quantize(data, quality);
    const indexedPixels = applyPalette(data, palette);

    const gif = GIFEncoder({
      width: info.width,
      height: info.height
    });

    gif.writeFrame(indexedPixels, info.width, info.height, {
      palette,
      delay
    });

    gif.finish();
    await sharp(gif.bytes(), { animated: true }).toFile(outputPath);

    console.log(`✅ Конвертация успешна: ${outputPath}`);
  } catch (err) {
    console.error('❌ Ошибка:', err);
  }
}

async function pngToJpg(inputPath, outputPath, quality = 80) {
  try {
    await sharp(inputPath)
      .flatten({ background: '#ffffff' })
      .jpeg({ quality })
      .toFile(outputPath);
    
    console.log(`✅ PNG → JPG: ${outputPath}`);
  } catch (err) {
    console.error('❌ Ошибка:', err);
  }
}

async function jpgToPng(inputPath, outputPath) {
  try {
    await sharp(inputPath)
      .png({ compressionLevel: 9 }) // Уровень сжатия (0-9)
      .toFile(outputPath);
    
    console.log(`✅ JPG → PNG: ${outputPath}`);
  } catch (err) {
    console.error('❌ Ошибка:', err);
  }
}

async function convertIcoToPngOrJpg(inputPath, outputPath) {
  try {
    const icoBuffer = await sharp(inputPath).toBuffer();
    const images = await ico.parse(icoBuffer);
    
    // Конвертируем в PNG/JPG
    await sharp(images[0].buffer)
      .toFormat(inputPath.slice(0,-3))
      .toFile(outputPath);
    
    console.log(`✅ ICO → PNG: ${outputPath}`);
  } catch (err) {
    console.error('❌ Ошибка:', err);
  }
}

async function convertToIco(inputPath, outputPath, sizes = [16, 32, 64]) {
  try {
    const images = await Promise.all(
      sizes.map(size => 
        sharp(inputPath)
          .resize(size)
          .toBuffer()
      )
    );

    const icoBuffer = await ico.encode(images.map((data, i) => ({
      width: sizes[i],
      height: sizes[i],
      buffer: data
    })));

    await sharp(icoBuffer).toFile(outputPath);
    console.log(`✅ Конвертация в ICO успешна: ${outputPath}`);
  } catch (err) {
    console.error('❌ Ошибка:', err);
  }
}

// Пример использования
convertToIco('icon.png', 'favicon.ico', [16, 32, 48, 128]);
// Пример использования
convertIcoToPng('favicon.ico', 'icon.png');

// jpgToPng('source/input.jpg', 'source/output.png');
// // Использование
// pngToJpg('source/input.png', 'source/output.jpg', 90);
// convertJpgToGif('source/input.jpg', 'source/output.gif', {
//   delay: 200,
//   quality: 128
// });