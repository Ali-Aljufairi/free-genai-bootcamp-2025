import logging
import os
from datetime import datetime

class Logger:
    _instance = None
    _initialized = False

    def __new__(cls):
        if cls._instance is None:
            cls._instance = super(Logger, cls).__new__(cls)
        return cls._instance

    def __init__(self):
        if not Logger._initialized:
            # Create logs directory if it doesn't exist
            log_dir = os.path.join("backend", "logs")
            os.makedirs(log_dir, exist_ok=True)

            # Create log file with timestamp
            timestamp = datetime.now().strftime("%Y%m%d")
            log_file = os.path.join(log_dir, f"app_{timestamp}.log")

            # Configure logging
            logging.basicConfig(
                level=logging.INFO,
                format='%(asctime)s - %(name)s - %(levelname)s - %(message)s',
                handlers=[
                    logging.FileHandler(log_file),
                    logging.StreamHandler()  # This will also print to console
                ]
            )

            self.logger = logging.getLogger('JLPT-App')
            Logger._initialized = True

    def get_logger(self):
        return self.logger

    @staticmethod
    def enable_debug():
        logging.getLogger('JLPT-App').setLevel(logging.DEBUG)

    @staticmethod
    def disable_debug():
        logging.getLogger('JLPT-App').setLevel(logging.INFO) 