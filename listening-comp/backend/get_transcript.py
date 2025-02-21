from youtube_transcript_api import YouTubeTranscriptApi
from typing import Optional, Dict, List
import os


class TranscriptDownloader:
    def __init__(self):
        self.transcript_dir = "./transcripts"
        os.makedirs(self.transcript_dir, exist_ok=True)

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
                print("Error: Invalid YouTube URL")
                return None

            print(f"Downloading transcript for video ID: {video_id}")
            
            # Get transcript
            transcript = YouTubeTranscriptApi.get_transcript(video_id, languages=["ja"])
            if not transcript:
                print("Error: No transcript found")
                return None

            # Convert transcript to text
            transcript_text = "\n".join([entry["text"] for entry in transcript])

            # Save to file if requested
            if save_to_file:
                self._save_transcript(transcript_text, video_id)

            return transcript_text

        except Exception as e:
            print(f"Error: {str(e)}")
            return None

    def _save_transcript(self, transcript: str, video_id: str) -> None:
        """Save transcript to file"""
        try:
            filepath = os.path.join(self.transcript_dir, f"{video_id}.txt")
            with open(filepath, "w", encoding="utf-8") as f:
                f.write(transcript)
            print(f"Transcript saved to: {filepath}")
        except Exception as e:
            print(f"Error saving transcript: {str(e)}")


def main():
    url = input("Enter YouTube URL: ")
    downloader = TranscriptDownloader()
    transcript = downloader.get_transcript(url)
    
    if transcript:
        print("\nTranscript:")
        print(transcript)


if __name__ == "__main__":
    main()
