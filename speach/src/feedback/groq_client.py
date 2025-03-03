"""
Feedback service using Groq's language models.
"""
from groq import Groq
from ..utils.logger import get_logger
from ..utils.config import GROQ_API_KEY, GROQ_MODEL

logger = get_logger("feedback.groq")

class GroqClient:
    """Client for Groq's language model services."""
    
    def __init__(self, api_key=None, model=GROQ_MODEL):
        """
        Initialize the Groq client.
        
        Args:
            api_key (str, optional): Groq API key. Defaults to value from config.
            model (str, optional): Model name to use. Defaults to value from config.
        """
        self.api_key = api_key or GROQ_API_KEY
        if not self.api_key:
            logger.error("Groq API key is not set")
            raise ValueError("Groq API key is required")
        
        self.model = model
        logger.debug(f"Initializing GroqClient with model: {model}")
        self.client = Groq(api_key=self.api_key)
    
    def get_response(self, prompt, max_tokens=1000):
        """
        Get a response from the Groq model.
        
        Args:
            prompt (str): The prompt to send to the model
            max_tokens (int): Maximum number of tokens in the response
            
        Returns:
            str: Model's response text
        """
        logger.info(f"Sending request to Groq model: {self.model}")
        logger.debug(f"Prompt: {prompt[:50]}...")
        
        try:
            response = self.client.chat.completions.create(
                model=self.model,
                messages=[{"role": "user", "content": prompt}],
                max_tokens=max_tokens
            )
            
            response_text = response.choices[0].message.content
            logger.info("Received response from Groq")
            logger.debug(f"Response: {response_text[:50]}...")
            return response_text
        
        except Exception as e:
            logger.error(f"Error getting response from Groq: {str(e)}")
            raise
    
    def analyze_japanese_sentence(self, transcript):
        """
        Analyze Japanese sentence structure in the transcript.
        
        Args:
            transcript (str): Japanese transcript to analyze
            
        Returns:
            dict: Analysis result with feedback and corrections
        """
        logger.info("Analyzing Japanese sentence structure")
        
        from ..prompts.feedback_prompts import JAPANESE_ANALYSIS_PROMPT
        
        # Format the prompt with the transcript
        prompt = JAPANESE_ANALYSIS_PROMPT.format(transcript=transcript)
        
        try:
            response = self.get_response(prompt)
            
            # For simplicity, we're returning the raw response
            # In a production app, you might want to parse this into a structured format
            return {
                "raw_feedback": response,
                "transcript": transcript
            }
        except Exception as e:
            logger.error(f"Error analyzing Japanese sentence: {str(e)}")
            raise