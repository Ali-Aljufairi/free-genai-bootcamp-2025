from typing import Dict, List, Optional
from youtube_transcript_api import YouTubeTranscriptApi
from youtubesearchpython import VideosSearch
from backend.utils.logger import Logger
import os
import asyncio


class YouTubeService:
    def __init__(self):
        self.base_url = "https://www.youtube.com"
        self.google_search_url = "https://www.google.com/search"
        self.logger = Logger().get_logger()
        self.debug_dir = os.path.join(os.path.dirname(os.path.dirname(__file__)), "data", "debug")
        os.makedirs(self.debug_dir, exist_ok=True)

    async def search_jlpt_videos(self, level: str, max_results: int = 10) -> List[Dict]:
        """Search YouTube for JLPT listening test videos using youtube-search-python"""
        try:
            self.logger.info(f"Searching for JLPT {level} listening test videos")
            search_query = f"JLPT {level} listening test"
            
            # Use VideosSearch from youtube-search-python
            search = VideosSearch(search_query, limit=max_results)
            results = await search.next()
            
            if not results or "result" not in results:
                self.logger.warning("No search results found")
                return []
            
            videos = []
            for video in results["result"]:
                video_data = {
                    "id": video["id"],
                    "title": video["title"],
                    "duration": video["duration"],
                    "url": video["link"]
                }
                videos.append(video_data)
                
            self.logger.debug(f"Found {len(videos)} videos")
            return videos
            
        except Exception as e:
            self.logger.error(f"Error searching videos: {str(e)}", exc_info=True)
            return []

    async def get_transcript(self, video_url: str) -> Optional[str]:
        """Get transcript for a YouTube video"""
        try:
            video_id = self.extract_video_id(video_url)
            if not video_id:
                self.logger.error(f"Could not extract video ID from URL: {video_url}")
                return None
                
            self.logger.info(f"Getting transcript for video: {video_id}")
            
            # Get transcript using YouTubeTranscriptApi
            transcript = await asyncio.to_thread(
                YouTubeTranscriptApi.get_transcript,
                video_id,
                languages=['ja']
            )
            
            if not transcript:
                self.logger.warning(f"No transcript found for video: {video_id}")
                return None
                
            self.logger.debug(f"Successfully retrieved transcript with {len(transcript)} segments")
            return transcript
            
        except Exception as e:
            self.logger.error(f"Error getting transcript: {str(e)}", exc_info=True)
            return None

    @staticmethod
    def extract_video_id(url: str) -> Optional[str]:
        """Extract video ID from YouTube URL"""
        if not url:
            return None

        if "v=" in url:
            return url.split("v=")[1][:11]
        elif "youtu.be/" in url:
            return url.split("youtu.be/")[1][:11]
        return None

    async def get_level_transcript(self, level: str) -> Dict[str, str]:
        """
        Get transcripts for a specific JLPT level.
        Returns a dictionary with video URLs and their transcripts.
        """
        try:
            self.logger.info(f"Getting transcripts for JLPT {level}")
            
            # Search for videos dynamically
            videos = await self.search_jlpt_videos(level)
            
            # Get transcripts for all videos
            results = {}
            for video in videos:
                transcript = await self.get_transcript(video["url"])
                if transcript:
                    results[video["url"]] = transcript
            
            if not results:
                self.logger.warning(f"No transcripts found for JLPT {level}")
                return {}
                
            return results

        except Exception as e:
            self.logger.error(f"Error getting level transcript: {str(e)}", exc_info=True)
            return {}
