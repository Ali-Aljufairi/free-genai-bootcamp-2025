"""
Constants and configuration parameters for the JLPT Grammar Quiz Generator.
"""

# Directory and file paths
JSON_FILES_DIR = "json_files"
LOGS_DIR = "logs"
DATA_DIR = "data"

# API request limits
MAX_QUESTIONS_PER_REQUEST = 5

# API server configuration
API_HOST = "0.0.0.0"
API_PORT = 8004
API_TITLE = "JLPT Grammar Quiz Generator API"

# CORS settings
CORS_ORIGINS = ["*"]  # Allow all origins
CORS_CREDENTIALS = True
CORS_METHODS = ["*"]  # Allow all methods
CORS_HEADERS = ["*"]  # Allow all headers

# LLM API configuration
API_MODEL_DEFAULT = "qwen/qwen3-32b"  # Default model to use
API_TEMPERATURE = 0.7
API_TOP_P = 0.9
API_STREAM = False
API_RESPONSE_FORMAT = {"type": "json_object"}

# JLPT levels configuration
JLPT_MIN_LEVEL = 1
JLPT_MAX_LEVEL = 5
MIN_QUESTIONS = 1
MAX_QUESTIONS = 20
