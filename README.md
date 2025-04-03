# Coliblanco Dashboard

Een React-gebaseerd dashboard voor het Coliblanco NFC-geactiveerde AI-systeem met spraakbediening.

## Functionaliteiten

- Moderne UI met pulserende orb als statusindicator
- Contextuele kaarten voor dagoverzicht, notificaties en taken
- Spraakinterface voor het geven van commando's
- Tekstinterface als alternatief voor spraak
- Volledig responsive ontwerp
- GSAP animaties voor vloeiende overgangen

## Technische Stack

- React (Vite)
- GSAP voor animaties
- Emotion voor styled components
- Framer Motion voor UI-animaties
- React Icons voor iconen
- date-fns voor datumformattering

## Installatie

```bash
# Installeer afhankelijkheden
npm install

# Start de ontwikkelserver
npm run dev
```

## Deployment naar GitHub Pages

Het project is geconfigureerd om eenvoudig te deployen naar GitHub Pages:

```bash
# Bouw en deploy het project naar GitHub Pages
npm run deploy
```

Dit zal automatisch de applicatie bouwen en deployen naar de `gh-pages` branch van je repository. De applicatie zal beschikbaar zijn op: https://voskesss.github.io/coliblanco-dashboard/

## Projectstructuur

```
src/
  ├── assets/         # Afbeeldingen en andere statische bestanden
  ├── components/     # React componenten
  │   ├── Dashboard/  # Dashboard-specifieke componenten
  │   └── UI/         # Herbruikbare UI-componenten
  ├── context/        # React context providers
  ├── hooks/          # Custom React hooks
  └── utils/          # Hulpfuncties
```

## Toekomstige Ontwikkeling

- Integratie met backend (Python/FastAPI/Rasa)
- Implementatie van echte spraakherkenning via OpenAI Whisper of Deepgram
- Integratie met externe diensten via API's
- Containerisatie voor deployment in Azure
