"""
Configuration module for the Speech application.
"""
import os
from pathlib import Path
from dotenv import load_dotenv

# Load environment variables from .env file
load_dotenv()

# Base directory
BASE_DIR = Path(__file__).resolve().parent.parent.parent

# Logging
LOG_DIR = BASE_DIR / "logs"
LOG_FILE = LOG_DIR / "app.log"

# API Keys
OPENAI_API_KEY = os.getenv("OPENAI_API_KEY")
GROQ_API_KEY = os.getenv("GROQ_API_KEY")

# Paths
AUDIO_DIR = BASE_DIR / "data" / "audio"
IMAGE_DIR = BASE_DIR / "data" / "images"

# Create directories if they don't exist
os.makedirs(AUDIO_DIR, exist_ok=True)
os.makedirs(IMAGE_DIR, exist_ok=True)
os.makedirs(LOG_DIR, exist_ok=True)

# Model configuration
WHISPER_MODEL = "whisper-1"
BEDROCK_IMAGE_MODEL = "stability.stable-diffusion-xl-v1"
GROQ_MODEL = "llama3-70b-8192"