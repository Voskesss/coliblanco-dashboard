import os
import time
import azure.cognitiveservices.speech as speechsdk
import sounddevice as sd
import numpy as np
from dotenv import load_dotenv

# Laad omgevingsvariabelen
load_dotenv()

# Haal de Azure Speech configuratie op uit de omgevingsvariabelen
AZURE_SPEECH_KEY = os.getenv("AZURE_SPEECH_KEY")
AZURE_SPEECH_REGION = os.getenv("AZURE_SPEECH_REGION")

if not AZURE_SPEECH_KEY or not AZURE_SPEECH_REGION:
    print("Fout: AZURE_SPEECH_KEY of AZURE_SPEECH_REGION is niet ingesteld in de .env file")
    print("Ga naar Azure Portal om een Speech resource aan te maken en de key en region op te halen")
    exit(1)

# Functie om een bevestigingsgeluid af te spelen wanneer het wake word is gedetecteerd
def play_confirmation_sound():
    # Genereer een korte pieptoon
    sd.play(np.sin(2 * np.pi * 440 * np.arange(8000) / 8000)[:2000], samplerate=8000)
    sd.wait()

# Functie om de wake word detectie te testen
def test_azure_wake_word(keyword_model_path=None):
    try:
        # Maak een configuratie voor de speech herkenning
        speech_config = speechsdk.SpeechConfig(subscription=AZURE_SPEECH_KEY, region=AZURE_SPEECH_REGION)
        speech_config.speech_recognition_language = "nl-NL"  # Nederlands
        
        # Als er een pad naar een aangepast wake word model is opgegeven, gebruik dat
        if keyword_model_path and os.path.exists(keyword_model_path):
            print(f"Gebruik aangepast wake word model uit: {keyword_model_path}")
            keyword_model = speechsdk.KeywordRecognitionModel(keyword_model_path)
            wake_word_name = os.path.basename(keyword_model_path).replace('.table', '')
        else:
            # Anders gebruik een standaard wake word
            print("Geen aangepast wake word model gevonden, gebruik spraakherkenning om te luisteren")
            keyword_model = None
            wake_word_name = "hey coliblanco"
        
        # Maak een audio configuratie voor de microfoon
        audio_config = speechsdk.audio.AudioConfig(use_default_microphone=True)
        
        # Maak een speech herkenner
        speech_recognizer = speechsdk.SpeechRecognizer(speech_config=speech_config, audio_config=audio_config)
        
        print(f"Luisteren naar spraak...")
        print(f"Zeg '{wake_word_name}' om de wake word detectie te testen")
        print("Druk op Ctrl+C om te stoppen")
        
        # Callback functie voor wanneer een wake word is gedetecteerd
        def keyword_recognized_callback(evt):
            # evt bevat informatie over de herkenning
            result = evt.result
            if result.reason == speechsdk.ResultReason.RecognizedKeyword:
                print(f"\nWake word '{wake_word_name}' gedetecteerd!")
                play_confirmation_sound()
                print(f"\nLuisteren naar wake word '{wake_word_name}'...")
        
        # Callback functie voor wanneer spraak is herkend
        def speech_recognized_callback(evt):
            # evt bevat informatie over de herkenning
            result = evt.result
            if result.reason == speechsdk.ResultReason.RecognizedSpeech:
                text = result.text.lower()
                print(f"Herkende tekst: {text}")
                
                # Controleer of de tekst het wake word bevat
                if wake_word_name.lower() in text:
                    print(f"\nWake word '{wake_word_name}' gedetecteerd in tekst!")
                    play_confirmation_sound()
                    print(f"\nLuisteren naar wake word '{wake_word_name}'...")
        
        # Registreer de callbacks
        if keyword_model:
            speech_recognizer.recognized_keyword.connect(keyword_recognized_callback)
        else:
            speech_recognizer.recognized.connect(speech_recognized_callback)
        
        # Start de herkenning
        if keyword_model:
            # Start de wake word detectie
            speech_recognizer.start_keyword_recognition(keyword_model)
        else:
            # Start de continue spraakherkenning
            speech_recognizer.start_continuous_recognition()
        
        # Houd het script draaiende
        while True:
            time.sleep(0.1)
    
    except KeyboardInterrupt:
        print("\nTest gestopt door gebruiker")
    except Exception as e:
        print(f"\nFout bij wake word detectie: {str(e)}")
    finally:
        if 'speech_recognizer' in locals():
            if keyword_model:
                speech_recognizer.stop_keyword_recognition()
            else:
                speech_recognizer.stop_continuous_recognition()

if __name__ == "__main__":
    # Controleer of er een aangepast wake word model is opgegeven via een omgevingsvariabele
    keyword_model_path = os.getenv("KEYWORD_MODEL_PATH")
    
    # Of zoek naar .table bestanden in de huidige map (Azure Speech Studio wake word modellen)
    if not keyword_model_path:
        table_files = [f for f in os.listdir(".") if f.endswith(".table")]
        if table_files:
            keyword_model_path = table_files[0]
            print(f"Gevonden aangepast wake word model bestand: {keyword_model_path}")
    
    test_azure_wake_word(keyword_model_path)
