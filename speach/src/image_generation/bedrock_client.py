"""
Image generation service using Amazon Bedrock Titan Image Generator.
"""

import json
import base64
import random
import boto3
from PIL import Image
import io

from ..utils.logger import get_logger
from ..utils.config import BEDROCK_IMAGE_MODEL, IMAGE_DIR
from ..utils.helpers import generate_unique_filename

logger = get_logger("image_generation.bedrock")


class BedrockImageGenerator:
    """Client for Amazon Bedrock Titan Image Generator."""

    def __init__(
        self, model_id="amazon.titan-image-generator-v1", region_name="us-east-1"
    ):
        """
        Initialize the Bedrock client for Titan Image Generator.

        Args:
            model_id (str): Bedrock model ID to use (default is Titan Image Generator)
            region_name (str): AWS Region name
        """
        self.model_id = model_id
        self.region_name = region_name

        logger.debug(
            f"Initializing BedrockImageGenerator with model: {model_id} in region: {region_name}"
        )

        try:
            # Create a Bedrock Runtime client in the specified AWS Region
            self.client = boto3.client(
                service_name="bedrock-runtime", region_name=region_name
            )
            logger.info("Bedrock client initialized successfully")
        except Exception as e:
            logger.error(f"Failed to initialize Bedrock client: {str(e)}")
            raise

    def generate_image(
        self, prompt, height=512, width=512, cfg_scale=8.0, quality="standard"
    ):
        """
        Generate an image using Amazon Titan Image Generator based on the provided prompt.

        Args:
            prompt (str): Text prompt describing the image to generate
            height (int): Image height
            width (int): Image width
            cfg_scale (float): CFG scale parameter (how strictly to follow the prompt)
            quality (str): Quality setting for the image generation

        Returns:
            tuple: (PIL.Image object, path to saved image)
        """
        logger.info(f"Generating image for prompt: {prompt[:50]}...")

        # Generate a random seed
        seed = random.randint(0, 2147483647)

        # Format the request payload using the model's native structure
        native_request = {
            "taskType": "TEXT_IMAGE",
            "textToImageParams": {"text": prompt},
            "imageGenerationConfig": {
                "numberOfImages": 1,
                "quality": quality,
                "cfgScale": cfg_scale,
                "height": height,
                "width": width,
                "seed": seed,
            },
        }

        # Convert the native request to JSON
        request = json.dumps(native_request)

        logger.debug(f"Bedrock request parameters: {native_request}")

        try:
            # Invoke the model with the request
            response = self.client.invoke_model(modelId=self.model_id, body=request)

            # Decode the response body
            model_response = json.loads(response["body"].read())

            # Extract the image data
            base64_image_data = model_response["images"][0]

            # Decode the base64 image
            image_data = base64.b64decode(base64_image_data)
            image = Image.open(io.BytesIO(image_data))

            # Save the image
            filename = generate_unique_filename(prefix="titan_", extension="png")
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
