import logging
from groq import Groq
import os
from dotenv import load_dotenv
import requests
from manga_ocr import MangaOcr
from utils import load_prompts
from PIL import Image
import numpy as np
import warnings

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
        """Generate a sentence using Groq API"""
        logger.debug(f"Generating sentence for word: {word.get('japanese', '')}")
        try:
            prompts = load_prompts()
            response = self.client.chat.completions.create(
                model=self.llm_model,
                messages=[
                    {
                        "role": "system",
                        "content": prompts["sentence_generation"]["system"],
                    },
                    {
                        "role": "user",
                        "content": prompts["sentence_generation"]["user"].format(
                            word=word.get("japanese", "")
                        ),
                    },
                ],
                temperature=self.llm_temperature,
                max_tokens=self.llm_max_tokens,
            )
            content = response.choices[0].message.content.strip()
            sentence = content.split(":")[-1].strip() if ":" in content else content
            logger.info(f"Generated sentence: {sentence}")
            return sentence
        except Exception as e:
            logger.error(f"Error generating sentence: {str(e)}")
            return "Error generating sentence. Please try again."

    def get_random_word_and_sentence(self):
        """Get a random word and generate a sentence"""
        logger.debug("Getting random word and generating sentence")
        kanji, english, reading, _ = self.get_random_word()
        if not kanji:
            return "No word available", "", "", "Please try again."

        self.current_sentence = self.generate_sentence(self.current_word)
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
            logger.info(f"Image size: {image.size if hasattr(image, 'size') else 'unknown'}")
            
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
                            "content": "You are a Japanese writing evaluator. Compare the submission with the target and provide constructive feedback.",
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

            # Load prompts
            prompts = load_prompts()

            # Get literal translation
            logger.info("Getting literal translation")
            translation_response = self.client.chat.completions.create(
                model=self.llm_model,
                messages=[
                    {"role": "system", "content": prompts["translation"]["system"]},
                    {
                        "role": "user",
                        "content": prompts["translation"]["user"].format(
                            text=transcription
                        ),
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
                    {"role": "system", "content": prompts["grading"]["system"]},
                    {
                        "role": "user",
                        "content": prompts["grading"]["user"].format(
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
