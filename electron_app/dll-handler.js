const path = require('path');
const { dialog } = require('electron');
const {
  convertPngToGif,
  convertJpgToGif,
  convertPngToJpg,
  convertJpgToPng,
  convertJpgToIco,
  convertIcoToJpg,
  convertMp4ToMp3,
  convertMkvToMp4,
  convertMkvToMp3,
  convertMkvToWav,
  convertMkvToMov,
  convertMp4ToWav,
  convertMp4ToMov,
  convertMp3ToWav,
  convertWavToMp3,
  convertWebpToJpg,
  convertPngToWebp,
  convertWebpToPng,
  convertJpgToWebp
} = require('./converterImages');

const converters = {
  'png-gif': convertPngToGif,
  'jpg-gif': convertJpgToGif,
  'png-jpg': convertPngToJpg,
  'jpg-png': convertJpgToPng,
  'jpg-ico': convertJpgToIco,
  'ico-jpg': convertIcoToJpg,
  'mp4-mp3': convertMp4ToMp3,
  'mkv-mp4': convertMkvToMp4,
  'mkv-mp3': convertMkvToMp3,
  'mkv-wav': convertMkvToWav,
  'mkv-mov': convertMkvToMov,
  'mp4-wav': convertMp4ToWav,
  'mp4-mov': convertMp4ToMov,
  'mp3-wav': convertMp3ToWav,
  'wav-mp3': convertWavToMp3,
  'webp-jpg': convertWebpToJpg,
  'png-webp': convertPngToWebp,
  'webp-png': convertWebpToPng,
  'jpg-webp': convertJpgToWebp,

    
};

async function handleDllConversion(args) {
  const argMap = Object.fromEntries(args.map(arg => {
    const [key, value] = arg.split('=');
    return [key.replace(/^--/, ''), value?.replace(/^"(.*)"$/, '$1')];
  }));

  const { from, to, file: inputPath, output: outputPath } = argMap;

  if (!from || !to || !inputPath || !outputPath) {
    dialog.showErrorBox('Ошибка запуска', 'Недостаточно аргументов: ожидаются --from, --to, --file и --output.');
    return;
  }

  const key = `${from}-${to}`;
  const fn = converters[key];

  if (!fn) {
    dialog.showErrorBox('Ошибка', `Функция конвертации "${key}" не найдена.`);
    return;
  }

  try {
    const result = await fn(inputPath, outputPath);
    if (result.success) {
      dialog.showMessageBox({
        type: 'info',
        title: 'Готово',
        message: `Файл успешно сконвертирован:\n${outputPath}`
      });
    } else {
      dialog.showErrorBox('Ошибка конвертации', result.error || 'Неизвестная ошибка.');
    }
  } catch (err) {
    dialog.showErrorBox('Исключение при конвертации', err.message || 'Неизвестная ошибка.');
  }
}

module.exports = { handleDllConversion };
