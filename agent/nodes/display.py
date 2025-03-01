"""
Display node for ShopGenie.
"""
from models.schemas import State

def display_node(state: State):
    """
    Format and display the final results.
    
    Args:
        state: The current state
        
    Returns:
        dict: Final result data with products, best product, comparison, and YouTube link
    """
    if "comparison" in state and state['comparison']:
        return {
            "products": state["product_schema"],
            "best_product": state["best_product"],
            "comparison": state["comparison"],
            "youtube_link": state["youtube_link"]
        }
    else:
        print("Comparison not available")
        return state