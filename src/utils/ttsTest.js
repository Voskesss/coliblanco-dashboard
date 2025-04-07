// Test script voor de nieuwe OpenAI TTS streaming functionaliteit
import { textToSpeech } from './openai';

// Voorbeeldtekst en instructies zoals in je voorbeeld
const voorbeeldTekst = `Ah, je hebt een pakketje dat kwijt is geraakt, hè? Klinkt als een probleem. Laat me eens kijken wat ik kan vinden.

Ik volg een spoor van nummers door het systeem. Daar is het—twee dagen geleden verzonden, zou vandaag voor de middag op je deurmat moeten liggen. Maar... het is nog ergens onderweg. Ergens.

Misschien zit het vast in een magazijn, misschien heeft het een verkeerde afslag genomen in een donker steegje. Hoe dan ook, ik kom er wel achter. Ik stuur je de laatste update, en als het niet snel opduikt... nou, dan ga ik wat telefoontjes plegen.

Jij houdt je rustig, makker. Ik houd het in de gaten.`;

const voorbeeldInstructies = `Affect: een mysterieuze noir detective

Toon: Cool, afstandelijk, maar subtiel geruststellend—alsof je alles al hebt gezien en weet hoe je moet omgaan met een vermist pakketje alsof het gewoon een nieuwe zaak is.

Levering: Langzaam en weloverwogen, met dramatische pauzes om spanning op te bouwen, alsof elk detail belangrijk is in dit onderzoek.

Emotie: Een mix van wereldwijsheid en stille vastberadenheid, met net een vleugje droge humor om te voorkomen dat het te grimmig wordt.

Punctuatie: Korte, krachtige zinnen met ellipsen en streepjes om ritme en spanning te creëren, als een innerlijke monoloog van een detective die aanwijzingen verzamelt.`;

// Functie om de TTS te testen
export const testTTS = async () => {
  console.log('TTS test wordt gestart...');
  console.log('Tekst:', voorbeeldTekst.substring(0, 50) + '...');
  console.log('Instructies:', voorbeeldInstructies.substring(0, 50) + '...');
  
  try {
    // Maak een audio element aan
    const audioElement = document.createElement('audio');
    audioElement.controls = true;
    
    // Voeg het toe aan het document (je kunt dit aanpassen aan waar je het wilt weergeven)
    document.body.appendChild(audioElement);
    
    // Voeg wat styling toe
    audioElement.style.width = '100%';
    audioElement.style.marginTop = '20px';
    audioElement.style.marginBottom = '20px';
    
    // Voeg een label toe
    const label = document.createElement('div');
    label.textContent = 'TTS Test met gpt-4o-mini-tts model:';
    label.style.fontWeight = 'bold';
    label.style.marginTop = '20px';
    document.body.insertBefore(label, audioElement);
    
    // Genereer de audio URL
    console.log('Audio URL genereren...');
    const audioUrl = await textToSpeech(voorbeeldTekst, voorbeeldInstructies);
    
    // Stel de audio source in
    audioElement.src = audioUrl;
    
    // Speel de audio automatisch af
    audioElement.play();
    
    console.log('TTS test voltooid, audio wordt afgespeeld');
    return audioUrl;
  } catch (error) {
    console.error('Fout bij TTS test:', error);
    alert('Er is een fout opgetreden bij de TTS test: ' + error.message);
  }
};

// Functie om de test te starten vanuit een knop of ander UI element
export const createTTSTestButton = () => {
  const button = document.createElement('button');
  button.textContent = 'Test Nieuwe TTS Streaming';
  button.style.padding = '10px 20px';
  button.style.margin = '20px';
  button.style.backgroundColor = '#4CAF50';
  button.style.color = 'white';
  button.style.border = 'none';
  button.style.borderRadius = '5px';
  button.style.cursor = 'pointer';
  
  button.onclick = () => {
    testTTS();
  };
  
  document.body.appendChild(button);
  return button;
};
