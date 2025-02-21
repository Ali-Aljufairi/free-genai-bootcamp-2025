import streamlit as st
from random import choice
import asyncio
import os
import random
from backend.services.youtube_service import YouTubeService
from backend.utils.transcript_downloader import (
    YouTubeTranscriptDownloader as TranscriptDownloader,
)
from backend.utils.logger import Logger


class RandomTestsTab:
    def __init__(self):
        self.youtube_service = YouTubeService()
        self.transcript_downloader = TranscriptDownloader()
        self.logger = Logger().get_logger()

    def get_transcript_path(self, video_id: str) -> str:
        """Get the path for transcript file"""

        return os.path.join("backend", "data", "transcripts", f"{video_id}.txt")

    def render(self):
        """Render the random tests tab"""
        st.header("YouTube Transcript Extractor")

        # YouTube URL input
        video_url = st.text_input("Enter YouTube Video URL")

        if st.button("Get Transcript"):
            if video_url:
                # Create a new event loop and run the async function
                asyncio.run(self._handle_transcript_request(video_url))
            else:
                st.warning("Please enter a YouTube URL")

    async def _handle_transcript_request(self, video_url: str):
        """Handle transcript request and display"""
        self.logger.info(f"Handling transcript request for video: {video_url}")
        with st.spinner("Fetching transcript..."):
            # Get the transcript
            transcript = await self.youtube_service.get_transcript(video_url)
            video_id = self.youtube_service.extract_video_id(video_url)

            if not transcript:
                self.logger.warning(f"No transcript found for video: {video_url}")
                st.error("Could not retrieve transcript for this video. Please try another video.")
            else:
                self.logger.info(f"Successfully retrieved transcript for video: {video_url}")
                self._display_video_content(transcript, video_id)

    def _display_video_content(self, transcript: str, video_id: str):
        """Display video content and transcript"""
        # Create expander to show video information
        with st.expander("Video Information"):
            st.write(f"Video ID: {video_id}")

        with st.spinner("Loading transcript..."):
            self._process_and_display_transcript(transcript, video_id)

    def _process_and_display_transcript(self, transcript: str, video_id: str):
        """Process and display transcript content"""
        # Save transcript if not already saved
        transcript_path = self.get_transcript_path(video_id)
        if not os.path.exists(transcript_path):
            self.transcript_downloader.save_transcript(transcript, video_id)
            st.info("Transcript saved for future use")

        # Display transcript
        st.text_area(
            "Transcript",
            transcript,
            height=300,
            key="transcript_display",
        )

    async def get_random_test(self, level):
        try:
            self.logger.info(f"Getting random test for JLPT {level}")
            # Get video URLs for the specified JLPT level
            video_urls = await self.youtube_service.search_jlpt_videos(level)

            if not video_urls:
                self.logger.warning(f"No videos found for JLPT {level}")
                return {
                    "error": f"No JLPT {level} listening tests found. Please try a different level."
                }

            # Select a random video URL
            random_url = random.choice(video_urls)
            self.logger.debug(f"Selected random video URL: {random_url}")

            # Get the transcript
            transcript = await self.youtube_service.get_transcript(random_url)

            if not transcript:
                self.logger.warning(f"No transcript found for video: {random_url}")
                return {
                    "error": "Could not retrieve transcript for this video. Please try again."
                }

            self.logger.info(
                f"Successfully retrieved transcript for video: {random_url}"
            )
            return {"transcript": transcript, "video_id": random_url}

        except Exception as e:
            self.logger.error(f"Error in get_random_test: {str(e)}", exc_info=True)
            return {"error": f"An error occurred: {str(e)}"}
