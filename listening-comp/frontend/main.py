import streamlit as st
import sys
import os

# Add project root to path
project_root = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
sys.path.append(project_root)

# Now we can import our modules
from frontend.components.random_tests import RandomTestsTab
from backend.utils.logger import Logger
from backend.services.youtube_service import YouTubeService
from backend.utils.directory_manager import DirectoryManager
from ui_manager import UIManager

# Enable debug logging at startup
Logger.enable_debug()
logger = Logger().get_logger()

logger.info("Starting JLPT Listening Practice Application")


class JLPTListeningApp:
    def __init__(self):
        DirectoryManager.initialize_app_directories()
        self.ui_manager = UIManager()
        self.youtube_service = YouTubeService()
        self.random_tests = RandomTestsTab()

    def render(self):
        """Render the main application interface"""
        st.title("JLPT Listening Practice")

        # Initialize session state
        self.ui_manager.initialize_session_state()

        # Create tabs for different functionalities
        tab1, tab2 = st.tabs(["Practice Questions", "Random Listening Tests"])

        with tab1:
            # Render the existing practice interface
            self.ui_manager.render_interactive_stage()

        with tab2:
            self.random_tests.render()


def main():
    # Page config
    st.set_page_config(
        page_title="JLPT Listening Practice", page_icon="🎧", layout="wide"
    )

    logger.debug("Initializing application components")
    app = JLPTListeningApp()
    logger.debug("Rendering main interface")
    app.render()


if __name__ == "__main__":
    main()
