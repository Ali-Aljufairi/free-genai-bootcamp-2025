# Japanese Writing Practice App

A web application for practicing Japanese writing with real-time feedback using Google Cloud Vision API for OCR and Groq for AI-powered feedback.

## Features

- Practice writing individual Japanese words
- Practice writing complete sentences
- Real-time feedback on writing accuracy
- Stroke order visualization
- AI-powered feedback and suggestions

## Setup

1. Clone the repository
2. Install dependencies:
   ```bash
   pip install -e .
   ```

3. Set up environment variables:
   Create a `.env` file in the root directory with the following variables:
   ```
   GROQ_API_KEY=your_groq_api_key
   GOOGLE_API_KEY=your_google_cloud_vision_api_key
   ```

4. Set up Google Cloud Vision API:
   - Go to the [Google Cloud Console](https://console.cloud.google.com)
   - Create a new project or select an existing one
   - Enable the Cloud Vision API for your project
   - Go to "APIs & Services" > "Credentials"
   - Click "Create Credentials" > "API Key"
   - Copy the generated API key and add it to your `.env` file

5. Run the application:
   ```bash
   uvicorn api:api --reload
   ```

## API Endpoints

- `GET /api/writing/random-sentence`: Get a random Japanese sentence to practice
- `POST /api/writing/feedback-word`: Submit a word for feedback
- `POST /api/writing/feedback-sentence`: Submit a sentence for feedback

## Development

The application uses:
- FastAPI for the backend API
- Google Cloud Vision API for OCR
- Groq for AI-powered feedback
- React for the frontend

## License

MIT

## Project Structure

```
├── app.py              # Main Streamlit application entry point
├── components.py       # Gradio UI components and layout
├── core.py            # Core application logic and API integrations
├── prompts.yaml       # AI prompt templates for sentence generation and grading
├── utils.py           # Utility functions
└── .env              # Environment variables configuration
```

## Dependencies

This project uses UV for package management. Key dependencies include:

- Groq API for AI sentence generation and grading
- MangaOCR for Japanese text recognition
- Gradio for UI components
- Streamlit for web interface
- Python 3.10 or higher

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