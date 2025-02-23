# Japanese Writing Practice Application

An interactive web application for practicing Japanese writing, featuring word and sentence exercises with real-time feedback using OCR and AI grading.

## Project Structure

```
├── app.py              # Main Streamlit application entry point
├── components.py       # Gradio UI components and layout
├── core.py            # Core application logic and API integrations
├── prompts.yaml       # AI prompt templates for sentence generation and grading
├── utils.py           # Utility functions
└── .env              # Environment variables configuration
```

## Features

- **Word Practice Mode**
  - Random word generation from vocabulary
  - Handwriting input and OCR recognition
  - Real-time grading and feedback

- **Sentence Practice Mode**
  - AI-generated practice sentences
  - Handwriting recognition and translation
  - Detailed feedback on writing accuracy

## Dependencies

This project uses UV for package management. Key dependencies include:

- Groq API for AI sentence generation and grading
- MangaOCR for Japanese text recognition
- Gradio for UI components
- Streamlit for web interface
- Python 3.10 or higher

## Setup

1. Clone the repository

2. Create a Python virtual environment:
   ```bash
   python -m venv .venv
   source .venv/bin/activate  # On Windows: .venv\Scripts\activate
   ```

3. Install UV package manager:
   ```bash
   pip install uv
   ```

4. Install dependencies:
   ```bash
   uv pip install -r requirements.txt
   ```

5. Configure environment variables:
   - Copy `.env.example` to `.env`
   - Add your Groq API key and other required variables

## Running the Application

Start the application using Streamlit:

```bash
streamlit run app.py
```

The application will be available at `http://localhost:8501`

## Adding New Dependencies

To add new packages using UV:

```bash
uv add <package-name>
```

## Environment Variables

Required environment variables:

- `GROQ_API_KEY`: Your Groq API key for AI features
- `API_PROTOCOL`: Protocol for backend API (default: http)
- `API_HOST`: Host for backend API (default: localhost)
- `API_PORT`: Port for backend API (default: 5000)
- `GROUP_ID`: Group ID for vocabulary management (default: 1)

## Usage

1. **Word Practice**:
   - Click "Get New Word" to receive a random Japanese word
   - Write the word on paper and upload a photo
   - Submit to receive instant feedback and grading

2. **Sentence Practice**:
   - Generate a new practice sentence
   - Write the sentence and upload your handwriting
   - Get detailed feedback on accuracy and style

Grades are given on a scale of S (perfect), A (excellent), B (good), and C (needs improvement).