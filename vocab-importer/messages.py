"""
This file contains the messages used for the Groq API calls.
"""

SYSTEM_MESSAGE = """You are a word database that outputs Japanese words in JSON and write Japense Kanji and what type of word is this.
The JSON object must use the schema provided."""

USER_MESSAGE_TEMPLATE = "Fetch Japanese words for {topic}"
