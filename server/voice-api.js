// Server voor de chained voice API (Whisper → GPT → TTS)
const express = require('express');
const cors = require('cors');
const multer = require('multer');
const fs = require('fs');
const path = require('path');
const dotenv = require('dotenv');

// Laad environment variables uit .env bestand
dotenv.config();

// Gebruik de environment variable direct
const OPENAI_API_KEY = process.env.VITE_OPENAI_API_KEY;

if (!OPENAI_API_KEY) {
  console.error('VITE_OPENAI_API_KEY environment variable is niet ingesteld!');
}

const app = express();
app.use(cors());
app.use(express.json());

// Configureer multer voor het opslaan van audio bestanden
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const dir = path.join(__dirname, 'uploads');
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    cb(null, dir);
  },
  filename: (req, file, cb) => {
    cb(null, `${Date.now()}-${file.originalname}`);
  }
});

const upload = multer({ storage });

// Endpoint voor spraak naar tekst (Whisper API)
app.post('/transcribe', upload.single('file'), async (req, res) => {
  try {
    if (!req.file) {
      console.error('Geen audio bestand ontvangen');
      return res.status(400).json({ error: 'Geen audio bestand ontvangen' });
    }
    
    console.log('Audio bestand ontvangen:', req.file.path);
    
    const formData = new FormData();
    formData.append('file', fs.createReadStream(req.file.path));
    formData.append('model', 'whisper-1');
    
    const response = await fetch('https://api.openai.com/v1/audio/transcriptions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${OPENAI_API_KEY}`
      },
      body: formData
    });
    
    if (!response.ok) {
      throw new Error(`OpenAI API antwoordde met ${response.status}: ${response.statusText}`);
    }
    
    const data = await response.json();
    console.log('Transcriptie ontvangen:', data);
    
    // Verwijder het audio bestand na gebruik
    fs.unlinkSync(req.file.path);
    
    res.json(data);
  } catch (error) {
    console.error('Fout bij transcriberen:', error);
    res.status(500).json({ error: error.message });
  }
});

// Endpoint voor tekst naar spraak (TTS API)
app.post('/tts', async (req, res) => {
  try {
    const { text, voice, model, speed } = req.body;
    
    if (!text) {
      return res.status(400).json({ error: 'Geen tekst ontvangen' });
    }
    
    console.log('TTS aanvraag ontvangen:', { text, voice, model, speed });
    
    const response = await fetch('https://api.openai.com/v1/audio/speech', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${OPENAI_API_KEY}`
      },
      body: JSON.stringify({
        model: model || 'tts-1',
        input: text,
        voice: voice || 'alloy'
      })
    });
    
    if (!response.ok) {
      throw new Error(`OpenAI API antwoordde met ${response.status}: ${response.statusText}`);
    }
    
    const audioBuffer = await response.arrayBuffer();
    
    // Sla het audio bestand op
    const dir = path.join(__dirname, 'audio');
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    
    const filename = `${Date.now()}.mp3`;
    const filepath = path.join(dir, filename);
    
    fs.writeFileSync(filepath, Buffer.from(audioBuffer));
    
    console.log('Audio opgeslagen:', filepath);
    
    res.json({ url: `/api/voice/audio/${filename}` });
  } catch (error) {
    console.error('Fout bij tekst naar spraak:', error);
    res.status(500).json({ error: error.message });
  }
});

// Endpoint voor chat completions (GPT API)
app.post('/chat', async (req, res) => {
  try {
    const { model, messages, temperature, max_tokens } = req.body;
    
    if (!messages || !Array.isArray(messages)) {
      return res.status(400).json({ error: 'Geen geldige berichten ontvangen' });
    }
    
    console.log('Chat aanvraag ontvangen:', { model, temperature, max_tokens });
    
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${OPENAI_API_KEY}`
      },
      body: JSON.stringify({
        model: model || 'gpt-4o',
        messages,
        temperature: temperature || 0.7,
        max_tokens: max_tokens || 150
      })
    });
    
    if (!response.ok) {
      throw new Error(`OpenAI API antwoordde met ${response.status}: ${response.statusText}`);
    }
    
    const data = await response.json();
    console.log('Chat voltooid, antwoord verzonden');
    
    res.json(data);
  } catch (error) {
    console.error('Fout bij chat completion:', error);
    res.status(500).json({ error: error.message });
  }
});

// Endpoint voor het serveren van audio bestanden
app.get('/audio/:filename', (req, res) => {
  const filename = req.params.filename;
  const filepath = path.join(__dirname, 'audio', filename);
  
  if (!fs.existsSync(filepath)) {
    return res.status(404).json({ error: 'Audio bestand niet gevonden' });
  }
  
  res.sendFile(filepath);
});

// Start de server
const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(`Voice API server draait op poort ${PORT}`);
});
