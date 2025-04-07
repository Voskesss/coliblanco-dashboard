# Azure Deployment voor Coliblanco Dashboard

Dit document beschrijft hoe je het Coliblanco Dashboard kunt deployen op Azure.

## Vereisten

- Een Azure account
- Azure CLI geïnstalleerd
- Node.js en npm geïnstalleerd

## 1. Web App Deployment

### 1.1 Maak een Azure App Service

```bash
# Inloggen op Azure
az login

# Maak een resource groep als je er nog geen hebt
az group create --name coliblanco-rg --location westeurope

# Maak een App Service Plan
az appservice plan create --name coliblanco-plan --resource-group coliblanco-rg --sku B1 --is-linux

# Maak een Web App
az webapp create --name coliblanco-dashboard --resource-group coliblanco-rg --plan coliblanco-plan --runtime "NODE:18-lts"
```

### 1.2 Configureer environment variables

```bash
# Stel de OpenAI API key in als environment variable
az webapp config appsettings set --name coliblanco-dashboard --resource-group coliblanco-rg --settings VITE_OPENAI_API_KEY="jouw-api-key"
```

### 1.3 Deploy de web app

```bash
# Bouw de app
npm run build

# Deploy naar Azure
az webapp deployment source config-zip --name coliblanco-dashboard --resource-group coliblanco-rg --src ./dist.zip
```

## 2. Token Server Deployment

### 2.1 Maak een Azure Function App

```bash
# Maak een storage account voor de Function App
az storage account create --name coliblancostore --resource-group coliblanco-rg --location westeurope --sku Standard_LRS

# Maak een Function App
az functionapp create --name coliblanco-token-server --resource-group coliblanco-rg --storage-account coliblancostore --consumption-plan-location westeurope --runtime node --runtime-version 18 --functions-version 4
```

### 2.2 Configureer environment variables

```bash
# Stel de OpenAI API key in als environment variable
az functionapp config appsettings set --name coliblanco-token-server --resource-group coliblanco-rg --settings VITE_OPENAI_API_KEY="jouw-api-key"
```

### 2.3 Deploy de token server

```bash
# Ga naar de server directory
cd server

# Installeer de Azure Functions Core Tools als je die nog niet hebt
npm install -g azure-functions-core-tools@4

# Initialiseer de Function App
func init --worker-runtime node

# Voeg een nieuwe functie toe
func new --name getToken --template "HTTP trigger"

# Deploy naar Azure
func azure functionapp publish coliblanco-token-server
```

## 3. Configureer CORS

```bash
# Sta CORS toe van de web app naar de Function App
az functionapp cors add --name coliblanco-token-server --resource-group coliblanco-rg --allowed-origins "https://coliblanco-dashboard.azurewebsites.net"
```

## 4. Update de web app om de token server te gebruiken

Pas de `src/utils/realtimeApi.js` file aan om de juiste URL voor de token server te gebruiken:

```javascript
// Functie om een ephemeral token op te halen van de server
async function getEphemeralToken() {
  try {
    // Gebruik de Azure Function URL
    const serverUrl = 'https://coliblanco-token-server.azurewebsites.net/api/getToken';
    
    console.log('Ephemeral token ophalen van:', serverUrl);
    const response = await fetch(serverUrl);
    if (!response.ok) {
      throw new Error(`Server antwoordde met ${response.status}: ${response.statusText}`);
    }
    const data = await response.json();
    console.log('Ephemeral token ontvangen:', data);
    return data.client_secret.value;
  } catch (error) {
    console.error('Fout bij ophalen ephemeral token:', error);
    throw error;
  }
}
```

## 5. Test de deployment

Open de web app in je browser: `https://coliblanco-dashboard.azurewebsites.net`

## 6. Automatiseer de deployment met GitHub Actions

Maak een `.github/workflows/azure-deploy.yml` bestand aan met de volgende inhoud:

```yaml
name: Deploy to Azure

on:
  push:
    branches: [main]

jobs:
  build-and-deploy:
    runs-on: ubuntu-latest
    steps:
      - name: Checkout
        uses: actions/checkout@v3

      - name: Set up Node.js
        uses: actions/setup-node@v3
        with:
          node-version: 18
          cache: 'npm'

      - name: Install dependencies
        run: npm ci

      - name: Build
        run: npm run build

      - name: Package app
        run: zip -r dist.zip dist

      - name: Deploy to Azure Web App
        uses: azure/webapps-deploy@v2
        with:
          app-name: 'coliblanco-dashboard'
          publish-profile: ${{ secrets.AZURE_WEBAPP_PUBLISH_PROFILE }}
          package: './dist.zip'

      - name: Deploy Token Server
        uses: azure/functions-action@v1
        with:
          app-name: 'coliblanco-token-server'
          package: './server'
          publish-profile: ${{ secrets.AZURE_FUNCTIONAPP_PUBLISH_PROFILE }}
```

Zorg ervoor dat je de volgende secrets toevoegt aan je GitHub repository:

- `AZURE_WEBAPP_PUBLISH_PROFILE`: Het publish profile van je Azure Web App
- `AZURE_FUNCTIONAPP_PUBLISH_PROFILE`: Het publish profile van je Azure Function App
