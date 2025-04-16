import asyncio
import websockets
import os
import sounddevice as sd
import numpy as np
import queue
import json
import logging
from dotenv import load_dotenv
import struct
import threading
import requests
import tempfile
import soundfile as sf
import time
from openai import OpenAI

# Configureer logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Laad environment variables
load_dotenv()

# Configuratie
OPENAI_API_KEY = os.getenv("OPENAI_API_KEY")
AZURE_SPEECH_KEY = os.getenv("AZURE_SPEECH_KEY")
AZURE_SPEECH_REGION = os.getenv("AZURE_SPEECH_REGION")
WAKE_WORD = os.getenv("WAKE_WORD", "hey coliblanco").lower()
STOP_WORDS = ["stop", "klaar"]
TTS_PROVIDER = os.getenv("TTS_PROVIDER", "openai")
TTS_VOICE = os.getenv("TTS_VOICE", "echo")

# Audio configuratie
AUDIO_RATE = 16000
CHANNELS = 1
FRAME_DURATION_MS = 30
FRAME_SIZE = int(AUDIO_RATE * FRAME_DURATION_MS / 1000)

# Globale variabelen
audio_queue = queue.Queue()
conversation_history = []
client = OpenAI(api_key=OPENAI_API_KEY)

def audio_callback(indata, frames, time, status):
    """Callback functie voor de audio stream"""
    if status:
        logger.warning(f"Audio status: {status}")
    audio_queue.put(indata.copy())

def start_audio_stream():
    """Start een achtergrond audio stream"""
    try:
        with sd.InputStream(samplerate=AUDIO_RATE, channels=CHANNELS, callback=audio_callback, dtype='int16'):
            logger.info("Audio stream gestart")
            while True:
                sd.sleep(100)
    except Exception as e:
        logger.error(f"Fout bij starten audio stream: {str(e)}")

def detect_wake_word_with_stt():
    """Detecteer het wake word met spraakherkenning"""
    try:
        # Verzamel audio chunks voor transcriptie
        audio_chunks = []
        start_time = time.time()
        is_speaking = False
        
        logger.info("Start met luisteren naar wake word...")
        
        # Luister naar audio tot er spraak wordt gedetecteerd
        while True:
            if not audio_queue.empty():
                chunk = audio_queue.get()
                audio_chunks.append(chunk)
                
                # Controleer op geluid (simpele methode)
                volume = np.abs(chunk).mean()
                
                if volume > 500:  # Drempelwaarde voor spraak
                    is_speaking = True
                elif is_speaking and len(audio_chunks) > 50:  # Ongeveer 1.5 seconden audio
                    # Er is spraak gedetecteerd, transcribeer het
                    break
            
            # Stop na 1 seconde als er niets wordt gezegd
            if time.time() - start_time > 1 and not is_speaking:
                audio_chunks = []
                start_time = time.time()
            
            # Reset na 5 seconden hoe dan ook
            if time.time() - start_time > 5:
                audio_chunks = []
                start_time = time.time()
                is_speaking = False
            
            time.sleep(0.01)
        
        # Als er geen audio is opgenomen, return False
        if not audio_chunks or not is_speaking:
            return False
        
        # Combineer de audio chunks
        audio_data = np.concatenate(audio_chunks)
        
        # Sla de audio tijdelijk op
        with tempfile.NamedTemporaryFile(delete=False, suffix=".wav") as f:
            sf.write(f.name, audio_data, AUDIO_RATE)
            
            # Transcribeer de audio
            with open(f.name, "rb") as audio_file:
                response = client.audio.transcriptions.create(
                    model="whisper-1",
                    file=audio_file
                )
            
            # Verwijder het tijdelijke bestand
            os.unlink(f.name)
        
        transcription = response.text.lower()
        logger.info(f"Transcriptie: {transcription}")
        
        # Controleer of het wake word in de transcriptie zit
        if WAKE_WORD in transcription:
            logger.info("Wake word gedetecteerd!")
            # Speel een bevestigingsgeluid af
            sd.play(np.sin(2 * np.pi * 440 * np.arange(8000) / 8000)[:2000], samplerate=8000)
            sd.wait()
            return True
        
        return False
    
    except Exception as e:
        logger.error(f"Fout bij wake word detectie: {str(e)}")
        return False

def process_with_llm(text):
    """Verwerk tekst met het LLM"""
    try:
        logger.info(f"Verwerken van tekst met LLM: {text}")
        
        # Bereid de berichten voor
        messages = [
            {
                "role": "system",
                "content": """Je bent een vriendelijke Nederlandse assistent voor het Coliblanco Dashboard. 
                Je geeft korte, behulpzame antwoorden in het Nederlands. 
                Wees beleefd, informatief en to-the-point.
                Houd je antwoorden kort en bondig, maar wel vriendelijk en behulpzaam.
                Spreek Nederlands."""
            }
        ]
        
        # Voeg conversatiegeschiedenis toe
        messages.extend(conversation_history)
        
        # Voeg het huidige bericht toe
        messages.append({"role": "user", "content": text})
        
        # Roep de OpenAI API aan
        response = client.chat.completions.create(
            model="gpt-4o",
            messages=messages,
            temperature=0.7,
            max_tokens=150
        )
        
        # Haal het antwoord op
        assistant_message = response.choices[0].message.content
        
        # Update de conversatiegeschiedenis
        conversation_history.append({"role": "user", "content": text})
        conversation_history.append({"role": "assistant", "content": assistant_message})
        
        # Beperk de geschiedenis tot de laatste 10 berichten
        if len(conversation_history) > 10:
            conversation_history = conversation_history[-10:]
        
        logger.info(f"LLM antwoord: {assistant_message}")
        return assistant_message
    
    except Exception as e:
        logger.error(f"Fout bij verwerken met LLM: {str(e)}")
        return "Er is een fout opgetreden bij het verwerken van je vraag."

def speak_text_openai(text):
    """Zet tekst om naar spraak met OpenAI TTS"""
    try:
        logger.info(f"Tekst naar spraak omzetten: {text}")
        
        # Genereer spraak met de OpenAI API
        response = client.audio.speech.create(
            model="tts-1",
            voice=TTS_VOICE,
            input=text,
            response_format="mp3",
            speed=1.0
        )
        
        # Sla de audio tijdelijk op
        with tempfile.NamedTemporaryFile(delete=False, suffix=".mp3") as f:
            f.write(response.content)
            f.flush()
            
            # Speel de audio af
            data, samplerate = sf.read(f.name)
            sd.play(data, samplerate=samplerate)
            sd.wait()
            
            # Verwijder het tijdelijke bestand
            os.unlink(f.name)
        
        logger.info("Audio afgespeeld")
        return True
    
    except Exception as e:
        logger.error(f"Fout bij tekst naar spraak: {str(e)}")
        return False

async def openai_ws_stream():
    """Gebruik WebSockets om audio te streamen naar OpenAI"""
    try:
        # Maak een WebSocket verbinding met OpenAI
        uri = "wss://api.openai.com/v1/audio/transcriptions"
        headers = {"Authorization": f"Bearer {OPENAI_API_KEY}"}
        
        async with websockets.connect(uri, extra_headers=headers) as websocket:
            logger.info("Verbonden met OpenAI STT WebSocket")
            
            # Leeg de audio queue
            while not audio_queue.empty():
                audio_queue.get()
            
            # Begroeting
            greeting = "Hallo, hoe kan ik je helpen?"
            logger.info(f"Begroeting: {greeting}")
            speak_text_openai(greeting)
            
            # Start met luisteren
            start_time = time.time()
            last_activity_time = time.time()
            silence_start = None
            is_speaking = False
            transcription_buffer = ""
            
            while True:
                # Stuur audio naar de WebSocket
                if not audio_queue.empty():
                    chunk = audio_queue.get()
                    await websocket.send(chunk.tobytes())
                    
                    # Controleer op geluid
                    volume = np.abs(chunk).mean()
                    
                    if volume > 500:  # Drempelwaarde voor spraak
                        is_speaking = True
                        silence_start = None
                        last_activity_time = time.time()
                    elif is_speaking:
                        if silence_start is None:
                            silence_start = time.time()
                        elif time.time() - silence_start > 1.5:  # 1.5 seconden stilte
                            # Verwerk de transcriptie als er iets is
                            if transcription_buffer:
                                # Controleer op stop woorden
                                if any(stop_word in transcription_buffer.lower() for stop_word in STOP_WORDS):
                                    logger.info("Stop woord gedetecteerd, einde gesprek")
                                    speak_text_openai("Tot ziens!")
                                    return
                                
                                # Verwerk de transcriptie met het LLM
                                response = process_with_llm(transcription_buffer)
                                
                                # Zet het antwoord om naar spraak
                                speak_text_openai(response)
                                
                                # Reset de buffer
                                transcription_buffer = ""
                            
                            # Reset de spraakdetectie
                            is_speaking = False
                            silence_start = None
                
                # Ontvang transcriptie van de WebSocket
                try:
                    response = await asyncio.wait_for(websocket.recv(), timeout=0.1)
                    result = json.loads(response)
                    text = result.get("text", "")
                    
                    if text:
                        logger.info(f"Transcriptie: {text}")
                        transcription_buffer = text
                        last_activity_time = time.time()
                except asyncio.TimeoutError:
                    # Geen transcriptie ontvangen, dat is OK
                    pass
                except Exception as e:
                    logger.error(f"Fout bij ontvangen transcriptie: {str(e)}")
                
                # Controleer op inactiviteit
                if time.time() - last_activity_time > 10:  # 10 seconden inactiviteit
                    logger.info("Inactiviteit gedetecteerd, einde gesprek")
                    return
                
                # Controleer op maximale gespreksduur
                if time.time() - start_time > 120:  # 2 minuten maximaal
                    logger.info("Maximale gespreksduur bereikt, einde gesprek")
                    return
                
                # Kleine pauze om CPU-gebruik te verminderen
                await asyncio.sleep(0.01)
    
    except Exception as e:
        logger.error(f"Fout in WebSocket stream: {str(e)}")

async def start_direct_conversation():
    """Start een conversatie direct zonder wake word"""
    try:
        # Leeg de audio queue
        while not audio_queue.empty():
            audio_queue.get()
            
        # Start de conversatie
        await conversation_loop()
    
    except Exception as e:
        logger.error(f"Fout bij starten directe conversatie: {str(e)}")

async def conversation_loop():
    """Hoofdlus voor de conversatie"""
    try:
        # Start de conversatie met WebSockets
        await openai_ws_stream()
    
    except Exception as e:
        logger.error(f"Fout in conversatie loop: {str(e)}")

async def main_loop():
    """Hoofdlus voor de applicatie"""
    try:
        while True:
            # Wacht op wake word
            if detect_wake_word_with_stt():
                # Start de conversatie
                await conversation_loop()
    
    except KeyboardInterrupt:
        logger.info("Programma gestopt door gebruiker")
    except Exception as e:
        logger.error(f"Fout in hoofdlus: {str(e)}")

def start_websocket_voice():
    """Start de WebSocket voice interface"""
    try:
        # Start de audio stream in een aparte thread
        threading.Thread(target=start_audio_stream, daemon=True).start()
        
        # Start de hoofdlus
        asyncio.run(main_loop())
    
    except Exception as e:
        logger.error(f"Fout bij starten WebSocket voice interface: {str(e)}")

def init_audio_stream():
    """Initialiseer de audio stream voor gebruik in app.py"""
    try:
        # Start de audio stream in een aparte thread
        threading.Thread(target=start_audio_stream, daemon=True).start()
        logger.info("Audio stream geïnitialiseerd voor app.py")
        return True
    except Exception as e:
        logger.error(f"Fout bij initialiseren audio stream: {str(e)}")
        return False

# Functie om een WebSocket handler te maken voor app.py
def get_websocket_handlers():
    """Geef de WebSocket handlers voor app.py"""
    
    async def on_connect(sid):
        """Handler voor nieuwe WebSocket verbindingen"""
        logger.info(f"Nieuwe WebSocket verbinding: {sid}")
        
    async def on_disconnect(sid):
        """Handler voor verbroken WebSocket verbindingen"""
        logger.info(f"WebSocket verbinding verbroken: {sid}")
    
    async def on_start_listening(sid, data):
        """Handler voor het starten van luisteren"""
        logger.info(f"Start luisteren voor {sid}")
        # Leeg de audio queue
        while not audio_queue.empty():
            audio_queue.get()
        # Stuur bevestiging
        return {"status": "listening"}
    
    async def on_stop_listening(sid, data):
        """Handler voor het stoppen van luisteren"""
        logger.info(f"Stop luisteren voor {sid}")
        # Stuur bevestiging
        return {"status": "stopped"}
    
    async def on_audio_data(sid, data):
        """Handler voor binnenkomende audio data"""
        try:
            # Controleer of de data een bytes object is
            if isinstance(data, bytes):
                # Converteer de audio data naar numpy array
                audio_data = np.frombuffer(data, dtype=np.int16)
                # Voeg toe aan de queue
                audio_queue.put(audio_data)
                return {"status": "received"}
            else:
                # Als het geen bytes object is, probeer het te converteren
                logger.warning(f"Audio data is geen bytes object maar {type(data)}")
                # Probeer het te converteren naar bytes
                if hasattr(data, 'read'):
                    # Als het een file-like object is
                    data_bytes = data.read()
                    audio_data = np.frombuffer(data_bytes, dtype=np.int16)
                    audio_queue.put(audio_data)
                    return {"status": "received"}
                else:
                    # Als het een ander type is, log een waarschuwing
                    logger.warning(f"Kon audio data niet verwerken: {data}")
                    return {"status": "error", "message": "Ongeldig audio formaat"}
        except Exception as e:
            logger.error(f"Fout bij verwerken audio data: {str(e)}")
            return {"status": "error", "message": str(e)}
    
    async def on_process_command(sid, data):
        """Handler voor het verwerken van een commando"""
        try:
            text = data.get("text", "")
            logger.info(f"Verwerken commando: {text}")
            
            # Verwerk de tekst met het LLM
            response = process_with_llm(text)
            
            # Zet het antwoord om naar spraak
            if TTS_PROVIDER == "openai":
                # Genereer spraak met de OpenAI API
                tts_response = client.audio.speech.create(
                    model="tts-1",
                    voice=TTS_VOICE,
                    input=response,
                    response_format="mp3",
                    speed=1.0
                )
                
                # Sla de audio tijdelijk op
                with tempfile.NamedTemporaryFile(delete=False, suffix=".mp3") as f:
                    f.write(tts_response.content)
                    f.flush()
                    audio_path = f.name
            
            # Stuur het antwoord terug
            return {
                "status": "success",
                "text": response,
                "audio_path": audio_path if TTS_PROVIDER == "openai" else None
            }
        except Exception as e:
            logger.error(f"Fout bij verwerken commando: {str(e)}")
            return {"status": "error", "message": str(e)}
    
    # Geef de handlers terug
    return {
        "connect": on_connect,
        "disconnect": on_disconnect,
        "start_listening": on_start_listening,
        "stop_listening": on_stop_listening,
        "audio_data": on_audio_data,
        "process_command": on_process_command
    }

if __name__ == "__main__":
    start_websocket_voice()
