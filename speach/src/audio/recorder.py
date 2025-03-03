"""
Audio recording functionality for the Speech application.
"""
import time
import tempfile
from pathlib import Path
import sounddevice as sd
import scipy.io.wavfile as wav
import numpy as np
from ..utils.logger import get_logger
from ..utils.config import AUDIO_DIR
from ..utils.helpers import generate_unique_filename

logger = get_logger("audio.recorder")

def list_audio_devices():
    """
    List available audio input devices.
    
    Returns:
        list: List of available audio input devices
    """
    logger.debug("Listing audio devices")
    devices = sd.query_devices()
    input_devices = [d for d in devices if d['max_input_channels'] > 0]
    logger.info(f"Found {len(input_devices)} input devices")
    return input_devices

def record_audio(duration=5, sample_rate=16000, channels=1, device=None):
    """
    Record audio for the specified duration.
    
    Args:
        duration (int): Recording duration in seconds
        sample_rate (int): Sample rate for recording
        channels (int): Number of audio channels
        device (int, optional): Device ID to use for recording
        
    Returns:
        tuple: (numpy array of audio data, sample rate)
    """
    logger.info(f"Recording audio for {duration} seconds (sr={sample_rate}, ch={channels}, device={device})")
    try:
        audio_data = sd.rec(
            frames=int(duration * sample_rate),
            samplerate=sample_rate,
            channels=channels,
            dtype='float32',
            device=device
        )
        sd.wait()
        logger.info("Recording completed successfully")
        return audio_data, sample_rate
    except Exception as e:
        logger.error(f"Error during recording: {str(e)}")
        raise

def save_audio(audio_data, sample_rate, file_path=None):
    """
    Save recorded audio to a WAV file.
    
    Args:
        audio_data (numpy.ndarray): Audio data as numpy array
        sample_rate (int): Sample rate of the audio
        file_path (str, optional): Path to save the file, if None a temporary file is created
        
    Returns:
        str: Path to the saved audio file
    """
    try:
        if file_path is None:
            filename = generate_unique_filename(prefix="recording", extension="wav")
            file_path = str(AUDIO_DIR / filename)
        
        # Convert float to int16 for WAV file
        audio_data_int = (audio_data * 32767).astype(np.int16)
        
        logger.debug(f"Saving audio to {file_path}")
        wav.write(file_path, sample_rate, audio_data_int)
        logger.info(f"Audio saved to {file_path}")
        
        return file_path
    except Exception as e:
        logger.error(f"Error saving audio file: {str(e)}")
        raise

def record_and_save(duration=5, sample_rate=16000, channels=1, device=None, file_path=None):
    """
    Record audio and save it to a file.
    
    Args:
        duration (int): Recording duration in seconds
        sample_rate (int): Sample rate for recording
        channels (int): Number of audio channels
        device (int, optional): Device ID to use for recording
        file_path (str, optional): Path to save the file, if None a generated path is used
        
    Returns:
        str: Path to the saved audio file
    """
    logger.info("Starting audio recording process")
    try:
        audio_data, sample_rate = record_audio(
            duration=duration,
            sample_rate=sample_rate,
            channels=channels,
            device=device
        )
        file_path = save_audio(audio_data, sample_rate, file_path)
        return file_path
    except Exception as e:
        logger.error(f"Error in record and save process: {str(e)}")
        raise