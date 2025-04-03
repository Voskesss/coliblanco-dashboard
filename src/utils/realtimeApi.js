// OpenAI Realtime API implementatie met WebRTC

// Configuratie voor de Realtime API
const REALTIME_API_URL = 'https://api.openai.com/v1/realtime';

// Functie om een WebRTC sessie op te zetten met de OpenAI Realtime API
export const setupRealtimeSession = async (apiKey, options = {}) => {
  if (!apiKey) {
    throw new Error('OpenAI API key is vereist voor de Realtime API');
  }

  try {
    // Stap 1: Maak een sessie aan bij de Realtime API
    const sessionResponse = await fetch(`${REALTIME_API_URL}/sessions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: options.model || 'gpt-4o-realtime-preview',
        voice: options.voice || 'alloy',
        modalities: options.modalities || ['audio', 'text'],
        turn_detection: {
          type: options.vadType || 'semantic_vad',
          eagerness: options.vadEagerness || 'medium',
        },
        instructions: options.instructions || 'Je bent een behulpzame assistent voor het Colibranco dashboard. Beantwoord vragen kort en bondig in het Nederlands.',
      }),
    });

    if (!sessionResponse.ok) {
      const errorData = await sessionResponse.json();
      throw new Error(`Fout bij het aanmaken van een Realtime sessie: ${errorData.error?.message || 'Onbekende fout'}`);
    }

    const sessionData = await sessionResponse.json();
    const { session_id, ice_servers, sdp_offer } = sessionData;

    // Stap 2: Maak een WebRTC verbinding
    const peerConnection = new RTCPeerConnection({
      iceServers: ice_servers,
    });

    // Stap 3: Stel event handlers in voor de verbinding
    const dataChannel = peerConnection.createDataChannel('events');
    let isConnected = false;
    
    // Functie om events te versturen naar de Realtime API
    const sendEvent = (event) => {
      if (isConnected && dataChannel.readyState === 'open') {
        dataChannel.send(JSON.stringify(event));
      } else {
        console.warn('DataChannel is nog niet klaar om berichten te versturen');
      }
    };

    // Event handlers voor de DataChannel
    dataChannel.onopen = () => {
      console.log('DataChannel is geopend');
      isConnected = true;
      
      // Stuur een update naar de sessie om eventuele extra opties in te stellen
      sendEvent({
        type: 'session.update',
        session: {
          instructions: options.instructions || 'Je bent een behulpzame assistent voor het Colibranco dashboard. Beantwoord vragen kort en bondig in het Nederlands.',
        }
      });
      
      // Roep de onOpen callback aan als die is meegegeven
      if (options.onOpen) {
        options.onOpen();
      }
    };

    dataChannel.onmessage = (event) => {
      try {
        const serverEvent = JSON.parse(event.data);
        
        // Verwerk verschillende soorten events van de server
        switch (serverEvent.type) {
          case 'session.created':
            console.log('Sessie is aangemaakt:', serverEvent);
            break;
          
          case 'session.updated':
            console.log('Sessie is bijgewerkt:', serverEvent);
            break;
          
          case 'input_audio_buffer.speech_started':
            if (options.onSpeechStart) {
              options.onSpeechStart();
            }
            break;
          
          case 'input_audio_buffer.speech_stopped':
            if (options.onSpeechEnd) {
              options.onSpeechEnd();
            }
            break;
          
          case 'response.text.delta':
            if (options.onTextDelta) {
              options.onTextDelta(serverEvent.delta);
            }
            break;
          
          case 'response.done':
            if (options.onResponseDone) {
              options.onResponseDone(serverEvent.response);
            }
            break;
          
          case 'error':
            console.error('Fout van de Realtime API:', serverEvent);
            if (options.onError) {
              options.onError(serverEvent);
            }
            break;
          
          default:
            // Stuur alle events door naar de algemene event handler als die is meegegeven
            if (options.onEvent) {
              options.onEvent(serverEvent);
            }
        }
      } catch (error) {
        console.error('Fout bij het verwerken van server event:', error);
      }
    };

    dataChannel.onerror = (error) => {
      console.error('DataChannel fout:', error);
      if (options.onError) {
        options.onError(error);
      }
    };

    dataChannel.onclose = () => {
      console.log('DataChannel is gesloten');
      isConnected = false;
      if (options.onClose) {
        options.onClose();
      }
    };

    // Stap 4: Stel de remote description in (het SDP aanbod van OpenAI)
    await peerConnection.setRemoteDescription({
      type: 'offer',
      sdp: sdp_offer,
    });

    // Stap 5: Maak een antwoord en stel de lokale description in
    const answer = await peerConnection.createAnswer();
    await peerConnection.setLocalDescription(answer);

    // Stap 6: Stuur het SDP antwoord terug naar de Realtime API
    const sdpResponse = await fetch(`${REALTIME_API_URL}/sessions/${session_id}/sdp_answer`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        sdp_answer: answer.sdp,
      }),
    });

    if (!sdpResponse.ok) {
      const errorData = await sdpResponse.json();
      throw new Error(`Fout bij het versturen van SDP antwoord: ${errorData.error?.message || 'Onbekende fout'}`);
    }

    // Stap 7: Stel audio in
    // Maak een audio element voor het afspelen van de audio van het model
    const audioElement = document.createElement('audio');
    audioElement.autoplay = true;
    
    // Voeg een track event handler toe om de audio stream van het model te ontvangen
    peerConnection.ontrack = (event) => {
      audioElement.srcObject = event.streams[0];
      if (options.onTrack) {
        options.onTrack(event);
      }
    };

    // Functie om microfoon toegang te vragen en toe te voegen aan de peer connection
    const startMicrophone = async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        stream.getTracks().forEach(track => {
          peerConnection.addTrack(track, stream);
        });
        return stream;
      } catch (error) {
        console.error('Fout bij het verkrijgen van microfoon toegang:', error);
        throw error;
      }
    };

    // Functie om een tekstbericht te sturen naar het model
    const sendTextMessage = (text) => {
      sendEvent({
        type: 'conversation.item.create',
        item: {
          type: 'message',
          role: 'user',
          content: [
            {
              type: 'input_text',
              text,
            }
          ]
        }
      });

      // Vraag het model om een reactie te genereren
      sendEvent({
        type: 'response.create'
      });
    };

    // Functie om de sessie te beëindigen
    const endSession = async () => {
      try {
        // Sluit de verbinding
        dataChannel.close();
        peerConnection.close();
        
        // Verwijder het audio element
        if (audioElement.parentNode) {
          audioElement.parentNode.removeChild(audioElement);
        }
        
        // Stuur een verzoek om de sessie te beëindigen
        await fetch(`${REALTIME_API_URL}/sessions/${session_id}`, {
          method: 'DELETE',
          headers: {
            'Authorization': `Bearer ${apiKey}`,
          },
        });
      } catch (error) {
        console.error('Fout bij het beëindigen van de sessie:', error);
      }
    };

    // Geef de sessie-informatie en functies terug
    return {
      sessionId: session_id,
      peerConnection,
      dataChannel,
      audioElement,
      sendEvent,
      sendTextMessage,
      startMicrophone,
      endSession,
    };
  } catch (error) {
    console.error('Fout bij het opzetten van de Realtime sessie:', error);
    throw error;
  }
};
