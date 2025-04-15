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
