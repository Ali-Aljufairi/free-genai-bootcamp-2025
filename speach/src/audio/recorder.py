"""
Audio recording functionality for the Speech application.
"""

import tempfile
from pathlib import Path
import streamlit as st
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
    Record audio using Streamlit's audio_input component and save it to a file.
    Args:
        duration (int): Not used with st.audio_input but kept for compatibility
        sample_rate (int): Sample rate for the audio recording (note: st.audio_input uses a fixed rate)
        channels (int): Number of audio channels (note: st.audio_input records in mono)
        device (int, optional): Not used with st.audio_input but kept for compatibility
        file_path (str, optional): Path to save the file, if None a generated path is used
    Returns:
        str: Path to the saved audio file or None if no recording was made
    """
    logger.info("Starting audio recording process with st.audio_input")

    audio_file = st.audio_input("Record your speech")

    if audio_file:
        # Get file size
        audio_file.seek(0, os.SEEK_END)
        file_size = audio_file.tell()
        audio_file.seek(0)  # Reset position to start of file

        logger.info(f"Received audio: {file_size} bytes")

        # Generate file path if not provided
        if file_path is None:
            filename = generate_unique_filename(prefix="recording", extension="wav")
            file_path = str(AUDIO_DIR / filename)

        # Ensure the audio directory exists
        os.makedirs(os.path.dirname(file_path), exist_ok=True)

        try:
            # Create a temporary file with the uploaded audio data
            with tempfile.NamedTemporaryFile(delete=False, suffix=".wav") as tmp:
                # Copy data from UploadedFile to temporary file
                audio_file.seek(0)  # Ensure we're at the beginning of the file
                tmp.write(audio_file.read())
                temp_path = tmp.name

            logger.debug(f"Temporary file created: {temp_path}")

            # Convert to the desired format using pydub
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
                logger.error("WAV file creation failed or file is empty")

            return file_path

        except Exception as e:
            logger.error(f"Error processing audio: {str(e)}")
            # Direct save as fallback
            with open(file_path, "wb") as f:
                audio_file.seek(0)  # Reset to beginning of file
                f.write(audio_file.read())
            logger.warning(f"Saved raw audio bytes to {file_path} without conversion")
            return file_path
    else:
        logger.warning("No audio was recorded")
        return None
