FROM python:3.9-slim

WORKDIR /app

# Installeer systeemafhankelijkheden voor audio verwerking
RUN apt-get update && apt-get install -y \
    portaudio19-dev \
    ffmpeg \
    libsndfile1 \
    && rm -rf /var/lib/apt/lists/*

# Kopieer requirements.txt en installeer Python afhankelijkheden
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Kopieer de applicatiecode
COPY . .

# Maak mappen voor uploads en audio
RUN mkdir -p uploads audio

# Poort waarop de applicatie draait
EXPOSE 5001

# Omgevingsvariabelen voor Azure
ENV PORT=5001
ENV WEBSITE_HOSTNAME=0.0.0.0

# Start de applicatie met Gunicorn
CMD ["gunicorn", "--bind", "0.0.0.0:5001", "--worker-class", "eventlet", "--workers", "1", "--timeout", "120", "app:app"]
