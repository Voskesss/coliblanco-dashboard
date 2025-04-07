# Handleiding Coliblanco Spraakinterface

## Vereisten

- Node.js geïnstalleerd
- OpenAI API-sleutel in het `.env` bestand

## Stappen om de spraakinterface te gebruiken

### 1. Configureer je API-sleutel

Zorg ervoor dat je OpenAI API-sleutel is ingesteld in het `.env` bestand in de root van het project:

```
VITE_OPENAI_API_KEY=jouw_openai_api_sleutel
```

### 2. Start de realtime-token server

Open een terminal en navigeer naar de root directory van het project:

```bash
cd /Users/josklijnhout/portalcoliblanco
```

Voer vervolgens het volgende commando uit:

```bash
node server/realtime-token.js
```

Als je al in de server directory bent, gebruik dan:

```bash
node realtime-token.js
```

Je zou een bericht moeten zien dat de server draait op poort 3001.

### 3. Start de applicatie

Open een andere terminal en navigeer naar de root directory van het project:

```bash
cd /Users/josklijnhout/portalcoliblanco
```

Voer vervolgens het volgende commando uit:

```bash
npm run dev
```

### 4. Gebruik de spraakinterface

1. Open de applicatie in je browser (meestal op http://localhost:5173)
2. Klik op de microfoonknop om te beginnen met spreken
3. Spreek duidelijk in je microfoon
4. **Nieuw:** Je hoeft niet meer op de knop te klikken om te stoppen met spreken. De interface detecteert automatisch wanneer je klaar bent met spreken (na ongeveer 1,5 seconde stilte)
5. Wacht op het antwoord van de assistent

### 5. Gespreksmodus gebruiken

De spraakinterface heeft nu een gespreksmodus waarmee je een doorlopend gesprek kunt voeren zonder telkens op de microfoonknop te hoeven drukken:

1. Klik op de gespreksknop (het praatballonnetje) om de gespreksmodus in te schakelen
2. Spreek duidelijk in je microfoon
3. Stop met praten wanneer je klaar bent met je vraag (de interface detecteert automatisch stilte)
4. Na je vraag zal de assistent automatisch antwoorden
5. Nadat de assistent klaar is met spreken, begint de microfoon automatisch weer met luisteren
6. Je kunt blijven praten zonder op knoppen te drukken
7. Klik nogmaals op de gespreksknop om de gespreksmodus uit te schakelen

## Problemen oplossen

### De spraakinterface werkt niet

- Controleer of de realtime-token server draait op poort 3001
- Controleer of je OpenAI API-sleutel correct is en voldoende credits heeft
- Controleer of je browser toegang heeft tot je microfoon
- Controleer de console in de browser-ontwikkelaarshulpmiddelen voor foutmeldingen

### Ik krijg een foutmelding over de server

Als je een melding ziet dat de server niet bereikbaar is, zorg er dan voor dat de realtime-token.js server draait. Zorg ervoor dat je in de juiste directory bent voordat je het commando uitvoert:

```bash
# In de root directory van het project
node server/realtime-token.js

# OF als je in de server directory bent
node realtime-token.js
```

### Ik krijg een foutmelding over de microfoon

Zorg ervoor dat je browser toestemming heeft om je microfoon te gebruiken. Controleer de instellingen van je browser en geef toestemming wanneer daarom wordt gevraagd.

### De stiltedetectie werkt niet goed

Als de stiltedetectie niet goed werkt:

- Zorg ervoor dat je in een rustige omgeving bent met weinig achtergrondgeluid
- Spreek duidelijk en pauzeer duidelijk aan het einde van je vraag
- Als de stiltedetectie te snel of te langzaam reageert, kun je nog steeds handmatig op de microfoonknop klikken

### De gespreksmodus werkt niet goed

Als de gespreksmodus niet goed werkt:

- Zorg ervoor dat je in een rustige omgeving bent met weinig achtergrondgeluid
- Wacht tot de assistent helemaal klaar is met spreken voordat je weer begint te praten
- Als de microfoon niet automatisch weer aangaat, kun je de gespreksmodus uit- en weer inschakelen
- Je kunt nog steeds de microfoonknop gebruiken om handmatig te beginnen en te stoppen met luisteren
