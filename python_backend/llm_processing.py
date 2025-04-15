import os
import logging
import openai
from dotenv import load_dotenv

# Laad environment variables
load_dotenv()

# Configureer logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Configureer OpenAI API
openai.api_key = os.getenv("OPENAI_API_KEY")
if not openai.api_key:
    logger.error("OPENAI_API_KEY niet gevonden in environment variables!")

def process_with_llm(messages, model="gpt-4o", temperature=0.7, max_tokens=150):
    """
    Verwerk berichten met een taalmodel
    
    Args:
        messages (list): Lijst van berichten in het formaat {"role": "...", "content": "..."}
        model (str): Model om te gebruiken (default: "gpt-4o")
        temperature (float): Temperatuur parameter (default: 0.7)
        max_tokens (int): Maximum aantal tokens in het antwoord (default: 150)
        
    Returns:
        dict: Antwoord van het model
    """
    try:
        logger.info(f"Verwerken van {len(messages)} berichten met {model}")
        
        # Voeg systeembericht toe als dat nog niet is gedaan
        if not any(msg.get("role") == "system" for msg in messages):
            system_message = {
                "role": "system",
                "content": """Je bent een vriendelijke Nederlandse assistent voor het Coliblanco Dashboard. 
                Je geeft korte, behulpzame antwoorden in het Nederlands. 
                Wees beleefd, informatief en to-the-point.
                Houd je antwoorden kort en bondig, maar wel vriendelijk en behulpzaam.
                Spreek Nederlands."""
            }
            messages = [system_message] + messages
        
        # Roep de OpenAI API aan
        response = openai.chat.completions.create(
            model=model,
            messages=messages,
            temperature=temperature,
            max_tokens=max_tokens
        )
        
        logger.info(f"Antwoord ontvangen van {model}")
        
        return response.model_dump()
    
    except Exception as e:
        logger.error(f"Fout bij verwerken met LLM: {str(e)}")
        raise

def analyze_intent(text):
    """
    Analyseer de intentie van een tekst
    
    Args:
        text (str): Tekst om te analyseren
        
    Returns:
        dict: Geanalyseerde intentie
    """
    try:
        logger.info(f"Intentie analyseren: {text[:50]}...")
        
        # Bereid de berichten voor
        messages = [
            {
                "role": "system",
                "content": """Je bent een intentie-analysesysteem. 
                Analyseer de tekst en bepaal de intentie van de gebruiker.
                Retourneer een JSON object met de volgende velden:
                - intent: de primaire intentie (bijv. 'vraag', 'opdracht', 'informatie')
                - action: specifieke actie (bijv. 'muziek_afspelen', 'weer_opvragen')
                - entities: relevante entiteiten in de tekst
                - confidence: vertrouwensniveau (0-1)
                """
            },
            {
                "role": "user",
                "content": text
            }
        ]
        
        # Roep de OpenAI API aan
        response = openai.chat.completions.create(
            model="gpt-4o",
            messages=messages,
            temperature=0.3,
            max_tokens=150,
            response_format={"type": "json_object"}
        )
        
        # Haal het antwoord op
        intent_data = response.choices[0].message.content
        
        logger.info(f"Intentie analyse succesvol")
        
        return intent_data
    
    except Exception as e:
        logger.error(f"Fout bij intentie analyse: {str(e)}")
        raise
