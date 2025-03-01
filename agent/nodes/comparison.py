"""
Product comparison node for ShopGenie.
"""
import json
from langchain_core.output_parsers import JsonOutputParser
from langchain_core.prompts import PromptTemplate

from shopgenie.models.schemas import State, ProductComparison
from shopgenie.config import llm

def product_comparison_node(state: State):
    """
    Compare products and identify the best option.
    
    Args:
        state: The current state
        
    Returns:
        dict: Updated state with comparison and best product data
    """
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

Here is the product data to analyze:
{product_data}

"""
            parser = JsonOutputParser(pydantic_object=ProductComparison)
            
            # Format the prompt with the full product data
            prompt = PromptTemplate(
                template=prompt_template,
                input_variables=["product_data"],
                partial_variables={"format_instructions": parser.get_format_instructions()}
            )

            # Use LLM to process the prompt and return structured comparison
            chain = prompt | llm | parser
            response = chain.invoke({"product_data": json.dumps(state['product_schema'])})

            # Return the comparison results
            return {
                "comparison": response.comparisons,
                "best_product": response.best_product.dict()
            }

        else:
            # If "product_schema" is missing or empty, log and skip comparison logic
            print("No product schema available; product comparison skipped.")
            return state

    except Exception as e:
        print(f"Error during product comparison: {e}")
        return {"best_product": {}, "comparison": []}