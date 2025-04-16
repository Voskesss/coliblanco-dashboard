import asyncio
import websockets
import os
import sounddevice as sd
import numpy as np
import queue
import json
from dotenv import load_dotenv
from pvporcupine import create
import struct
import threading
import requests
import tempfile
import soundfile as sf
import logging
import time
from openai import OpenAI

# Configureer logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Laad environment variables
load_dotenv()

# Configuratie
OPENAI_API_KEY = os.getenv("OPENAI_API_KEY")
PICOVOICE_ACCESS_KEY = os.getenv("PICOVOICE_ACCESS_KEY")
WAKE_WORD = os.getenv("WAKE_WORD", "hey google").lower()
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

def detect_wake_word():
    """Detecteer het wake word met Porcupine"""
    try:
        # Beschikbare standaard wake words zijn:
        # blueberry, hey barista, ok google, jarvis, pico clock, grasshopper, 
        # hey siri, alexa, picovoice, bumblebee, grapefruit, americano, computer, 
        # hey google, terminator, porcupine
        
        # Gebruik een standaard wake word dat goed werkt op alle platforms
        wake_word = "hey google"
        
        # Je kunt ook een van deze andere wake words proberen:
        # wake_word = "jarvis"  # Voor een meer unieke ervaring
        # wake_word = "computer"  # Voor een Star Trek gevoel
        # wake_word = "alexa"  # Bekend van Amazon
        
        logger.info(f"Luisteren naar wake word: {wake_word}")
        porcupine = create(access_key=PICOVOICE_ACCESS_KEY, keywords=[wake_word])
        
        with sd.RawInputStream(samplerate=porcupine.sample_rate, blocksize=porcupine.frame_length,
                            dtype="int16", channels=1) as stream:
            while True:
                pcm = stream.read(porcupine.frame_length)[0]
                pcm_unpacked = struct.unpack_from("h" * porcupine.frame_length, pcm)
                keyword_index = porcupine.process(pcm_unpacked)
                
                if keyword_index >= 0:
                    logger.info("Wake word gedetecteerd!")
                    return True
    except Exception as e:
        logger.error(f"Fout bij detecteren wake word: {str(e)}")
        return False
    finally:
        if 'porcupine' in locals():
            porcupine.delete()

def process_with_llm(text):
    """Verwerk tekst met het LLM"""
    try:
        logger.info(f"Verwerken van tekst met LLM: {text}")
        
        # Bereid de berichten voor
        messages = [
            {
                "role": "system",
                "content": """Je bent een vriendelijke Nederlandse assistent voor het Colibranco Dashboard. 
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

async def transcribe_audio_stream():
    """Transcribeer audio stream naar tekst"""
    try:
        # Verzamel audio chunks voor transcriptie
        audio_chunks = []
        start_time = time.time()
        is_speaking = False
        silence_start = None
        
        logger.info("Start met luisteren naar spraak...")
        
        # Luister naar audio tot er een lange stilte is of een stop woord wordt gedetecteerd
        while True:
            if not audio_queue.empty():
                chunk = audio_queue.get()
                audio_chunks.append(chunk)
                
                # Controleer op geluid (simpele methode)
                volume = np.abs(chunk).mean()
                
                if volume > 500:  # Drempelwaarde voor spraak
                    is_speaking = True
                    silence_start = None
                elif is_speaking:
                    if silence_start is None:
                        silence_start = time.time()
                    elif time.time() - silence_start > 1.5:  # 1.5 seconden stilte
                        logger.info("Stilte gedetecteerd, stop met luisteren")
                        break
            
            # Stop na 10 seconden als er niets wordt gezegd
            if time.time() - start_time > 10 and not is_speaking:
                logger.info("Timeout, geen spraak gedetecteerd")
                return None
            
            # Stop na 30 seconden hoe dan ook
            if time.time() - start_time > 30:
                logger.info("Maximale opnametijd bereikt")
                break
            
            await asyncio.sleep(0.1)
        
        # Als er geen audio is opgenomen, return None
        if not audio_chunks or not is_speaking:
            logger.info("Geen bruikbare audio opgenomen")
            return None
        
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
        
        transcription = response.text
        logger.info(f"Transcriptie: {transcription}")
        
        # Controleer op stop woorden
        if any(stop_word in transcription.lower() for stop_word in STOP_WORDS):
            logger.info("Stop woord gedetecteerd")
            return "stop"
        
        return transcription
    
    except Exception as e:
        logger.error(f"Fout bij transcriberen: {str(e)}")
        return None

async def conversation_loop():
    """Hoofdlus voor de conversatie"""
    try:
        # Begroeting
        greeting = "Hallo, hoe kan ik je helpen?"
        logger.info(f"Begroeting: {greeting}")
        speak_text_openai(greeting)
        
        while True:
            # Transcribeer audio
            transcription = await transcribe_audio_stream()
            
            # Als er geen transcriptie is, of een stop woord, stop de conversatie
            if not transcription:
                logger.info("Geen transcriptie, wacht op wake word")
                return
            elif transcription == "stop":
                logger.info("Stop commando ontvangen, wacht op wake word")
                speak_text_openai("Tot ziens!")
                return
            
            # Verwerk de transcriptie met het LLM
            response = process_with_llm(transcription)
            
            # Zet het antwoord om naar spraak
            speak_text_openai(response)
    
    except Exception as e:
        logger.error(f"Fout in conversatie loop: {str(e)}")

async def main_loop():
    """Hoofdlus voor de applicatie"""
    try:
        while True:
            # Wacht op wake word
            if detect_wake_word():
                # Speel een bevestigingsgeluid af
                sd.play(np.sin(2 * np.pi * 440 * np.arange(8000) / 8000)[:2000], samplerate=8000)
                sd.wait()
                
                # Start de conversatie
                await conversation_loop()
    
    except KeyboardInterrupt:
        logger.info("Programma gestopt door gebruiker")
    except Exception as e:
        logger.error(f"Fout in hoofdlus: {str(e)}")

def start_wake_word_detection():
    """Start de wake word detectie in een aparte thread"""
    try:
        # Start de audio stream in een aparte thread
        threading.Thread(target=start_audio_stream, daemon=True).start()
        
        # Start de hoofdlus
        asyncio.run(main_loop())
    
    except Exception as e:
        logger.error(f"Fout bij starten wake word detectie: {str(e)}")

if __name__ == "__main__":
    start_wake_word_detection()
