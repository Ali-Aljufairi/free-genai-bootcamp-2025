#!/usr/bin/env python3
"""
ShopGenie - AI-powered shopping assistant
FastAPI implementation
"""

from fastapi import FastAPI, HTTPException, BackgroundTasks
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field

from graph import run_shopgenie, run_shopgenie_api
from config import GROQ_API_KEY, TAVILY_API_KEY, YOUTUBE_API_KEY

# Initialize FastAPI app
api = FastAPI(
    title="ShopGenie API",
    description="API for AI-powered shopping assistant",
    version="1.0.0",
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
        "GROQ_API_KEY": GROQ_API_KEY,
        "TAVILY_API_KEY": TAVILY_API_KEY,
        "YOUTUBE_API_KEY": YOUTUBE_API_KEY,
    }
    missing_keys = [key for key, value in api_keys.items() if not value]
    return missing_keys


# Basic email validation functio
def is_valid_email(email: str) -> bool:
    """Simple email validation using basic pattern check."""
    import re

    pattern = r"^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$"
    return bool(re.match(pattern, email))


# Input models
class SearchRequest(BaseModel):
    query: str = Field(
        ...,
        description="What are you looking for?",
        example="Best smartphones under $1000",
    )
    email: str = Field(
        ..., description="Email to send results to", example="user@example.com"
    )


# Response models
class SearchResponse(BaseModel):
    status: str = Field(default="success")
    message: str = Field(
        default="Your search is being processed. Results will be sent to your email."
    )
    request_id: str = Field(default="")


class DirectSearchResponse(BaseModel):
    status: str = Field(default="success")
    data: dict = Field(
        default={},
        description="Complete workflow data including search results, comparisons, and recommendations",
    )


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
        raise HTTPException(
            status_code=500,
            detail=f"Missing required API keys: {', '.join(missing_keys)}",
        )

    # Validate request
    if not request.query:
        raise HTTPException(status_code=400, detail="Search query cannot be empty")

    # Validate email format
    if not is_valid_email(request.email):
        raise HTTPException(status_code=400, detail="Invalid email format")

    # Run the search in the background and send email
    background_tasks.add_task(
        process_search_in_background, request.query, request.email
    )

    # Return a minimal response
    return SearchResponse(
        status="success",
        message=f"Your search for '{request.query}' is being processed. Results will be sent to {request.email}",
        request_id=f"{hash(request.query + request.email)}",  # Simple request ID
    )


@api.post("/search/direct", response_model=DirectSearchResponse)
async def search_direct(request: SearchRequest):
    """
    Endpoint to search for products and return complete results directly in the API response.
    This endpoint doesn't send emails but provides all the data including search results,
    comparisons, and recommendations.

    Note: This is a synchronous endpoint that will process the full workflow and may take
    some time to respond depending on the complexity of the query.
    """
    # Check if required API keys are set
    missing_keys = check_api_keys()
    if missing_keys:
        raise HTTPException(
            status_code=500,
            detail=f"Missing required API keys: {', '.join(missing_keys)}",
        )

    # Validate request
    if not request.query:
        raise HTTPException(status_code=400, detail="Search query cannot be empty")

    # Validate email format (still needed for tracking purposes)
    if not is_valid_email(request.email):
        raise HTTPException(status_code=400, detail="Invalid email format")

    try:
        # Run the search workflow and get complete data
        complete_data = run_shopgenie_api(request.query, request.email)

        # Return the complete data
        return DirectSearchResponse(status="success", data=complete_data)
    except Exception as e:
        raise HTTPException(
            status_code=500, detail=f"Error processing search: {str(e)}"
        )
