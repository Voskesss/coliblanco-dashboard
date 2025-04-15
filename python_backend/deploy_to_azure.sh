#!/bin/bash

# Script om de Python backend te deployen naar Azure Web App

echo "Starten met deployment van de Python backend naar Azure..."

# Controleer of Azure CLI is geïnstalleerd
if ! command -v az &> /dev/null; then
    echo "Azure CLI is niet geïnstalleerd. Installeer het eerst via https://docs.microsoft.com/en-us/cli/azure/install-azure-cli"
    exit 1
fi

# Controleer of de gebruiker is ingelogd bij Azure
az account show &> /dev/null
if [ $? -ne 0 ]; then
    echo "Je bent niet ingelogd bij Azure. Log in met 'az login'."
    az login
fi

# Laad configuratie uit .azure/config
if [ -f ".azure/config" ]; then
    echo "Laden van configuratie uit .azure/config..."
    RESOURCE_GROUP=$(grep "group" .azure/config | cut -d "=" -f2 | tr -d '[:space:]')
    APP_SERVICE_PLAN=$(grep "appserviceplan" .azure/config | head -1 | cut -d "=" -f2 | tr -d '[:space:]')
    LOCATION=$(grep "location" .azure/config | cut -d "=" -f2 | tr -d '[:space:]')
    WEB_APP_NAME=$(grep "web" .azure/config | cut -d "=" -f2 | tr -d '[:space:]')
    SKU=$(grep "sku" .azure/config | cut -d "=" -f2 | tr -d '[:space:]')
else
    echo "Configuratiebestand .azure/config niet gevonden. Gebruik standaardwaarden."
    RESOURCE_GROUP="coliblanco-resources"
    APP_SERVICE_PLAN="coliblanco-service-plan"
    LOCATION="westeurope"
    WEB_APP_NAME="coliblanco-python-backend"
    SKU="B1"
fi

echo "Configuratie geladen:"
echo "Resource Group: $RESOURCE_GROUP"
echo "App Service Plan: $APP_SERVICE_PLAN"
echo "Locatie: $LOCATION"
echo "Web App Naam: $WEB_APP_NAME"
echo "SKU: $SKU"

# Controleer of de resource group bestaat, zo niet, maak deze aan
echo "Controleren of resource group $RESOURCE_GROUP bestaat..."
az group show --name "$RESOURCE_GROUP" &> /dev/null
if [ $? -ne 0 ]; then
    echo "Resource group $RESOURCE_GROUP bestaat niet. Aanmaken..."
    az group create --name "$RESOURCE_GROUP" --location "$LOCATION"
fi

# Controleer of het app service plan bestaat, zo niet, maak deze aan
echo "Controleren of app service plan $APP_SERVICE_PLAN bestaat..."
az appservice plan show --name "$APP_SERVICE_PLAN" --resource-group "$RESOURCE_GROUP" &> /dev/null
if [ $? -ne 0 ]; then
    echo "App service plan $APP_SERVICE_PLAN bestaat niet. Aanmaken..."
    az appservice plan create --name "$APP_SERVICE_PLAN" --resource-group "$RESOURCE_GROUP" --location "$LOCATION" --sku "$SKU" --is-linux
fi

# Controleer of de web app bestaat, zo niet, maak deze aan
echo "Controleren of web app $WEB_APP_NAME bestaat..."
az webapp show --name "$WEB_APP_NAME" --resource-group "$RESOURCE_GROUP" &> /dev/null
if [ $? -ne 0 ]; then
    echo "Web app $WEB_APP_NAME bestaat niet. Aanmaken..."
    az webapp create --name "$WEB_APP_NAME" --resource-group "$RESOURCE_GROUP" --plan "$APP_SERVICE_PLAN" --runtime "PYTHON:3.9"
fi

# Configureer de web app voor Docker
echo "Configureren van web app voor Docker..."
az webapp config set --name "$WEB_APP_NAME" --resource-group "$RESOURCE_GROUP" --always-on true

# Configureer de environment variables
echo "Configureren van environment variables..."
az webapp config appsettings set --name "$WEB_APP_NAME" --resource-group "$RESOURCE_GROUP" --settings \
    PORT=5001 \
    WEBSITE_PORT=5001 \
    WEBSITE_HOSTNAME="$WEB_APP_NAME.azurewebsites.net" \
    ALLOWED_ORIGINS="*" \
    DEBUG=false

# Vraag om de OpenAI API key
echo "Voer je OpenAI API key in (deze wordt niet opgeslagen in het script):"
read -s OPENAI_API_KEY

# Configureer de OpenAI API key als een environment variable
echo "Configureren van OpenAI API key..."
az webapp config appsettings set --name "$WEB_APP_NAME" --resource-group "$RESOURCE_GROUP" --settings \
    OPENAI_API_KEY="$OPENAI_API_KEY"

# Bouw en push de Docker image
echo "Bouwen en pushen van Docker image..."

# Gebruik Azure Container Registry of Docker Hub
echo "Wil je Azure Container Registry gebruiken? (j/n)"
read USE_ACR

if [[ "$USE_ACR" == "j" || "$USE_ACR" == "J" ]]; then
    # Controleer of ACR bestaat, zo niet, maak deze aan
    ACR_NAME="coliblancoregistry"
    echo "Controleren of Azure Container Registry $ACR_NAME bestaat..."
    az acr show --name "$ACR_NAME" --resource-group "$RESOURCE_GROUP" &> /dev/null
    if [ $? -ne 0 ]; then
        echo "Azure Container Registry $ACR_NAME bestaat niet. Aanmaken..."
        az acr create --name "$ACR_NAME" --resource-group "$RESOURCE_GROUP" --sku Basic --admin-enabled true
    fi
    
    # Log in bij ACR
    echo "Inloggen bij Azure Container Registry..."
    az acr login --name "$ACR_NAME"
    
    # Bouw en push de Docker image
    ACR_LOGINSERVER=$(az acr show --name "$ACR_NAME" --resource-group "$RESOURCE_GROUP" --query "loginServer" --output tsv)
    IMAGE_NAME="$ACR_LOGINSERVER/coliblanco-python-backend:latest"
    
    echo "Bouwen van Docker image: $IMAGE_NAME"
    docker build -t "$IMAGE_NAME" .
    
    echo "Pushen van Docker image naar ACR..."
    docker push "$IMAGE_NAME"
    
    # Configureer de web app om de container image te gebruiken
    echo "Configureren van web app om container image te gebruiken..."
    az webapp config container set --name "$WEB_APP_NAME" --resource-group "$RESOURCE_GROUP" \
        --docker-custom-image-name "$IMAGE_NAME" \
        --docker-registry-server-url "https://$ACR_LOGINSERVER" \
        --docker-registry-server-user "$ACR_NAME" \
        --docker-registry-server-password $(az acr credential show --name "$ACR_NAME" --query "passwords[0].value" --output tsv)
else
    # Gebruik Docker Hub
    echo "Voer je Docker Hub gebruikersnaam in:"
    read DOCKER_USERNAME
    
    echo "Voer je Docker Hub wachtwoord in (deze wordt niet opgeslagen in het script):"
    read -s DOCKER_PASSWORD
    
    # Log in bij Docker Hub
    echo "Inloggen bij Docker Hub..."
    echo "$DOCKER_PASSWORD" | docker login --username "$DOCKER_USERNAME" --password-stdin
    
    # Bouw en push de Docker image
    IMAGE_NAME="$DOCKER_USERNAME/coliblanco-python-backend:latest"
    
    echo "Bouwen van Docker image: $IMAGE_NAME"
    docker build -t "$IMAGE_NAME" .
    
    echo "Pushen van Docker image naar Docker Hub..."
    docker push "$IMAGE_NAME"
    
    # Configureer de web app om de container image te gebruiken
    echo "Configureren van web app om container image te gebruiken..."
    az webapp config container set --name "$WEB_APP_NAME" --resource-group "$RESOURCE_GROUP" \
        --docker-custom-image-name "$IMAGE_NAME" \
        --docker-registry-server-url "https://index.docker.io/v1" \
        --docker-registry-server-user "$DOCKER_USERNAME" \
        --docker-registry-server-password "$DOCKER_PASSWORD"
fi

# Start de web app
echo "Starten van web app..."
az webapp restart --name "$WEB_APP_NAME" --resource-group "$RESOURCE_GROUP"

echo "Deployment voltooid! De web app is beschikbaar op: https://$WEB_APP_NAME.azurewebsites.net"
