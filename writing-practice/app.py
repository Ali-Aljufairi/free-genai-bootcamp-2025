import streamlit as st
import os
import dotenv
from core import JapaneseApp
from PIL import Image
import io

# Load environment variables
dotenv.load_dotenv()

# Initialize session state if not already done
if 'app' not in st.session_state:
    st.session_state.app = JapaneseApp()

if 'current_word' not in st.session_state:
    st.session_state.current_word = None

if 'current_sentence' not in st.session_state:
    st.session_state.current_sentence = None

# Set page config
st.set_page_config(
    page_title="Japanese Learning Practice",
    page_icon="✍️",
    layout="wide"
)

# Custom CSS
st.markdown("""
    <style>
    .big-font {
        font-size: 40px !important;
        font-family: 'Noto Sans JP', sans-serif !important;
    }
    /* Tab styling for dark theme */
    .stTabs [data-baseweb="tab-list"] {
        gap: 24px;
        background-color: #1E1E1E !important;
        padding: 10px 20px;
        border-radius: 8px;
    }
    .stTabs [data-baseweb="tab"] {
        height: 50px;
        padding: 0 24px;
        background-color: #2E2E2E !important;
        color: #FFFFFF !important;
        border-radius: 4px;
        border: 1px solid #333333 !important;
    }
    .stTabs [data-baseweb="tab"]:hover {
        background-color: #3E3E3E !important;
        border-color: #444444 !important;
    }
    .stTabs [data-baseweb="tab"][aria-selected="true"] {
        background-color: #4E4E4E !important;
        border-color: #555555 !important;
    }
    /* Button styling for dark theme */
    .stButton button {
        background-color: #1E1E1E !important;
        color: #FFFFFF !important;
        border: 1px solid #333333 !important;
    }
    .stButton button:hover {
        background-color: #2E2E2E !important;
        border-color: #444444 !important;
    }
    .stButton button:active {
        background-color: #3E3E3E !important;
    }
    </style>
""", unsafe_allow_html=True)

# Main title
st.title("Japanese Learning Practice ✍️")

# Create tabs
tab1, tab2 = st.tabs(["Word Practice", "Sentence Practice"])

# Word Practice Tab
with tab1:
    col1, col2 = st.columns(2)
    
    with col1:
        if st.button("Get New Word", key="word_gen"):
            kanji, english, reading, instruction = st.session_state.app.get_random_word()
            st.session_state.current_word = {
                'kanji': kanji,
                'english': english,
                'reading': reading,
                'instruction': instruction
            }
        
        if st.session_state.current_word:
            st.markdown(f'<p class="big-font">{st.session_state.current_word["kanji"]}</p>', unsafe_allow_html=True)
            st.text_input("English", value=st.session_state.current_word["english"], disabled=True)
            st.text_input("Reading", value=st.session_state.current_word["reading"], disabled=True)
            st.text_input("Instructions", value=st.session_state.current_word["instruction"], disabled=True)
    
    with col2:
        uploaded_file = st.file_uploader("Upload your handwritten word", type=['png', 'jpg', 'jpeg'], key="word_image")
        
        if uploaded_file and st.button("Submit", key="word_submit"):
            # Save the uploaded file temporarily
            image_path = f"temp_word_{uploaded_file.name}"
            with open(image_path, "wb") as f:
                f.write(uploaded_file.getbuffer())
            
            # Grade the submission
            transcription, target, grade, feedback = st.session_state.app.grade_word_submission(image_path)
            
            # Display results
            st.markdown("### Feedback")
            st.text_input("Your Writing", value=transcription, disabled=True)
            st.text_input("Target Word", value=target, disabled=True)
            st.text_input("Grade", value=grade, disabled=True)
            st.text_area("Feedback", value=feedback, disabled=True)
            
            # Clean up temporary file
            os.remove(image_path)

# Sentence Practice Tab
with tab2:
    col1, col2 = st.columns(2)
    
    with col1:
        if st.button("Generate New Sentence", key="sentence_gen"):
            sentence, english, kanji, reading = st.session_state.app.get_random_word_and_sentence()
            st.session_state.current_sentence = {
                'sentence': sentence,
                'english': english,
                'kanji': kanji,
                'reading': reading
            }
        
        if st.session_state.current_sentence:
            st.markdown(f'<p class="big-font">{st.session_state.current_sentence["sentence"]}</p>', unsafe_allow_html=True)
            st.markdown("### Word Information")
            st.text_input("English", value=st.session_state.current_sentence["english"], disabled=True)
            st.text_input("Kanji", value=st.session_state.current_sentence["kanji"], disabled=True)
            st.text_input("Reading", value=st.session_state.current_sentence["reading"], disabled=True)
    
    with col2:
        uploaded_file = st.file_uploader("Upload your handwritten sentence", type=['png', 'jpg', 'jpeg'], key="sentence_image")
        
        if uploaded_file and st.button("Submit", key="sentence_submit"):
            # Save the uploaded file temporarily
            image_path = f"temp_sentence_{uploaded_file.name}"
            with open(image_path, "wb") as f:
                f.write(uploaded_file.getbuffer())
            
            # Grade the submission
            transcription, translation, grade, feedback = st.session_state.app.grade_sentence_submission(image_path)
            
            # Display results
            st.markdown("### Feedback")
            st.text_area("Transcription", value=transcription, disabled=True)
            st.text_area("Translation", value=translation, disabled=True)
            st.text_input("Grade", value=grade, disabled=True)
            st.text_area("Feedback", value=feedback, disabled=True)
            
            # Clean up temporary file
            os.remove(image_path)
