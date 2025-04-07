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
    // Controleer of we een geldige API key hebben
    if (!config.openaiApiKey) {
      console.warn('Geen OpenAI API key gevonden, gebruik browser spraaksynthese als fallback');
      return useBrowserTTS(text);
    }
    
    console.log('OpenAI TTS aanroepen met stem:', config.models.openai.ttsVoice);
    
    // Gebruik OpenAI's nieuwe streaming TTS API
    const audioElement = document.createElement('audio');
    audioElement.controls = true;
    
    // Maak een nieuwe ReadableStream voor de audio data
    const stream = new ReadableStream({
      async start(controller) {
        try {
          // Bereid de parameters voor
          const params = {
            model: config.models.openai.tts || 'gpt-4o-mini-tts',
            voice: config.models.openai.ttsVoice || 'alloy',
            input: text,
            response_format: 'mp3',
          };
          
          // Voeg instructies toe als die zijn opgegeven
          if (instructions) {
            params.instructions = instructions;
          }
          
          // Maak een streaming aanvraag naar de OpenAI API
          const response = await fetch('https://api.openai.com/v1/audio/speech', {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${config.openaiApiKey}`,
              'Content-Type': 'application/json',
            },
            body: JSON.stringify(params),
          });
          
          if (!response.ok) {
            throw new Error(`OpenAI API error: ${response.status} ${response.statusText}`);
          }
          
          // Lees de response als een ReadableStream
          const reader = response.body.getReader();
          
          // Verwerk de chunks van de stream
          while (true) {
            const { done, value } = await reader.read();
            if (done) break;
            controller.enqueue(value);
          }
          
          controller.close();
        } catch (error) {
          console.error('Fout bij het streamen van audio:', error);
          controller.error(error);
        }
      }
    });
    
    // Converteer de stream naar een blob
    const response = new Response(stream);
    const blob = await response.blob();
    
    // Maak een URL van de blob
    const url = URL.createObjectURL(blob);
    
    // Stel de audio source in
    audioElement.src = url;
    
    // Speel de audio automatisch af als dat gewenst is
    // audioElement.play();
    
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
    const voiceInstructions = context.voiceInstructions || "Spreek op een natuurlijke, vriendelijke toon. Gebruik een rustig tempo en duidelijke articulatie.";
    
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
