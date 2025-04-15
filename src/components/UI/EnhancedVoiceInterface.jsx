import React, { useState, useEffect, useRef } from 'react';
import styled from '@emotion/styled';
import { motion, AnimatePresence } from 'framer-motion';
import { FaMicrophone, FaStop, FaVolumeUp, FaVolumeMute, FaSpinner } from 'react-icons/fa';
import { BsSoundwave } from 'react-icons/bs';
import { setupRealtimeVoiceProcessing } from '../../utils/openai';

const VoiceContainer = styled.div`
  position: absolute;
  bottom: 2rem;
  right: 2rem;
  display: flex;
  flex-direction: column;
  align-items: flex-end;
`;

const MicButton = styled(motion.button)`
  width: 60px;
  height: 60px;
  border-radius: 50%;
  background-color: ${props => props.isListening ? '#FF9800' : 'rgba(255, 255, 255, 0.9)'};
  border: none;
  display: flex;
  justify-content: center;
  align-items: center;
  cursor: pointer;
  box-shadow: 0 4px 15px rgba(0, 0, 0, 0.2);
  color: ${props => props.isListening ? 'white' : '#333'};
  font-size: 1.8rem;
  transition: background-color 0.3s ease;
  position: relative;
  
  &:hover {
    background-color: ${props => props.isListening ? '#F57C00' : 'rgba(255, 255, 255, 1)'};
    transform: scale(1.05);
  }
  
  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
`;

const AudioControls = styled(motion.div)`
  position: absolute;
  bottom: -40px;
  right: 0;
  display: flex;
  align-items: center;
  background-color: rgba(255, 255, 255, 0.7);
  padding: 0.3rem 0.6rem;
  border-radius: 15px;
  box-shadow: 0 2px 5px rgba(0, 0, 0, 0.1);
`;

const FeedbackText = styled(motion.div)`
  background-color: rgba(255, 255, 255, 0.9);
  padding: 0.8rem 1.2rem;
  border-radius: 8px;
  margin-bottom: 1rem;
  box-shadow: 0 4px 10px rgba(0, 0, 0, 0.2);
  max-width: 300px;
  font-size: 0.9rem;
  line-height: 1.4;
  
  .spinner {
    display: inline-block;
    animation: spin 1s linear infinite;
    margin-right: 5px;
  }
  
  @keyframes spin {
    0% { transform: rotate(0deg); }
    100% { transform: rotate(360deg); }
  }
`;

const StatusIndicator = styled.div`
  position: absolute;
  bottom: -10px;
  left: 50%;
  transform: translateX(-50%);
  width: 80px;
  height: 20px;
  display: flex;
  justify-content: center;
  align-items: center;
  border-radius: 10px;
  background-color: ${props => 
    props.isListening ? '#4CAF50' : 
    props.isProcessing ? '#FF9800' : 
    props.isSpeaking ? '#2196F3' : 'transparent'
  };
  color: white;
  font-size: 10px;
  font-weight: bold;
  opacity: ${props => (props.isListening || props.isProcessing || props.isSpeaking) ? 1 : 0};
  transition: background-color 0.3s ease, opacity 0.3s ease;
`;

const AudioLevelIndicator = styled.div`
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%) scale(${props => 1 + Math.min(props.level / 100, 1.5)});
  width: 100%;
  height: 100%;
  border-radius: 50%;
  background-color: rgba(76, 175, 80, 0.2);
  opacity: ${props => props.isListening ? 0.7 : 0};
  pointer-events: none;
  transition: transform 0.1s ease, opacity 0.3s ease;
`;

const EnhancedVoiceInterface = ({ onCommand, orbStatus, processCommand }) => {
  const [isListening, setIsListening] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [response, setResponse] = useState('');
  const [audioUrl, setAudioUrl] = useState(null);
  const [audioLevel, setAudioLevel] = useState(0);
  const [feedback, setFeedback] = useState('');
  const [error, setError] = useState(null);
  
  const voiceProcessingRef = useRef(null);
  const silenceDetectionIntervalRef = useRef(null);
  const audioElementRef = useRef(null);
  const audioLevelIntervalRef = useRef(null);
  
  // Gebruik processCommand als onCommand niet is meegegeven
  const handleCommand = (command) => {
    if (onCommand) {
      onCommand(command);
    } else if (processCommand) {
      processCommand(command);
    }
  };
  
  // Update orbStatus als deze is meegegeven
  useEffect(() => {
    if (orbStatus && isListening) {
      // Als we aan het luisteren zijn, zet orbStatus op 'listening'
      if (typeof orbStatus === 'string') {
        // Als orbStatus een string is (oude versie)
        if (orbStatus !== 'listening') {
          // Doe niets, want we kunnen orbStatus niet updaten
        }
      } else if (typeof orbStatus === 'function') {
        // Als orbStatus een functie is (setter)
        orbStatus('listening');
      }
    }
  }, [orbStatus, isListening]);
  
  // Initialiseer de realtime spraakverwerking
  useEffect(() => {
    // Maak een nieuwe instantie van de spraakverwerking
    voiceProcessingRef.current = setupRealtimeVoiceProcessing();
    
    // Registreer callbacks
    if (voiceProcessingRef.current) {
      voiceProcessingRef.current.registerCallbacks({
        onConnect: () => {
          console.log('Verbonden met de server');
          setFeedback('Verbonden met de server');
          setTimeout(() => setFeedback(''), 2000);
        },
        
        onDisconnect: () => {
          console.log('Verbinding met de server verbroken');
          setFeedback('Verbinding verbroken');
          setIsListening(false);
          setIsProcessing(false);
          setIsSpeaking(false);
        },
        
        onListeningStart: () => {
          console.log('Luisteren gestart');
          setIsListening(true);
          setFeedback('Ik luister...');
          
          // Start stiltedetectie
          silenceDetectionIntervalRef.current = voiceProcessingRef.current.startSilenceDetection(10, 1500);
          
          // Start het monitoren van het geluidsniveau
          startAudioLevelMonitoring();
        },
        
        onListeningStop: () => {
          console.log('Luisteren gestopt');
          setIsListening(false);
          setIsProcessing(true);
          setFeedback('Verwerken...');
          
          // Stop stiltedetectie
          voiceProcessingRef.current.stopSilenceDetection(silenceDetectionIntervalRef.current);
          
          // Stop het monitoren van het geluidsniveau
          stopAudioLevelMonitoring();
        },
        
        onTranscription: (data) => {
          console.log('Transcriptie ontvangen:', data);
          setTranscript(data.text);
          setFeedback(`"${data.text}"`);
        },
        
        onLLMResponse: (data) => {
          console.log('LLM antwoord ontvangen:', data);
          setResponse(data.text);
          
          // Als het een interruptie is, update de UI anders
          if (data.is_interruption) {
            setFeedback(`Jij: "${transcript}"
AI: "${data.text}" (interruptie)`);
          } else {
            setFeedback(`Jij: "${transcript}"
AI: "${data.text}"`);
          }
          
          // Stuur het commando door naar de parent component
          handleCommand(data.text);
        },
        
        onTTSResponse: (data) => {
          console.log('TTS antwoord ontvangen:', data);
          setAudioUrl(data.fullUrl);
          playAudio(data.fullUrl, data.is_interruption);
        },
        
        onProcessingComplete: (data) => {
          console.log('Verwerking voltooid:', data);
          setIsProcessing(false);
          
          // Als er een fout is, toon deze
          if (data.status === 'error') {
            setError(data.error);
            setFeedback(`Fout: ${data.error}`);
            setTimeout(() => {
              setFeedback('');
              setError(null);
            }, 3000);
          }
        },
        
        onError: (error) => {
          console.error('Fout:', error);
          setError(error);
          setFeedback(`Fout: ${error.message || error}`);
          setIsListening(false);
          setIsProcessing(false);
          setIsSpeaking(false);
          
          setTimeout(() => {
            setFeedback('');
            setError(null);
          }, 3000);
        }
      });
      
      // Maak verbinding met de server
      voiceProcessingRef.current.connect();
    }
    
    // Cleanup functie
    return () => {
      if (voiceProcessingRef.current) {
        voiceProcessingRef.current.disconnect();
      }
      
      if (audioElementRef.current) {
        audioElementRef.current.pause();
        audioElementRef.current = null;
      }
      
      stopAudioLevelMonitoring();
    };
  }, [onCommand, processCommand]);
  
  // Functie om het geluidsniveau te monitoren
  const startAudioLevelMonitoring = () => {
    if (audioLevelIntervalRef.current) {
      clearInterval(audioLevelIntervalRef.current);
    }
    
    audioLevelIntervalRef.current = setInterval(() => {
      if (voiceProcessingRef.current) {
        const level = voiceProcessingRef.current.getAudioLevel();
        setAudioLevel(level);
      }
    }, 100);
  };
  
  // Functie om het monitoren van het geluidsniveau te stoppen
  const stopAudioLevelMonitoring = () => {
    if (audioLevelIntervalRef.current) {
      clearInterval(audioLevelIntervalRef.current);
      audioLevelIntervalRef.current = null;
    }
  };
  
  // Functie om audio af te spelen
  const playAudio = (url, isInterruption = false) => {
    // Maak een nieuw audio element
    const audio = new Audio(url);
    
    // Sla het audio element op in de ref
    if (audioElementRef.current) {
      audioElementRef.current.pause();
    }
    audioElementRef.current = audio;
    
    // Event handlers
    audio.onplay = () => {
      console.log('Audio afspelen gestart');
      setIsSpeaking(true);
    };
    
    audio.onended = () => {
      console.log('Audio afspelen voltooid');
      setIsSpeaking(false);
      
      // Wis de feedback na een tijdje
      setTimeout(() => {
        setFeedback('');
      }, 2000);
      
      // Als het geen interruptie was, begin automatisch weer met luisteren
      if (!isInterruption && voiceProcessingRef.current) {
        setTimeout(() => {
          voiceProcessingRef.current.startListening();
        }, 500);
      }
    };
    
    audio.onerror = (e) => {
      console.error('Fout bij afspelen audio:', e);
      setIsSpeaking(false);
      setError('Fout bij afspelen audio');
    };
    
    // Start het afspelen
    audio.play().catch(err => {
      console.error('Kon audio niet afspelen:', err);
      setIsSpeaking(false);
      setError('Kon audio niet afspelen');
    });
  };
  
  // Functie om handmatig audio af te spelen
  const handlePlayResponse = () => {
    if (audioUrl && !isSpeaking) {
      playAudio(audioUrl);
    }
  };
  
  // Functie om te beginnen of stoppen met luisteren
  const handleToggleListening = () => {
    if (!voiceProcessingRef.current) return;
    
    if (isListening) {
      // Stop met luisteren
      voiceProcessingRef.current.stopListening(true); // true = handmatig gestopt
    } else if (isProcessing) {
      // Als we aan het verwerken zijn, stuur een interruptie
      voiceProcessingRef.current.sendInterrupt();
    } else if (isSpeaking) {
      // Als we aan het spreken zijn, stop met spreken en stuur een interruptie
      if (audioElementRef.current) {
        audioElementRef.current.pause();
        setIsSpeaking(false);
      }
      voiceProcessingRef.current.sendInterrupt();
      
      // Begin direct met luisteren
      setTimeout(() => {
        voiceProcessingRef.current.startListening();
      }, 300);
    } else {
      // Begin met luisteren
      voiceProcessingRef.current.startListening();
    }
  };
  
  return (
    <VoiceContainer>
      <AnimatePresence>
        {feedback && (
          <FeedbackText
            initial={{ opacity: 0, y: 20, scale: 0.8 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.8 }}
            transition={{ duration: 0.2 }}
          >
            {isProcessing && (
              <span className="spinner">
                <FaSpinner />
              </span>
            )}
            {feedback.split('\n').map((line, index) => (
              <React.Fragment key={index}>
                {line}
                {index < feedback.split('\n').length - 1 && <br />}
              </React.Fragment>
            ))}
          </FeedbackText>
        )}
      </AnimatePresence>
      
      {audioUrl && !isListening && !isProcessing && (
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.8 }}
          style={{ marginBottom: '1rem' }}
        >
          <motion.button
            onClick={handlePlayResponse}
            whileTap={{ scale: 0.9 }}
            style={{
              width: '40px',
              height: '40px',
              borderRadius: '50%',
              backgroundColor: 'rgba(255, 255, 255, 0.9)',
              border: 'none',
              display: 'flex',
              justifyContent: 'center',
              alignItems: 'center',
              cursor: 'pointer',
              boxShadow: '0 4px 10px rgba(0, 0, 0, 0.1)',
              color: '#333',
              fontSize: '1rem'
            }}
            disabled={isSpeaking}
          >
            <FaVolumeUp />
          </motion.button>
        </motion.div>
      )}
      
      <MicButton 
        isListening={isListening}
        onClick={handleToggleListening}
        whileTap={{ scale: 0.9 }}
        disabled={false}
      >
        <AudioLevelIndicator 
          isListening={isListening} 
          level={audioLevel} 
        />
        {isListening ? <FaStop /> : <FaMicrophone />}
        
        <StatusIndicator 
          isListening={isListening}
          isProcessing={isProcessing}
          isSpeaking={isSpeaking}
        >
          {isListening ? 'Luisteren' : isProcessing ? 'Verwerken' : isSpeaking ? 'Spreken' : ''}
        </StatusIndicator>
      </MicButton>
    </VoiceContainer>
  );
};

export default EnhancedVoiceInterface;
