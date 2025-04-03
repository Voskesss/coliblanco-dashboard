// Configuratie voor verschillende providers en modellen
// Vite laadt automatisch omgevingsvariabelen die beginnen met VITE_

export const config = {
  // OpenAI API key (in productie zou dit via een backend moeten gaan voor veiligheid)
  openaiApiKey: import.meta.env.VITE_OPENAI_API_KEY,
  
  // Providers
  sttProvider: import.meta.env.VITE_STT_PROVIDER || 'openai',
  ttsProvider: import.meta.env.VITE_TTS_PROVIDER || 'openai',
  llmProvider: import.meta.env.VITE_LLM_PROVIDER || 'openai',
  
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
  
  if (!config.openaiApiKey) {
    missingConfig.push('VITE_OPENAI_API_KEY');
  }
  
  return {
    isValid: missingConfig.length === 0,
    missingConfig
  };
};
