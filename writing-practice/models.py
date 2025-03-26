"""
Pydantic models for structured data in the Japanese learning application.
"""

from pydantic import BaseModel
from typing import Optional


class Sentence(BaseModel):
    """
    Model for generated Japanese sentences
    """

    sentence: str
    english: str
    kanji: Optional[str] = ""  # Make kanji optional with default empty string
    romaji: str


class WordFeedback(BaseModel):
    """
    Model for word writing feedback
    """

    transcription: str
    target: str
    grade: str
    feedback: str


class SentenceFeedback(BaseModel):
    """
    Model for sentence writing feedback
    """

    transcription: str
    translation: str
    grade: str
    feedback: str
