import logging
from groq import Groq
import os
import random
import requests
from manga_ocr import MangaOcr
from utils import load_prompts
from PIL import Image
import numpy as np

# Setup logging
logger = logging.getLogger("japanese_app")
logger.setLevel(logging.DEBUG)
fh = logging.FileHandler("app.log")
fh.setFormatter(logging.Formatter("%(asctime)s - %(levelname)s - %(message)s"))
logger.addHandler(fh)


class JapaneseApp:
    def __init__(self):
        self.client = Groq(api_key=os.getenv("GROQ_API_KEY"))
        self.api_base_url = f"{os.getenv('API_PROTOCOL', 'http')}://{os.getenv('API_HOST', 'localhost')}:{os.getenv('API_PORT', '5000')}"
        self.vocabulary = None
        self.current_word = None
        self.current_sentence = None
        self.mocr = None
        self.load_vocabulary()

    def create_study_session(self, activity_id):
        """Create a new study session"""
        try:
            group_id = os.getenv("GROUP_ID", "1")
            url = f"{self.api_base_url}/api/study-sessions"
            data = {"group_id": int(group_id), "study_activity_id": activity_id}

            response = requests.post(url, json=data)
            if response.status_code == 201:
                session_data = response.json()
                return session_data.get("id")
            return None

        except Exception as e:
            logger.error(f"Error creating study session: {str(e)}")
            return None

    def load_vocabulary(self):
        """Fetch vocabulary from API using group_id"""
        try:
            group_id = os.getenv("GROUP_ID", "1")
            url = f"{self.api_base_url}/groups/{group_id}/words/raw"
            response = requests.get(url)
            if response.status_code == 200:
                words_data = response.json()
                self.vocabulary = {"words": words_data}
                logger.info(f"Loaded {len(self.vocabulary.get('words', []))} words")
            else:
                self.vocabulary = {"words": []}
        except Exception as e:
            logger.error(f"Error loading vocabulary: {str(e)}")
            self.vocabulary = {"words": []}

    def get_random_word(self):
        """Get a random word from vocabulary"""
        if not self.vocabulary or not self.vocabulary.get("words"):
            return "", "", "", "Please make sure vocabulary is loaded properly."

        self.current_word = random.choice(self.vocabulary["words"])

        return (
            self.current_word.get("kanji", ""),
            self.current_word.get("english", ""),
            self.current_word.get("reading", ""),
            "Write this word in Japanese characters",
        )

    def generate_sentence(self, word):
        """Generate a sentence using Groq API"""
        logger.debug(f"Generating sentence for word: {word.get('kanji', '')}")

        try:
            prompts = load_prompts()
            response = self.client.chat.completions.create(
                model="mixtral-8x7b-32768",
                messages=[
                    {
                        "role": "system",
                        "content": prompts["sentence_generation"]["system"],
                    },
                    {
                        "role": "user",
                        "content": prompts["sentence_generation"]["user"].format(
                            word=word.get("kanji", "")
                        ),
                    },
                ],
                temperature=0.7,
                max_tokens=100,
            )
            # Extract just the sentence part, removing any explanatory text
            content = response.choices[0].message.content.strip()
            # Remove any explanatory text before the actual sentence
            if ":" in content:
                sentence = content.split(":")[-1].strip()
            else:
                sentence = content
            logger.info(f"Generated sentence: {sentence}")
            return sentence
        except Exception as e:
            logger.error(f"Error generating sentence: {str(e)}")
            return "Error generating sentence. Please try again."

    def get_random_word_and_sentence(self):
        """Get a random word and generate a sentence"""
        logger.debug("Getting random word and generating sentence")

        if not self.vocabulary or not self.vocabulary.get("words"):
            return (
                "No vocabulary loaded",
                "",
                "",
                "Please make sure vocabulary is loaded properly.",
            )

        self.current_word = random.choice(self.vocabulary["words"])
        self.current_sentence = self.generate_sentence(self.current_word)

        return (
            self.current_sentence,
            f"English: {self.current_word.get('english', '')}",
            f"Kanji: {self.current_word.get('kanji', '')}",
            f"Reading: {self.current_word.get('reading', '')}",
        )

    def grade_word_submission(self, image):
        """Process word submission and grade it using MangaOCR"""
        try:
            if self.mocr is None:
                self.mocr = MangaOcr()

            transcription = self.mocr(image)

            # Compare with current word
            grade = "C"
            feedback = ""

            if transcription == self.current_word.get("kanji"):
                grade = "S"
                feedback = "Perfect match! Excellent writing."
            elif transcription in [
                self.current_word.get("kanji"),
                self.current_word.get("reading"),
            ]:
                grade = "A"
                feedback = "Very good! The characters are clear and correct."
            else:
                # Use Groq for detailed feedback
                response = self.client.chat.completions.create(
                    model="mixtral-8x7b-32768",
                    messages=[
                        {
                            "role": "system",
                            "content": "You are a Japanese writing evaluator. Compare the submission with the target and provide constructive feedback.",
                        },
                        {
                            "role": "user",
                            "content": f"Target word: {self.current_word.get('kanji')}\nSubmission: {transcription}\nProvide brief feedback on accuracy and writing quality.",
                        },
                    ],
                    temperature=0.3,
                    max_tokens=100,
                )
                feedback = response.choices[0].message.content.strip()
                grade = "B" if "good" in feedback.lower() else "C"

            return transcription, self.current_word.get("kanji", ""), grade, feedback

        except Exception as e:
            logger.error(f"Error in grade_submission: {str(e)}")
            return (
                "Error processing submission",
                "",
                "C",
                f"An error occurred: {str(e)}",
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
                model="mixtral-8x7b-32768",
                messages=[
                    {"role": "system", "content": prompts["translation"]["system"]},
                    {
                        "role": "user",
                        "content": prompts["translation"]["user"].format(
                            text=transcription
                        ),
                    },
                ],
                temperature=0.3,
            )
            translation = translation_response.choices[0].message.content.strip()
            logger.debug(f"Translation: {translation}")

            # Get grading and feedback
            logger.info("Getting grade and feedback")
            grading_response = self.client.chat.completions.create(
                model="mixtral-8x7b-32768",
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
                temperature=0.3,
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
        # Convert to grayscale and enhance contrast for better OCR
        image = image.convert("L")

        # Threshold to make red strokes black (better for OCR)
        threshold = 200  # Adjust this value if needed
        image = image.point(lambda p: p < threshold and 255)

        return self.grade_word_submission(image)

    def process_sentence_image(self, image: Image.Image):
        """Process the provided image (PIL Image) and perform OCR and grading for sentence submission"""
        # Convert to grayscale and enhance contrast for better OCR
        image = image.convert("L")

        # Threshold to make red strokes black (better for OCR)
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
