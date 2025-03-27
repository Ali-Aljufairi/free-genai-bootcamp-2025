"""
Display node for ShopGenie.
"""
import streamlit as st
from models.schemas import State
from utils.streamlit_utils import display_streamlit_app
from utils.storage_utils import store_output

def display_node(state: State):
    """
    Format and display the final results using Streamlit.
    
    Args:
        state: The current state
        
    Returns:
        dict: Final result data with products, best product, comparison, and YouTube link
    """
    if "comparison" in state and state['comparison']:
        # Prepare result data
        result_data = {
            "products": state["product_schema"],
            "best_product": state["best_product"],
            "comparison": state["comparison"],
            "youtube_link": state["youtube_link"]
        }
        
        # Store comparison data for reference
        if "email" in state:
            stored_file_path = store_output(
                result_data, 
                state["email"], 
                output_type="comparison_data"
            )
            print(f"Comparison data stored at: {stored_file_path}")
        
        # Display the data in Streamlit
        display_streamlit_app(result_data)
        
        return result_data
    else:
        print("Comparison not available")
        return state