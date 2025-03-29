"""
Utilities package for ShopGenie application
"""

from config import DEBUG


def log(message):
    """
    Conditionally print log messages based on DEBUG setting.

    Args:
        message: The message to log
    """
    if DEBUG:
        print(message)
