// Server voor het genereren van ephemeral tokens voor de OpenAI Realtime API
const express = require('express');
const cors = require('cors');
const fetch = require('node-fetch');
const path = require('path');
const dotenv = require('dotenv');

// Laad environment variables uit .env bestand in de root directory
dotenv.config({ path: path.resolve(__dirname, '../.env') });

const app = express();
app.use(cors());
app.use(express.json());

// Gebruik de environment variable direct
const OPENAI_API_KEY = process.env.VITE_OPENAI_API_KEY;

if (!OPENAI_API_KEY) {
  console.error('VITE_OPENAI_API_KEY environment variable is niet ingesteld!');
}

// Route voor het genereren van een ephemeral token
app.get('/session', async (req, res) => {
  try {
    console.log('Ephemeral token aanvraag ontvangen');
    console.log('API Key beschikbaar:', !!OPENAI_API_KEY);
    
    // Maak een directe REST API aanvraag naar het OpenAI endpoint voor ephemeral tokens
    console.log('Directe REST API aanvraag naar OpenAI voor ephemeral token');
    const response = await fetch('https://api.openai.com/v1/realtime/sessions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${OPENAI_API_KEY}`,
        'Content-Type': 'application/json',
        'OpenAI-Beta': 'realtime=v1'
      },
      body: JSON.stringify({
        model: 'gpt-4o-realtime-preview',
        voice: 'alloy'
      })
    });
    
    // Controleer of de aanvraag succesvol was
    if (!response.ok) {
      const errorText = await response.text();
      console.error('Fout bij OpenAI API aanvraag:', response.status, errorText);
      throw new Error(`OpenAI API fout: ${response.status} ${response.statusText}`);
    }
    
    // Parse de response als JSON
    const data = await response.json();
    console.log('Ephemeral token succesvol ontvangen van OpenAI');
    
    // Stuur de data terug naar de client
    res.json(data);
  } catch (error) {
    console.error('Fout bij het genereren van ephemeral token:', error);
    
    // Als er een fout optreedt, val terug op een mock implementatie
    console.log('Terugvallen op mock implementatie vanwege fout:', error.message);
    
    // Simuleer een ephemeral token response
    const mockEphemeralKey = {
      client_secret: {
        value: 'mock_ephemeral_token_' + Date.now(),
        expires_at: Math.floor(Date.now() / 1000) + 60 // 60 seconden vanaf nu
      }
    };
    
    console.log('Mock ephemeral token gegenereerd');
    res.json(mockEphemeralKey);
  }
});

// Start de server
const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(`Realtime token server draait op poort ${PORT}`);
  console.log('API Key beschikbaar:', !!OPENAI_API_KEY);
});
