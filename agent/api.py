#!/usr/bin/env python3
"""
ShopGenie - AI-powered shopping assistant
FastAPI implementation
"""
from fastapi import FastAPI, HTTPException, BackgroundTasks
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field

from graph import run_shopgenie
from config import GROQ_API_KEY, TAVILY_API_KEY, YOUTUBE_API_KEY

# Initialize FastAPI app
api = FastAPI(
    title="ShopGenie API",
    description="API for AI-powered shopping assistant",
    version="1.0.0"
)

# Add CORS middleware
api.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # In production, replace with specific origins
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Check if required API keys are set
def check_api_keys():
    """Check if required API keys are set."""
    api_keys = {
        'GROQ_API_KEY': GROQ_API_KEY,
        'TAVILY_API_KEY': TAVILY_API_KEY, 
        'YOUTUBE_API_KEY': YOUTUBE_API_KEY
    }
    missing_keys = [key for key, value in api_keys.items() if not value]
    return missing_keys

# Basic email validation function
def is_valid_email(email: str) -> bool:
    """Simple email validation using basic pattern check."""
    import re
    pattern = r'^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$'
    return bool(re.match(pattern, email))

# Input models
class SearchRequest(BaseModel):
    query: str = Field(..., description="What are you looking for?", example="Best smartphones under $1000")
    email: str = Field(..., description="Email to send results to", example="user@example.com")

# Response models
class SearchResponse(BaseModel):
    status: str = Field(default="success")
    message: str = Field(default="Your search is being processed. Results will be sent to your email.")
    request_id: str = Field(default="")

# Background task to run the search
def process_search_in_background(query: str, email: str):
    """Run the ShopGenie workflow in the background."""
    run_shopgenie(query, email)

@api.get("/")
async def root():
    """Health check endpoint."""
    return {"status": "online", "service": "ShopGenie API"}

@api.post("/search", response_model=SearchResponse)
async def search(request: SearchRequest, background_tasks: BackgroundTasks):
    """
    Endpoint to search for products and send results via email.
    The response will be minimal while processing happens in the background.
    """
    # Check if required API keys are set
    missing_keys = check_api_keys()
    if missing_keys:
        raise HTTPException(status_code=500, detail=f"Missing required API keys: {', '.join(missing_keys)}")
    
    # Validate request
    if not request.query:
        raise HTTPException(status_code=400, detail="Search query cannot be empty")
    
    # Validate email format
    if not is_valid_email(request.email):
        raise HTTPException(status_code=400, detail="Invalid email format")
    
    # Run the search in the background and send email
    background_tasks.add_task(process_search_in_background, request.query, request.email)
    
    # Return a minimal response
    return SearchResponse(
        status="success",
        message=f"Your search for '{request.query}' is being processed. Results will be sent to {request.email}",
        request_id=f"{hash(request.query + request.email)}"  # Simple request ID
    )

@api.post("/search/full")
async def search_with_full_response(request: SearchRequest):
    """
    Endpoint to search for products and return the full result data.
    This is a synchronous endpoint that will return the complete result data.
    """
    # Check if required API keys are set
    missing_keys = check_api_keys()
    if missing_keys:
        raise HTTPException(status_code=500, detail=f"Missing required API keys: {', '.join(missing_keys)}")
    
    # Validate request
    if not request.query:
        raise HTTPException(status_code=400, detail="Search query cannot be empty")
    
    # Validate email format
    if not is_valid_email(request.email):
        raise HTTPException(status_code=400, detail="Invalid email format")
    
    try:
        # Run the search and get the full result
        result = run_shopgenie(request.query, request.email)
        
        # Return the full result data
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error processing request: {str(e)}")