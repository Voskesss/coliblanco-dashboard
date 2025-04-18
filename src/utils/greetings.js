/**
 * Geeft een begroeting terug op basis van het huidige tijdstip en de taalinstelling van de browser
 * @returns {string} De begroeting
 */
export const getGreetingByTime = () => {
  const hour = new Date().getHours();
  const userLanguage = navigator.language || navigator.userLanguage || 'nl';
  const isEnglish = userLanguage.startsWith('en');
  
  // Arrays met verschillende begroetingen per dagdeel
  const morningGreetingsNL = [
    "Goedemorgen! Wat kan ik vandaag voor je doen?",
    "Hallo, goedemorgen! Hoe kan ik je helpen?",
    "Goedemorgen! Klaar om er een productieve dag van te maken?",
    "Een frisse start van de dag! Waarmee kan ik je helpen?",
    "Goedemorgen! Hoe gaat het vandaag met je?"
  ];
  
  const morningGreetingsEN = [
    "Good morning! What can I do for you today?",
    "Hello, good morning! How can I help you?",
    "Good morning! Ready to make it a productive day?",
    "A fresh start to the day! How may I assist you?",
    "Good morning! How are you doing today?"
  ];
  
  const afternoonGreetingsNL = [
    "Goedemiddag! Hoe kan ik je helpen?",
    "Hallo! Hoe gaat je middag tot nu toe?",
    "Goedemiddag! Waar kan ik je mee van dienst zijn?",
    "Middag! Wat staat er op de planning?",
    "Goedemiddag! Waarmee kan ik je helpen?"
  ];
  
  const afternoonGreetingsEN = [
    "Good afternoon! How can I help you?",
    "Hello! How's your afternoon going so far?",
    "Good afternoon! How may I be of service?",
    "Afternoon! What's on the agenda?",
    "Good afternoon! What can I help you with?"
  ];
  
  const eveningGreetingsNL = [
    "Goedenavond! Waarmee kan ik je van dienst zijn?",
    "Hallo, goedenavond! Hoe kan ik je helpen?",
    "Goedenavond! Wat kan ik voor je doen?",
    "Fijne avond! Waar kan ik je mee helpen?",
    "Goedenavond! Hoe is je dag geweest?"
  ];
  
  const eveningGreetingsEN = [
    "Good evening! How may I assist you?",
    "Hello, good evening! How can I help you?",
    "Good evening! What can I do for you?",
    "Pleasant evening! What can I help you with?",
    "Good evening! How has your day been?"
  ];
  
  const nightGreetingsNL = [
    "Hallo! Ook zo laat nog aan het werk?",
    "Nog wakker? Waarmee kan ik je helpen?",
    "Een nachtelijke sessie? Waar kan ik je mee assisteren?",
    "Hallo daar! Wat houdt je zo laat nog bezig?",
    "Goedenacht! Kan ik je ergens mee helpen?"
  ];
  
  const nightGreetingsEN = [
    "Hello! Working late tonight?",
    "Still awake? How can I help you?",
    "A late-night session? What can I assist you with?",
    "Hello there! What keeps you up so late?",
    "Good night! Can I help you with anything?"
  ];
  
  // Kies een willekeurige begroeting uit de juiste array
  const getRandomGreeting = (greetings) => {
    const randomIndex = Math.floor(Math.random() * greetings.length);
    return greetings[randomIndex];
  };
  
  if (hour >= 6 && hour < 12) {
    return isEnglish 
      ? getRandomGreeting(morningGreetingsEN)
      : getRandomGreeting(morningGreetingsNL);
  } else if (hour >= 12 && hour < 18) {
    return isEnglish 
      ? getRandomGreeting(afternoonGreetingsEN)
      : getRandomGreeting(afternoonGreetingsNL);
  } else if (hour >= 18 && hour < 23) {
    return isEnglish 
      ? getRandomGreeting(eveningGreetingsEN)
      : getRandomGreeting(eveningGreetingsNL);
  } else {
    return isEnglish 
      ? getRandomGreeting(nightGreetingsEN)
      : getRandomGreeting(nightGreetingsNL);
  }
};

// Singleton patroon - genereer de begroeting slechts één keer per sessie
let cachedGreeting = null;

export const getStableGreeting = () => {
  if (cachedGreeting === null) {
    cachedGreeting = getGreetingByTime();
  }
  return cachedGreeting;
};
