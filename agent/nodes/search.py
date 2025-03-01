"""
Tavily search node for ShopGenie.
"""
from tavily import TavilyClient
import tavily
from config import tavily_client
from utils.web_utils import load_blog_content
from models.schemas import State

def tavily_search_node(state: State):
    """
    Node function to search with Tavily and store content.
    
    Args:
        state: The current state
        
    Returns:
        dict: Updated state with blog content
    """
    try:
        # Use the user-provided query from the state
        query = state.get('query', state['query'])
        
        # Perform the search with Tavily to retrieve blog links
        response = tavily_client.search(query=query, max_results=1)
        
        if "results" not in response or not response["results"]:
            raise ValueError("No results found for the given query.")
            
        # Initialize an empty list to store each blog's content
        blogs_content = []
        
        # Iterate over the search results
        for blog in response['results']:
            blog_url = blog.get("url", "")
            if blog_url:
                # Load and store content from each URL using WebBaseLoader
                content = load_blog_content(blog_url)
                if content:
                    # Append blog details to blogs_content
                    blogs_content.append({
                        "title": blog.get("title", ""),
                        "url": blog_url,
                        "content": content,  # Use loaded content
                        "score": blog.get("score", "")
                    })

        # Store all blog contents in the state
        if len(blogs_content) > 0:
            print("Extracted Blogs Content:", blogs_content)
            return {"blogs_content": blogs_content}
        else:
            raise ValueError("No blogs content found.")

    except tavily.InvalidAPIKeyError:
        print("Error: Invalid Tavily API key. Please verify your key.")
        return {"blogs_content": []}
    except tavily.UsageLimitExceededError:
        print("Error: Tavily usage limit exceeded. Check your plan or limits.")
        return {"blogs_content": []}
    except Exception as e:
        print(f"Error with Tavily API call: {e}")
        return {"blogs_content": []}