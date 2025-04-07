import OpenAI from 'openai';
import { config } from './config';

// Initialiseer de OpenAI client
const openai = new OpenAI({
  // Gebruik de API key alleen als die beschikbaar is
  apiKey: config.openaiApiKey || 'dummy-key',
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
    console.error('Fout bij transcriberen:', error);
    return "Er is een fout opgetreden bij het transcriberen. Dit is een gesimuleerde transcriptie.";
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
export const textToSpeech = async (text, instructions = null) => {
  try {
    console.log('Tekst naar spraak omzetten met TTS...');
    
    // Controleer of we een geldige API key hebben
    if (!config.openaiApiKey) {
      console.warn('Geen OpenAI API key gevonden, gebruik browser TTS');
      return useBrowserTTS(text);
    }
    
    // Bereid de aanvraag voor
    const requestOptions = {
      model: config.models.openai.tts,
      voice: 'ash',
      speed: 1.0,
      input: text
    };
    
    // Voeg instructies toe als die er zijn
    if (instructions) {
      requestOptions.instructions = instructions;
    } else {
      // Standaard instructies als er geen zijn opgegeven
      requestOptions.instructions = "Personality/affect: a high-energy cheerleader helping with administrative tasks\n\nVoice: Enthusiastic, and bubbly, with an uplifting and motivational quality.\n\nTone: Encouraging and playful, making even simple tasks feel exciting and fun.\n\nDialect: Casual and upbeat Dutch, using informal phrasing and pep talk-style expressions.\n\nPronunciation: Crisp and lively, with exaggerated emphasis on positive words to keep the energy high.\n\nFeatures: Uses motivational phrases, cheerful exclamations, and an energetic rhythm to create a sense of excitement and engagement.";
    }
    
    console.log('TTS aanvraag versturen met stem:', requestOptions.voice);
    console.log('Steminstructies:', requestOptions.instructions);
    
    // Maak een response object met de juiste headers voor streaming
    const response = await fetch('https://api.openai.com/v1/audio/speech', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${config.openaiApiKey}`
      },
      body: JSON.stringify(requestOptions)
    });
    
    if (!response.ok) {
      throw new Error(`OpenAI API antwoordde met ${response.status}: ${response.statusText}`);
    }
    
    // Haal de audio blob op
    const audioBlob = await response.blob();
    
    // Maak een URL voor de audio blob
    const audioUrl = URL.createObjectURL(audioBlob);
    
    console.log('Audio URL gemaakt:', audioUrl);
    
    // Preload de audio om sneller te kunnen afspelen
    const audio = new Audio(audioUrl);
    audio.preload = 'auto';
    await new Promise(resolve => {
      audio.oncanplaythrough = resolve;
      audio.load();
    });
    
    return audioUrl;
  } catch (error) {
    console.error('Fout bij tekst naar spraak conversie:', error);
    // Gebruik browser TTS als fallback
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
    // Toon een vroege feedback voordat we beginnen met verwerken
    console.log('Start van spraak-naar-spraak verwerking');
    
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
    // Start de TTS verwerking parallel met de LLM verwerking voor snellere respons
    const llmPromise = processWithLLM(transcription, context);
    
    // Maak alvast een korte bevestiging klaar terwijl we wachten op het volledige antwoord
    const quickAcknowledgement = "Ik denk na over je vraag...";
    
    // Optionele instructies voor de stem
    const voiceInstructions = context.voiceInstructions || "Personality/affect: a high-energy cheerleader helping with administrative tasks \n\nVoice: Enthusiastic, and bubbly, with an uplifting and motivational quality.\n\nTone: Encouraging and playful, making even simple tasks feel exciting and fun.\n\nDialect: Casual and upbeat Dutch, using informal phrasing and pep talk-style expressions.\n\nPronunciation: Crisp and lively, with exaggerated emphasis on positive words to keep the energy high.\n\nFeatures: Uses motivational phrases, cheerful exclamations, and an energetic rhythm to create a sense of excitement and engagement.";
    
    // Gebruik de nieuwe textToSpeech functie met instructies
    const quickAudioPromise = textToSpeech(quickAcknowledgement, voiceInstructions);
    
    // Wacht op het LLM antwoord
    const response = await llmPromise;
    console.log('LLM antwoord:', response);
    
    // Stap 3: Converteer het antwoord naar spraak
    // Gebruik de nieuwe textToSpeech functie met instructies
    const audioUrl = await textToSpeech(response, voiceInstructions);
    
    // Stap 4: Geef het resultaat terug
    return {
      transcription,
      response,
      audioUrl,
      quickAudioUrl: await quickAudioPromise
    };
  } catch (error) {
    console.error('Fout in spraak-naar-spraak verwerking:', error);
    return {
      transcription: "Er is een fout opgetreden.",
      response: "Er is een fout opgetreden bij het verwerken van je vraag. Probeer het opnieuw.",
      audioUrl: await textToSpeech("Er is een fout opgetreden bij het verwerken van je vraag. Probeer het opnieuw.")
    };
  }
};
