"""
LangGraph workflow definition for ShopGenie.
"""
from langgraph.graph import StateGraph, START, END
from IPython.display import Image

from shopgenie.models.schemas import State
from shopgenie.nodes.search import tavily_search_node
from shopgenie.nodes.mapping import schema_mapping_node
from shopgenie.nodes.comparison import product_comparison_node
from shopgenie.nodes.youtube import youtube_review_node
from shopgenie.nodes.display import display_node
from shopgenie.nodes.email import send_email_node

def create_shopgenie_graph():
    """
    Create and compile the ShopGenie workflow graph.
    
    Returns:
        object: The compiled LangGraph workflow
    """
    # Build the LangGraph
    builder = StateGraph(State)
    
    # Add nodes
    builder.add_node("tavily_search", tavily_search_node)
    builder.add_node("schema_mapping", schema_mapping_node)
    builder.add_node("product_comparison", product_comparison_node)
    builder.add_node("youtube_review", youtube_review_node)
    builder.add_node("display", display_node)
    builder.add_node("send_email", send_email_node)
    
    # Define edges to control flow between nodes
    builder.add_edge(START, "tavily_search")
    builder.add_edge("tavily_search", "schema_mapping")
    builder.add_edge("schema_mapping", "product_comparison")
    builder.add_edge("product_comparison", "youtube_review")
    builder.add_edge("youtube_review", "display")
    builder.add_edge("display", END)
    builder.add_edge("youtube_review", "send_email")
    builder.add_edge("send_email", END)
    
    # Compile the graph
    graph = builder.compile()
    return graph

def visualize_graph(graph):
    """
    Visualize the graph as a Mermaid diagram.
    
    Args:
        graph: The compiled graph
    
    Returns:
        Image: A visualization of the graph
    """
    return Image(graph.get_graph().draw_mermaid_png())

def run_shopgenie(query, email):
    """
    Run the ShopGenie workflow with the given query.
    
    Args:
        query (str): The search query for ShopGenie
        email (str): The email to send results to
        
    Returns:
        dict: The final state with results
    """
    graph = create_shopgenie_graph()
    
    # Initialize state
    initial_state = {"query": query, "email": email}
    
    # Execute the graph
    result = None
    for event in graph.stream(input=initial_state, stream_mode="updates"):
        print(event)
        result = event
        
    return result