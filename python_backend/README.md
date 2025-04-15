# Coliblanco Dashboard - Python Backend

Deze Python backend biedt geavanceerde spraakverwerking voor het Coliblanco Dashboard, met verbeterde interruptiedetectie en betere controle over de luisterstatus.

## Functionaliteiten

- Spraak naar tekst conversie met OpenAI Whisper API
- Tekst naar spraak conversie met OpenAI TTS API
- Tekstverwerking met OpenAI GPT API
- WebSocket ondersteuning voor realtime spraakverwerking
- Interruptiedetectie tijdens spraak
- Betere controle over de luisterstatus

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
   docker run -p 5000:5000 --env-file .env coliblanco-python-backend
   ```

## Deployment op Azure

### Azure Web App for Containers

1. Bouw en push de Docker image naar Azure Container Registry:
   ```bash
   az acr login --name crcoliblanco
   docker build -t crcoliblanco.azurecr.io/coliblanco-python-backend:latest .
   docker push crcoliblanco.azurecr.io/coliblanco-python-backend:latest
   ```

2. Maak een nieuwe Web App for Containers of update een bestaande:
   ```bash
   az webapp create --resource-group jouw-resource-groep --plan jouw-app-service-plan --name coliblanco-voice-backend --deployment-container-image-name crcoliblanco.azurecr.io/coliblanco-python-backend:latest
   ```

3. Configureer de applicatie-instellingen:
   ```bash
   az webapp config appsettings set --resource-group jouw-resource-groep --name coliblanco-voice-backend --settings OPENAI_API_KEY=jouw-api-key
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
- `audio_chunk` - Stuur een audio chunk naar de server
- `interrupt` - Onderbreek het huidige spraakproces

## Frontend Integratie

Om deze backend te integreren met de React frontend, moet je de volgende wijzigingen maken:

1. Update de API endpoints in de frontend code om naar deze Python backend te wijzen
2. Implementeer WebSocket communicatie voor realtime spraakverwerking
3. Voeg interruptiedetectie toe aan de gebruikersinterface

Zie de documentatie in de frontend code voor meer details.
