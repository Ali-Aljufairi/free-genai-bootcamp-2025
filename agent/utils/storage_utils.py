"""
Storage utilities for ShopGenie application.
"""
import os
import json
import time
from datetime import datetime
from typing import Dict, Any

def ensure_directory_exists(directory_path):
    """Ensures that the specified directory exists, creating it if necessary."""
    if not os.path.exists(directory_path):
        os.makedirs(directory_path)
        print(f"Created directory: {directory_path}")


def store_output(data: Dict[str, Any], email: str, output_type: str = "email") -> str:
    """
    Store the output data in a JSON file.
    
    Args:
        data: The data to store
        email: The user's email address (used for file naming)
        output_type: Type of output (email, comparison, etc.)
        
    Returns:
        str: Path to the stored file
    """
    # Create a timestamp for the filename
    timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
    
    # Sanitize email for filename (replace @ and . with _)
    sanitized_email = email.replace("@", "_at_").replace(".", "_dot_")
    
    # Create the filename
    filename = f"{sanitized_email}_{output_type}_{timestamp}.json"
    
    # Ensure the storage directory exists
    storage_dir = os.path.join(os.path.dirname(os.path.dirname(__file__)), "data", "outputs")
    ensure_directory_exists(storage_dir)
    
    # Full path to the file
    file_path = os.path.join(storage_dir, filename)
    
    # Add timestamp to the data
    data_with_timestamp = {
        "timestamp": int(time.time()),
        "data": data
    }
    
    # Write the data to the file
    with open(file_path, 'w') as f:
        json.dump(data_with_timestamp, f, indent=2)
    
    print(f"Stored {output_type} output to {file_path}")
    return file_path