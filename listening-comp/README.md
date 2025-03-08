
## Project Overview
This is a JLPT (Japanese Language Proficiency Test) listening practice application with a frontend-backend architecture. The application helps users practice their Japanese listening skills by providing JLPT-style questions generated from YouTube content, with text-to-speech audio powered by AWS Bedrock.

## Installation

1. Clone the repository
2. Ensure you have Python 3.13 installed
3. Install dependencies:
   ```bash
   pip install .
   ```

## Development Setup

1. Configure AWS Credentials for Bedrock access
2. Start the frontend application:
   ```bash
   cd frontend
   streamlit run main.py
   ```

## Usage

1. **Adding Content**:
   - Paste a Japanese YouTube video URL in the sidebar
   - Select the appropriate JLPT level
   - Click "Add Transcript" to process the video

2. **Practicing**:
   - Choose a topic from the dropdown menu
   - Click "Generate Question from Transcripts"
   - Listen to the audio and answer the questions
   - Review your answers and save questions for later practice

## Directory Structure

### Frontend
<mcfolder name="frontend" path="/Users/ali/github/free-genai-bootcamp-2025/listening-comp/frontend"></mcfolder>
- **Main Components:**
  - <mcfile name="main.py" path="/Users/ali/github/free-genai-bootcamp-2025/listening-comp/frontend/main.py"></mcfile>: Streamlit-based web interface for the application
  - <mcfolder name="static" path="/Users/ali/github/free-genai-bootcamp-2025/listening-comp/frontend/static"></mcfolder>: Contains static assets like audio files

### Backend
<mcfolder name="backend" path="/Users/ali/github/free-genai-bootcamp-2025/listening-comp/backend"></mcfolder>

Key components:

1. **Data Management:**
   - <mcfile name="vector_store.py" path="/Users/ali/github/free-genai-bootcamp-2025/listening-comp/backend/vector_store.py"></mcfile>: Manages the vector database (ChromaDB) for storing and retrieving questions
   - <mcfile name="structured_data.py" path="/Users/ali/github/free-genai-bootcamp-2025/listening-comp/backend/structured_data.py"></mcfile>: Handles structured data processing and storage

2. **Content Generation:**
   - <mcfile name="audio_generator.py" path="/Users/ali/github/free-genai-bootcamp-2025/listening-comp/backend/audio_generator.py"></mcfile>: Generates audio content using AWS Bedrock
   - <mcfile name="question_generator.py" path="/Users/ali/github/free-genai-bootcamp-2025/listening-comp/backend/question_generator.py"></mcfile>: Creates JLPT-style listening questions

3. **YouTube Integration:**
   - <mcfile name="get_transcript.py" path="/Users/ali/github/free-genai-bootcamp-2025/listening-comp/backend/get_transcript.py"></mcfile>: Downloads and processes YouTube video transcripts

4. **Data Storage:**
   - <mcfolder name="data" path="/Users/ali/github/free-genai-bootcamp-2025/listening-comp/backend/data"></mcfolder>:
     - `transcripts/`: Stores downloaded transcripts
     - `questions/`: Contains generated questions
     - `vectorstore/`: Vector database storage

## Key Features and Responsibilities

1. **Frontend (<mcfile name="main.py" path="/Users/ali/github/free-genai-bootcamp-2025/listening-comp/frontend/main.py"></mcfile>)**:
   - Interactive web interface using Streamlit
   - Question display and practice interface
   - Audio playback functionality
   - Session management
   - Question history and saved questions

2. **Vector Store (<mcfile name="vector_store.py" path="/Users/ali/github/free-genai-bootcamp-2025/listening-comp/backend/vector_store.py"></mcfile>)**:
   - Semantic search for similar questions
   - Question storage and retrieval
   - Embedding generation using AWS Bedrock
   - Collection management for different question types

3. **Audio Generation (<mcfile name="audio_generator.py" path="/Users/ali/github/free-genai-bootcamp-2025/listening-comp/backend/audio_generator.py"></mcfile>)**:
   - Text-to-speech conversion
   - AWS Bedrock integration
   - Audio file management

4. **Question Generation (<mcfile name="question_generator.py" path="/Users/ali/github/free-genai-bootcamp-2025/listening-comp/backend/question_generator.py"></mcfile>)**:
   - Creates JLPT-style listening questions
   - Question validation and formatting
   - Integration with vector store for similar question generation

5. **Transcript Processing (<mcfile name="get_transcript.py" path="/Users/ali/github/free-genai-bootcamp-2025/listening-comp/backend/get_transcript.py"></mcfile>)**:
   - YouTube transcript downloading
   - Text processing and cleaning
   - Transcript storage management

## Configuration Files
- <mcfile name="pyproject.toml" path="/Users/ali/github/free-genai-bootcamp-2025/listening-comp/pyproject.toml"></mcfile>: Project dependencies and metadata
- <mcfile name="requirements.txt" path="/Users/ali/github/free-genai-bootcamp-2025/listening-comp/backend/requirements.txt"></mcfile>: Backend Python dependencies
- <mcfile name=".python-version" path="/Users/ali/github/free-genai-bootcamp-2025/listening-comp/.python-version"></mcfile>: Python version specification (3.13)

