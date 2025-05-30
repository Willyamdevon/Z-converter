const sharp = require('sharp');
const { GIFEncoder, quantize, applyPalette } = require('gifenc');

module.exports = 
{    async convertPngToGif(inputPath, outputPath) {
        try {
            const image = sharp(inputPath);
            const { data, info } = await image.raw().toBuffer({ resolveWithObject: true });

            const palette = quantize(data, 256);
            const indexedPixels = applyPalette(data, palette);

            const gif = GIFEncoder({
                width: info.width,
                height: info.height,
            });

            gif.writeFrame(indexedPixels, info.width, info.height, {
                palette,
                delay: 100,
            });

            gif.finish();
            await sharp(gif.bytes(), { animated: true }).toFile(outputPath);
            
            return { success: true, outputPath };
        } catch (err) {
            console.error('Ошибка при конвертации PNG в GIF:', err);
            return { success: false, error: err.message };
        }
    },

    async convertJpgToGif(inputPath, outputPath, options = {}) {
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

            return { success: true, outputPath };
        } catch (err) {
            console.error('Ошибка при конвертации JPG в GIF:', err);
            return { success: false, error: err.message };
        }
    },

    async pngToJpg(inputPath, outputPath, quality = 80) {
        try {
            await sharp(inputPath)
                .flatten({ background: '#ffffff' })
                .jpeg({ quality })
                .toFile(outputPath);
            
            return { success: true, outputPath };
        } catch (err) {
            console.error('Ошибка при конвертации PNG в JPG:', err);
            return { success: false, error: err.message };
        }
    },

    async jpgToPng(inputPath, outputPath) {
        try {
            await sharp(inputPath)
                .png({ compressionLevel: 9 })
                .toFile(outputPath);
            
            return { success: true, outputPath };
        } catch (err) {
            console.error('Ошибка при конвертации JPG в PNG:', err);
            return { success: false, error: err.message };
        }
    }
};