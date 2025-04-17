import os
import logging
import tempfile
import io
from pydub import AudioSegment
from dotenv import load_dotenv

# Laad environment variables
load_dotenv()

# Configureer logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

def transcribe_audio(audio_path, client):
    """
    Transcribeer audio naar tekst met OpenAI Whisper API
    
    Args:
        audio_path (str): Pad naar het audiobestand
        client: OpenAI client
        
    Returns:
        str: Getranscribeerde tekst
    """
    try:
        logger.info(f"Transcriberen van audio: {audio_path}")
        
        # Controleer of het bestand bestaat
        if not os.path.exists(audio_path):
            raise FileNotFoundError(f"Audio bestand niet gevonden: {audio_path}")
        
        # Converteer naar het juiste formaat als nodig
        file_ext = os.path.splitext(audio_path)[1].lower()
        
        # Als het bestand geen mp3 of wav is, converteer het
        if file_ext not in ['.mp3', '.wav', '.m4a']:
            logger.info(f"Converteren van {file_ext} naar mp3")
            
            # Laad de audio met pydub
            audio = AudioSegment.from_file(audio_path)
            
            # Maak een tijdelijk bestand voor de geconverteerde audio
            with tempfile.NamedTemporaryFile(suffix='.mp3', delete=False) as temp_file:
                audio.export(temp_file.name, format='mp3')
                converted_path = temp_file.name
            
            # Gebruik het geconverteerde bestand
            audio_path = converted_path
        
        # Open het audiobestand
        with open(audio_path, 'rb') as audio_file:
            # Roep de OpenAI API aan
            response = client.audio.transcriptions.create(
                model="whisper-1",
                file=audio_file
            )
        
        # Verwijder het tijdelijke bestand als we het hebben gemaakt
        if file_ext not in ['.mp3', '.wav', '.m4a'] and 'converted_path' in locals():
            os.remove(converted_path)
        
        # Haal de transcriptie op
        transcription = response.text
        logger.info(f"Transcriptie succesvol: {transcription[:50]}...")
        
        return transcription
    
    except Exception as e:
        logger.error(f"Fout bij transcriberen: {str(e)}")
        raise

def text_to_speech(text, client, voice="alloy", model="tts-1", instructions=None):
    """
    Converteer tekst naar spraak met OpenAI TTS API
    
    Args:
        text (str): Tekst om te converteren naar spraak
        client: OpenAI client
        voice (str): Stem om te gebruiken (default: "alloy")
        model (str): Model om te gebruiken (default: "tts-1")
        instructions (str): Optionele instructies voor de stem
        
    Returns:
        bytes: Audio data in MP3-formaat
    """
    try:
        logger.info(f"Tekst naar spraak omzetten: {text[:50]}... (stem: {voice})")
        
        # Standaard instructies voor Nederlandse stem
        if not instructions:
            instructions = "Je bent een vriendelijke Nederlandse assistent. Spreek op een natuurlijke, warme manier in het Nederlands."
        
        # Roep de OpenAI API aan
        response = client.audio.speech.create(
            model=model,
            voice=voice,
            input=text,
            response_format="mp3",
            speed=1.0,
            instructions=instructions
        )
        
        # Haal de audio data op
        audio_data = response.content
        
        logger.info(f"Tekst naar spraak conversie succesvol, {len(audio_data)} bytes")
        
        return audio_data
    
    except Exception as e:
        logger.error(f"Fout bij tekst naar spraak: {str(e)}")
        raise

# Klasse voor real-time spraakverwerking met OpenAI Whisper
class WhisperLiveTranscription:
    def __init__(self, callback=None):
        self.callback = callback
        self.is_listening = False
        self.audio_chunks = []
        self.client = None
        self.silence_start = None
        self.last_transcription = None
        self.language = "nl"
    
    async def start(self, language=None, callback=None):
        """Start real-time transcriptie"""
        try:
            # Stel de callback in als die is opgegeven
            if callback:
                self.callback = callback
                
            # Gebruik de opgegeven taal of val terug op de standaardtaal
            self.language = language or "nl"
            
            # Maak een OpenAI client
            from openai import OpenAI
            self.client = OpenAI(api_key=os.getenv("OPENAI_API_KEY"))
            
            # Reset de audio chunks
            self.audio_chunks = []
            
            self.is_listening = True
            logger.info("OpenAI Whisper live transcriptie gestart")
            return True
        except Exception as e:
            logger.error(f"Fout bij starten live transcriptie: {str(e)}")
            return False
    
    async def send_audio(self, audio_data):
        """Stuur audio data naar de transcriptie"""
        if not self.is_listening:
            return False
        
        try:
            # Voeg de audio data toe aan de chunks
            self.audio_chunks.append(audio_data)
            
            # Als we genoeg audio hebben, transcribeer het
            if len(self.audio_chunks) >= 10:  # Ongeveer 1 seconde audio (10 chunks van 100ms)
                await self._process_audio()
            
            return True
        except Exception as e:
            logger.error(f"Fout bij versturen audio data: {str(e)}")
            return False
    
    async def _process_audio(self):
        """Verwerk de verzamelde audio chunks"""
        try:
            if not self.audio_chunks:
                return
            
            # Combineer de audio chunks
            import numpy as np
            audio_data = np.concatenate([np.frombuffer(chunk, dtype=np.int16) for chunk in self.audio_chunks])
            
            # Sla de audio tijdelijk op
            with tempfile.NamedTemporaryFile(suffix=".wav", delete=False) as temp_file:
                import soundfile as sf
                sf.write(temp_file.name, audio_data, 16000, format='WAV')
                temp_file_path = temp_file.name
            
            # Transcribeer de audio
            with open(temp_file_path, "rb") as audio_file:
                response = self.client.audio.transcriptions.create(
                    model="whisper-1",
                    file=audio_file,
                    language=self.language
                )
            
            # Verwijder het tijdelijke bestand
            os.unlink(temp_file_path)
            
            # Haal de transcriptie op
            transcription = response.text
            
            # Als er tekst is, stuur het naar de callback
            if transcription and transcription.strip() and self.callback:
                self.last_transcription = transcription
                self.callback({
                    "text": transcription,
                    "is_final": True
                })
            
            # Reset de audio chunks
            self.audio_chunks = []
        except Exception as e:
            logger.error(f"Fout bij verwerken audio: {str(e)}")
    
    async def stop(self):
        """Stop de live transcriptie"""
        try:
            # Verwerk eventuele resterende audio
            if self.audio_chunks:
                await self._process_audio()
            
            self.is_listening = False
            self.audio_chunks = []
            logger.info("OpenAI Whisper live transcriptie gestopt")
            return True
        except Exception as e:
            logger.error(f"Fout bij stoppen live transcriptie: {str(e)}")
            return False

# Functie voor realtime spraakdetectie met interruptieherkenning
def detect_speech_in_realtime(audio_stream, callback, silence_threshold=500, silence_duration=1.0):
    """
    Detecteer spraak in realtime met interruptieherkenning
    
    Args:
        audio_stream: Audio stream om te analyseren
        callback: Functie om aan te roepen bij spraakdetectie
        silence_threshold (int): Drempelwaarde voor stilte detectie
        silence_duration (float): Hoe lang stilte moet duren voordat we stoppen
        
    Returns:
        None
    """
    # Implementatie van realtime spraakdetectie
    # Dit is een placeholder voor toekomstige implementatie
    pass

# Test functie om de OpenAI Whisper implementatie te testen
def test_whisper():
    """Test de OpenAI Whisper implementatie"""
    try:
        print("Testen van OpenAI Whisper implementatie...")
        
        # Gebruik een bestaand MP3-bestand uit de audio map
        audio_file = "cb21d732-4b3f-4a10-bb1b-1885c12a13ff.mp3"  # Een van de grotere bestanden
        audio_path = os.path.join(os.path.dirname(__file__), "audio", audio_file)
        
        # Controleer of het bestand bestaat
        if not os.path.exists(audio_path):
            print(f"Bestand niet gevonden: {audio_path}")
            return
        
        print(f"Bestand gevonden: {audio_path}")
        
        # Maak een OpenAI client
        from openai import OpenAI
        client = OpenAI(api_key=os.getenv("OPENAI_API_KEY"))
        
        # Transcribeer de audio
        result = transcribe_audio(audio_path, client)
        
        print("Transcriptie resultaat:")
        print(result)
        
        return result
    except Exception as e:
        print(f"Fout bij testen OpenAI Whisper: {str(e)}")
        import traceback
        traceback.print_exc()
        return {"error": str(e)}

if __name__ == "__main__":
    test_whisper()
