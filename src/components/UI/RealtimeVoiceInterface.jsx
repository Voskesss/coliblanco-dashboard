import React, { useState, useEffect, useRef } from 'react';
import styled from '@emotion/styled';
import { motion, AnimatePresence } from 'framer-motion';
import { FaStop, FaVolumeUp, FaPaperPlane, FaSpinner, FaVolumeMute, FaChevronUp, FaMicrophone } from 'react-icons/fa';
import { BsSoundwave } from 'react-icons/bs';
import { textToSpeech, processWithLLM, transcribeAudio } from '../../utils/openai';

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

const RealtimeVoiceInterface = ({ orbStatus, processCommand }) => {
  const [isListening, setIsListening] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [inputText, setInputText] = useState('');
  const [volume, setVolume] = useState(80);
  const [isMuted, setIsMuted] = useState(false);
  const [aiResponse, setAiResponse] = useState('');
  const [showTranscript, setShowTranscript] = useState(false);
  const [showResponse, setShowResponse] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [conversationMode, setConversationMode] = useState(false);
  const [expanded, setExpanded] = useState(false);
  
  const inputRef = useRef(null);
  const mediaRecorderRef = useRef(null);
  const audioChunksRef = useRef([]);
  const conversationTimeoutRef = useRef(null);
  const silenceDetectorRef = useRef(null);
  const audioContextRef = useRef(null);
  const analyserRef = useRef(null);
  const silenceTimeoutRef = useRef(null);
  const lastSoundTimestampRef = useRef(Date.now());
  
  // Functie om de AudioContext te initialiseren voor stiltedetectie
  const initAudioContext = async (stream) => {
    try {
      // Maak een nieuwe AudioContext als die nog niet bestaat
      if (!audioContextRef.current) {
        audioContextRef.current = new (window.AudioContext || window.webkitAudioContext)();
      }
      
      // Maak een analyser node
      analyserRef.current = audioContextRef.current.createAnalyser();
      analyserRef.current.fftSize = 256;
      analyserRef.current.smoothingTimeConstant = 0.8;
      
      // Maak een source node van de stream
      const source = audioContextRef.current.createMediaStreamSource(stream);
      source.connect(analyserRef.current);
      
      // Start de stiltedetectie
      startSilenceDetection();
    } catch (error) {
      console.error('Fout bij initialiseren AudioContext:', error);
    }
  };
  
  // Functie om stiltedetectie te starten
  const startSilenceDetection = () => {
    if (!analyserRef.current) return;
    
    const bufferLength = analyserRef.current.frequencyBinCount;
    const dataArray = new Uint8Array(bufferLength);
    
    // Functie om het geluidsniveau te controleren
    const checkSoundLevel = () => {
      if (!analyserRef.current || !isListening) return;
      
      analyserRef.current.getByteFrequencyData(dataArray);
      
      // Bereken het gemiddelde geluidsniveau
      let sum = 0;
      for (let i = 0; i < bufferLength; i++) {
        sum += dataArray[i];
      }
      const average = sum / bufferLength;
      
      // Log het geluidsniveau voor debugging
      console.log('Geluidsniveau:', average);
      
      // Als het geluidsniveau boven een drempelwaarde is, update de timestamp
      if (average > 3) { // Verlaagde drempelwaarde voor geluid
        lastSoundTimestampRef.current = Date.now();
        
        // Clear bestaande timeout als die er is
        if (silenceTimeoutRef.current) {
          clearTimeout(silenceTimeoutRef.current);
          silenceTimeoutRef.current = null;
        }
      } else {
        // Als het stil is, controleer hoe lang het al stil is
        const silenceDuration = Date.now() - lastSoundTimestampRef.current;
        
        // Als het langer dan 800ms stil is, stop met luisteren
        if (silenceDuration > 800 && isListening && !silenceTimeoutRef.current) {
          console.log('Stilte gedetecteerd, stoppen met luisteren over 0.3s...');
          silenceTimeoutRef.current = setTimeout(() => {
            console.log('Stilte bevestigd, stoppen met luisteren...');
            stopRecording();
            silenceTimeoutRef.current = null;
          }, 300); // Wacht nog een korte tijd om zeker te zijn
        }
      }
      
      // Blijf controleren
      silenceDetectorRef.current = requestAnimationFrame(checkSoundLevel);
    };
    
    // Start de controle
    silenceDetectorRef.current = requestAnimationFrame(checkSoundLevel);
  };
  
  // Functie om stiltedetectie te stoppen
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
  
  // Functie om de microfoon te activeren en te beginnen met opnemen
  const startRecording = async () => {
    try {
      // Vraag toestemming voor de microfoon
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      
      // Initialiseer de AudioContext voor stiltedetectie
      await initAudioContext(stream);
      
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
        
        // Stop de stiltedetectie
        stopSilenceDetection();
        
        try {
          // Maak een blob van de opgenomen audio chunks
          const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
          
          // Controleer of er daadwerkelijk audio is opgenomen
          if (audioBlob.size < 1000) {
            console.warn('Geen audio opgenomen of te korte opname');
            setIsProcessing(false);
            
            // Als we in gespreksmodus zijn, begin automatisch weer met luisteren
            if (conversationMode) {
              startNextListening();
            }
            return;
          }
          
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
          const voiceInstructions = "Personality/affect: a high-energy cheerleader helping with administrative tasks \n\nVoice: Enthusiastic, and bubbly, with an uplifting and motivational quality.\n\nTone: Encouraging and playful, making even simple tasks feel exciting and fun.\n\nDialect: Casual and upbeat Dutch, using informal phrasing and pep talk-style expressions.\n\nPronunciation: Crisp and lively, with exaggerated emphasis on positive words to keep the energy high.\n\nFeatures: Uses motivational phrases, cheerful exclamations, and an energetic rhythm to create a sense of excitement and engagement.";
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
            
            // Als we in gespreksmodus zijn, begin automatisch weer met luisteren
            if (conversationMode && !isSpeaking) {
              startNextListening();
            }
          };
          
          // Verwerk het commando als er een is
          if (processCommand) {
            processCommand(response);
          }
        } catch (error) {
          console.error('Fout bij verwerken van opname:', error);
          setErrorMessage(`Fout bij verwerken van opname: ${error.message}`);
          setIsProcessing(false);
          
          // Als we in gespreksmodus zijn, begin automatisch weer met luisteren na een fout
          if (conversationMode) {
            startNextListening();
          }
        }
      };
      
      // Start de opname
      mediaRecorder.start();
      setIsListening(true);
      setErrorMessage('');
      console.log('Opname gestart');
      
      // Reset de laatste geluidstimestamp
      lastSoundTimestampRef.current = Date.now();
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
      
      // Stop de stiltedetectie
      stopSilenceDetection();
      
      // Stop alle tracks in de stream
      if (mediaRecorderRef.current.stream) {
        mediaRecorderRef.current.stream.getTracks().forEach(track => track.stop());
      }
    }
  };
  
  // Functie om de volgende luistersessie te starten in gespreksmodus
  const startNextListening = () => {
    // Wacht even voordat we weer beginnen met luisteren
    if (conversationTimeoutRef.current) {
      clearTimeout(conversationTimeoutRef.current);
    }
    
    conversationTimeoutRef.current = setTimeout(() => {
      if (conversationMode && !isListening && !isSpeaking && !isProcessing) {
        startRecording();
      }
    }, 1000); // Wacht 1 seconde voordat we weer beginnen met luisteren
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
  
  // Functie om de gespreksmodus te togglen
  const handleToggleConversationMode = () => {
    const newMode = !conversationMode;
    setConversationMode(newMode);
    
    if (newMode) {
      // Als we gespreksmodus aanzetten en niet al aan het luisteren zijn, begin met luisteren
      if (!isListening && !isSpeaking && !isProcessing) {
        // Reset voor een nieuwe conversatie
        setAiResponse('');
        setTranscript('');
        setShowTranscript(false);
        setShowResponse(false);
        setErrorMessage('');
        
        // Start met opnemen
        startRecording();
      }
    } else {
      // Als we gespreksmodus uitzetten, stop met luisteren als we aan het luisteren zijn
      if (isListening) {
        stopRecording();
      }
      
      // Clear any pending timeouts
      if (conversationTimeoutRef.current) {
        clearTimeout(conversationTimeoutRef.current);
      }
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
      const voiceInstructions = "Personality/affect: a high-energy cheerleader helping with administrative tasks \n\nVoice: Enthusiastic, and bubbly, with an uplifting and motivational quality.\n\nTone: Encouraging and playful, making even simple tasks feel exciting and fun.\n\nDialect: Casual and upbeat Dutch, using informal phrasing and pep talk-style expressions.\n\nPronunciation: Crisp and lively, with exaggerated emphasis on positive words to keep the energy high.\n\nFeatures: Uses motivational phrases, cheerful exclamations, and an energetic rhythm to create a sense of excitement and engagement.";
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
        
        // Als we in gespreksmodus zijn, begin automatisch weer met luisteren
        if (conversationMode) {
          startNextListening();
        }
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
  
  // Functie om het tekstinvoerveld te vergroten/verkleinen
  const toggleExpanded = () => {
    setExpanded(!expanded);
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
      
      // Stop de stiltedetectie
      stopSilenceDetection();
      
      // Clear any pending timeouts
      if (conversationTimeoutRef.current) {
        clearTimeout(conversationTimeoutRef.current);
      }
      
      // Sluit de AudioContext
      if (audioContextRef.current && audioContextRef.current.state !== 'closed') {
        audioContextRef.current.close();
      }
    };
  }, []);
  
  // Focus op het tekstinvoerveld wanneer het wordt weergegeven
  useEffect(() => {
    if (inputRef.current) {
      inputRef.current.focus();
    }
  }, []);
  
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
