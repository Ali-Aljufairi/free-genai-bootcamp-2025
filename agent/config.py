"""
Configuration settings for ShopGenie application.
"""
import os
from dotenv import load_dotenv
from langchain_groq import ChatGroq
from tavily import TavilyClient
from googleapiclient.discovery import build
from utils.email_templates import EMAIL_TEMPLATE_PROMPT, EMAIL_HTML_TEMPLATE

# Load environment variables from .env file
load_dotenv()

# API keys
GROQ_API_KEY = os.environ.get("GROQ_API_KEY")
TAVILY_API_KEY = os.environ.get("TAVILY_API_KEY")
YOUTUBE_API_KEY = os.environ.get("YOUTUBE_API_KEY")
GMAIL_USER = os.environ.get("GMAIL_USER")
GMAIL_PASSWORD = os.environ.get("GMAIL_PASS")

# Email server settings
SMTP_SERVER = "smtp.gmail.com"
SMTP_PORT = 587

# Initialize services
llm = ChatGroq(
    model="llama-3.3-70b-versatile",
    api_key=GROQ_API_KEY,
    temperature=0.6,
)

tavily_client = TavilyClient(api_key=TAVILY_API_KEY)

youtube = build('youtube', 'v3', developerKey=YOUTUBE_API_KEY)