#!/bin/bash

# Script om de backend te bouwen en deployen naar Azure Container Registry
# Zorg ervoor dat je ingelogd bent bij Azure CLI en bij de Container Registry

# Variabelen
REGISTRY="crcoliblanco.azurecr.io"
IMAGE_NAME="coliblanco-backend"
VERSION="v1.0"

# Bouw de Docker image voor amd64 platform (Azure)
echo "🔨 Docker image bouwen..."
docker buildx build --platform linux/amd64 \
  -t "$REGISTRY/$IMAGE_NAME:$VERSION" \
  -t "$REGISTRY/$IMAGE_NAME:latest" \
  --push \
  .

echo "✅ Image gebouwd en gepusht naar: $REGISTRY/$IMAGE_NAME:$VERSION"
echo "✅ Image gebouwd en gepusht naar: $REGISTRY/$IMAGE_NAME:latest"

echo ""
echo "🔷 Volgende stappen:"
echo "1. Ga naar Azure Portal: https://portal.azure.com"
echo "2. Navigeer naar je Web App voor de backend"
echo "3. Ga naar Deployment Center > Settings"
echo "4. Selecteer Container Registry: $REGISTRY"
echo "5. Selecteer Image: $IMAGE_NAME"
echo "6. Selecteer Tag: $VERSION of latest"
echo "7. Klik op Save"
echo ""
echo "8. Ga naar Configuration > Application Settings en voeg toe:"
echo "   - OPENAI_API_KEY"
echo "   - Andere benodigde environment variables uit .env"
echo ""
echo "9. Zorg dat WEBSITES_PORT=8000 is ingesteld"
echo ""
echo "🌐 Vergeet niet CORS in te stellen voor je frontend domein!"
