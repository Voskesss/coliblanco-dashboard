import os
import asyncio
import json
import logging
import tempfile
import requests
from dotenv import load_dotenv
from deepgram import Deepgram

# Configureer logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Laad environment variables
load_dotenv()

# Configuratie
DEEPGRAM_API_KEY = os.getenv("DEEPGRAM_ACCESS_KEY")
LANGUAGE = os.getenv("LANGUAGE", "nl")

# Initialiseer Deepgram client
dg_client = Deepgram(DEEPGRAM_API_KEY)

async def transcribe_audio(audio_data, language=None):
    """Transcribeer audio met Deepgram Nova-3"""
    try:
        # Gebruik de opgegeven taal of val terug op de standaardtaal
        lang = language or LANGUAGE
        
        # Maak een tijdelijk bestand voor de audio data
        with tempfile.NamedTemporaryFile(suffix=".wav", delete=False) as temp_file:
            temp_file.write(audio_data)
            temp_file_path = temp_file.name
        
        # Configureer de transcriptie opties
        source = {'buffer': audio_data, 'mimetype': 'audio/wav'}
        options = {
            'model': 'nova-3',
            'language': lang,
            'smart_format': True,
            'diarize': True,
            'utterances': True,
            'detect_language': True
        }
        
        # Transcribeer de audio
        response = await dg_client.transcription.prerecorded(source, options)
        
        # Verwijder het tijdelijke bestand
        os.unlink(temp_file_path)
        
        # Haal de transcriptie op
        transcript = response['results']['channels'][0]['alternatives'][0]['transcript']
        detected_language = response['results']['channels'][0].get('detected_language', lang)
        
        logger.info(f"Transcriptie: {transcript}")
        logger.info(f"Gedetecteerde taal: {detected_language}")
        
        return {
            "text": transcript,
            "language": detected_language
        }
    except Exception as e:
        logger.error(f"Fout bij transcriberen audio: {str(e)}")
        return {"text": "", "error": str(e)}

async def text_to_speech(text, voice=None, language=None):
    """Zet tekst om naar spraak met OpenAI TTS"""
    try:
        # Gebruik de opgegeven taal of val terug op de standaardtaal
        lang = language or LANGUAGE
        
        # Controleer of de OpenAI API-sleutel is ingesteld
        openai_api_key = os.getenv("OPENAI_API_KEY")
        if not openai_api_key:
            logger.error("Geen OpenAI API-sleutel gevonden. Stel OPENAI_API_KEY in in je .env bestand.")
            return {"error": "Geen API-sleutel gevonden"}
        
        # Controleer of de tekst geldig is
        if not text or not isinstance(text, str) or text.strip() == "":
            return {"error": "Tekst mag niet leeg zijn"}
        
        # Kies de juiste stem
        # OpenAI stemmen: alloy, echo, fable, onyx, nova, shimmer
        tts_voice = voice or "alloy"
        
        # API endpoint voor OpenAI TTS
        url = "https://api.openai.com/v1/audio/speech"
        
        # Headers met de API key
        headers = {
            "Authorization": f"Bearer {openai_api_key}",
            "Content-Type": "application/json"
        }
        
        # Data voor het verzoek
        data = {
            "model": "tts-1",
            "input": text.strip(),
            "voice": tts_voice
        }
        
        logger.info(f"TTS aanvraag: {data}")
        
        # Stuur het verzoek
        response = requests.post(url, headers=headers, json=data)
        
        if response.status_code == 200:
            # Maak een tijdelijk bestand voor de audio
            with tempfile.NamedTemporaryFile(suffix=".mp3", delete=False) as temp_file:
                temp_file.write(response.content)
                temp_file_path = temp_file.name
            
            # Lees de audio data
            with open(temp_file_path, "rb") as f:
                audio_data = f.read()
            
            # Verwijder het tijdelijke bestand
            os.unlink(temp_file_path)
            
            return {
                "audio": audio_data,
                "content_type": "audio/mpeg"
            }
        else:
            logger.error(f"Fout bij TTS: {response.status_code} - {response.text}")
            return {"error": f"Fout bij TTS: {response.status_code} - {response.text}"}
    except Exception as e:
        logger.error(f"Fout bij TTS: {str(e)}")
        return {"error": str(e)}

# WebSocket handlers voor real-time transcriptie
class DeepgramLiveTranscription:
    def __init__(self, callback=None):
        self.callback = callback
        self.connection = None
        self.is_listening = False
    
    async def start(self, language=None, callback=None):
        """Start real-time transcriptie"""
        try:
            # Stel de callback in als die is opgegeven
            if callback:
                self.callback = callback
                
            # Gebruik de opgegeven taal of val terug op de standaardtaal
            lang = language or LANGUAGE
            
            # Controleer of de API-sleutel is ingesteld
            if not DEEPGRAM_API_KEY:
                logger.error("Geen Deepgram API-sleutel gevonden. Stel DEEPGRAM_ACCESS_KEY in in je .env bestand.")
                return False
            
            # Configureer de live transcriptie opties
            # Vereenvoudig de opties om compatibiliteitsproblemen te voorkomen
            options = {
                'language': lang,
                'smart_format': True,
                'interim_results': True
            }
            
            # Voeg optionele parameters toe als ze ondersteund worden
            try:
                # Maak een verbinding
                self.connection = await dg_client.transcription.live(options)
                
                # Stel de callback in voor binnenkomende transcripties
                self.connection.registerHandler('transcriptReceived', self._on_transcript)
                
                self.is_listening = True
                logger.info("Deepgram live transcriptie gestart")
                return True
            except Exception as connection_error:
                # Als de eerste poging mislukt, probeer met minimale opties
                logger.warning(f"Eerste poging mislukt: {str(connection_error)}. Proberen met minimale opties...")
                minimal_options = {'language': lang}
                
                self.connection = await dg_client.transcription.live(minimal_options)
                self.connection.registerHandler('transcriptReceived', self._on_transcript)
                
                self.is_listening = True
                logger.info("Deepgram live transcriptie gestart met minimale opties")
                return True
        except Exception as e:
            logger.error(f"Fout bij starten live transcriptie: {str(e)}")
            return False
    
    def _on_transcript(self, transcript):
        """Callback voor binnenkomende transcripties"""
        try:
            # Log de ontvangen transcript structuur voor debugging
            logger.debug(f"Ontvangen transcript: {json.dumps(transcript, indent=2)}")
            
            if not self.callback:
                return
            
            # Controleer verschillende mogelijke structuren van de transcriptie
            is_final = transcript.get('is_final', False)
            
            # Probeer de tekst te vinden in verschillende structuren
            text = ""
            
            # Structuur 1: channel.alternatives[0].transcript
            if 'channel' in transcript:
                alternatives = transcript.get('channel', {}).get('alternatives', [])
                if alternatives and len(alternatives) > 0:
                    text = alternatives[0].get('transcript', '')
            
            # Structuur 2: channels[0].alternatives[0].transcript
            elif 'channels' in transcript and len(transcript['channels']) > 0:
                alternatives = transcript['channels'][0].get('alternatives', [])
                if alternatives and len(alternatives) > 0:
                    text = alternatives[0].get('transcript', '')
            
            # Structuur 3: alternatives[0].transcript
            elif 'alternatives' in transcript and len(transcript['alternatives']) > 0:
                text = transcript['alternatives'][0].get('transcript', '')
            
            # Structuur 4: transcript direct
            elif 'transcript' in transcript:
                text = transcript['transcript']
            
            # Alleen doorgeven als er tekst is
            if text and text.strip():
                self.callback({
                    "text": text.strip(),
                    "is_final": is_final
                })
        except Exception as e:
            logger.error(f"Fout bij verwerken transcriptie: {str(e)}")
    
    async def send_audio(self, audio_data):
        """Stuur audio data naar Deepgram"""
        if not self.is_listening or not self.connection:
            return False
        
        try:
            await self.connection.send(audio_data)
            return True
        except Exception as e:
            logger.error(f"Fout bij versturen audio data: {str(e)}")
            return False
    
    async def stop(self):
        """Stop de live transcriptie"""
        if not self.is_listening or not self.connection:
            return
        
        try:
            await self.connection.finish()
            self.is_listening = False
            logger.info("Deepgram live transcriptie gestopt")
        except Exception as e:
            logger.error(f"Fout bij stoppen live transcriptie: {str(e)}")

# Test functie
async def test_deepgram():
    """Test de Deepgram integratie"""
    # Test STT
    with open("test.wav", "rb") as f:
        audio_data = f.read()
    
    result = await transcribe_audio(audio_data)
    print(f"Transcriptie: {result['text']}")
    
    # Test TTS
    tts_result = await text_to_speech("Dit is een test van de OpenAI text-to-speech.")
    print(f"TTS resultaat: {tts_result}")

if __name__ == "__main__":
    asyncio.run(test_deepgram())
