from typing import Optional
import json
import os
import streamlit as st
import dotenv
from groq import Groq
from messages import SYSTEM_MESSAGE, USER_MESSAGE_TEMPLATE
from models import (
    Choice, 
    GrammarQuestion, 
    GrammarQuiz
)
from constants import (
    JSON_FILES_DIR,
    API_MODEL_DEFAULT,
    API_TEMPERATURE,
    API_TOP_P,
    API_STREAM,
    API_RESPONSE_FORMAT
)

# Load environment variables and initialize Groq client
dotenv.load_dotenv()
groq = Groq(api_key=os.environ["GROQ_API_KEY"])

# Ensure the directory exists
os.makedirs(JSON_FILES_DIR, exist_ok=True)


def get_grammar_questions(level: int, num_questions: int) -> GrammarQuiz:
    """
    Generate JLPT grammar questions for the specified level using Groq API.

    Args:
        level: JLPT level (1-5)
        num_questions: Number of questions to generate

    Returns:
        GrammarQuiz: A model containing grammar questions
    """
    chat_completion = groq.chat.completions.create(
        messages=[
            {
                "role": "system",
                "content": SYSTEM_MESSAGE
                +
                # Pass the json schema to the model. Pretty printing improves results.
                f" The JSON object must use the schema: {json.dumps(GrammarQuiz.model_json_schema(), indent=2)}",
            },
            {
                "role": "user",
                "content": USER_MESSAGE_TEMPLATE.format(
                    level=level, num_questions=num_questions
                ),
            },
        ],
        model=API_MODEL_DEFAULT,
        temperature=API_TEMPERATURE,
        top_p=API_TOP_P,
        stream=API_STREAM,
        response_format=API_RESPONSE_FORMAT,
    )

    return GrammarQuiz.model_validate_json(chat_completion.choices[0].message.content)


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


def display_quiz(grammar_quiz: GrammarQuiz):
    """Display grammar quiz in a nice format"""
    if not grammar_quiz or not grammar_quiz.questions:
        st.warning("No questions found.")
        return

    st.subheader(f"JLPT N{grammar_quiz.level} Grammar Quiz")

    # Display each question
    for i, question in enumerate(grammar_quiz.questions):
        with st.expander(f"Question {i + 1}: {question.grammar_point}"):
            st.write("**Question:**")
            st.write(question.question)

            st.write("**Options:**")
            # Create radio buttons for choices
            choices = [choice.text for choice in question.choices]
            correct_index = next(
                (i for i, choice in enumerate(question.choices) if choice.is_correct), 0
            )

            user_answer = st.radio("Select your answer:", choices, key=f"q{i}")

            if st.button("Check Answer", key=f"check{i}"):
                if choices.index(user_answer) == correct_index:
                    st.success("Correct! ✅")
                else:
                    st.error(
                        f"Incorrect. The correct answer is: {choices[correct_index]}"
                    )

                # Show detailed explanations
                st.write("**Why This Answer is Correct:**")
                st.write(question.answer_reasoning)

                st.write("**Japanese Explanation:**")
                st.write(question.explanation)

                st.markdown("---")
                st.write("**Grammar Point Explanation (English):**")
                st.write(question.grammar_explanation_english)


def main():
    """Main Streamlit application"""
    st.set_page_config(
        page_title="JLPT Grammar Quiz Generator",
        page_icon="🇯🇵",
        layout="wide",
    )

    st.title("🇯🇵 JLPT Grammar Quiz Generator")
    st.write("Generate Japanese grammar questions for JLPT study.")

    # Input for JLPT level
    col1, col2 = st.columns(2)
    level = col1.selectbox(
        "Select JLPT Level:", [5, 4, 3, 2, 1], format_func=lambda x: f"N{x}"
    )

    num_questions = col2.slider(
        "Number of questions:", min_value=1, max_value=20, value=5
    )

    generate_button = st.button("Generate Grammar Quiz", type="primary")

    # Session state to store the generated quiz
    if "grammar_quiz" not in st.session_state:
        st.session_state.grammar_quiz = None
        st.session_state.saved_file = None

    if generate_button:
        with st.spinner(f"Generating JLPT N{level} grammar questions..."):
            try:
                st.session_state.grammar_quiz = get_grammar_questions(
                    level, num_questions
                )
                st.session_state.saved_file = None  # Reset saved file status
                st.success(
                    f"Successfully generated {num_questions} JLPT N{level} grammar questions!"
                )
            except Exception as e:
                st.error(f"Error generating grammar questions: {str(e)}")

    # Display the quiz if we have questions
    if st.session_state.grammar_quiz:
        display_quiz(st.session_state.grammar_quiz)

        # Save option
        save_col1, save_col2 = st.columns(2)
        filename = save_col1.text_input(
            "Filename to save:", f"jlpt_n{level}_questions.json"
        )

        if save_col2.button("Save to JSON"):
            filepath = save_quiz_to_json(st.session_state.grammar_quiz, filename)
            st.session_state.saved_file = filepath
            st.success(f"Saved quiz to {filepath}")

        # Show raw JSON
        with st.expander("View Raw JSON"):
            st.json(json.loads(st.session_state.grammar_quiz.model_dump_json()))

        # Option to download the file if it's been saved
        if st.session_state.saved_file:
            with open(st.session_state.saved_file, "r") as f:
                file_content = f.read()

            st.download_button(
                label="Download JSON file",
                data=file_content,
                file_name=os.path.basename(st.session_state.saved_file),
                mime="application/json",
            )


if __name__ == "__main__":
    main()
