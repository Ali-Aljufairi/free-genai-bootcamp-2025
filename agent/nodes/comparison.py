"""
Product comparison node for ShopGenie.
"""

import json
import logging
from langchain_core.output_parsers import JsonOutputParser
from langchain_core.prompts import PromptTemplate

from models.schemas import State, ProductComparison
from utils.prompt_templates import PRODUCT_COMPARISON_TEMPLATE
from config import llm

# Configure logger
logger = logging.getLogger(__name__)
logging.basicConfig(
    level=logging.INFO, format="%(asctime)s - %(name)s - %(levelname)s - %(message)s"
)


def product_comparison_node(state: State):
    """
    Compare products and identify the best option.

    Args:
        state: The current state

    Returns:
        dict: Updated state with comparison and best product data
    """
    try:
        logger.info("Starting product comparison process")
        # Check if "product_schema" is present in the state and is not empty
        if "product_schema" in state and state["product_schema"]:
            product_schema = state["product_schema"]
            logger.info(f"Processing comparison for {len(product_schema)} products")

            parser = JsonOutputParser(pydantic_object=ProductComparison)

            # Format the prompt with the full product data
            prompt = PromptTemplate(
                template=PRODUCT_COMPARISON_TEMPLATE,
                input_variables=["product_data"],
                partial_variables={
                    "format_instructions": parser.get_format_instructions()
                },
            )

            logger.info("Sending product data to LLM for comparison analysis")
            # Use LLM to process the prompt and return structured comparison
            chain = prompt | llm | parser
            response = chain.invoke(
                {"product_data": json.dumps(state["product_schema"])}
            )
            logger.info("Successfully received comparison results from LLM")

            # Return the comparison results - fixing to access response as a dictionary
            return {
                "comparison": response["comparisons"],
                "best_product": response["best_product"],
            }

        else:
            # If "product_schema" is missing or empty, log and skip comparison logic
            logger.warning("No product schema available; product comparison skipped.")
            return state

    except Exception as e:
        logger.error(f"Error during product comparison: {str(e)}", exc_info=True)
        return {"best_product": {}, "comparison": []}
