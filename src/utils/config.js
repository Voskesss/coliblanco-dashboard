// Configuratie voor verschillende providers en modellen
// Vite laadt automatisch omgevingsvariabelen die beginnen met VITE_

export const config = {
  // OpenAI API key wordt alleen op de server gebruikt, niet in de client
  // In de client gebruiken we de server endpoints
  
  // Providers
  sttProvider: import.meta.env.VITE_STT_PROVIDER || 'openai',
  ttsProvider: import.meta.env.VITE_TTS_PROVIDER || 'openai',
  llmProvider: import.meta.env.VITE_LLM_PROVIDER || 'openai',
  
  // API endpoints
  apiBaseUrl: import.meta.env.VITE_API_BASE_URL || '/api',
  
  // Model configuratie
  models: {
    openai: {
      stt: import.meta.env.VITE_OPENAI_STT_MODEL || 'whisper-1',
      llm: import.meta.env.VITE_OPENAI_LLM_MODEL || 'gpt-4o',
      tts: import.meta.env.VITE_OPENAI_TTS_MODEL || 'tts-1',
      ttsVoice: import.meta.env.VITE_OPENAI_TTS_VOICE || 'alloy',
    },
    // Andere providers kunnen hier worden toegevoegd
  }
};

// Helper functie om te controleren of alle benodigde configuraties aanwezig zijn
export const validateConfig = () => {
  const missingConfig = [];
  
  // We controleren niet meer op de API key omdat die alleen op de server wordt gebruikt
  
  return {
    isValid: missingConfig.length === 0,
    missingConfig
  };
};
