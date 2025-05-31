const path = require('path');
const { dialog } = require('electron');
const {
  convertPngToGif,
  convertJpgToGif,
  convertPngToJpg,
  convertJpgToPng,
  convertMp4ToMp3
} = require('./converterImages');

const converters = {
  'png-gif': convertPngToGif,
  'jpg-gif': convertJpgToGif,
  'png-jpg': convertPngToJpg,
  'jpg-png': convertJpgToPng,
  'mp4-mp3': convertMp4ToMp3,
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
