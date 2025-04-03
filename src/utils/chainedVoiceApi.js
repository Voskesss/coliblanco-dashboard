// Chained Voice API implementatie (Whisper → GPT → TTS)
// Deze implementatie gebruikt de bestaande OpenAI API's in plaats van de Realtime API

// Configuratie
const API_BASE_URL = '/api'; // Relatief pad voor productie
const DEV_API_URL = 'http://localhost:3001'; // Lokale server tijdens ontwikkeling

// Helper functie om de API basis URL te krijgen
const getApiBaseUrl = () => {
  // Gebruik de basis URL uit de configuratie of de standaard '/api'
  return '/api/voice';
};

// Functie om audio op te nemen van de microfoon
export const startRecording = async () => {
  try {
    console.log('Microfoon toegang aanvragen...');
    
    // Vraag microfoon toegang met specifieke constraints voor betere kwaliteit
    const stream = await navigator.mediaDevices.getUserMedia({ 
      audio: {
        echoCancellation: true,
        noiseSuppression: true,
        autoGainControl: true,
        channelCount: 1,
        sampleRate: 44100
      }
    });
    
    // Log de audio tracks voor debugging
    const audioTracks = stream.getAudioTracks();
    console.log(`Microfoon toegang verkregen: ${audioTracks.length} tracks`);
    audioTracks.forEach((track, index) => {
      console.log(`Track ${index}: ${track.label}`);
      console.log('Track settings:', track.getSettings());
    });
    
    // Maak een MediaRecorder met specifieke instellingen
    const options = { mimeType: 'audio/webm' };
    const mediaRecorder = new MediaRecorder(stream, options);
    const audioChunks = [];
    
    console.log('MediaRecorder aangemaakt met MIME type:', mediaRecorder.mimeType);
    
    // Event handlers voor de MediaRecorder
    mediaRecorder.ondataavailable = (event) => {
      if (event.data.size > 0) {
        console.log(`Audio chunk ontvangen: ${event.data.size} bytes`);
        audioChunks.push(event.data);
      }
    };
    
    // Start de opname met een korte interval om meer chunks te krijgen
    mediaRecorder.start(1000); // Elke seconde een chunk
    console.log('Opname gestart...');
    
    // Geef de recorder en stream terug
    return {
      mediaRecorder,
      stream,
      audioChunks,
      stop: () => {
        return new Promise((resolve) => {
          mediaRecorder.onstop = () => {
            // Maak een blob van de audio chunks
            const audioBlob = new Blob(audioChunks, { type: 'audio/webm' });
            console.log(`Opname gestopt, ${audioChunks.length} chunks, totale grootte: ${audioBlob.size} bytes`);
            resolve(audioBlob);
          };
          
          // Stop de recorder als deze actief is
          if (mediaRecorder.state !== 'inactive') {
            mediaRecorder.stop();
            console.log('MediaRecorder gestopt');
          } else {
            console.log('MediaRecorder was al gestopt');
            // Als er geen chunks zijn, maak een lege blob
            if (audioChunks.length === 0) {
              resolve(new Blob([], { type: 'audio/webm' }));
            } else {
              const audioBlob = new Blob(audioChunks, { type: 'audio/webm' });
              resolve(audioBlob);
            }
          }
        });
      }
    };
  } catch (error) {
    console.error('Fout bij starten opname:', error);
    throw error;
  }
};

// Transcribeer audio met Whisper API
export const transcribeAudio = async (audioBlob) => {
  try {
    console.log('Audio transcriberen...');
    
    // Maak een FormData object met de audio
    const formData = new FormData();
    formData.append('file', audioBlob);
    
    // Stuur de audio naar de server
    const response = await fetch(`${getApiBaseUrl()}/transcribe`, {
      method: 'POST',
      body: formData
    });
    
    if (!response.ok) {
      throw new Error(`Server antwoordde met ${response.status}: ${response.statusText}`);
    }
    
    const data = await response.json();
    console.log('Transcriptie ontvangen:', data.text);
    return data.text;
  } catch (error) {
    console.error('Fout bij transcriberen audio:', error);
    throw error;
  }
};

// Genereer een antwoord met GPT API
export const generateResponse = async (text, context = []) => {
  try {
    console.log('Antwoord genereren...');
    
    // Als er geen tekst is, gebruik een standaard vraag
    if (!text || text.trim() === '') {
      console.log('Lege tekst ontvangen, gebruik standaard antwoord');
      return 'Ik heb je niet goed verstaan. Kun je het nog eens proberen?';
    }
    
    // Bereid de berichten voor
    const messages = [
      {
        role: 'system',
        content: 'Je bent een behulpzame assistent voor het Coliblanco dashboard. Beantwoord vragen kort en bondig in het Nederlands. Gebruik maximaal 2-3 zinnen.'
      },
      ...context,
      { role: 'user', content: text }
    ];
    
    // Stuur de berichten naar de server
    const response = await fetch(`${getApiBaseUrl()}/chat`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: 'gpt-4o',
        messages,
        temperature: 0.7,
        max_tokens: 100 // Verminder het aantal tokens voor snellere antwoorden
      })
    });
    
    if (!response.ok) {
      throw new Error(`Server antwoordde met ${response.status}: ${response.statusText}`);
    }
    
    const data = await response.json();
    const responseText = data.choices[0].message.content;
    console.log('Antwoord ontvangen:', responseText);
    return responseText;
  } catch (error) {
    console.error('Fout bij genereren antwoord:', error);
    throw error;
  }
};

// Functie om tekst om te zetten naar spraak met TTS API
export const textToSpeech = async (text) => {
  try {
    console.log('Tekst naar spraak omzetten...');
    
    // Stuur de tekst naar de server
    const response = await fetch(`${getApiBaseUrl()}/tts`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        text,
        voice: 'alloy',
        model: 'tts-1',
        speed: 1.1 // Iets sneller voor betere responsiviteit
      })
    });
    
    if (!response.ok) {
      throw new Error(`Server antwoordde met ${response.status}: ${response.statusText}`);
    }
    
    // Haal de audio blob op
    const audioBlob = await response.blob();
    console.log('Spraak ontvangen');
    
    // Maak een URL voor de audio blob
    const audioUrl = URL.createObjectURL(audioBlob);
    return audioUrl;
  } catch (error) {
    console.error('Fout bij tekst naar spraak:', error);
    throw error;
  }
};

// Functie om audio af te spelen
export const playAudio = (audioUrl) => {
  return new Promise((resolve, reject) => {
    try {
      // Maak een audio element
      const audio = new Audio(audioUrl);
      
      // Event handlers
      audio.onplay = () => console.log('Audio afspelen gestart');
      audio.onended = () => {
        console.log('Audio afspelen voltooid');
        resolve();
      };
      audio.onerror = (error) => {
        console.error('Fout bij afspelen audio:', error);
        reject(error);
      };
      
      // Speel de audio af
      audio.play().catch(reject);
    } catch (error) {
      console.error('Fout bij maken audio element:', error);
      reject(error);
    }
  });
};

// Hoofdfunctie om de hele keten uit te voeren
export const processVoiceInput = async (audioBlob, context = []) => {
  try {
    // Stap 1: Transcribeer de audio naar tekst
    const transcription = await transcribeAudio(audioBlob);
    
    // Stap 2: Genereer een antwoord op basis van de transcriptie
    const response = await generateResponse(transcription, context);
    
    // Stap 3: Toon het antwoord karakter voor karakter (gebeurt via callbacks)
    
    // Stap 4: Zet het antwoord om naar spraak en speel het af
    const audioUrl = await textToSpeech(response);
    await playAudio(audioUrl);
    
    // Geef de resultaten terug
    return {
      userText: transcription,
      aiText: response,
      audioUrl
    };
  } catch (error) {
    console.error('Fout bij verwerken spraak input:', error);
    throw error;
  }
};

// Volledige voice interface functie
export const setupChainedVoiceInterface = (options = {}) => {
  let recording = null;
  let conversationContext = [];
  
  // Start luisteren naar de gebruiker
  const startListening = async () => {
    try {
      if (recording) return; // Al aan het opnemen
      
      // Start de opname
      recording = await startRecording();
      
      // Roep de callback aan als die is meegegeven
      if (options.onSpeechStart) {
        options.onSpeechStart();
      }
    } catch (error) {
      console.error('Fout bij starten luisteren:', error);
      if (options.onError) {
        options.onError(error);
      }
    }
  };
  
  // Stop met luisteren en verwerk de input
  const stopListening = async () => {
    try {
      if (!recording) return; // Niet aan het opnemen
      
      // Stop de opname
      const audioBlob = await recording.stop();
      
      // Maak de opname variabele vrij
      const currentRecording = recording;
      recording = null;
      
      // Stop de mediastream tracks
      currentRecording.stream.getTracks().forEach(track => track.stop());
      
      // Roep de callback aan als die is meegegeven
      if (options.onSpeechEnd) {
        options.onSpeechEnd();
      }
      
      // Transcribeer de audio
      const transcription = await transcribeAudio(audioBlob);
      
      // Update de transcriptie in de UI
      if (options.onTranscriptComplete && transcription) {
        options.onTranscriptComplete(transcription);
      }
      
      // Genereer een antwoord
      const response = await generateResponse(transcription, conversationContext);
      
      // Update de conversatie context
      conversationContext.push(
        { role: 'user', content: transcription },
        { role: 'assistant', content: response }
      );
      
      // Houd de context beperkt tot de laatste 10 berichten
      if (conversationContext.length > 10) {
        conversationContext = conversationContext.slice(-10);
      }
      
      // Bereid een nieuwe response voor zonder de vorige te wissen
      let currentResponse = '';
      
      // Toon het antwoord karakter voor karakter, maar sneller
      if (options.onTextDelta && response) {
        for (const char of response) {
          currentResponse += char;
          options.onTextDelta(char);
          // Zeer kleine vertraging om het nog steeds vloeiend te laten lijken maar sneller
          await new Promise(resolve => setTimeout(resolve, 5));
        }
      }
      
      // Start de tekst-naar-spraak conversie terwijl de tekst al getoond wordt
      const audioPromise = textToSpeech(response);
      
      // Kortere pauze voordat we het audio afspelen
      await new Promise(resolve => setTimeout(resolve, 200));
      
      // Wacht tot de audio URL beschikbaar is en speel de audio af
      const audioUrl = await audioPromise;
      await playAudio(audioUrl);
      
      // Roep de callback aan als die is meegegeven
      if (options.onResponseDone) {
        options.onResponseDone({
          output: [
            {
              content: [
                {
                  type: 'text',
                  text: response
                }
              ]
            }
          ]
        });
      }
      
      return {
        userText: transcription,
        aiText: response,
        audioUrl
      };
    } catch (error) {
      console.error('Fout bij stoppen luisteren:', error);
      if (options.onError) {
        options.onError(error);
      }
    }
  };
  
  // Verstuur een tekstbericht
  const sendMessage = async (text) => {
    try {
      // Roep de callback aan als die is meegegeven
      if (options.onSpeechEnd) {
        options.onSpeechEnd();
      }
      
      // Genereer een antwoord
      const response = await generateResponse(text, conversationContext);
      
      // Update de conversatie context
      conversationContext.push(
        { role: 'user', content: text },
        { role: 'assistant', content: response }
      );
      
      // Houd de context beperkt tot de laatste 10 berichten
      if (conversationContext.length > 10) {
        conversationContext = conversationContext.slice(-10);
      }
      
      // Bereid een nieuwe response voor zonder de vorige te wissen
      let currentResponse = '';
      
      // Toon het antwoord karakter voor karakter, maar sneller
      if (options.onTextDelta) {
        for (const char of response) {
          currentResponse += char;
          options.onTextDelta(char); // Stuur alleen het nieuwe karakter
          // Zeer kleine vertraging om het nog steeds vloeiend te laten lijken maar sneller
          await new Promise(resolve => setTimeout(resolve, 5));
        }
      }
      
      // Start de tekst-naar-spraak conversie terwijl de tekst al getoond wordt
      const audioPromise = textToSpeech(response);
      
      // Kortere pauze voordat we het audio afspelen
      await new Promise(resolve => setTimeout(resolve, 200));
      
      // Wacht tot de audio URL beschikbaar is en speel de audio af
      const audioUrl = await audioPromise;
      await playAudio(audioUrl);
      
      // Roep de callback aan als die is meegegeven
      if (options.onResponseDone) {
        options.onResponseDone({
          output: [
            {
              content: [
                {
                  type: 'text',
                  text: response
                }
              ]
            }
          ]
        });
      }
      
      return {
        userText: text,
        aiText: response,
        audioUrl
      };
    } catch (error) {
      console.error('Fout bij versturen bericht:', error);
      if (options.onError) {
        options.onError(error);
      }
    }
  };
  
  // Beëindig de sessie
  const endSession = () => {
    try {
      // Stop de opname als die bezig is
      if (recording) {
        recording.stream.getTracks().forEach(track => track.stop());
        recording = null;
      }
      
      // Wis de conversatie context
      conversationContext = [];
      
      // Roep de callback aan als die is meegegeven
      if (options.onClose) {
        options.onClose();
      }
    } catch (error) {
      console.error('Fout bij beëindigen sessie:', error);
    }
  };
  
  // Geef de interface functies terug
  return {
    startListening,
    stopListening,
    sendMessage,
    endSession
  };
};
