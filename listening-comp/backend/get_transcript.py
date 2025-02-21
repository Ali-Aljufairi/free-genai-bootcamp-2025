import os
import sys

sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from youtube_transcript_api import YouTubeTranscriptApi
from youtube_transcript_api.formatters import TextFormatter
from typing import Optional, Dict
import re
from urllib.parse import urlparse, parse_qs
from .structured_data import TranscriptStructurer
import logging

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s - %(levelname)s - %(message)s",
    datefmt="%Y-%m-%d %H:%M:%S",
)
logger = logging.getLogger(__name__)


class YouTubeTranscriptDownloader:
    def __init__(self):
        self.transcript_dir = "./transcripts"
        self.questions_dir = "./questions"
        os.makedirs(self.transcript_dir, exist_ok=True)
        os.makedirs(self.questions_dir, exist_ok=True)
        self.structurer = TranscriptStructurer()

    def extract_video_id(self, url: str) -> Optional[str]:
        """Extract video ID from YouTube URL"""
        if not url:
            return None

        if "v=" in url:
            return url.split("v=")[1][:11]
        elif "youtu.be/" in url:
            return url.split("youtu.be/")[1][:11]
        return None

    def get_transcript(self, url: str, save_to_file: bool = True) -> Optional[str]:
        """Get transcript for a YouTube video

        Args:
            url (str): YouTube video URL
            save_to_file (bool): Whether to save transcript to file

        Returns:
            Optional[str]: Transcript text if successful, None otherwise
        """
        try:
            # Extract video ID
            video_id = self.extract_video_id(url)
            if not video_id:
                logger.error("Invalid YouTube URL")
                return None

            logger.info(f"Downloading transcript for video ID: {video_id}")

            # Get transcript
            transcript = YouTubeTranscriptApi.get_transcript(video_id, languages=["ja"])
            if not transcript:
                logger.error("No transcript found")
                return None

            # Convert transcript to text
            transcript_text = "\n".join([entry["text"] for entry in transcript])

            # Save to file if requested
            if save_to_file:
                self._save_transcript(transcript_text, video_id)

            return transcript_text

        except Exception as e:
            logger.error(f"Error getting transcript: {str(e)}")
            return None

    def _save_transcript(self, transcript: str, video_id: str) -> None:
        """Save transcript to file"""
        try:
            filepath = os.path.join(self.transcript_dir, f"{video_id}.txt")
            with open(filepath, "w", encoding="utf-8") as f:
                f.write(transcript)
            logger.info(f"Transcript saved to: {filepath}")
        except Exception as e:
            logger.error(f"Error saving transcript: {str(e)}")

    def process_video(self, url: str) -> Optional[Dict[int, str]]:
        """Get transcript and structure it into questions"""
        logger.info("=== Starting Video Processing ===")
        logger.info(f"Downloading transcript from: {url}")
        transcript = self.get_transcript(url)
        if not transcript:
            logger.error("Failed to get transcript")
            return None

        logger.info("Starting question extraction...")
        # Structure the transcript into questions
        structured_sections = self.structurer.structure_transcript(transcript)

        if not structured_sections:
            logger.error("Failed to structure questions")
            return None

        logger.info(
            f"Successfully extracted questions from {len(structured_sections)} sections"
        )

        # Save structured questions
        if structured_sections:
            video_id = self.extract_video_id(url)
            questions_path = os.path.join(self.questions_dir, f"{video_id}")
            logger.info(f"Saving structured questions to: {questions_path}")
            if self.structurer.save_questions(structured_sections, questions_path):
                logger.info("Successfully saved questions")
            else:
                logger.error("Failed to save questions")

        logger.info("=== Processing Complete ===")
        return structured_sections


def get_transcript(url: str, save_to_file: bool = True) -> Optional[str]:
    """Convenience function to get transcript for a YouTube video"""
    downloader = YouTubeTranscriptDownloader()
    return downloader.get_transcript(url, save_to_file)

def main():
    url = input("Enter YouTube URL: ")
    downloader = YouTubeTranscriptDownloader()
    structured_sections = downloader.process_video(url)

    if structured_sections:
        print("\nStructured Questions:")
        for section_num, content in structured_sections.items():
            print(f"\nSection {section_num}:")
            print(content)


if __name__ == "__main__":
    main()
