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
app = FastAPI(title="Japanese Writing Practice API")

# Add CORS middleware
app.add_middleware(
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

# Define response models
class RandomSentenceResponse(BaseModel):
    sentence: str
    english: str
    kanji: str
    romaji: str

class FeedbackResponse(BaseModel):
    transcription: str  # The OCR result of what was written
    target: str  # The target word/sentence
    grade: str  # The grade (S, A, B, C)
    feedback: str  # Detailed feedback

@app.get("/")
async def root():
    return {"message": "Japanese Writing Practice API"}

@app.get("/random-sentence", response_model=RandomSentenceResponse)
async def get_random_sentence():
    """Generate a random sentence"""
    try:
        sentence, english, kanji, romaji = japanese_app.get_random_word_and_sentence()
        
        # Clean up the returned values
        english = english.replace("English: ", "")
        kanji = kanji.replace("Kanji: ", "")
        romaji = romaji.replace("Reading: ", "")
        
        return RandomSentenceResponse(
            sentence=sentence,
            english=english,
            kanji=kanji,
            romaji=romaji
        )
    except Exception as e:
        logger.error(f"Error generating random sentence: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Error generating random sentence: {str(e)}")

@app.post("/feedback-word", response_model=FeedbackResponse)
async def get_word_feedback(submission: ImageSubmission):
    """Get feedback on a word writing submission"""
    try:
        # Decode base64 image
        image_data = base64.b64decode(submission.image)
        image = Image.open(io.BytesIO(image_data))
        
        # Process the image
        transcription, target, grade, feedback = japanese_app.process_word_image(image)
        
        return FeedbackResponse(
            transcription=transcription,
            target=target,
            grade=grade,
            feedback=feedback
        )
    except Exception as e:
        logger.error(f"Error processing word submission: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Error processing submission: {str(e)}")

@app.post("/feedback-sentence", response_model=FeedbackResponse)
async def get_sentence_feedback(submission: ImageSubmission):
    """Get feedback on a sentence writing submission"""
    try:
        # Decode base64 image
        image_data = base64.b64decode(submission.image)
        image = Image.open(io.BytesIO(image_data))
        
        # Process the image
        transcription, translation, grade, feedback = japanese_app.process_sentence_image(image)
        
        # For sentence feedback, the "target" is the translation
        return FeedbackResponse(
            transcription=transcription,
            target=japanese_app.current_sentence,  # The target sentence
            grade=grade,
            feedback=feedback
        )
    except Exception as e:
        logger.error(f"Error processing sentence submission: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Error processing submission: {str(e)}")

# For direct execution
if __name__ == "__main__":
    uvicorn.run("api:app", host="0.0.0.0", port=8001, reload=True)