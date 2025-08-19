"""
Logger utility for FlowCraft ML Engine
Centralized logging configuration
"""

import logging
import sys
import json
from datetime import datetime
from typing import Optional, Dict, Any
from pathlib import Path
import os

# JSON formatter for structured logging
class JsonFormatter(logging.Formatter):
    """JSON formatter for structured logging"""
    
    def format(self, record: logging.LogRecord) -> str:
        log_entry = {
            "timestamp": datetime.utcnow().isoformat(),
            "level": record.levelname,
            "logger": record.name,
            "message": record.getMessage(),
            "module": record.module,
            "function": record.funcName,
            "line": record.lineno,
        }
        
        # Add execution context if available
        if hasattr(record, 'execution_id'):
            log_entry['execution_id'] = record.execution_id
        
        if hasattr(record, 'workflow_id'):
            log_entry['workflow_id'] = record.workflow_id
        
        if hasattr(record, 'node_id'):
            log_entry['node_id'] = record.node_id
        
        # Add exception info if present
        if record.exc_info:
            log_entry['exception'] = self.formatException(record.exc_info)
        
        # Add extra fields
        for key, value in record.__dict__.items():
            if key not in ['name', 'msg', 'args', 'levelname', 'levelno', 'pathname', 
                          'filename', 'module', 'lineno', 'funcName', 'created', 
                          'msecs', 'relativeCreated', 'thread', 'threadName', 
                          'processName', 'process', 'stack_info', 'exc_info', 'exc_text']:
                log_entry[key] = value
        
        return json.dumps(log_entry)

def setup_logger(
    name: str, 
    level: str = "INFO",
    log_file: Optional[str] = None,
    json_format: bool = True,
    console_output: bool = True
) -> logging.Logger:
    """
    Set up a logger with consistent configuration
    
    Args:
        name: Logger name
        level: Logging level (DEBUG, INFO, WARNING, ERROR, CRITICAL)
        log_file: Optional log file path
        json_format: Whether to use JSON formatting
        console_output: Whether to output to console
    
    Returns:
        Configured logger instance
    """
    
    logger = logging.getLogger(name)
    logger.setLevel(getattr(logging, level.upper()))
    
    # Clear existing handlers
    logger.handlers.clear()
    
    # Create formatters
    if json_format:
        formatter = JsonFormatter()
    else:
        formatter = logging.Formatter(
            '%(asctime)s - %(name)s - %(levelname)s - %(message)s'
        )
    
    # Console handler
    if console_output:
        console_handler = logging.StreamHandler(sys.stdout)
        console_handler.setFormatter(formatter)
        logger.addHandler(console_handler)
    
    # File handler
    if log_file:
        log_path = Path(log_file)
        log_path.parent.mkdir(parents=True, exist_ok=True)
        
        file_handler = logging.FileHandler(log_file)
        file_handler.setFormatter(formatter)
        logger.addHandler(file_handler)
    
    return logger

def get_logger(name: str) -> logging.Logger:
    """Get an existing logger by name"""
    return logging.getLogger(name)

class MLEngineLogger:
    """Context-aware logger for ML Engine operations"""
    
    def __init__(self, base_logger: logging.Logger):
        self.logger = base_logger
        self.execution_id: Optional[str] = None
        self.workflow_id: Optional[str] = None
        self.node_id: Optional[str] = None
    
    def set_context(
        self, 
        execution_id: Optional[str] = None,
        workflow_id: Optional[str] = None,
        node_id: Optional[str] = None
    ):
        """Set execution context for logging"""
        if execution_id:
            self.execution_id = execution_id
        if workflow_id:
            self.workflow_id = workflow_id
        if node_id:
            self.node_id = node_id
    
    def _add_context(self, extra: Optional[Dict[str, Any]] = None) -> Dict[str, Any]:
        """Add context information to log record"""
        context = {}
        
        if self.execution_id:
            context['execution_id'] = self.execution_id
        if self.workflow_id:
            context['workflow_id'] = self.workflow_id
        if self.node_id:
            context['node_id'] = self.node_id
        
        if extra:
            context.update(extra)
        
        return context
    
    def debug(self, message: str, **kwargs):
        """Log debug message with context"""
        self.logger.debug(message, extra=self._add_context(kwargs))
    
    def info(self, message: str, **kwargs):
        """Log info message with context"""
        self.logger.info(message, extra=self._add_context(kwargs))
    
    def warning(self, message: str, **kwargs):
        """Log warning message with context"""
        self.logger.warning(message, extra=self._add_context(kwargs))
    
    def error(self, message: str, **kwargs):
        """Log error message with context"""
        self.logger.error(message, extra=self._add_context(kwargs))
    
    def critical(self, message: str, **kwargs):
        """Log critical message with context"""
        self.logger.critical(message, extra=self._add_context(kwargs))
    
    def exception(self, message: str, **kwargs):
        """Log exception with context"""
        self.logger.exception(message, extra=self._add_context(kwargs))

# Configure logging based on environment
def configure_logging():
    """Configure logging for the ML Engine based on environment variables"""
    
    log_level = os.getenv("LOG_LEVEL", "INFO")
    log_format = os.getenv("LOG_FORMAT", "json")  # json or text
    log_file = os.getenv("LOG_FILE")  # Optional log file path
    
    # Root logger configuration
    root_logger = setup_logger(
        name="ml_engine",
        level=log_level,
        log_file=log_file,
        json_format=(log_format.lower() == "json"),
        console_output=True
    )
    
    # Specific logger configurations
    loggers = [
        "pipeline_executor",
        "processors",
        "status_updater",
        "uvicorn.access",
        "uvicorn.error"
    ]
    
    for logger_name in loggers:
        setup_logger(
            name=logger_name,
            level=log_level,
            log_file=log_file,
            json_format=(log_format.lower() == "json"),
            console_output=False  # Avoid duplicate console output
        )
    
    # Suppress some noisy loggers in production
    if log_level.upper() not in ["DEBUG"]:
        logging.getLogger("urllib3").setLevel(logging.WARNING)
        logging.getLogger("requests").setLevel(logging.WARNING)
        logging.getLogger("tensorflow").setLevel(logging.ERROR)
    
    return root_logger

# Performance logging utilities
class PerformanceTimer:
    """Context manager for measuring execution time"""
    
    def __init__(self, logger: logging.Logger, operation_name: str, **context):
        self.logger = logger
        self.operation_name = operation_name
        self.context = context
        self.start_time = None
    
    def __enter__(self):
        self.start_time = datetime.utcnow()
        self.logger.info(
            f"Starting {self.operation_name}",
            extra={"operation": self.operation_name, "phase": "start", **self.context}
        )
        return self
    
    def __exit__(self, exc_type, exc_val, exc_tb):
        duration = (datetime.utcnow() - self.start_time).total_seconds()
        
        if exc_type is None:
            self.logger.info(
                f"Completed {self.operation_name} in {duration:.2f}s",
                extra={"operation": self.operation_name, "phase": "complete", 
                      "duration_seconds": duration, **self.context}
            )
        else:
            self.logger.error(
                f"Failed {self.operation_name} after {duration:.2f}s: {exc_val}",
                extra={"operation": self.operation_name, "phase": "error", 
                      "duration_seconds": duration, "error": str(exc_val), **self.context}
            )

def log_performance(logger: logging.Logger, operation_name: str, **context):
    """Decorator/context manager factory for performance logging"""
    return PerformanceTimer(logger, operation_name, **context)

# Initialize logging on module import
if __name__ != "__main__":
    configure_logging()
