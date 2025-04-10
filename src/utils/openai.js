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
    let messages = [
      {
        role: "system",
        content: `Je bent een behulpzame assistent voor Coliblanco. 
                 Huidige tijd: ${new Date().toLocaleString('nl-NL')}.
                 Houd je antwoorden kort en bondig, maar wel vriendelijk en behulpzaam.
                 Spreek Nederlands.`
      }
    ];
    
    // Voeg conversatiegeschiedenis toe als die er is
    if (context.conversationHistory && Array.isArray(context.conversationHistory)) {
      console.log('Conversatiegeschiedenis toevoegen:', context.conversationHistory);
      messages = [...messages, ...context.conversationHistory];
    }
    
    // Voeg het huidige bericht van de gebruiker toe
    messages.push({ role: "user", content: userText });
    
    // Voeg context toe als die er is
    if (context && Object.keys(context).length > 0 && !context.userText && !context.conversationHistory) {
      messages[0].content += `\nContext: ${JSON.stringify(context)}`;
    }
    
    console.log('Berichten naar OpenAI:', messages);
    
    // Roep de OpenAI API aan
    const completion = await openai.chat.completions.create({
      model: config.models.openai.llm,
      messages: messages,
    });
    
    const response = completion.choices[0].message.content;
    console.log('GPT antwoord ontvangen:', response);
    
    // Maak een nieuw antwoord object dat ook de bijgewerkte conversatiegeschiedenis bevat
    const result = {
      response: response,
      conversationHistory: [...(context.conversationHistory || []), 
                           { role: "user", content: userText }, 
                           { role: "assistant", content: response }]
    };
    
    return result;
  } catch (error) {
    console.error('Fout bij het verwerken van tekst met LLM:', error);
    return {
      response: "Er is een fout opgetreden bij het verwerken van je vraag.",
      conversationHistory: context.conversationHistory || []
    };
  }
};

// Echte functie voor tekst naar spraak conversie met OpenAI
export const textToSpeech = async (text, instructions = null) => {
  try {
    console.log('Tekst naar spraak omzetten met TTS...');
    
    // Controleer of het een object is met een response veld
    const inputText = typeof text === 'object' && text.response ? text.response : text;
    
    // Controleer of we een geldige API key hebben
    if (!config.openaiApiKey) {
      console.warn('Geen OpenAI API key gevonden, gebruik stille fallback');
      return useBrowserTTS(inputText);
    }
    
    // Gebruik de gecentraliseerde configuratie
    const response = await openai.audio.speech.create({
      model: config.models.openai.tts,
      voice: config.models.openai.ttsVoice,
      input: inputText,
      instructions: instructions || config.models.openai.ttsInstructions
    });
    
    console.log(`TTS aanvraag verstuurd met stem: ${config.models.openai.ttsVoice}`);
    
    // Converteer de response naar een blob
    const buffer = await response.arrayBuffer();
    const audioBlob = new Blob([buffer], { type: 'audio/mpeg' });
    
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
    // Gebruik stille fallback als OpenAI TTS mislukt
    return useBrowserTTS(text);
  }
};

// Helper functie voor browser spraaksynthese als fallback (nu uitgeschakeld)
const useBrowserTTS = (text) => {
  console.warn('Browser TTS is uitgeschakeld, geen audio afgespeeld');
  return new Promise((resolve) => {
    // Retourneer een dummy URL zonder echte audio
    setTimeout(() => {
      resolve('dummy-audio-url-silent');
    }, 100);
  });
};

// Volledige chained functie voor spraak-naar-spraak verwerking
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
    const voiceInstructions = context.voiceInstructions || config.models.openai.ttsInstructions;
    
    // Gebruik de nieuwe textToSpeech functie met instructies
    const quickAudioPromise = textToSpeech(quickAcknowledgement, voiceInstructions);
    
    // Wacht op het LLM antwoord
    const response = await llmPromise;
    console.log('LLM antwoord:', response);
    
    // Stap 3: Converteer het antwoord naar spraak
    // Gebruik de nieuwe textToSpeech functie met instructies
    const audioUrl = await textToSpeech(response.response, voiceInstructions);
    
    // Stap 4: Geef het resultaat terug
    return {
      transcription,
      response: response.response,
      conversationHistory: response.conversationHistory,
      audioUrl,
      quickAudioUrl: await quickAudioPromise
    };
  } catch (error) {
    console.error('Fout in spraak-naar-spraak verwerking:', error);
    return {
      transcription: "Er is een fout opgetreden.",
      response: "Er is een fout opgetreden bij het verwerken van je vraag. Probeer het opnieuw.",
      conversationHistory: context.conversationHistory || [],
      audioUrl: await textToSpeech("Er is een fout opgetreden bij het verwerken van je vraag. Probeer het opnieuw.")
    };
  }
};
