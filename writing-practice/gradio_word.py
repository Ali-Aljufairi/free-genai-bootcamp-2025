import gradio as gr
import requests
import json
import random
import logging
from groq import Groq
import os
import dotenv
import yaml

dotenv.load_dotenv()

def load_prompts():
    """Load prompts from YAML file"""
    with open('prompts.yaml', 'r', encoding='utf-8') as f:
        return yaml.safe_load(f)

# Setup logging
logger = logging.getLogger('japanese_app')
logger.setLevel(logging.DEBUG)
fh = logging.FileHandler('gradio_app.log')
fh.setLevel(logging.DEBUG)
formatter = logging.Formatter('%(asctime)s - %(levelname)s - %(message)s')
fh.setFormatter(formatter)
logger.addHandler(fh)

class JapaneseWritingApp:
    def __init__(self):
        self.client = Groq(
            api_key=os.getenv('GROQ_API_KEY')
        )
        self.vocabulary = None
        self.current_word = None
        self.current_sentence = None
        self.mocr = None
        # Initialize study session
        self.study_session_id = self.create_study_session()
        logger.debug(f"Using session_id: {self.study_session_id}")
        self.load_vocabulary()

    def create_study_session(self):
        """Create a new study session"""
        try:
            group_id = os.getenv('GROUP_ID', '1')
            url = f"http://localhost:5000/api/study-sessions"
            data = {
                'group_id': int(group_id),  # Ensure integer
                'study_activity_id': 2  # Match the backend field name
            }
            
            logger.debug(f"Creating study session with data: {data}")
            response = requests.post(url, json=data)
            logger.debug(f"Create session response: {response.status_code}, {response.text}")
            
            if response.status_code == 201:
                session_data = response.json()
                logger.info(f"Created study session: {session_data}")
                return session_data.get('id')
            else:
                logger.error(f"Failed to create study session. Status: {response.status_code}, Response: {response.text}")
                return None
                
        except Exception as e:
            logger.error(f"Error creating study session: {str(e)}")
            return None

    def submit_result(self, is_correct):
        """Submit the grading result to the backend"""
        try:
            logger.debug(f"Attempting to submit result. Session ID: {self.study_session_id}, Word: {self.current_word}")
            
            if not self.study_session_id or not self.current_word:
                logger.error("Missing study session ID or current word")
                return

            url = f"http://localhost:5000/api/study-sessions/{self.study_session_id}/review"
            data = {
                'word_id': self.current_word.get('id'),
                'correct': is_correct
            }
            
            logger.debug(f"Submitting to URL: {url} with data: {data}")
            
            response = requests.post(url, json=data)
            logger.debug(f"Response status: {response.status_code}, content: {response.text}")
            
            if response.status_code in [201]: 
                logger.info(f"Successfully submitted result for word {self.current_word.get('id')}")
            else:
                logger.error(f"Failed to submit result. Status code: {response.status_code}")
        except Exception as e:
            logger.error(f"Error submitting result: {str(e)}")

    def load_vocabulary(self):
        """Fetch vocabulary from API using group_id"""
        try:
            # Get group_id from environment variable or use default
            group_id = os.getenv('GROUP_ID', '1')
            url = f"http://localhost:5000/groups/{group_id}/words/raw"  # Updated to match backend route
            logger.debug(f"Fetching vocabulary from: {url}")
            
            response = requests.get(url)
            if response.status_code == 200:
                # The backend returns an array of words directly
                words_data = response.json()
                self.vocabulary = {"words": words_data}  # Wrap in words object to match expected format
                logger.info(f"Loaded {len(self.vocabulary.get('words', []))} words")
            else:
                logger.error(f"Failed to load vocabulary. Status code: {response.status_code}")
                self.vocabulary = {"words": []}
        except Exception as e:
            logger.error(f"Error loading vocabulary: {str(e)}")
            self.vocabulary = {"words": []}

    def get_random_word(self):
        """Get a random word from vocabulary"""
        logger.debug("Getting random word")
        
        if not self.vocabulary:
            logger.error("No vocabulary loaded")
            return "Error: No vocabulary loaded", "", "", "Please check your connection to the vocabulary service."
        
        if not self.vocabulary.get('words'):
            logger.error(f"No words found in vocabulary: {self.vocabulary}")
            return "Error: No words found", "", "", "Please check the vocabulary data format."
        
        logger.debug(f"Selecting from {len(self.vocabulary['words'])} words")
        self.current_word = random.choice(self.vocabulary['words'])
        logger.debug(f"Selected word: {self.current_word}")
        
        kanji = self.current_word.get('kanji', '')
        reading = self.current_word.get('reading', '')
        english = self.current_word.get('english', '')
        
        logger.info(f"Returning word - Kanji: {kanji}, Reading: {reading}, English: {english}")
        
        # Return just the values without the labels since the UI adds them
        return (
            kanji,
            reading,
            english,
            "Practice writing this word!"
        )

    def grade_submission(self, image):
        """Process image submission and grade it using MangaOCR and Groq"""
        try:
            # Initialize MangaOCR for transcription if not already initialized
            if self.mocr is None:
                logger.info("Initializing MangaOCR")
                from manga_ocr import MangaOcr
                self.mocr = MangaOcr()
            
            # Save the sketch as a temporary file
            import tempfile
            from PIL import Image
            import base64
            import io
            
            # Image is already a filepath when using type="filepath"
            img = Image.open(image)
            
            # Save to temporary file
            with tempfile.NamedTemporaryFile(suffix='.png', delete=False) as temp_file:
                img.save(temp_file.name)
                temp_path = temp_file.name
            
            # Transcribe the image
            logger.info("Transcribing image with MangaOCR")
            transcription = self.mocr(temp_path)
            logger.debug(f"Transcription result: {transcription}")
            
            # Clean up temporary file
            import os
            os.unlink(temp_path)
            
            # Load prompts
            prompts = load_prompts()
            
            # Compare transcription with target word using kanji field
            is_correct = transcription.strip() == self.current_word.get('kanji', '').strip()
            result = "✓ Correct!" if is_correct else "✗ Incorrect"
            
            logger.debug(f"Current word: {self.current_word}")
            logger.debug(f"Transcription: {transcription}, Target: {self.current_word.get('kanji', '')}, Is correct: {is_correct}")
            
            # Submit result to backend
            self.submit_result(is_correct)
            
            logger.info(f"Grading complete: {result}")
            
            return transcription, result
            
        except Exception as e:
            logger.error(f"Error in grade_submission: {str(e)}")
            return "Error processing submission", "Error: " + str(e)

def create_ui():
    app = JapaneseWritingApp()
    
    # Custom CSS for larger text
    custom_css = """
    .large-text-output textarea {
        font-size: 40px !important;
        line-height: 1.5 !important;
        font-family: 'Noto Sans JP', sans-serif !important;
    }
    """
    
    with gr.Blocks(
        title="Japanese Word Writing Practice",
        css=custom_css
    ) as interface:
        gr.Markdown("# Japanese Word Writing Practice")
        
        with gr.Row():
            with gr.Column():
                generate_btn = gr.Button("Get New Word", variant="primary")
                kanji_output = gr.Textbox(
                    label="Kanji",
                    lines=2,
                    scale=2,
                    show_label=True,
                    container=True,
                    elem_classes=["large-text-output"]
                )
                reading_output = gr.Textbox(label="Reading")
                english_output = gr.Textbox(label="English")
                instruction_output = gr.Textbox(label="Instructions")
                
                # Add debug output
                debug_output = gr.Textbox(label="Debug Info", visible=False)
            
            with gr.Column():
                # Image upload component
                image_input = gr.Image(label="Upload your handwritten word", type="filepath")

                submit_btn = gr.Button("Submit", variant="secondary")
                
                with gr.Group():
                    gr.Markdown("### Results")
                    transcription_output = gr.Textbox(
                        label="Your Writing",
                        lines=1,
                        scale=2,
                        show_label=True,
                        container=True,
                        elem_classes=["large-text-output"]
                    )

                    grade_output = gr.Textbox(label="Result")

        # Event handlers
        generate_btn.click(
            fn=app.get_random_word,
            outputs=[kanji_output, reading_output, english_output, instruction_output]
        )
        
        submit_btn.click(
            fn=app.grade_submission,
            inputs=image_input,
            outputs=[transcription_output, grade_output]
        )
    return interface

if __name__ == "__main__":
    interface = create_ui()
    interface.launch(server_name="0.0.0.0", server_port=8081)