import React, { useState, useEffect, useRef } from 'react';
import styled from '@emotion/styled';
import { motion, AnimatePresence } from 'framer-motion';
import { FaMicrophone, FaStop, FaVolumeUp } from 'react-icons/fa';
import useVoiceRecording from '../../hooks/useVoiceRecording';
import { processSpeechToSpeech } from '../../utils/openai';

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

const AudioPlayer = styled.div`
  margin-bottom: 1rem;
  display: flex;
  align-items: center;
  justify-content: flex-end;
`;

const PlayButton = styled(motion.button)`
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
  
  &:hover {
    background-color: rgba(255, 255, 255, 0.9);
  }
  
  &:focus {
    outline: none;
  }
`;

const VoiceInterface = ({ onCommand }) => {
  const { isRecording, audioBlob, error, startRecording, stopRecording } = useVoiceRecording();
  const [feedback, setFeedback] = useState('');
  const [processing, setProcessing] = useState(false);
  const [response, setResponse] = useState(null);
  const [audioUrl, setAudioUrl] = useState(null);
  const audioElementRef = useRef(null);
  const isProcessingRef = useRef(false);
  
  // Cleanup functie om alle audio-elementen en URLs op te ruimen
  const cleanupAudio = () => {
    if (audioElementRef.current) {
      audioElementRef.current.pause();
      audioElementRef.current = null;
    }
    
    if (audioUrl) {
      URL.revokeObjectURL(audioUrl);
    }
  };
  
  // Maak een audio element aan wanneer we een audioUrl hebben
  useEffect(() => {
    // Ruim eerst eventuele bestaande audio op
    cleanupAudio();
    
    if (audioUrl) {
      const audio = new Audio(audioUrl);
      audioElementRef.current = audio;
      
      // Stel event handlers in
      audio.onended = () => {
        console.log('Audio afgespeeld');
      };
      
      audio.onerror = (e) => {
        console.error('Fout bij het afspelen van audio:', e);
        setFeedback('Er is een fout opgetreden bij het afspelen van audio.');
      };
      
      // Automatisch afspelen
      audio.play().catch(err => {
        console.error('Kon audio niet automatisch afspelen:', err);
      });
    }
    
    // Cleanup
    return cleanupAudio;
  }, [audioUrl]);
  
  // Verwerk de opgenomen audio wanneer beschikbaar
  useEffect(() => {
    const processAudio = async () => {
      if (audioBlob && !isRecording && !isProcessingRef.current) {
        try {
          isProcessingRef.current = true;
          setProcessing(true);
          setFeedback('Verwerken van je spraak...');
          
          // Gebruik de OpenAI chained architecture
          const result = await processSpeechToSpeech(audioBlob);
          
          // Update de state met de resultaten
          setResponse(result.response);
          setAudioUrl(result.audioUrl);
          
          // Stuur het commando door naar de parent component
          if (onCommand) {
            onCommand(result.transcription);
          }
          
          setFeedback(`"${result.transcription}" verwerkt`);
        } catch (err) {
          console.error('Fout bij het verwerken van audio:', err);
          setFeedback('Er is een fout opgetreden bij het verwerken van je spraak.');
        } finally {
          setProcessing(false);
          isProcessingRef.current = false;
        }
      }
    };
    
    processAudio();
  }, [audioBlob, isRecording, onCommand]);
  
  // Toon foutmeldingen als die er zijn
  useEffect(() => {
    if (error) {
      setFeedback(error);
    }
  }, [error]);
  
  // Cleanup bij unmount
  useEffect(() => {
    return () => {
      cleanupAudio();
    };
  }, []);
  
  const handleToggleRecording = () => {
    if (!isRecording && !processing) {
      // Stop eerst eventuele bestaande audio
      cleanupAudio();
      
      startRecording();
      setFeedback('Luisteren...');
      setResponse(null);
      setAudioUrl(null);
    } else if (isRecording) {
      stopRecording();
      setFeedback('Verwerken...');
    }
  };
  
  const playResponse = () => {
    if (audioElementRef.current) {
      // Stop eerst als het al aan het spelen is
      audioElementRef.current.pause();
      audioElementRef.current.currentTime = 0;
      
      // Start het afspelen
      audioElementRef.current.play().catch(err => {
        console.error('Kon audio niet afspelen:', err);
        setFeedback('Er is een fout opgetreden bij het afspelen van audio.');
      });
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
      
      {audioUrl && (
        <AudioPlayer>
          <PlayButton 
            onClick={playResponse}
            whileTap={{ scale: 0.9 }}
          >
            <FaVolumeUp />
          </PlayButton>
        </AudioPlayer>
      )}
      
      <MicButton 
        isListening={isRecording}
        onClick={handleToggleRecording}
        whileTap={{ scale: 0.9 }}
        disabled={processing}
      >
        {isRecording ? <FaStop /> : <FaMicrophone />}
      </MicButton>
    </VoiceContainer>
  );
};

export default VoiceInterface;
