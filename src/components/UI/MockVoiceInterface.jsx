import React, { useState, useEffect, useRef } from 'react';
import styled from '@emotion/styled';
import { motion, AnimatePresence } from 'framer-motion';
import { FaMicrophone, FaStop, FaVolumeUp, FaPaperPlane, FaKeyboard } from 'react-icons/fa';
import { useAppContext } from '../../context/AppContext';

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
  const [selectedVoice, setSelectedVoice] = useState(null);
  const [showTextInput, setShowTextInput] = useState(false);
  const [inputText, setInputText] = useState('');
  const [isSpeaking, setIsSpeaking] = useState(false);
  const inputRef = useRef(null);
  
  const { orbStatus } = useAppContext();
  
  // Focus op het tekstinvoerveld wanneer het wordt weergegeven
  useEffect(() => {
    if (showTextInput && inputRef.current) {
      inputRef.current.focus();
    }
  }, [showTextInput]);
  
  // Zoek naar beschikbare stemmen bij het laden van de component
  useEffect(() => {
    if ('speechSynthesis' in window) {
      // Functie om de beste Nederlandse stem te vinden
      const findBestDutchVoice = () => {
        const voices = speechSynthesis.getVoices();
        console.log('Beschikbare stemmen:', voices);
        
        // Zoek eerst naar een Nederlandse stem
        let dutchVoice = voices.find(voice => 
          voice.lang.includes('nl') && voice.localService === true
        );
        
        // Als er geen Nederlandse stem is, probeer een andere Europese stem
        if (!dutchVoice) {
          dutchVoice = voices.find(voice => 
            (voice.lang.includes('en-GB') || voice.lang.includes('de') || voice.lang.includes('fr')) && 
            voice.localService === true
          );
        }
        
        // Als er nog steeds geen stem is, gebruik de eerste beschikbare stem
        if (!dutchVoice && voices.length > 0) {
          dutchVoice = voices[0];
        }
        
        return dutchVoice;
      };
      
      // Probeer direct stemmen te laden
      let voice = findBestDutchVoice();
      if (voice) {
        setSelectedVoice(voice);
      }
      
      // Stemmen worden asynchroon geladen, dus we moeten ook luisteren naar het voiceschanged event
      speechSynthesis.onvoiceschanged = () => {
        const voice = findBestDutchVoice();
        if (voice) {
          setSelectedVoice(voice);
        }
      };
    }
  }, []);
  
  // Simuleer spraakherkenning
  const handleToggleMicrophone = () => {
    // Sluit tekstinvoer als die open is
    setShowTextInput(false);
    
    if (!isListening) {
      setIsListening(true);
      setFeedback('Luisteren...');
      
      // Simuleer verwerking na een vertraging
      setTimeout(() => {
        setFeedback('Verwerken van je vraag...');
        
        // Simuleer een antwoord
        setTimeout(() => {
          const simulatedCommands = [
            'Toon mijn agenda voor vandaag',
            'Wat is mijn eerste afspraak?',
            'Stuur een bericht naar het team',
            'Hoe laat is mijn meeting?',
            'Wat staat er op de planning voor deze week?',
            'Herinner me aan de deadline van vrijdag',
            'Maak een notitie over het nieuwe project'
          ];
          
          const randomCommand = simulatedCommands[Math.floor(Math.random() * simulatedCommands.length)];
          
          // Stuur het commando door naar de parent component
          if (onCommand) {
            onCommand(randomCommand);
          }
          
          setFeedback(`"${randomCommand}" verwerkt`);
          
          // Reset na het tonen van feedback
          setTimeout(() => {
            setFeedback('');
            setIsListening(false);
          }, 3000);
        }, 1500);
      }, 1500);
    } else {
      // Annuleer luisteren
      setIsListening(false);
      setFeedback('Luisteren geannuleerd');
      
      // Wis feedback na een vertraging
      setTimeout(() => {
        setFeedback('');
      }, 1500);
    }
  };
  
  // Toon of verberg het tekstinvoerveld
  const toggleTextInput = () => {
    setShowTextInput(!showTextInput);
    if (isListening) {
      setIsListening(false);
      setFeedback('');
    }
  };
  
  // Verwerk de tekstinvoer
  const handleSendText = () => {
    if (inputText.trim() === '') return;
    
    setFeedback(`Verwerken van "${inputText}"...`);
    
    // Stuur het commando door naar de parent component
    if (onCommand) {
      onCommand(inputText);
    }
    
    // Simuleer verwerking
    setTimeout(() => {
      setFeedback(`"${inputText}" verwerkt`);
      setInputText('');
      
      // Reset na het tonen van feedback
      setTimeout(() => {
        setFeedback('');
        setShowTextInput(false);
      }, 3000);
    }, 1500);
  };
  
  // Verwerk Enter toets in het tekstinvoerveld
  const handleKeyPress = (e) => {
    if (e.key === 'Enter') {
      handleSendText();
    }
  };
  
  // Verbeterde spraaksynthese functie
  const speakText = (text) => {
    if ('speechSynthesis' in window) {
      // Stop eventuele lopende spraak
      speechSynthesis.cancel();
      
      const utterance = new SpeechSynthesisUtterance(text);
      
      // Stel de stem in als we een geschikte stem hebben gevonden
      if (selectedVoice) {
        utterance.voice = selectedVoice;
      }
      
      // Pas de spraakparameters aan voor een betere kwaliteit
      utterance.lang = 'nl-NL';
      utterance.pitch = 1.0;  // Normale toonhoogte
      utterance.rate = 1.0;   // Normale snelheid
      utterance.volume = 1.0; // Maximaal volume
      
      // Voeg event handlers toe
      utterance.onstart = () => {
        console.log('Spraak gestart');
        setIsSpeaking(true);
        
        // Vind de orb via DOM en animeer deze
        const orbElement = document.querySelector('.orb-ref');
        if (orbElement && orbElement.__reactFiber$) {
          const orbInstance = orbElement.__reactFiber$.return.stateNode;
          if (orbInstance && orbInstance.animate) {
            orbInstance.animate('speak');
          }
        }
      };
      
      utterance.onend = () => {
        console.log('Spraak beëindigd');
        setIsSpeaking(false);
      };
      
      utterance.onerror = (e) => console.error('Spraak fout:', e);
      
      // Start de spraak
      speechSynthesis.speak(utterance);
    }
  };
  
  // Spreek het feedback bericht uit wanneer het verandert
  useEffect(() => {
    if (feedback && feedback !== 'Luisteren...' && feedback !== 'Verwerken van je vraag...') {
      speakText(feedback);
    }
  }, [feedback]);
  
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
