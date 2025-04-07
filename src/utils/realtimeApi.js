// OpenAI Realtime API implementatie met WebRTC

// Configuratie voor de Realtime API
const REALTIME_API_URL = 'https://api.openai.com/v1/realtime';
const REALTIME_MODEL = 'gpt-4o-realtime-preview';

// Functie om een ephemeral token op te halen van de server
async function getEphemeralToken() {
  try {
    // Gebruik de lokale server tijdens ontwikkeling
    const serverUrl = import.meta.env.DEV 
      ? 'http://localhost:3001/session' 
      : '/api/session'; // In productie zou dit een relatief pad kunnen zijn of een Azure functie URL
    
    console.log('Ephemeral token ophalen van:', serverUrl);
    
    // Controleer eerst of de server bereikbaar is
    try {
      const checkResponse = await fetch(serverUrl, { method: 'HEAD' });
      if (!checkResponse.ok) {
        throw new Error(`Server niet bereikbaar: ${checkResponse.status}`);
      }
    } catch (error) {
      throw new Error(`Server niet bereikbaar. Zorg ervoor dat de realtime-token.js server draait op poort 3001. Fout: ${error.message}`);
    }
    
    const response = await fetch(serverUrl);
    if (!response.ok) {
      throw new Error(`Server antwoordde met ${response.status}: ${response.statusText}`);
    }
    
    // Controleer of de response JSON is
    const contentType = response.headers.get('content-type');
    if (!contentType || !contentType.includes('application/json')) {
      const text = await response.text();
      throw new Error(`Ongeldige response van server: Verwachtte JSON maar kreeg ${contentType}. Response: ${text.substring(0, 100)}...`);
    }
    
    const data = await response.json();
    console.log('Ephemeral token ontvangen:', data);
    return data.client_secret.value;
  } catch (error) {
    console.error('Fout bij ophalen ephemeral token:', error);
    throw error;
  }
}

// Functie om een WebRTC sessie op te zetten met de OpenAI Realtime API
export const setupRealtimeSession = async (options = {}) => {
  try {
    console.log('Realtime sessie opzetten met WebRTC...');
    
    // Haal een ephemeral token op van de server
    const token = await getEphemeralToken();
    console.log('Ephemeral token ontvangen, verbinding maken met Realtime API...');
    
    // Maak een WebRTC verbinding met de OpenAI Realtime API
    const peerConnection = new RTCPeerConnection();
    
    // Maak een data channel voor het verzenden van berichten
    const dataChannel = peerConnection.createDataChannel('events');
    dataChannel.binaryType = 'arraybuffer';
    
    // Stel de data channel event handlers in
    dataChannel.onopen = () => {
      console.log('Data channel geopend');
      if (options.onOpen) options.onOpen();
    };
    
    dataChannel.onclose = () => {
      console.log('Data channel gesloten');
      if (options.onClose) options.onClose();
    };
    
    dataChannel.onerror = (error) => {
      console.error('Data channel fout:', error);
      if (options.onError) options.onError(error);
    };
    
    // Verwerk berichten van de server
    dataChannel.onmessage = (event) => {
      try {
        const message = JSON.parse(event.data);
        console.log('Bericht ontvangen:', message);
        
        // Verwerk verschillende soorten berichten
        switch (message.type) {
          case 'transcript.delta':
            if (options.onTranscriptDelta) options.onTranscriptDelta(message.delta.text);
            break;
          case 'transcript.complete':
            if (options.onTranscriptComplete) options.onTranscriptComplete(message.transcript);
            break;
          case 'response.delta':
            if (options.onTextDelta) options.onTextDelta(message.delta.text);
            break;
          case 'response.audio.delta':
            if (options.onAudioDelta) options.onAudioDelta(message.delta.audio);
            break;
          case 'response.done':
            if (options.onResponseDone) options.onResponseDone(message);
            break;
          case 'speech.started':
            if (options.onSpeechStart) options.onSpeechStart();
            break;
          case 'speech.ended':
            if (options.onSpeechEnd) options.onSpeechEnd();
            break;
          default:
            console.log('Onbekend berichttype:', message.type);
        }
      } catch (error) {
        console.error('Fout bij verwerken bericht:', error);
      }
    };
    
    // Maak een offer en stuur deze naar de server
    const offer = await peerConnection.createOffer();
    await peerConnection.setLocalDescription(offer);
    
    // Stuur de offer naar de OpenAI Realtime API
    const response = await fetch(`${REALTIME_API_URL}/webrtc`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({
        model: options.model || REALTIME_MODEL,
        voice: options.voice || 'alloy',
        sdp: offer.sdp,
        type: offer.type
      })
    });
    
    if (!response.ok) {
      throw new Error(`OpenAI API antwoordde met ${response.status}: ${response.statusText}`);
    }
    
    const data = await response.json();
    
    // Stel het antwoord in als remote description
    await peerConnection.setRemoteDescription({
      type: 'answer',
      sdp: data.sdp
    });
    
    console.log('WebRTC verbinding opgezet');
    
    // Maak een audio element voor het afspelen van audio
    const audioElement = document.createElement('audio');
    audioElement.autoplay = true;
    
    // Voeg audio tracks toe aan de audio element
    peerConnection.ontrack = (event) => {
      console.log('Audio track ontvangen');
      audioElement.srcObject = new MediaStream([event.track]);
    };
    
    // Functie om te beginnen met luisteren
    const startListening = async () => {
      try {
        console.log('Start luisteren...');
        
        // Vraag toegang tot de microfoon
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        
        // Voeg de audio tracks toe aan de peer connection
        stream.getAudioTracks().forEach(track => {
          peerConnection.addTrack(track, stream);
        });
        
        console.log('Microfoon toegevoegd aan WebRTC verbinding');
        
        // Stuur een bericht naar de server om te beginnen met luisteren
        dataChannel.send(JSON.stringify({
          type: 'microphone.start'
        }));
        
        return stream;
      } catch (error) {
        console.error('Fout bij starten luisteren:', error);
        throw error;
      }
    };
    
    // Functie om te stoppen met luisteren
    const stopListening = (stream) => {
      try {
        console.log('Stop luisteren...');
        
        // Stop alle tracks in de stream
        if (stream) {
          stream.getTracks().forEach(track => track.stop());
        }
        
        // Stuur een bericht naar de server om te stoppen met luisteren
        dataChannel.send(JSON.stringify({
          type: 'microphone.stop'
        }));
        
        console.log('Microfoon gestopt');
      } catch (error) {
        console.error('Fout bij stoppen luisteren:', error);
        throw error;
      }
    };
    
    // Functie om een tekstbericht te versturen
    const sendMessage = (text) => {
      try {
        console.log('Tekstbericht versturen:', text);
        
        // Stuur een bericht naar de server
        dataChannel.send(JSON.stringify({
          type: 'conversation.item.create',
          item: {
            role: 'user',
            content: [
              {
                type: 'text',
                text: text
              }
            ]
          }
        }));
        
        console.log('Tekstbericht verstuurd');
      } catch (error) {
        console.error('Fout bij versturen tekstbericht:', error);
        throw error;
      }
    };
    
    // Functie om de verbinding te sluiten
    const close = () => {
      try {
        console.log('Verbinding sluiten...');
        
        // Sluit de data channel
        dataChannel.close();
        
        // Sluit de peer connection
        peerConnection.close();
        
        console.log('Verbinding gesloten');
      } catch (error) {
        console.error('Fout bij sluiten verbinding:', error);
      }
    };
    
    // Geef de sessie terug
    return {
      startListening,
      stopListening,
      sendMessage,
      close
    };
  } catch (error) {
    console.error('Fout bij opzetten Realtime sessie:', error);
    // Gooi de fout door in plaats van terug te vallen op de mock implementatie
    throw new Error(`Fout bij opzetten Realtime sessie: ${error.message}`);
  }
};

// Mock implementatie voor ontwikkeling en testen
// Deze functie wordt niet meer automatisch gebruikt als fallback
const setupMockRealtimeSession = (options = {}) => {
  console.log('Mock Realtime sessie opzetten');
  
  // Maak een audio element voor het afspelen van audio
  const audioElement = document.createElement('audio');
  audioElement.autoplay = true;
  audioElement.controls = true; // Voeg controls toe voor debugging
  audioElement.style.position = 'fixed';
  audioElement.style.bottom = '10px';
  audioElement.style.left = '10px';
  audioElement.style.zIndex = '1000';
  audioElement.style.width = '300px';
  
  // Simuleer een verbinding
  setTimeout(() => {
    if (options.onOpen) options.onOpen();
  }, 1000);
  
  // Simuleer functies voor de mock sessie
  const startListening = () => {
    console.log('Mock: Start luisteren...');
    if (options.onSpeechStart) options.onSpeechStart();
    
    // Simuleer een transcript na een korte vertraging
    setTimeout(() => {
      if (options.onTranscriptDelta) {
        const mockTranscript = 'Hallo, dit is een test van de mock realtime interface.';
        for (let i = 0; i < mockTranscript.length; i++) {
          setTimeout(() => {
            options.onTranscriptDelta(mockTranscript[i]);
          }, i * 50);
        }
      }
    }, 2000);
  };
  
  const stopListening = () => {
    console.log('Mock: Stop luisteren...');
    if (options.onSpeechEnd) options.onSpeechEnd();
    
    // Simuleer een antwoord na een korte vertraging
    setTimeout(() => {
      if (options.onTextDelta) {
        const mockResponse = 'Hallo! Ik ben de mock assistent. Hoe kan ik je vandaag helpen?';
        for (let i = 0; i < mockResponse.length; i++) {
          setTimeout(() => {
            options.onTextDelta(mockResponse[i]);
          }, i * 50);
        }
      }
      
      // Simuleer spraak door een audio bestand af te spelen
      playMockAudio();
      
      // Simuleer het einde van de response
      setTimeout(() => {
        if (options.onResponseDone) {
          options.onResponseDone({
            output: [
              {
                content: [
                  {
                    type: 'text',
                    text: 'Hallo! Ik ben de mock assistent. Hoe kan ik je vandaag helpen?'
                  }
                ]
              }
            ]
          });
        }
      }, 5000);
    }, 1000);
  };
  
  const sendMessage = (text) => {
    console.log('Mock: Bericht versturen:', text);
    if (options.onSpeechEnd) options.onSpeechEnd();
    
    // Simuleer een antwoord na een korte vertraging
    setTimeout(() => {
      if (options.onTextDelta) {
        const mockResponse = `Je hebt gezegd: "${text}". Dit is een geautomatiseerd antwoord van de mock interface.`;
        for (let i = 0; i < mockResponse.length; i++) {
          setTimeout(() => {
            options.onTextDelta(mockResponse[i]);
          }, i * 30);
        }
      }
      
      // Simuleer spraak door een audio bestand af te spelen
      playMockAudio();
      
      // Simuleer het einde van de response
      setTimeout(() => {
        if (options.onResponseDone) {
          options.onResponseDone({
            output: [
              {
                content: [
                  {
                    type: 'text',
                    text: `Je hebt gezegd: "${text}". Dit is een geautomatiseerd antwoord van de mock interface.`
                  }
                ]
              }
            ]
          });
        }
      }, 4000);
    }, 1000);
  };
  
  // Functie om mock audio af te spelen
  const playMockAudio = () => {
    try {
      // Kies een willekeurig TTS audio bestand
      const demoVoices = [
        '/audio/demo1.mp3', // hello
        '/audio/demo2.mp3', // welcome
        '/audio/demo3.mp3', // thanks
        '/audio/demo4.mp3'  // help
      ];
      
      const randomIndex = Math.floor(Math.random() * demoVoices.length);
      const voiceUrl = demoVoices[randomIndex];
      
      console.log('Afspelen van demo stem:', voiceUrl);
      
      // Reset het audio element eerst
      audioElement.pause();
      audioElement.currentTime = 0;
      
      // Wacht even voordat we de nieuwe bron instellen
      setTimeout(() => {
        // Gebruik een HTMLAudioElement voor het afspelen van het audio bestand
        audioElement.src = voiceUrl;
        audioElement.loop = false;
        
        // Speel de audio af
        const playPromise = audioElement.play();
        if (playPromise !== undefined) {
          playPromise
            .then(() => {
              console.log('Audio afspelen gestart');
              
              // Simuleer een audio track event
              if (options.onTrack) {
                options.onTrack({
                  streams: [{ id: 'mock-stream-' + Date.now() }]
                });
              }
            })
            .catch(e => {
              console.error('Fout bij afspelen audio:', e);
              
              // Probeer opnieuw met een user interaction
              const unlockButton = document.createElement('button');
              unlockButton.textContent = 'Klik hier om audio te activeren';
              unlockButton.style.position = 'fixed';
              unlockButton.style.top = '50%';
              unlockButton.style.left = '50%';
              unlockButton.style.transform = 'translate(-50%, -50%)';
              unlockButton.style.padding = '10px 20px';
              unlockButton.style.backgroundColor = '#FF9800';
              unlockButton.style.color = 'white';
              unlockButton.style.border = 'none';
              unlockButton.style.borderRadius = '5px';
              unlockButton.style.zIndex = '9999';
              
              unlockButton.onclick = function() {
                audioElement.play().catch(err => console.error('Nog steeds fout bij afspelen:', err));
                document.body.removeChild(unlockButton);
              };
              
              document.body.appendChild(unlockButton);
            });
        }
      }, 200);
    } catch (error) {
      console.error('Fout bij afspelen mock audio:', error);
    }
  };
  
  const endSession = () => {
    console.log('Mock: Sessie beëindigd');
    if (options.onClose) options.onClose();
    
    // Stop audio als die speelt
    if (audioElement) {
      audioElement.pause();
      audioElement.src = '';
      if (audioElement.parentNode) {
        audioElement.parentNode.removeChild(audioElement);
      }
    }
  };
  
  // Voeg het audio element toe aan de DOM
  document.body.appendChild(audioElement);
  
  return {
    peerConnection: null,
    dataChannel: null,
    audioElement,
    microphoneStream: null,
    sendMessage,
    startListening,
    stopListening,
    endSession
  };
};
