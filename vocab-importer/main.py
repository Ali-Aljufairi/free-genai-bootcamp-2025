from typing import List, Optional
import json
import os
import streamlit as st
import dotenv
from pydantic import BaseModel
from groq import Groq

from messages import SYSTEM_MESSAGE, USER_MESSAGE_TEMPLATE

# Load environment variables and initialize Groq client
dotenv.load_dotenv()
groq = Groq(api_key=os.environ["GROQ_API_KEY"])


class type(BaseModel):
    type: str


class Japanesewords(BaseModel):
    words: List["word"]


class word(BaseModel):
    japanese: str
    romanji: str
    english: str
    parts: type


def get_japanese(topic: str) -> Japanesewords:
    """
    Fetch Japanese words related to the given topic using Groq API.

    Args:
        topic: The topic to fetch Japanese words for

    Returns:
        Japanesewords: A model containing Japanese words
    """
    chat_completion = groq.chat.completions.create(
        messages=[
            {
                "role": "system",
                "content": SYSTEM_MESSAGE
                +
                # Pass the json schema to the model. Pretty printing improves results.
                f" The JSON object must use the schema: {json.dumps(Japanesewords.model_json_schema(), indent=2)}",
            },
            {
                "role": "user",
                "content": USER_MESSAGE_TEMPLATE.format(topic=topic),
            },
        ],
        model="qwen-2.5-32b",
        temperature=0,
        # Streaming is not supported in JSON mode
        stream=False,
        # Enable JSON mode by setting the response format
        response_format={"type": "json_object"},
    )
    return Japanesewords.model_validate_json(chat_completion.choices[0].message.content)


def save_recipe_to_json(japanesewords: Japanesewords, filepath: Optional[str] = None):
    """
    Save Japanese words to a JSON file.

    Args:
        japanesewords: Japanesewords object to save
        filepath: Path to save the file. If None, uses the first Japanese word.json
    """
    if filepath is None:
        # Create a filename based on the topic
        filename = japanesewords.words[0].japanese.lower().replace(" ", "_") + ".json"
        filepath = filename

    # Convert to JSON
    words_json = japanesewords.model_dump_json(indent=2)

    with open(filepath, "w") as f:
        f.write(words_json)

    return filepath


def display_words_table(japanesewords: Japanesewords):
    """Display Japanese words in a nice table format"""
    if not japanesewords or not japanesewords.words:
        st.warning("No words found.")
        return

    # Create a table with the words
    st.subheader("Japanese Vocabulary")

    # Create columns for each word property
    col1, col2, col3, col4 = st.columns(4)
    col1.write("**Japanese**")
    col2.write("**Romanji**")
    col3.write("**English**")
    col4.write("**Part of Speech**")

    # Add a separator
    st.divider()

    # Display each word
    for word_item in japanesewords.words:
        col1, col2, col3, col4 = st.columns(4)
        col1.write(word_item.japanese)
        col2.write(word_item.romanji)
        col3.write(word_item.english)
        col4.write(word_item.parts.type)


def main():
    """Main Streamlit application"""
    st.set_page_config(
        page_title="Japanese Vocabulary Importer",
        page_icon="🇯🇵",
        layout="wide",
    )

    st.title("🇯🇵 Japanese Vocabulary Importer")
    st.write("Generate Japanese vocabulary words based on topics of interest.")

    # Input for topic
    topic = st.text_input("Enter a topic (e.g., sushi, cooking, travel):", "sushi")

    col1, col2 = st.columns(2)

    generate_button = col1.button("Generate Vocabulary", type="primary")

    # Session state to store the generated words
    if "japanesewords" not in st.session_state:
        st.session_state.japanesewords = None
        st.session_state.saved_file = None

    if generate_button:
        with st.spinner("Generating Japanese vocabulary..."):
            try:
                st.session_state.japanesewords = get_japanese(topic)
                st.session_state.saved_file = None  # Reset saved file status
                st.success(f"Successfully generated vocabulary for '{topic}'!")
            except Exception as e:
                st.error(f"Error generating vocabulary: {str(e)}")

    # Display the table if we have words
    if st.session_state.japanesewords:
        display_words_table(st.session_state.japanesewords)

        # Save option
        save_col1, save_col2 = st.columns(2)
        filename = save_col1.text_input(
            "Filename to save:", f"{topic.lower().replace(' ', '_')}.json"
        )

        if save_col2.button("Save to JSON"):
            filepath = save_recipe_to_json(st.session_state.japanesewords, filename)
            st.session_state.saved_file = filepath
            st.success(f"Saved vocabulary to {filepath}")

        # Show raw JSON
        with st.expander("View Raw JSON"):
            st.json(json.loads(st.session_state.japanesewords.model_dump_json()))

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
