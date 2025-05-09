import logging

class ErrorLogger:
    def __init__(self):
        self.logger = logging.getLogger('ErrorLogger')
        handler = logging.FileHandler('./logs/error.log')
        formatter = logging.Formatter('%(asctime)s - %(levelname)s - %(message)s')
        handler.setFormatter(formatter)
        self.logger.addHandler(handler)
        self.logger.setLevel(logging.ERROR)

    def log_error(self, message):
        self.logger.error(message)