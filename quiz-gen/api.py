from fastapi import FastAPI, HTTPException, Body
from fastapi.middleware.cors import CORSMiddleware
from typing import List, Optional
import json
import os
import dotenv
from pydantic import BaseModel, Field
from groq import Groq
from messages import SYSTEM_MESSAGE, USER_MESSAGE_TEMPLATE

# Load environment variables and initialize Groq client
dotenv.load_dotenv()
groq = Groq(api_key=os.environ.get("GROQ_API_KEY"))

# Define the JSON files directoryff
JSON_FILES_DIR = "json_files"

# Ensure the directory exists
os.makedirs(JSON_FILES_DIR, exist_ok=True)

# Create FastAPI application instance
api = FastAPI(title="JLPT Grammar Quiz Generator API")

# Add CORS middleware
api.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Allows all origins
    allow_credentials=True,
    allow_methods=["*"],  # Allows all methods
    allow_headers=["*"],  # Allows all headers
)

# Maximum questions per request to the LLM
MAX_QUESTIONS_PER_REQUEST = 5


class Choice(BaseModel):
    text: str
    is_correct: bool


class GrammarQuestion(BaseModel):
    grammar_point: str
    question: str
    choices: List[Choice]
    explanation: str  # Japanese explanation
    answer_reasoning: str  # Reasoning for why the answer is correct
    grammar_explanation_english: str  # English explanation of the grammar point


class GrammarQuiz(BaseModel):
    level: str
    questions: List[GrammarQuestion]


class QuizRequest(BaseModel):
    level: int = Field(
        ..., ge=1, le=5, description="JLPT level (1-5 where 5 is easiest, 1 is hardest)"
    )
    num_questions: int = Field(
        ..., ge=1, le=20, description="Number of questions to generate (1-20)"
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
            model="qwen-qwq-32b",
            temperature=0.7,
            top_p=0.9,
            stream=False,
            response_format={"type": "json_object"},
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

    uvicorn.run(api, host="0.0.0.0", port=8004)


if __name__ == "__main__":
    run_fastapi()
