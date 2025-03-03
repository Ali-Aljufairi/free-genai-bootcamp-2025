"""
Audio recording functionality for the Speech application.
"""

import time
import tempfile
from pathlib import Path
import streamlit as st
from audio_recorder_streamlit import audio_recorder
import numpy as np
import wave
import io
import os

from ..utils.logger import get_logger
from ..utils.config import AUDIO_DIR
from ..utils.helpers import generate_unique_filename
from pydub import AudioSegment

logger = get_logger("audio.recorder")


def record_and_save(
    duration=5, sample_rate=16000, channels=1, device=None, file_path=None
):
    """
    Record audio using the Streamlit audio recorder component and save it to a file.

    Args:
        duration (int): Not used with audio_recorder_streamlit but kept for compatibility
        sample_rate (int): Sample rate for the audio recording
        channels (int): Number of audio channels
        device (int, optional): Not used with audio_recorder_streamlit but kept for compatibility
        file_path (str, optional): Path to save the file, if None a generated path is used

    Returns:
        str: Path to the saved audio file or None if no recording was made
    """
    logger.info("Starting audio recording process with audio_recorder_streamlit")

    st.write("Click the microphone button below to start/stop recording")
    audio_bytes = audio_recorder(pause_threshold=2.0, sample_rate=sample_rate)

    if audio_bytes:
        logger.info(f"Received audio: {len(audio_bytes)} bytes")

        # Generate file path if not provided
        if file_path is None:
            filename = generate_unique_filename(prefix="recording", extension="wav")
            file_path = str(AUDIO_DIR / filename)

        # Ensure the audio directory exists
        os.makedirs(os.path.dirname(file_path), exist_ok=True)

        # First save the raw bytes to inspect what format we're getting
        raw_path = file_path.replace(".wav", "_raw.webm")
        with open(raw_path, "wb") as f:
            f.write(audio_bytes)
        logger.debug(f"Raw audio bytes saved to {raw_path}")

        # Convert audio bytes to proper WAV format using pydub
        logger.debug("Converting audio bytes to proper WAV format")
        try:
            # Create a temporary file with the raw bytes
            with tempfile.NamedTemporaryFile(delete=False, suffix=".webm") as tmp:
                tmp.write(audio_bytes)
                temp_path = tmp.name

            logger.debug(f"Temporary file created: {temp_path}")

            # Convert to WAV using pydub
            logger.debug("Loading audio with pydub")
            audio = AudioSegment.from_file(temp_path)

            logger.debug(
                f"Audio loaded: {audio.duration_seconds}s, {audio.channels} channels, {audio.frame_rate}Hz"
            )

            # Set parameters to ensure compatibility with Whisper API
            audio = audio.set_frame_rate(16000)  # Whisper works well with 16kHz
            audio = audio.set_channels(1)  # Use mono for speech recognition

            logger.debug(f"Exporting to WAV: {file_path}")
            audio.export(file_path, format="wav")

            # Remove the temporary file
            Path(temp_path).unlink(missing_ok=True)

            logger.info(f"Audio converted and saved to {file_path}")

            # Verify the file exists and has content
            if os.path.exists(file_path) and os.path.getsize(file_path) > 0:
                logger.info(
                    f"WAV file created successfully: {os.path.getsize(file_path)} bytes"
                )
            else:
                logger.error(f"WAV file creation failed or file is empty")

            return file_path
        except Exception as e:
            logger.error(f"Error converting audio format: {str(e)}")
            # If pydub conversion fails, try a direct approach with wave module
            try:
                logger.debug("Attempting direct WAV creation with wave module")
                # For simplicity, assuming audio_bytes might be PCM data
                with wave.open(file_path, "wb") as wf:
                    wf.setnchannels(1)  # Mono
                    wf.setsampwidth(2)  # 16-bit
                    wf.setframerate(16000)  # 16kHz
                    wf.writeframes(audio_bytes)

                logger.info(f"Direct WAV save succeeded: {file_path}")
                return file_path
            except Exception as wave_error:
                logger.error(f"Direct WAV creation failed: {str(wave_error)}")
                # Last resort - save the raw bytes
                with open(file_path, "wb") as f:
                    f.write(audio_bytes)
                logger.warning(
                    f"Saved raw audio bytes to {file_path} without conversion"
                )
                return file_path
    else:
        logger.warning("No audio was recorded")
        return None
