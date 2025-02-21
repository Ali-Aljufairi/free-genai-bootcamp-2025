import streamlit as st
import os
import json

class YouTubeTranscriptManager:
    def __init__(self, youtube_service):
        self.youtube_service = youtube_service
        self.transcript_dir = "saved_transcripts"
        os.makedirs(self.transcript_dir, exist_ok=True)

    def save_transcript(self, url, transcript_data):
        """Save transcript data to a JSON file"""
        video_id = self.youtube_service.extract_video_id(url)
        if not video_id:
            return False
        
        file_path = os.path.join(self.transcript_dir, f"{video_id}.json")
        try:
            with open(file_path, 'w', encoding='utf-8') as f:
                json.dump(transcript_data, f, ensure_ascii=False, indent=2)
            return True
        except Exception as e:
            st.error(f"Error saving transcript: {str(e)}")
            return False

    def load_transcript(self, video_id):
        """Load transcript data from a JSON file"""
        file_path = os.path.join(self.transcript_dir, f"{video_id}.json")
        try:
            with open(file_path, 'r', encoding='utf-8') as f:
                return json.load(f)
        except:
            return None

    def get_saved_transcripts(self):
        """Get list of saved transcript files"""
        try:
            files = os.listdir(self.transcript_dir)
            return [f.replace('.json', '') for f in files if f.endswith('.json')]
        except Exception as e:
            st.error(f"Error getting saved transcripts: {str(e)}")
            return [] 