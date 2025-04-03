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
    const response = await fetch(serverUrl);
    if (!response.ok) {
      throw new Error(`Server antwoordde met ${response.status}: ${response.statusText}`);
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
  // Altijd de mock implementatie gebruiken omdat de echte API nog niet beschikbaar is
  console.log('Gebruik mock implementatie omdat de echte API nog niet beschikbaar is');
  return setupMockRealtimeSession(options);
};

// Mock implementatie voor ontwikkeling en testen
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
