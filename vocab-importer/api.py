from fastapi import FastAPI, HTTPException, Body
from fastapi.middleware.cors import CORSMiddleware
from typing import List, Optional
import json
import os
import dotenv
from pydantic import BaseModel
from groq import Groq
from messages import SYSTEM_MESSAGE, USER_MESSAGE_TEMPLATE

# Load environment variables and initialize Groq client
dotenv.load_dotenv()
groq = Groq(api_key=os.environ.get("GROQ_API_KEY"))

# Define the JSON files directory
JSON_FILES_DIR = "json_files"

# Ensure the directory exists
os.makedirs(JSON_FILES_DIR, exist_ok=True)

# Create FastAPI application instance
api = FastAPI(title="Vocab Importer API")

# Add CORS middleware
api.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Allows all origins
    allow_credentials=True,
    allow_methods=["*"],  # Allows all methods
    allow_headers=["*"],  # Allows all headers
)


class Type(BaseModel):
    formailty: str
    type: str


class Word(BaseModel):
    Japanese: str
    romaji: str
    English: str
    parts: Type


class JapaneseWords(BaseModel):
    words: List[Word]


class TopicRequest(BaseModel):
    topic: str


def get_japanese(topic: str) -> JapaneseWords:
    """
    Fetch Japanese words related to the given topic using Groq API.
    Args:
        topic: The topic to fetch Japanese words for
    Returns:
        JapaneseWords: A model containing Japanese words
    """
    try:
        chat_completion = groq.chat.completions.create(
            messages=[
                {
                    "role": "system",
                    "content": SYSTEM_MESSAGE
                    +
                    # Pass the json schema to the model. Pretty printing improves results.
                    f" The JSON object must use the schema: {json.dumps(JapaneseWords.model_json_schema(), indent=2)}",
                },
                {
                    "role": "user",
                    "content": USER_MESSAGE_TEMPLATE.format(topic=topic),
                },
            ],
            model="qwen-2.5-32b",
            temperature=0,
            # Streaming is not supported in JSON mode
            stream=False,
            # Enable JSON mode by setting the response format
            response_format={"type": "json_object"},
        )
        return JapaneseWords.model_validate_json(
            chat_completion.choices[0].message.content
        )
    except Exception as e:
        raise HTTPException(
            status_code=500, detail=f"Error generating vocabulary: {str(e)}"
        )


def save_vocabulary_to_json(
    japanesewords: JapaneseWords, filepath: Optional[str] = None
):
    """
    Save Japanese words to a JSON file.
    Args:
        japanesewords: JapaneseWords object to save
        filepath: Path to save the file. If None, uses the first Japanese word.json
    """
    if filepath is None:
        # Create a filename based on the topic
        filename = japanesewords.words[0].Japanese.lower().replace(" ", "_") + ".json"
        filepath = os.path.join(JSON_FILES_DIR, filename)
    elif not os.path.dirname(filepath):
        # If filepath doesn't include a directory, put it in JSON_FILES_DIR
        filepath = os.path.join(JSON_FILES_DIR, filepath)

    # Convert to JSON
    words_json = japanesewords.model_dump_json(indent=2)
    with open(filepath, "w") as f:
        f.write(words_json)
    return filepath


@api.get("/")
async def root():
    return {"message": "Welcome to Vocab Importer API"}


@api.get("/health")
async def health_check():
    return {"status": "healthy"}


@api.post("/api/v1/vocabulary")
async def get_vocabulary(request: TopicRequest = Body(...)):
    """
    Generate Japanese vocabulary for a given topic
    """
    if not request.topic:
        raise HTTPException(status_code=400, detail="Topic cannot be empty")

    # Get Japanese vocabulary
    japanesewords = get_japanese(request.topic)

    # Save to JSON file
    filepath = save_vocabulary_to_json(japanesewords)

    # Return the vocabulary
    return {"topic": request.topic, "vocabulary": japanesewords}


def run_fastapi():
    """Function to run the FastAPI app with uvicorn"""
    import uvicorn

    uvicorn.run(api, host="0.0.0.0", port=8000)


if __name__ == "__main__":
    run_fastapi()
