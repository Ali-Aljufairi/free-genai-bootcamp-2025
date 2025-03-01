"""
Utility functions for web content loading.
"""
from langchain_community.document_loaders import WebBaseLoader

def load_blog_content(page_url):
    """
    Load content from a specific URL.
    
    Args:
        page_url (str): The URL to load content from
        
    Returns:
        str: The extracted content or empty string if failed
    """
    try:
        # Initialize WebBaseLoader with the URL
        loader = WebBaseLoader(
            web_paths=[page_url], 
            bs_get_text_kwargs={"separator": " ", "strip": True}
        )
        loaded_content = loader.load()

        # Extract full text from loaded content
        blog_content = " ".join([doc.page_content for doc in loaded_content])
        return blog_content

    except Exception as e:
        print(f"Error loading blog content from URL {page_url}: {e}")
        return ""