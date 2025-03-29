"""
LangGraph workflow definition for ShopGenie.
"""

from langgraph.graph import StateGraph, START, END
from IPython.display import Image

from models.schemas import State
from nodes.search import tavily_search_node
from nodes.mapping import schema_mapping_node
from nodes.comparison import product_comparison_node
from nodes.youtube import youtube_review_node
from nodes.display import display_node
from nodes.email import send_email_node


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


def create_shopgenie_api_graph():
    """
    Create and compile a modified ShopGenie workflow graph for API use.
    This version doesn't include the email sending node.

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

    # Define edges to control flow between nodes
    builder.add_edge(START, "tavily_search")
    builder.add_edge("tavily_search", "schema_mapping")
    builder.add_edge("schema_mapping", "product_comparison")
    builder.add_edge("product_comparison", "youtube_review")
    builder.add_edge("youtube_review", "display")
    builder.add_edge("display", END)

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
        # print(event)
        result = event

    return result


def run_shopgenie_api(query, email):
    """
    Run the ShopGenie workflow with the given query and return all data directly.
    This version doesn't send emails but returns complete data for API response.

    Args:
        query (str): The search query for ShopGenie
        email (str): The email to use for data tracking

    Returns:
        dict: The complete workflow data including search results, comparisons, and recommendations
        without blog content to reduce response size
    """
    graph = create_shopgenie_api_graph()

    # Initialize state
    initial_state = {"query": query, "email": email}

    # Track all state updates
    complete_data = {}

    # Execute the graph
    for event in graph.stream(input=initial_state, stream_mode="updates"):
        # Update our complete data with the latest state but filter out blog content
        filtered_event = {}
        for key, value in event.items():
            # Skip blog content which can be very large
            if key == "search_results":
                # For search results, we want to keep essential data but remove blog content
                filtered_results = []
                for result in value:
                    # Create a copy of the result with shortened content
                    filtered_result = result.copy()
                    # Truncate or remove content field which can be very large
                    if "content" in filtered_result:
                        # Just keep a short snippet or remove entirely
                        filtered_result["content"] = (
                            filtered_result["content"][:200] + "..."
                            if filtered_result["content"]
                            else ""
                        )
                    filtered_results.append(filtered_result)
                filtered_event[key] = filtered_results
            else:
                filtered_event[key] = value

        # Update our complete data with filtered event
        complete_data.update(filtered_event)

    return complete_data
