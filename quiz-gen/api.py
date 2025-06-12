from fastapi import FastAPI, HTTPException, Body
from fastapi.middleware.cors import CORSMiddleware
from typing import Optional
import json
import os
import dotenv
from groq import Groq
from messages import SYSTEM_MESSAGE, USER_MESSAGE_TEMPLATE
from models import (
    Choice, 
    GrammarQuestion, 
    GrammarQuiz, 
    QuizRequest
)
from constants import (
    JSON_FILES_DIR,
    MAX_QUESTIONS_PER_REQUEST,
    API_HOST,
    API_PORT,
    API_TITLE,
    CORS_ORIGINS,
    CORS_CREDENTIALS,
    CORS_METHODS,
    CORS_HEADERS,
    API_MODEL_DEFAULT,
    API_TEMPERATURE,
    API_TOP_P,
    API_STREAM,
    API_RESPONSE_FORMAT
)

# Load environment variables and initialize Groq client
dotenv.load_dotenv()
groq = Groq(api_key=os.environ.get("GROQ_API_KEY"))

# Ensure the directory exists
os.makedirs(JSON_FILES_DIR, exist_ok=True)

# Create FastAPI application instance
api = FastAPI(title=API_TITLE)

# Add CORS middleware
api.add_middleware(
    CORSMiddleware,
    allow_origins=CORS_ORIGINS,
    allow_credentials=CORS_CREDENTIALS,
    allow_methods=CORS_METHODS,
    allow_headers=CORS_HEADERS
)


def get_grammar_questions(level: int, num_questions: int) -> GrammarQuiz:
    """
    Generate JLPT grammar questions for the specified level using Groq API.

    Args:
        level: JLPT level (1-5)
        num_questions: Number of questions to generate

    Returns:
        GrammarQuiz: A model containing grammar questions
    """
    try:
        chat_completion = groq.chat.completions.create(
            messages=[
                {
                    "role": "system",
                    "content": SYSTEM_MESSAGE
                    + f" The JSON object must use the schema: {json.dumps(GrammarQuiz.model_json_schema(), indent=2)}",
                },
                {
                    "role": "user",
                    "content": USER_MESSAGE_TEMPLATE.format(
                        level=level, num_questions=num_questions
                    ),
                },
            ],
            model=API_MODEL_DEFAULT,
            temperature=API_TEMPERATURE,
            top_p=API_TOP_P,
            stream=API_STREAM,
            response_format=API_RESPONSE_FORMAT,
        )

        return GrammarQuiz.model_validate_json(
            chat_completion.choices[0].message.content
        )

    except Exception as e:
        raise HTTPException(
            status_code=500, detail=f"Error generating grammar questions: {str(e)}"
        )


def save_quiz_to_json(grammar_quiz: GrammarQuiz, filepath: Optional[str] = None):
    """
    Save grammar questions to a JSON file.

    Args:
        grammar_quiz: GrammarQuiz object to save
        filepath: Path to save the file. If None, uses a default name
    """
    if filepath is None:
        # Create a filename based on the JLPT level
        filename = f"jlpt_n{grammar_quiz.level}_questions.json"
        filepath = os.path.join(JSON_FILES_DIR, filename)
    elif not os.path.dirname(filepath):
        # If filepath doesn't include a directory, put it in JSON_FILES_DIR
        filepath = os.path.join(JSON_FILES_DIR, filepath)

    # Convert to JSON
    quiz_json = grammar_quiz.model_dump_json(indent=2)
    with open(filepath, "w") as f:
        f.write(quiz_json)
    return filepath


@api.get("/")
async def root():
    return {"message": "Welcome to JLPT Grammar Quiz Generator API"}


@api.get("/health")
async def health_check():
    return {"status": "healthy"}


@api.post("/api/quiz-gen/quiz/generate")
async def generate_grammar_quiz(request: QuizRequest = Body(...)):
    """
    Generate JLPT grammar questions for a specified level and quantity.
    Will make multiple requests to the LLM if num_questions > MAX_QUESTIONS_PER_REQUEST.
    """
    # Get grammar questions
    grammar_quiz = get_grammar_questions(request.level, request.num_questions)

    return {
        "level": f"N{request.level}",
        "num_questions": request.num_questions,
        "quiz": grammar_quiz,
    }


def run_fastapi():
    """Function to run the FastAPI app with uvicorn"""
    import uvicorn

    uvicorn.run(api, host=API_HOST, port=API_PORT)


if __name__ == "__main__":
    run_fastapi()
