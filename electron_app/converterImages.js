const sharp = require('sharp'); 
const path = require('path');
const fs = require('fs');
const ffmpeg = require('fluent-ffmpeg');
const isDev = require('electron-is-dev'); // npm install electron-is-dev

let ffmpegPath = null;

if (isDev) {
  // В dev-режиме: ffmpeg.exe лежит в ./resources/ рядом с исходниками
  const devPath = path.join(__dirname, 'resources', 'ffmpeg.exe');
  if (fs.existsSync(devPath)) {
    ffmpegPath = devPath;
    console.log("Dev mode: ffmpeg.exe path:", ffmpegPath);
  } else {
    console.error("Dev mode: ffmpeg.exe not found in ./resources/");
  }
} else {
  // В production-режиме: ffmpeg.exe лежит в resourcesPath
  const prodPath = path.join(process.resourcesPath, 'ffmpeg.exe');
  if (fs.existsSync(prodPath)) {
    ffmpegPath = prodPath;
    console.log("Prod mode: ffmpeg.exe path:", ffmpegPath);
  } else {
    console.error("Prod mode: ffmpeg.exe not found in process.resourcesPath");
  }
}

if (ffmpegPath) {
  ffmpeg.setFfmpegPath(ffmpegPath);
  console.log("FFmpeg path set:", ffmpegPath);
} else {
  console.error("FFmpeg path not set!");
}

// Возвращает ffmpeg-экземпляр
function createFfmpeg(inputPath) {
  return ffmpeg(inputPath);
}


module.exports = 
{    
    async convertPngToGif(inputPath, outputPath) {
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

    async convertPngToJpg(inputPath, outputPath, quality = 80) {
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

    async convertJpgToPng(inputPath, outputPath) {
        try {
            await sharp(inputPath)
                .png({ compressionLevel: 9 })
                .toFile(outputPath);
            
            return { success: true, outputPath };
        } catch (err) {
            console.error('Ошибка при конвертации JPG в PNG:', err);
            return { success: false, error: err.message };
        }
    },

    async convertJpgToIco(inputPath, outputPath, sizes = [16, 32, 64]) {
    try {
        // Создаём несколько размеров для ICO
        const buffers = await Promise.all(
            sizes.map(size => 
                sharp(inputPath)
                    .resize(size)
                    .toFormat('png')
                    .toBuffer()
            )
        );
        
        await sharp({
            create: {
                width: sizes[0],
                height: sizes[0],
                channels: 4,
                background: { r: 0, g: 0, b: 0, alpha: 0 }
            }
        })
        .composite(buffers.map((buffer, i) => ({
            input: buffer,
            raw: { width: sizes[i], height: sizes[i], channels: 4 }
        })))
        .toFile(outputPath);
        
        return { success: true, outputPath };
    } catch (err) {
        console.error('Ошибка при конвертации JPG в ICO:', err);
        return { success: false, error: err.message };
    }
    },

    async convertIcoToJpg(inputPath, outputPath, size = 256, quality = 80) {
        try {
            // Сначала конвертируем в PNG, затем в JPG
            const pngBuffer = await icoToPng(inputPath, size);
            await sharp(pngBuffer)
                .jpeg({ quality })
                .toFile(outputPath);
                
            return { success: true, outputPath };
        } catch (err) {
            console.error('Ошибка при конвертации ICO в JPG:', err);
            return { success: false, error: err.message };
        }
    },
    async convertMkvToMp4(inputPath, outputPath) {
    const ffmpegCommand = require('fluent-ffmpeg');
    const ffmpegPath = require('ffmpeg-static');

    return new Promise((resolve, reject) => {
        ffmpegCommand()
            .setFfmpegPath(ffmpegPath) // <== ЛОКАЛЬНОЕ задание пути, 100% работает
            .input(inputPath)
            .output(outputPath)
            .videoCodec('libx264')
            .audioCodec('aac')
            .on('end', () => resolve({ success: true, outputPath }))
            .on('error', (err) => {
                console.error('Ошибка при конвертации MKV в MP4:', err);
                reject({ success: false, error: err.message });
            })
            .run();
    });
    },
    async convertMkvToMp3(inputPath, outputPath, quality = 192) {
        return new Promise((resolve, reject) => {
            createFfmpeg(inputPath)
                .noVideo()
                .audioCodec('libmp3lame')
                .audioBitrate(quality)
                .output(outputPath)
                .on('end', () => resolve({ success: true, outputPath }))
                .on('error', (err) => {
                    console.error('Ошибка при конвертации MKV в MP3:', err);
                    reject({ success: false, error: err.message });
                })
                .run();
        });
    },

    async convertMkvToWav(inputPath, outputPath) {
        return new Promise((resolve, reject) => {
            createFfmpeg(inputPath)
                .noVideo()
                .audioCodec('pcm_s16le')
                .audioChannels(2)
                .audioFrequency(44100)
                .format('wav')
                .output(outputPath)
                .on('end', () => resolve({ success: true, outputPath }))
                .on('error', (err) => {
                    console.error('Ошибка при конвертации MKV в WAV:', err);
                    reject({ success: false, error: err.message });
                })
                .run();
        });
    },

    async convertMkvToMov(inputPath, outputPath) {
        return new Promise((resolve, reject) => {
            createFfmpeg(inputPath)
                .videoCodec('mpeg4')
                .audioCodec('aac')
                .output(outputPath)
                .on('end', () => resolve({ success: true, outputPath }))
                .on('error', (err) => {
                    console.error('Ошибка при конвертации MKV в MOV:', err);
                    reject({ success: false, error: err.message });
                })
                .run();
        });
    },

    async convertMp4ToMp3(inputPath, outputPath, quality = 192) {
        return new Promise((resolve, reject) => {
            createFfmpeg(inputPath)
                .noVideo()
                .audioCodec('libmp3lame')
                .audioBitrate(quality)
                .output(outputPath)
                .on('start', cmd => console.log('[FFmpeg cmd]', cmd))
                .on('stderr', line => console.log('[FFmpeg stderr]', line))
                .on('end', () => resolve({ success: true, outputPath }))
                .on('error', err => {
                    console.error('Ошибка при конвертации MP4 в MP3:', err);
                    reject({ success: false, error: err.message });
                })
                .run();
        });
    },

    async convertMp4ToWav(inputPath, outputPath) {
        return new Promise((resolve, reject) => {
            createFfmpeg(inputPath)
                .noVideo()
                .audioCodec('pcm_s16le')
                .audioChannels(2)
                .audioFrequency(44100)
                .format('wav')
                .output(outputPath)
                .on('end', () => resolve({ success: true, outputPath }))
                .on('error', (err) => {
                    console.error('Ошибка при конвертации MP4 в WAV:', err);
                    reject({ success: false, error: err.message });
                })
                .run();
        });
    },

    async convertMp4ToMov(inputPath, outputPath) {
        return new Promise((resolve, reject) => {
            createFfmpeg(inputPath)
                .videoCodec('mpeg4')
                .audioCodec('aac')
                .output(outputPath)
                .on('end', () => resolve({ success: true, outputPath }))
                .on('error', (err) => {
                    console.error('Ошибка при конвертации MP4 в MOV:', err);
                    reject({ success: false, error: err.message });
                })
                .run();
        });
    },
async convertMp3ToWav(inputPath, outputPath) {
        return new Promise((resolve, reject) => {
            createFfmpeg(inputPath)
                .audioCodec('pcm_s16le')
                .audioChannels(2)
                .audioFrequency(44100)
                .format('wav')
                .output(outputPath)
                .on('end', () => resolve({ success: true, outputPath }))
                .on('error', (err) => {
                    console.error('Ошибка при конвертации MP3 в WAV:', err);
                    reject({ success: false, error: err.message });
                })
                .run();
        });
    },

    async convertWavToMp3(inputPath, outputPath, quality = 192) {
        return new Promise((resolve, reject) => {
            createFfmpeg(inputPath)
                .audioCodec('libmp3lame')
                .audioBitrate(quality)
                .output(outputPath)
                .on('end', () => resolve({ success: true, outputPath }))
                .on('error', (err) => {
                    console.error('Ошибка при конвертации WAV в MP3:', err);
                    reject({ success: false, error: err.message });
                })
                .run();
        });
    }
};