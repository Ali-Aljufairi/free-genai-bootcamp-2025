"""
Configuration settings for ShopGenie application.
"""

import os
from dotenv import load_dotenv
from langchain_groq import ChatGroq
from tavily import TavilyClient
from googleapiclient.discovery import build

# Load environment variables from .env file
load_dotenv()

GROQ_API_KEY = os.environ.get("GROQ_API_KEY")
TAVILY_API_KEY = os.environ.get("TAVILY_API_KEY")
YOUTUBE_API_KEY = os.environ.get("YOUTUBE_API_KEY")
GMAIL_USER = os.environ.get("GMAIL_USER")
GMAIL_PASSWORD = os.environ.get("GMAIL_PASS")

# Email server settings
SMTP_SERVER = "smtp.gmail.com"
SMTP_PORT = 587

# Debug settings
# Set to False to disable logging via print statements
DEBUG = os.environ.get("DEBUG", "False").lower() == "true"

# Initialize services
llm = ChatGroq(
    model="llama-3.3-70b-versatile",
    api_key=GROQ_API_KEY,
    temperature=0.6,
)

tavily_client = TavilyClient(api_key=TAVILY_API_KEY)

youtube = build("youtube", "v3", developerKey=YOUTUBE_API_KEY)
