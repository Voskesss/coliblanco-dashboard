import React, { useState, useEffect, createContext, useContext } from 'react';

// Context voor dashboard data en functies
const DashboardContext = createContext();

// Hook om de dashboard context te gebruiken in componenten
export const useDashboard = () => {
  const context = useContext(DashboardContext);
  if (!context) {
    throw new Error('useDashboard moet binnen een DashboardProvider gebruikt worden');
  }
  return context;
};

// Provider component die de data en functies levert aan alle dashboards
const DashboardController = ({ children }) => {
  // Gedeelde state voor alle dashboards
  const [currentTime, setCurrentTime] = useState(new Date());
  const [weather, setWeather] = useState({
    temperature: 22,
    condition: 'Sunny',
    icon: 'sunny'
  });
  const [emails, setEmails] = useState(3);
  const [events, setEvents] = useState([
    { id: 1, time: '9:00', title: 'Gym', icon: 'gym' },
    { id: 2, time: '11:00', title: 'Meeting with Max', icon: 'meeting' },
    { id: 3, time: '13:30', title: 'Dentist appointment', icon: 'health' }
  ]);
  const [music, setMusic] = useState({
    title: 'Spotify Vibes',
    artist: 'Mail',
    coverUrl: 'https://via.placeholder.com/80',
    isPlaying: false
  });
  
  // Update de tijd elke seconde
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);
    
    return () => clearInterval(timer);
  }, []);
  
  // Helper functies voor alle dashboards
  const formatTime = (date) => {
    return date.toLocaleTimeString('nl-NL', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: false
    });
  };
  
  const formatDate = (date) => {
    return date.toLocaleDateString('nl-NL', {
      weekday: 'long',
      month: 'long',
      day: 'numeric'
    });
  };
  
  const getGreeting = () => {
    const hour = currentTime.getHours();
    if (hour < 12) return 'Good morning';
    if (hour < 18) return 'Good afternoon';
    return 'Good evening';
  };
  
  // Genereer kalender data
  const generateCalendarDays = () => {
    const days = [];
    const today = new Date();
    const firstDay = new Date(today.getFullYear(), today.getMonth(), 1);
    const lastDay = new Date(today.getFullYear(), today.getMonth() + 1, 0);
    
    // Voeg dagen toe
    for (let i = 1; i <= lastDay.getDate(); i++) {
      days.push({
        day: i,
        isToday: i === today.getDate()
      });
    }
    
    return days;
  };
  
  // Muziek controle functies
  const togglePlayMusic = () => {
    setMusic(prev => ({
      ...prev,
      isPlaying: !prev.isPlaying
    }));
  };
  
  // Alle data en functies die we willen delen met dashboards
  const value = {
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
    dayNames: ['M', 'T', 'W', 'T', 'F', 'S', 'S']
  };
  
  return (
    <DashboardContext.Provider value={value}>
      {children}
    </DashboardContext.Provider>
  );
};

export default DashboardController;
