document.getElementById('selectBtn').addEventListener('click', async () => {
  try {
    const inputPath = await window.electronAPI.openFileDialog();
    if (!inputPath) {
      console.log('File selection was cancelled');
      return;
    }
    
    // Проверяем допустимый формат файла
    const validExtensions = ['.jpg', '.jpeg', '.png', '.gif'];
    const fileExt = inputPath.slice(inputPath.lastIndexOf('.')).toLowerCase();
    
    if (!validExtensions.includes(fileExt)) {
      document.getElementById('status').textContent = 'Error: Please select an image file (JPG/PNG/GIF)';
      document.getElementById('status').className = 'error';
      return;
    }
    
    document.getElementById('convertBtn').disabled = false;
    document.getElementById('convertBtn').dataset.inputPath = inputPath;
    
    // Показываем только имя файла, а не полный путь
    const fileName = inputPath.split(/[\\/]/).pop();
    document.getElementById('status').textContent = `Selected: ${fileName}`;
    document.getElementById('status').className = '';
    
    // Автоматически устанавливаем формат для конвертации
    if (fileExt === '.jpg' || fileExt === '.jpeg') {
      document.getElementById('formatSelect').value = 'png';
    } else if (fileExt === '.png') {
      document.getElementById('formatSelect').value = 'jpg';
    }
    
  } catch (error) {
    console.error('File selection error:', error);
    document.getElementById('status').textContent = 'Error: Failed to select file';
    document.getElementById('status').className = 'error';
  }
});

document.getElementById('convertBtn').addEventListener('click', async () => {
  const inputPath = document.getElementById('convertBtn').dataset.inputPath;
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
    
    const type = inputPath.slice(-3) + "-to-" + outputFormat.slice(-3);
    const result = await window.electronAPI.convertFile({
      type,
      inputPath,
      outputPath: `${inputPath.split('.')[0]}.${outputFormat}` // сохраняем путь к выходному файлу
    });

    if (result.success) {
      const fileName = result.outputPath.split(/[\\/]/).pop();
      statusEl.textContent = `Success! File saved as: ${fileName}`;
      statusEl.className = 'success';

      // Предлагаем открыть папку с результатом
      setTimeout(() => {
        if (confirm('Conversion complete! Would you like to open the output folder?')) {
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
