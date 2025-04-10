#!/bin/bash

# Zorg ervoor dat we in de juiste directory zijn
cd /home/site/wwwroot

# Start de Gunicorn server
gunicorn --bind=0.0.0.0:8000 app:app
