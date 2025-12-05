// Richiede: npm install express multer node-fetch
const express = require('express');
const multer = require('multer');
const fetch = require('node-fetch');
const fs = require('fs');
const path = require('path');

const upload = multer({ dest: 'uploads/' });
const app = express();
const PORT = process.env.PORT||3000;

/*
Flow:
1) Riceve file video.
2) Forward al servizio di rimozione sfondo (API esterna) OR process locale.
3) Riceve risultato (video o webm) e lo invia al client.

Sostituisci l'endpoint esterno e le headers con quelli del servizio che userai.
*/

app.post('/api/process', upload.fields([{ name: 'video' }, { name: 'bgImage' }]), async (req, res) => {
  try {
    const videoFile = req.files['video'][0];
    const bgType = req.body.bgType || 'transparent';
    const bgColor = req.body.bgColor || '#00ff00';
    const bgImage = req.files['bgImage'] ? req.files['bgImage'][0] : null;

    // Esempio: invio multipart al servizio esterno (unscreen/kapwing) - qui è illustrativo
    const externalUrl = 'https://api.example.com/remove-background'; // SOSTITUISCI
    const form = new (require('form-data'))();
    form.append('video', fs.createReadStream(videoFile.path), videoFile.originalname);
    form.append('bgType', bgType);
    if (bgType === 'color') form.append('bgColor', bgColor);
    if (bgType === 'image' && bgImage) form.append('bgImage', fs.createReadStream(bgImage.path));

    const apiRes = await fetch(externalUrl, {
      method: 'POST',
      headers: {
        'Authorization': 'Bearer ' + process.env.BG_API_KEY // imposta BG_API_KEY sul server
      },
      body: form
    });

    if (!apiRes.ok) {
      const text = await apiRes.text();
      throw new Error('External API error: ' + text);
    }

    // presupponiamo che l'API risponda con il file video binario
    const arrayBuffer = await apiRes.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // invia al client
    res.setHeader('Content-Type', 'video/webm'); // o video/mp4 in base alla risposta
    res.send(buffer);

    // pulizia file upload
    fs.unlink(videoFile.path, ()=>{});
    if (bgImage) fs.unlink(bgImage.path, ()=>{});

  } catch (err) {
    console.error(err);
    res.status(500).send('Server error: ' + err.message);
  }
});

app.use(express.static(path.join(__dirname)));
app.listen(PORT, ()=> console.log('Server listening on', PORT));
