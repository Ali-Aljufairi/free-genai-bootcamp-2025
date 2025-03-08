# Speech Analysis & Visualization App

A Streamlit-based application that enables users to record or upload voice recordings for Japanese speech analysis. The app provides transcription, Japanese language structure analysis, and generates visual representations based on the spoken content.

## Features

- 🎤 Voice Recording: Record audio directly through the browser or upload audio files
- 📝 Transcription: Automatic transcription of Japanese speech using Whisper API
- 🔍 Language Analysis: Detailed analysis of Japanese sentence structure
- 🎨 Visualization: AI-generated images based on the speech content

## Prerequisites

- Python 3.8 or higher
- pip (Python package installer)
- Virtual environment (recommended)

## Installation

1. Clone the repository:
   ```bash
   git clone https://github.com/yourusername/free-genai-bootcamp-2025.git
   cd free-genai-bootcamp-2025/speach
   ```

2. Install uv (if not already installed):
   ```bash
   curl -LsSf https://astral.sh/uv/install.sh | sh
   ```

3. Create virtual environment and install dependencies:
   ```bash
   uv venv
   source .venv/bin/activate  # On Windows, use: .venv\Scripts\activate
   uv pip install -e .
   ```

## Configuration

Before running the application, ensure you have the necessary API credentials:

1. OpenAI Whisper API key for transcription
2. Groq API key for Japanese analysis
3. AWS Bedrock credentials for image generation

Store your credentials securely as environment variables or in a configuration file.

## Running the Application

1. Start the Streamlit app:
   ```bash
   python main.py
   ```
   or
   ```bash
   streamlit run main.py
   ```

2. Open your web browser and navigate to the URL shown in the terminal (typically http://localhost:8501)

## Usage

1. **Recording Audio**
   - Click the microphone button to start recording
   - Speak your Japanese sentence
   - The recording will automatically stop when you're done

2. **Uploading Audio**
   - Toggle "Upload audio file instead"
   - Select a WAV, MP3, or M4A file from your computer

3. **Processing**
   - The app will automatically:
     - Transcribe your speech
     - Analyze the Japanese sentence structure
     - Generate a relevant image

4. **Viewing Results**
   - See the transcription in the left column
   - View the language analysis in the right column
   - Check out the AI-generated image based on your speech

## Project Structure

```
speach/
├── data/
│   ├── audio/    # Stored audio recordings
│   └── images/   # Generated images
├── src/
│   ├── audio/    # Audio recording functionality
│   ├── feedback/ # Japanese analysis
│   ├── image_generation/ # Image generation
│   ├── transcription/    # Speech-to-text
│   ├── ui/      # Streamlit interface
│   └── utils/   # Helper functions
└── main.py      # Application entry point
```

## Support

For issues, questions, or contributions, please open an issue in the GitHub repository.

## License

This project is licensed under the MIT License - see the LICENSE file for details.