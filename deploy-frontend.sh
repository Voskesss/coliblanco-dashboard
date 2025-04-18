#!/bin/bash

# Script om de frontend te deployen naar Azure App Service

# Variabelen
RESOURCE_GROUP="Coliblanco"
FRONTEND_APP="dashboard-coliblanco"
REGISTRY="crcoliblanco.azurecr.io"
IMAGE_NAME="coliblanco-dashboard"
VERSION="V20"

# Volledige image naam
FRONTEND_IMAGE="$REGISTRY/$IMAGE_NAME:$VERSION"

# Controleer of een versie is opgegeven als argument
if [ "$1" != "" ]; then
  VERSION="$1"
  FRONTEND_IMAGE="$REGISTRY/$IMAGE_NAME:$VERSION"
  echo "Versie overschreven naar: $VERSION"
fi

# Aanmelden bij Azure (indien nodig)
echo "Aanmelden bij Azure..."
az account show &> /dev/null || az login

# Frontend updaten
echo "Frontend updaten naar $FRONTEND_IMAGE..."
az webapp config container set --name $FRONTEND_APP --resource-group $RESOURCE_GROUP \
  --docker-custom-image-name $FRONTEND_IMAGE \
  --docker-registry-server-url https://$REGISTRY \
  --docker-registry-server-user crcoliblanco

# App herstarten
echo "Frontend app herstarten..."
az webapp restart --name $FRONTEND_APP --resource-group $RESOURCE_GROUP

echo "Frontend deployment voltooid!"
echo "De app is beschikbaar op: https://$FRONTEND_APP.azurewebsites.net"
