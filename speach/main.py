"""
Main entry point for the Speech application.
"""
import os
from pathlib import Path
from src.ui.app import main
from src.utils.logger import get_logger

logger = get_logger("main")

if __name__ == "__main__":
    # Ensure necessary directories exist
    for directory in ["data/audio", "data/images", "logs"]:
        os.makedirs(Path(__file__).parent / "speach" / directory, exist_ok=True)
    
    logger.info("Starting Speech application")
    main()