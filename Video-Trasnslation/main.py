from youtube_transcript_api import YouTubeTranscriptApi
from pydantic import BaseModel, Field
from typing import List, Generator, Iterable, AsyncGenerator
from dotenv import load_dotenv
import os
import instructor
import openai
from googletrans import Translator

load_dotenv()

openai_api_key = os.getenv("OPENAI_API_KEY")


client = instructor.from_openai(openai.OpenAI(api_key=openai_api_key))


def extract_video_id(url: str) -> str | None:
    import re

    match = re.search(r"v=([a-zA-Z0-9_-]+)", url)
    if match:
        return match.group(1)


class TranscriptSegment(BaseModel):
    source_id: int
    start: float
    text: str


def get_transcript_with_timing(
    video_id: str,
) -> Generator[TranscriptSegment, None, None]:
    """
    Fetches the transcript of a YouTube video along with the start and end times
    for each text segment, and returns them as a list of Pydantic models.
    """
    transcript = YouTubeTranscriptApi.get_transcript(video_id)
    for ii, segment in enumerate(transcript):
        yield TranscriptSegment(
            source_id=ii, start=segment["start"], text=segment["text"]
        )


class TranslatedSegment(BaseModel):
    source_id: int
    start: float
    original_text: str
    translated_text: str


async def translate_segments(
    segments: Iterable[TranscriptSegment],
) -> AsyncGenerator[TranslatedSegment, None]:
    translator = Translator()
    for segment in segments:
        translation = await translator.translate(segment.text, dest="ja")
        yield TranslatedSegment(
            source_id=segment.source_id,
            start=segment.start,
            original_text=segment.text,
            translated_text=translation.text,
        )


# Example usage
if __name__ == "__main__":
    import asyncio
    from rich.table import Table
    from rich.console import Console
    from rich.prompt import Prompt

    console = Console()
    url = Prompt.ask("Enter a YouTube URL")

    async def main():
        with console.status("[bold green]Processing YouTube URL...") as status:
            video_id = extract_video_id(url)

            if video_id is None:
                raise ValueError("Invalid YouTube video URL")

            transcript = list(get_transcript_with_timing(video_id))
            status.update("[bold green]Translating segments...")

            table = Table(title="Translated Segments", padding=(0, 1))
            table.add_column("Time", style="cyan", justify="right")
            table.add_column("Original", style="white")
            table.add_column("Japanese", style="green")

            async for translated in translate_segments(transcript):
                table.add_row(
                    f"{translated.start:.2f}s",
                    translated.original_text,
                    translated.translated_text,
                )
                # Print each translation as it comes in
                console.print(table)

    asyncio.run(main())
