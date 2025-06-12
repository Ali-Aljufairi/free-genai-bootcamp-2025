"""
This file contains the Pydantic model definitions for the JLPT Grammar Quiz Generator.
"""
from typing import List, Optional
from pydantic import BaseModel, Field
from constants import (
    JSON_FILES_DIR, 
    MAX_QUESTIONS_PER_REQUEST,
    JLPT_MIN_LEVEL,
    JLPT_MAX_LEVEL,
    MIN_QUESTIONS,
    MAX_QUESTIONS
)


class Choice(BaseModel):
    """Model representing a single answer choice in a grammar question."""
    text: str
    is_correct: bool


class GrammarQuestion(BaseModel):
    """Model representing a single grammar question."""
    grammar_point: str
    question: str
    choices: List[Choice]
    explanation: str  # Japanese explanation
    answer_reasoning: str  # Reasoning for why the answer is correct
    grammar_explanation_english: str  # English explanation of the grammar point


class GrammarQuiz(BaseModel):
    """Model representing a complete grammar quiz."""
    level: str
    questions: List[GrammarQuestion]


class QuizRequest(BaseModel):
    """Model representing a request to generate a grammar quiz."""
    level: int = Field(
        ..., ge=JLPT_MIN_LEVEL, le=JLPT_MAX_LEVEL, 
        description=f"JLPT level ({JLPT_MIN_LEVEL}-{JLPT_MAX_LEVEL} where {JLPT_MAX_LEVEL} is easiest, {JLPT_MIN_LEVEL} is hardest)"
    )
    num_questions: int = Field(
        ..., ge=MIN_QUESTIONS, le=MAX_QUESTIONS, 
        description=f"Number of questions to generate ({MIN_QUESTIONS}-{MAX_QUESTIONS})"
    )
