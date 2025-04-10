import React, { createContext, useState, useContext } from 'react';
import { processWithLLM } from '../utils/openai';

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
  const processCommand = async (command, context = {}) => {
    setLastCommand(command);
    setOrbStatus('processing');
    
    try {
      // Gebruik de echte OpenAI LLM functie om het commando te verwerken
      const response = await processWithLLM(command, context);
      console.log('Echte LLM antwoord ontvangen:', response);
      
      // Update de UI met het echte antwoord
      setOrbStatus('active');
      setShowCards(true);
      setLastCommand(response.response); // Zorg ervoor dat we de string opslaan, niet het object
      
      // Retourneer het antwoord in het juiste formaat voor de spraakinterface
      return response;
    } catch (error) {
      console.error('Fout bij verwerken van commando met LLM:', error);
      
      // Fallback naar een algemeen antwoord bij fouten
      const fallbackResponse = {
        response: "Er is een fout opgetreden bij het verwerken van je vraag. Probeer het later nog eens.",
        conversationHistory: context.conversationHistory || []
      };
      
      setOrbStatus('idle');
      return fallbackResponse;
    }
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
    setLastCommand,
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
