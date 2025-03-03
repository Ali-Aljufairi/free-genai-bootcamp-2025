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

from ..utils.logger import get_logger
from ..utils.config import AUDIO_DIR
from ..utils.helpers import generate_unique_filename

logger = get_logger("audio.recorder")


def record_and_save(
    duration=5, sample_rate=16000, channels=1, device=None, file_path=None
):
    """
    Record audio using the Streamlit audio recorder component and save it to a file.

    Args:
        duration (int): Not used with audio_recorder_streamlit but kept for compatibility
        sample_rate (int): Not used with audio_recorder_streamlit but kept for compatibility
        channels (int): Not used with audio_recorder_streamlit but kept for compatibility
        device (int, optional): Not used with audio_recorder_streamlit but kept for compatibility
        file_path (str, optional): Path to save the file, if None a generated path is used

    Returns:
        str: Path to the saved audio file
    """
    logger.info("Starting audio recording process with audio_recorder_streamlit")

    try:
        st.write("Click the microphone button to start recording. Click again to stop.")
        audio_bytes = audio_recorder()

        if audio_bytes:
            # Generate file path if not provided
            if file_path is None:
                filename = generate_unique_filename(prefix="recording", extension="wav")
                file_path = str(AUDIO_DIR / filename)

            # Save audio bytes to file
            logger.debug(f"Saving audio to {file_path}")
            with open(file_path, "wb") as f:
                f.write(audio_bytes)

            logger.info(f"Audio saved to {file_path}")
            return file_path
        else:
            logger.warning("No audio was recorded")
            return None

    except Exception as e:
        logger.error(f"Error in record and save process: {str(e)}")
        raise
