import os
import uuid
import time
import json
import logging
import asyncio
import tempfile
from typing import Optional, Dict, Any, List
import requests

from fastapi import FastAPI, Request, WebSocket, WebSocketDisconnect, UploadFile, File, Form, HTTPException
from fastapi.responses import JSONResponse, FileResponse
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles

from pydantic import BaseModel
from dotenv import load_dotenv

# Laad environment variables
load_dotenv()

# Configureer logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Importeer de spraakverwerking modules (deze maken we later)
from deepgram_integration import transcribe_audio, text_to_speech, DeepgramLiveTranscription

# Configuratie
PORT = int(os.getenv("PORT", "8000"))
DEBUG = os.getenv("DEBUG", "True").lower() == "true"
ALLOWED_ORIGINS = os.getenv("ALLOWED_ORIGINS", "http://localhost:3000,http://localhost:5173").split(",")
LANGUAGE = os.getenv("LANGUAGE", "nl")

# Maak de FastAPI app
app = FastAPI(
    title="Coliblanco Dashboard API",
    description="API voor het Coliblanco Dashboard met spraakinterface",
    version="1.0.0"
)

# Voeg CORS middleware toe
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Maak mappen voor uploads en audio als ze nog niet bestaan
os.makedirs(os.path.join(os.path.dirname(__file__), "uploads"), exist_ok=True)
os.makedirs(os.path.join(os.path.dirname(__file__), "audio"), exist_ok=True)

# Serveer statische bestanden
app.mount("/audio", StaticFiles(directory="audio"), name="audio")

# Actieve spraaksessies bijhouden
active_sessions = {}

# Configuratie voor meerdere gebruikers
MAX_INACTIVE_TIME = 300  # 5 minuten inactiviteit voordat een sessie wordt opgeschoond
MAX_SESSIONS = 100  # Maximum aantal gelijktijdige sessies

# Modellen voor API requests en responses
class TranscriptionRequest(BaseModel):
    language: Optional[str] = None

class TranscriptionResponse(BaseModel):
    text: str
    language: Optional[str] = None
    error: Optional[str] = None

class TTSRequest(BaseModel):
    text: str
    voice: Optional[str] = None
    language: Optional[str] = None

class TTSResponse(BaseModel):
    audio_url: str
    error: Optional[str] = None

class ChatRequest(BaseModel):
    messages: List[Dict[str, str]]
    model: Optional[str] = None
    temperature: Optional[float] = 0.7

class ChatResponse(BaseModel):
    text: str
    error: Optional[str] = None

# Health check endpoint
@app.get("/health")
async def health_check():
    return {"status": "ok", "timestamp": time.time()}

# Endpoint voor spraak naar tekst conversie
@app.post("/api/transcribe", response_model=TranscriptionResponse)
async def transcribe(file: UploadFile = File(...), language: Optional[str] = Form(None)):
    try:
        # Lees de audio data
        audio_data = await file.read()
        
        # Transcribeer de audio
        result = await transcribe_audio(audio_data, language)
        
        return result
    except Exception as e:
        logger.error(f"Fout bij transcriberen: {str(e)}")
        return {"text": "", "error": str(e)}

# Endpoint voor tekst naar spraak conversie
@app.post("/api/tts", response_model=TTSResponse)
async def tts(request: TTSRequest):
    try:
        # Controleer of de tekst niet leeg is
        if not request.text or request.text.strip() == "":
            return {"audio_url": "", "error": "Tekst mag niet leeg zijn"}
        
        # Zet de tekst om naar spraak
        result = await text_to_speech(request.text, request.voice, request.language)
        
        if "error" in result:
            return {"audio_url": "", "error": result["error"]}
        
        # Genereer een unieke bestandsnaam
        filename = f"{uuid.uuid4()}.mp3"
        audio_path = os.path.join(os.path.dirname(__file__), "audio", filename)
        
        # Sla de audio op
        with open(audio_path, "wb") as f:
            f.write(result["audio"])
        
        return {"audio_url": f"/audio/{filename}"}
    except Exception as e:
        logger.error(f"Fout bij tekst naar spraak: {str(e)}")
        return {"audio_url": "", "error": str(e)}

# Endpoint voor chat met het LLM
@app.post("/api/chat", response_model=ChatResponse)
async def chat(request: ChatRequest):
    try:
        # Controleer of er berichten zijn
        if not request.messages or len(request.messages) == 0:
            return {"text": "", "error": "Geen berichten ontvangen"}
        
        # Haal de OpenAI API-sleutel op
        openai_api_key = os.getenv("OPENAI_API_KEY")
        if not openai_api_key:
            logger.error("Geen OpenAI API-sleutel gevonden. Stel OPENAI_API_KEY in in je .env bestand.")
            return {"text": "", "error": "Geen API-sleutel gevonden"}
        
        # Bereid de berichten voor
        messages = [
            {
                "role": "system",
                "content": "Je bent een vriendelijke Nederlandse assistent voor het Coliblanco Dashboard. "
                           "Je geeft korte, behulpzame antwoorden in het Nederlands. "
                           "Wees beleefd, informatief en to-the-point. "
                           "Houd je antwoorden kort en bondig, maar wel vriendelijk en behulpzaam. "
                           "Spreek Nederlands."
            }
        ]
        
        # Voeg de berichten van de gebruiker toe
        for msg in request.messages:
            messages.append({
                "role": msg.get("role", "user"),
                "content": msg.get("content", "")
            })
        
        logger.info(f"Chat verwerkt: {len(request.messages)} berichten")
        
        # Roep de OpenAI API aan
        url = "https://api.openai.com/v1/chat/completions"
        headers = {
            "Authorization": f"Bearer {openai_api_key}",
            "Content-Type": "application/json"
        }
        data = {
            "model": request.model or "gpt-4o",
            "messages": messages,
            "temperature": request.temperature or 0.7,
            "max_tokens": 500
        }
        
        # Stuur het verzoek naar OpenAI
        response = requests.post(url, headers=headers, json=data)
        
        if response.status_code != 200:
            logger.error(f"Fout bij OpenAI API: {response.status_code} - {response.text}")
            return {"text": "", "error": f"Fout bij OpenAI API: {response.status_code}"}
        
        # Verwerk het antwoord
        response_data = response.json()
        assistant_message = response_data["choices"][0]["message"]["content"]
        
        # Geef het antwoord terug
        return {
            "text": assistant_message,
            "error": None
        }
    except Exception as e:
        logger.error(f"Fout bij chat: {str(e)}")
        return {"text": "", "error": str(e)}

# Callback functie voor transcripties
def create_transcription_callback(websocket, session_id):
    async def on_transcription(transcription):
        try:
            # Controleer of de sessie nog actief is
            if session_id not in active_sessions:
                logger.warning(f"Transcriptie ontvangen voor niet-actieve sessie: {session_id}")
                return
            
            # Stuur de transcriptie naar de client
            await websocket.send_json({
                "event": "transcription",
                "text": transcription.get("text", ""),
                "is_final": transcription.get("is_final", False)
            })
            logger.debug(f"Transcriptie verzonden naar client: {session_id}")
        except Exception as e:
            logger.error(f"Fout bij verzenden transcriptie naar client {session_id}: {str(e)}")
    
    return on_transcription

# WebSocket verbinding voor real-time spraakverwerking
@app.websocket("/ws/voice")
async def voice_websocket(websocket: WebSocket):
    await websocket.accept()
    session_id = str(uuid.uuid4())
    
    logger.info(f"Nieuwe WebSocket verbinding: {session_id}")
    
    # Initialiseer de sessie
    active_sessions[session_id] = {
        "websocket": websocket,
        "is_listening": False,
        "last_active": time.time(),
        "language": LANGUAGE,
        "transcription": None
    }
    
    # Stuur een bevestiging naar de client
    try:
        await websocket.send_json({"event": "connected", "session_id": session_id})
        logger.info(f"Bevestiging verzonden naar client: {session_id}")
    except Exception as e:
        logger.error(f"Fout bij verzenden bevestiging naar client {session_id}: {str(e)}")
        # Verwijder de sessie als we geen bevestiging kunnen sturen
        if session_id in active_sessions:
            del active_sessions[session_id]
        return
    
    # Luister naar berichten van de client
    try:
        while True:
            try:
                # Ontvang een bericht met een timeout
                logger.debug(f"Wachten op bericht van client: {session_id}")
                message = await asyncio.wait_for(websocket.receive_json(), timeout=60.0)
                logger.info(f"Bericht ontvangen van client: {session_id} - {message}")
                
                # Update de laatste activiteit
                active_sessions[session_id]["last_active"] = time.time()
                
                # Verwerk het bericht
                event = message.get("event")
                logger.info(f"Ontvangen event: {event} van sessie: {session_id}")
                
                if event == "start_listening":
                    # Start met luisteren
                    active_sessions[session_id]["is_listening"] = True
                    
                    # Initialiseer de transcriptie als die nog niet bestaat
                    if not active_sessions[session_id]["transcription"]:
                        active_sessions[session_id]["transcription"] = DeepgramLiveTranscription()
                    
                    # Start de Deepgram transcriptie
                    language = message.get("language", active_sessions[session_id]["language"])
                    active_sessions[session_id]["language"] = language
                    
                    try:
                        # Start de transcriptie
                        await active_sessions[session_id]["transcription"].start(language, create_transcription_callback(websocket, session_id))
                        
                        # Stuur een bevestiging
                        await websocket.send_json({"event": "listening_started"})
                        logger.info(f"Luisteren gestart voor sessie: {session_id}")
                    except Exception as e:
                        logger.error(f"Fout bij starten transcriptie voor sessie {session_id}: {str(e)}")
                        await websocket.send_json({"event": "error", "message": f"Fout bij starten transcriptie: {str(e)}"})
                
                elif event == "stop_listening":
                    # Stop met luisteren
                    active_sessions[session_id]["is_listening"] = False
                    
                    # Stop de transcriptie
                    if active_sessions[session_id]["transcription"]:
                        try:
                            await active_sessions[session_id]["transcription"].stop()
                            
                            # Stuur een bevestiging
                            await websocket.send_json({"event": "listening_stopped"})
                            logger.info(f"Luisteren gestopt voor sessie: {session_id}")
                        except Exception as e:
                            logger.error(f"Fout bij stoppen transcriptie voor sessie {session_id}: {str(e)}")
                            await websocket.send_json({"event": "error", "message": f"Fout bij stoppen transcriptie: {str(e)}"})
                
                elif event == "process_command":
                    # Verwerk het commando
                    text = message.get("text", "")
                    logger.info(f"Commando ontvangen van sessie {session_id}: {text}")
                    
                    if text:
                        try:
                            # Gebruik een eenvoudig antwoord voor nu
                            response = "Dit is een testantwoord van de backend. De echte LLM-integratie wordt later toegevoegd."
                            
                            # Genereer een unieke bestandsnaam voor de audio
                            filename = f"{uuid.uuid4()}.mp3"
                            audio_path = os.path.join(os.path.dirname(__file__), "audio", filename)
                            
                            # Maak een leeg audiobestand (placeholder)
                            with open(audio_path, "wb") as f:
                                f.write(b"")
                            
                            # Stuur het antwoord naar de client
                            await websocket.send_json({
                                "event": "command_processed",
                                "status": "success",
                                "text": response,
                                "audio_url": f"/audio/{filename}"
                            })
                            logger.info(f"Commando verwerkt voor sessie: {session_id}")
                        except Exception as e:
                            logger.error(f"Fout bij verwerken commando voor sessie {session_id}: {str(e)}")
                            await websocket.send_json({
                                "event": "command_processed",
                                "status": "error",
                                "message": f"Fout bij verwerken commando: {str(e)}"
                            })
                    else:
                        await websocket.send_json({
                            "event": "command_processed",
                            "status": "error",
                            "message": "Geen tekst ontvangen"
                        })
                
                elif event == "ping":
                    # Stuur een pong terug om de verbinding levend te houden
                    await websocket.send_json({"event": "pong"})
                    logger.debug(f"Ping ontvangen en pong verzonden voor sessie: {session_id}")
                
                elif event == "audio_chunk":
                    # Ontvang audio data
                    audio_data = message.get("data")
                    if audio_data and session_id in active_sessions and active_sessions[session_id]["is_listening"]:
                        # Controleer of de transcriptie is geïnitialiseerd
                        if active_sessions[session_id]["transcription"]:
                            try:
                                # Converteer base64 string naar bytes als dat nodig is
                                if isinstance(audio_data, str):
                                    try:
                                        # Probeer base64 te decoderen
                                        import base64
                                        audio_bytes = base64.b64decode(audio_data)
                                    except Exception as decode_error:
                                        logger.error(f"Fout bij decoderen base64 audio: {str(decode_error)}")
                                        audio_bytes = audio_data.encode('utf-8')  # Fallback
                                else:
                                    # Als het geen string is, gebruik het zoals het is
                                    audio_bytes = audio_data
                                
                                # Stuur de audio naar Deepgram
                                await active_sessions[session_id]["transcription"].send_audio(audio_bytes)
                                logger.debug(f"Audio chunk ontvangen voor sessie: {session_id}")
                            except Exception as e:
                                logger.error(f"Fout bij verzenden audio naar Deepgram voor sessie {session_id}: {str(e)}")
            
            except asyncio.TimeoutError:
                # Stuur een ping naar de client om te controleren of de verbinding nog actief is
                try:
                    await websocket.send_json({"event": "ping"})
                    logger.debug(f"Ping verzonden naar client: {session_id}")
                except Exception as e:
                    logger.error(f"Fout bij verzenden ping naar client {session_id}: {str(e)}")
                    # Als we geen ping kunnen sturen, is de verbinding waarschijnlijk verbroken
                    break
            
            except WebSocketDisconnect:
                logger.info(f"WebSocket verbinding verbroken voor sessie: {session_id}")
                break
            
            except json.JSONDecodeError as e:
                logger.error(f"Ongeldig JSON bericht ontvangen van sessie {session_id}: {e}")
                # Stuur een foutmelding, maar verbreek de verbinding niet
                try:
                    await websocket.send_json({"event": "error", "message": "Ongeldig JSON bericht"})
                except Exception as send_error:
                    logger.error(f"Fout bij verzenden foutmelding naar client {session_id}: {str(send_error)}")
                    break
            
            except Exception as e:
                logger.error(f"Fout bij verwerken bericht van sessie {session_id}: {str(e)}")
                # Stuur een foutmelding, maar verbreek de verbinding niet
                try:
                    await websocket.send_json({"event": "error", "message": str(e)})
                except Exception as send_error:
                    logger.error(f"Fout bij verzenden foutmelding naar client {session_id}: {str(send_error)}")
                    break
    
    except Exception as e:
        logger.error(f"Fout in WebSocket voor sessie {session_id}: {str(e)}")
    
    finally:
        # Verwijder de sessie
        if session_id in active_sessions:
            # Stop de transcriptie
            if active_sessions[session_id]["transcription"]:
                try:
                    await active_sessions[session_id]["transcription"].stop()
                except Exception as e:
                    logger.error(f"Fout bij stoppen transcriptie voor sessie {session_id}: {str(e)}")
            
            # Verwijder de sessie
            del active_sessions[session_id]
            logger.info(f"Sessie verwijderd: {session_id}")
        
        # Probeer de verbinding netjes te sluiten
        try:
            await websocket.close()
            logger.info(f"WebSocket verbinding netjes gesloten voor sessie: {session_id}")
        except Exception as e:
            logger.error(f"Fout bij sluiten WebSocket verbinding voor sessie {session_id}: {str(e)}")

# Achtergrondtaak om inactieve sessies op te schonen
@app.on_event("startup")
async def startup_event():
    # Start de achtergrondtaak voor het opschonen van sessies
    asyncio.create_task(cleanup_inactive_sessions())

async def cleanup_inactive_sessions():
    """Verwijder inactieve sessies om geheugenlekkage te voorkomen"""
    while True:
        try:
            current_time = time.time()
            to_remove = []
            
            for sid, session in active_sessions.items():
                # Controleer wanneer de sessie voor het laatst actief was
                last_active = session.get("last_active", current_time)
                if current_time - last_active > MAX_INACTIVE_TIME:
                    to_remove.append(sid)
            
            # Verwijder inactieve sessies
            for sid in to_remove:
                logger.info(f"Verwijderen van inactieve sessie: {sid}")
                
                # Stop de transcriptie
                if active_sessions[sid]["transcription"]:
                    await active_sessions[sid]["transcription"].stop()
                
                # Verwijder de sessie
                del active_sessions[sid]
                
            # Log het aantal actieve sessies
            if active_sessions:
                logger.debug(f"Aantal actieve sessies: {len(active_sessions)}")
                
        except Exception as e:
            logger.error(f"Fout bij opschonen sessies: {str(e)}")
            
        # Wacht 60 seconden voordat we opnieuw controleren
        await asyncio.sleep(60)

# Start de applicatie als dit script direct wordt uitgevoerd
if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=PORT, reload=DEBUG)
