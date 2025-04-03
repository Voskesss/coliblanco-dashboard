import React, { useState, useEffect, useRef } from 'react';
import styled from '@emotion/styled';
import { motion, AnimatePresence } from 'framer-motion';
import { FaMicrophone, FaStop, FaVolumeUp, FaPaperPlane, FaKeyboard, FaSpinner, FaVolumeMute, FaMicrophoneAlt } from 'react-icons/fa';
import { setupChainedVoiceInterface } from '../../utils/chainedVoiceApi';

const VoiceContainer = styled.div`
  position: absolute;
  bottom: 2rem;
  right: 2rem;
  display: flex;
  flex-direction: column;
  align-items: flex-end;
`;

const MicButton = styled(motion.button)`
  width: 50px;
  height: 50px;
  border-radius: 50%;
  background-color: ${props => props.isListening ? '#FF9800' : 'rgba(255, 255, 255, 0.7)'};
  border: none;
  display: flex;
  justify-content: center;
  align-items: center;
  cursor: pointer;
  box-shadow: 0 4px 10px rgba(0, 0, 0, 0.1);
  color: ${props => props.isListening ? 'white' : '#333'};
  font-size: 1.2rem;
  transition: background-color 0.3s ease;
  position: relative;
  
  &:hover {
    background-color: ${props => props.isListening ? '#F57C00' : 'rgba(255, 255, 255, 0.9)'};
  }
  
  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
`;

const FeedbackText = styled(motion.div)`
  background-color: rgba(255, 255, 255, 0.9);
  padding: 0.8rem 1.2rem;
  border-radius: 8px;
  margin-bottom: 1rem;
  box-shadow: 0 4px 10px rgba(0, 0, 0, 0.1);
  max-width: 300px;
  font-size: 0.9rem;
  line-height: 1.4;
  
  .spinner {
    display: inline-block;
    animation: spin 1s linear infinite;
    margin-right: 8px;
    
    @keyframes spin {
      0% { transform: rotate(0deg); }
      100% { transform: rotate(360deg); }
    }
  }
`;

const StatusIndicator = styled.div`
  position: absolute;
  top: -5px;
  right: -5px;
  width: 12px;
  height: 12px;
  border-radius: 50%;
  background-color: ${props => {
    if (props.isProcessing) return '#2196F3'; // blauw
    if (props.isListening) return '#4CAF50'; // groen
    if (props.isSpeaking) return '#F44336'; // rood
    return 'transparent';
  }};
  border: 2px solid white;
`;

const StatusText = styled.div`
  position: absolute;
  top: -20px;
  right: 0;
  font-size: 0.7rem;
  background-color: rgba(0, 0, 0, 0.7);
  color: white;
  padding: 2px 6px;
  border-radius: 4px;
  white-space: nowrap;
`;

const TextInputContainer = styled(motion.div)`
  display: flex;
  margin-bottom: 1rem;
  width: 300px;
`;

const Input = styled.input`
  flex: 1;
  padding: 0.8rem;
  border-radius: 25px 0 0 25px;
  border: none;
  box-shadow: 0 4px 10px rgba(0, 0, 0, 0.1);
  font-size: 0.9rem;
  outline: none;
`;

const SendButton = styled(motion.button)`
  width: 40px;
  height: 40px;
  border-radius: 0 25px 25px 0;
  border: none;
  background-color: #FF9800;
  color: white;
  display: flex;
  justify-content: center;
  align-items: center;
  cursor: pointer;
`;

const TextButton = styled(motion.button)`
  width: 40px;
  height: 40px;
  border-radius: 50%;
  background-color: rgba(255, 255, 255, 0.7);
  border: none;
  display: flex;
  justify-content: center;
  align-items: center;
  cursor: pointer;
  box-shadow: 0 4px 10px rgba(0, 0, 0, 0.1);
  color: #333;
  font-size: 1rem;
  margin-right: 0.5rem;
`;

const ButtonsContainer = styled.div`
  display: flex;
  align-items: center;
`;

const DemoButton = styled(motion.button)`
  background-color: rgba(255, 255, 255, 0.7);
  border: none;
  display: flex;
  justify-content: center;
  align-items: center;
  cursor: pointer;
  box-shadow: 0 4px 10px rgba(0, 0, 0, 0.1);
  color: #333;
  font-size: 0.9rem;
  transition: background-color 0.3s ease;
  padding: 0.5rem 1rem;
  border-radius: 25px;
  margin-left: 0.5rem;
  
  &:hover {
    background-color: rgba(255, 255, 255, 0.9);
  }
  
  &:focus {
    outline: none;
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

const VolumeButton = styled(motion.button)`
  background: none;
  border: none;
  cursor: pointer;
  color: #333;
  font-size: 0.9rem;
  display: flex;
  align-items: center;
  padding: 0.2rem 0.4rem;
  
  &:hover {
    color: #FF9800;
  }
`;

const VolumeSlider = styled.input`
  width: 60px;
  margin: 0 0.5rem;
`;

const StyledAiResponseContainer = styled.div`
  font-size: 1.2rem;
  line-height: 1.5;
  text-align: center;
  margin: 0 auto;
  max-width: 80%;
  min-height: 60px;
  display: flex;
  align-items: center;
  justify-content: center;
`;

const RealtimeVoiceInterface = ({ onCommand }) => {
  const [status, setStatus] = useState('disconnected'); // disconnected, connecting, connected, error
  const [isListening, setIsListening] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [feedback, setFeedback] = useState('');
  const [transcript, setTranscript] = useState('');
  const [showTextInput, setShowTextInput] = useState(false);
  const [inputText, setInputText] = useState('');
  const [volume, setVolume] = useState(80);
  const [isMuted, setIsMuted] = useState(false);
  const [debugInfo, setDebugInfo] = useState('');
  const [isInitializing, setIsInitializing] = useState(false);
  const [isError, setIsError] = useState(false);
  const [aiResponse, setAiResponse] = useState('');
  
  const sessionRef = useRef(null);
  const inputRef = useRef(null);
  const audioRef = useRef(null);
  
  // Initialiseer de sessie
  const initializeSession = async () => {
    try {
      setIsInitializing(true);
      setDebugInfo('Sessie initialiseren...');
      
      // Gebruik de chained voice interface in plaats van de realtime API
      const session = setupChainedVoiceInterface({
        onSpeechStart: () => {
          console.log('Spraak gedetecteerd');
          setIsListening(true);
          // Laat de AI-tekst staan, reset deze niet
        },
        onSpeechEnd: () => {
          console.log('Spraak gestopt');
          setIsListening(false);
        },
        onTranscriptComplete: (fullTranscript) => {
          console.log('Volledige transcriptie ontvangen:', fullTranscript);
          setTranscript(fullTranscript);
          // Alleen de gebruikerstekst tonen in de debug-informatie
          setDebugInfo(prev => prev + '\nGebruiker: ' + fullTranscript);
        },
        onTextDelta: (delta) => {
          // Alleen de AI-tekst in het midden tonen
          setAiResponse(prev => prev + delta);
        },
        onResponseDone: (response) => {
          console.log('Antwoord voltooid:', response);
          setIsProcessing(false);
          
          // Verwerk het commando als er een is
          if (onCommand && response.output && response.output[0]?.content) {
            const text = response.output[0].content[0]?.text || '';
            onCommand(text);
          }
        },
        onError: (error) => {
          console.error('Fout in voice interface:', error);
          setDebugInfo(prev => prev + '\nFout: ' + error.message);
          setIsProcessing(false);
          setIsListening(false);
        }
      });
      
      // Sla de sessie op in de ref
      sessionRef.current = session;
      
      setIsInitializing(false);
      setDebugInfo(prev => prev + '\nSessie succesvol geïnitialiseerd');
    } catch (error) {
      console.error('Fout bij initialiseren sessie:', error);
      setDebugInfo(prev => prev + '\nFout bij initialiseren sessie: ' + error.message);
      setIsInitializing(false);
      setIsError(true);
    }
  };
  
  // Initialiseer de sessie wanneer de component wordt gemount
  useEffect(() => {
    initializeSession();
    
    // Cleanup functie
    return () => {
      if (sessionRef.current) {
        sessionRef.current.endSession();
        sessionRef.current = null;
      }
    };
  }, [onCommand]);
  
  // Update het volume wanneer het verandert
  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.volume = volume / 100;
    }
  }, [volume]);
  
  // Update muted status wanneer het verandert
  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.muted = isMuted;
    }
  }, [isMuted]);
  
  // Focus op het tekstinvoerveld wanneer het wordt weergegeven
  useEffect(() => {
    if (showTextInput && inputRef.current) {
      inputRef.current.focus();
    }
  }, [showTextInput]);
  
  // Functie om de microfoon te togglen
  const handleToggleMicrophone = async () => {
    try {
      if (!sessionRef.current) {
        setDebugInfo('Geen actieve sessie, initialiseren...');
        await initializeSession();
      }
      
      if (isListening) {
        // Stop met luisteren
        setIsProcessing(true);
        // Laat de AI-tekst staan, reset deze niet
        await sessionRef.current.stopListening();
        // De rest wordt afgehandeld door de callbacks
      } else {
        // Start met luisteren
        setDebugInfo(prev => prev + '\nStart luisteren...');
        await sessionRef.current.startListening();
      }
    } catch (error) {
      console.error('Fout bij togglen microfoon:', error);
      setDebugInfo(prev => prev + '\nFout bij togglen microfoon: ' + error.message);
      setIsError(true);
    }
  };
  
  // Functie om tekst te versturen
  const handleSendText = async () => {
    if (!inputText.trim() || !sessionRef.current || isProcessing) return;
    
    setIsProcessing(true);
    // Laat de AI-tekst staan, reset deze niet
    setDebugInfo(prev => prev + '\nGebruiker (tekst): ' + inputText);
    
    // Verstuur het bericht naar de voice API
    sessionRef.current.sendMessage(inputText);
    
    // Reset de input
    setInputText('');
  };
  
  // Functie om Enter toets af te handelen
  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !isProcessing) {
      handleSendText();
    }
  };
  
  // Toggle tussen tekst en spraak input
  const toggleTextInput = () => {
    setShowTextInput(!showTextInput);
    if (!showTextInput) {
      setTimeout(() => {
        if (inputRef.current) {
          inputRef.current.focus();
        }
      }, 100);
    }
  };
  
  // Toggle mute status
  const toggleMute = () => {
    setIsMuted(!isMuted);
  };
  
  // Verander volume
  const handleVolumeChange = (e) => {
    setVolume(parseInt(e.target.value, 10));
  };
  
  // Demo functie om een vooraf gedefinieerde taak te tonen
  const showDemoTask = () => {
    if (!sessionRef.current || isProcessing || isListening || isSpeaking) return;
    
    // Lijst met demo vragen
    const demoVragen = [
      "Wat staat er vandaag op de agenda?",
      "Stuur een mail naar het team",
      "Wat is de status van het project?",
      "Maak een samenvatting van het laatste rapport",
      "Plan een meeting voor volgende week"
    ];
    
    // Kies een willekeurige vraag
    const randomIndex = Math.floor(Math.random() * demoVragen.length);
    const randomVraag = demoVragen[randomIndex];
    
    // Vul de vraag in het inputveld
    setInputText(randomVraag);
    
    // Verstuur de vraag na een korte vertraging
    setTimeout(() => {
      handleSendText();
    }, 500);
  };
  
  // Helper functie om de juiste status tekst te tonen
  const getStatusMessage = () => {
    if (isProcessing) return 'Verwerken...';
    if (isSpeaking) return 'Spreekt...';
    if (isListening) return 'Luistert...';
    return '';
  };
  
  // Render spinner component
  const renderSpinner = () => (
    <span className="spinner">
      <FaSpinner />
    </span>
  );
  
  // Render microfoonknop
  const renderMicrophoneButton = () => {
    // Bepaal de juiste icon en kleur
    const Icon = isListening ? FaStop : FaMicrophone;
    const color = isListening ? '#f44336' : '#4CAF50';
    
    return (
      <MicButton 
        onClick={handleToggleMicrophone}
        disabled={isProcessing || isInitializing}
        isListening={isListening}
        whileTap={{ scale: 0.9 }}
      >
        {isProcessing ? renderSpinner() : <Icon />}
        <StatusIndicator 
          isListening={isListening} 
          isProcessing={isProcessing} 
          isSpeaking={isSpeaking} 
        />
        {getStatusMessage() && <StatusText>{getStatusMessage()}</StatusText>}
      </MicButton>
    );
  };
  
  return (
    <VoiceContainer>
      <AnimatePresence>
        {(aiResponse || isProcessing) && (
          <FeedbackText
            initial={{ opacity: 0, y: 10, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.2 }}
          >
            {/* Alleen de AI response tonen in het midden */}
            <StyledAiResponseContainer>
              {aiResponse}
            </StyledAiResponseContainer>
            
            {/* Debug informatie tonen als showDebug aan staat */}
            {false && debugInfo && (
              <div style={{ marginTop: '10px', fontSize: '0.8rem', color: '#666', borderTop: '1px solid #ddd', paddingTop: '5px' }}>
                <strong>Debug:</strong><br />
                {debugInfo.split('\n').map((line, index) => (
                  <React.Fragment key={`debug-${index}`}>
                    {line}
                    {index < debugInfo.split('\n').length - 1 && <br />}
                  </React.Fragment>
                ))}
              </div>
            )}
          </FeedbackText>
        )}
      </AnimatePresence>
      
      <AnimatePresence>
        {showTextInput && (
          <TextInputContainer
            initial={{ opacity: 0, y: 10, width: 0 }}
            animate={{ opacity: 1, y: 0, width: 300 }}
            exit={{ opacity: 0, y: 10, width: 0 }}
            transition={{ duration: 0.3 }}
          >
            <Input 
              ref={inputRef}
              type="text" 
              placeholder="Typ je bericht hier..."
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              onKeyPress={handleKeyPress}
              disabled={isInitializing || isError || isProcessing}
            />
            <SendButton onClick={handleSendText} whileTap={{ scale: 0.9 }}>
              <FaPaperPlane />
            </SendButton>
          </TextInputContainer>
        )}
      </AnimatePresence>
      
      <ButtonsContainer>
        <TextButton 
          onClick={toggleTextInput}
          whileTap={{ scale: 0.9 }}
        >
          <FaKeyboard />
        </TextButton>
        
        {renderMicrophoneButton()}
        
        <DemoButton 
          onClick={showDemoTask}
          disabled={status !== 'connected' || isProcessing || isListening || isSpeaking}
          whileTap={{ scale: 0.9 }}
        >
          Demo Vraag
        </DemoButton>
      </ButtonsContainer>
      
      {/* Audio controls */}
      <AudioControls
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5 }}
      >
        <VolumeButton onClick={toggleMute} whileTap={{ scale: 0.9 }}>
          {isMuted ? <FaVolumeMute /> : <FaVolumeUp />}
        </VolumeButton>
        <VolumeSlider 
          type="range" 
          min="0" 
          max="100" 
          value={volume} 
          onChange={handleVolumeChange} 
          disabled={isMuted}
        />
      </AudioControls>
    </VoiceContainer>
  );
};

export default RealtimeVoiceInterface;
