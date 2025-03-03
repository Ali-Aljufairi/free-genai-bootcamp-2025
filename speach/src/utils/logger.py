"""
Logger utility for the Speech application.
"""

import sys
from loguru import logger
from .config import LOG_FILE

# Configure Loguru logger
logger.remove()  # Remove default handlers

# Add console handler
logger.add(
    sys.stderr,
    format="<green>{time:YYYY-MM-DD HH:mm:ss}</green> | <level>{level: <8}</level> | <cyan>{name}</cyan>:<cyan>{function}</cyan>:<cyan>{line}</cyan> - <level>{message}</level>",
    level="INFO",
)

# Add file handler
logger.add(
    LOG_FILE,
    rotation="10 MB",
    retention="1 month",
    format="{time:YYYY-MM-DD HH:mm:ss} | {level: <8} | {name}:{function}:{line} - {message}",
    level="DEBUG",
)


def get_logger(name):
    """
    Get a logger instance with the given name.
    Args:
        name: The name of the module using the logger.
    Returns:
        A logger instance.
    """
    return logger.bind(name=name)
