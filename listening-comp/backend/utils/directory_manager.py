import os
import streamlit as st

class DirectoryManager:
    @staticmethod
    def initialize_app_directories():
        """Initialize required directories for the application"""
        directories = [
            os.path.join("backend", "data"),
            os.path.join("backend", "data", "transcripts"),
            os.path.join("backend", "data", "questions"),
            os.path.join("frontend", "static", "audio"),
        ]

        for directory in directories:
            try:
                os.makedirs(directory, exist_ok=True)
            except Exception as e:
                st.error(f"Failed to create directory {directory}: {str(e)}") 