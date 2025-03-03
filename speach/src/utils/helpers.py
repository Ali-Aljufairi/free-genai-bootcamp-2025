"""
Helper functions for the Speech application.
"""
import os
import uuid
import datetime
from pathlib import Path
from .logger import get_logger

logger = get_logger("helpers")

def generate_unique_filename(prefix="", suffix="", extension=""):
    """
    Generate a unique filename with timestamp and UUID.
    
    Args:
        prefix (str): Optional prefix for the filename
        suffix (str): Optional suffix for the filename
        extension (str): File extension (without dot)
        
    Returns:
        str: Unique filename
    """
    timestamp = datetime.datetime.now().strftime("%Y%m%d_%H%M%S")
    unique_id = str(uuid.uuid4())[:8]
    
    filename_parts = []
    if prefix:
        filename_parts.append(prefix)
    
    filename_parts.append(timestamp)
    filename_parts.append(unique_id)
    
    if suffix:
        filename_parts.append(suffix)
    
    filename = "_".join(filename_parts)
    
    if extension:
        if not extension.startswith("."):
            extension = f".{extension}"
        filename = f"{filename}{extension}"
    
    logger.debug(f"Generated unique filename: {filename}")
    return filename

def ensure_dir_exists(directory):
    """
    Ensure the given directory exists.
    
    Args:
        directory (str or Path): Directory path to create
        
    Returns:
        Path: Path object of the created directory
    """
    dir_path = Path(directory)
    os.makedirs(dir_path, exist_ok=True)
    logger.debug(f"Ensured directory exists: {dir_path}")
    return dir_path

def safe_delete_file(file_path):
    """
    Safely delete a file if it exists.
    
    Args:
        file_path (str or Path): Path to the file to delete
        
    Returns:
        bool: True if file was deleted, False otherwise
    """
    path = Path(file_path)
    if path.exists() and path.is_file():
        try:
            path.unlink()
            logger.debug(f"Deleted file: {path}")
            return True
        except Exception as e:
            logger.error(f"Failed to delete file {path}: {str(e)}")
            return False
    logger.debug(f"File not found for deletion: {path}")
    return False