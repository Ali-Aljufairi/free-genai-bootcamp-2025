import gradio as gr
import requests
import random
import logging
from groq import Groq
import os
import dotenv

dotenv.load_dotenv()

# Setup logging
logger = logging.getLogger('japanese_word_app')
logger.setLevel(logging.DEBUG)
fh = logging.FileHandler('word_app.log')
fh.setFormatter(logging.Formatter('%(asctime)s - %(levelname)s - %(message)s'))
logger.addHandler(fh)

class JapaneseWordApp:
    def __init__(self):
        self.client = Groq(
            api_key=os.getenv('GROQ_API_KEY')
        )
        self.api_base_url = f"{os.getenv('API_PROTOCOL', 'http')}://{os.getenv('API_HOST', 'localhost')}:{os.getenv('API_PORT', '5000')}"
        self.vocabulary = None
        self.current_word = None
        self.mocr = None
        self.study_session_id = self.create_study_session()
        logger.debug(f"Using session_id: {self.study_session_id}")
        self.load_vocabulary()

    def create_study_session(self):
        """Create a new study session"""
        try:
            group_id = os.getenv('GROUP_ID', '1')
            url = f"{self.api_base_url}/api/study-sessions"
            data = {
                'group_id': int(group_id),
                'study_activity_id': 1  # Assuming 1 is for word practice
            }
            
            response = requests.post(url, json=data)
            if response.status_code == 201:
                session_data = response.json()
                return session_data.get('id')
            return None
                
        except Exception as e:
            logger.error(f"Error creating study session: {str(e)}")
            return None

    def load_vocabulary(self):
        """Fetch vocabulary from API using group_id"""
        try:
            group_id = os.getenv('GROUP_ID', '1')
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
        if not self.vocabulary or not self.vocabulary.get('words'):
            return "", "", "", "Please make sure vocabulary is loaded properly."
            
        self.current_word = random.choice(self.vocabulary['words'])
        
        return (
            self.current_word.get('kanji', ''),
            self.current_word.get('english', ''),
            self.current_word.get('reading', ''),
            "Write this word in Japanese characters"
        )

    def grade_submission(self, image):
        """Process image submission and grade it using MangaOCR"""
        try:
            if self.mocr is None:
                from manga_ocr import MangaOcr
                self.mocr = MangaOcr()
            
            transcription = self.mocr(image)
            
            # Compare with current word
            grade = 'C'
            feedback = ''
            
            if transcription == self.current_word.get('kanji'):
                grade = 'S'
                feedback = "Perfect match! Excellent writing."
            elif transcription in [self.current_word.get('kanji'), self.current_word.get('reading')]:
                grade = 'A'
                feedback = "Very good! The characters are clear and correct."
            else:
                # Use Groq for detailed feedback
                response = self.client.chat.completions.create(
                    model="mixtral-8x7b-32768",
                    messages=[
                        {"role": "system", "content": "You are a Japanese writing evaluator. Compare the submission with the target and provide constructive feedback."},
                        {"role": "user", "content": f"Target word: {self.current_word.get('kanji')}\nSubmission: {transcription}\nProvide brief feedback on accuracy and writing quality."}
                    ],
                    temperature=0.3,
                    max_tokens=100
                )
                feedback = response.choices[0].message.content.strip()
                grade = 'B' if "good" in feedback.lower() else 'C'
            
            return transcription, self.current_word.get('kanji', ''), grade, feedback
            
        except Exception as e:
            logger.error(f"Error in grade_submission: {str(e)}")
            return "Error processing submission", "", "C", f"An error occurred: {str(e)}"

def create_ui():
    app = JapaneseWordApp()
    
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
                word_output = gr.Textbox(
                    label="Word to Write",
                    lines=2,
                    scale=2,
                    show_label=True,
                    container=True,
                    elem_classes=["large-text-output"]
                )
                english_output = gr.Textbox(label="English", interactive=False)
                reading_output = gr.Textbox(label="Reading", interactive=False)
                instruction_output = gr.Textbox(label="Instructions", interactive=False)
            
            with gr.Column():
                image_input = gr.Image(label="Upload your handwritten word", type="filepath")
                submit_btn = gr.Button("Submit", variant="secondary")
                
                with gr.Group():
                    gr.Markdown("### Feedback")
                    transcription_output = gr.Textbox(
                        label="Your Writing",
                        lines=2,
                        scale=2,
                        elem_classes=["large-text-output"]
                    )
                    target_output = gr.Textbox(label="Target Word", lines=1)
                    grade_output = gr.Textbox(label="Grade")
                    feedback_output = gr.Textbox(label="Feedback", lines=3)

        generate_btn.click(
            fn=app.get_random_word,
            outputs=[word_output, english_output, reading_output, instruction_output]
        )
        
        submit_btn.click(
            fn=app.grade_submission,
            inputs=[image_input],
            outputs=[transcription_output, target_output, grade_output, feedback_output]
        )

    return interface

if __name__ == "__main__":
    interface = create_ui()
    interface.launch(
        server_name=os.getenv('GRADIO_SERVER_NAME', '0.0.0.0'),
        server_port=int(os.getenv('GRADIO_SERVER_PORT', '8082'))
    )