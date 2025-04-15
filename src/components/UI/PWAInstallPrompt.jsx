import React, { useState, useEffect } from 'react';
import styled from '@emotion/styled';
import { motion, AnimatePresence } from 'framer-motion';
import { FaDownload, FaTimes } from 'react-icons/fa';

const PWAContainer = styled(motion.div)`
  position: fixed;
  bottom: 20px;
  left: 20px;
  background: rgba(255, 255, 255, 0.9);
  backdrop-filter: blur(10px);
  border-radius: 12px;
  padding: 15px 20px;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.15);
  z-index: 1000;
  max-width: 320px;
  display: flex;
  flex-direction: column;
`;

const PWAHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 10px;
`;

const PWATitle = styled.h3`
  margin: 0;
  font-size: 16px;
  font-weight: 600;
  color: #1B406F;
`;

const CloseButton = styled.button`
  background: none;
  border: none;
  color: #666;
  cursor: pointer;
  padding: 5px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 16px;
  
  &:hover {
    color: #333;
  }
`;

const PWAContent = styled.p`
  margin: 0 0 15px 0;
  font-size: 14px;
  color: #555;
  line-height: 1.4;
`;

const InstallButton = styled.button`
  background: #1B406F;
  color: white;
  border: none;
  border-radius: 8px;
  padding: 10px 15px;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  transition: background 0.2s ease;
  
  &:hover {
    background: #2A5183;
  }
`;

const PWAInstallPrompt = () => {
  const [showPrompt, setShowPrompt] = useState(false);
  const [deferredPrompt, setDeferredPrompt] = useState(null);
  
  useEffect(() => {
    // Controleer of de app al is geïnstalleerd
    const isAppInstalled = window.matchMedia('(display-mode: standalone)').matches;
    
    if (isAppInstalled) {
      return; // Als de app al is geïnstalleerd, toon geen prompt
    }
    
    // Luister naar het beforeinstallprompt event
    const handleBeforeInstallPrompt = (e) => {
      // Voorkom dat de browser de standaard installatieprompt toont
      e.preventDefault();
      // Bewaar het event om het later te kunnen gebruiken
      setDeferredPrompt(e);
      // Toon onze eigen prompt
      setShowPrompt(true);
    };
    
    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    
    // Controleer of de app al eerder is afgewezen
    const promptDismissed = localStorage.getItem('pwaPromptDismissed');
    if (promptDismissed && new Date().getTime() - parseInt(promptDismissed) < 7 * 24 * 60 * 60 * 1000) {
      setShowPrompt(false); // Verberg de prompt als deze minder dan een week geleden is afgewezen
    }
    
    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    };
  }, []);
  
  const handleInstall = async () => {
    if (!deferredPrompt) return;
    
    // Toon de installatieprompt
    deferredPrompt.prompt();
    
    // Wacht tot de gebruiker heeft gereageerd op de prompt
    const { outcome } = await deferredPrompt.userChoice;
    
    // We hebben het deferredPrompt niet meer nodig
    setDeferredPrompt(null);
    
    // Verberg onze eigen prompt
    setShowPrompt(false);
    
    console.log(`Gebruiker heeft gekozen: ${outcome}`);
  };
  
  const dismissPrompt = () => {
    setShowPrompt(false);
    // Onthoud dat de gebruiker de prompt heeft afgewezen
    localStorage.setItem('pwaPromptDismissed', new Date().getTime().toString());
  };
  
  return (
    <AnimatePresence>
      {showPrompt && (
        <PWAContainer
          initial={{ opacity: 0, y: 50 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 50 }}
          transition={{ duration: 0.3 }}
        >
          <PWAHeader>
            <PWATitle>Installeer Coliblanco</PWATitle>
            <CloseButton onClick={dismissPrompt}>
              <FaTimes />
            </CloseButton>
          </PWAHeader>
          <PWAContent>
            Installeer het Coliblanco Dashboard op je apparaat voor snellere toegang en offline gebruik.
          </PWAContent>
          <InstallButton onClick={handleInstall}>
            <FaDownload /> Installeren
          </InstallButton>
        </PWAContainer>
      )}
    </AnimatePresence>
  );
};

export default PWAInstallPrompt;
