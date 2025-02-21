from youtube_transcript_api import YouTubeTranscriptApi
import os
from backend.utils.logger import Logger

class YouTubeTranscriptDownloader:
    def __init__(self):
        self.logger = Logger().get_logger()

    def get_transcript(self, video_id: str) -> str:
        """Get transcript for a YouTube video"""
        try:
            self.logger.info(f"Attempting to get transcript for video: {video_id}")
            transcript = YouTubeTranscriptApi.get_transcript(video_id, languages=['ja'])
            self.logger.debug(f"Successfully retrieved transcript with {len(transcript)} segments")
            return transcript
        except Exception as e:
            self.logger.error(f"Failed to get transcript: {str(e)}", exc_info=True)
            return None

    def get_transcript_text(self, transcript) -> str:
        """Extract text from transcript"""
        try:
            self.logger.debug("Processing transcript text")
            return ' '.join([entry['text'] for entry in transcript])
        except Exception as e:
            self.logger.error(f"Error processing transcript text: {str(e)}", exc_info=True)
            return ""

    def save_transcript(self, transcript: str, video_id: str) -> bool:
        """Save transcript to file"""
        try:
            self.logger.info(f"Saving transcript for video {video_id}")
            transcript_dir = os.path.join("backend", "data", "transcripts")
            os.makedirs(transcript_dir, exist_ok=True)
            
            transcript_path = os.path.join(transcript_dir, f"{video_id}.txt")
            self.logger.debug(f"Saving to path: {transcript_path}")
            
            with open(transcript_path, 'w', encoding='utf-8') as f:
                f.write(transcript)
            
            self.logger.info(f"Successfully saved transcript for {video_id}")
            return True
        except Exception as e:
            self.logger.error(f"Failed to save transcript: {str(e)}", exc_info=True)
            return False 