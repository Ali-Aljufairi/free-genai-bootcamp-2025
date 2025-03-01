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
    model="llama-3.1-70b-versatile",
    api_key=GROQ_API_KEY,
    temperature=0.5,
)

tavily_client = TavilyClient(api_key=TAVILY_API_KEY)

youtube = build('youtube', 'v3', developerKey=YOUTUBE_API_KEY)

# Email templates
EMAIL_TEMPLATE_PROMPT = """
You are an expert email content writer.

Generate an email recommendation based on the following inputs:
- Product Name: {product_name}
- Justification Line: {justification_line}
- User Query: "{user_query}" (a general idea of the user's interest, such as "a smartphone for photography" or "a premium gaming laptop").

Return your output in the following JSON format:
{format_instructions}

### Input Example:
Product Name: Google Pixel 8 Pro
Justification Line: Praised for its exceptional camera, advanced AI capabilities, and vibrant display.
User Query: a phone with an amazing camera

### Example Output:
{{
  "subject": "Capture Every Moment with Google Pixel 8 Pro",
  "heading": "Discover the Power of the Ultimate Photography Smartphone",
  "justification_line": "Known for its exceptional camera quality, cutting-edge AI features, and vibrant display, the Google Pixel 8 Pro is perfect for photography enthusiasts."
}}

Now generate the email recommendation based on the inputs provided.
"""

EMAIL_HTML_TEMPLATE = """
    <html>
    <head>
        <style>
            body {{
                font-family: Arial, sans-serif;
                margin: 0;
                padding: 0;
                background-color: #f4f4f4;
            }}
            .email-container {{
                max-width: 600px;
                margin: 20px auto;
                background-color: #ffffff;
                border-radius: 8px;
                box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
                overflow: hidden;
            }}
            .header {{
                background-color: #007BFF;
                color: #ffffff;
                padding: 20px;
                text-align: center;
            }}
            .header h1 {{
                margin: 0;
                font-size: 24px;
            }}
            .content {{
                padding: 20px;
            }}
            .content h2 {{
                color: #333333;
                font-size: 20px;
                margin-bottom: 10px;
            }}
            .content p {{
                color: #555555;
                font-size: 16px;
                line-height: 1.5;
            }}
            .button {{
                display: inline-block;
                margin-top: 20px;
                background-color: #007BFF;
                color: #ffffff;
                padding: 10px 20px;
                text-decoration: none;
                border-radius: 5px;
            }}
            .footer {{
                text-align: center;
                font-size: 14px;
                color: #999999;
                padding: 10px 20px;
            }}
            .footer a {{
                color: #007BFF;
                text-decoration: none;
            }}
        </style>
    </head>
    <body>
        <div class="email-container">
            <div class="header">
                <h1>{heading}</h1>
            </div>
            <div class="content">
                <h2>Our Top Pick: {product_name}</h2>
                <p>{justification}</p>
                <p>Watch our in-depth review to explore why this phone is the best choice for you:</p>
                <a href="{youtube_link}" class="button" target="_blank">Watch the Review</a>
            </div>
            <div class="footer">
                <p>
                    Want to learn more? Visit our website or follow us for more recommendations.
                    <a href="https://www.youtube.com">Explore Now</a>
                </p>
                <p>&copy; 2024 Smartphone Recommendations, All Rights Reserved.</p>
            </div>
        </div>
    </body>
    </html>
    """