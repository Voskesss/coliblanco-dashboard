import React, { useState, useEffect, useRef } from 'react';
import styled from '@emotion/styled';
import { motion, AnimatePresence } from 'framer-motion';
import { FaMicrophone, FaStop, FaVolumeUp, FaPaperPlane, FaKeyboard } from 'react-icons/fa';
import { useAppContext } from '../../context/AppContext';
import { textToSpeech, processSpeechToSpeech } from '../../utils/openai';

const VoiceContainer = styled.div`
  position: absolute;
  bottom: 2rem;
  right: 2rem;
  display: flex;
  flex-direction: column;
  align-items: flex-end;
`;

const ButtonsContainer = styled.div`
  display: flex;
  align-items: center;
  gap: 0.5rem;
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
  transition: background-color 0.3s ease;
  
  &:hover {
    background-color: rgba(255, 255, 255, 0.9);
  }
  
  &:focus {
    outline: none;
  }
`;

const TextInputContainer = styled(motion.div)`
  display: flex;
  align-items: center;
  background-color: rgba(255, 255, 255, 0.8);
  border-radius: 25px;
  padding: 0.5rem 1rem;
  margin-bottom: 1rem;
  box-shadow: 0 4px 10px rgba(0, 0, 0, 0.1);
  width: 300px;
`;

const Input = styled.input`
  flex: 1;
  border: none;
  background: transparent;
  font-size: 0.9rem;
  color: #333;
  padding: 0.5rem;
  
  &:focus {
    outline: none;
  }
`;

const SendButton = styled(motion.button)`
  background: none;
  border: none;
  color: #FF9800;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1.2rem;
  padding: 0.2rem;
  
  &:hover {
    color: #F57C00;
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

const MockVoiceInterface = ({ onCommand }) => {
  const [isListening, setIsListening] = useState(false);
  const [feedback, setFeedback] = useState('');
  const [showTextInput, setShowTextInput] = useState(false);
  const [inputText, setInputText] = useState('');
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [audioElement, setAudioElement] = useState(null);
  const [mediaRecorder, setMediaRecorder] = useState(null);
  const [audioChunks, setAudioChunks] = useState([]);
  const inputRef = useRef(null);
  
  const { orbStatus } = useAppContext();
  
  // Focus op het tekstinvoerveld wanneer het wordt weergegeven
  useEffect(() => {
    if (showTextInput && inputRef.current) {
      inputRef.current.focus();
    }
  }, [showTextInput]);
  
  // Initialiseer de mediaRecorder
  useEffect(() => {
    // Cleanup functie voor als de component unmount
    return () => {
      if (mediaRecorder && mediaRecorder.state === 'recording') {
        mediaRecorder.stop();
      }
      if (audioElement) {
        audioElement.pause();
        audioElement.src = '';
      }
    };
  }, [mediaRecorder, audioElement]);
  
  // Start de opname van audio
  const startRecording = async () => {
    try {
      setAudioChunks([]);
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const recorder = new MediaRecorder(stream);
      
      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) {
          setAudioChunks((chunks) => [...chunks, e.data]);
        }
      };
      
      recorder.onstop = async () => {
        // Stop alle tracks in de stream om de microfoon vrij te geven
        stream.getTracks().forEach(track => track.stop());
        
        if (audioChunks.length > 0) {
          // Verwerk de opgenomen audio
          await processRecordedAudio();
        }
      };
      
      recorder.start();
      setMediaRecorder(recorder);
      setIsListening(true);
      setFeedback('Luisteren...');
    } catch (error) {
      console.error('Fout bij het starten van de opname:', error);
      setFeedback('Kon de microfoon niet gebruiken. Controleer je browser-instellingen.');
      setTimeout(() => setFeedback(''), 3000);
    }
  };
  
  // Stop de opname van audio
  const stopRecording = () => {
    if (mediaRecorder && mediaRecorder.state === 'recording') {
      mediaRecorder.stop();
      setIsListening(false);
      setFeedback('Verwerken van je spraak...');
    }
  };
  
  // Verwerk de opgenomen audio
  const processRecordedAudio = async () => {
    try {
      // Maak een blob van de opgenomen audiochunks
      const audioBlob = new Blob(audioChunks, { type: 'audio/webm' });
      
      console.log('Audio opgenomen, type:', audioBlob.type, 'grootte:', audioBlob.size, 'bytes');
      
      // Verwerk de audio met de speech-to-speech functie
      setFeedback('Verwerken van je spraak...');
      const result = await processSpeechToSpeech(audioBlob);
      
      // Toon de transcriptie en het antwoord
      setFeedback(`Jij: "${result.transcription}"
AI: "${result.response}"`);
      
      // Stuur het commando door naar de parent component
      if (onCommand) {
        onCommand(result.response);
      }
      
      // Speel het antwoord af
      playAudio(result.audioUrl);
      
      // Reset na een tijdje
      setTimeout(() => {
        setFeedback('');
      }, 10000);
    } catch (error) {
      console.error('Fout bij het verwerken van de opgenomen audio:', error);
      setFeedback('Er is een fout opgetreden bij het verwerken van je spraak.');
      setTimeout(() => setFeedback(''), 3000);
    }
  };
  
  // Speel audio af
  const playAudio = (url) => {
    try {
      // Stop eventuele lopende audio
      if (audioElement) {
        audioElement.pause();
        audioElement.src = '';
      }
      
      // Controleer of de URL geldig is
      if (!url || url === 'dummy-audio-url') {
        console.warn('Ongeldige audio URL ontvangen');
        setIsSpeaking(false);
        return;
      }
      
      // Maak een nieuw audio element
      const audio = new Audio(url);
      setAudioElement(audio);
      
      // Vind de orb via DOM en animeer deze
      const orbElement = document.querySelector('.orb-ref');
      if (orbElement && orbElement.__reactFiber$) {
        const orbInstance = orbElement.__reactFiber$.return.stateNode;
        if (orbInstance && orbInstance.animate) {
          orbInstance.animate('speak');
        }
      }
      
      setIsSpeaking(true);
      
      // Voeg event handlers toe
      audio.onended = () => {
        setIsSpeaking(false);
        if (url.startsWith('blob:')) {
          URL.revokeObjectURL(url); // Ruim de blob URL op
        }
      };
      
      audio.onerror = (e) => {
        console.error('Fout bij het afspelen van audio:', e);
        setIsSpeaking(false);
      };
      
      // Start het afspelen
      audio.play().catch(error => {
        console.error('Fout bij het afspelen van audio:', error);
        setIsSpeaking(false);
      });
    } catch (error) {
      console.error('Fout bij het afspelen van audio:', error);
      setIsSpeaking(false);
    }
  };
  
  // Toggle de microfoon
  const handleToggleMicrophone = () => {
    // Sluit tekstinvoer als die open is
    setShowTextInput(false);
    
    if (!isListening) {
      startRecording();
    } else {
      stopRecording();
    }
  };
  
  // Toon of verberg het tekstinvoerveld
  const toggleTextInput = () => {
    setShowTextInput(!showTextInput);
    if (isListening) {
      stopRecording();
    }
  };
  
  // Verwerk de tekstinvoer
  const handleSendText = async () => {
    if (inputText.trim() === '') return;
    
    const userText = inputText.trim();
    setFeedback(`Verwerken van "${userText}"...`);
    
    try {
      // Verwerk de tekst met het LLM en zet het antwoord om naar spraak
      const result = await processSpeechToSpeech(null, { userText });
      
      // Toon het antwoord
      setFeedback(`Jij: "${userText}"
AI: "${result.response}"`);
      
      // Stuur het commando door naar de parent component
      if (onCommand) {
        onCommand(result.response);
      }
      
      // Speel het antwoord af
      playAudio(result.audioUrl);
      
      // Reset de input
      setInputText('');
      
      // Reset na een tijdje
      setTimeout(() => {
        setFeedback('');
        setShowTextInput(false);
      }, 10000);
    } catch (error) {
      console.error('Fout bij het verwerken van tekst:', error);
      setFeedback('Er is een fout opgetreden bij het verwerken van je bericht.');
      setTimeout(() => {
        setFeedback('');
      }, 3000);
    }
  };
  
  // Verwerk Enter toets in het tekstinvoerveld
  const handleKeyPress = (e) => {
    if (e.key === 'Enter') {
      handleSendText();
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
            {feedback.split('\n').map((line, index) => (
              <React.Fragment key={index}>
                {line}
                {index < feedback.split('\n').length - 1 && <br />}
              </React.Fragment>
            ))}
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
        <MicButton 
          isListening={isListening}
          onClick={handleToggleMicrophone}
          whileTap={{ scale: 0.9 }}
        >
          {isListening ? <FaStop /> : <FaMicrophone />}
        </MicButton>
      </ButtonsContainer>
    </VoiceContainer>
  );
};

export default MockVoiceInterface;
