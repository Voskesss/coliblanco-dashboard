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
  const inputRef = useRef(null);
  const audioContextRef = useRef(null);
  const analyserRef = useRef(null);
  const streamRef = useRef(null);
  
  const { orbStatus } = useAppContext();
  
  useEffect(() => {
    if (showTextInput && inputRef.current) {
      inputRef.current.focus();
    }
  }, [showTextInput]);
  
  useEffect(() => {
    if (isContinuousMode) {
      startContinuousListening();
    }
    
    return () => {
      cleanupAudioResources();
    };
  }, [isContinuousMode]);
  
  const cleanupAudioResources = () => {
    if (mediaRecorder && mediaRecorder.state === 'recording') {
      mediaRecorder.stop();
    }
    
    if (audioElement) {
      audioElement.pause();
      audioElement.src = '';
    }
    
    if (silenceTimer) {
      clearTimeout(silenceTimer);
    }
    
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
    }
    
    if (audioContextRef.current) {
      audioContextRef.current.close().catch(err => console.error('Fout bij sluiten audioContext:', err));
    }
  };
  
  const startContinuousListening = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ 
        audio: { 
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true
        } 
      });
      
      streamRef.current = stream;
      
      const audioContext = new (window.AudioContext || window.webkitAudioContext)();
      audioContextRef.current = audioContext;
      
      const analyser = audioContext.createAnalyser();
      analyser.fftSize = 256;
      analyserRef.current = analyser;
      
      const source = audioContext.createMediaStreamSource(stream);
      source.connect(analyser);
      
      monitorAudioLevels();
      
      const recorder = new MediaRecorder(stream);
      
      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) {
          setAudioChunks((chunks) => [...chunks, e.data]);
        }
      };
      
      recorder.onstop = async () => {
        if (!isProcessing && audioChunks.length > 0) {
          await processRecordedAudio();
        }
      };
      
      setMediaRecorder(recorder);
      setIsListening(true);
      
      startRecording(recorder);
      
    } catch (error) {
      console.error('Fout bij het starten van continue luisteren:', error);
      setFeedback('Kon de microfoon niet gebruiken. Controleer je browser-instellingen.');
      setTimeout(() => setFeedback(''), 3000);
    }
  };
  
  const monitorAudioLevels = () => {
    if (!analyserRef.current || !audioContextRef.current) return;
    
    const analyser = analyserRef.current;
    const dataArray = new Uint8Array(analyser.frequencyBinCount);
    
    const checkAudioLevel = () => {
      if (!analyserRef.current) return;
      
      analyser.getByteFrequencyData(dataArray);
      
      let sum = 0;
      for (let i = 0; i < dataArray.length; i++) {
        sum += dataArray[i];
      }
      const average = sum / dataArray.length;
      setLastAudioLevel(average);
      
      if (isListening && !isProcessing && !isSpeaking) {
        if (average > 15) { 
          if (silenceTimer) {
            clearTimeout(silenceTimer);
            setSilenceTimer(null);
          }
        } else if (!silenceTimer && mediaRecorder && mediaRecorder.state === 'recording' && audioChunks.length > 0) {
          const timer = setTimeout(() => {
            if (mediaRecorder && mediaRecorder.state === 'recording') {
              stopRecording();
            }
          }, 1500); 
          
          setSilenceTimer(timer);
        }
      }
      
      requestAnimationFrame(checkAudioLevel);
    };
    
    checkAudioLevel();
  };
  
  const startRecording = (recorder = mediaRecorder) => {
    if (!recorder || recorder.state === 'recording') return;
    
    setAudioChunks([]);
    recorder.start();
    setIsListening(true);
    
    if (!isContinuousMode) {
      setFeedback('Luisteren...');
    }
  };
  
  const stopRecording = () => {
    if (mediaRecorder && mediaRecorder.state === 'recording') {
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
  
  const processRecordedAudio = async () => {
    if (isProcessing || audioChunks.length === 0) return;
    
    setIsProcessing(true);
    
    try {
      const audioBlob = new Blob(audioChunks, { type: 'audio/webm' });
      
      console.log('Audio opgenomen, type:', audioBlob.type, 'grootte:', audioBlob.size, 'bytes');
      
      if (audioBlob.size < 1000) {
        console.warn('Audio opname te klein, waarschijnlijk geen spraak');
        setIsProcessing(false);
        
        if (isContinuousMode && mediaRecorder) {
          startRecording();
        }
        
        return;
      }
      
      const result = await processSpeechToSpeech(audioBlob);
      
      setFeedback(`Jij: "${result.transcription}"
AI: "${result.response}"`);
      
      if (onCommand) {
        onCommand(result.response);
      }
      
      await playAudio(result.audioUrl);
      
      setTimeout(() => {
        setFeedback('');
        setIsProcessing(false);
        
        if (isContinuousMode && mediaRecorder) {
          startRecording();
        }
      }, 1000);
    } catch (error) {
      console.error('Fout bij het verwerken van de opgenomen audio:', error);
      setFeedback('Er is een fout opgetreden bij het verwerken van je spraak.');
      
      setTimeout(() => {
        setFeedback('');
        setIsProcessing(false);
        
        if (isContinuousMode && mediaRecorder) {
          startRecording();
        }
      }, 3000);
    }
  };
  
  const playAudio = async (url) => {
    try {
      if (audioElement) {
        audioElement.pause();
        audioElement.src = '';
      }
      
      if (!url || url === 'dummy-audio-url') {
        console.warn('Ongeldige audio URL ontvangen');
        setIsSpeaking(false);
        return;
      }
      
      const audio = new Audio(url);
      setAudioElement(audio);
      
      const orbElement = document.querySelector('.orb-ref');
      if (orbElement && orbElement.__reactFiber$) {
        const orbInstance = orbElement.__reactFiber$.return.stateNode;
        if (orbInstance && orbInstance.animate) {
          orbInstance.animate('speak');
        }
      }
      
      setIsSpeaking(true);
      
      audio.onended = () => {
        setIsSpeaking(false);
        if (url.startsWith('blob:')) {
          URL.revokeObjectURL(url); 
        }
      };
      
      audio.onerror = (e) => {
        console.error('Fout bij het afspelen van audio:', e);
        setIsSpeaking(false);
      };
      
      await audio.play().catch(error => {
        console.error('Fout bij het afspelen van audio:', error);
        setIsSpeaking(false);
      });
      
      return new Promise((resolve) => {
        audio.onended = () => {
          setIsSpeaking(false);
          if (url.startsWith('blob:')) {
            URL.revokeObjectURL(url); 
          }
          resolve();
        };
      });
    } catch (error) {
      console.error('Fout bij het afspelen van audio:', error);
      setIsSpeaking(false);
    }
  };
  
  const handleToggleMicrophone = () => {
    setShowTextInput(false);
    
    setIsContinuousMode(!isContinuousMode);
    
    if (!isListening) {
      if (!isContinuousMode) {
        startContinuousListening();
      } else {
        startRecording();
      }
    } else {
      stopRecording();
      cleanupAudioResources();
    }
  };
  
  const toggleTextInput = () => {
    setShowTextInput(!showTextInput);
    if (isListening) {
      stopRecording();
    }
  };
  
  const handleSendText = async () => {
    if (inputText.trim() === '') return;
    
    const userText = inputText.trim();
    setFeedback(`Verwerken van "${userText}"...`);
    
    try {
      const result = await processSpeechToSpeech(null, { userText });
      
      setFeedback(`Jij: "${userText}"
AI: "${result.response}"`);
      
      if (onCommand) {
        onCommand(result.response);
      }
      
      await playAudio(result.audioUrl);
      
      setInputText('');
      
      setTimeout(() => {
        setFeedback('');
        setShowTextInput(false);
        
        if (isContinuousMode && mediaRecorder) {
          startRecording();
        }
      }, 1000);
    } catch (error) {
      console.error('Fout bij het verwerken van tekst:', error);
      setFeedback('Er is een fout opgetreden bij het verwerken van je bericht.');
      setTimeout(() => {
        setFeedback('');
      }, 3000);
    }
  };
  
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
