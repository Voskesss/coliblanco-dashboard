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
  background-color: #e9e9e4;
  display: flex;
  flex-direction: column;
  padding: 2rem;
  font-family: 'Inter', sans-serif;
  position: relative;
  overflow: hidden;
`;

const Header = styled.header`
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
`;

const Logo = styled(motion.div)`
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  
  img {
    width: 300px;
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
  }
  
  p {
    margin: 0;
    font-size: 1.1rem;
    color: #8B0000;
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
`;

const MessageContainer = styled.div`
  margin-top: 2rem;
  text-align: center;
  max-width: 600px;
  
  p {
    font-size: 1.5rem;
    color: #333;
    font-weight: 300;
  }
`;

const Dashboard = () => {
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
  
  // Format time and date
  const formattedTime = format(currentTime, 'H:mm');
  const formattedDay = format(currentTime, 'EEEE', { locale: nl });
  const formattedDate = format(currentTime, 'd MMMM', { locale: nl });
  
  return (
    <DashboardContainer>
      <Header>
        <Logo
          ref={logoRef}
          initial={{ opacity: 0, x: -50 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.8, ease: "easeOut" }}
        >
          <img src={logo} alt="Coliblanco Logo" />
        </Logo>
        <TimeDisplay>
          <h2>{formattedTime}</h2>
          <p>
            <span style={{ color: '#333' }}>{formattedDay}</span>{' '}
            <span style={{ color: '#8B0000' }}>{formattedDate}</span>
          </p>
        </TimeDisplay>
      </Header>
      
      <MainContent>
        <PulsingOrb status={orbStatus} ref={orbRef} className="orb-ref" />
        <MessageContainer>
          <p>{lastCommand || "Let's glance over the day's first meetup today"}</p>
        </MessageContainer>
        {showCards && <ContextCards />}
      </MainContent>
      
      <RealtimeVoiceInterface orbStatus={orbStatus} processCommand={processCommand} />
    </DashboardContainer>
  );
};

export default Dashboard;
