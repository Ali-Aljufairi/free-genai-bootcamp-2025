"""
Image generation service using Amazon Bedrock.
"""
import json
import base64
from pathlib import Path
import boto3
from PIL import Image
import io

from ..utils.logger import get_logger
from ..utils.config import (
    AWS_ACCESS_KEY_ID,
    AWS_SECRET_ACCESS_KEY,
    AWS_REGION,
    BEDROCK_IMAGE_MODEL,
    IMAGE_DIR
)
from ..utils.helpers import generate_unique_filename

logger = get_logger("image_generation.bedrock")

class BedrockImageGenerator:
    """Client for Amazon Bedrock image generation services."""
    
    def __init__(
        self, 
        model_id=BEDROCK_IMAGE_MODEL,
        aws_access_key_id=None,
        aws_secret_access_key=None,
        region_name=None
    ):
        """
        Initialize the Bedrock client.
        
        Args:
            model_id (str): Bedrock model ID to use
            aws_access_key_id (str, optional): AWS access key ID
            aws_secret_access_key (str, optional): AWS secret access key
            region_name (str, optional): AWS region name
        """
        self.aws_access_key_id = aws_access_key_id or AWS_ACCESS_KEY_ID
        self.aws_secret_access_key = aws_secret_access_key or AWS_SECRET_ACCESS_KEY
        self.region_name = region_name or AWS_REGION
        self.model_id = model_id
        
        if not all([self.aws_access_key_id, self.aws_secret_access_key, self.region_name]):
            logger.error("AWS credentials or region not provided")
            raise ValueError("AWS credentials are required for Bedrock")
        
        logger.debug(f"Initializing BedrockImageGenerator with model: {model_id}")
        
        try:
            self.bedrock_runtime = boto3.client(
                service_name='bedrock-runtime',
                aws_access_key_id=self.aws_access_key_id,
                aws_secret_access_key=self.aws_secret_access_key,
                region_name=self.region_name
            )
            logger.info("Bedrock client initialized successfully")
        except Exception as e:
            logger.error(f"Failed to initialize Bedrock client: {str(e)}")
            raise
    
    def generate_image(self, prompt, height=512, width=512, cfg_scale=7, steps=30):
        """
        Generate an image based on the provided prompt.
        
        Args:
            prompt (str): Text prompt describing the image to generate
            height (int): Image height
            width (int): Image width
            cfg_scale (int): CFG scale parameter (how strictly to follow the prompt)
            steps (int): Number of diffusion steps
            
        Returns:
            tuple: (PIL.Image object, path to saved image)
        """
        logger.info(f"Generating image for prompt: {prompt[:50]}...")
        
        if "stability" in self.model_id:
            # For Stability AI models like Stable Diffusion
            request_body = {
                "text_prompts": [
                    {
                        "text": prompt,
                        "weight": 1.0
                    }
                ],
                "height": height,
                "width": width,
                "cfg_scale": cfg_scale,
                "steps": steps
            }
        else:
            # For other models, use a generic format
            # This can be extended for other specific models
            request_body = {
                "prompt": prompt,
                "height": height,
                "width": width,
                "num_steps": steps
            }
            
        logger.debug(f"Bedrock request parameters: {request_body}")
            
        try:
            response = self.bedrock_runtime.invoke_model(
                modelId=self.model_id,
                body=json.dumps(request_body)
            )
            
            response_body = json.loads(response.get('body').read())
            
            if "stability" in self.model_id:
                # For Stability AI models
                base64_image = response_body["artifacts"][0]["base64"]
            else:
                # Generic handling
                base64_image = response_body.get("image", response_body.get("base64"))
                
            if not base64_image:
                logger.error("No image data found in response")
                raise ValueError("No image data in response")
                
            # Decode the base64 image
            image_data = base64.b64decode(base64_image)
            image = Image.open(io.BytesIO(image_data))
            
            # Save the image
            filename = generate_unique_filename(prefix="bedrock_image", extension="png")
            image_path = IMAGE_DIR / filename
            image.save(image_path)
            
            logger.info(f"Image saved to {image_path}")
            return image, str(image_path)
            
        except Exception as e:
            logger.error(f"Error generating image: {str(e)}")
            raise
            
    def generate_image_from_transcript(self, transcript, style="realistic photo"):
        """
        Generate an image based on the content of a transcript.
        
        Args:
            transcript (str): Transcript text to visualize
            style (str): Style description for the image
            
        Returns:
            tuple: (PIL.Image object, path to saved image)
        """
        # Extract key phrases or concepts from the transcript
        # For simplicity, we'll use the first 100 characters
        key_content = transcript[:100] if len(transcript) > 100 else transcript
        
        prompt = f"Create a visualization of: '{key_content}'. Style: {style}"
        logger.info(f"Generated image prompt from transcript: {prompt[:50]}...")
        
        return self.generate_image(prompt)