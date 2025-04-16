import asyncio
import logging
from websocket_voice import start_websocket_voice

# Configureer logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

if __name__ == "__main__":
    logger.info("Start WebSocket voice interface test")
    try:
        start_websocket_voice()
    except KeyboardInterrupt:
        logger.info("Test gestopt door gebruiker")
    except Exception as e:
        logger.error(f"Fout bij testen WebSocket voice interface: {str(e)}")
