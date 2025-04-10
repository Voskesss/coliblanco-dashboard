import React, { useRef, useState, useEffect } from 'react';
import styled from '@emotion/styled';
import { motion } from 'framer-motion';
import { useDashboard } from './DashboardController';
import RealtimeVoiceInterface from '../UI/RealtimeVoiceInterface';
import ContextCards from './ContextCards';
import PulsingOrb from '../UI/PulsingOrb';
import logo from '../../components/UI/logo-coliblanco.png';

// Hoofdcontainer voor de hele applicatie
const DashboardContainer = styled.div`
  width: 100vw;
  height: 100vh;
  background: linear-gradient(135deg, #EED0BA 0%, #8BAED9 50%, #1B406F 100%);
  display: flex;
  flex-direction: column;
  align-items: center;
   justify-content: center;
  overflow: hidden;
  position: relative;
`;

// Desktop layout - alleen zichtbaar op grotere schermen
const DesktopLayout = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  width: 100%;
  height: 100%;
  position: relative;
  
  @media (max-width: 480px) {
    display: none;
  }
`;

// Mobile layout - alleen zichtbaar op kleine schermen
const MobileLayout = styled.div`
  display: none;
  flex-direction: column;
  align-items: center;
  justify-content: space-between;
  width: 100%;
  height: 100%;
  position: relative;
  
  @media (max-width: 480px) {
    display: flex;
  }
`;

// Logo component
const Logo = styled(motion.div)`
  position: absolute;
  top: 20px;
  left: 25px;
  z-index: 10;
  
  img {
    width: 150px;
    height: auto;
  }
  
  @media (max-width: 768px) {
    img {
      width: 120px;
    }
  }
  
  @media (max-width: 480px) {
    position: relative;
    top: 0;
    left: 0;
    margin-top: 20px;
    
    img {
      width: 100px;
    }
  }
`;

// Tijd component
const TimeDisplay = styled.div`
  position: absolute;
  top: 30px;
  right: 40px;
  text-align: right;
  color: #fff;
  text-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
  
  h2 {
    font-size: 48px;
    font-weight: 300;
    margin: 0;
    margin-bottom: 5px;
  }
  
  p {
    font-size: 18px;
    font-weight: 300;
    margin: 0;
    opacity: 0.9;
  }
  
  @media (max-width: 768px) {
    right: 30px;
    
    h2 {
      font-size: 36px;
    }
    
    p {
      font-size: 16px;
    }
  }
  
  @media (max-width: 480px) {
    position: relative;
    top: 0;
    right: 0;
    text-align: center;
    margin-top: 10px;
    
    h2 {
      font-size: 32px;
    }
    
    p {
      font-size: 14px;
    }
  }
`;

// Sidebar met iconen
const Sidebar = styled.div`
  position: absolute;
  left: 20px;
  top: 0;
  bottom: 0;
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  z-index: 5;
  
  @media (max-width: 480px) {
    position: fixed;
    left: 0;
    top: auto;
    bottom: 0;
    width: 100%;
    height: 70px;
    flex-direction: row;
    justify-content: space-around;
    background: rgba(255, 255, 255, 0.1);
    backdrop-filter: blur(10px);
    border-top: 1px solid rgba(255, 255, 255, 0.2);
  }
`;

const IconButton = styled.button`
  width: 80px;
  height: 80px;
  border-radius: 20px;
  background: rgba(255, 255, 255, 0.3);
  border: 1px solid rgba(255, 255, 255, 0.4);
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.05);
  display: flex;
  align-items: center;
  justify-content: center;
  color: #4a4a4a;
  font-size: 32px;
  cursor: pointer;
  margin-bottom: 25px;
  transition: all 0.3s ease;
  
  &:hover {
    background: rgba(255, 255, 255, 0.5);
    transform: translateY(-2px);
    box-shadow: 0 6px 12px rgba(0, 0, 0, 0.1);
  }
  
  @media (max-width: 480px) {
    width: 50px;
    height: 50px;
    margin: 0;
    font-size: 24px;
    border-radius: 15px;
  }
`;

// Orb componenten
const OrbContainer = styled.div`
  position: relative;
  display: flex;
  justify-content: center;
  align-items: center;
  width: 100%;
  height: 100%;
`;

const GlowingOrb = styled.div`
  position: absolute;
  width: 400px;
  height: 400px;
  border-radius: 50%;
  background: radial-gradient(
    circle,
    rgba(255, 255, 255, 0.8) 0%,
    rgba(255, 255, 255, 0.4) 40%,
    rgba(255, 255, 255, 0.1) 70%,
    rgba(255, 255, 255, 0) 100%
  );
  box-shadow: 0 0 60px 30px rgba(255, 255, 255, 0.3);
  transform: scale(0.8);
  z-index: 1;
  
  @media (max-width: 768px) {
    width: 350px;
    height: 350px;
  }
  
  @media (max-width: 480px) {
    width: 250px;
    height: 250px;
  }
`;

const OrbCloud = styled(motion.div)`
  position: absolute;
  width: 600px;
  height: 600px;
  border-radius: 50%;
  background: radial-gradient(
    circle,
    rgba(255, 255, 255, 0.1) 0%,
    rgba(255, 255, 255, 0.05) 40%,
    rgba(255, 255, 255, 0.02) 70%,
    rgba(255, 255, 255, 0) 100%
  );
  filter: blur(40px);
  transform: scale(1.2);
  z-index: 0;
  
  @media (max-width: 768px) {
    width: 500px;
    height: 500px;
  }
  
  @media (max-width: 480px) {
    width: 300px;
    height: 300px;
  }
`;

const PulsingOrbContainer = styled.div`
  position: absolute;
  z-index: 2;
`;

// Message component
const MessageContainer = styled.div`
  position: absolute;
  bottom: 100px;
  left: 50%;
  transform: translateX(-50%);
  background: rgba(255, 255, 255, 0.2);
  backdrop-filter: blur(10px);
  border-radius: 20px;
  border: 1px solid rgba(255, 255, 255, 0.3);
  box-shadow: 0 8px 32px 0 rgba(31, 38, 135, 0.1);
  padding: 20px 30px;
  width: 80%;
  max-width: 800px;
  text-align: center;
  
  p {
    color: #fff;
    font-size: 24px;
    font-weight: 300;
    line-height: 1.5;
    margin: 0;
    text-shadow: 0 1px 2px rgba(0, 0, 0, 0.1);
  }
  
  @media (max-width: 768px) {
    width: 90%;
    max-width: 600px;
    padding: 15px 25px;
    
    p {
      font-size: 20px;
    }
  }
  
  @media (max-width: 480px) {
    position: relative;
    bottom: auto;
    left: auto;
    transform: none;
    width: 90%;
    margin: 20px auto;
    padding: 15px;
    
    p {
      font-size: 18px;
    }
  }
`;

// Voice interface container
const VoiceContainer = styled.div`
  position: absolute;
  bottom: 30px;
  left: 50%;
  transform: translateX(-50%);
  z-index: 10;
  
  @media (max-width: 480px) {
    position: relative;
    bottom: auto;
    left: auto;
    transform: none;
    margin: 10px auto 80px auto;
  }
`;

// Hoofdcomponent
const NewMinimalistDashboard = () => {
  const { 
    currentTime,
    lastCommand,
    processCommand,
    showCards,
    orbStatus
  } = useDashboard();
  
  const logoRef = useRef(null);
  const cloudRef = useRef(null);
  const orbRef = useRef(null);
  
  // Tijdsformattering
  const formattedTime = currentTime.toLocaleTimeString('nl-NL', { hour: '2-digit', minute: '2-digit' });
  const formattedDay = currentTime.toLocaleString('nl-NL', { weekday: 'long' });
  const formattedDate = currentTime.toLocaleDateString('nl-NL', { day: 'numeric', month: 'long' });
  
  return (
    <DashboardContainer>
      {/* Desktop Layout */}
      <DesktopLayout>
        {/* Logo */}
        <Logo
          ref={logoRef}
          initial={{ opacity: 0, x: -50 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.8, ease: "easeOut" }}
        >
          <img src={logo} alt="Coliblanco Logo" />
        </Logo>
        
        {/* Tijd */}
        <TimeDisplay>
          <h2>{formattedTime}</h2>
          <p>
            <span>{formattedDay}</span>{' '}
            <span>{formattedDate}</span>
          </p>
        </TimeDisplay>
        
        {/* Sidebar met iconen */}
        <Sidebar>
          <IconButton>
            <svg width="48" height="48" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M20 4H4C2.9 4 2 4.9 2 6V18C2 19.1 2.9 20 4 20H20C21.1 20 22 19.1 22 18V6C22 4.9 21.1 4 20 4ZM20 18H4V8L12 13L20 8V18ZM12 11L4 6H20L12 11Z" fill="currentColor"/>
            </svg>
          </IconButton>
          <IconButton>
            <svg width="48" height="48" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M19 3H5C3.9 3 3 3.9 3 5V19C3 20.1 3.9 21 5 21H19C20.1 21 21 20.1 21 19V5C21 3.9 20.1 3 19 3ZM19 19H5V5H19V19Z" fill="currentColor"/>
              <path d="M7 12H9V17H7V12Z" fill="currentColor"/>
              <path d="M15 7H17V17H15V7Z" fill="currentColor"/>
              <path d="M11 14H13V17H11V14Z" fill="currentColor"/>
              <path d="M11 10H13V12H11V10Z" fill="currentColor"/>
            </svg>
          </IconButton>
          <IconButton>
            <svg width="48" height="48" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M14.5 2.5C16.5 2.5 18 4 18 6C18 8 16.5 9.5 14.5 9.5C12.5 9.5 11 8 11 6C11 4 12.5 2.5 14.5 2.5ZM7 5C8.5 5 9.5 6 9.5 7.5C9.5 9 8.5 10 7 10C5.5 10 4.5 9 4.5 7.5C4.5 6 5.5 5 7 5ZM14.5 11.5C17 11.5 22 12.67 22 15.17V18H7V15.17C7 12.67 12 11.5 14.5 11.5ZM7 12C4.67 12 0 13.17 0 15.5V18H5V15.17C5 14.5 5.37 13.69 6.03 13C5.55 12.92 4.8 12.75 4 12.75C2.21 12.75 0.8 13.26 0 14" fill="currentColor"/>
            </svg>
          </IconButton>
          <IconButton>
            <svg width="48" height="48" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M12 3C7.59 3 4 6.59 4 11C4 15.41 7.59 19 12 19C16.41 19 20 15.41 20 11C20 6.59 16.41 3 12 3ZM12 17C8.69 17 6 14.31 6 11C6 7.69 8.69 5 12 5C15.31 5 18 7.69 18 11C18 14.31 15.31 17 12 17Z" fill="currentColor"/>
              <path d="M11 7H13V13H11V7Z" fill="currentColor"/>
              <path d="M11 15H13V17H11V15Z" fill="currentColor"/>
            </svg>
          </IconButton>
        </Sidebar>
        
        {/* Orb en cloud */}
        <OrbContainer>
          <OrbCloud
            ref={cloudRef}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.8, ease: "easeOut" }}
          />
          <GlowingOrb />
          <PulsingOrbContainer>
            <PulsingOrb status={orbStatus} ref={orbRef} className="orb-ref" />
          </PulsingOrbContainer>
        </OrbContainer>
        
        {/* Bericht */}
        <MessageContainer>
          <p>{lastCommand || "Goedemorgen, ik hoop dat je lekker hebt geslapen!"}</p>
        </MessageContainer>
        
        {/* Context cards */}
        {showCards && <ContextCards />}
        
        {/* Voice interface */}
        <VoiceContainer>
          <RealtimeVoiceInterface orbStatus={orbStatus} processCommand={processCommand} />
        </VoiceContainer>
      </DesktopLayout>
      
      {/* Mobile Layout */}
      <MobileLayout>
        {/* Logo en tijd */}
        <div style={{ width: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
          <Logo
            ref={logoRef}
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.8, ease: "easeOut" }}
          >
            <img src={logo} alt="Coliblanco Logo" />
          </Logo>
          
          <TimeDisplay>
            <h2>{formattedTime}</h2>
            <p>
              <span>{formattedDay}</span>{' '}
              <span>{formattedDate}</span>
            </p>
          </TimeDisplay>
        </div>
        
        {/* Orb voor mobiel */}
        <OrbContainer>
          <OrbCloud
            ref={cloudRef}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.8, ease: "easeOut" }}
          />
          <GlowingOrb />
          <PulsingOrbContainer>
            <PulsingOrb status={orbStatus} ref={orbRef} className="orb-ref" />
          </PulsingOrbContainer>
        </OrbContainer>
        
        {/* Bericht voor mobiel */}
        <MessageContainer>
          <p>{lastCommand || "Goedemorgen, ik hoop dat je lekker hebt geslapen!"}</p>
        </MessageContainer>
        
        {/* Voice interface voor mobiel */}
        <VoiceContainer>
          <RealtimeVoiceInterface orbStatus={orbStatus} processCommand={processCommand} />
        </VoiceContainer>
        
        {/* Sidebar voor mobiel (onderaan) */}
        <Sidebar />
        
        {/* Context cards voor mobiel */}
        {showCards && <div style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', zIndex: 100 }}>
          <ContextCards />
        </div>}
      </MobileLayout>
    </DashboardContainer>
  );
};

export default NewMinimalistDashboard;
