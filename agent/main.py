#!/usr/bin/env python3
"""
ShopGenie - AI-powered shopping assistant
Main application entry point
"""
import argparse
import os
from dotenv import load_dotenv

from graph import run_shopgenie, create_shopgenie_graph, visualize_graph

def parse_arguments():
    """Parse command line arguments."""
    parser = argparse.ArgumentParser(description='ShopGenie - AI-powered shopping assistant')
    
    subparsers = parser.add_subparsers(dest='command', help='Command to run')
    
    # Search command
    search_parser = subparsers.add_parser('search', help='Search for products')
    search_parser.add_argument('query', type=str, help='Search query (e.g., "Best smartphones under $1000")')
    search_parser.add_argument('email', type=str, help='Email address to send results to')
    
    # Visualize command
    subparsers.add_parser('visualize', help='Visualize the workflow graph')
    
    return parser.parse_args()

def main():
    """Main application entry point."""
    # Load environment variables
    load_dotenv()
    
    # Check if required API keys are set
    required_keys = ['GROQ_API_KEY', 'TAVILY_API_KEY', 'YOUTUBE_API_KEY']
    missing_keys = [key for key in required_keys if not os.environ.get(key)]
    if missing_keys:
        print(f"Error: Missing required API keys: {', '.join(missing_keys)}")
        print("Please set these environment variables in a .env file or directly in your environment.")
        return
    
    # Parse command line arguments
    args = parse_arguments()
    
    # Execute the appropriate command
    if args.command == 'search':
        print(f"Searching for: {args.query}")
        print(f"Results will be sent to: {args.email}")
        results = run_shopgenie(args.query, args.email)
        
        if results:
            best_product = results.get('best_product', {})
            if best_product:
                print("\n==== SEARCH RESULTS ====")
                print(f"Best Product: {best_product.get('product_name')}")
                print(f"Justification: {best_product.get('justification')}")
                youtube_link = results.get('youtube_link')
                if youtube_link:
                    print(f"YouTube Review: {youtube_link}")
                print("\nDetailed results and comparisons have been sent to your email.")
        
    elif args.command == 'visualize':
        graph = create_shopgenie_graph()
        image = visualize_graph(graph)
        # Save the visualization to a file
        with open('shopgenie_graph.png', 'wb') as f:
            f.write(image.data)
        print("Graph visualization saved as 'shopgenie_graph.png'")
    
    else:
        print("Please specify a command. Run with --help for more information.")

if __name__ == "__main__":
    main()
