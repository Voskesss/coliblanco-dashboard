// Browser-side wake word detectie met Porcupine
import { PorcupineWorker } from '@picovoice/porcupine-web';
import { WebVoiceProcessor } from '@picovoice/web-voice-processor';

// Configuratie voor wake word detectie
const WAKE_WORD = 'hey google'; // Standaard wake word

class WakeWordDetector {
  constructor() {
    this.porcupineWorker = null;
    this.isListening = false;
    this.onWakeWordCallback = null;
    this.accessKey = '4EDgNOCnmtX'; // Picovoice Access Key
  }

  async init() {
    try {
      // Controleer of de browser audio-opname ondersteunt
      // Opmerking: isAudioSupported is mogelijk niet beschikbaar in nieuwere versies
      // van de bibliotheek, dus we vangen deze fout op en gaan door
      try {
        if (WebVoiceProcessor.isAudioSupported && !WebVoiceProcessor.isAudioSupported()) {
          console.error('Je browser ondersteunt geen audio-opname');
          return false;
        }
      } catch (audioSupportError) {
        console.warn('Kon audio-ondersteuning niet controleren, ga door met initialisatie');
      }

      // Initialiseer de Porcupine worker met een standaard wake word
      this.porcupineWorker = await PorcupineWorker.create(
        this.accessKey,
        [{ builtin: WAKE_WORD }],
        this.handleWakeWord.bind(this)
      );

      console.log(`Wake word detector geïnitialiseerd voor: ${WAKE_WORD}`);
      return true;
    } catch (error) {
      console.error('Fout bij initialiseren wake word detector:', error);
      return false;
    }
  }

  handleWakeWord(keywordIndex) {
    if (keywordIndex !== -1 && this.onWakeWordCallback) {
      console.log('Wake word gedetecteerd!');
      this.onWakeWordCallback();
    }
  }

  setOnWakeWordCallback(callback) {
    this.onWakeWordCallback = callback;
  }

  async start() {
    if (!this.porcupineWorker) {
      const initialized = await this.init();
      if (!initialized) {
        console.error('Kon wake word detector niet starten: niet geïnitialiseerd');
        return false;
      }
    }
    
    try {
      if (!this.isListening) {
        // Start de audio-opname en verwerking
        await WebVoiceProcessor.connect(this.porcupineWorker);
        this.isListening = true;
        console.log('Wake word detectie gestart');
        return true;
      }
      return true; // Al aan het luisteren
    } catch (error) {
      console.error('Fout bij starten wake word detectie:', error);
      this.isListening = false;
      return false;
    }
  }

  async stop() {
    if (!this.isListening) return;

    try {
      // Stop de WebVoiceProcessor
      await WebVoiceProcessor.disconnect();
      this.isListening = false;
      console.log('Wake word detectie gestopt');
    } catch (error) {
      console.error('Fout bij stoppen wake word detectie:', error);
    }
  }

  async release() {
    try {
      await this.stop();
      if (this.porcupineWorker) {
        this.porcupineWorker.terminate();
        this.porcupineWorker = null;
      }
      console.log('Wake word detector vrijgegeven');
    } catch (error) {
      console.error('Fout bij vrijgeven wake word detector:', error);
    }
  }
}

// Singleton instance
let wakeWordDetector = null;

export const getWakeWordDetector = async () => {
  if (!wakeWordDetector) {
    wakeWordDetector = new WakeWordDetector();
    await wakeWordDetector.init();
  }
  return wakeWordDetector;
};

export default WakeWordDetector;
