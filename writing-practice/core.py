import logging
from groq import Groq
import os
from dotenv import load_dotenv
import requests
from manga_ocr import MangaOcr
from PIL import Image
import numpy as np
import warnings
import json
from messages import (
    SENTENCE_SYSTEM_MESSAGE,
    SENTENCE_USER_TEMPLATE,
    TRANSLATION_SYSTEM_MESSAGE,
    TRANSLATION_USER_TEMPLATE,
    GRADING_SYSTEM_MESSAGE,
    GRADING_USER_TEMPLATE,
)
from models import Sentence, WordFeedback, SentenceFeedback

# Load environment variables
load_dotenv()

# Setup logging
logger = logging.getLogger("japanese_app")
logger.setLevel(logging.DEBUG)
fh = logging.FileHandler("app.log")
fh.setFormatter(logging.Formatter("%(asctime)s - %(levelname)s - %(message)s"))
logger.addHandler(fh)


class JapaneseApp:
    def __init__(self):
        # Load environment variables with defaults
        self.client = Groq(api_key=os.environ.get("GROQ_API_KEY"))
        self.api_base_url = os.environ.get("API_BASE_URL", "http://localhost:8080")
        self.api_v1_path = os.environ.get("API_V1_PATH", "/api/v1")
        self.words_random_endpoint = os.environ.get(
            "WORDS_RANDOM_ENDPOINT", "/words/random"
        )
        self.llm_model = os.environ.get("LLM_MODEL", "llama-3.1-8b-instant")
        self.llm_temperature = float(os.environ.get("LLM_TEMPERATURE", "0.3"))
        self.llm_max_tokens = int(os.environ.get("LLM_MAX_TOKENS", "100"))
        self.current_word = None
        self.current_sentence = None
        self.mocr = None
        try:
            with warnings.catch_warnings():
                warnings.simplefilter("ignore")
                self.mocr = MangaOcr()
                logger.info("MangaOCR initialized successfully")
        except Exception as e:
            logger.error(f"Failed to initialize MangaOCR: {str(e)}")
            self.mocr = None

    def get_random_word(self):
        """Get a random word from API"""
        try:
            url = f"{self.api_base_url}{self.api_v1_path}{self.words_random_endpoint}"
            response = requests.get(url)
            if response.status_code == 200:
                self.current_word = response.json()
                return (
                    self.current_word.get("japanese", ""),
                    self.current_word.get("english", ""),
                    self.current_word.get("romaji", ""),
                    "Write this word in Japanese characters",
                )
            logger.error(f"Error fetching random word: {response.status_code}")
            return "", "", "", "Error fetching word. Please try again."
        except Exception as e:
            logger.error(f"Error in get_random_word: {str(e)}")
            return "", "", "", f"An error occurred: {str(e)}"

    def generate_sentence(self, word):
        """Generate a sentence using Groq API with JSON mode"""
        logger.debug(f"Generating sentence for word: {word.get('japanese', '')}")
        try:
            # Prepare the Sentence model schema
            sentence_schema = json.dumps(Sentence.model_json_schema(), indent=2)

            # Updated system message with more explicit instructions
            system_message = (
                SENTENCE_SYSTEM_MESSAGE
                + f"""
The JSON object must exactly follow this schema: {sentence_schema}

Here's a specific example of the expected format:
{{
  "sentence": "彼女は学生です。", 
  "english": "She is a student.",
  "kanji": "学生",  
  "romaji": "kanojo wa gakusei desu."
}}

Make sure all fields are filled with appropriate values. If there are no kanji characters, still include the field with an empty string.
"""
            )

            # Using JSON mode with the Groq API
            response = self.client.chat.completions.create(
                model=self.llm_model,
                messages=[
                    {"role": "system", "content": system_message},
                    {
                        "role": "user",
                        "content": SENTENCE_USER_TEMPLATE.format(
                            word=word.get("japanese", "")
                        ),
                    },
                ],
                temperature=self.llm_temperature,
                response_format={"type": "json_object"},
            )

            # Parse the JSON response
            content = response.choices[0].message.content.strip()
            logger.debug(f"Raw Groq response: {content}")

            # Parse to Pydantic model to validate structure
            sentence_data = Sentence.model_validate_json(content)
            logger.info(f"Generated sentence: {sentence_data.sentence}")

            # Store the full sentence data
            self.current_sentence_data = sentence_data

            return sentence_data.sentence
        except Exception as e:
            logger.error(f"Error generating sentence: {str(e)}")

            # Attempt to create a fallback sentence if the JSON generation fails
            try:
                # Fallback to regular text generation without JSON mode
                fallback_response = self.client.chat.completions.create(
                    model=self.llm_model,
                    messages=[
                        {
                            "role": "system",
                            "content": "You are a Japanese language teacher. Generate a simple Japanese sentence using the provided word.",
                        },
                        {
                            "role": "user",
                            "content": f"Create a very simple sentence using the Japanese word '{word.get('japanese', '')}'. Return only the sentence in Japanese without any explanation.",
                        },
                    ],
                    temperature=self.llm_temperature,
                    max_tokens=50,
                )

                fallback_sentence = fallback_response.choices[0].message.content.strip()
                logger.info(f"Generated fallback sentence: {fallback_sentence}")

                # Create a basic sentence object with the fallback
                self.current_sentence_data = Sentence(
                    sentence=fallback_sentence,
                    english=f"Sentence with {word.get('english', '')}",
                    kanji=word.get("japanese", ""),
                    romaji=word.get("romaji", ""),
                )

                return fallback_sentence
            except Exception as fallback_error:
                logger.error(
                    f"Error generating fallback sentence: {str(fallback_error)}"
                )
                return "Error generating sentence. Please try again."

    def get_random_word_and_sentence(self):
        """Get a random word and generate a sentence"""
        logger.debug("Getting random word and generating sentence")
        kanji, english, reading, _ = self.get_random_word()
        if not kanji:
            return "No word available", "", "", "Please try again."

        # Generate sentence using JSON mode
        self.current_sentence = self.generate_sentence(self.current_word)

        # Return data from the stored sentence data
        if hasattr(self, "current_sentence_data"):
            return (
                self.current_sentence_data.sentence,
                f"English: {self.current_sentence_data.english}",
                f"Kanji: {self.current_sentence_data.kanji}",
                f"Reading: {self.current_sentence_data.romaji}",
            )
        else:
            # Fallback to the old format if JSON parsing failed
            return (
                self.current_sentence,
                f"English: {english}",
                f"Kanji: {kanji}",
                f"Reading: {reading}",
            )

    def grade_word_submission(self, image):
        """Process word submission and grade it using MangaOCR"""
        try:
            if self.mocr is None:
                logger.info("Reinitializing MangaOCR")
                with warnings.catch_warnings():
                    warnings.simplefilter("ignore")
                    self.mocr = MangaOcr()

            logger.info(f"Processing image type: {type(image)}")
            logger.info(
                f"Image size: {image.size if hasattr(image, 'size') else 'unknown'}"
            )

            transcription = self.mocr(image)
            logger.info(f"OCR Transcription result: {transcription}")
            logger.info(f"Current word data: {self.current_word}")

            # Compare with current word
            grade = "C"
            feedback = ""

            if transcription == self.current_word.get("japanese"):
                grade = "S"
                feedback = "Perfect match! Excellent writing."
            elif transcription in [
                self.current_word.get("japanese"),
                self.current_word.get("romaji"),
            ]:
                grade = "A"
                feedback = "Very good! The characters are clear and correct."
            else:
                # Use Groq for detailed feedback
                response = self.client.chat.completions.create(
                    model=self.llm_model,
                    messages=[
                        {
                            "role": "system",
                            "content": GRADING_SYSTEM_MESSAGE,
                        },
                        {
                            "role": "user",
                            "content": f"Target word: {self.current_word.get('japanese')}\nSubmission: {transcription}\nProvide brief feedback on accuracy and writing quality.",
                        },
                    ],
                    temperature=self.llm_temperature,
                    max_tokens=self.llm_max_tokens,
                )
                feedback = response.choices[0].message.content.strip()
                grade = "B" if "good" in feedback.lower() else "C"

            return transcription, self.current_word.get("japanese", ""), grade, feedback

        except Exception as e:
            logger.error(f"Error in grade_submission: {str(e)}", exc_info=True)
            return (
                f"Error processing submission: {str(e)}",
                self.current_word.get("japanese", "Error getting target word"),
                "C",
                f"An error occurred during OCR processing: {str(e)}",
            )

    def grade_sentence_submission(self, image):
        """Process sentence submission and grade it using MangaOCR and Groq"""
        try:
            if self.mocr is None:
                logger.info("Initializing MangaOCR")
                self.mocr = MangaOcr()

            # Transcribe the image
            logger.info("Transcribing image with MangaOCR")
            transcription = self.mocr(image)
            logger.debug(f"Transcription result: {transcription}")

            # Get literal translation
            logger.info("Getting literal translation")
            translation_response = self.client.chat.completions.create(
                model=self.llm_model,
                messages=[
                    {"role": "system", "content": TRANSLATION_SYSTEM_MESSAGE},
                    {
                        "role": "user",
                        "content": TRANSLATION_USER_TEMPLATE.format(text=transcription),
                    },
                ],
                temperature=self.llm_temperature,
            )
            translation = translation_response.choices[0].message.content.strip()
            logger.debug(f"Translation: {translation}")

            # Get grading and feedback
            logger.info("Getting grade and feedback")
            grading_response = self.client.chat.completions.create(
                model=self.llm_model,
                messages=[
                    {"role": "system", "content": GRADING_SYSTEM_MESSAGE},
                    {
                        "role": "user",
                        "content": GRADING_USER_TEMPLATE.format(
                            target_sentence=self.current_sentence,
                            submission=transcription,
                            translation=translation,
                        ),
                    },
                ],
                temperature=self.llm_temperature,
            )

            feedback = grading_response.choices[0].message.content.strip()
            # Parse grade and feedback from response
            grade = "C"  # Default grade
            if "Grade: S" in feedback:
                grade = "S"
            elif "Grade: A" in feedback:
                grade = "A"
            elif "Grade: B" in feedback:
                grade = "B"

            # Extract just the feedback part
            feedback = feedback.split("Feedback:")[-1].strip()

            logger.info(f"Grading complete: {grade}")
            logger.debug(f"Feedback: {feedback}")

            return transcription, translation, grade, feedback

        except Exception as e:
            logger.error(f"Error in grade_submission: {str(e)}")
            return (
                "Error processing submission",
                "Error processing submission",
                "C",
                f"An error occurred: {str(e)}",
            )

    def process_word_image(self, image: Image.Image):
        """Process the provided image (PIL Image) and perform OCR and grading for word submission"""
        try:
            logger.info("Processing word image")
            # Enhance contrast for better OCR while preserving color
            threshold = 200
            processed_image = image.point(lambda p: p < threshold and 255)
            logger.info(f"Image processed with threshold {threshold}")

            return self.grade_word_submission(processed_image)
        except Exception as e:
            logger.error(f"Error in process_word_image: {str(e)}", exc_info=True)
            raise

    def process_sentence_image(self, image: Image.Image):
        """Process the provided image (PIL Image) and perform OCR and grading for sentence submission"""
        # Enhance contrast for better OCR while preserving color
        # Convert red strokes to black for OCR while keeping original color for display
        threshold = 200  # Adjust this value if needed
        image = image.point(lambda p: p < threshold and 255)

        return self.grade_sentence_submission(image)

    def grade_word_canvas_submission(self, canvas_image: any):
        """Process the canvas drawing (numpy array) for word practice"""
        try:
            if canvas_image is None:
                raise ValueError("No canvas data provided")

            # Ensure we have valid image data
            if not isinstance(canvas_image, np.ndarray):
                raise ValueError("Invalid canvas data type")

            # Convert numpy array to PIL Image
            image = Image.fromarray(canvas_image.astype("uint8"))
            return self.process_word_image(image)
        except Exception as e:
            logger.error(f"Error processing canvas submission: {str(e)}")
            raise ValueError(f"Invalid canvas image data: {e}")

    def grade_sentence_canvas_submission(self, canvas_image: any):
        """Process the canvas drawing (numpy array) for sentence practice"""
        try:
            if canvas_image is None:
                raise ValueError("No canvas data provided")

            # Ensure we have valid image data
            if not isinstance(canvas_image, np.ndarray):
                raise ValueError("Invalid canvas data type")

            # Convert numpy array to PIL Image
            image = Image.fromarray(canvas_image.astype("uint8"))
            return self.process_sentence_image(image)
        except Exception as e:
            logger.error(f"Error processing canvas submission: {str(e)}")
            raise ValueError(f"Invalid canvas image data: {e}")
