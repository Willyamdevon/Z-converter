const dropZone = document.getElementById('drop-zone');
const statusElement = document.getElementById('status');
const convertBtn = document.getElementById('convertBtn');
const formatSelect = document.getElementById('formatSelect');
const selectFolder = document.getElementById('selectFolderBtn');
// const path = window.require('path');


function getBasename(filePath) {
  return filePath.split(/[\\/]/).pop().split('.')[0];
}


// Обработчик для кнопки "Выбрать файл" (ваш текущий код)
document.getElementById('selectBtn').addEventListener('click', handleFileSelection);

// Обработчики для drag & drop
dropZone.addEventListener('dragover', (e) => {
  e.preventDefault();
  dropZone.classList.add('highlight');
});

dropZone.addEventListener('dragleave', () => {
  dropZone.classList.remove('highlight');
});

dropZone.addEventListener('drop', (e) => {
  e.preventDefault();
  dropZone.classList.remove('highlight');

  const file = e.dataTransfer.files[0];
  if (!file) return;

  processSelectedFile(file.path);
});

// Функция для обработки выбранного файла (аналогично кнопке)
async function processSelectedFile(filePath) {
  try {
    const validExtensions = ['.jpg', '.jpeg', '.png', '.gif', '.webp'];
    const fileExt = filePath.slice(filePath.lastIndexOf('.')).toLowerCase();

    if (!validExtensions.includes(fileExt)) {
      statusElement.textContent = 'Ошибка: выберите изображение (JPG/PNG/GIF/WEBP)';
      statusElement.className = 'error';
      return;
    }

    convertBtn.disabled = false;
    convertBtn.dataset.inputPath = filePath;

    const fileName = filePath.split(/[\\/]/).pop();
    statusElement.textContent = `Выбрано: ${fileName}`;
    statusElement.className = 'success';

    // Автоматически выбираем формат для конвертации
    if (fileExt === '.jpg' || fileExt === '.jpeg') {
      formatSelect.value = 'png';
    } else if (fileExt === '.png') {
      formatSelect.value = 'jpg';
    } else if (fileExt === '.gif') {
      formatSelect.value = 'webp';
    }
  } catch (error) {
    console.error('Ошибка обработки файла:', error);
    statusElement.textContent = 'Ошибка: не удалось загрузить файл';
    statusElement.className = 'error';
  }
  const folderPath = "";
}

// Ваша текущая функция для кнопки (оставляем как есть)
async function handleFileSelection() {
  try {
    const inputPath = await window.electronAPI.openFileDialog();
    if (!inputPath) {
      console.log('Выбор файла отменён');
      return;
    }
    processSelectedFile(inputPath);
  } catch (error) {
    console.error('Ошибка выбора файла:', error);
    statusElement.textContent = 'Ошибка: не удалось выбрать файл';
    statusElement.className = 'error';
  }
}

selectFolder.addEventListener('click', async () => {
  try {
    const folderPath = await window.electronAPI.openFolderDialog();
    
    if (!folderPath) {
      console.log('Выбор папки отменён');
      return;
    }
    
    document.getElementById('folderStatus').textContent = `Выбрана папка: ${folderPath}`;
    selectFolder.dataset.folderPath = folderPath;
  } catch (error) {
    console.error('Ошибка выбора папки:', error);
    // document.getElementById('folderStatus').textContent = 'Ошибка выбора папки';
  }
});

document.getElementById('convertBtn').addEventListener('click', async () => {
  const inputPath = document.getElementById('convertBtn').dataset.inputPath;
  let folderPath = selectFolder.dataset.folderPath;
  const outputFormat = document.getElementById('formatSelect').value;
  const statusEl = document.getElementById('status');
  const convertBtn = document.getElementById('convertBtn');

  if (!inputPath) {
    statusEl.textContent = 'Error: No file selected';
    statusEl.className = 'error';
    return;
  }

  try {
    // Блокируем кнопку во время конвертации
    convertBtn.disabled = true;
    statusEl.textContent = 'Converting... Please wait';
    statusEl.className = 'processing';
    let result;
    //TODO: пофичить костыль
    const type = inputPath.slice(-3) + "-to-" + outputFormat.slice(-3);
    if (!folderPath){
      result = await window.electronAPI.convertFile({
        type,
        inputPath,
        outputPath: `${inputPath.split('.')[0]}.${outputFormat}` // сохраняем путь к выходному файлу
      });
    } else {
      let Path = `${folderPath}/${getBasename(inputPath)}.${outputFormat}`;
      result = await window.electronAPI.convertFile({
        type,
        inputPath,
        outputPath: Path // сохраняем путь к выходному файлу
      });
    }

    if (result.success) {
      const fileName = result.outputPath.split(/[\\/]/).pop();
      statusEl.textContent = `Success! File saved as: ${fileName}`;
      statusEl.className = 'success';

      // Предлагаем открыть папку с результатом
      setTimeout(() => {
        if (confirm(`Conversion complete! Would you like to open the output folder ${result.outputPath}?`)) {
          window.electronAPI.openFolder(result.outputPath);
        }
      }, 500);
    } else {
      statusEl.textContent = `Error: ${result.error}`;
      statusEl.className = 'error';
    }
  } catch (error) {
    console.error('Conversion error:', error);
    statusEl.textContent = `Error: ${error.message || 'Conversion failed'}`;
    statusEl.className = 'error';
  } finally {
    convertBtn.disabled = false;
  }
});
