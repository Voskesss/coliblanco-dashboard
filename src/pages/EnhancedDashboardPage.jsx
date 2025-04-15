import React, { useState, useEffect } from 'react';
import styled from '@emotion/styled';
import { motion } from 'framer-motion';
import { useAppContext } from '../context/AppContext';
import EnhancedVoiceInterface from '../components/UI/EnhancedVoiceInterface';
import PulsingOrb from '../components/UI/PulsingOrb';

const PageContainer = styled.div`
  width: 100%;
  height: 100vh;
  background-color: #e9e9e4;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  position: relative;
  overflow: hidden;
`;

const ClockDisplay = styled.div`
  position: absolute;
  top: 2rem;
  left: 2rem;
  color: #333;
  font-size: 1.2rem;
  font-weight: 300;
  text-align: left;
  
  h1 {
    font-size: 3rem;
    font-weight: 200;
    margin: 0;
  }
  
  p {
    margin: 0;
    opacity: 0.7;
  }
`;

const MessageContainer = styled(motion.div)`
  position: absolute;
  top: 40%;
  left: 50%;
  transform: translate(-50%, -50%);
  background-color: rgba(255, 255, 255, 0.8);
  padding: 1.5rem 2rem;
  border-radius: 1rem;
  box-shadow: 0 10px 25px rgba(0, 0, 0, 0.1);
  backdrop-filter: blur(10px);
  max-width: 80%;
  text-align: center;
  
  p {
    margin: 0;
    font-size: 1.2rem;
    line-height: 1.5;
    color: #333;
  }
`;

const EnhancedDashboardPage = () => {
  const { orbStatus, setOrbStatus, lastCommand, setLastCommand, processCommand } = useAppContext();
  const [currentTime, setCurrentTime] = useState(new Date());
  
  // Update de tijd elke seconde
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);
    
    return () => clearInterval(timer);
  }, []);
  
  // Functie om de tijd te formatteren
  const formatTime = (date) => {
    return date.toLocaleTimeString('nl-NL', {
      hour: '2-digit',
      minute: '2-digit'
    });
  };
  
  // Functie om de datum te formatteren
  const formatDate = (date) => {
    return date.toLocaleDateString('nl-NL', {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
      year: 'numeric'
    });
  };
  
  // Handler voor spraakcommando's
  const handleCommand = (command) => {
    console.log('Commando ontvangen:', command);
    setLastCommand(command);
    setOrbStatus('active');
    
    // Verwerk het commando met de context API
    processCommand(command);
  };
  
  return (
    <PageContainer>
      <ClockDisplay>
        <h1>{formatTime(currentTime)}</h1>
        <p>{formatDate(currentTime)}</p>
      </ClockDisplay>
      
      <PulsingOrb 
        status={orbStatus} 
        style={{ 
          position: 'fixed', 
          bottom: '80px', 
          left: '50%', 
          transform: 'translateX(-50%)',
          zIndex: 50
        }} 
      />
      
      {lastCommand && (
        <MessageContainer
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <p>{lastCommand}</p>
        </MessageContainer>
      )}
      
      <EnhancedVoiceInterface onCommand={handleCommand} />
    </PageContainer>
  );
};

export default EnhancedDashboardPage;
