#!/bin/bash

# Script om de backend te deployen naar Azure App Service

# Variabelen
RESOURCE_GROUP="Coliblanco"
BACKEND_APP="coliblanco-backend"
REGISTRY="crcoliblanco.azurecr.io"
IMAGE_NAME="coliblanco-backend"
VERSION="V1.0"

# Volledige image naam
BACKEND_IMAGE="$REGISTRY/$IMAGE_NAME:$VERSION"

# Controleer of een versie is opgegeven als argument
if [ "$1" != "" ]; then
  VERSION="$1"
  BACKEND_IMAGE="$REGISTRY/$IMAGE_NAME:$VERSION"
  echo "Versie overschreven naar: $VERSION"
fi

# Aanmelden bij Azure (indien nodig)
echo "Aanmelden bij Azure..."
az account show &> /dev/null || az login

# Backend updaten
echo "Backend updaten naar $BACKEND_IMAGE..."
az webapp config container set --name $BACKEND_APP --resource-group $RESOURCE_GROUP \
  --docker-custom-image-name $BACKEND_IMAGE \
  --docker-registry-server-url https://$REGISTRY \
  --docker-registry-server-user crcoliblanco

# App herstarten
echo "Backend app herstarten..."
az webapp restart --name $BACKEND_APP --resource-group $RESOURCE_GROUP

echo "Backend deployment voltooid!"
echo "De app is beschikbaar op: https://$BACKEND_APP-gwgvekf9hzfea0en.westeurope-01.azurewebsites.net"
