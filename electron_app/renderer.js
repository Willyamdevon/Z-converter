const dropZone = document.getElementById('drop-zone');
const statusElement = document.getElementById('status');
const convertBtn = document.getElementById('convertBtn');
const formatSelect = document.getElementById('formatSelect');
const selectFolder = document.getElementById('selectFolderBtn');
const nameDoc = document.getElementById("nameDocument")
const qualityValue = document.getElementById("qualitySlider")
// const path = window.require('path');


const getFilename = (filePath) => {
  const parts = filePath.replace(/\\/g, '/').split('/');
  return parts.pop();
};

const removeExtension = (filename) => {
  const lastDotIndex = filename.lastIndexOf('.');
  return lastDotIndex === -1 ? filename : filename.slice(0, lastDotIndex);
};
function shortenFilename(filename) {
  const lastDotIndex = filename.lastIndexOf('.');
  const name = lastDotIndex === -1 ? filename : filename.substring(0, lastDotIndex);
  const extension = lastDotIndex === -1 ? '' : filename.substring(lastDotIndex + 1);

  const shortenedName = name.length > 15 
    ? name.substring(0, 15) + '...' 
    : name;

  return extension 
    ? `${shortenedName}.${extension}`
    : shortenedName;
}
function getBasename(path) {
  const filename = path.split('/').pop()
  return filename.split('.').slice(0, -1).join('.');
}

function getBasenameForRender(filePath) {
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


async function processSelectedFile(filePath) {
  try {
    const validExtensions = ['.jpg', '.jpeg', '.png', '.gif', '.mp4', '.mkv', ".mp3", ".wav", '.mov'];
    const fileExt = filePath.slice(filePath.lastIndexOf('.')).toLowerCase();

    if (!validExtensions.includes(fileExt)) {
      statusElement.textContent = 'Ошибка: такой формат не поддерживается';
      statusElement.className = 'error';
      return;
    }

    convertBtn.disabled = false;
    convertBtn.dataset.inputPath = filePath;

    statusElement.className = 'success';


    console.log()
    switch (fileExt) {
      case '.png': 
        formatSelect.innerHTML = `                  
        <option value="jpg">JPG</option>
        <option value="gif">GIF</option>`;
        formatSelect.value = 'jpg';
        break;
      case '.jpg': 
              formatSelect.innerHTML = `                                   
                  <option value="png">PNG</option>
                  <option value="gif">GIF</option>
                  <option value="ico">ICO</option>`;
        formatSelect.value = 'png';
        break;
      case '.ico': 
                    formatSelect.innerHTML = `<option value="jpg">JPG</option>`;
        formatSelect.value = 'jpg';
        break;
      case '.mkv':
        formatSelect.innerHTML = `                                 
                  <option value="mp4">MP4</option>
                  <option value="wav">WAV</option>
                  <option value="mp3">MP3</option>
                  <option value="mov">MOV</option>`;
        formatSelect.value = 'mp4';
        break;
      case '.mp4':        
        formatSelect.innerHTML = `                                 
                  <option value="wav">WAV</option>
                  <option value="mp3">MP3</option>
                  <option value="mov">MOV</option>`;
        formatSelect.value = 'mp3';
        break;
      case '.mp3':
        formatSelect.innerHTML = `<option value="wav">WAV</option>`;
        formatSelect.value = 'wav';
        break;
      case '.wav':
        formatSelect.innerHTML = `<option value="mp3">MP3</option>`;
        formatSelect.value = 'mp3';
        break;
      case '.mov':
        formatSelect.innerHTML = `
                  <option value="mp4">MP4</option>
                  <option value="wav">WAV</option>
                  <option value="mp3">MP3</option>`;
        formatSelect.value = 'mp4';
        break;

    }
    let input = document.getElementById('convertBtn').dataset.inputPath;
    let name = `${getBasenameForRender(input)}.${input.split('.')[input.split('.').length - 1]}`;
    console.log(name)
    nameDoc.innerHTML = `<div class="p-3 border border-gray-100 rounded-lg hover:bg-slate-50 transition-colors flex items-center justify-between gap-2 w-full">
                              <div class="flex items-center gap-2 min-w-0 flex-1">
                                <span class="material-symbols-outlined text-primary-600 flex-shrink-0">description</span>
                                <span class="truncate text-sm">${shortenFilename(name)}</span>
                              </div>

                              <div class="flex items-center gap-1 min-w-0 flex-shrink-0">
                              <div class="text-sm text-gray-500 break-words" id="statusFile">
                                Ожидает конвертации
                              </div>
                                <button id="deleteFile" class="w-6 h-6 flex-shrink-0 flex items-center justify-center rounded-full text-gray-500 hover:bg-red-100 hover:text-red-600 transition-colors">
                                  <span class="material-symbols-outlined text-sm">close</span>
                                </button>
                              </div>
                              </div>
                              `

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
  }
});

document.getElementById('convertBtn').addEventListener('click', async () => {
  const inputPath = document.getElementById('convertBtn').dataset.inputPath;
  let folderPath = selectFolder.dataset.folderPath;
  const outputFormat = document.getElementById('formatSelect').value;
  const statusEl = document.getElementById('statusFile');
  const convertBtn = document.getElementById('convertBtn');
  const deleteBtn = document.getElementById('deleteFile');

  if (!inputPath) {
    statusEl.textContent = 'Ошибка: файл не выбран';
    statusEl.className = 'error';
    return;
  }

  try {
    deleteBtn.disabled = true;
    deleteBtn.style.background = "grey";
    convertBtn.disabled = true;
    statusEl.textContent = 'Конвертация...';
    statusEl.className = 'processing';
    console.log(outputFormat)
    const type = inputPath.split('.').pop().toLowerCase() + "-to-" + outputFormat ;
    let result, options;
    if (type == "png-to-jpg") {
      let options = {quality: qualityValue.value};
      console.log(options)
    };

    if (!folderPath) {
      result = await window.electronAPI.convertFile({
        type,
        inputPath,
        outputPath: `${inputPath.split('.').slice(0, -1).join('.')}.${outputFormat}`,
        options
      });
    } else {
      const filename = getFilename(inputPath);
      const nameWithoutExt = removeExtension(filename);
      const outputPath = `${folderPath.replace(/\\/g, '/')}/${nameWithoutExt}.${outputFormat}`;
      result = await window.electronAPI.convertFile({
        type,
        inputPath,
        outputPath: outputPath,
        options
      });
    }

    if (result.success) {
      statusEl.textContent = 'Готово!';
      statusEl.className = 'success';

      setTimeout(() => {
        if (confirm(`Конвертация завершена! Открыть папку с результатом?`)) {
          window.electronAPI.openFolder(result.outputPath);
        }
      }, 500);
    } else {
      statusEl.textContent = `Ошибка: ${result.error}`;
      statusEl.className = 'error';
    }
    deleteBtn.disabled = false;
    deleteBtn.style.background = "";
  } catch (error) {
    console.error('Ошибка конвертации:', error);
    statusEl.textContent = `Ошибка: ${error.message || 'Не удалось выполнить конвертацию'}`;
    statusEl.className = 'error';
  } finally {
    convertBtn.disabled = false;
  }
});
document.addEventListener('click', async (event) => {
  if (event.target.closest('#deleteFile')) {
    console.log('Удаление файла...');

    const nameDoc = document.getElementById('nameDocument');
    if (nameDoc) nameDoc.innerHTML = "";

    const convertBtn = document.getElementById('convertBtn');
    if (convertBtn) convertBtn.dataset.inputPath = "";

    const statusElement = document.getElementById('status');
    if (statusElement) {
      statusElement.textContent = '';
      statusElement.className = '';
    }

    if (convertBtn) convertBtn.disabled = true;
  }
});