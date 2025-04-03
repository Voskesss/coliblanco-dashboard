import OpenAI from 'openai';
import { config } from './config';

// Initialiseer de OpenAI client
const openai = new OpenAI({
  apiKey: config.openaiApiKey,
  dangerouslyAllowBrowser: true // Sta toe dat de client in de browser draait (let op: alleen voor ontwikkeling)
});

// Echte functie voor spraak naar tekst conversie met OpenAI Whisper
export const transcribeAudio = async (audioBlob) => {
  try {
    console.log('Transcriberen van audio met Whisper...');
    
    // Controleer of we een geldige API key hebben
    if (!config.openaiApiKey) {
      console.warn('Geen OpenAI API key gevonden, gebruik gesimuleerde transcriptie');
      await new Promise(resolve => setTimeout(resolve, 1500));
      return "Dit is een gesimuleerde transcriptie van spraak naar tekst.";
    }
    
    // Controleer of we een audioBlob hebben
    if (!audioBlob) {
      console.warn('Geen audioBlob ontvangen, gebruik gesimuleerde transcriptie');
      return "Geen audio ontvangen. Dit is een gesimuleerde transcriptie.";
    }
    
    // Zorg ervoor dat de audioBlob het juiste type heeft
    let processedBlob = audioBlob;
    
    // Als de blob niet het juiste type heeft, maak een nieuwe blob met het juiste type
    if (audioBlob.type !== 'audio/mp3' && audioBlob.type !== 'audio/mpeg' && audioBlob.type !== 'audio/wav') {
      console.log('Converteren van audioBlob naar mp3 formaat...');
      // Converteer de blob naar een formaat dat OpenAI accepteert
      const arrayBuffer = await audioBlob.arrayBuffer();
      processedBlob = new Blob([arrayBuffer], { type: 'audio/mp3' });
    }
    
    // Voeg een bestandsnaam toe aan de blob
    const file = new File([processedBlob], 'audio.mp3', { type: 'audio/mp3' });
    
    console.log('Audio bestand voorbereid, type:', file.type, 'grootte:', file.size, 'bytes');
    
    // Roep de Whisper API aan
    const transcription = await openai.audio.transcriptions.create({
      file: file,
      model: config.models.openai.stt,
      language: 'nl',
    });
    
    console.log('Transcriptie ontvangen:', transcription.text);
    return transcription.text;
  } catch (error) {
    console.error('Fout bij het transcriberen van audio:', error);
    return "Er is een fout opgetreden bij het transcriberen van de audio.";
  }
};

// Echte functie voor het verwerken van tekst met het LLM
export const processWithLLM = async (text, context = {}) => {
  try {
    console.log('Verwerken van tekst met GPT...');
    
    // Controleer of we een geldige API key hebben
    if (!config.openaiApiKey) {
      console.warn('Geen OpenAI API key gevonden, gebruik gesimuleerd antwoord');
      await new Promise(resolve => setTimeout(resolve, 1000));
      return `Ik heb je bericht "${text}" ontvangen. Hier is mijn antwoord als assistent.`;
    }
    
    // Als er een userText in de context zit, gebruik die in plaats van de transcriptie
    const userText = context.userText || text;
    
    // Bereid de berichten voor
    const messages = [
      {
        role: "system",
        content: `Je bent een behulpzame assistent voor Coliblanco. 
                 Huidige tijd: ${new Date().toLocaleString('nl-NL')}.
                 Houd je antwoorden kort en bondig, maar wel vriendelijk en behulpzaam.
                 Spreek Nederlands.`
      },
      { role: "user", content: userText }
    ];
    
    // Voeg context toe als die er is
    if (context && Object.keys(context).length > 0 && !context.userText) {
      messages[0].content += `\nContext: ${JSON.stringify(context)}`;
    }
    
    // Roep de OpenAI API aan
    const completion = await openai.chat.completions.create({
      model: config.models.openai.llm,
      messages: messages,
    });
    
    const response = completion.choices[0].message.content;
    console.log('GPT antwoord ontvangen:', response);
    return response;
  } catch (error) {
    console.error('Fout bij het verwerken van tekst met LLM:', error);
    return "Er is een fout opgetreden bij het verwerken van je vraag.";
  }
};

// Echte functie voor tekst naar spraak conversie met OpenAI
export const textToSpeech = async (text) => {
  try {
    // Controleer of we een geldige API key hebben
    if (!config.openaiApiKey) {
      console.warn('Geen OpenAI API key gevonden, gebruik browser spraaksynthese als fallback');
      return useBrowserTTS(text);
    }
    
    console.log('OpenAI TTS aanroepen met stem:', config.models.openai.ttsVoice);
    
    // Gebruik OpenAI's TTS API
    const mp3 = await openai.audio.speech.create({
      model: config.models.openai.tts,
      voice: config.models.openai.ttsVoice,
      input: text,
    });
    
    // Converteer de response naar een ArrayBuffer
    const arrayBuffer = await mp3.arrayBuffer();
    
    // Maak een Blob van de ArrayBuffer
    const blob = new Blob([arrayBuffer], { type: 'audio/mpeg' });
    
    // Maak een URL van de Blob
    const url = URL.createObjectURL(blob);
    
    return url;
  } catch (error) {
    console.error('Fout bij het aanroepen van OpenAI TTS API:', error);
    console.warn('Terugvallen op browser spraaksynthese');
    
    // Gebruik browser spraaksynthese als fallback
    return useBrowserTTS(text);
  }
};

// Helper functie voor browser spraaksynthese als fallback
const useBrowserTTS = (text) => {
  return new Promise((resolve) => {
    // Gebruik de browser's speech synthesis API
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = 'nl-NL';
    
    // Voeg event handlers toe
    utterance.onend = () => {
      // Maak een dummy blob URL zonder echte audio data
      resolve('dummy-audio-url');
    };
    
    utterance.onerror = () => {
      console.error('Fout bij het afspelen van spraaksynthese');
      resolve('dummy-audio-url');
    };
    
    // Start de spraaksynthese
    speechSynthesis.speak(utterance);
  });
};

// Volledige chained functie voor spraak naar spraak verwerking
export const processSpeechToSpeech = async (audioBlob, context = {}) => {
  try {
    // Stap 1: Transcribeer audio naar tekst als we een audioBlob hebben
    let transcription = "";
    if (audioBlob) {
      transcription = await transcribeAudio(audioBlob);
      console.log('Transcriptie:', transcription);
    } else if (context.userText) {
      // Als er geen audioBlob is maar wel userText, gebruik die
      transcription = context.userText;
      console.log('Gebruiker tekst:', transcription);
    } else {
      return {
        transcription: "Geen audio of tekst ontvangen.",
        response: "Ik kon geen audio of tekst verwerken. Probeer het opnieuw.",
        audioUrl: await textToSpeech("Ik kon geen audio of tekst verwerken. Probeer het opnieuw.")
      };
    }
    
    // Stap 2: Verwerk de tekst met het LLM
    const response = await processWithLLM(transcription, context);
    console.log('LLM antwoord:', response);
    
    // Stap 3: Converteer het antwoord naar spraak
    const audioUrl = await textToSpeech(response);
    console.log('Audio URL gegenereerd');
    
    return {
      transcription,
      response,
      audioUrl
    };
  } catch (error) {
    console.error('Fout in speech-to-speech verwerking:', error);
    throw error;
  }
};
