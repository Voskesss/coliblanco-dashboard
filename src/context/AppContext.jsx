import React, { createContext, useState, useContext } from 'react';

// Creëer de context
const AppContext = createContext();

// Custom hook om de context gemakkelijk te gebruiken
export const useAppContext = () => useContext(AppContext);

// Context provider component
export const AppProvider = ({ children }) => {
  const [orbStatus, setOrbStatus] = useState('idle'); // idle, listening, processing, active
  const [showCards, setShowCards] = useState(false);
  const [lastCommand, setLastCommand] = useState('');
  const [notifications, setNotifications] = useState([
    { id: 1, text: '3 nieuwe berichten in Slack', read: false },
    { id: 2, text: 'Updates beschikbaar voor 2 packages', read: false },
    { id: 3, text: 'Herinnering: Deadline project vrijdag', read: false }
  ]);
  
  // Functie om een spraakcommando te verwerken
  const processCommand = (command) => {
    setLastCommand(command);
    setOrbStatus('processing');
    
    // Simuleer verwerking
    setTimeout(() => {
      setOrbStatus('active');
      setShowCards(true);
    }, 1500);
  };
  
  // Functie om een notificatie als gelezen te markeren
  const markNotificationAsRead = (id) => {
    setNotifications(notifications.map(notif => 
      notif.id === id ? { ...notif, read: true } : notif
    ));
  };
  
  // Waarden en functies die we beschikbaar willen maken in de context
  const contextValue = {
    orbStatus,
    setOrbStatus,
    showCards,
    setShowCards,
    lastCommand,
    processCommand,
    notifications,
    markNotificationAsRead
  };
  
  return (
    <AppContext.Provider value={contextValue}>
      {children}
    </AppContext.Provider>
  );
};

export default AppProvider;
