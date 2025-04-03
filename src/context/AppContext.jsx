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
  
  // Vooraf gedefinieerde taken en antwoorden
  const mockTasks = [
    {
      command: "Wat staat er vandaag op de agenda?",
      response: "Je hebt vandaag om 11:00 een vergadering met het ontwikkelteam en om 14:30 een call met de klant over de nieuwe features.",
      audioUrl: "/audio/agenda.mp3"
    },
    {
      command: "Stuur een mail naar het team",
      response: "Ik heb een conceptmail opgesteld voor het team over de voortgang van het project. Wil je deze bekijken?",
      audioUrl: "/audio/mail.mp3"
    },
    {
      command: "Wat is de status van het project?",
      response: "Het project ligt op schema. We hebben 75% van de geplande features afgerond en verwachten volgende week de testfase te starten.",
      audioUrl: "/audio/status.mp3"
    },
    {
      command: "Maak een samenvatting van het laatste rapport",
      response: "Het laatste rapport toont een stijging van 15% in gebruikersactiviteit en een verbetering van 20% in laadtijd van de applicatie na de laatste update.",
      audioUrl: "/audio/rapport.mp3"
    },
    {
      command: "Plan een meeting voor volgende week",
      response: "Ik heb een meeting ingepland voor volgende week dinsdag om 10:00 uur met het hele team om de voortgang te bespreken.",
      audioUrl: "/audio/meeting.mp3"
    }
  ];
  
  // Functie om een spraakcommando te verwerken
  const processCommand = (command) => {
    setLastCommand(command);
    setOrbStatus('processing');
    
    // Zoek een passend antwoord in onze vooraf gedefinieerde taken
    let foundTask = null;
    
    // Controleer of het commando overeenkomt met een van onze taken
    for (const task of mockTasks) {
      if (command.toLowerCase().includes(task.command.toLowerCase()) || 
          task.command.toLowerCase().includes(command.toLowerCase())) {
        foundTask = task;
        break;
      }
    }
    
    // Als er geen specifieke taak is gevonden, gebruik een algemeen antwoord
    if (!foundTask) {
      foundTask = {
        response: "Ik begrijp je vraag. Kan je iets specifieker zijn over wat je wilt weten of doen?",
        audioUrl: "/audio/algemeen.mp3"
      };
    }
    
    // Simuleer verwerking en toon het antwoord
    setTimeout(() => {
      setOrbStatus('active');
      setShowCards(true);
      setLastCommand(foundTask.response); // Toon het antwoord in de UI
    }, 1500);
    
    // Geef het gevonden antwoord terug voor gebruik in de spraakinterface
    return foundTask;
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
    markNotificationAsRead,
    mockTasks
  };
  
  return (
    <AppContext.Provider value={contextValue}>
      {children}
    </AppContext.Provider>
  );
};

export default AppProvider;
