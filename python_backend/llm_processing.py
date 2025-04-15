import os
import logging
import json
from dotenv import load_dotenv

# Laad environment variables
load_dotenv()

# Configureer logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

def process_with_llm(messages, client, model="gpt-4o", temperature=0.7, max_tokens=150):
    """
    Verwerk berichten met een taalmodel
    
    Args:
        messages (list): Lijst van berichten in het formaat {"role": "...", "content": "..."}
        client: OpenAI client
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
        
        # Roep de OpenAI API aan met de nieuwe client
        response = client.chat.completions.create(
            model=model,
            messages=messages,
            temperature=temperature,
            max_tokens=max_tokens
        )
        
        logger.info(f"Antwoord ontvangen van {model}")
        
        # Converteer het antwoord naar een dict
        # In nieuwere versies van de OpenAI library is response al een dict-achtig object
        try:
            # Probeer eerst model_dump() (voor nieuwere versies)
            return response.model_dump()
        except AttributeError:
            # Als model_dump() niet bestaat, gebruik dan dict() of gewoon het object zelf
            try:
                return dict(response)
            except (TypeError, ValueError):
                # Als dict() niet werkt, geef het object terug als een dict in het juiste formaat
                return {
                    "choices": [
                        {
                            "message": {
                                "content": response.choices[0].message.content,
                                "role": "assistant"
                            },
                            "index": 0,
                            "finish_reason": "stop"
                        }
                    ],
                    "created": response.created,
                    "model": response.model,
                    "id": response.id
                }
    
    except Exception as e:
        logger.error(f"Fout bij verwerken met LLM: {str(e)}")
        raise

def analyze_intent(text, client):
    """
    Analyseer de intentie van een tekst
    
    Args:
        text (str): Tekst om te analyseren
        client: OpenAI client
        
    Returns:
        dict: Geanalyseerde intentie
    """
    try:
        logger.info(f"Analyseren van intentie: {text[:50]}...")
        
        # Bereid de berichten voor
        messages = [
            {
                "role": "system",
                "content": """Je bent een assistent die de intentie van gebruikersberichten analyseert.
                Classificeer de intentie in een van de volgende categorieën:
                - vraag: de gebruiker stelt een vraag
                - opdracht: de gebruiker geeft een opdracht
                - informatie: de gebruiker deelt informatie
                - begroeting: de gebruiker begroet je
                - afscheid: de gebruiker neemt afscheid
                - dank: de gebruiker bedankt je
                - anders: geen van bovenstaande
                
                Geef ook aan of het bericht een interruptie is (ja/nee).
                Een interruptie is een kort bericht dat de huidige conversatie onderbreekt,
                zoals "stop", "wacht", "pauze", etc.
                
                Geef je antwoord in JSON-formaat:
                {"intentie": "categorie", "interruptie": "ja/nee"}
                """
            },
            {
                "role": "user",
                "content": text
            }
        ]
        
        # Roep de OpenAI API aan met de nieuwe client
        response = client.chat.completions.create(
            model="gpt-3.5-turbo",
            messages=messages,
            temperature=0.3,
            max_tokens=100,
            response_format={"type": "json_object"}
        )
        
        # Haal het antwoord op en parse het als JSON
        answer = response.choices[0].message.content
        intent = json.loads(answer)
        
        logger.info(f"Intentie geanalyseerd: {intent}")
        
        return intent
    
    except Exception as e:
        logger.error(f"Fout bij analyseren van intentie: {str(e)}")
        return {"intentie": "anders", "interruptie": "nee"}
