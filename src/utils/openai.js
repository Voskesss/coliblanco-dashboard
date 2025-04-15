import { config } from './config';

// Basis URL voor de Python backend
const PYTHON_BACKEND_URL = 'http://localhost:5001';

// Functie voor spraak naar tekst conversie via de Python backend
export const transcribeAudio = async (audioBlob) => {
  try {
    console.log('Transcriberen van audio via Python backend...');
    
    // Controleer of we een audioBlob hebben
    if (!audioBlob) {
      console.warn('Geen audioBlob ontvangen, gebruik gesimuleerde transcriptie');
      return "Geen audio ontvangen. Dit is een gesimuleerde transcriptie.";
    }
    
    // Maak een FormData object om de audio te versturen
    const formData = new FormData();
    formData.append('file', audioBlob, 'audio.webm');
    
    // Roep de Python backend aan
    const response = await fetch(`${PYTHON_BACKEND_URL}/transcribe`, {
      method: 'POST',
      body: formData
    });
    
    if (!response.ok) {
      throw new Error(`Backend antwoordde met ${response.status}: ${response.statusText}`);
    }
    
    const data = await response.json();
    console.log('Transcriptie ontvangen:', data);
    
    return data.text;
  } catch (error) {
    console.error('Fout bij transcriberen van audio:', error);
    return "Er is een fout opgetreden bij het transcriberen van de audio.";
  }
};

// Functie voor het verwerken van tekst met het LLM via de Python backend
export const processWithLLM = async (userText, context = {}) => {
  try {
    console.log('Verwerken van tekst met LLM via Python backend...');
    console.log('Context:', context);
    
    // Bereid de berichten voor
    let messages = [
      {
        role: "system",
        content: `Je bent een vriendelijke Nederlandse assistent voor het Coliblanco Dashboard. 
                 Je geeft korte, behulpzame antwoorden in het Nederlands. 
                 Wees beleefd, informatief en to-the-point.
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
    
    // Roep de Python backend aan
    const response = await fetch(`${PYTHON_BACKEND_URL}/chat`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        messages: messages,
        model: config.models.openai.llm,
        temperature: 0.7,
        max_tokens: 150
      })
    });
    
    if (!response.ok) {
      throw new Error(`Backend antwoordde met ${response.status}: ${response.statusText}`);
    }
    
    const data = await response.json();
    console.log('LLM antwoord ontvangen:', data);
    
    const assistantMessage = data.choices[0].message.content;
    
    // Maak een nieuw antwoord object dat ook de bijgewerkte conversatiegeschiedenis bevat
    const result = {
      response: assistantMessage,
      conversationHistory: [...(context.conversationHistory || []), 
                         { role: "user", content: userText }, 
                         { role: "assistant", content: assistantMessage }]
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

// Functie voor tekst naar spraak conversie via de Python backend
export const textToSpeech = async (text, instructions = null) => {
  try {
    console.log('Tekst naar spraak omzetten via Python backend...');
    
    // Controleer of het een object is met een response veld
    const inputText = typeof text === 'object' && text.response ? text.response : text;
    
    // Roep de Python backend aan
    const response = await fetch(`${PYTHON_BACKEND_URL}/tts`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        text: inputText,
        voice: config.models.openai.ttsVoice,
        model: config.models.openai.tts,
        instructions: instructions || config.models.openai.ttsInstructions
      })
    });
    
    if (!response.ok) {
      throw new Error(`Backend antwoordde met ${response.status}: ${response.statusText}`);
    }
    
    const data = await response.json();
    console.log('TTS URL ontvangen:', data);
    
    // Maak de volledige URL voor de audio
    const audioUrl = `${PYTHON_BACKEND_URL}${data.url}`;
    
    return audioUrl;
  } catch (error) {
    console.error('Fout bij tekst naar spraak conversie:', error);
    return useBrowserTTS(text);
  }
};

// Helper functie voor browser spraaksynthese als fallback
const useBrowserTTS = (text) => {
  console.warn('Fallback naar browser TTS...');
  // Deze functie gebruikt de browser's ingebouwde spraaksynthese als fallback
  const utterance = new SpeechSynthesisUtterance(text);
  utterance.lang = 'nl-NL';
  window.speechSynthesis.speak(utterance);
  return null; // Geen audio URL in dit geval
};

// Volledige chained functie voor spraak-naar-spraak verwerking
export const processSpeechToSpeech = async (audioBlob, context = {}) => {
  try {
    // Stap 1: Transcribeer de audio naar tekst
    const transcription = await transcribeAudio(audioBlob);
    console.log('Transcriptie:', transcription);
    
    // Als er geen transcriptie is, stop dan
    if (!transcription || transcription.trim() === '') {
      console.warn('Geen tekst gedetecteerd in de audio');
      return {
        transcription: '',
        response: '',
        audioUrl: null,
        error: 'Geen tekst gedetecteerd in de audio'
      };
    }
    
    // Stap 2: Verwerk de tekst met het LLM
    const llmResponse = await processWithLLM(transcription, context);
    console.log('LLM antwoord:', llmResponse);
    
    // Stap 3: Converteer het antwoord naar spraak
    const audioUrl = await textToSpeech(llmResponse.response);
    console.log('Audio URL:', audioUrl);
    
    // Geef het resultaat terug
    return {
      transcription: transcription,
      response: llmResponse.response,
      audioUrl: audioUrl,
      conversationHistory: llmResponse.conversationHistory
    };
  } catch (error) {
    console.error('Fout bij spraak-naar-spraak verwerking:', error);
    return {
      transcription: '',
      response: 'Er is een fout opgetreden bij het verwerken van je vraag.',
      audioUrl: null,
      error: error.message
    };
  }
};
