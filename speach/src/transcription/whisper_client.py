"""
Transcription service using OpenAI Whisper.
"""
import os
from pathlib import Path
from openai import OpenAI
from ..utils.logger import get_logger
from ..utils.config import OPENAI_API_KEY, WHISPER_MODEL

logger = get_logger("transcription.whisper")

class WhisperClient:
    """Client for OpenAI's Whisper transcription service."""
    
    def __init__(self, api_key=None, model=WHISPER_MODEL):
        """
        Initialize the Whisper client.
        
        Args:
            api_key (str, optional): OpenAI API key. Defaults to value from config.
            model (str, optional): Whisper model to use. Defaults to value from config.
        """
        self.api_key = api_key or OPENAI_API_KEY
        if not self.api_key:
            logger.error("OpenAI API key is not set")
            raise ValueError("OpenAI API key is required for Whisper transcription")
            
        self.model = model
        logger.debug(f"Initializing WhisperClient with model: {model}")
        self.client = OpenAI(api_key=self.api_key)

    def transcribe(self, audio_file_path, language=None, prompt=None):
        """
        Transcribe an audio file using Whisper.
        
        Args:
            audio_file_path (str): Path to the audio file
            language (str, optional): Language code for transcription
            prompt (str, optional): Prompt to guide transcription
            
        Returns:
            dict: Transcription result containing text and metadata
        """
        audio_path = Path(audio_file_path)
        logger.info(f"Transcribing audio file: {audio_path.name}")
        
        if not audio_path.exists():
            logger.error(f"Audio file not found: {audio_path}")
            raise FileNotFoundError(f"Audio file not found: {audio_path}")
        
        try:
            with open(audio_path, "rb") as audio_file:
                params = {
                    "file": audio_file,
                    "model": self.model,
                }
                
                if language:
                    params["language"] = language
                if prompt:
                    params["prompt"] = prompt
                    
                logger.debug(f"Sending transcription request with parameters: {params}")
                response = self.client.audio.transcriptions.create(**params)
                
                logger.info("Transcription successful")
                return {
                    "text": response.text,
                    "model": self.model,
                    "language": language,
                    "audio_file": audio_path.name,
                }
        except Exception as e:
            logger.error(f"Error during transcription: {str(e)}")
            raise
            
    def transcribe_japanese(self, audio_file_path, prompt=None):
        """
        Transcribe an audio file specifically for Japanese language.
        
        Args:
            audio_file_path (str): Path to the audio file
            prompt (str, optional): Prompt to guide transcription
            
        Returns:
            dict: Transcription result containing text and metadata
        """
        logger.info("Starting Japanese-specific transcription")
        return self.transcribe(
            audio_file_path=audio_file_path,
            language="ja",
            prompt=prompt or "This is Japanese speech focusing on sentence structure."
        )