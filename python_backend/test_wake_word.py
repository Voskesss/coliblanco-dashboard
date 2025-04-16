import os
import time
from pvporcupine import create
import struct
import sounddevice as sd
import numpy as np
from dotenv import load_dotenv

# Laad omgevingsvariabelen
load_dotenv()

# Haal de Picovoice access key op uit de omgevingsvariabelen
PICOVOICE_ACCESS_KEY = os.getenv("PICOVOICE_ACCESS_KEY")

if not PICOVOICE_ACCESS_KEY:
    print("Fout: PICOVOICE_ACCESS_KEY is niet ingesteld in de .env file")
    print("Ga naar https://console.picovoice.ai/ om een gratis access key te krijgen")
    exit(1)

# Functie om de wake word te detecteren
def test_wake_word(custom_keyword_path=None):
    try:
        # Als er een pad naar een aangepast wake word is opgegeven, gebruik dat
        if custom_keyword_path and os.path.exists(custom_keyword_path):
            print(f"Gebruik aangepast wake word uit: {custom_keyword_path}")
            keyword_paths = [custom_keyword_path]
            porcupine = create(access_key=PICOVOICE_ACCESS_KEY, keyword_paths=keyword_paths)
            wake_word_name = os.path.basename(custom_keyword_path).replace('.ppn', '')
        else:
            # Anders gebruik een standaard wake word
            print("Geen aangepast wake word gevonden, gebruik standaard wake word 'hey google'")
            porcupine = create(access_key=PICOVOICE_ACCESS_KEY, keywords=["hey google"])
            wake_word_name = "hey google"
        
        print(f"Luisteren naar wake word '{wake_word_name}'...")
        print(f"Spreek '{wake_word_name}' om de wake word detectie te testen")
        
        # Start een audio stream
        with sd.RawInputStream(samplerate=porcupine.sample_rate, blocksize=porcupine.frame_length,
                            dtype="int16", channels=1) as stream:
            while True:
                # Lees audio data
                pcm = stream.read(porcupine.frame_length)[0]
                pcm_unpacked = struct.unpack_from("h" * porcupine.frame_length, pcm)
                
                # Verwerk de audio data met Porcupine
                keyword_index = porcupine.process(pcm_unpacked)
                
                # Als het wake word is gedetecteerd
                if keyword_index >= 0:
                    print(f"\nWake word '{wake_word_name}' gedetecteerd!")
                    # Speel een bevestigingsgeluid af
                    sd.play(np.sin(2 * np.pi * 440 * np.arange(8000) / 8000)[:2000], samplerate=8000)
                    sd.wait()
                    print(f"\nLuisteren naar wake word '{wake_word_name}'...")
    
    except KeyboardInterrupt:
        print("\nTest gestopt door gebruiker")
    except Exception as e:
        print(f"\nFout bij wake word detectie: {str(e)}")
    finally:
        if 'porcupine' in locals():
            porcupine.delete()

if __name__ == "__main__":
    # Controleer of er een aangepast wake word bestand is opgegeven via een omgevingsvariabele
    custom_keyword_path = os.getenv("CUSTOM_KEYWORD_PATH")
    
    # Of zoek naar .ppn bestanden in de huidige map
    if not custom_keyword_path:
        ppn_files = [f for f in os.listdir(".") if f.endswith(".ppn")]
        if ppn_files:
            custom_keyword_path = ppn_files[0]
            print(f"Gevonden aangepast wake word bestand: {custom_keyword_path}")
    
    test_wake_word(custom_keyword_path)
