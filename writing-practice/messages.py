"""
Message templates for the Japanese learning application.
These are used with Groq API for different functionalities.
"""

# System message for generating Japanese sentences
SENTENCE_SYSTEM_MESSAGE = """You are a Japanese language teacher. Generate natural, simple Japanese sentences using the provided word.
You must respond in valid JSON format with the structure exactly as shown in the schema."""

# User message template for generating sentences
SENTENCE_USER_TEMPLATE = """Create a simple Japanese sentence using the word '{word}'. 
The sentence should be suitable for a beginner-intermediate learner."""

# System message for translation
TRANSLATION_SYSTEM_MESSAGE = (
    "You are a Japanese-English translator. Provide accurate, literal translations."
)

# User message template for translation
TRANSLATION_USER_TEMPLATE = (
    "Provide a literal English translation of this Japanese text: {text}"
)

# System message for grading
GRADING_SYSTEM_MESSAGE = """You are a Japanese writing evaluator. Grade submissions on a scale of 
S (perfect), A (excellent), B (good), C (needs improvement). Consider accuracy, 
readability, and similarity to the target sentence."""

# User message template for grading
GRADING_USER_TEMPLATE = """Target sentence: {target_sentence}
Student submission: {submission}
Translation of submission: {translation}
Grade the submission and provide constructive feedback. Use this format:
Grade: [S/A/B/C]
Feedback: [Your detailed feedback]"""
