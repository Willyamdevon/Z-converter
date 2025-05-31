const dropZone = document.getElementById('drop-zone');
const statusElement = document.getElementById('status');
const convertBtn = document.getElementById('convertBtn');
const formatSelect = document.getElementById('formatSelect');
const selectFolder = document.getElementById('selectFolderBtn');
const nameDoc = document.getElementById("nameDocument")
// const path = window.require('path');

function shortenFilename(filename) {
  // Разделяем имя файла и расширение
  const parts = filename.split('.');
  const extension = parts.length > 1 ? parts.pop() : ''; // Получаем расширение
  const name = parts.join('.'); // Остальная часть - имя файла (на случай нескольких точек)
  
  // Если имя файла длиннее 15 символов, обрезаем его
  const shortenedName = name.length > 15 
    ? name.substring(0, 15) + '...' 
    : name;
  
  // Собираем обратно с расширением (если оно было)
  return extension 
    ? `${shortenedName}.${extension}`
    : shortenedName;
}
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
    // statusElement.textContent = `Выбрано: ${fileName}`;
    statusElement.className = 'success';

    // Автоматически выбираем формат для конвертации
    if (fileExt === '.jpg' || fileExt === '.jpeg') {
      formatSelect.value = 'png';
    } else if (fileExt === '.png') {
      formatSelect.value = 'jpg';
    } else if (fileExt === '.gif') {
      formatSelect.value = 'webp';
    }
    let input = document.getElementById('convertBtn').dataset.inputPath;
    let name = `${getBasename(input)}.${input.split('.')[1]}`;
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
    // document.getElementById('folderStatus').textContent = 'Ошибка выбора папки';
  }
});

document.getElementById('convertBtn').addEventListener('click', async () => {
  const inputPath = document.getElementById('convertBtn').dataset.inputPath;
  let folderPath = selectFolder.dataset.folderPath;
  const outputFormat = document.getElementById('formatSelect').value;
  const statusEl = document.getElementById('statusFile');
  const convertBtn = document.getElementById('convertBtn');

  if (!inputPath) {
    statusEl.textContent = 'Ошибка: файл не выбран';
    statusEl.className = 'error';
    return;
  }

  try {
    // Блокируем кнопку и меняем статус на "Конвертация"
    convertBtn.disabled = true;
    statusEl.textContent = 'Конвертация...';
    statusEl.className = 'processing';
    
    const type = inputPath.slice(-3) + "-to-" + outputFormat.slice(-3);
    let result;
    
    if (!folderPath) {
      result = await window.electronAPI.convertFile({
        type,
        inputPath,
        outputPath: `${inputPath.split('.')[0]}.${outputFormat}`
      });
    } else {
      let Path = `${folderPath}/${getBasename(inputPath)}.${outputFormat}`;
      result = await window.electronAPI.convertFile({
        type,
        inputPath,
        outputPath: Path
      });
    }

    if (result.success) {
      // Успешная конвертация - меняем статус на "Готово"
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