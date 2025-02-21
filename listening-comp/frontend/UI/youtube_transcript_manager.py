import streamlit as st
import os
import json

class YouTubeTranscriptManager:
    def __init__(self, youtube_service):
        self.youtube_service = youtube_service
        self.transcript_dir = "saved_transcripts"
        os.makedirs(self.transcript_dir, exist_ok=True)
        self.n_levels = ["N1", "N2", "N3", "N4", "N5"]

    def save_transcript(self, url, transcript_data, n_level="N5", video_title=None):
        """Save transcript data to a JSON file with N-level and video title"""
        video_id = self.youtube_service.extract_video_id(url)
        if not video_id:
            return False
        
        if n_level not in self.n_levels:
            n_level = "N5"  # Default to N5 if invalid level
        
        if not video_title:
            video_title = f"Video {video_id}"  # Default title if none provided
        
        metadata = {
            "video_id": video_id,
            "video_title": video_title,
            "n_level": n_level,
            "transcript": transcript_data
        }
        
        file_path = os.path.join(self.transcript_dir, f"{video_id}.json")
        try:
            with open(file_path, 'w', encoding='utf-8') as f:
                json.dump(metadata, f, ensure_ascii=False, indent=2)
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
        """Get list of saved transcripts grouped by N-level"""
        try:
            grouped_transcripts = {level: [] for level in self.n_levels}
            files = os.listdir(self.transcript_dir)
            
            for file in files:
                if file.endswith('.json'):
                    transcript_data = self.load_transcript(file.replace('.json', ''))
                    if transcript_data:
                        n_level = transcript_data.get('n_level', 'N5')
                        video_title = transcript_data.get('video_title', file)
                        video_id = transcript_data.get('video_id')
                        grouped_transcripts[n_level].append({
                            'video_id': video_id,
                            'title': video_title
                        })
            
            # Sort transcripts within each N-level by title
            for level in self.n_levels:
                grouped_transcripts[level].sort(key=lambda x: x['title'])
            
            return grouped_transcripts
        except Exception as e:
            st.error(f"Error getting saved transcripts: {str(e)}")
            return {level: [] for level in self.n_levels}