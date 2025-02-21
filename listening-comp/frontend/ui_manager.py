import streamlit as st
from UI.audio_manager import AudioManager
from UI.practice_controls import PracticeControls
from UI.sidebar_manager import SidebarManager
from UI.question_content import QuestionContent
from frontend.question_manager import QuestionManager
import os
import sys

sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from backend.question_generator import QuestionGenerator
from backend.audio_generator import AudioGenerator
from backend.services.youtube_service import YouTubeService


class UIManager:
    def __init__(self):
        self.initialize_session_state()
        self.question_manager = QuestionManager()
        self.audio_manager = AudioManager()
        self.sidebar_manager = SidebarManager(self.question_manager)
        self.question_content = QuestionContent(self.question_manager)
        self.practice_controls = PracticeControls(self.question_manager)

    def initialize_session_state(self):
        """Initialize all required session state variables"""
        if "question_generator" not in st.session_state:
            st.session_state.question_generator = QuestionGenerator()
        if "audio_generator" not in st.session_state:
            st.session_state.audio_generator = AudioGenerator()
        if "youtube_service" not in st.session_state:
            st.session_state.youtube_service = YouTubeService()
        if "current_question" not in st.session_state:
            st.session_state.current_question = None
        if "feedback" not in st.session_state:
            st.session_state.feedback = None
        if "current_practice_type" not in st.session_state:
            st.session_state.current_practice_type = None
        if "current_topic" not in st.session_state:
            st.session_state.current_topic = None
        if "current_audio" not in st.session_state:
            st.session_state.current_audio = None

    def render_interactive_stage(self):
        """Main method to render the entire interactive learning stage"""
        self.sidebar_manager.render()
        self.practice_controls.render()
        self.question_content.render()
