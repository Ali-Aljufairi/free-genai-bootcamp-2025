"""
Main Streamlit application for the Speech app.
"""

import os
import time
import streamlit as st
from PIL import Image
import tempfile
from pydub import AudioSegment  # Add missing import

from ..utils.logger import get_logger
from ..audio.recorder import record_and_save
from ..transcription.whisper_client import WhisperClient
from ..image_generation.bedrock_client import BedrockImageGenerator
from ..feedback.groq_client import GroqClient

logger = get_logger("ui.app")


class SpeechApp:
    """Streamlit application for Speech recording, transcription, and analysis."""

    def __init__(self):
        """Initialize the Speech application."""
        logger.info("Initializing SpeechApp")
        self._initialize_session_state()
        self._load_services()

    def _initialize_session_state(self):
        """Initialize Streamlit session state variables."""
        logger.debug("Initializing session state")
        if "audio_file_path" not in st.session_state:
            st.session_state.audio_file_path = None
        if "transcript" not in st.session_state:
            st.session_state.transcript = None
        if "feedback" not in st.session_state:
            st.session_state.feedback = None
        if "image_path" not in st.session_state:
            st.session_state.image_path = None

    def _load_services(self):
        """Load the required services."""
        logger.debug("Loading services")
        try:
            self.whisper_client = WhisperClient()
            logger.info("WhisperClient loaded successfully")
        except Exception as e:
            logger.error(f"Failed to load WhisperClient: {str(e)}")
            self.whisper_client = None

        try:
            self.bedrock_client = BedrockImageGenerator()
            logger.info("BedrockImageGenerator loaded successfully")
        except Exception as e:
            logger.error(f"Failed to load BedrockImageGenerator: {str(e)}")
            self.bedrock_client = None

        try:
            self.groq_client = GroqClient()
            logger.info("GroqClient loaded successfully")
        except Exception as e:
            logger.error(f"Failed to load GroqClient: {str(e)}")
            self.groq_client = None

    def run(self):
        """Run the Streamlit application."""
        logger.info("Starting SpeechApp UI")
        st.title("Voice Analysis & Visualization App")
        st.write(
            "Record your voice to transcribe, analyze Japanese structure, and generate images."
        )

        self._render_audio_section()

        if st.session_state.transcript:
            self._render_transcript_section()
            self._render_feedback_section()
            self._render_image_section()

    def _render_audio_section(self):
        """Render the audio recording section."""
        st.header("🎤 Voice Recording")

        col1, col2 = st.columns(2)

        with col1:
            upload_option = st.checkbox("Upload audio file instead", value=False)

        if upload_option:
            uploaded_file = st.file_uploader(
                "Upload an audio file", type=["wav", "mp3", "m4a"]
            )
            process_button = st.button("Process Uploaded Audio")
            if uploaded_file and process_button:
                logger.info(f"Processing uploaded audio file: {uploaded_file.name}")
                try:
                    # Read the uploaded file into memory
                    audio_bytes = uploaded_file.read()

                    # Create a temporary file with original extension
                    original_ext = os.path.splitext(uploaded_file.name)[1].lower()
                    with tempfile.NamedTemporaryFile(
                        delete=False, suffix=original_ext
                    ) as tmp_file:
                        tmp_file.write(audio_bytes)
                        temp_path = tmp_file.name

                    # Convert to WAV using pydub
                    logger.debug(f"Converting uploaded file to WAV format: {temp_path}")
                    audio = AudioSegment.from_file(temp_path)

                    # Set parameters for Whisper API compatibility
                    audio = audio.set_frame_rate(16000)
                    audio = audio.set_channels(1)

                    # Save as WAV
                    wav_path = temp_path.replace(original_ext, ".wav")
                    audio.export(wav_path, format="wav")

                    # Clean up original temp file
                    os.unlink(temp_path)

                    st.session_state.audio_file_path = wav_path
                    logger.info(
                        f"Successfully converted uploaded file to WAV: {wav_path}"
                    )

                    # Process the uploaded audio
                    self._process_audio()

                except Exception as e:
                    logger.error(f"Error processing uploaded file: {str(e)}")
                    st.error(f"Error processing audio file: {str(e)}")
        else:
            # Audio recorder component with process button
            col1, col2 = st.columns([3, 1])
            with col1:
                audio_file_path = record_and_save()
            with col2:
                process_recording = st.button("Process Recording")

            # If we have a recording and the process button is clicked, process it
            if audio_file_path and process_recording:
                st.session_state.audio_file_path = audio_file_path
                st.success("Recording completed! Processing audio...")
                self._process_audio()

        # Display audio player if audio exists
        if st.session_state.audio_file_path and os.path.exists(
            st.session_state.audio_file_path
        ):
            st.audio(st.session_state.audio_file_path)

    def _process_audio(self):
        """Process the recorded or uploaded audio."""
        logger.info(f"Processing audio file: {st.session_state.audio_file_path}")
        if not self.whisper_client:
            st.error("Whisper service is not available")
            return

        with st.spinner("Transcribing audio..."):
            try:
                result = self.whisper_client.transcribe_japanese(
                    st.session_state.audio_file_path
                )
                st.session_state.transcript = result["text"]
                logger.info("Transcription successful")
                logger.debug(f"Transcript: {st.session_state.transcript}")
            except Exception as e:
                logger.error(f"Transcription error: {str(e)}")
                st.error(f"Transcription error: {str(e)}")

    def _render_transcript_section(self):
        """Render the transcript section."""
        st.header("📝 Transcription")
        st.write(st.session_state.transcript)

        if st.button("Analyze Japanese Structure"):
            self._analyze_japanese()

    def _analyze_japanese(self):
        """Analyze Japanese sentence structure."""
        logger.info("Analyzing Japanese sentence structure")
        if not self.groq_client:
            st.error("Groq service is not available")
            return

        with st.spinner("Analyzing Japanese sentence structure..."):
            try:
                result = self.groq_client.analyze_japanese_sentence(
                    st.session_state.transcript
                )
                st.session_state.feedback = result["raw_feedback"]
                logger.info("Japanese analysis successful")
            except Exception as e:
                logger.error(f"Analysis error: {str(e)}")
                st.error(f"Analysis error: {str(e)}")

    def _render_feedback_section(self):
        """Render the feedback section."""
        if st.session_state.feedback:
            st.header("🔍 Japanese Structure Analysis")
            st.write(st.session_state.feedback)

            if not st.session_state.image_path and st.button("Generate Visualization"):
                self._generate_image()

    def _generate_image(self):
        """Generate an image based on the transcript."""
        logger.info("Generating image from transcript")
        if not self.bedrock_client:
            st.error("Bedrock service is not available")
            return

        with st.spinner("Generating image..."):
            try:
                _, image_path = self.bedrock_client.generate_image_from_transcript(
                    st.session_state.transcript
                )
                st.session_state.image_path = image_path
                logger.info(f"Image generation successful: {image_path}")
            except Exception as e:
                logger.error(f"Image generation error: {str(e)}")
                st.error(f"Image generation error: {str(e)}")

    def _render_image_section(self):
        """Render the image section."""
        if st.session_state.image_path and os.path.exists(st.session_state.image_path):
            st.header("🎨 Visualization")
            image = Image.open(st.session_state.image_path)
            st.image(image, caption="Generated visualization based on transcript")


def main():
    """Main entry point for the Streamlit app."""
    logger.info("Starting Speech application")
    app = SpeechApp()
    app.run()


if __name__ == "__main__":
    main()
