# Coliblanco Backend Deployment Handleiding

Deze handleiding beschrijft hoe je de Coliblanco backend kunt deployen naar Azure als een Docker container.

## Vereisten

- Docker geïnstalleerd op je lokale machine
- Azure CLI geïnstalleerd (`az`)
- Toegang tot Azure Container Registry (crcoliblanco.azurecr.io)
- Ingelogd zijn bij Azure CLI (`az login`)
- Ingelogd zijn bij Azure Container Registry (`az acr login --name crcoliblanco`)

## Stap 1: Controleer de configuratie

Zorg ervoor dat je `.env` bestand alle benodigde variabelen bevat, zoals:

```
OPENAI_API_KEY=je_openai_api_key
DEBUG=False
ALLOWED_ORIGINS=https://app.coliblanco.com,https://coliblanco-dashboard.azurewebsites.net
```

**Let op:** Het `.env` bestand wordt NIET meegenomen in de Docker image voor veiligheid. Je moet deze variabelen handmatig instellen in de Azure Web App configuratie.

## Stap 2: Bouw en push de Docker image

We hebben een script gemaakt dat dit proces automatiseert. Voer het volgende uit:

```bash
chmod +x deploy-to-azure.sh
./deploy-to-azure.sh
```

Dit script:
1. Bouwt een Docker image voor de backend met de juiste architectuur voor Azure
2. Pushed deze naar Azure Container Registry
3. Geeft instructies voor de volgende stappen

## Stap 3: Configureer de Azure Web App

Na het pushen van de image, moet je de Azure Web App configureren:

1. Ga naar [Azure Portal](https://portal.azure.com)
2. Navigeer naar je Web App (coliblanco-backend)
3. Ga naar Deployment Center > Settings
4. Selecteer Container Registry: crcoliblanco.azurecr.io
5. Selecteer Image: coliblanco-backend
6. Selecteer Tag: v1.0 of latest
7. Klik op Save

## Stap 4: Configureer Environment Variables

1. Ga naar Configuration > Application Settings
2. Voeg de volgende instellingen toe:
   - `OPENAI_API_KEY`: Je OpenAI API key
   - `ALLOWED_ORIGINS`: Komma-gescheiden lijst van toegestane domeinen (bijv. https://app.coliblanco.com)
   - `DEBUG`: False
   - `WEBSITES_PORT`: 8000
3. Klik op Save

## Stap 5: Test de deployment

1. Wacht tot de deployment is voltooid (check Deployment Center)
2. Ga naar https://coliblanco-backend-gwgvekf9hzfea0en.westeurope-01.azurewebsites.net/docs
3. Je zou de FastAPI documentatie moeten zien

## Stap 6: Configureer de Frontend

Zorg dat je frontend verwijst naar de juiste backend URL voor API calls en WebSocket verbindingen:

```javascript
// In je frontend code
const API_URL = 'https://coliblanco-backend-gwgvekf9hzfea0en.westeurope-01.azurewebsites.net';
```

## Problemen oplossen

### CORS fouten
Controleer of `ALLOWED_ORIGINS` correct is ingesteld en of je CORS middleware in de backend code correct is geconfigureerd.

### Container start niet
Check de logs in Azure Portal > coliblanco-backend > Logs > Container logs

### API Key problemen
Controleer of de OPENAI_API_KEY correct is ingesteld in de Application Settings

## Custom Domain (Optioneel)

Als je een custom domain wilt gebruiken voor de backend (bijv. api.coliblanco.com):

1. Ga naar Azure Portal > coliblanco-backend > Custom domains
2. Volg de instructies om een domein toe te voegen
3. Update je DNS instellingen bij je domeinprovider
4. Update de frontend code om naar het nieuwe domein te verwijzen
