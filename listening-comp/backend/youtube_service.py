from typing import List, Dict, Optional
from youtubesearchpython.__future__ import VideosSearch
from .get_transcript import YouTubeTranscriptDownloader


class YouTubeService:
    def __init__(self):
        self.downloader = YouTubeTranscriptDownloader()

    async def search_jlpt_videos(self, level: str, max_results: int = 5) -> List[Dict]:
        """Search YouTube for JLPT listening test videos"""
        search_query = f"JLPT {level} listening test"
        try:
            search = VideosSearch(search_query, limit=max_results)
            results = await search.next()
            if not results or "result" not in results:
                return []
            
            return [
                {
                    "id": video["id"],
                    "title": video["title"],
                    "duration": video["duration"],
                    "url": video["link"],
                }
                for video in results["result"]
            ]
        except Exception as e:
            print(f"YouTube search error: {str(e)}")
            return []

    def process_transcript(self, video_id: str, video_title: str) -> Optional[Dict]:
        """Process and structure the video transcript"""
        transcript = self.downloader.get_transcript(video_id)
        if transcript:
            return {
                "video_id": video_id,
                "title": video_title,
                "transcript": transcript,
                "text": self.downloader.get_transcript_text(transcript),
            }
        return None 