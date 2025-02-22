import gradio as gr

def create_word_practice_tab():
    """Create the Word Practice tab components"""
    with gr.Row():
            with gr.Column():
                generate_word_btn = gr.Button("Get New Word", variant="primary")
                word_output = gr.Textbox(
                    label="Word to Write",
                    lines=2,
                    scale=2,
                    show_label=True,
                    container=True,
                    elem_classes=["large-text-output"]
                )
                word_english_output = gr.Textbox(label="English", interactive=False)
                word_reading_output = gr.Textbox(label="Reading", interactive=False)
                word_instruction_output = gr.Textbox(label="Instructions", interactive=False)
            
            with gr.Column():
                word_image_input = gr.Image(label="Upload your handwritten word", type="filepath")
                word_submit_btn = gr.Button("Submit", variant="secondary")
                
                with gr.Group():
                    gr.Markdown("### Feedback")
                    word_transcription_output = gr.Textbox(
                        label="Your Writing",
                        lines=2,
                        scale=2,
                        elem_classes=["large-text-output"]
                    )
                    word_target_output = gr.Textbox(label="Target Word", lines=1)
                    word_grade_output = gr.Textbox(label="Grade")
                    word_feedback_output = gr.Textbox(label="Feedback", lines=3)
    
    return (
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
    )

def create_sentence_practice_tab():
    """Create the Sentence Practice tab components"""
    with gr.Row():
            with gr.Column():
                generate_sentence_btn = gr.Button("Generate New Sentence", variant="primary")
                sentence_output = gr.Textbox(
                    label="Generated Sentence",
                    lines=3,
                    scale=2,
                    show_label=True,
                    container=True,
                    elem_classes=["large-text-output"]
                )
                sentence_word_info = gr.Markdown("### Word Information")
                sentence_english_output = gr.Textbox(label="English", interactive=False)
                sentence_kanji_output = gr.Textbox(label="Kanji", interactive=False)
                sentence_reading_output = gr.Textbox(label="Reading", interactive=False)
            
            with gr.Column():
                sentence_image_input = gr.Image(label="Upload your handwritten sentence", type="filepath")
                sentence_submit_btn = gr.Button("Submit", variant="secondary")
                
                with gr.Group():
                    gr.Markdown("### Feedback")
                    sentence_transcription_output = gr.Textbox(
                        label="Transcription",
                        lines=3,
                        scale=2,
                        show_label=True,
                        container=True,
                        elem_classes=["large-text-output"]
                    )
                    sentence_translation_output = gr.Textbox(label="Translation", lines=2)
                    sentence_grade_output = gr.Textbox(label="Grade")
                    sentence_feedback_output = gr.Textbox(label="Feedback", lines=3)
    
    return (
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
    )

def get_custom_css():
    """Return custom CSS for the interface"""
    return """
    .large-text-output textarea {
        font-size: 40px !important;
        line-height: 1.5 !important;
        font-family: 'Noto Sans JP', sans-serif !important;
    }
    """