# Coliblanco Dashboard - Python Backend

Deze Python backend biedt geavanceerde spraakverwerking voor het Coliblanco Dashboard, met verbeterde interruptiedetectie en betere controle over de luisterstatus.

## Functionaliteiten

- Spraak naar tekst conversie met OpenAI Whisper API
- Tekst naar spraak conversie met OpenAI TTS API
- Tekstverwerking met OpenAI GPT API
- WebSocket ondersteuning voor realtime spraakverwerking
- Interruptiedetectie tijdens spraak
- Betere controle over de luisterstatus
- Automatische stiltedetectie
- Verbeterde contextbehoud tussen gesprekken
- Ondersteuning voor handmatige en automatische opnamestop

## Installatie

### Lokale ontwikkeling

1. Maak een virtuele omgeving aan:
   ```bash
   python -m venv venv
   source venv/bin/activate  # Op Windows: venv\Scripts\activate
   ```

2. Installeer de afhankelijkheden:
   ```bash
   pip install -r requirements.txt
   ```

3. Maak een `.env` bestand op basis van `.env.example`:
   ```bash
   cp .env.example .env
   # Bewerk .env en voeg je OpenAI API key toe
   ```

4. Start de server:
   ```bash
   python app.py
   ```

### Docker

1. Bouw de Docker image:
   ```bash
   docker build -t coliblanco-python-backend .
   ```

2. Start de container:
   ```bash
   docker run -p 5001:5001 --env-file .env coliblanco-python-backend
   ```

## Deployment op Azure

### Automatische deployment met script

We hebben een automatisch deployment script toegevoegd dat het hele proces van het deployen naar Azure Web App vereenvoudigt:

1. Zorg ervoor dat het script uitvoerbaar is:
   ```bash
   chmod +x deploy_to_azure.sh
   ```

2. Voer het script uit:
   ```bash
   ./deploy_to_azure.sh
   ```

3. Volg de instructies in het script. Het zal je vragen om:
   - In te loggen bij Azure (indien nodig)
   - Je OpenAI API key
   - Of je Azure Container Registry of Docker Hub wilt gebruiken
   - Eventuele Docker Hub credentials als je dat kiest

Het script zal automatisch:
- De resource group aanmaken (indien nodig)
- Het app service plan aanmaken (indien nodig)
- De web app aanmaken (indien nodig)
- De Docker image bouwen en pushen
- De web app configureren om de Docker image te gebruiken
- De web app starten

### Handmatige deployment op Azure Web App for Containers

1. Bouw en push de Docker image naar Azure Container Registry:
   ```bash
   az acr login --name crcoliblanco
   docker build -t crcoliblanco.azurecr.io/coliblanco-python-backend:latest .
   docker push crcoliblanco.azurecr.io/coliblanco-python-backend:latest
   ```

2. Maak een nieuwe Web App for Containers of update een bestaande:
   ```bash
   az webapp create --resource-group jouw-resource-groep --plan jouw-app-service-plan --name coliblanco-python-backend --deployment-container-image-name crcoliblanco.azurecr.io/coliblanco-python-backend:latest
   ```

3. Configureer de applicatie-instellingen:
   ```bash
   az webapp config appsettings set --resource-group jouw-resource-groep --name coliblanco-python-backend --settings \
     OPENAI_API_KEY=jouw-api-key \
     PORT=5001 \
     WEBSITE_PORT=5001 \
     ALLOWED_ORIGINS="*" \
     DEBUG=false
   ```

## API Endpoints

### REST API

- `POST /transcribe` - Transcribeer een audiobestand naar tekst
- `POST /tts` - Converteer tekst naar spraak
- `POST /chat` - Verwerk tekst met het LLM
- `GET /audio/<filename>` - Haal een audiobestand op

### WebSocket API

- `connect` - Maak verbinding met de WebSocket server
- `start_listening` - Start met luisteren naar audio
- `stop_listening` - Stop met luisteren en verwerk de audio
  - Parameter: `manual_stop` (boolean) - Geeft aan of de opname handmatig is gestopt
- `audio_chunk` - Stuur een audio chunk naar de server
- `interrupt` - Onderbreek het huidige spraakproces

### WebSocket Events

- `connected` - Bevestiging van verbinding met sessie ID
- `listening_started` - Bevestiging dat het luisteren is gestart
- `listening_stopped` - Bevestiging dat het luisteren is gestopt
- `transcription` - Transcriptie van de audio
- `llm_response` - Antwoord van het taalmodel
  - Bevat: `text` (string) - Het antwoord
  - Bevat: `is_interruption` (boolean) - Geeft aan of het een interruptie is
- `tts_response` - URL van het audiobestand
  - Bevat: `url` (string) - Het pad naar het audiobestand
  - Bevat: `is_interruption` (boolean) - Geeft aan of het een interruptie is
- `processing_complete` - Bevestiging dat de verwerking is voltooid

## Frontend Integratie

Om deze backend te integreren met de React frontend, hebben we de volgende componenten toegevoegd:

1. `EnhancedVoiceInterface.jsx` - Een verbeterde spraakinterface component die gebruik maakt van WebSockets voor realtime communicatie
2. `environment.js` - Een configuratiebestand voor verschillende omgevingen (ontwikkeling en productie)
3. `setupRealtimeVoiceProcessing()` in `openai.js` - Een functie om de WebSocket verbinding op te zetten en te beheren

De frontend is nu geconfigureerd om automatisch de juiste backend URL te gebruiken, afhankelijk van de omgeving:
- Ontwikkeling: `http://localhost:5001`
- Productie: `https://coliblanco-python-backend.azurewebsites.net` (of een aangepaste URL via omgevingsvariabelen)

### Gebruik van de verbeterde spraakinterface

```jsx
import EnhancedVoiceInterface from './components/UI/EnhancedVoiceInterface';

const MyComponent = () => {
  const handleCommand = (command) => {
    console.log('Commando ontvangen:', command);
    // Verwerk het commando
  };
  
  return (
    <div>
      <EnhancedVoiceInterface onCommand={handleCommand} />
    </div>
  );
};
```

## Configuratie

De volgende omgevingsvariabelen kunnen worden geconfigureerd:

- `OPENAI_API_KEY` - Je OpenAI API key
- `PORT` - De poort waarop de server draait (standaard: 5001)
- `ALLOWED_ORIGINS` - Toegestane origins voor CORS (standaard: *)
- `DEBUG` - Debug modus (standaard: true)
- `SECRET_KEY` - Geheime sleutel voor Flask sessies

Voor Azure deployment worden deze ingesteld via de applicatie-instellingen in de Azure portal of via de Azure CLI.
