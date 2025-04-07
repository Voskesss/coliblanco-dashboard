import React, { useEffect, useState } from 'react';
import { textToSpeech } from './utils/openai';
import { testTTS, createTTSTestButton } from './utils/ttsTest';

const TTSTestPage = () => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [audioUrl, setAudioUrl] = useState(null);
  const [customText, setCustomText] = useState('');
  const [customInstructions, setCustomInstructions] = useState('');
  
  // Voorbeeldtekst en instructies
  const voorbeeldTekst = `Ah, je hebt een pakketje dat kwijt is geraakt, hè? Klinkt als een probleem. Laat me eens kijken wat ik kan vinden.\n\nIk volg een spoor van nummers door het systeem. Daar is het—twee dagen geleden verzonden, zou vandaag voor de middag op je deurmat moeten liggen. Maar... het is nog ergens onderweg. Ergens.\n\nMisschien zit het vast in een magazijn, misschien heeft het een verkeerde afslag genomen in een donker steegje. Hoe dan ook, ik kom er wel achter. Ik stuur je de laatste update, en als het niet snel opduikt... nou, dan ga ik wat telefoontjes plegen.\n\nJij houdt je rustig, makker. Ik houd het in de gaten.`;

  const voorbeeldInstructies = `Affect: een mysterieuze noir detective\n\nToon: Cool, afstandelijk, maar subtiel geruststellend—alsof je alles al hebt gezien en weet hoe je moet omgaan met een vermist pakketje alsof het gewoon een nieuwe zaak is.\n\nLevering: Langzaam en weloverwogen, met dramatische pauzes om spanning op te bouwen, alsof elk detail belangrijk is in dit onderzoek.\n\nEmotie: Een mix van wereldwijsheid en stille vastberadenheid, met net een vleugje droge humor om te voorkomen dat het te grimmig wordt.\n\nPunctuatie: Korte, krachtige zinnen met ellipsen en streepjes om ritme en spanning te creëren, als een innerlijke monoloog van een detective die aanwijzingen verzamelt.`;

  // Functie om de voorbeeldtekst te gebruiken
  const useVoorbeeld = () => {
    setCustomText(voorbeeldTekst);
    setCustomInstructions(voorbeeldInstructies);
  };

  // Functie om de audio af te spelen met aangepaste tekst en instructies
  const playCustomAudio = async () => {
    try {
      setIsPlaying(true);
      const text = customText || "Hallo, dit is een test van de nieuwe OpenAI TTS streaming functionaliteit.";
      const instructions = customInstructions || "Spreek op een natuurlijke, vriendelijke toon.";
      
      const url = await textToSpeech(text, instructions);
      setAudioUrl(url);
      
      // Maak een audio element aan en speel het af
      const audio = new Audio(url);
      audio.onended = () => setIsPlaying(false);
      audio.play();
    } catch (error) {
      console.error('Fout bij afspelen van audio:', error);
      setIsPlaying(false);
      alert('Er is een fout opgetreden: ' + error.message);
    }
  };

  return (
    <div style={{ maxWidth: '800px', margin: '0 auto', padding: '20px' }}>
      <h1>OpenAI TTS Streaming Test</h1>
      <p>Deze pagina laat je de nieuwe OpenAI TTS streaming functionaliteit testen met het gpt-4o-mini-tts model.</p>
      
      <div style={{ marginBottom: '20px' }}>
        <h2>Voorbeeldtest</h2>
        <button 
          onClick={testTTS} 
          disabled={isPlaying}
          style={{
            padding: '10px 20px',
            backgroundColor: '#4CAF50',
            color: 'white',
            border: 'none',
            borderRadius: '5px',
            cursor: isPlaying ? 'not-allowed' : 'pointer',
            opacity: isPlaying ? 0.7 : 1
          }}
        >
          {isPlaying ? 'Bezig met afspelen...' : 'Speel voorbeeldaudio af'}
        </button>
      </div>
      
      <div style={{ marginBottom: '20px' }}>
        <h2>Aangepaste test</h2>
        <div style={{ marginBottom: '10px' }}>
          <button 
            onClick={useVoorbeeld}
            style={{
              padding: '5px 10px',
              backgroundColor: '#2196F3',
              color: 'white',
              border: 'none',
              borderRadius: '5px',
              cursor: 'pointer',
              marginBottom: '10px'
            }}
          >
            Vul voorbeeldtekst en instructies in
          </button>
        </div>
        
        <div style={{ marginBottom: '10px' }}>
          <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>
            Tekst om uit te spreken:
          </label>
          <textarea 
            value={customText} 
            onChange={(e) => setCustomText(e.target.value)}
            style={{ width: '100%', height: '100px', padding: '10px' }}
            placeholder="Voer hier de tekst in die je wilt laten uitspreken..."
          />
        </div>
        
        <div style={{ marginBottom: '10px' }}>
          <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>
            Instructies voor de stem:
          </label>
          <textarea 
            value={customInstructions} 
            onChange={(e) => setCustomInstructions(e.target.value)}
            style={{ width: '100%', height: '100px', padding: '10px' }}
            placeholder="Voer hier instructies in voor hoe de tekst moet worden uitgesproken..."
          />
        </div>
        
        <button 
          onClick={playCustomAudio} 
          disabled={isPlaying}
          style={{
            padding: '10px 20px',
            backgroundColor: '#4CAF50',
            color: 'white',
            border: 'none',
            borderRadius: '5px',
            cursor: isPlaying ? 'not-allowed' : 'pointer',
            opacity: isPlaying ? 0.7 : 1
          }}
        >
          {isPlaying ? 'Bezig met afspelen...' : 'Speel aangepaste audio af'}
        </button>
      </div>
      
      {audioUrl && (
        <div style={{ marginTop: '20px' }}>
          <h3>Audio afspelen:</h3>
          <audio controls src={audioUrl} style={{ width: '100%' }} />
        </div>
      )}
      
      <div style={{ marginTop: '30px', padding: '15px', backgroundColor: '#f5f5f5', borderRadius: '5px' }}>
        <h3>Technische informatie:</h3>
        <p>Deze implementatie gebruikt de nieuwe OpenAI TTS streaming functionaliteit met het gpt-4o-mini-tts model.</p>
        <p>De streaming implementatie zorgt voor een snellere responstijd en betere audiokwaliteit.</p>
      </div>
    </div>
  );
};

export default TTSTestPage;
