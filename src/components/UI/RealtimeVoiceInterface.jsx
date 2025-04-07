import React, { useState, useEffect, useRef } from 'react';
import styled from '@emotion/styled';
import { motion, AnimatePresence } from 'framer-motion';
import { FaMicrophone, FaStop, FaVolumeUp, FaPaperPlane, FaKeyboard, FaSpinner, FaVolumeMute } from 'react-icons/fa';
import { textToSpeech, processWithLLM, transcribeAudio } from '../../utils/openai';

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

const TranscriptContainer = styled(motion.div)`
  background-color: rgba(255, 255, 255, 0.9);
  padding: 1rem;
  border-radius: 8px;
  margin-bottom: 1rem;
  box-shadow: 0 4px 10px rgba(0, 0, 0, 0.1);
  max-width: 80%;
  align-self: flex-start;
  font-size: 0.9rem;
  line-height: 1.4;
`;

const ResponseContainer = styled(motion.div)`
  background-color: rgba(255, 152, 0, 0.1);
  padding: 1rem;
  border-radius: 8px;
  margin-bottom: 1rem;
  box-shadow: 0 4px 10px rgba(0, 0, 0, 0.1);
  max-width: 80%;
  align-self: flex-end;
  font-size: 0.9rem;
  line-height: 1.4;
  border-left: 3px solid #FF9800;
`;

const RealtimeVoiceInterface = ({ orbStatus, processCommand }) => {
  const [isListening, setIsListening] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [showTextInput, setShowTextInput] = useState(false);
  const [inputText, setInputText] = useState('');
  const [volume, setVolume] = useState(80);
  const [isMuted, setIsMuted] = useState(false);
  const [aiResponse, setAiResponse] = useState('');
  const [showTranscript, setShowTranscript] = useState(false);
  const [showResponse, setShowResponse] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  
  const inputRef = useRef(null);
  const mediaRecorderRef = useRef(null);
  const audioChunksRef = useRef([]);
  
  // Functie om de microfoon te activeren en te beginnen met opnemen
  const startRecording = async () => {
    try {
      // Vraag toestemming voor de microfoon
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      
      // Maak een nieuwe MediaRecorder
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];
      
      // Luister naar dataAvailable events
      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };
      
      // Luister naar stop events
      mediaRecorder.onstop = async () => {
        console.log('Opname gestopt, verwerken...');
        setIsProcessing(true);
        
        try {
          // Maak een blob van de opgenomen audio chunks
          const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
          
          // Transcribeer de audio naar tekst met Whisper
          const transcription = await transcribeAudio(audioBlob);
          console.log('Transcriptie ontvangen:', transcription);
          
          // Toon de transcriptie
          setTranscript(transcription);
          setShowTranscript(true);
          
          // Verwerk de transcriptie met het LLM
          const response = await processWithLLM(transcription);
          console.log('LLM antwoord ontvangen:', response);
          
          // Toon het antwoord
          setAiResponse(response);
          setShowResponse(true);
          
          // Zet het antwoord om naar spraak met de nieuwe streaming TTS
          const voiceInstructions = "Spreek op een natuurlijke, vriendelijke toon. Gebruik een rustig tempo en duidelijke articulatie.";
          const audioUrl = await textToSpeech(response, voiceInstructions);
          
          // Speel de audio af
          const audio = new Audio(audioUrl);
          audio.volume = volume / 100;
          audio.muted = isMuted;
          audio.play();
          setIsSpeaking(true);
          
          // Luister naar het einde van de audio
          audio.onended = () => {
            setIsSpeaking(false);
            setIsProcessing(false);
          };
          
          // Verwerk het commando als er een is
          if (processCommand) {
            processCommand(response);
          }
        } catch (error) {
          console.error('Fout bij verwerken van opname:', error);
          setErrorMessage(`Fout bij verwerken van opname: ${error.message}`);
          setIsProcessing(false);
        }
      };
      
      // Start de opname
      mediaRecorder.start();
      setIsListening(true);
      setErrorMessage('');
      console.log('Opname gestart');
    } catch (error) {
      console.error('Fout bij starten opname:', error);
      setErrorMessage(`Fout bij starten opname: ${error.message}`);
    }
  };
  
  // Functie om te stoppen met opnemen
  const stopRecording = () => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
      mediaRecorderRef.current.stop();
      setIsListening(false);
      console.log('Opname gestopt');
      
      // Stop alle tracks in de stream
      if (mediaRecorderRef.current.stream) {
        mediaRecorderRef.current.stream.getTracks().forEach(track => track.stop());
      }
    }
  };
  
  // Functie om de microfoon te togglen
  const handleToggleMicrophone = async () => {
    if (isListening) {
      stopRecording();
    } else {
      // Reset voor een nieuwe conversatie
      setAiResponse('');
      setTranscript('');
      setShowTranscript(false);
      setShowResponse(false);
      setErrorMessage('');
      
      // Start met opnemen
      await startRecording();
    }
  };
  
  // Functie om tekst te versturen
  const handleSendText = async () => {
    if (!inputText.trim() || isProcessing) return;
    
    setIsProcessing(true);
    setTranscript(inputText);
    setShowTranscript(true);
    setErrorMessage('');
    
    try {
      // Verwerk de tekst met het LLM
      const response = await processWithLLM(inputText);
      console.log('LLM antwoord ontvangen:', response);
      
      // Toon het antwoord
      setAiResponse(response);
      setShowResponse(true);
      
      // Zet het antwoord om naar spraak met de nieuwe streaming TTS
      const voiceInstructions = "Spreek op een natuurlijke, vriendelijke toon. Gebruik een rustig tempo en duidelijke articulatie.";
      const audioUrl = await textToSpeech(response, voiceInstructions);
      
      // Speel de audio af
      const audio = new Audio(audioUrl);
      audio.volume = volume / 100;
      audio.muted = isMuted;
      audio.play();
      setIsSpeaking(true);
      
      // Luister naar het einde van de audio
      audio.onended = () => {
        setIsSpeaking(false);
        setIsProcessing(false);
      };
      
      // Verwerk het commando als er een is
      if (processCommand) {
        processCommand(response);
      }
    } catch (error) {
      console.error('Fout bij verwerken van tekst:', error);
      setErrorMessage(`Fout bij verwerken van tekst: ${error.message}`);
      setIsProcessing(false);
    }
    
    // Reset de input
    setInputText('');
  };
  
  // Functie om Enter toets af te handelen
  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !isProcessing) {
      handleSendText();
    }
  };
  
  // Cleanup functie bij unmount
  useEffect(() => {
    return () => {
      // Stop de opname als die nog bezig is
      if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
        mediaRecorderRef.current.stop();
        
        // Stop alle tracks in de stream
        if (mediaRecorderRef.current.stream) {
          mediaRecorderRef.current.stream.getTracks().forEach(track => track.stop());
        }
      }
    };
  }, []);
  
  // Focus op het tekstinvoerveld wanneer het wordt weergegeven
  useEffect(() => {
    if (showTextInput && inputRef.current) {
      inputRef.current.focus();
    }
  }, [showTextInput]);
  
  return (
    <VoiceContainer>
      <AnimatePresence>
        {showTranscript && transcript && (
          <TranscriptContainer
            initial={{ opacity: 0, y: 20, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.3 }}
          >
            <strong>Jij:</strong> {transcript}
          </TranscriptContainer>
        )}
      </AnimatePresence>
      
      <AnimatePresence>
        {showResponse && aiResponse && (
          <ResponseContainer
            initial={{ opacity: 0, y: 20, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.3 }}
          >
            <strong>Assistent:</strong> {aiResponse}
          </ResponseContainer>
        )}
      </AnimatePresence>
      
      <AnimatePresence>
        {errorMessage && (
          <FeedbackText
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.3 }}
          >
            <strong>Fout:</strong> {errorMessage}
          </FeedbackText>
        )}
      </AnimatePresence>
      
      {showTextInput && (
        <TextInputContainer
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -20 }}
          transition={{ duration: 0.3 }}
        >
          <Input
            ref={inputRef}
            type="text"
            placeholder="Typ je bericht..."
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            onKeyPress={handleKeyPress}
            disabled={isProcessing}
          />
          <SendButton
            onClick={handleSendText}
            disabled={isProcessing || !inputText.trim()}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            <FaPaperPlane />
          </SendButton>
        </TextInputContainer>
      )}
      
      <ButtonsContainer>
        <TextButton
          onClick={() => setShowTextInput(!showTextInput)}
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.9 }}
          title="Tekst invoer"
        >
          <FaKeyboard />
        </TextButton>
        
        <MicButton
          onClick={handleToggleMicrophone}
          disabled={isProcessing && !isListening}
          isListening={isListening}
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.9 }}
          title={isListening ? "Stop met luisteren" : "Start met luisteren"}
        >
          {isListening ? <FaStop /> : <FaMicrophone />}
          <StatusIndicator
            isListening={isListening}
            isProcessing={isProcessing}
            isSpeaking={isSpeaking}
          />
          {(isListening || isProcessing || isSpeaking) && (
            <StatusText>
              {isListening ? "Luisteren..." : isProcessing ? "Verwerken..." : "Spreken..."}
            </StatusText>
          )}
        </MicButton>
      </ButtonsContainer>
      
      <AnimatePresence>
        {(isListening || isProcessing || isSpeaking) && (
          <AudioControls
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            transition={{ duration: 0.3 }}
          >
            <VolumeButton onClick={() => setIsMuted(!isMuted)} title={isMuted ? "Geluid aan" : "Geluid uit"}>
              {isMuted ? <FaVolumeMute /> : <FaVolumeUp />}
            </VolumeButton>
            <VolumeSlider
              type="range"
              min="0"
              max="100"
              value={volume}
              onChange={(e) => setVolume(parseInt(e.target.value))}
              disabled={isMuted}
            />
          </AudioControls>
        )}
      </AnimatePresence>
    </VoiceContainer>
  );
};

export default RealtimeVoiceInterface;
