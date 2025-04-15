import React, { useState, useEffect, useRef } from 'react';
import styled from '@emotion/styled';
import { motion, AnimatePresence } from 'framer-motion';
import { FaStop, FaVolumeUp, FaSpinner, FaVolumeMute, FaChevronUp, FaMicrophone, FaTimes } from 'react-icons/fa';
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

const StatusText = styled.div`
  position: absolute;
  bottom: -35px;
  left: 50%;
  transform: translateX(-50%);
  color: white;
  font-size: 14px;
  font-weight: 500;
  text-shadow: 0 1px 3px rgba(0, 0, 0, 0.5);
  background-color: rgba(0, 0, 0, 0.5);
  padding: 5px 10px;
  border-radius: 10px;
  white-space: nowrap;
`;

const VolumeWaves = styled.div`
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  border-radius: 50%;
  overflow: hidden;
  pointer-events: none;
  
  &::before, &::after {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    border: 2px solid rgba(255, 152, 0, 0.5);
    border-radius: 50%;
    animation: ${props => props.isListening ? 'pulse 2s infinite' : 'none'};
  }
  
  &::after {
    animation-delay: 0.5s;
  }
  
  @keyframes pulse {
    0% {
      transform: scale(1);
      opacity: 1;
    }
    100% {
      transform: scale(1.5);
      opacity: 0;
    }
  }
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
  const [isProcessing, setIsProcessing] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [aiResponse, setAiResponse] = useState('');
  const [showTranscript, setShowTranscript] = useState(false);
  const [showResponse, setShowResponse] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [volume, setVolume] = useState(80);
  const [isMuted, setIsMuted] = useState(false);
  const [conversationMode, setConversationMode] = useState(false);
  const [conversationHistory, setConversationHistory] = useState([]);
  const [manualStop, setManualStop] = useState(false);
  
  const mediaRecorderRef = useRef(null);
  const audioChunksRef = useRef([]);
  const lastSoundTimestampRef = useRef(Date.now());
  const silenceTimeoutRef = useRef(null);
  const audioContextRef = useRef(null);
  const analyserRef = useRef(null);
  const microphoneStreamRef = useRef(null);
  const dataArrayRef = useRef(null);
  const silenceDetectorRef = useRef(null);
  const interruptionDetectorRef = useRef(null);
  const conversationTimeoutRef = useRef(null);
  const realtimeSessionRef = useRef(null);
  
  const initAudioContext = async (stream) => {
    try {
      if (!audioContextRef.current) {
        audioContextRef.current = new (window.AudioContext || window.webkitAudioContext)();
      }
      
      analyserRef.current = audioContextRef.current.createAnalyser();
      analyserRef.current.fftSize = 256;
      
      const bufferLength = analyserRef.current.frequencyBinCount;
      dataArrayRef.current = new Uint8Array(bufferLength);
      
      const source = audioContextRef.current.createMediaStreamSource(stream);
      source.connect(analyserRef.current);
      
      microphoneStreamRef.current = stream;
      
      startSilenceDetection();
    } catch (error) {
      console.error('Fout bij initialiseren audio context:', error);
      setErrorMessage(`Fout bij initialiseren audio context: ${error.message}`);
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
        
        // Verhoog de stiltetijd naar 3500ms voor een natuurlijkere ervaring
        if (silenceDuration > 3500 && isListening && !silenceTimeoutRef.current) {
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
      setManualStop(true); // Markeer dat de opname handmatig is gestopt
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
      // Reset de manualStop variabele bij het starten van een nieuwe opname
      setManualStop(false);
      
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
            setManualStop(false); // Reset de manualStop variabele
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
            
            // Als er geen tekst is of als de opname handmatig is gestopt met weinig tekst, stop dan
            if (!transcription.trim() || (manualStop && transcription.trim().length < 5)) {
              console.log('Geen bruikbare tekst gedetecteerd of handmatig gestopt met weinig tekst');
              setIsProcessing(false);
              setManualStop(false); // Reset de manualStop variabele
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
            setManualStop(false); // Reset de manualStop variabele
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
  
  const getSoundLevelStyle = () => {
    if (!isListening) return {};
    
    // Bereken een pulserende animatie gebaseerd op het geluidsniveau
    const scale = 1 + (dataArrayRef.current ? Math.min(0.3, getAverageVolume() / 100) : 0);
    
    return {
      transform: `scale(${scale})`,
      boxShadow: `0 0 ${scale * 20}px rgba(255, 152, 0, ${scale * 0.5})`
    };
  };
  
  const getAverageVolume = () => {
    if (!analyserRef.current || !dataArrayRef.current) return 0;
    
    analyserRef.current.getByteFrequencyData(dataArrayRef.current);
    let sum = 0;
    for (let i = 0; i < dataArrayRef.current.length; i++) {
      sum += dataArrayRef.current[i];
    }
    return sum / dataArrayRef.current.length;
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
        style={getSoundLevelStyle()}
      >
        <VolumeWaves isListening={isListening} />
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
    </VoiceContainer>
  );
};

export default RealtimeVoiceInterface;
