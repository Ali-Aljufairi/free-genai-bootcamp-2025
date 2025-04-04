from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import base64
from PIL import Image
import io
import logging
from core import JapaneseApp
from models import WordFeedback, SentenceFeedback
import uvicorn

# Setup logging
logger = logging.getLogger("fastapi_app")
logger.setLevel(logging.DEBUG)
fh = logging.FileHandler("app.log")
fh.setFormatter(logging.Formatter("%(asctime)s - %(levelname)s - %(message)s"))
logger.addHandler(fh)

# Create FastAPI app
api = FastAPI(title="Japanese Writing Practice API")

# Add CORS middleware
api.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # For development; restrict in production
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Initialize Japanese app
japanese_app = JapaneseApp()


# Define request models
class ImageSubmission(BaseModel):
    image: str  # Base64 encoded image
    target_word: str = None  # Optional target word for word feedback
    target_sentence: str = None  # Optional target sentence for sentence feedback


# Define response models
class RandomSentenceResponse(BaseModel):
    sentence: str
    english: str
    romaji: str
    word: str  # The word used to generate the sentence


class FeedbackResponse(BaseModel):
    transcription: str  # The OCR result of what was written
    target: str  # The target word/sentence
    grade: str  # The grade (S, A, B, C)
    feedback: str  # Detailed feedback


@api.get("/")
async def root():
    return {"message": "Japanese Writing Practice API"}


@api.get("/api/v1/random-sentence", response_model=RandomSentenceResponse)
async def get_random_sentence():
    """Generate a random sentence"""
    try:
        sentence, english, kanji, romaji = japanese_app.get_random_word_and_sentence()

        # Clean up the returned values
        english = english.replace("English: ", "")
        romaji = romaji.replace("Reading: ", "")

        # Get the word that was used to generate the sentence
        source_word = (
            japanese_app.current_word.get("japanese", "")
            if japanese_app.current_word
            else ""
        )

        return RandomSentenceResponse(
            sentence=sentence, english=english, romaji=romaji, word=source_word
        )
    except Exception as e:
        logger.error(f"Error generating random sentence: {str(e)}")
        raise HTTPException(
            status_code=500, detail=f"Error generating random sentence: {str(e)}"
        )


@api.post("/api/v1/feedback-word", response_model=FeedbackResponse)
async def get_word_feedback(submission: ImageSubmission):
    """Get feedback on a word writing submission"""
    try:
        # Decode base64 image
        image_data = base64.b64decode(submission.image)
        image = Image.open(io.BytesIO(image_data))

        # Process the image with the target word if provided
        transcription, target, grade, feedback = japanese_app.process_word_image(
            image, submission.target_word
        )

        return FeedbackResponse(
            transcription=transcription, target=target, grade=grade, feedback=feedback
        )
    except Exception as e:
        logger.error(f"Error processing word submission: {str(e)}")
        raise HTTPException(
            status_code=500, detail=f"Error processing submission: {str(e)}"
        )


@api.post("/api/v1/feedback-sentence", response_model=FeedbackResponse)
async def get_sentence_feedback(submission: ImageSubmission):
    """Get feedback on a sentence writing submission"""
    try:
        # Decode base64 image
        image_data = base64.b64decode(submission.image)
        image = Image.open(io.BytesIO(image_data))

        # Process the image with the target sentence if providd
        result = japanese_app.process_sentence_image(image, submission.target_sentence)

        # Check if we're receiving the newer 5-tuple result or the older 4-tuple result
        if len(result) == 5:
            transcription, translation, grade, feedback, target = result
        else:
            transcription, translation, grade, feedback = result
            target = (
                submission.target_sentence or japanese_app.current_sentence
            )  # Use provided target if available

        # For sentence feedback, return the response with the target sentence
        return FeedbackResponse(
            transcription=transcription,
            target=target,  # The target sentence
            grade=grade,
            feedback=feedback,
        )
    except Exception as e:
        logger.error(f"Error processing sentence submission: {str(e)}")
        raise HTTPException(
            status_code=500, detail=f"Error processing submission: {str(e)}"
        )


# For direct execution
if __name__ == "__main__":
    uvicorn.run("api:app", host="0.0.0.0", port=8001, reload=True)
