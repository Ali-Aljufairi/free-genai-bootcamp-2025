# ShopGenie 🛒

ShopGenie is an AI-powered shopping assistant that helps users make informed purchasing decisions.

## Overview

ShopGenie uses LangGraph and AI to provide a decisive shopping experience. It searches the web for product information, analyzes and compares products, and recommends the best option based on your requirements.

## Features

- 🔍 **Web Search**: Uses Tavily to search for products based on your query
- 🤖 **Product Analysis**: Uses LLaMA-3.1-70B to extract and analyze product information
- 📊 **Product Comparison**: Compares specifications, ratings, and reviews of products
- 🏆 **Best Product Selection**: Identifies the best product with detailed justification
- 📹 **YouTube Reviews**: Provides YouTube video reviews of the recommended product
- 📧 **Email Updates**: Sends detailed comparison and recommendation to your email

## Architecture

ShopGenie is built using:

- **LangGraph**: For orchestrating the workflow
- **Groq**: For accessing the LLaMA-3.1-70B model
- **Tavily**: For web search
- **YouTube API**: For finding video reviews
- **Streamlit**: For the user interface

The application follows a modular design with clear separation of concerns:

```
shopgenie/
├── config.py           # Configuration and environment settings
├── graph.py            # LangGraph workflow definition
├── models/
│   └── schemas.py      # Pydantic models and schemas
├── nodes/
│   ├── search.py       # Tavily search node
│   ├── mapping.py      # Schema mapping node
│   ├── comparison.py   # Product comparison node
│   ├── youtube.py      # YouTube review node
│   ├── display.py      # Display node
│   └── email.py        # Email node
└── utils/
    ├── email_utils.py  # Email functionality
    └── web_utils.py    # Functions for loading web content
```

## Setup

### Prerequisites

- Python 3.8+
- API keys for:
  - Groq (LLM)
  - Tavily (web search)
  - YouTube API (video search)
  - Gmail account (for sending emails)

### Installation

1. Clone the repository:
   ```bash
   git clone https://github.com/yourusername/shopgenie.git
   cd shopgenie
   ```

2. Install dependencies:
   ```bash
   pip install -r requirements.txt
   ```

3. Create a `.env` file with your API keys:
   ```
   GROQ_API_KEY=your_groq_api_key
   TAVILY_API_KEY=your_tavily_api_key
   YOUTUBE_API_KEY=your_youtube_api_key
   GMAIL_USER=your_gmail_address
   GMAIL_PASS=your_gmail_app_password
   ```

## Usage

Run the Streamlit web application:

```bash
streamlit run main.py
```

This will open a web interface where you can:
1. Enter your product search query
2. Provide your email address for detailed results
3. View the analysis and recommendations in real-time
4. Receive a comparison email with additional details

## Example Queries

- "Best smartphones under $1000"
- "Most reliable laptops for programming"
- "Top noise-canceling headphones for travel"
- "Best 4K TVs under $800"

## License
