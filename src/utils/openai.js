import { config } from './config';
import { environment } from './environment';
import io from 'socket.io-client';

// Basis URL voor de Python backend
const PYTHON_BACKEND_URL = environment.backendUrl;

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
    console.log('Verwerken van tekst met LLM:', userText);
    
    // Bereid de berichten voor
    const messages = [
      ...(context.conversationHistory || []),
      { role: "user", content: userText }
    ];
    
    // Stuur een verzoek naar de backend
    const response = await fetch(`${PYTHON_BACKEND_URL}/api/chat`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        messages: messages,
        model: context.model || 'gpt-4o',
        temperature: context.temperature || 0.7
      })
    });
    
    if (!response.ok) {
      throw new Error(`Backend antwoordde met ${response.status}: ${response.statusText}`);
    }
    
    const data = await response.json();
    console.log('LLM antwoord ontvangen:', data);
    
    // Haal het antwoord op uit de response (aangepast voor het nieuwe formaat)
    const assistantMessage = data.text || "Er is een fout opgetreden bij het verwerken van je vraag.";
    
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
      conversationHistory: [...(context.conversationHistory || []), 
                       { role: "user", content: userText }, 
                       { role: "assistant", content: "Er is een fout opgetreden bij het verwerken van je vraag." }]
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
    const response = await fetch(`${PYTHON_BACKEND_URL}/api/tts`, {
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
    const audioUrl = `${PYTHON_BACKEND_URL}${data.audio_url}`;
    
    return audioUrl;
  } catch (error) {
    console.error('Fout bij tekst naar spraak conversie:', error);
    console.log('Fallback naar browser TTS...');
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

// Nieuwe functie voor het opzetten van een WebSocket verbinding voor realtime spraakverwerking
export const setupRealtimeVoiceProcessing = () => {
  // Controleer of de browser WebSockets ondersteunt
  if (!window.WebSocket) {
    console.error('WebSockets worden niet ondersteund door deze browser');
    return null;
  }
  
  let socket = null;
  let isConnected = false;
  let isListening = false;
  let mediaRecorder = null;
  let audioContext = null;
  let analyser = null;
  let sessionId = null;
  let callbacks = {};
  
  // Functie om de WebSocket verbinding op te zetten
  const connect = () => {
    try {
      // Maak een nieuwe WebSocket verbinding
      socket = io(PYTHON_BACKEND_URL, {
        transports: ['websocket'],
        reconnection: true,
        reconnectionAttempts: 5,
        reconnectionDelay: 1000
      });
      
      // Event handlers voor de WebSocket verbinding
      socket.on('connect', () => {
        console.log('WebSocket verbonden');
        isConnected = true;
        if (callbacks.onConnect) callbacks.onConnect();
      });
      
      socket.on('connected', (data) => {
        console.log('Sessie ID ontvangen:', data);
        sessionId = data.session_id;
        if (callbacks.onSessionStart) callbacks.onSessionStart(data);
      });
      
      socket.on('disconnect', () => {
        console.log('WebSocket verbinding verbroken');
        isConnected = false;
        isListening = false;
        if (callbacks.onDisconnect) callbacks.onDisconnect();
      });
      
      socket.on('listening_started', (data) => {
        console.log('Luisteren gestart:', data);
        isListening = true;
        if (callbacks.onListeningStart) callbacks.onListeningStart(data);
      });
      
      socket.on('listening_stopped', (data) => {
        console.log('Luisteren gestopt:', data);
        isListening = false;
        if (callbacks.onListeningStop) callbacks.onListeningStop(data);
      });
      
      socket.on('transcription', (data) => {
        console.log('Transcriptie ontvangen:', data);
        if (callbacks.onTranscription) callbacks.onTranscription(data);
      });
      
      socket.on('llm_response', (data) => {
        console.log('LLM antwoord ontvangen:', data);
        if (callbacks.onLLMResponse) callbacks.onLLMResponse(data);
      });
      
      socket.on('tts_response', (data) => {
        console.log('TTS antwoord ontvangen:', data);
        // Maak de volledige URL voor de audio
        data.fullUrl = `${PYTHON_BACKEND_URL}${data.url}`;
        if (callbacks.onTTSResponse) callbacks.onTTSResponse(data);
      });
      
      socket.on('processing_complete', (data) => {
        console.log('Verwerking voltooid:', data);
        if (callbacks.onProcessingComplete) callbacks.onProcessingComplete(data);
      });
      
      socket.on('error', (error) => {
        console.error('WebSocket fout:', error);
        if (callbacks.onError) callbacks.onError(error);
      });
      
      return true;
    } catch (error) {
      console.error('Fout bij opzetten WebSocket verbinding:', error);
      if (callbacks.onError) callbacks.onError(error);
      return false;
    }
  };
  
  // Functie om de microfoon te initialiseren
  const initMicrophone = async () => {
    try {
      // Vraag toestemming voor microfoon
      const stream = await navigator.mediaDevices.getUserMedia({ 
        audio: { 
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true
        } 
      });
      
      // Maak een MediaRecorder voor de audio
      mediaRecorder = new MediaRecorder(stream, {
        mimeType: 'audio/webm',
        audioBitsPerSecond: 128000
      });
      
      // Maak een AudioContext voor geluidsanalyse
      audioContext = new (window.AudioContext || window.webkitAudioContext)();
      analyser = audioContext.createAnalyser();
      analyser.fftSize = 256;
      
      const source = audioContext.createMediaStreamSource(stream);
      source.connect(analyser);
      
      // Event handlers voor de MediaRecorder
      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0 && isListening && socket && socket.connected) {
          // Converteer de audio data naar een ArrayBuffer
          event.data.arrayBuffer().then(buffer => {
            // Stuur de audio data naar de server
            socket.emit('audio_chunk', { audio_data: new Uint8Array(buffer) });
          });
        }
      };
      
      return true;
    } catch (error) {
      console.error('Fout bij initialiseren microfoon:', error);
      if (callbacks.onError) callbacks.onError(error);
      return false;
    }
  };
  
  // Functie om te beginnen met luisteren
  const startListening = async () => {
    if (!isConnected) {
      console.error('Niet verbonden met WebSocket');
      return false;
    }
    
    if (isListening) {
      console.warn('Al aan het luisteren');
      return true;
    }
    
    try {
      // Initialiseer de microfoon als dat nog niet is gebeurd
      if (!mediaRecorder) {
        const success = await initMicrophone();
        if (!success) return false;
      }
      
      // Stuur een bericht naar de server om te beginnen met luisteren
      socket.emit('start_listening');
      
      // Start de MediaRecorder
      mediaRecorder.start(100); // Neem op in chunks van 100ms
      
      return true;
    } catch (error) {
      console.error('Fout bij starten met luisteren:', error);
      if (callbacks.onError) callbacks.onError(error);
      return false;
    }
  };
  
  // Functie om te stoppen met luisteren
  const stopListening = (manualStop = true) => {
    if (!isConnected) {
      console.error('Niet verbonden met WebSocket');
      return false;
    }
    
    if (!isListening) {
      console.warn('Niet aan het luisteren');
      return true;
    }
    
    try {
      // Stop de MediaRecorder
      if (mediaRecorder && mediaRecorder.state === 'recording') {
        mediaRecorder.stop();
      }
      
      // Stuur een bericht naar de server om te stoppen met luisteren
      socket.emit('stop_listening', { manual_stop: manualStop });
      
      return true;
    } catch (error) {
      console.error('Fout bij stoppen met luisteren:', error);
      if (callbacks.onError) callbacks.onError(error);
      return false;
    }
  };
  
  // Functie om een interruptie te sturen
  const sendInterrupt = () => {
    if (!isConnected) {
      console.error('Niet verbonden met WebSocket');
      return false;
    }
    
    try {
      socket.emit('interrupt');
      return true;
    } catch (error) {
      console.error('Fout bij versturen interruptie:', error);
      if (callbacks.onError) callbacks.onError(error);
      return false;
    }
  };
  
  // Functie om de verbinding te verbreken
  const disconnect = () => {
    try {
      // Stop eerst met luisteren als dat nog niet is gebeurd
      if (isListening) {
        stopListening();
      }
      
      // Stop de MediaRecorder en sluit de stream
      if (mediaRecorder) {
        if (mediaRecorder.state === 'recording') {
          mediaRecorder.stop();
        }
        
        // Sluit de stream
        if (mediaRecorder.stream) {
          mediaRecorder.stream.getTracks().forEach(track => track.stop());
        }
        
        mediaRecorder = null;
      }
      
      // Sluit de AudioContext
      if (audioContext) {
        audioContext.close();
        audioContext = null;
        analyser = null;
      }
      
      // Verbreek de WebSocket verbinding
      if (socket) {
        socket.disconnect();
        socket = null;
      }
      
      isConnected = false;
      isListening = false;
      sessionId = null;
      
      return true;
    } catch (error) {
      console.error('Fout bij verbreken verbinding:', error);
      if (callbacks.onError) callbacks.onError(error);
      return false;
    }
  };
  
  // Functie om callbacks te registreren
  const registerCallbacks = (newCallbacks) => {
    callbacks = { ...callbacks, ...newCallbacks };
  };
  
  // Functie om het geluidsniveau te monitoren
  const getAudioLevel = () => {
    if (!analyser) return 0;
    
    const dataArray = new Uint8Array(analyser.frequencyBinCount);
    analyser.getByteFrequencyData(dataArray);
    
    // Bereken het gemiddelde geluidsniveau
    const average = dataArray.reduce((sum, value) => sum + value, 0) / dataArray.length;
    
    // Normaliseer naar een waarde tussen 0 en 100
    return Math.min(100, Math.max(0, average * 2));
  };
  
  // Functie om de stiltedetectie te starten
  const startSilenceDetection = (silenceThreshold = 10, silenceDuration = 1500) => {
    if (!isListening || !analyser) return false;
    
    let silenceStart = null;
    let silenceDetectionInterval = null;
    
    silenceDetectionInterval = setInterval(() => {
      const level = getAudioLevel();
      
      // Als het geluidsniveau onder de drempelwaarde is, detecteer stilte
      if (level < silenceThreshold) {
        if (silenceStart === null) {
          silenceStart = Date.now();
        } else if (Date.now() - silenceStart > silenceDuration) {
          // Als de stilte lang genoeg duurt, stop met luisteren
          console.log('Stilte gedetecteerd, stop met luisteren');
          stopListening(false); // Niet handmatig gestopt
          clearInterval(silenceDetectionInterval);
        }
      } else {
        // Reset de stiltedetectie als er geluid is
        silenceStart = null;
      }
    }, 100);
    
    return silenceDetectionInterval;
  };
  
  // Functie om de stiltedetectie te stoppen
  const stopSilenceDetection = (interval) => {
    if (interval) {
      clearInterval(interval);
    }
  };
  
  // Geef de publieke API terug
  return {
    connect,
    disconnect,
    startListening,
    stopListening,
    sendInterrupt,
    registerCallbacks,
    getAudioLevel,
    startSilenceDetection,
    stopSilenceDetection,
    isConnected: () => isConnected,
    isListening: () => isListening,
    getSessionId: () => sessionId
  };
};

// Verbeterde functie voor het opzetten van een WebSocket verbinding met de nieuwe spraakinterface
export const setupEnhancedVoiceProcessing = () => {
  // State variabelen
  let socket = null;
  let isConnected = false;
  let isListening = false;
  let mediaRecorder = null;
  let audioContext = null;
  let analyser = null;
  let callbacks = {};
  let pingInterval = null;
  
  // URL voor de FastAPI backend
  const FASTAPI_BACKEND_URL = 'ws://localhost:8000/ws/voice';
  
  // Verbind met de server met reconnect functionaliteit
  const connect = () => {
    try {
      // Maak een nieuwe WebSocket verbinding
      if (socket && (socket.readyState === WebSocket.OPEN || socket.readyState === WebSocket.CONNECTING)) {
        console.log('WebSocket is al verbonden of aan het verbinden');
        return true;
      }
      
      console.log('Verbinden met WebSocket server:', FASTAPI_BACKEND_URL);
      socket = new WebSocket(FASTAPI_BACKEND_URL);
      
      // Event handlers voor de WebSocket
      socket.onopen = () => {
        console.log('Verbonden met de server');
        isConnected = true;
        if (callbacks.onConnect) callbacks.onConnect();
        
        // Start een ping interval om de verbinding levend te houden
        if (pingInterval) clearInterval(pingInterval);
        pingInterval = setInterval(() => {
          if (isConnected) {
            console.log('Ping verzenden naar server...');
            sendMessage('ping');
          }
        }, 30000); // Elke 30 seconden een ping sturen
      };
      
      socket.onclose = (event) => {
        console.log(`Verbinding met de server verbroken: ${event.code} ${event.reason}`);
        console.log('WebSocket close event details:', event);
        isConnected = false;
        isListening = false;
        
        // Stop het ping interval
        if (pingInterval) {
          clearInterval(pingInterval);
          pingInterval = null;
        }
        
        if (callbacks.onDisconnect) callbacks.onDisconnect();
        
        // Probeer opnieuw te verbinden na 3 seconden
        setTimeout(() => {
          if (!isConnected) {
            console.log('Proberen opnieuw te verbinden...');
            connect();
          }
        }, 3000);
      };
      
      socket.onerror = (error) => {
        console.error('WebSocket fout:', error);
        if (callbacks.onError) callbacks.onError(error);
      };
      
      socket.onmessage = (event) => {
        try {
          console.log('Ruwe data ontvangen:', event.data);
          const data = JSON.parse(event.data);
          console.log('Bericht ontvangen:', data);
          
          // Verwerk het bericht op basis van het event type
          if (data.event === 'connected') {
            console.log('Verbonden met sessie ID:', data.session_id);
            if (callbacks.onConnect) callbacks.onConnect(data);
          } else if (data.event === 'listening_started') {
            isListening = true;
            console.log('Luisteren gestart');
            if (callbacks.onListeningStart) callbacks.onListeningStart(data);
          } else if (data.event === 'listening_stopped') {
            isListening = false;
            console.log('Luisteren gestopt');
            if (callbacks.onListeningStop) callbacks.onListeningStop(data);
          } else if (data.event === 'command_processed') {
            console.log('Commando verwerkt:', data);
            if (callbacks.onCommandProcessed) callbacks.onCommandProcessed(data);
          } else if (data.event === 'transcription_update') {
            console.log('Transcriptie update:', data);
            if (callbacks.onTranscriptionUpdate) callbacks.onTranscriptionUpdate(data);
          } else if (data.event === 'error') {
            console.error('Fout van server:', data.message);
            if (callbacks.onError) callbacks.onError(new Error(data.message));
          } else if (data.event === 'pong') {
            console.log('Pong ontvangen van server');
          }
        } catch (error) {
          console.error('Fout bij verwerken bericht:', error);
          console.error('Ontvangen data:', event.data);
        }
      };
      
      return true;
    } catch (error) {
      console.error('Fout bij verbinden met de server:', error);
      return false;
    }
  };
  
  // Stuur een bericht naar de server
  const sendMessage = (event, data = {}) => {
    if (!isConnected || !socket) {
      console.error('Niet verbonden met de server');
      return false;
    }
    
    try {
      // Combineer het event en de data in één object
      const message = { event, ...data };
      
      // Stuur het bericht als JSON
      socket.send(JSON.stringify(message));
      return true;
    } catch (error) {
      console.error('Fout bij verzenden bericht:', error);
      return false;
    }
  };
  
  // Functie om callbacks in te stellen
  const setCallbacks = (newCallbacks) => {
    callbacks = { ...callbacks, ...newCallbacks };
  };
  
  // Functie om te beginnen met luisteren
  const startListening = async (audioConstraints = {}) => {
    try {
      if (!isConnected) {
        console.warn('Niet verbonden, probeer opnieuw te verbinden...');
        const connected = connect();
        if (!connected) {
          throw new Error('Kon niet verbinden met de server');
        }
      }
      
      // Vraag toestemming voor de microfoon
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: audioConstraints.audio || true,
        video: false
      });
      
      // Maak een AudioContext voor analyse
      audioContext = new (window.AudioContext || window.webkitAudioContext)();
      analyser = audioContext.createAnalyser();
      const source = audioContext.createMediaStreamSource(stream);
      source.connect(analyser);
      
      // Configureer de analyser
      analyser.fftSize = 256;
      const bufferLength = analyser.frequencyBinCount;
      const dataArray = new Uint8Array(bufferLength);
      
      // Maak een MediaRecorder
      mediaRecorder = new MediaRecorder(stream, {
        mimeType: 'audio/webm'
      });
      
      // Event handlers voor de MediaRecorder
      mediaRecorder.ondataavailable = async (event) => {
        if (event.data.size > 0 && isListening) {
          try {
            // Converteer de Blob naar een ArrayBuffer
            const arrayBuffer = await event.data.arrayBuffer();
            // Stuur de audio data naar de server
            socket.send(arrayBuffer);
            
            // Bereken het audio niveau
            analyser.getByteFrequencyData(dataArray);
            const average = dataArray.reduce((sum, value) => sum + value, 0) / bufferLength;
            const level = Math.min(100, Math.max(0, average / 2.55)); // Schaal naar 0-100
            
            // Stuur het audio niveau naar de callbacks
            if (callbacks.onAudioLevel) callbacks.onAudioLevel(level);
            if (callbacks.onChunkProcessed) callbacks.onChunkProcessed({ level });
          } catch (error) {
            console.error('Fout bij versturen audio data:', error);
          }
        }
      };
      
      // Start de MediaRecorder
      mediaRecorder.start(100); // Stuur elke 100ms een chunk
      
      // Stuur een bericht naar de server om te beginnen met luisteren
      sendMessage('start_listening', { language: audioConstraints.language || 'nl' });
      
      isListening = true;
      return true;
    } catch (error) {
      console.error('Fout bij starten luisteren:', error);
      return false;
    }
  };
  
  // Functie om te stoppen met luisteren
  const stopListening = (manualStop = false) => {
    try {
      if (!isConnected) {
        console.error('Niet verbonden met de server');
        return false;
      }
      
      if (!isListening) {
        console.log('Niet aan het luisteren');
        return true;
      }
      
      // Stop de MediaRecorder
      if (mediaRecorder && mediaRecorder.state !== 'inactive') {
        mediaRecorder.stop();
      }
      
      // Stuur een bericht naar de server om te stoppen met luisteren
      sendMessage('stop_listening', { manual_stop: manualStop });
      
      isListening = false;
      return true;
    } catch (error) {
      console.error('Fout bij stoppen luisteren:', error);
      return false;
    }
  };
  
  // Functie om een commando te verwerken
  const processCommand = async (text) => {
    try {
      if (!isConnected) {
        console.warn('Niet verbonden, probeer opnieuw te verbinden...');
        const connected = connect();
        if (!connected) {
          throw new Error('Kon niet verbinden met de server');
        }
      }
      
      // Stuur een bericht naar de server om het commando te verwerken
      return sendMessage('process_command', { text });
    } catch (error) {
      console.error('Fout bij verwerken commando:', error);
      return false;
    }
  };
  
  // Functie om de verbinding te verbreken
  const disconnect = () => {
    try {
      // Stop met luisteren
      if (isListening) {
        stopListening();
      }
      
      // Sluit de WebSocket verbinding
      if (socket) {
        socket.close();
      }
      
      // Sluit de AudioContext
      if (audioContext) {
        audioContext.close();
      }
      
      isConnected = false;
      isListening = false;
      return true;
    } catch (error) {
      console.error('Fout bij verbreken verbinding:', error);
      return false;
    }
  };
  
  // Return de publieke API
  return {
    connect,
    disconnect,
    startListening,
    stopListening,
    processCommand,
    setCallbacks,
    isConnected: () => isConnected,
    isListening: () => isListening
  };
};
