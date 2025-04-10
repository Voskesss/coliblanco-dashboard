import React, { useRef, useEffect } from 'react';
import styled from '@emotion/styled';
import { motion } from 'framer-motion';
import { FaEnvelope, FaCheck, FaList, FaMusic, FaStepBackward, FaPlay, FaStepForward, FaForward, FaBackward } from 'react-icons/fa';
import { IoSunny } from 'react-icons/io5';
import { useDashboard } from './DashboardController';
import { useAppContext } from '../../context/AppContext';
import PulsingOrb from '../UI/PulsingOrb';
import RealtimeVoiceInterface from '../UI/RealtimeVoiceInterface';
import logo from '../../components/UI/logo-coliblanco.png';
import { gsap } from 'gsap';

// Glassmorphism container
const GlassContainer = styled.div`
  position: relative;
  width: 100%;
  height: 100vh;
  margin: 0;
  padding: 40px;
  background: rgba(255, 255, 255, 0.15);
  backdrop-filter: blur(20px);
  border-radius: 0;
  border: 1px solid rgba(255, 255, 255, 0.3);
  box-shadow: 0 8px 32px 0 rgba(31, 38, 135, 0.1);
  overflow: hidden;
`;

// Sidebar aanpassen
const SidebarContainer = styled.div`
  grid-column: 1;
  grid-row: 1 / span 2;
  display: flex;
  flex-direction: column;
  gap: 20px;
  align-items: center;
  padding-top: 40px;
  margin-right: 10px;
`;

const IconButton = styled.button`
  width: 50px;
  height: 50px;
  border-radius: 15px;
  background: rgba(255, 255, 255, 0.3);
  border: none;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #4a4a4a;
  font-size: 20px;
  cursor: pointer;
  transition: all 0.3s ease;
  
  &:hover {
    background: rgba(255, 255, 255, 0.5);
    transform: translateY(-2px);
  }
`;

const GlassCard = styled(motion.div)`
  background: rgba(255, 255, 255, 0.2);
  backdrop-filter: blur(10px);
  border-radius: 20px;
  border: 1px solid rgba(255, 255, 255, 0.3);
  padding: 20px;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.05);
  overflow: hidden;
`;

const PreferencesCard = styled(GlassCard)`
  grid-column: 2;
  grid-row: 1;
  display: flex;
  align-items: center;
  gap: 15px;
  height: 60px;
  margin-bottom: 20px;
`;

const WeatherCard = styled(GlassCard)`
  grid-column: 3;
  grid-row: 1;
  display: flex;
  align-items: center;
  justify-content: space-between;
  height: 60px;
  padding: 20px;
  position: relative;
  overflow: visible;
  margin-bottom: 20px;
  
  &::before {
    content: '';
    position: absolute;
    left: 20px;
    top: 50%;
    transform: translateY(-50%);
    width: 40px;
    height: 40px;
    background: rgba(255, 255, 255, 0.3);
    border-radius: 50%;
    z-index: 0;
  }
`;

const EmailCard = styled(GlassCard)`
  grid-column: 2;
  grid-row: 2;
  height: 80px;
  margin-bottom: auto;
  align-self: start;
`;

const MusicCard = styled(GlassCard)`
  grid-column: 2;
  grid-row: 2;
  margin-top: 100px;
  height: 220px;
  display: flex;
  flex-direction: column;
  align-self: start;
  margin-top: 100px;
`;

const GreetingCard = styled(GlassCard)`
  grid-column: 3;
  grid-row: 2;
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: flex-start;
  height: auto;
  text-align: left;
  margin-bottom: auto;
  position: relative;
  padding: 30px;
  align-self: start;
  
  &::before {
    content: '';
    position: absolute;
    left: 50%;
    top: -80px;
    transform: translateX(-50%);
    width: 160px;
    height: 160px;
    background: rgba(255, 255, 255, 0.1);
    border-radius: 50%;
    z-index: 0;
  }
`;

const EventCard = styled(GlassCard)`
  grid-column: 3;
  grid-row: 2;
  margin-top: 250px;
  height: 80px;
  display: flex;
  align-items: center;
  gap: 15px;
  align-self: start;
`;

const CalendarCard = styled(GlassCard)`
  grid-column: 3;
  grid-row: 2;
  margin-top: 350px;
  height: 200px;
  display: flex;
  flex-direction: column;
  align-self: start;
`;

const Logo = styled(motion.div)`
  width: auto;
  height: auto;
  margin-bottom: 30px;
  img {
    width: 50px;
    height: auto;
    filter: drop-shadow(0 4px 8px rgba(0, 0, 0, 0.2));
  }
`;

const IconContainer = styled.div`
  width: 40px;
  height: 40px;
  border-radius: 12px;
  background: rgba(255, 255, 255, 0.3);
  display: flex;
  align-items: center;
  justify-content: center;
  color: #4a4a4a;
`;

const WeatherText = styled.div`
  text-align: right;
  h2 {
    font-size: 22px;
    margin: 0;
    font-weight: 500;
  }
`;

const EmailIcon = styled.div`
  color: #ff9800;
  font-size: 24px;
`;

const CalendarGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(7, 1fr);
  gap: 8px;
  margin-top: 10px;
`;

const CalendarHeader = styled.div`
  display: flex;
  justify-content: flex-start;
  margin-bottom: 15px;
  h3 {
    margin: 0;
    font-weight: 500;
    font-size: 18px;
  }
`;

const CalendarDayHeader = styled.div`
  text-align: center;
  font-size: 12px;
  color: #999;
  margin-bottom: 8px;
`;

const CalendarDay = styled.div`
  text-align: center;
  padding: 5px;
  font-size: 12px;
  color: #666;
  &.today {
    background: rgba(255, 255, 255, 0.5);
    border-radius: 50%;
    color: #333;
    font-weight: bold;
  }
`;

const EventList = styled.div`
  margin-top: 20px;
  display: flex;
  flex-direction: column;
  gap: 15px;
  overflow-y: auto;
  flex: 1;
`;

const EventItem = styled.div`
  display: flex;
  align-items: center;
  gap: 15px;
  padding: 12px 15px;
  border-radius: 10px;
  background: rgba(255, 255, 255, 0.2);
  p {
    margin: 0;
    font-size: 14px;
  }
`;

const EventTime = styled.span`
  font-weight: 500;
  font-size: 16px;
  color: #333;
`;

const ClockContainer = styled.div`
  position: absolute;
  top: 40px;
  right: 40px;
  text-align: right;
  h1 {
    font-size: 36px;
    margin: 0;
    font-weight: 300;
  }
  p {
    margin: 5px 0 0;
    font-size: 14px;
    color: #666;
  }
`;

const MusicInfo = styled.div`
  h3 {
    margin: 0;
    font-size: 18px;
    font-weight: 500;
  }
  p {
    margin: 5px 0 0;
    font-size: 14px;
    color: #666;
  }
`;

const MusicControls = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 20px;
  margin-top: 20px;
  button {
    background: none;
    border: none;
    color: #4a4a4a;
    font-size: 16px;
    cursor: pointer;
    &:hover {
      color: #000;
    }
  }
`;

const PlayButton = styled.button`
  width: 40px;
  height: 40px;
  border-radius: 50%;
  background: white;
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 2px 5px rgba(0, 0, 0, 0.1);
`;

const MessageContainer = styled.div`
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  text-align: center;
  max-width: 600px;
  z-index: 10;
  
  p {
    font-size: 32px;
    color: #333;
    font-weight: 300;
  }
`;

const AlbumCover = styled.div`
  width: 80px;
  height: 80px;
  border-radius: 10px;
  overflow: hidden;
  img {
    width: 100%;
    height: 100%;
    object-fit: cover;
  }
`;

const GlassDashboard = () => {
  // Gebruik de gedeelde dashboard controller
  const {
    currentTime,
    weather,
    emails,
    events,
    music,
    formatTime,
    formatDate,
    getGreeting,
    generateCalendarDays,
    togglePlayMusic,
    dayNames
  } = useDashboard();
  
  // Haal de app context op voor de voice interface
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
  
  const calendarDays = generateCalendarDays();
  
  return (
    <GlassContainer>
      <SidebarContainer>
        <Logo
          ref={logoRef}
          initial={{ opacity: 0, x: -50 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.8, ease: "easeOut" }}
        >
          <img src={logo} alt="Coliblanco Logo" />
        </Logo>
        <IconButton>
          <FaEnvelope />
        </IconButton>
        <IconButton>
          <FaCheck />
        </IconButton>
        <IconButton>
          <FaList />
        </IconButton>
        <IconButton>
          <FaMusic />
        </IconButton>
      </SidebarContainer>
      
      <PreferencesCard
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <IconContainer>
          <FaCheck />
        </IconContainer>
        <span>Preferences</span>
      </PreferencesCard>
      
      <WeatherCard
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.1 }}
      >
        <IconContainer>
          <IoSunny />
        </IconContainer>
        <WeatherText>
          <h2>{weather.temperature}° {weather.condition}</h2>
        </WeatherText>
      </WeatherCard>
      
      <EmailCard
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.2 }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
          <EmailIcon>
            <FaEnvelope />
          </EmailIcon>
          <div>
            <h3>You've received</h3>
            <p>{emails} emails</p>
          </div>
        </div>
      </EmailCard>
      
      <MusicCard
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.3 }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '15px', marginBottom: '15px' }}>
          <AlbumCover>
            <img src={music.coverUrl} alt="Album cover" />
          </AlbumCover>
          <MusicInfo>
            <h3>{music.title}</h3>
            <p>{music.artist}</p>
          </MusicInfo>
        </div>
        
        <MusicControls>
          <button><FaBackward /></button>
          <button><FaStepBackward /></button>
          <PlayButton onClick={togglePlayMusic}>
            <FaPlay />
          </PlayButton>
          <button><FaStepForward /></button>
          <button><FaForward /></button>
        </MusicControls>
      </MusicCard>
      
      <GreetingCard
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.4 }}
      >
        <h2>{getGreeting()}</h2>
        <p>hope you had a great night!</p>
      </GreetingCard>
      
      <EventCard
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.5 }}
      >
        <h2>Events</h2>
        <EventList>
          {events.map((event) => (
            <EventItem key={event.id}>
              <EventTime>{event.time}</EventTime>
              <span>{event.title}</span>
            </EventItem>
          ))}
        </EventList>
      </EventCard>
      
      <CalendarCard
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.6 }}
      >
        <CalendarHeader>
          <h3>Calendar</h3>
        </CalendarHeader>
        
        <CalendarGrid>
          {dayNames.map((day, index) => (
            <CalendarDayHeader key={index}>{day}</CalendarDayHeader>
          ))}
          
          {calendarDays.map((day, index) => (
            <CalendarDay key={index} className={day.isToday ? 'today' : ''}>
              {day.day}
            </CalendarDay>
          ))}
        </CalendarGrid>
      </CalendarCard>
      
      {/* Pulserende orb en message container toevoegen */}
      <PulsingOrb status={orbStatus} ref={orbRef} className="orb-ref" style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)' }} />
      <MessageContainer>
        <p>{lastCommand || "Let's glance over the day's first meetup today"}</p>
      </MessageContainer>
      
      <ClockContainer>
        <h1>{formatTime(currentTime)}</h1>
        <p>{formatDate(currentTime)}</p>
      </ClockContainer>
      
      {/* Voice interface toevoegen */}
      <RealtimeVoiceInterface orbStatus={orbStatus} processCommand={processCommand} />
    </GlassContainer>
  );
};

export default GlassDashboard;
