import React, { useState, useEffect, useRef } from 'react';
import styled from '@emotion/styled';
import { motion, AnimatePresence } from 'framer-motion';
import { FaMicrophone, FaStop, FaVolumeUp } from 'react-icons/fa';
import { setupRealtimeSession } from '../../utils/realtimeApi';
import { config } from '../../utils/config';

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
  
  &:hover {
    background-color: ${props => props.isListening ? '#F57C00' : 'rgba(255, 255, 255, 0.9)'};
  }
  
  &:focus {
    outline: none;
  }
`;

const FeedbackText = styled(motion.div)`
  background-color: rgba(255, 255, 255, 0.7);
  padding: 0.5rem 1rem;
  border-radius: 20px;
  margin-bottom: 1rem;
  font-size: 0.9rem;
  max-width: 300px;
  text-align: right;
  backdrop-filter: blur(5px);
`;

const StatusIndicator = styled.div`
  width: 10px;
  height: 10px;
  border-radius: 50%;
  background-color: ${props => props.status === 'connected' ? '#4CAF50' : 
    props.status === 'connecting' ? '#FFC107' : 
    props.status === 'error' ? '#F44336' : '#9E9E9E'};
  position: absolute;
  top: 5px;
  right: 5px;
`;

const RealtimeVoiceInterface = ({ onCommand }) => {
  const [status, setStatus] = useState('disconnected'); // disconnected, connecting, connected, error
  const [isListening, setIsListening] = useState(false);
  const [feedback, setFeedback] = useState('');
  const [transcription, setTranscription] = useState('');
  const sessionRef = useRef(null);
  const microphoneStreamRef = useRef(null);
  
  // Initialiseer de Realtime sessie wanneer de component wordt gemount
  useEffect(() => {
    if (!config.openaiApiKey) {
      setStatus('error');
      setFeedback('OpenAI API key is niet geconfigureerd. Voeg deze toe aan je .env bestand.');
      return;
    }
    
    const initializeSession = async () => {
      try {
        setStatus('connecting');
        setFeedback('Verbinding maken met OpenAI Realtime API...');
        
        const session = await setupRealtimeSession(config.openaiApiKey, {
          model: 'gpt-4o-realtime-preview',
          voice: 'alloy',
          vadType: 'semantic_vad',
          vadEagerness: 'medium',
          instructions: 'Je bent een behulpzame assistent voor het Coliblanco dashboard. Beantwoord vragen kort en bondig in het Nederlands.',
          onOpen: () => {
            setStatus('connected');
            setFeedback('Verbonden met OpenAI Realtime API. Klik op de microfoon om te spreken.');
          },
          onSpeechStart: () => {
            setFeedback('Luisteren...');
          },
          onSpeechEnd: () => {
            setFeedback('Verwerken...');
          },
          onTextDelta: (delta) => {
            setTranscription(prev => prev + delta);
          },
          onResponseDone: (response) => {
            // Stuur het volledige transcript naar de parent component
            if (onCommand && response.output && response.output.length > 0) {
              // Zoek naar tekst output in de response
              const textOutput = response.output.find(item => 
                item.content && item.content.some(part => part.type === 'text')
              );
              
              if (textOutput) {
                const text = textOutput.content.find(part => part.type === 'text').text;
                onCommand(text);
              }
            }
            
            setIsListening(false);
            setFeedback('Klaar om te luisteren');
          },
          onError: (error) => {
            console.error('Realtime API fout:', error);
            setStatus('error');
            setFeedback(`Fout: ${error.message || 'Onbekende fout'}`);
          },
          onClose: () => {
            setStatus('disconnected');
            setFeedback('Verbinding verbroken');
            setIsListening(false);
          }
        });
        
        sessionRef.current = session;
      } catch (error) {
        console.error('Fout bij het initialiseren van de Realtime sessie:', error);
        setStatus('error');
        setFeedback(`Fout bij verbinden: ${error.message}`);
      }
    };
    
    initializeSession();
    
    // Cleanup functie
    return () => {
      if (sessionRef.current) {
        sessionRef.current.endSession();
        sessionRef.current = null;
      }
      
      if (microphoneStreamRef.current) {
        microphoneStreamRef.current.getTracks().forEach(track => track.stop());
        microphoneStreamRef.current = null;
      }
    };
  }, [onCommand]);
  
  const handleToggleMicrophone = async () => {
    if (!sessionRef.current) {
      setFeedback('Geen verbinding met de Realtime API');
      return;
    }
    
    if (!isListening) {
      try {
        // Start de microfoon
        setIsListening(true);
        setFeedback('Microfoon starten...');
        
        const stream = await sessionRef.current.startMicrophone();
        microphoneStreamRef.current = stream;
        
        setFeedback('Luisteren... Spreek in de microfoon.');
      } catch (error) {
        console.error('Fout bij het starten van de microfoon:', error);
        setIsListening(false);
        setFeedback(`Fout bij microfoon toegang: ${error.message}`);
      }
    } else {
      // Stop de microfoon
      if (microphoneStreamRef.current) {
        microphoneStreamRef.current.getTracks().forEach(track => track.stop());
        microphoneStreamRef.current = null;
      }
      
      setIsListening(false);
      setFeedback('Microfoon gestopt');
    }
  };
  
  return (
    <VoiceContainer>
      <AnimatePresence>
        {feedback && (
          <FeedbackText
            initial={{ opacity: 0, y: 10, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.2 }}
          >
            {feedback}
          </FeedbackText>
        )}
      </AnimatePresence>
      
      <MicButton 
        isListening={isListening}
        onClick={handleToggleMicrophone}
        whileTap={{ scale: 0.9 }}
        disabled={status !== 'connected'}
      >
        <StatusIndicator status={status} />
        {isListening ? <FaStop /> : <FaMicrophone />}
      </MicButton>
    </VoiceContainer>
  );
};

export default RealtimeVoiceInterface;
