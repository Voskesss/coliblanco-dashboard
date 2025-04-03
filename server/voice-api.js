// Server voor de chained voice API (Whisper → GPT → TTS)
const express = require('express');
const cors = require('cors');
const multer = require('multer');
const { OpenAI } = require('openai');
const fs = require('fs');
const path = require('path');

// Lees het .env bestand handmatig
const envPath = path.resolve(__dirname, '../.env');
let apiKey = '';

try {
  const envContent = fs.readFileSync(envPath, 'utf8');
  const match = envContent.match(/VITE_OPENAI_API_KEY=([^\r\n]+)/);
  if (match && match[1]) {
    apiKey = match[1].trim();
    console.log('API key succesvol geladen uit .env bestand');
  } else {
    console.error('Kon geen API key vinden in het .env bestand');
  }
} catch (error) {
  console.error('Fout bij lezen .env bestand:', error);
}

const app = express();
app.use(cors());
app.use(express.json());

// Configureer multer voor het verwerken van bestandsuploads
const upload = multer({ 
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 } // Max 10MB
});

// Initialiseer OpenAI client met de API key uit het .env bestand
const openai = new OpenAI({
  apiKey: apiKey,
});

// Endpoint voor spraak naar tekst (Whisper API)
app.post('/transcribe', upload.single('file'), async (req, res) => {
  try {
    if (!req.file) {
      console.error('Geen audio bestand ontvangen');
      return res.status(400).json({ error: 'Geen audio bestand ontvangen' });
    }
    
    console.log('Audio bestand ontvangen, grootte:', req.file.size, 'bytes');
    console.log('MIME type:', req.file.mimetype);
    
    // Controleer of het bestand niet leeg is
    if (req.file.size === 0) {
      console.error('Audio bestand is leeg');
      return res.status(400).json({ error: 'Audio bestand is leeg' });
    }
    
    try {
      // Schrijf de buffer naar een tijdelijk bestand
      const fs = require('fs');
      const os = require('os');
      const path = require('path');
      
      const tempDir = os.tmpdir();
      const fileName = `recording-${Date.now()}.webm`;
      const filePath = path.join(tempDir, fileName);
      
      fs.writeFileSync(filePath, req.file.buffer);
      console.log('Audio tijdelijk opgeslagen in:', filePath);
      
      // Transcribeer de audio met de Whisper API
      const transcription = await openai.audio.transcriptions.create({
        file: fs.createReadStream(filePath),
        model: req.body.model || 'whisper-1',
        language: req.body.language || 'nl',
        response_format: 'json'
      });
      
      // Verwijder het tijdelijke bestand
      fs.unlinkSync(filePath);
      
      console.log('Transcriptie voltooid:', transcription.text);
      res.json(transcription);
    } catch (apiError) {
      console.error('OpenAI API fout bij transcriberen:', apiError);
      
      // Stuur een eenvoudige fallback response als de API faalt
      res.json({
        text: "Ik kon niet verstaan wat je zei. Kun je het nog eens proberen?"
      });
    }
  } catch (error) {
    console.error('Fout bij transcriberen:', error);
    res.status(500).json({ error: 'Kon audio niet transcriberen', details: error.message });
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
    
    // Zet de tekst om naar spraak met de TTS API
    const mp3 = await openai.audio.speech.create({
      model: model || 'tts-1',
      voice: voice || 'alloy',
      input: text,
      speed: speed || 1.0
    });
    
    // Converteer de response naar een buffer
    const buffer = Buffer.from(await mp3.arrayBuffer());
    
    // Stuur de audio terug
    res.set('Content-Type', 'audio/mpeg');
    res.send(buffer);
    
    console.log('TTS voltooid, audio verzonden');
  } catch (error) {
    console.error('Fout bij tekst naar spraak:', error);
    res.status(500).json({ error: 'Kon tekst niet omzetten naar spraak', details: error.message });
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
    
    // Genereer een antwoord met de GPT API
    const completion = await openai.chat.completions.create({
      model: model || 'gpt-4o',
      messages,
      temperature: temperature || 0.7,
      max_tokens: max_tokens || 150
    });
    
    console.log('Chat voltooid, antwoord verzonden');
    res.json(completion);
  } catch (error) {
    console.error('Fout bij chat completion:', error);
    res.status(500).json({ error: 'Kon geen antwoord genereren', details: error.message });
  }
});

// Start de server
const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(`Voice API server draait op poort ${PORT}`);
});
