"""
Schema mapping node for ShopGenie.
"""
import time
from langchain_core.output_parsers import JsonOutputParser
from langchain_core.prompts import PromptTemplate

from config import llm
from models.schemas import State, ListOfSmartphoneReviews

def schema_mapping_node(state: State):
    """
    Maps values extracted from web search into structured product data.
    
    Args:
        state: The current state
        
    Returns:
        dict: Updated state with structured product schema
    """
    max_retries = 2  # Maximum number of retries
    wait_time = 60   # Wait time in seconds between retries (1 minute)
    
    try:
        # Check if "blogs_content" exists in the state and is not empty
        if "blogs_content" in state and state["blogs_content"]:
            # Extract blog content from the state
            blogs_content = state["blogs_content"]
            
            # Define the prompt
            prompt_template = """
You are a professional assistant tasked with extracting structured information from a blogs.

### Instructions:

1. **Product Details**: For each product mentioned in the blog post, populate the `products` array with structured data for each item, including:
   - `title`: The product name.
   - `url`: Link to the blog post or relevant page.
   - `content`: A concise summary of the product's main features or purpose.
   - `pros`: A list of positive aspects or advantages of the product.if available other wise extract blog content.
   - `cons`: A list of negative aspects or disadvantages.if available other wise extract blog content.
   - `highlights`: A dictionary containing notable features or specifications.if available other wise extract blog content.
   - `score`: A numerical rating score if available; otherwise, use `0.0`.

### Blogs Contents: {blogs_content}

After extracting all information, just return the response in the JSON structure given below. Do not add any extracted information. The JSON should be in a valid structure with no extra characters inside, like Python's \\n.

"""
            # Set up a parser and inject instructions into the prompt template
            parser = JsonOutputParser(pydantic_object=ListOfSmartphoneReviews)
            
            # Format the prompt with the full blogs content
            prompt = PromptTemplate(
                template=prompt_template,
                input_variables=["blogs_content"],
                partial_variables={"format_instructions": parser.get_format_instructions()}
            )
            
            # Retry mechanism to invoke LLM and parse the response
            for attempt in range(1, max_retries + 1):
                # Use LLM to process the prompt and return structured smartphone details
                chain = prompt | llm | parser  # Invokes LLM with the prepared prompt
                response = chain.invoke({"blogs_content": blogs_content})

                # Check if the response contains more than one product in the schema
                if response and hasattr(response, 'reviews') and len(response.reviews) > 1:
                    # If valid, store the structured schema in the state
                    return {"product_schema": response.reviews}
                else:
                    print(f"Attempt {attempt} failed: Product schema has one or fewer products.")

                # Wait before retrying if not successful and retry limit not reached
                if attempt < max_retries:
                    time.sleep(wait_time)

            # Return an empty schema if all retries fail
            print("All retry attempts failed to create a valid product schema with more than one product.")
            return {"product_schema": []}
        else:
            # If "blogs_content" is not present or is empty, log and return state unmodified
            print("No blog content available or content is empty; schema extraction skipped.")
            return {"product_schema": []}

    except Exception as e:
        # Error handling to catch any unexpected issues and log the error message
        print(f"Error occurred during schema extraction: {e}")
        return {"product_schema": []}