import React, { useState, useEffect, useRef } from 'react';
import styled from '@emotion/styled';
import { motion, AnimatePresence } from 'framer-motion';
import { FaMicrophone, FaStop, FaVolumeUp, FaPaperPlane, FaKeyboard, FaSpinner } from 'react-icons/fa';
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
  position: relative;
  
  &:hover {
    background-color: ${props => props.isListening ? '#F57C00' : 'rgba(255, 255, 255, 0.9)'};
  }
  
  &:focus {
    outline: none;
  }
`;

const StatusIndicator = styled.div`
  position: absolute;
  top: -8px;
  right: -8px;
  width: 16px;
  height: 16px;
  border-radius: 50%;
  background-color: ${props => {
    if (props.isProcessing) return '#3498db'; // Blauw voor verwerken
    if (props.isSpeaking) return '#e74c3c';  // Rood voor spreken
    if (props.isListening) return '#2ecc71'; // Groen voor luisteren
    return 'transparent';
  }};
  border: 2px solid white;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
  transition: background-color 0.3s ease;
`;

const StatusText = styled.div`
  position: absolute;
  bottom: -25px;
  right: 0;
  font-size: 0.7rem;
  background-color: rgba(0, 0, 0, 0.7);
  color: white;
  padding: 2px 6px;
  border-radius: 10px;
  white-space: nowrap;
`;

const AudioLevelIndicator = styled.div`
  position: absolute;
  bottom: -5px;
  left: -5px;
  width: 60px;
  height: 60px;
  border-radius: 50%;
  border: 2px solid ${props => props.isListening ? '#2ecc71' : 'transparent'};
  opacity: ${props => props.isListening ? 0.7 : 0};
  transform: scale(${props => 1 + Math.min(props.level / 100, 0.5)});
  transition: transform 0.1s ease, opacity 0.3s ease;
  pointer-events: none;
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

const SpinnerIcon = styled(motion.div)`
  display: inline-block;
  margin-right: 5px;
`;

const RecordButton = styled(motion.button)`
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
  
  &:focus {
    outline: none;
  }
`;

const ModeToggle = styled(motion.button)`
  background-color: ${props => props.isContinuous ? '#FF9800' : 'rgba(255, 255, 255, 0.7)'};
  border: none;
  display: flex;
  justify-content: center;
  align-items: center;
  cursor: pointer;
  box-shadow: 0 4px 10px rgba(0, 0, 0, 0.1);
  color: ${props => props.isContinuous ? 'white' : '#333'};
  font-size: 0.9rem;
  transition: background-color 0.3s ease;
  padding: 0.5rem 1rem;
  border-radius: 25px;
  
  &:hover {
    background-color: ${props => props.isContinuous ? '#F57C00' : 'rgba(255, 255, 255, 0.9)'};
  }
  
  &:focus {
    outline: none;
  }
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
  
  &:hover {
    background-color: rgba(255, 255, 255, 0.9);
  }
  
  &:focus {
    outline: none;
  }
`;

const MockVoiceInterface = ({ onCommand }) => {
  const [isListening, setIsListening] = useState(false);
  const [isContinuousMode, setIsContinuousMode] = useState(true); 
  const [feedback, setFeedback] = useState('');
  const [showTextInput, setShowTextInput] = useState(false);
  const [inputText, setInputText] = useState('');
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [audioElement, setAudioElement] = useState(null);
  const [mediaRecorder, setMediaRecorder] = useState(null);
  const [audioChunks, setAudioChunks] = useState([]);
  const [silenceTimer, setSilenceTimer] = useState(null);
  const [lastAudioLevel, setLastAudioLevel] = useState(0);
  const [isProcessing, setIsProcessing] = useState(false);
  const [statusMessage, setStatusMessage] = useState('');
  const inputRef = useRef(null);
  const audioContextRef = useRef(null);
  const analyserRef = useRef(null);
  const streamRef = useRef(null);
  
  const { orbStatus, mockTasks, processCommand } = useAppContext();
  
  // Focus op het tekstinvoerveld wanneer het wordt weergegeven
  useEffect(() => {
    if (showTextInput && inputRef.current) {
      inputRef.current.focus();
    }
  }, [showTextInput]);
  
  // Initialiseer de mediaRecorder en start automatisch met luisteren
  useEffect(() => {
    let isActive = true;
    
    // Start automatisch met luisteren als de component wordt geladen
    if (isContinuousMode) {
      startContinuousListening();
    }
    
    // Cleanup functie voor als de component unmount
    return () => {
      isActive = false;
      cleanupAudioResources();
    };
  }, [isContinuousMode]);
  
  // Cleanup audio resources
  const cleanupAudioResources = () => {
    console.log('Cleaning up audio resources');
    try {
      // Stop de mediaRecorder als deze nog bezig is
      if (mediaRecorder && mediaRecorder.state === 'recording') {
        try {
          mediaRecorder.stop();
        } catch (err) {
          console.error('Fout bij stoppen mediaRecorder:', err);
        }
      }
      
      // Stop eventuele lopende audio
      if (audioElement) {
        try {
          audioElement.pause();
          audioElement.src = '';
        } catch (err) {
          console.error('Fout bij stoppen audio element:', err);
        }
      }
      
      // Wis eventuele timers
      if (silenceTimer) {
        clearTimeout(silenceTimer);
        setSilenceTimer(null);
      }
      
      // Stop alle tracks in de mediaStream
      if (streamRef.current) {
        try {
          const tracks = streamRef.current.getTracks();
          tracks.forEach(track => {
            try {
              track.stop();
            } catch (err) {
              console.error('Fout bij stoppen track:', err);
            }
          });
          streamRef.current = null;
        } catch (err) {
          console.error('Fout bij stoppen mediaStream:', err);
        }
      }
      
      // Sluit de AudioContext als deze nog open is
      if (audioContextRef.current) {
        try {
          // Controleer eerst de status
          if (audioContextRef.current.state !== 'closed') {
            audioContextRef.current.close()
              .then(() => console.log('AudioContext succesvol gesloten'))
              .catch(err => console.error('Fout bij sluiten audioContext:', err));
          } else {
            console.log('AudioContext was al gesloten');
          }
        } catch (err) {
          console.error('Fout bij toegang tot audioContext:', err);
        } finally {
          audioContextRef.current = null;
        }
      }
      
      // Reset de state
      setIsListening(false);
      setIsProcessing(false);
      setIsSpeaking(false);
      setAudioChunks([]);
    } catch (err) {
      console.error('Algemene fout bij cleanup:', err);
    }
  };
  
  // Start continue luisteren modus
  const startContinuousListening = async () => {
    try {
      // Maak eerst schoon om dubbele resources te voorkomen
      cleanupAudioResources();
      
      console.log('Start continue luisteren modus...');
      
      // Vraag toestemming voor microfoon
      const stream = await navigator.mediaDevices.getUserMedia({ 
        audio: { 
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true
        } 
      });
      
      console.log('Microfoon toegang verkregen');
      
      // Sla de stream op in de ref
      streamRef.current = stream;
      
      // Maak een nieuwe AudioContext
      try {
        const audioContext = new (window.AudioContext || window.webkitAudioContext)();
        audioContextRef.current = audioContext;
        
        const analyser = audioContext.createAnalyser();
        analyser.fftSize = 256;
        analyserRef.current = analyser;
        
        const source = audioContext.createMediaStreamSource(stream);
        source.connect(analyser);
        
        console.log('AudioContext en analyser opgezet');
        
        // Start met luisteren naar geluidsniveaus
        monitorAudioLevels();
      } catch (err) {
        console.error('Fout bij maken van AudioContext:', err);
      }
      
      // Maak een nieuwe MediaRecorder
      try {
        // Controleer welke MIME types ondersteund worden
        const supportedTypes = ['audio/webm', 'audio/webm;codecs=opus', 'audio/ogg;codecs=opus', 'audio/mp4'];
        let selectedType = '';
        
        for (const type of supportedTypes) {
          if (MediaRecorder.isTypeSupported(type)) {
            selectedType = type;
            console.log('Ondersteund MIME type gevonden:', type);
            break;
          }
        }
        
        if (!selectedType) {
          console.warn('Geen ondersteund MIME type gevonden, gebruik standaard type');
          selectedType = 'audio/webm';
        }
        
        // Maak recorder met ondersteund type
        const recorder = new MediaRecorder(stream, { mimeType: selectedType });
        console.log('MediaRecorder aangemaakt met MIME type:', recorder.mimeType);
        
        // Configureer de event handlers
        recorder.ondataavailable = (e) => {
          console.log('Data beschikbaar event ontvangen, grootte:', e.data.size, 'bytes');
          if (e.data && e.data.size > 0) {
            setAudioChunks((chunks) => {
              const newChunks = [...chunks, e.data];
              console.log('AudioChunks bijgewerkt, aantal chunks:', newChunks.length);
              return newChunks;
            });
          }
        };
        
        recorder.onstart = () => {
          console.log('MediaRecorder gestart');
        };
        
        recorder.onerror = (event) => {
          console.error('MediaRecorder fout:', event.error);
        };
        
        recorder.onstop = async () => {
          console.log('MediaRecorder gestopt, verwerking starten...');
          console.log('AudioChunks beschikbaar:', audioChunks.length);
          
          // Voorkom dat de verwerking wordt gestart als we al aan het verwerken zijn
          if (!isProcessing && audioChunks.length > 0) {
            console.log('Verwerking van opgenomen audio starten...');
            await processRecordedAudio();
          } else {
            console.log('Geen verwerking gestart: isProcessing =', isProcessing, 'audioChunks.length =', audioChunks.length);
          }
        };
        
        setMediaRecorder(recorder);
        setIsListening(true);
        
        // Start de recorder
        startRecording(recorder);
      } catch (err) {
        console.error('Fout bij maken van MediaRecorder:', err);
      }
    } catch (error) {
      console.error('Fout bij het starten van continue luisteren:', error);
      setFeedback('Kon de microfoon niet gebruiken. Controleer je browser-instellingen.');
      setTimeout(() => setFeedback(''), 3000);
    }
  };
  
  // Update status message based on state
  useEffect(() => {
    if (isProcessing) {
      setStatusMessage('Verwerken...');
    } else if (isSpeaking) {
      setStatusMessage('Spreekt...');
    } else if (isListening) {
      setStatusMessage('Luistert...');
    } else {
      setStatusMessage('');
    }
  }, [isProcessing, isSpeaking, isListening]);
  
  // Monitor geluidsniveaus om te detecteren wanneer iemand spreekt
  const monitorAudioLevels = () => {
    if (!analyserRef.current || !audioContextRef.current) return;
    
    const analyser = analyserRef.current;
    const dataArray = new Uint8Array(analyser.frequencyBinCount);
    
    // Bijhouden van spraakactiviteit
    let speechDetected = false;
    let speechStartTime = 0;
    let consecutiveSilenceFrames = 0;
    
    const checkAudioLevel = () => {
      if (!analyserRef.current) return;
      
      analyser.getByteFrequencyData(dataArray);
      
      // Bereken gemiddeld geluidsniveau
      let sum = 0;
      for (let i = 0; i < dataArray.length; i++) {
        sum += dataArray[i];
      }
      const average = sum / dataArray.length;
      setLastAudioLevel(average);
      
      // Detecteer stilte (lage geluidsniveaus)
      if (isListening && !isProcessing && !isSpeaking) {
        // Spraak gedetecteerd (boven drempelwaarde)
        if (average > 12) { 
          // Als we nog niet aan het opnemen waren, markeer begin van spraak
          if (!speechDetected) {
            speechDetected = true;
            speechStartTime = Date.now();
            console.log('Spraak gedetecteerd, begin opname');
          }
          
          // Reset stilteteller
          consecutiveSilenceFrames = 0;
          
          // Reset de silence timer als die actief is
          if (silenceTimer) {
            clearTimeout(silenceTimer);
            setSilenceTimer(null);
          }
        } else {
          // Stilte gedetecteerd
          consecutiveSilenceFrames++;
          
          // Als we spraak hadden gedetecteerd en nu een korte stilte hebben (0.7 seconden)
          // EN er is al minstens 1 seconde spraak opgenomen
          if (speechDetected && 
              consecutiveSilenceFrames > 30 && // ongeveer 0.7 seconden stilte (30 frames bij 60fps)
              Date.now() - speechStartTime > 1000 && // minstens 1 seconde spraak
              !silenceTimer && 
              mediaRecorder && 
              mediaRecorder.state === 'recording' && 
              audioChunks.length > 0) {
            
            // Start een timer om te controleren of de gebruiker klaar is met spreken
            console.log('Stilte gedetecteerd na spraak, stop opname binnenkort');
            const timer = setTimeout(() => {
              if (mediaRecorder && mediaRecorder.state === 'recording') {
                console.log('Opname stoppen na stiltedetectie');
                stopRecording();
              }
            }, 300); // Verkort naar 300ms voor snellere reactie
            
            setSilenceTimer(timer);
          }
        }
      }
      
      // Blijf monitoren
      requestAnimationFrame(checkAudioLevel);
    };
    
    checkAudioLevel();
  };
  
  // Start de opname van audio
  const startRecording = (recorder = mediaRecorder) => {
    if (!recorder || recorder.state === 'recording') return;
    
    console.log('Start opname met mediaRecorder...');
    setAudioChunks([]);
    
    // Zorg ervoor dat ondataavailable vaak genoeg wordt aangeroepen
    try {
      // Gebruik een kleinere timeslice (50ms) om vaker ondataavailable events te krijgen
      recorder.start(50);
      console.log('MediaRecorder gestart met timeslice van 50ms');
    } catch (err) {
      console.error('Fout bij starten van mediaRecorder:', err);
      return;
    }
    
    setIsListening(true);
    
    if (!isContinuousMode) {
      setFeedback('Luisteren...');
    }
  };
  
  // Stop de opname van audio
  const stopRecording = () => {
    if (mediaRecorder && mediaRecorder.state === 'recording') {
      console.log('Opname stoppen en verwerken...');
      mediaRecorder.stop();
      setIsListening(false);
      
      if (silenceTimer) {
        clearTimeout(silenceTimer);
        setSilenceTimer(null);
      }
      
      if (!isProcessing) {
        setFeedback('Verwerken van je spraak...');
      }
    }
  };
  
  // Toggle tussen continue luisteren en handmatige modus
  const toggleContinuousMode = () => {
    if (isContinuousMode) {
      // Schakel continue modus uit
      setIsContinuousMode(false);
      cleanupAudioResources();
    } else {
      // Schakel continue modus in
      setIsContinuousMode(true);
      startContinuousListening();
    }
  };
  
  // Handmatige knop voor opname starten/stoppen
  const handleRecordButtonClick = () => {
    if (isProcessing || isSpeaking) return;
    
    console.log('Record button clicked');
    
    if (isListening) {
      // Als we al aan het luisteren zijn, stop dan met opnemen
      console.log('Stoppen met opnemen...');
      stopRecording();
    } else {
      // Anders start met opnemen
      if (isContinuousMode) {
        // In continue modus, start direct met luisteren
        console.log('Starten met opnemen in continue modus...');
        startContinuousListening();
      } else {
        // In handmatige modus, start alleen de opname
        if (mediaRecorder && streamRef.current) {
          console.log('Starten met opnemen...');
          startRecording();
        } else {
          // Als er nog geen mediaRecorder is, maak deze dan eerst aan
          console.log('Maak mediaRecorder aan en start opname...');
          startContinuousListening();
        }
      }
    }
    console.log('Record button clicked');
  };
  
  // Toggle de microfoon
  const handleToggleMicrophone = () => {
    if (isProcessing || isSpeaking) return;
    
    console.log('Microfoon toggle aangeroepen');
    
    if (isListening) {
      // Als we al aan het luisteren zijn, stop dan met opnemen
      console.log('Stoppen met opnemen...');
      stopRecording();
    } else {
      // Anders start met opnemen
      if (isContinuousMode) {
        // In continue modus, start direct met luisteren
        console.log('Starten met opnemen in continue modus...');
        startContinuousListening();
      } else {
        // In handmatige modus, start alleen de opname
        if (mediaRecorder && streamRef.current) {
          console.log('Starten met opnemen...');
          startRecording();
        } else {
          // Als er nog geen mediaRecorder is, maak deze dan eerst aan
          console.log('Maak mediaRecorder aan en start opname...');
          startContinuousListening();
        }
      }
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
    setIsProcessing(true);
    
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
      await playAudio(result.audioUrl);
      
      // Reset de input
      setInputText('');
      
      // Reset na een tijdje
      setTimeout(() => {
        setFeedback('');
        setShowTextInput(false);
        setIsProcessing(false);
        
        // Start opnieuw met luisteren in continue modus
        if (isContinuousMode && mediaRecorder) {
          startRecording();
        }
      }, 1000);
    } catch (error) {
      console.error('Fout bij het verwerken van tekst:', error);
      setFeedback('Er is een fout opgetreden bij het verwerken van je bericht.');
      setIsProcessing(false);
      setTimeout(() => {
        setFeedback('');
      }, 3000);
    }
  };
  
  // Handle key press in text input
  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !isProcessing) {
      handleTextSubmit();
    }
  };
  
  // Render een spinner voor de laadstatus
  const renderSpinner = () => (
    <SpinnerIcon
      animate={{ rotate: 360 }}
      transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
    >
      <FaSpinner />
    </SpinnerIcon>
  );
  
  // Verwerk de opgenomen audio
  const processRecordedAudio = async () => {
    // Voorkom dubbele verwerking of verwerking zonder audio
    if (isProcessing) {
      console.log('Verwerking al bezig, nieuwe verwerking overgeslagen');
      return;
    }
    
    if (audioChunks.length === 0) {
      console.log('Geen audiochunks beschikbaar, verwerking overgeslagen');
      return;
    }
    
    console.log('Start verwerking van opgenomen audio, aantal chunks:', audioChunks.length);
    setIsProcessing(true);
    
    try {
      // Maak een lokale kopie van de audioChunks om race conditions te voorkomen
      const currentAudioChunks = [...audioChunks];
      console.log('Lokale kopie van audioChunks gemaakt, aantal:', currentAudioChunks.length);
      
      // Maak een File object van de opgenomen audiochunks
      const audioFile = new File(currentAudioChunks, 'audio.webm', { type: 'audio/webm' });
      
      console.log('Audio File object gemaakt, type:', audioFile.type, 'grootte:', audioFile.size, 'bytes');
      
      // Debug: Log de eerste paar bytes van de file
      const reader = new FileReader();
      reader.onload = () => {
        const arrayBuffer = reader.result;
        const bytes = new Uint8Array(arrayBuffer);
        console.log('Eerste 20 bytes van audio file:', Array.from(bytes.slice(0, 20)));
      };
      reader.readAsArrayBuffer(audioFile);
      
      // Verwerk de audio alleen als de file groot genoeg is (om lege opnames te voorkomen)
      if (audioFile.size < 1000) {
        console.warn('Audio opname te klein, waarschijnlijk geen spraak');
        setIsProcessing(false);
        
        // Start opnieuw met luisteren in continue modus
        if (isContinuousMode && mediaRecorder) {
          startRecording();
        }
        
        return;
      }
      
      // Verwerk de audio met de speech-to-speech functie
      setFeedback('Verwerken van je spraak...');
      
      // In plaats van echte verwerking, gebruik de mock-taken uit de context
      const { mockTasks, processCommand } = useAppContext();
      
      // Simuleer transcriptie met een vertraging
      setTimeout(async () => {
        // Simuleer een transcriptie
        const mockTranscription = textInput || "Wat staat er vandaag op de agenda?";
        console.log('Gesimuleerde transcriptie:', mockTranscription);
        
        // Verwerk het commando via de context
        const result = processCommand(mockTranscription);
        
        // Toon de transcriptie en het antwoord
        setFeedback(`Jij: "${mockTranscription}"
AI: "${result.response}"`);
        
        // Speel het antwoord af
        if (result.audioUrl) {
          await playAudio(result.audioUrl);
        } else {
          // Als er geen audio URL is, gebruik de OpenAI TTS API
          const audioUrl = await textToSpeech(result.response);
          await playAudio(audioUrl);
        }
        
        // Reset na een tijdje
        setTimeout(() => {
          setFeedback('');
          setIsProcessing(false);
          
          // Start opnieuw met luisteren in continue modus
          if (isContinuousMode && mediaRecorder) {
            startRecording();
          }
        }, 1000);
      }, 1500); // Simuleer vertraging van 1.5 seconden voor transcriptie
      
    } catch (error) {
      console.error('Fout bij het verwerken van de opgenomen audio:', error);
      console.error('Details van de fout:', error.message, error.stack);
      setFeedback('Er is een fout opgetreden bij het verwerken van je spraak.');
      
      setTimeout(() => {
        setFeedback('');
        setIsProcessing(false);
        
        // Start opnieuw met luisteren in continue modus
        if (isContinuousMode && mediaRecorder) {
          startRecording();
        }
      }, 3000);
    }
  };

  // Verwerk tekst input
  const handleTextSubmit = () => {
    if (!inputText.trim() || isProcessing) return;
    
    setIsProcessing(true);
    setFeedback('Verwerken van je bericht...');
    
    // Gebruik de mock-taken uit de context
    const { processCommand } = useAppContext();
    
    // Simuleer verwerking met een vertraging
    setTimeout(async () => {
      try {
        // Verwerk het commando via de context
        const result = processCommand(inputText);
        
        // Toon de transcriptie en het antwoord
        setFeedback(`Jij: "${inputText}"
AI: "${result.response}"`);
        
        // Speel het antwoord af
        if (result.audioUrl) {
          await playAudio(result.audioUrl);
        } else {
          // Als er geen audio URL is, gebruik de OpenAI TTS API
          const audioUrl = await textToSpeech(result.response);
          await playAudio(audioUrl);
        }
        
        // Reset invoerveld
        setInputText('');
        
        // Reset na een tijdje
        setTimeout(() => {
          setFeedback('');
          setIsProcessing(false);
        }, 1000);
      } catch (error) {
        console.error('Fout bij het verwerken van tekstinvoer:', error);
        setFeedback('Er is een fout opgetreden bij het verwerken van je bericht.');
        
        setTimeout(() => {
          setFeedback('');
          setIsProcessing(false);
        }, 3000);
      }
    }, 1000);
  };

  // Demo functie om automatisch een vooraf gedefinieerde taak te tonen
  const showRandomTask = () => {
    if (isProcessing || isSpeaking) return;
    
    // Haal de mock-taken op uit de context
    const { mockTasks } = useAppContext();
    
    // Kies een willekeurige taak
    const randomIndex = Math.floor(Math.random() * mockTasks.length);
    const randomTask = mockTasks[randomIndex];
    
    // Simuleer dat de gebruiker deze taak heeft gevraagd
    setInputText(randomTask.command);
    
    // Verwerk de taak
    setTimeout(() => {
      handleTextSubmit();
    }, 500);
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
            {isProcessing && renderSpinner()}
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
            <SendButton onClick={handleTextSubmit} whileTap={{ scale: 0.9 }}>
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
        
        <RecordButton 
          onClick={handleRecordButtonClick}
          disabled={isProcessing || isSpeaking}
          isListening={isListening}
          isProcessing={isProcessing}
          isSpeaking={isSpeaking}
          lastAudioLevel={lastAudioLevel}
        >
          {isListening ? <FaStop /> : <FaMicrophone />}
          <StatusIndicator 
            isListening={isListening} 
            isProcessing={isProcessing} 
            isSpeaking={isSpeaking} 
          />
          <AudioLevelIndicator 
            isListening={isListening} 
            level={lastAudioLevel} 
          />
          {statusMessage && <StatusText>{statusMessage}</StatusText>}
        </RecordButton>
        
        <DemoButton 
          onClick={showRandomTask}
          disabled={isProcessing || isSpeaking}
          whileTap={{ scale: 0.9 }}
        >
          Demo Taak
        </DemoButton>
        
        <ModeToggle 
          onClick={() => toggleContinuousMode()}
          isContinuous={isContinuousMode}
          disabled={isProcessing || isSpeaking}
        >
          {isContinuousMode ? 'Continue modus' : 'Handmatige modus'}
        </ModeToggle>
      </ButtonsContainer>
    </VoiceContainer>
  );
};

export default MockVoiceInterface;
