// Configuratie voor verschillende omgevingen

// Bepaal de huidige omgeving
const isProduction = import.meta.env.PROD || false;
const isDevelopment = import.meta.env.DEV || true;

// Configuratie voor de backend URL
export const getBackendUrl = () => {
  // In productie, gebruik de Azure URL
  if (isProduction) {
    // Gebruik de geconfigureerde URL of de standaard Azure URL
    return import.meta.env.VITE_BACKEND_URL || 'https://coliblanco-python-backend.azurewebsites.net';
  }
  
  // In ontwikkeling, gebruik localhost
  return 'http://localhost:5001';
};

// Configuratie voor WebSocket URL
export const getWebSocketUrl = () => {
  // In productie, gebruik de Azure URL
  if (isProduction) {
    // Gebruik de geconfigureerde URL of de standaard Azure URL
    return import.meta.env.VITE_WEBSOCKET_URL || 'wss://coliblanco-python-backend.azurewebsites.net';
  }
  
  // In ontwikkeling, gebruik localhost
  return 'ws://localhost:5001';
};

// Exporteer de omgevingsvariabelen
export const environment = {
  isProduction,
  isDevelopment,
  backendUrl: getBackendUrl(),
  webSocketUrl: getWebSocketUrl()
};
