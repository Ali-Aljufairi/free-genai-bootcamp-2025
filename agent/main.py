#!/usr/bin/env python3
"""
ShopGenie - AI-powered shopping assistant
Streamlit web application
"""
import os
import streamlit as st
from dotenv import load_dotenv

from graph import run_shopgenie, create_shopgenie_graph, visualize_graph

def check_api_keys():
    """Check if required API keys are set."""
    required_keys = ['GROQ_API_KEY', 'TAVILY_API_KEY', 'YOUTUBE_API_KEY']
    missing_keys = [key for key in required_keys if not os.environ.get(key)]
    return missing_keys

def main():
    """Main Streamlit application."""
    # Load environment variables
    load_dotenv()
    
    # Set up page configuration
    st.set_page_config(
        page_title="ShopGenie - AI Shopping Assistant",
        page_icon="🛒",
        layout="wide"
    )
    
    # Application header
    st.title("🛒 ShopGenie")
    st.subheader("AI-powered shopping assistant")
    st.write("ShopGenie helps you find the best products tailored to your needs using the power of AI.")
    
    # Check if required API keys are set
    missing_keys = check_api_keys()
    if missing_keys:
        st.error(f"Missing required API keys: {', '.join(missing_keys)}")
        st.info("Please set these environment variables in a .env file or directly in your environment.")
        return
    
    # Sidebar
    with st.sidebar:
        st.header("About")
        st.write("""
        ShopGenie uses AI to search for products, compare them,
        and recommend the best option based on your requirements.
        """)
        
        st.header("Features")
        st.write("- 🔍 Web search with Tavily")
        st.write("- 🤖 LLM-powered product analysis")
        st.write("- 📊 Detailed product comparisons")
        st.write("- 📹 YouTube review recommendations")
        st.write("- 📧 Email results directly to you")
        
        if st.button("View Workflow Graph"):
            with st.spinner("Generating graph visualization..."):
                graph = create_shopgenie_graph()
                st.image(graph.get_graph().draw_mermaid_png(), 
                         caption="ShopGenie Workflow", 
                         use_column_width=True)
    
    # Main content - Search form
    st.header("Find Your Perfect Product")
    
    with st.form("search_form"):
        query = st.text_input(
            "What are you looking for?", 
            placeholder="e.g., Best smartphones under $1000",
            help="Be specific about your requirements and budget"
        )
        
        email = st.text_input(
            "Email address",
            placeholder="your@email.com",
            help="Results will be sent to this address"
        )
        
        submit_button = st.form_submit_button("🔍 Search")
    
    # Handle form submission
    if submit_button:
        if not query:
            st.error("Please enter a search query.")
            return
            
        if not email or '@' not in email:
            st.error("Please enter a valid email address.")
            return
        
        # Show progress
        progress_container = st.container()
        
        with st.spinner("ShopGenie is searching for products..."):
            progress_container.write("🔍 Searching the web...")
            
            # Run the ShopGenie workflow
            result = None
            for event in create_shopgenie_graph().stream(
                input={"query": query, "email": email}, 
                stream_mode="updates"
            ):
                # Update progress based on the current step
                if 'tavily_search' in event:
                    progress_container.write("📝 Extracting product information...")
                elif 'schema_mapping' in event:
                    progress_container.write("⚖️ Analyzing and comparing products...")
                elif 'product_comparison' in event:
                    progress_container.write("🎯 Finding the best match...")
                elif 'youtube_review' in event:
                    progress_container.write("📹 Searching for video reviews...")
                elif 'send_email' in event:
                    progress_container.write("📧 Sending detailed results to your email...")
                
                result = event
        
        # Display results
        if result and 'best_product' in result:
            best_product = result['best_product']
            
            st.success("✅ Search completed!")
            
            st.header("Best Product Recommendation")
            st.subheader(best_product.get('product_name'))
            st.write(best_product.get('justification'))
            
            # Show YouTube link if available
            youtube_link = result.get('youtube_link')
            if youtube_link:
                st.subheader("Video Review")
                st.video(youtube_link)
            
            # Show comparison table
            if 'comparison' in result and result['comparison']:
                st.header("Product Comparison")
                
                # Create comparison dataframe
                import pandas as pd
                comparison_data = {}
                
                for product in result['comparison']:
                    product_name = product['product_name']
                    
                    # Add processor info
                    comparison_data.setdefault('Processor', {})[product_name] = product['specs_comparison']['processor']
                    
                    # Add camera info
                    comparison_data.setdefault('Camera', {})[product_name] = product['specs_comparison']['camera']
                    
                    # Add display info
                    comparison_data.setdefault('Display', {})[product_name] = product['specs_comparison']['display']
                    
                    # Add ratings
                    for rating_key, rating_val in product['ratings_comparison'].items():
                        comparison_data.setdefault(f"Rating: {rating_key.replace('_', ' ').title()}", {})[product_name] = f"{rating_val}/5"
                
                # Convert to DataFrame for display
                df = pd.DataFrame(comparison_data)
                st.dataframe(df.T, use_container_width=True)
            
            st.info("📧 Detailed results and comparison have been sent to your email.")

if __name__ == "__main__":
    main()
