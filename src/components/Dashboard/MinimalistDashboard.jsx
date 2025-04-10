import React, { useEffect, useRef } from 'react';
import styled from '@emotion/styled';
import { format } from 'date-fns';
import { nl } from 'date-fns/locale';
import logo from '../../components/UI/logo-coliblanco.png';
import PulsingOrb from '../UI/PulsingOrb';
import ContextCards from './ContextCards';
import RealtimeVoiceInterface from '../UI/RealtimeVoiceInterface';
import { useAppContext } from '../../context/AppContext';
import { motion } from 'framer-motion';
import { gsap } from 'gsap';
import { useDashboard } from './DashboardController';

const DashboardContainer = styled.div`
  width: 100vw;
  height: 100vh;
  background: linear-gradient(135deg, #EED0BA 0%, #8BAED9 50%, #1B406F 100%);
  display: flex;
  flex-direction: column;
  padding: 2rem;
  font-family: 'Inter', sans-serif;
  position: relative;
  overflow: hidden;
  border-radius: 30px;
`;

const GlassPanel = styled.div`
  position: absolute;
  left: 20px;
  top: 0;
  bottom: 0;
  width: 150px;
  background: rgba(255, 255, 255, 0.2);
  backdrop-filter: blur(10px);
  border-radius: 30px;
  border: 1px solid rgba(255, 255, 255, 0.3);
  box-shadow: 0 8px 32px 0 rgba(31, 38, 135, 0.1);
  display: flex;
  flex-direction: column;
  align-items: center;
  padding-top: 200px;
  z-index: 10;
`;

const IconButton = styled.button`
  width: 120px;
  height: 120px;
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
`;

const Header = styled.header`
  display: flex;
  justify-content: flex-end;
  align-items: flex-start;
  padding-left: 170px;
  margin-bottom: 2rem;
`;

const Logo = styled(motion.div)`
  position: absolute;
  top: 30px;
  left: 25px;
  z-index: 20;
  
  img {
    width: 120px;
    height: auto;
    filter: drop-shadow(0 4px 8px rgba(0, 0, 0, 0.2));
  }
`;

const TimeDisplay = styled.div`
  text-align: right;
  
  h2 {
    margin: 0;
    font-size: 3rem;
    font-weight: 300;
    color: #fff;
  }
  
  p {
    margin: 0;
    font-size: 1.1rem;
    color: rgba(255, 255, 255, 0.8);
    font-weight: 500;
  }
`;

const MainContent = styled.main`
  flex: 1;
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  position: relative;
  padding-left: 170px;
`;

const MessageContainer = styled.div`
  text-align: left;
  max-width: 800px;
  position: absolute;
  right: 80px;
  top: 50%;
  transform: translateY(-50%);
  
  p {
    font-size: 3rem;
    color: #fff;
    font-weight: 300;
    text-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
  }
`;

const GlowingOrb = styled.div`
  position: absolute;
  width: 400px;
  height: 400px;
  border-radius: 50%;
  background: radial-gradient(circle, rgba(255, 255, 255, 0.6) 0%, rgba(255, 255, 255, 0.1) 70%);
  filter: blur(30px);
  top: 50%;
  left: 40%;
  transform: translate(-50%, -50%);
  z-index: 1;
  box-shadow: 0 0 100px 40px rgba(255, 255, 255, 0.2);
`;

const OrbCloud = styled(motion.div)`
  position: absolute;
  width: 550px;
  height: 550px;
  border-radius: 50%;
  background: radial-gradient(circle, rgba(255, 255, 255, 0) 40%, rgba(255, 255, 255, 0.05) 70%, rgba(255, 255, 255, 0.1) 100%);
  top: 50%;
  left: 40%;
  transform: translate(-50%, -50%);
  z-index: 0;
  pointer-events: none;
  filter: blur(40px);
`;

const PulsingOrbContainer = styled.div`
  position: absolute;
  top: 50%;
  left: 40%;
  transform: translate(-50%, -50%);
  z-index: 2;
`;

const FloatingIcons = styled.div`
  position: absolute;
  left: 150px;
  top: 50%;
  transform: translateY(-50%);
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
  align-items: center;
  z-index: 10;
`;

const MinimalistDashboard = () => {
  // Gebruik de gedeelde dashboard controller voor tijd en datum
  const { currentTime } = useDashboard();
  
  const { 
    orbStatus, 
    showCards, 
    lastCommand, 
    processCommand 
  } = useAppContext();
  
  const logoRef = useRef(null);
  const orbRef = useRef(null);
  const cloudRef = useRef(null);
  
  // Animeer de kolibrie wanneer de status verandert
  useEffect(() => {
    if (logoRef.current) {
      if (orbStatus === 'listening') {
        // Subtiele beweging tijdens luisteren
        gsap.to(logoRef.current, {
          rotation: 2,
          duration: 0.5,
          repeat: 2,
          yoyo: true,
          ease: "sine.inOut"
        });
      } else if (orbStatus === 'processing') {
        // Lichte knik tijdens verwerking
        gsap.to(logoRef.current, {
          y: -10,
          duration: 0.3,
          repeat: 1,
          yoyo: true,
          ease: "power2.out"
        });
      } else if (orbStatus === 'active') {
        // Vreugdevolle beweging bij activiteit
        gsap.timeline()
          .to(logoRef.current, {
            scale: 1.05,
            duration: 0.4,
            ease: "back.out"
          })
          .to(logoRef.current, {
            scale: 1,
            duration: 0.3,
            ease: "power2.inOut"
          });
      }
    }
  }, [orbStatus]);
  
  // Animeer de wolk wanneer de status verandert
  useEffect(() => {
    const cloudElement = cloudRef.current;
    
    if (cloudElement) {
      if (orbStatus === 'listening') {
        // Subtiele pulserende beweging tijdens luisteren
        gsap.to(cloudElement, {
          scale: 1.03,
          opacity: 0.7,
          duration: 2,
          repeat: -1,
          yoyo: true,
          ease: "sine.inOut"
        });
      } else if (orbStatus === 'processing') {
        // Subtielere pulserende beweging tijdens verwerking
        gsap.to(cloudElement, {
          scale: 1.05,
          opacity: 0.8,
          duration: 1.5,
          repeat: -1,
          yoyo: true,
          ease: "power1.inOut"
        });
      } else if (orbStatus === 'active') {
        // Zachtere expansie bij activiteit
        gsap.to(cloudElement, {
          scale: 1.08,
          opacity: 0.9,
          duration: 2.5,
          repeat: 1,
          yoyo: true,
          ease: "power2.inOut"
        });
      } else {
        // Reset animatie
        gsap.to(cloudElement, {
          scale: 1,
          opacity: 0.5,
          duration: 1.5,
          ease: "power2.out"
        });
      }
    }
  }, [orbStatus]);
  
  // Format time and date
  const formattedTime = format(currentTime, 'H:mm');
  const formattedDay = format(currentTime, 'EEEE', { locale: nl });
  const formattedDate = format(currentTime, 'd MMMM', { locale: nl });
  
  return (
    <DashboardContainer>
      <FloatingIcons>
        <IconButton>
          <svg width="48" height="48" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M20 4H4C2.9 4 2 4.9 2 6V18C2 19.1 2.9 20 4 20H20C21.1 20 22 19.1 22 18V6C22 4.9 21.1 4 20 4ZM20 18H4V8L12 13L20 8V18ZM12 11L4 6H20L12 11Z" fill="currentColor"/>
          </svg>
        </IconButton>
        <IconButton>
          <svg width="48" height="48" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M19 3H5C3.9 3 3 3.9 3 5V19C3 20.1 3.9 21 5 21H19C20.1 21 21 20.1 21 19V5C21 3.9 20.1 3 19 3ZM19 19H5V5H19V19Z" fill="currentColor"/>
            <path d="M17 12H12V17H17V12Z" fill="currentColor"/>
            <path d="M7 7H17V10H7V7Z" fill="currentColor"/>
          </svg>
        </IconButton>
        <IconButton>
          <svg width="48" height="48" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M19 3H5C3.9 3 3 3.9 3 5V19C3 20.1 3.9 21 5 21H19C20.1 21 21 20.1 21 19V5C21 3.9 20.1 3 19 3ZM19 19H5V5H19V19Z" fill="currentColor"/>
            <path d="M18 9L16.59 7.59L10 14.17L7.41 11.59L6 13L10 17L18 9Z" fill="currentColor"/>
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
      </FloatingIcons>
      
      <Logo
        ref={logoRef}
        initial={{ opacity: 0, x: -50 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.8, ease: "easeOut" }}
      >
        <img src={logo} alt="Coliblanco Logo" />
      </Logo>
      
      <Header>
        <TimeDisplay>
          <h2>{formattedTime}</h2>
          <p>
            <span>{formattedDay}</span>{' '}
            <span>{formattedDate}</span>
          </p>
        </TimeDisplay>
      </Header>
      
      <MainContent>
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
        <MessageContainer>
          <p>{lastCommand || "Goedemorgen, ik hoop dat je lekker hebt geslapen!"}</p>
        </MessageContainer>
        {showCards && <ContextCards />}
      </MainContent>
      
      <RealtimeVoiceInterface orbStatus={orbStatus} processCommand={processCommand} />
    </DashboardContainer>
  );
};

export default MinimalistDashboard;
