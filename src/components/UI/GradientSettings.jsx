import React, { useState, useEffect } from 'react';
import styled from '@emotion/styled';
import { motion, AnimatePresence } from 'framer-motion';
import { FaCog, FaTimes } from 'react-icons/fa';

// Hoofdcontainer voor de instellingen
const SettingsContainer = styled(motion.div)`
  position: fixed;
  bottom: 2rem;
  left: 2rem;
  z-index: 9999;
  display: flex;
  flex-direction: column;
  align-items: flex-start;
`;

// Knop om de instellingen te openen/sluiten
const SettingsButton = styled(motion.button)`
  width: 60px;
  height: 60px;
  border-radius: 50%;
  background: rgba(255, 255, 255, 0.3);
  backdrop-filter: blur(10px);
  border: 2px solid rgba(255, 255, 255, 0.5);
  display: flex;
  justify-content: center;
  align-items: center;
  cursor: pointer;
  color: white;
  font-size: 1.5rem;
  box-shadow: 0 8px 20px rgba(0, 0, 0, 0.2);
  transition: all 0.3s ease;
  
  &:hover {
    background: rgba(255, 255, 255, 0.4);
    transform: scale(1.05);
  }
`;

// Panel voor de instellingen
const SettingsPanel = styled(motion.div)`
  margin-top: 1rem;
  padding: 1.5rem;
  background: rgba(255, 255, 255, 0.15);
  backdrop-filter: blur(10px);
  border-radius: 15px;
  border: 1px solid rgba(255, 255, 255, 0.3);
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.1);
  width: 300px;
`;

// Titel van het panel
const PanelTitle = styled.h3`
  color: white;
  margin-bottom: 1rem;
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-weight: 500;
`;

// Container voor de gradient opties
const GradientOptions = styled.div`
  display: flex;
  flex-direction: column;
  gap: 1rem;
`;

// Individuele gradient optie
const GradientOption = styled.div`
  display: flex;
  align-items: center;
  gap: 1rem;
  cursor: pointer;
  padding: 0.5rem;
  border-radius: 8px;
  transition: background 0.2s ease;
  
  &:hover {
    background: rgba(255, 255, 255, 0.1);
  }
  
  &.active {
    background: rgba(255, 255, 255, 0.2);
  }
`;

// Preview van de gradient
const GradientPreview = styled.div`
  width: 50px;
  height: 50px;
  border-radius: 8px;
  border: 1px solid rgba(255, 255, 255, 0.3);
`;

// Naam van de gradient
const GradientName = styled.span`
  color: white;
  font-size: 0.9rem;
`;

// Beschikbare gradient thema's
const gradientThemes = [
  {
    id: 'default',
    name: 'Standaard',
    gradient: 'linear-gradient(135deg, #EED0BA 0%, #8BAED9 50%, #1B406F 100%)',
  },
  {
    id: 'sunset',
    name: 'Zonsondergang',
    gradient: 'linear-gradient(135deg, #FF9966 0%, #FF5E62 50%, #6B1B47 100%)',
  },
  {
    id: 'forest',
    name: 'Bos',
    gradient: 'linear-gradient(135deg, #A8E063 0%, #56AB2F 50%, #1D4350 100%)',
  },
  {
    id: 'midnight',
    name: 'Midnight Blue',
    gradient: 'linear-gradient(135deg, #191970 0%, #000080 50%, #483D8B 100%)',
  },
  {
    id: 'sunny',
    name: 'Sunny',
    gradient: 'linear-gradient(135deg, #FFD700 0%, #87CEEB 50%, #1E90FF 100%)',
  },
  {
    id: 'autumn',
    name: 'Herfst',
    gradient: 'linear-gradient(135deg, #DAA520 0%, #CD853F 50%, #8B4513 100%)',
  },
  {
    id: 'winter',
    name: 'Winter',
    gradient: 'linear-gradient(135deg, #F0F8FF 0%, #B0E0E6 50%, #87CEFA 100%)',
  },
  {
    id: 'spring',
    name: 'Lente',
    gradient: 'linear-gradient(135deg, #98FB98 0%, #3CB371 50%, #2E8B57 100%)',
  },
  {
    id: 'summer',
    name: 'Zomer',
    gradient: 'linear-gradient(135deg, #FFFF00 0%, #FF8C00 50%, #FF4500 100%)',
  },
];

const GradientSettings = ({ onGradientChange }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [selectedGradient, setSelectedGradient] = useState('default');
  
  // Laad de opgeslagen gradient bij het laden van de component
  useEffect(() => {
    const savedGradient = localStorage.getItem('selectedGradient');
    if (savedGradient) {
      setSelectedGradient(savedGradient);
      applyGradient(savedGradient);
    }
  }, []);
  
  // Verander de geselecteerde gradient
  const handleGradientChange = (gradientId) => {
    setSelectedGradient(gradientId);
    applyGradient(gradientId);
  };
  
  // Pas de gradient toe op de DashboardContainer
  const applyGradient = (gradientId) => {
    const theme = gradientThemes.find(theme => theme.id === gradientId);
    if (theme) {
      console.log('Gradient toepassen:', theme.gradient);
      
      // Pas de CSS-variabele aan
      document.documentElement.style.setProperty('--dashboard-gradient', theme.gradient);
      console.log('CSS-variabele aangepast naar:', theme.gradient);
      
      // Pas de achtergrond direct aan
      const backgroundElement = document.querySelector('.background-wrapper');
      if (backgroundElement) {
        console.log('Achtergrond element gevonden, gradient toepassen');
        backgroundElement.style.background = theme.gradient;
      } else {
        console.log('Achtergrond element niet gevonden');
      }
      
      // Sla de keuze op in localStorage
      localStorage.setItem('selectedGradient', gradientId);
      
      // Roep de callback functie aan als deze is meegegeven
      if (onGradientChange) {
        onGradientChange(theme.gradient);
      }
    }
  };
  
  return (
    <SettingsContainer>
      <SettingsButton
        onClick={() => setIsOpen(!isOpen)}
        whileTap={{ scale: 0.95 }}
      >
        <FaCog />
      </SettingsButton>
      
      <AnimatePresence>
        {isOpen && (
          <SettingsPanel
            initial={{ opacity: 0, y: 20, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.9 }}
            transition={{ duration: 0.2 }}
          >
            <PanelTitle>
              Achtergrond aanpassen
              <FaTimes 
                onClick={() => setIsOpen(false)} 
                style={{ cursor: 'pointer' }} 
              />
            </PanelTitle>
            
            <GradientOptions>
              {gradientThemes.map((theme) => (
                <GradientOption
                  key={theme.id}
                  className={selectedGradient === theme.id ? 'active' : ''}
                  onClick={() => handleGradientChange(theme.id)}
                >
                  <GradientPreview style={{ background: theme.gradient }} />
                  <GradientName>{theme.name}</GradientName>
                </GradientOption>
              ))}
            </GradientOptions>
          </SettingsPanel>
        )}
      </AnimatePresence>
    </SettingsContainer>
  );
};

export default GradientSettings;
