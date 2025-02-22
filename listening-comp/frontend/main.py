import os
import sys
import streamlit as st
import asyncio
from functools import partial

# Add backend to path
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from backend.services.vector_store import QuestionVectorStore
from backend.services.audio_generator import AudioGenerator
from frontend.UI.question_content import QuestionContent
from frontend.UI.practice_controls import PracticeControls
from frontend.UI.audio_manager import AudioManager
from frontend.question_manager import QuestionManager
from backend.services.youtube_service import YouTubeService
from backend.utils.directory_manager import DirectoryManager
from backend.utils.logger import Logger


class JLPTListeningApp:
    def __init__(self):
        self.initialize_session_state()
        self.setup_ui_components()

    def initialize_session_state(self):
        """Initialize session state variables"""
        if 'current_question' not in st.session_state:
            st.session_state.current_question = None
        if 'current_audio' not in st.session_state:
            st.session_state.current_audio = None
        if 'current_practice_type' not in st.session_state:
            st.session_state.current_practice_type = "Dialogue Practice"
        if 'current_topic' not in st.session_state:
            st.session_state.current_topic = "Daily Life"
        if 'audio_generator' not in st.session_state:
            st.session_state.audio_generator = AudioGenerator()
        if 'vector_store' not in st.session_state:
            st.session_state.vector_store = QuestionVectorStore()
        if 'youtube_service' not in st.session_state:
            st.session_state.youtube_service = YouTubeService()
        if 'youtube_url' not in st.session_state:
            st.session_state.youtube_url = ""
        if 'jlpt_level' not in st.session_state:
            st.session_state.jlpt_level = "N5"

    def setup_ui_components(self):
        """Setup UI components"""
        self.question_manager = QuestionManager()
        self.practice_controls = PracticeControls(self.question_manager)
        self.question_content = QuestionContent(self.question_manager)
        self.audio_manager = AudioManager()

    async def process_youtube_url(self, youtube_url: str, jlpt_level: str):
        """Process YouTube URL and add transcript to vector store"""
        video_id = st.session_state.youtube_service.extract_video_id(youtube_url)
        transcript = await st.session_state.youtube_service.get_transcript(youtube_url)
        
        if transcript:
            # Add to vector store
            st.session_state.vector_store.add_transcript(
                video_id,
                transcript,
                {"level": jlpt_level}
            )
            return True
        return False

    def render(self):
        """Render the main application UI"""
        st.title("JLPT Listening Practice")
        
        # Sidebar for YouTube transcript input
        with st.sidebar:
            st.header(" Add New Content")
            st.subheader("YouTube Transcript")
            youtube_url = st.text_input("YouTube URL", key="youtube_url")
            jlpt_level = st.selectbox("JLPT Level", ["N5", "N4", "N3", "N2", "N1"], key="jlpt_level")
            
            if st.button("Add Transcript"):
                if youtube_url:
                    with st.spinner("Processing transcript..."):
                        try:
                            # Run async function
                            success = asyncio.run(self.process_youtube_url(youtube_url, jlpt_level))
                            if success:
                                st.success("Transcript added successfully!")
                            else:
                                st.error("Could not get transcript from video")
                        except Exception as e:
                            st.error(f"Error: {str(e)}")
                else:
                    st.warning("Please enter a YouTube URL")

        # Main content area
        col1, col2 = st.columns([2, 1])
        
        with col1:
            st.subheader("Practice Settings")
            # Topic selection
            topics = ["Daily Life", "Shopping", "Travel", "Work", "Study", "Health", "Entertainment"]
            selected_topic = st.selectbox("Select Topic", topics, key="current_topic")
            
            # Question generation
            if st.button("Generate Question from Transcripts"):
                with st.spinner("Generating question..."):
                    try:
                        question = st.session_state.vector_store.generate_question_from_transcript(selected_topic)
                        audio_file = st.session_state.audio_generator.generate_audio_from_transcript(question)
                        
                        st.session_state.current_question = question
                        st.session_state.current_audio = audio_file
                        st.session_state.current_practice_type = question["practice_type"]
                        st.session_state.current_topic = question["topic"]
                        
                        st.success("Question generated!")
                    except Exception as e:
                        st.error(f"Failed to generate question: {str(e)}")
        
        with col2:
            if st.session_state.current_question:
                st.subheader("Source Information")
                if "source_segments" in st.session_state.current_question:
                    for idx, segment in enumerate(st.session_state.current_question["source_segments"]):
                        st.write(f"Segment {idx + 1}:")
                        st.write(f"- Video ID: {segment['video_id']}")
                        st.write(f"- Time: {segment['start_time']}s - {segment['end_time']}s")

        # Display question content and audio controls
        if st.session_state.current_question:
            st.markdown("---")
            self.question_content.render()
            self.audio_manager.display_audio_section(
                st.session_state.audio_generator,
                st.session_state.current_question,
                st.session_state.current_practice_type,
                st.session_state.current_topic,
                self.question_manager.save_question
            )

def main():
    # Page config
    st.set_page_config(
        page_title="JLPT Listening Practice",
        page_icon="",
        layout="wide"
    )
    
    # Initialize directories
    DirectoryManager.initialize_app_directories()
    
    # Run the app
    app = JLPTListeningApp()
    app.render()

if __name__ == "__main__":
    main()
