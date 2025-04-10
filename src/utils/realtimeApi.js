// OpenAI Realtime API implementatie met WebRTC

// Configuratie voor de Realtime API
const REALTIME_API_URL = 'https://api.openai.com/v1';
const REALTIME_MODEL = 'gpt-4o-realtime-preview-2024-12-17';

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
    console.log('Ephemeral token opgehaald');
    
    // Maak een nieuwe RTCPeerConnection
    const peerConnection = new RTCPeerConnection();
    
    // Maak een data channel voor het verzenden en ontvangen van berichten
    const dataChannel = peerConnection.createDataChannel('oai-events');
    
    // Configureer de data channel
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
    
    // Ontvang berichten van de server
    dataChannel.onmessage = (event) => {
      try {
        const message = JSON.parse(event.data);
        console.log('Bericht ontvangen:', message);
        
        // Verwerk verschillende berichttypes
        switch (message.type) {
          case 'transcription':
            if (options.onTranscription) options.onTranscription(message.text);
            break;
          case 'response.partial':
            if (options.onPartialResponse) options.onPartialResponse(message.text);
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
    console.log(`Versturen van SDP naar ${REALTIME_API_URL}/realtime?model=${options.model || REALTIME_MODEL}`);
    console.log('SDP:', offer.sdp.substring(0, 100) + '...');
    
    const response = await fetch(`${REALTIME_API_URL}/realtime?model=${options.model || REALTIME_MODEL}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/sdp',
        'Authorization': `Bearer ${token}`,
        'OpenAI-Beta': 'realtime=v1'
      },
      body: offer.sdp
    });
    
    if (!response.ok) {
      // Probeer de foutmelding te lezen als JSON
      let errorMessage = `OpenAI API antwoordde met ${response.status}`;
      try {
        const errorData = await response.json();
        errorMessage += `: ${JSON.stringify(errorData)}`;
      } catch (e) {
        // Als het geen JSON is, probeer het als tekst te lezen
        try {
          const errorText = await response.text();
          if (errorText) {
            errorMessage += `: ${errorText}`;
          }
        } catch (e2) {
          // Negeer deze fout
        }
      }
      throw new Error(errorMessage);
    }
    
    // Haal de SDP uit de response als tekst
    const sdpText = await response.text();
    
    // Stel het antwoord in als remote description
    await peerConnection.setRemoteDescription({
      type: 'answer',
      sdp: sdpText
    });
    
    console.log('WebRTC verbinding opgezet');
    
    // Maak een audio element voor het afspelen van audio
    const audioElement = document.createElement('audio');
    audioElement.autoplay = true;
    
    // Voeg event listeners toe voor audio tracks
    peerConnection.ontrack = (event) => {
      console.log('Audio track ontvangen');
      audioElement.srcObject = event.streams[0];
      if (options.onTrack) options.onTrack(event);
    };
    
    // Functie om een audio stream toe te voegen aan de verbinding
    const addAudioStream = async (stream) => {
      try {
        console.log('Audio stream toevoegen aan verbinding');
        stream.getTracks().forEach(track => {
          peerConnection.addTrack(track, stream);
        });
      } catch (error) {
        console.error('Fout bij toevoegen audio stream:', error);
        if (options.onError) options.onError(error);
      }
    };
    
    // Functie om een bericht te verzenden naar de server
    const sendMessage = (message) => {
      try {
        if (dataChannel.readyState === 'open') {
          console.log('Bericht verzenden:', message);
          dataChannel.send(JSON.stringify(message));
          return true;
        } else {
          console.warn('Data channel niet open, bericht niet verzonden');
          return false;
        }
      } catch (error) {
        console.error('Fout bij verzenden bericht:', error);
        if (options.onError) options.onError(error);
        return false;
      }
    };
    
    // Functie om de verbinding te sluiten
    const close = () => {
      try {
        console.log('Verbinding sluiten');
        if (dataChannel.readyState === 'open') {
          dataChannel.close();
        }
        peerConnection.close();
        if (options.onClose) options.onClose();
      } catch (error) {
        console.error('Fout bij sluiten verbinding:', error);
        if (options.onError) options.onError(error);
      }
    };
    
    // Geef de sessie interface terug
    return {
      peerConnection,
      dataChannel,
      audioElement,
      addAudioStream,
      sendMessage,
      close
    };
  } catch (error) {
    console.error('Fout bij opzetten Realtime sessie:', error);
    throw error; // Gooi de fout door in plaats van terug te vallen op een mock
  }
};
