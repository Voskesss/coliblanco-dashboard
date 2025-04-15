import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'
import AppProvider from './context/AppContext.jsx'
import { registerSW } from 'virtual:pwa-register'

// Registreer de service worker voor PWA-functionaliteit
const updateSW = registerSW({
  onNeedRefresh() {
    if (confirm('Er is een nieuwe versie beschikbaar. Wil je updaten?')) {
      updateSW(true)
    }
  },
  onOfflineReady() {
    console.log('App is klaar voor offline gebruik')
  },
})

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <AppProvider>
      <App />
    </AppProvider>
  </StrictMode>,
)
