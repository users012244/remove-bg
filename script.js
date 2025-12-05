// Client-side: carica file al backend che richiama il servizio di rimozione sfondo.
// Sostituisci /api/process con il tuo backend reale.

const videoInput = document.getElementById('videoInput');
const processBtn = document.getElementById('processBtn');
const status = document.getElementById('status');
const resultVideo = document.getElementById('resultVideo');
const downloadLink = document.getElementById('downloadLink');
const bgType = document.getElementById('bgType');
const bgColor = document.getElementById('bgColor');
const bgImage = document.getElementById('bgImage');
const colorPickerLabel = document.getElementById('colorPickerLabel');
const imagePickerLabel = document.getElementById('imagePickerLabel');

let selectedFile = null;
videoInput.addEventListener('change', e => {
  selectedFile = e.target.files[0] || null;
  processBtn.disabled = !selectedFile;
});

bgType.addEventListener('change', () => {
  colorPickerLabel.style.display = bgType.value === 'color' ? '' : 'none';
  imagePickerLabel.style.display = bgType.value === 'image' ? '' : 'none';
});

processBtn.addEventListener('click', async () => {
  if (!selectedFile) return;
  status.textContent = 'Caricamento...';
  processBtn.disabled = true;

  const form = new FormData();
  form.append('video', selectedFile);
  form.append('bgType', bgType.value);
  if (bgType.value === 'color') form.append('bgColor', bgColor.value);
  if (bgType.value === 'image' && bgImage.files[0]) form.append('bgImage', bgImage.files[0]);

  try {
    // POST al tuo backend; backend chiama il servizio di rimozione sfondo e restituisce il file elaborato
    const res = await fetch('/api/process', { method: 'POST', body: form });
    if (!res.ok) throw new Error('Errore server');

    const blob = await res.blob();
    const url = URL.createObjectURL(blob);
    resultVideo.src = url;
    resultVideo.style.display = '';
    downloadLink.href = url;
    // imposta nome file in base al tipo: webm per alpha/trasparente, mp4 per colorato
    downloadLink.download = bgType.value === 'transparent' ? 'output.webm' : 'output.mp4';
    downloadLink.style.display = '';
    status.textContent = 'Fatto';
  } catch (err) {
    console.error(err);
    status.textContent = 'Errore: ' + err.message;
  } finally {
    processBtn.disabled = false;
  }
});
