import os
import time
import json
import logging
from flask import Flask, request, jsonify, send_file
from flask_cors import CORS
from flask_socketio import SocketIO, emit
from dotenv import load_dotenv
from werkzeug.utils import secure_filename
import openai
import tempfile
import uuid
from pydub import AudioSegment
import io
import asyncio
import threading

# Importeer onze eigen modules
from speech_processing import transcribe_audio, text_to_speech
from llm_processing import process_with_llm

# Laad environment variables
load_dotenv()

# Configureer logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Initialiseer de Flask app
app = Flask(__name__)
CORS(app)

# Configureer OpenAI API
openai.api_key = os.getenv("OPENAI_API_KEY")
if not openai.api_key:
    logger.error("OPENAI_API_KEY niet gevonden in environment variables!")

# Configureer SocketIO voor realtime communicatie
socketio = SocketIO(app, cors_allowed_origins="*")

# Configureer uploads directory
UPLOAD_FOLDER = os.path.join(os.path.dirname(os.path.abspath(__file__)), 'uploads')
AUDIO_FOLDER = os.path.join(os.path.dirname(os.path.abspath(__file__)), 'audio')
os.makedirs(UPLOAD_FOLDER, exist_ok=True)
os.makedirs(AUDIO_FOLDER, exist_ok=True)

# Actieve spraaksessies bijhouden
active_sessions = {}

@app.route('/health', methods=['GET'])
def health_check():
    """Endpoint voor health check"""
    return jsonify({"status": "healthy", "timestamp": time.time()})

@app.route('/transcribe', methods=['POST'])
def transcribe():
    """Endpoint voor spraak naar tekst conversie"""
    try:
        if 'file' not in request.files:
            return jsonify({"error": "Geen audio bestand ontvangen"}), 400
        
        audio_file = request.files['file']
        if audio_file.filename == '':
            return jsonify({"error": "Geen bestandsnaam"}), 400
        
        # Sla het bestand tijdelijk op
        filename = secure_filename(f"{uuid.uuid4()}_{audio_file.filename}")
        filepath = os.path.join(UPLOAD_FOLDER, filename)
        audio_file.save(filepath)
        
        logger.info(f"Audio bestand ontvangen: {filepath}")
        
        # Transcribeer de audio
        transcription = transcribe_audio(filepath)
        
        # Verwijder het bestand na gebruik
        os.remove(filepath)
        
        return jsonify({"text": transcription})
    
    except Exception as e:
        logger.error(f"Fout bij transcriberen: {str(e)}")
        return jsonify({"error": str(e)}), 500

@app.route('/tts', methods=['POST'])
def tts():
    """Endpoint voor tekst naar spraak conversie"""
    try:
        data = request.json
        if not data or 'text' not in data:
            return jsonify({"error": "Geen tekst ontvangen"}), 400
        
        text = data['text']
        voice = data.get('voice', 'alloy')
        model = data.get('model', 'tts-1')
        
        logger.info(f"TTS aanvraag ontvangen: {text[:50]}... (voice: {voice}, model: {model})")
        
        # Genereer spraak
        audio_data = text_to_speech(text, voice, model)
        
        # Sla het bestand op
        filename = f"{uuid.uuid4()}.mp3"
        filepath = os.path.join(AUDIO_FOLDER, filename)
        
        with open(filepath, 'wb') as f:
            f.write(audio_data)
        
        logger.info(f"Audio opgeslagen: {filepath}")
        
        return jsonify({"url": f"/audio/{filename}"})
    
    except Exception as e:
        logger.error(f"Fout bij tekst naar spraak: {str(e)}")
        return jsonify({"error": str(e)}), 500

@app.route('/chat', methods=['POST'])
def chat():
    """Endpoint voor chat completions"""
    try:
        data = request.json
        if not data or 'messages' not in data or not isinstance(data['messages'], list):
            return jsonify({"error": "Geen geldige berichten ontvangen"}), 400
        
        model = data.get('model', 'gpt-4o')
        messages = data['messages']
        temperature = data.get('temperature', 0.7)
        max_tokens = data.get('max_tokens', 150)
        
        logger.info(f"Chat aanvraag ontvangen: {len(messages)} berichten")
        
        # Verwerk met LLM
        response = process_with_llm(messages, model, temperature, max_tokens)
        
        return jsonify(response)
    
    except Exception as e:
        logger.error(f"Fout bij chat completion: {str(e)}")
        return jsonify({"error": str(e)}), 500

@app.route('/audio/<filename>', methods=['GET'])
def get_audio(filename):
    """Endpoint voor het serveren van audio bestanden"""
    try:
        filepath = os.path.join(AUDIO_FOLDER, filename)
        if not os.path.exists(filepath):
            return jsonify({"error": "Audio bestand niet gevonden"}), 404
        
        return send_file(filepath, mimetype='audio/mpeg')
    
    except Exception as e:
        logger.error(f"Fout bij ophalen audio: {str(e)}")
        return jsonify({"error": str(e)}), 500

# WebSocket endpoints voor realtime spraakverwerking
@socketio.on('connect')
def handle_connect():
    """Handler voor nieuwe WebSocket verbindingen"""
    logger.info(f"Nieuwe client verbonden: {request.sid}")
    active_sessions[request.sid] = {
        'audio_chunks': [],
        'is_listening': False,
        'conversation_history': []
    }

@socketio.on('disconnect')
def handle_disconnect():
    """Handler voor verbroken WebSocket verbindingen"""
    logger.info(f"Client verbroken: {request.sid}")
    if request.sid in active_sessions:
        del active_sessions[request.sid]

@socketio.on('start_listening')
def handle_start_listening():
    """Start met luisteren naar audio van de client"""
    logger.info(f"Start luisteren voor client: {request.sid}")
    if request.sid in active_sessions:
        active_sessions[request.sid]['is_listening'] = True
        active_sessions[request.sid]['audio_chunks'] = []
        emit('listening_started', {'status': 'success'})

@socketio.on('stop_listening')
def handle_stop_listening():
    """Stop met luisteren en verwerk de ontvangen audio"""
    logger.info(f"Stop luisteren voor client: {request.sid}")
    if request.sid in active_sessions and active_sessions[request.sid]['is_listening']:
        active_sessions[request.sid]['is_listening'] = False
        
        # Verwerk de audio in een aparte thread om de WebSocket verbinding niet te blokkeren
        threading.Thread(target=process_audio, args=(request.sid,)).start()
        
        emit('listening_stopped', {'status': 'processing'})

@socketio.on('audio_chunk')
def handle_audio_chunk(data):
    """Ontvang een audio chunk van de client"""
    if request.sid in active_sessions and active_sessions[request.sid]['is_listening']:
        # Voeg de audio chunk toe aan de buffer
        active_sessions[request.sid]['audio_chunks'].append(data['audio_data'])
        
        # Stuur een bevestiging terug
        emit('chunk_received', {'status': 'success'})

@socketio.on('interrupt')
def handle_interrupt():
    """Handler voor interrupties tijdens het spreken"""
    logger.info(f"Interrupt ontvangen van client: {request.sid}")
    emit('interrupted', {'status': 'success'})

def process_audio(session_id):
    """Verwerk de audio voor een bepaalde sessie"""
    try:
        if session_id not in active_sessions:
            return
        
        session = active_sessions[session_id]
        audio_chunks = session['audio_chunks']
        
        if not audio_chunks:
            socketio.emit('processing_complete', {
                'status': 'error',
                'error': 'Geen audio ontvangen'
            }, room=session_id)
            return
        
        # Combineer alle audio chunks
        audio_data = b''.join(audio_chunks)
        
        # Sla de audio tijdelijk op
        with tempfile.NamedTemporaryFile(suffix='.webm', delete=False) as temp_file:
            temp_file.write(audio_data)
            temp_filepath = temp_file.name
        
        # Transcribeer de audio
        transcription = transcribe_audio(temp_filepath)
        
        # Verwijder het tijdelijke bestand
        os.unlink(temp_filepath)
        
        # Als er geen transcriptie is, stop dan
        if not transcription or not transcription.strip():
            socketio.emit('processing_complete', {
                'status': 'error',
                'error': 'Geen tekst gedetecteerd in audio'
            }, room=session_id)
            return
        
        # Stuur de transcriptie naar de client
        socketio.emit('transcription', {
            'text': transcription
        }, room=session_id)
        
        # Verwerk de tekst met het LLM
        messages = []
        if 'conversation_history' in session:
            messages.extend(session['conversation_history'])
        
        messages.append({"role": "user", "content": transcription})
        
        response = process_with_llm(messages, 'gpt-4o', 0.7, 150)
        assistant_message = response['choices'][0]['message']['content']
        
        # Update de conversatiegeschiedenis
        if 'conversation_history' not in session:
            session['conversation_history'] = []
        
        session['conversation_history'].append({"role": "user", "content": transcription})
        session['conversation_history'].append({"role": "assistant", "content": assistant_message})
        
        # Beperk de geschiedenis tot de laatste 10 berichten
        if len(session['conversation_history']) > 10:
            session['conversation_history'] = session['conversation_history'][-10:]
        
        # Stuur het antwoord naar de client
        socketio.emit('llm_response', {
            'text': assistant_message
        }, room=session_id)
        
        # Genereer spraak voor het antwoord
        audio_data = text_to_speech(assistant_message)
        
        # Sla het bestand op
        filename = f"{uuid.uuid4()}.mp3"
        filepath = os.path.join(AUDIO_FOLDER, filename)
        
        with open(filepath, 'wb') as f:
            f.write(audio_data)
        
        # Stuur de URL van het audiobestand naar de client
        socketio.emit('tts_response', {
            'url': f"/audio/{filename}"
        }, room=session_id)
        
        # Stuur een bericht dat de verwerking voltooid is
        socketio.emit('processing_complete', {
            'status': 'success'
        }, room=session_id)
        
    except Exception as e:
        logger.error(f"Fout bij verwerken audio: {str(e)}")
        socketio.emit('processing_complete', {
            'status': 'error',
            'error': str(e)
        }, room=session_id)

if __name__ == '__main__':
    port = int(os.getenv("PORT", 5000))
    socketio.run(app, host='0.0.0.0', port=port, debug=True, allow_unsafe_werkzeug=True)
