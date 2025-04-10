import React, { useState, useEffect, useRef } from 'react';
import styled from '@emotion/styled';
import { motion, AnimatePresence } from 'framer-motion';
import { FaStop, FaVolumeUp, FaPaperPlane, FaSpinner, FaVolumeMute, FaChevronUp, FaMicrophone, FaTimes } from 'react-icons/fa';
import { BsSoundwave } from 'react-icons/bs';
import { textToSpeech, processWithLLM, transcribeAudio } from '../../utils/openai';
import { setupRealtimeSession } from '../../utils/realtimeApi';
import { config } from '../../utils/config';

const VoiceContainer = styled.div`
  position: absolute;
  bottom: 2rem;
  right: 2rem;
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  z-index: 1000;
`;

const MicButton = styled(motion.button)`
  width: 120px;
  height: 120px;
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

const TextInputContainer = styled(motion.div)`
  position: fixed;
  bottom: 2rem;
  left: 50%;
  transform: translateX(-50%);
  display: flex;
  flex-direction: column;
  width: 80%;
  max-width: 600px;
  background-color: rgba(255, 255, 255, 0.9);
  border-radius: 20px;
  box-shadow: 0 4px 10px rgba(0, 0, 0, 0.1);
  overflow: hidden;
  z-index: 1000;
`;

const Input = styled.textarea`
  width: 100%;
  padding: 15px;
  border: none;
  font-size: 16px;
  background: transparent;
  resize: none;
  height: ${props => props.expanded ? '100px' : '50px'};
  transition: height 0.3s ease;
  
  &:focus {
    outline: none;
    height: 100px;
  }
`;

const SendButton = styled(motion.button)`
  position: absolute;
  right: 10px;
  bottom: ${props => props.expanded ? '10px' : '5px'};
  background-color: #FF9800;
  border: none;
  color: white;
  width: 50px;
  height: 50px;
  border-radius: 50%;
  display: flex;
  justify-content: center;
  align-items: center;
  cursor: pointer;
  transition: bottom 0.3s ease;
  box-shadow: 0 2px 5px rgba(0, 0, 0, 0.2);
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

const StopButton = styled(motion.button)`
  position: absolute;
  top: -15px;
  right: -15px;
  background-color: #FF3B30;
  border: none;
  color: white;
  width: 40px;
  height: 40px;
  border-radius: 50%;
  display: flex;
  justify-content: center;
  align-items: center;
  cursor: pointer;
  transition: background-color 0.3s ease;
  box-shadow: 0 2px 5px rgba(0, 0, 0, 0.2);
  z-index: 1001;
  
  &:hover {
    background-color: #E02E24;
    transform: scale(1.05);
  }
`;

const RealtimeVoiceInterface = ({ orbStatus, processCommand }) => {
  const [isListening, setIsListening] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [aiResponse, setAiResponse] = useState('');
  const [showTranscript, setShowTranscript] = useState(false);
  const [showResponse, setShowResponse] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [inputText, setInputText] = useState('');
  const [expanded, setExpanded] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [volume, setVolume] = useState(80);
  const [conversationMode, setConversationMode] = useState(false);
  const [selectedVoice, setSelectedVoice] = useState('alloy');
  const [conversationHistory, setConversationHistory] = useState([]);
  
  const audioContextRef = useRef(null);
  const analyserRef = useRef(null);
  const mediaRecorderRef = useRef(null);
  const audioChunksRef = useRef([]);
  const inputRef = useRef(null);
  const conversationTimeoutRef = useRef(null);
  const silenceDetectorRef = useRef(null);
  const silenceTimeoutRef = useRef(null);
  const lastSoundTimestampRef = useRef(Date.now());
  const interruptionDetectorRef = useRef(null);
  const realtimeSessionRef = useRef(null);
  
  const initAudioContext = async (stream) => {
    try {
      if (!audioContextRef.current) {
        audioContextRef.current = new (window.AudioContext || window.webkitAudioContext)();
      }
      
      analyserRef.current = audioContextRef.current.createAnalyser();
      analyserRef.current.fftSize = 256;
      analyserRef.current.smoothingTimeConstant = 0.8;
      
      const source = audioContextRef.current.createMediaStreamSource(stream);
      source.connect(analyserRef.current);
      
      startSilenceDetection();
    } catch (error) {
      console.error('Fout bij initialiseren AudioContext:', error);
    }
  };
  
  const startSilenceDetection = () => {
    if (!analyserRef.current) return;
    
    const bufferLength = analyserRef.current.frequencyBinCount;
    const dataArray = new Uint8Array(bufferLength);
    
    const checkSoundLevel = () => {
      if (!analyserRef.current || !isListening) return;
      
      analyserRef.current.getByteFrequencyData(dataArray);
      
      let sum = 0;
      for (let i = 0; i < bufferLength; i++) {
        sum += dataArray[i];
      }
      const average = sum / bufferLength;
      
      console.log('Geluidsniveau:', average);
      
      if (average > 10) { 
        lastSoundTimestampRef.current = Date.now();
        
        if (silenceTimeoutRef.current) {
          clearTimeout(silenceTimeoutRef.current);
          silenceTimeoutRef.current = null;
        }
      } else {
        const silenceDuration = Date.now() - lastSoundTimestampRef.current;
        
        if (silenceDuration > 3000 && isListening && !silenceTimeoutRef.current) {
          console.log('Stilte gedetecteerd, stoppen met luisteren over 1s...');
          silenceTimeoutRef.current = setTimeout(() => {
            console.log('Stilte bevestigd, stoppen met luisteren...');
            stopRecording();
            silenceTimeoutRef.current = null;
          }, 1000); 
        }
      }
      
      silenceDetectorRef.current = requestAnimationFrame(checkSoundLevel);
    };
    
    silenceDetectorRef.current = requestAnimationFrame(checkSoundLevel);
  };
  
  const stopSilenceDetection = () => {
    if (silenceDetectorRef.current) {
      cancelAnimationFrame(silenceDetectorRef.current);
      silenceDetectorRef.current = null;
    }
    
    if (silenceTimeoutRef.current) {
      clearTimeout(silenceTimeoutRef.current);
      silenceTimeoutRef.current = null;
    }
  };
  
  const stopRecording = () => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      console.log('Opname stoppen...');
      mediaRecorderRef.current.stop();
      
      // Stop alle tracks in de stream
      if (mediaRecorderRef.current.stream) {
        mediaRecorderRef.current.stream.getTracks().forEach(track => track.stop());
      }
    }
    
    stopSilenceDetection();
    setIsListening(false);
  };
  
  const startRecording = async () => {
    try {
      // Vraag toegang tot de microfoon
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      
      // Initialiseer de audio context voor geluidsanalyse
      await initAudioContext(stream);
      
      // Maak een MediaRecorder om audio op te nemen
      mediaRecorderRef.current = new MediaRecorder(stream);
      
      // Verzamel audiochunks tijdens het opnemen
      audioChunksRef.current = [];
      mediaRecorderRef.current.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };
      
      // Verwerk de audio wanneer de opname stopt
      mediaRecorderRef.current.onstop = async () => {
        try {
          // Maak een blob van de verzamelde audiochunks
          const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
          
          // Reset de audiochunks
          audioChunksRef.current = [];
          
          // Als er geen audio is, stop dan
          if (audioBlob.size === 0) {
            console.log('Geen audio opgenomen');
            setIsListening(false);
            return;
          }
          
          console.log('Audio opname verwerken...');
          setIsProcessing(true);
          
          try {
            // Transcribeer de audio naar tekst
            const transcription = await transcribeAudio(audioBlob);
            console.log('Transcriptie ontvangen:', transcription);
            
            // Toon de transcriptie
            setTranscript(transcription);
            setShowTranscript(true);
            
            // Als er geen tekst is, stop dan
            if (!transcription.trim()) {
              console.log('Geen tekst gedetecteerd');
              setIsProcessing(false);
              return;
            }
            
            // Verwerk de tekst met het taalmodel
            const response = await processWithLLM(transcription, { conversationHistory });
            console.log('LLM antwoord ontvangen:', response);
            
            // Toon het antwoord
            setAiResponse(response.response);
            setShowResponse(true);
            
            // Update de conversatiegeschiedenis met de nieuwe geschiedenis van het antwoord
            setConversationHistory(response.conversationHistory);
            
            // Spreek het antwoord uit
            await speakResponse(response.response);
            
            // Verwerk het commando als dat nodig is
            if (processCommand) {
              processCommand(response.response);
            }
          } catch (error) {
            console.error('Fout bij verwerken van audio:', error);
            setErrorMessage(`Fout bij verwerken van audio: ${error.message}`);
          } finally {
            setIsProcessing(false);
          }
        } catch (error) {
          console.error('Fout bij verwerken van opname:', error);
          setErrorMessage(`Fout bij verwerken van opname: ${error.message}`);
          setIsProcessing(false);
        }
      };
      
      // Start de opname
      mediaRecorderRef.current.start();
      setIsListening(true);
      setShowTranscript(false);
      setShowResponse(false);
      setTranscript('');
      setAiResponse('');
      setErrorMessage('');
      
      console.log('Opname gestart');
    } catch (error) {
      console.error('Fout bij starten opname:', error);
      setErrorMessage(`Fout bij starten opname: ${error.message}`);
    }
  };
  
  const startNextListeningSession = () => {
    if (conversationMode && !isListening && !isProcessing) {
      startRecording();
    }
  };
  
  const handleSendText = async () => {
    if (!inputText.trim() || isProcessing) return;
    
    try {
      setIsProcessing(true);
      setShowTranscript(true);
      setTranscript(inputText);
      
      // Voeg de tekst toe aan de conversatiegeschiedenis
      // Niet meer nodig, wordt nu in processWithLLM gedaan
      // setConversationHistory([...conversationHistory, { type: 'user', text: inputText }]);
      
      const response = await processWithLLM(inputText, { conversationHistory });
      
      setAiResponse(response.response);
      setShowResponse(true);
      
      // Update de conversatiegeschiedenis met de nieuwe geschiedenis van het antwoord
      setConversationHistory(response.conversationHistory);
      
      await speakResponse(response.response);
      
      if (processCommand) {
        processCommand(response.response);
      }
      
      setInputText('');
      setIsProcessing(false);
    } catch (error) {
      console.error('Fout bij verwerken van tekst:', error);
      setErrorMessage(`Fout bij verwerken van tekst: ${error.message}`);
      setIsProcessing(false);
    }
  };
  
  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendText();
    }
  };
  
  const interruptSpeaking = () => {
    if (isSpeaking) {
      const audioElements = document.getElementsByTagName('audio');
      for (let i = 0; i < audioElements.length; i++) {
        audioElements[i].pause();
        audioElements[i].currentTime = 0;
      }
      
      setIsSpeaking(false);
      console.log('Spreken onderbroken door gebruiker');
      
      if (conversationMode) {
        startRecording();
      }
    }
  };
  
  const checkForInterruption = () => {
    if (!analyserRef.current || !isSpeaking) return;
    
    const bufferLength = analyserRef.current.frequencyBinCount;
    const dataArray = new Uint8Array(bufferLength);
    
    analyserRef.current.getByteFrequencyData(dataArray);
    
    let sum = 0;
    for (let i = 0; i < bufferLength; i++) {
      sum += dataArray[i];
    }
    const average = sum / bufferLength;
    
    if (average > 10) { 
      console.log('Interruptie gedetecteerd, geluidsniveau:', average);
      interruptSpeaking();
    }
    
    if (isSpeaking) {
      interruptionDetectorRef.current = requestAnimationFrame(checkForInterruption);
    }
  };
  
  useEffect(() => {
    if (isSpeaking && analyserRef.current) {
      interruptionDetectorRef.current = requestAnimationFrame(checkForInterruption);
    } else if (!isSpeaking && interruptionDetectorRef.current) {
      cancelAnimationFrame(interruptionDetectorRef.current);
      interruptionDetectorRef.current = null;
    }
  }, [isSpeaking]);
  
  useEffect(() => {
    return () => {
      if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
        mediaRecorderRef.current.stop();
        
        if (mediaRecorderRef.current.stream) {
          mediaRecorderRef.current.stream.getTracks().forEach(track => track.stop());
        }
      }
      
      if (realtimeSessionRef.current) {
        realtimeSessionRef.current.close();
        realtimeSessionRef.current = null;
      }
      
      stopSilenceDetection();
      
      if (conversationTimeoutRef.current) {
        clearTimeout(conversationTimeoutRef.current);
      }
      
      if (audioContextRef.current && audioContextRef.current.state !== 'closed') {
        audioContextRef.current.close();
      }
    };
  }, []);
  
  useEffect(() => {
    if (inputRef.current) {
      inputRef.current.focus();
    }
  }, []);
  
  useEffect(() => {
    setConversationMode(true);
  }, []);
  
  const stopConversation = () => {
    console.log('Gesprek stoppen...');
    setConversationMode(false);
    
    if (isListening) {
      stopRecording();
    }
    
    if (window.speechSynthesis) {
      window.speechSynthesis.cancel();
    }
    
    const audioElements = document.getElementsByTagName('audio');
    for (let i = 0; i < audioElements.length; i++) {
      audioElements[i].pause();
      audioElements[i].currentTime = 0;
    }
    
    setIsSpeaking(false);
    setIsProcessing(false);
    setShowTranscript(false);
    setShowResponse(false);
    setTranscript('');
    setAiResponse('');
    setErrorMessage('');
    
    if (silenceTimeoutRef.current) {
      clearTimeout(silenceTimeoutRef.current);
      silenceTimeoutRef.current = null;
    }
    
    if (interruptionDetectorRef.current) {
      cancelAnimationFrame(interruptionDetectorRef.current);
      interruptionDetectorRef.current = null;
    }
    
    if (silenceDetectorRef.current) {
      cancelAnimationFrame(silenceDetectorRef.current);
      silenceDetectorRef.current = null;
    }
    
    console.log('Gesprek gestopt door gebruiker');
  };
  
  const speakResponse = async (response) => {
    try {
      const audioUrl = await textToSpeech(response);
      
      const audio = new Audio(audioUrl);
      audio.volume = volume / 100;
      audio.muted = isMuted;
      
      const allAudios = document.getElementsByTagName('audio');
      for (let i = 0; i < allAudios.length; i++) {
        if (allAudios[i] !== audio) {
          allAudios[i].pause();
          allAudios[i].currentTime = 0;
        }
      }
      
      if (window.speechSynthesis) {
        window.speechSynthesis.cancel();
      }
      
      audio.play();
      setIsSpeaking(true);
      
      audio.onended = () => {
        setIsSpeaking(false);
        
        if (conversationMode && !isProcessing) {
          startRecording();
        }
      };
      
      return audio;
    } catch (error) {
      console.error('Fout bij afspelen van spraak:', error);
      setIsSpeaking(false);
      setErrorMessage(`Fout bij afspelen van spraak: ${error.message}`);
      return null;
    }
  };
  
  const handleToggleMicrophone = () => {
    if (isListening) {
      stopRecording();
    } else {
      if (!conversationMode) {
        setConversationMode(true);
      }
      startRecording();
    }
  };
  
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
      
      <MicButton
        onClick={handleToggleMicrophone}
        disabled={isProcessing && !isListening}
        isListening={isListening}
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.9 }}
        title={isListening ? "Stop met luisteren" : "Start met luisteren"}
      >
        {isListening ? <FaStop size={65} /> : <BsSoundwave size={70} />}
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
      
      <AnimatePresence>
        {conversationMode && (
          <StopButton onClick={stopConversation} title="Gesprek stoppen">
            <FaTimes size={30} />
          </StopButton>
        )}
      </AnimatePresence>
      
      <TextInputContainer>
        <Input
          ref={inputRef}
          placeholder="Typ je bericht..."
          value={inputText}
          onChange={(e) => setInputText(e.target.value)}
          onKeyPress={handleKeyPress}
          disabled={isProcessing}
          expanded={expanded}
          onFocus={() => setExpanded(true)}
          onBlur={() => !inputText.trim() && setExpanded(false)}
        />
        <SendButton
          onClick={handleSendText}
          disabled={isProcessing || !inputText.trim()}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          expanded={expanded}
        >
          <FaPaperPlane size={30} />
        </SendButton>
      </TextInputContainer>
    </VoiceContainer>
  );
};

export default RealtimeVoiceInterface;
