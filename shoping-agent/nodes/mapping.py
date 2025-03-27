"""
Schema mapping node for ShopGenie.
"""

import time
from langchain_core.output_parsers import JsonOutputParser
from langchain_core.prompts import PromptTemplate

from config import llm
from models.schemas import State, ListOfSmartphoneReviews, ProductComparison
from utils.prompt_templates import (
    SCHEMA_MAPPING_TEMPLATE,
    PRODUCT_COMPARISON_DETAILED_TEMPLATE,
)

import json


def schema_mapping_node(state: State):
    max_retries = 5  # Maximum number of retries
    wait_time = 20  # Wait time in seconds between retries (1 minute)
    try:
        # Check if "blogs_content" exists in the state and is not empty
        if "blogs_content" in state and state["blogs_content"]:
            # Extract blog content from the state
            blogs_content = state["blogs_content"]

            # Set up a parser for structured output
            parser = JsonOutputParser(pydantic_object=ListOfSmartphoneReviews)

            # Format the prompt with the blogs content and format instructions
            prompt = PromptTemplate(
                template=SCHEMA_MAPPING_TEMPLATE,
                input_variables=["blogs_content"],
                partial_variables={
                    "format_instructions": parser.get_format_instructions()
                },
            )

            # Retry mechanism to invoke LLM and parse the response
            for attempt in range(1, max_retries + 1):
                try:
                    # Use LLM to process the prompt and return structured smartphone details
                    chain = (
                        prompt | llm | parser
                    )  # Invokes LLM with the prepared prompt
                    response = chain.invoke({"blogs_content": blogs_content})

                    # Check if the response contains reviews as expected from ListOfSmartphoneReviews schema
                    if (
                        response
                        and "reviews" in response
                        and len(response["reviews"]) > 1
                    ):
                        # Store the structured schema in the state but map to product_schema
                        return {"product_schema": response["reviews"]}
                    else:
                        print(
                            f"Attempt {attempt} failed: Product schema has one or fewer products or wrong format."
                        )

                except Exception as retry_exception:
                    print(f"Retry {attempt} error: {retry_exception}")

                # Wait before retrying if not successful and retry limit not reached
                if attempt < max_retries:
                    time.sleep(wait_time)

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

            parser = JsonOutputParser(pydantic_object=ProductComparison)

            # Format the prompt with the product data and format instructions
            prompt = PromptTemplate(
                template=PRODUCT_COMPARISON_DETAILED_TEMPLATE,
                input_variables=["product_data"],
                partial_variables={
                    "format_instructions": parser.get_format_instructions()
                },
            )

            # Use LLM to process the prompt and return structured comparison
            chain = prompt | llm | parser
            response = chain.invoke(
                {"product_data": json.dumps(state["product_schema"])}
            )

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
