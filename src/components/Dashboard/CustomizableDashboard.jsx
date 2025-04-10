import React, { useState, useEffect, useRef } from 'react';
import styled from '@emotion/styled';
import { motion } from 'framer-motion';
import { FaEnvelope, FaCheck, FaList, FaMusic, FaStepBackward, FaPlay, FaStepForward, FaForward, FaBackward, FaPlus } from 'react-icons/fa';
import { IoSunny } from 'react-icons/io5';
import { useDashboard } from './DashboardController';
import { useAppContext } from '../../context/AppContext';
import PulsingOrb from '../UI/PulsingOrb';
import RealtimeVoiceInterface from '../UI/RealtimeVoiceInterface';
import logo from '../../components/UI/logo-coliblanco.png';
import { gsap } from 'gsap';
import DraggableWidget from './DraggableWidget';

const DashboardContainer = styled.div`
  position: relative;
  width: 100%;
  height: 100vh;
  background: rgba(255, 255, 255, 0.15);
  backdrop-filter: blur(20px);
  overflow: hidden;
`;

const SidePanel = styled.div`
  position: fixed;
  left: 0;
  top: 0;
  bottom: 0;
  width: 80px;
  background: rgba(255, 255, 255, 0.2);
  backdrop-filter: blur(10px);
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 20px 0;
  z-index: 100;
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
  margin-bottom: 15px;
  transition: all 0.3s ease;
  
  &:hover {
    background: rgba(255, 255, 255, 0.5);
    transform: translateY(-2px);
  }
`;

const AddWidgetButton = styled(IconButton)`
  position: fixed;
  bottom: 20px;
  right: 20px;
  z-index: 100;
  background: rgba(0, 123, 255, 0.7);
  color: white;
  &:hover {
    background: rgba(0, 123, 255, 0.9);
  }
`;

const WidgetMenu = styled(motion.div)`
  position: fixed;
  bottom: 80px;
  right: 20px;
  background: rgba(255, 255, 255, 0.9);
  backdrop-filter: blur(10px);
  border-radius: 10px;
  padding: 15px;
  z-index: 100;
  display: flex;
  flex-direction: column;
  gap: 10px;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
`;

const WidgetMenuItem = styled.button`
  background: rgba(255, 255, 255, 0.5);
  border: 1px solid rgba(0, 0, 0, 0.1);
  border-radius: 8px;
  padding: 10px;
  text-align: left;
  cursor: pointer;
  transition: all 0.2s ease;
  
  &:hover {
    background: rgba(255, 255, 255, 0.8);
    transform: translateY(-2px);
  }
`;

const ClockDisplay = styled.div`
  position: fixed;
  top: 20px;
  right: 20px;
  text-align: right;
  color: #333;
  z-index: 50;
  
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

// Widget content components
const WeatherContent = ({ weather }) => (
  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
      <div style={{ color: '#f9d71c', fontSize: '24px' }}>
        <IoSunny />
      </div>
      <div>
        <h2 style={{ margin: 0, fontSize: '20px' }}>{weather.temperature}° {weather.condition}</h2>
      </div>
    </div>
  </div>
);

const EmailContent = ({ emails }) => (
  <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
    <div style={{ color: '#ff9800', fontSize: '24px' }}>
      <FaEnvelope />
    </div>
    <div>
      <h3 style={{ margin: 0 }}>You've received</h3>
      <p style={{ margin: '5px 0 0' }}>{emails} emails</p>
    </div>
  </div>
);

const GreetingContent = ({ greeting }) => (
  <div style={{ textAlign: 'center' }}>
    <h2 style={{ fontSize: '28px', margin: '0 0 10px' }}>{greeting}</h2>
    <p>hope you had a great night!</p>
  </div>
);

const MusicContent = ({ music, onTogglePlay }) => (
  <div>
    <div style={{ display: 'flex', alignItems: 'center', gap: '15px', marginBottom: '15px' }}>
      <div style={{ width: '60px', height: '60px', borderRadius: '10px', overflow: 'hidden' }}>
        <img src={music.coverUrl} alt="Album cover" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
      </div>
      <div>
        <h3 style={{ margin: 0, fontSize: '18px' }}>{music.title}</h3>
        <p style={{ margin: '5px 0 0', fontSize: '14px', color: '#666' }}>{music.artist}</p>
      </div>
    </div>
    
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '20px', marginTop: '20px' }}>
      <button style={{ background: 'none', border: 'none', color: '#4a4a4a', fontSize: '16px', cursor: 'pointer' }}>
        <FaStepBackward />
      </button>
      <button 
        onClick={onTogglePlay}
        style={{
          width: '40px',
          height: '40px',
          borderRadius: '50%',
          background: 'white',
          border: 'none',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          boxShadow: '0 2px 5px rgba(0, 0, 0, 0.1)',
          cursor: 'pointer'
        }}
      >
        <FaPlay />
      </button>
      <button style={{ background: 'none', border: 'none', color: '#4a4a4a', fontSize: '16px', cursor: 'pointer' }}>
        <FaStepForward />
      </button>
    </div>
  </div>
);

const CalendarContent = ({ events }) => (
  <div>
    <h3 style={{ margin: '0 0 15px', fontSize: '18px' }}>Upcoming Events</h3>
    <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
      {events.map((event) => (
        <div 
          key={event.id} 
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '10px',
            padding: '8px',
            borderRadius: '10px',
            background: 'rgba(255, 255, 255, 0.2)'
          }}
        >
          <span style={{ fontWeight: '500', fontSize: '14px' }}>{event.time}</span>
          <span>{event.title}</span>
        </div>
      ))}
    </div>
  </div>
);

const CustomizableDashboard = () => {
  const {
    currentTime,
    weather,
    emails,
    events,
    music,
    formatTime,
    formatDate,
    getGreeting,
    togglePlayMusic
  } = useDashboard();
  
  const { 
    orbStatus, 
    lastCommand, 
    processCommand 
  } = useAppContext();
  
  const [widgets, setWidgets] = useState([
    { id: 'weather', title: 'Weather', position: { x: 100, y: 100 }, size: { width: 300, height: 100 }, type: 'weather' },
    { id: 'email', title: 'Email', position: { x: 100, y: 220 }, size: { width: 300, height: 100 }, type: 'email' },
    { id: 'greeting', title: 'Greeting', position: { x: 420, y: 100 }, size: { width: 300, height: 150 }, type: 'greeting' },
    { id: 'music', title: 'Music', position: { x: 100, y: 340 }, size: { width: 300, height: 200 }, type: 'music' },
    { id: 'calendar', title: 'Calendar', position: { x: 420, y: 270 }, size: { width: 300, height: 270 }, type: 'calendar' }
  ]);
  
  const [showWidgetMenu, setShowWidgetMenu] = useState(false);
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
  
  const handlePositionChange = (id, newPosition) => {
    setWidgets(prevWidgets => 
      prevWidgets.map(widget => 
        widget.id === id ? { ...widget, position: newPosition } : widget
      )
    );
  };
  
  const handleRemoveWidget = (id) => {
    setWidgets(prevWidgets => prevWidgets.filter(widget => widget.id !== id));
  };
  
  const addWidget = (type) => {
    const newId = `${type}-${Date.now()}`;
    const newWidget = {
      id: newId,
      title: type.charAt(0).toUpperCase() + type.slice(1),
      position: { x: 200, y: 200 },
      size: { width: 300, height: type === 'music' ? 200 : type === 'calendar' ? 250 : 100 },
      type
    };
    
    setWidgets(prevWidgets => [...prevWidgets, newWidget]);
    setShowWidgetMenu(false);
  };
  
  const renderWidgetContent = (widget) => {
    switch (widget.type) {
      case 'weather':
        return <WeatherContent weather={weather} />;
      case 'email':
        return <EmailContent emails={emails} />;
      case 'greeting':
        return <GreetingContent greeting={getGreeting()} />;
      case 'music':
        return <MusicContent music={music} onTogglePlay={togglePlayMusic} />;
      case 'calendar':
        return <CalendarContent events={events} />;
      default:
        return <div>Widget content</div>;
    }
  };
  
  return (
    <DashboardContainer>
      <SidePanel>
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
      </SidePanel>
      
      {widgets.map((widget) => (
        <DraggableWidget
          key={widget.id}
          id={widget.id}
          title={widget.title}
          initialPosition={widget.position}
          onPositionChange={handlePositionChange}
          onRemove={handleRemoveWidget}
        >
          {renderWidgetContent(widget)}
        </DraggableWidget>
      ))}
      
      <PulsingOrb 
        status={orbStatus} 
        ref={orbRef} 
        className="orb-ref" 
        style={{ 
          position: 'fixed', 
          bottom: '80px', 
          left: '50%', 
          transform: 'translateX(-50%)',
          zIndex: 50
        }} 
      />
      
      {lastCommand && (
        <MessageContainer>
          <p>{lastCommand}</p>
        </MessageContainer>
      )}
      
      <ClockDisplay>
        <h1>{formatTime(currentTime)}</h1>
        <p>{formatDate(currentTime)}</p>
      </ClockDisplay>
      
      <AddWidgetButton onClick={() => setShowWidgetMenu(!showWidgetMenu)}>
        <FaPlus />
      </AddWidgetButton>
      
      {showWidgetMenu && (
        <WidgetMenu
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 20 }}
        >
          <WidgetMenuItem onClick={() => addWidget('weather')}>Weather Widget</WidgetMenuItem>
          <WidgetMenuItem onClick={() => addWidget('email')}>Email Widget</WidgetMenuItem>
          <WidgetMenuItem onClick={() => addWidget('greeting')}>Greeting Widget</WidgetMenuItem>
          <WidgetMenuItem onClick={() => addWidget('music')}>Music Widget</WidgetMenuItem>
          <WidgetMenuItem onClick={() => addWidget('calendar')}>Calendar Widget</WidgetMenuItem>
        </WidgetMenu>
      )}
      
      <RealtimeVoiceInterface orbStatus={orbStatus} processCommand={processCommand} />
    </DashboardContainer>
  );
};

export default CustomizableDashboard;
