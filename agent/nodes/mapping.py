"""
Schema mapping node for ShopGenie.
"""
import time
from langchain_core.output_parsers import JsonOutputParser
from langchain_core.prompts import PromptTemplate

from config import llm
from models.schemas import State, ListOfSmartphoneReviews, ProductComparison

import json


def schema_mapping_node(state: State):
    max_retries = 3  # Maximum number of retries
    wait_time = 60  # Wait time in seconds between retries (1 minute)
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

After extracting all information, just return the response in the JSON structure given below. Do not add any extracted information. The JSON should be in a valid structure with no extra characters inside, like Python’s \n.


"""
            # Set up a parser and inject instructions into the prompt template.
            parser = JsonOutputParser(pydantic_object=ListOfSmartphoneReviews)
            # Format the prompt with the full blogs content
            prompt = PromptTemplate(
                template=prompt_template,
                input_variables=["blogs_content"],
                partial_variables={
                    "format_instructions": parser.get_format_instructions()
                },
            )
            # Retry mechanism to invoke LLM and parse the response
            for attempt in range(1, max_retries + 1):
                # try:
                # Use LLM to process the prompt and return structured smartphone details
                chain = prompt | llm | parser  # Invokes LLM with the prepared prompt
                response = chain.invoke({"blogs_content": blogs_content})

                # Check if the response contains more than one product in the schema
                if response.get("products") and len(response["products"]) > 1:
                    # If valid, store the structured schema in the state
                    return {"product_schema": response["products"]}
                else:
                    print(
                        f"Attempt {attempt} failed: Product schema has one or fewer products."
                    )

                # Wait for 1 minute before retrying if not successful and retry limit not reached
                if attempt < max_retries:
                    time.sleep(wait_time)

            # except Exception as retry_exception:
            #     print(f"Retry {attempt} error: {retry_exception}")
            #     if attempt < max_retries:
            #         time.sleep(wait_time)

            # Return an empty schema if all retries fail
            print(
                "All retry attempts failed to create a valid product schema with more than one product."
            )
            return {"product_schema": []}
        else:
            # If "blogs_content" is not present or is empty, log and return state unmodified
            print(
                "No blog content available or content is empty; schema extraction skipped."
            )
            return {"product_schema": []}

    except Exception as e:
        # Error handling to catch any unexpected issues and log the error message
        print(f"Error occurred during schema extraction: {e}")
        return state


# comparing the products
def product_comparison_node(state: State):
    try:
        # Check if "product_schema" is present in the state and is not empty
        if "product_schema" in state and state["product_schema"]:
            product_schema = state["product_schema"]

            prompt_template = """
1. **List of Products for Comparison (`comparisons`):**
   - Each product should include:
     - **Product Name**: The name of the product (e.g., "Smartphone A").
     - **Specs Comparison**:
       - **Processor**: Type and model of the processor (e.g., "Snapdragon 888").
       - **Battery**: Battery capacity and type (e.g., "4500mAh").
       - **Camera**: Camera specifications (e.g., "108MP primary").
       - **Display**: Display type, size, and refresh rate (e.g., "6.5 inch OLED, 120Hz").
       - **Storage**: Storage options and whether it is expandable (e.g., "128GB, expandable").
     - **Ratings Comparison**:
       - **Overall Rating**: Overall rating out of 5 (e.g., 4.5).
       - **Performance**: Rating for performance out of 5 (e.g., 4.7).
       - **Battery Life**: Rating for battery life out of 5 (e.g., 4.3).
       - **Camera Quality**: Rating for camera quality out of 5 (e.g., 4.6).
       - **Display Quality**: Rating for display quality out of 5 (e.g., 4.8).
     - **Reviews Summary**: Summary of key points from user reviews that highlight the strengths and weaknesses of this product.

2. **Best Product Selection (`best_product`):**
   - **Product Name**: Select the best product among the compared items.
   - **Justification**: Provide a brief explanation of why this product is considered the best choice. This should be based on factors such as balanced performance, high user ratings, advanced specifications, or unique features.

---

### Example Output:

```json
{{
  "comparisons": [
    {{
      "product_name": "Smartphone A",
      "specs_comparison": {{
        "processor": "Snapdragon 888",
        "battery": "4500mAh",
        "camera": "108MP primary",
        "display": "6.5 inch OLED, 120Hz",
        "storage": "128GB, expandable"
      }},
      "ratings_comparison": {{
        "overall_rating": 4.5,
        "performance": 4.7,
        "battery_life": 4.3,
        "camera_quality": 4.6,
        "display_quality": 4.8
      }},
      "reviews_summary": "Highly rated for display quality and camera performance, with a strong processor. Battery life is good but may drain faster with heavy use."
    }},
    {{
      "product_name": "Smartphone B",
      "specs_comparison": {{
        "processor": "Apple A15 Bionic",
        "battery": "4000mAh",
        "camera": "12MP Dual",
        "display": "6.1 inch Super Retina XDR, 60Hz",
        "storage": "256GB, non-expandable"
      }},
      "ratings_comparison": {{
        "overall_rating": 4.6,
        "performance": 4.8,
        "battery_life": 4.1,
        "camera_quality": 4.5,
        "display_quality": 4.7
      }},
      "reviews_summary": "Smooth user experience with excellent performance and display. The battery is slightly smaller but generally sufficient for moderate use."
    }}
  ],
  "best_product": {{
    "product_name": "Smartphone A",
    "justification": "Chosen for its high-quality display, strong camera, and balanced performance that meets most user needs."
  }}
}}

```
Here is the product data to analyze:\n
{product_data}

"""
            parser = JsonOutputParser(pydantic_object=ProductComparison)
            # Format the prompt with the full blogs content
            prompt = PromptTemplate(
                template=prompt_template,
                input_variables=["product_data"],
                partial_variables={
                    "format_instructions": parser.get_format_instructions()
                },
            )
            # prompt = prompt_template.format(product_data=json.dumps(state['product_schema']))

            # Use LLM to process the prompt and return structured smartphone details
            chain = prompt | llm | parser  # Invokes LLM with the prepared prompt
            # display(response.content)
            response = chain.invoke(
                {"product_data": json.dumps(state["product_schema"])}
            )

            # print(response['products'])

            return {
                "comparison": response["comparisons"],
                "best_product": response["best_product"],
            }

        else:
            # If "product_schema" is missing or empty, log and skip comparison logic
            print("No product schema available; product comparison skipped.")
            return state

    except Exception as e:
        print(f"Error during product comparison: {e}")
        return {"best_product": {}, "comparison_report": "Comparison failed"}