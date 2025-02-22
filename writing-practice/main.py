import gradio as gr
import os
import dotenv
from core import JapaneseApp
from components import create_word_practice_tab, create_sentence_practice_tab, get_custom_css

dotenv.load_dotenv()

def create_ui():
    app = JapaneseApp()
    
    with gr.Blocks(
        title="Japanese Learning Practice",
        css=get_custom_css()
    ) as interface:
        with gr.Tabs():
            # Word Practice Tab
            with gr.Tab("Word Practice"):
                (
                    generate_word_btn,
                    word_output,
                    word_english_output,
                    word_reading_output,
                    word_instruction_output,
                    word_image_input,
                    word_submit_btn,
                    word_transcription_output,
                    word_target_output,
                    word_grade_output,
                    word_feedback_output
                ) = create_word_practice_tab()

            # Sentence Practice Tab
            with gr.Tab("Sentence Practice"):
                (
                    generate_sentence_btn,
                    sentence_output,
                    sentence_english_output,
                    sentence_kanji_output,
                    sentence_reading_output,
                    sentence_image_input,
                    sentence_submit_btn,
                    sentence_transcription_output,
                    sentence_translation_output,
                    sentence_grade_output,
                    sentence_feedback_output
                ) = create_sentence_practice_tab()

        # Event handlers for Word Practice
        generate_word_btn.click(
            fn=app.get_random_word,
            outputs=[word_output, word_english_output, word_reading_output, word_instruction_output]
        )
        
        word_submit_btn.click(
            fn=app.grade_word_submission,
            inputs=[word_image_input],
            outputs=[word_transcription_output, word_target_output, word_grade_output, word_feedback_output]
        )

        # Event handlers for Sentence Practice
        generate_sentence_btn.click(
            fn=app.get_random_word_and_sentence,
            outputs=[sentence_output, sentence_english_output, sentence_kanji_output, sentence_reading_output]
        )
        
        sentence_submit_btn.click(
            fn=app.grade_sentence_submission,
            inputs=[sentence_image_input],
            outputs=[sentence_transcription_output, sentence_translation_output, sentence_grade_output, sentence_feedback_output]
        )

    return interface

if __name__ == "__main__":
    interface = create_ui()
    interface.launch(
        server_name=os.getenv('GRADIO_SERVER_NAME', '0.0.0.0'),
        server_port=int(os.getenv('GRADIO_SERVER_PORT', '8080'))
    )