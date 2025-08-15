"""
Base Processor for FlowCraft ML Engine
Abstract base class for all ML processors
"""

from abc import ABC, abstractmethod
from typing import Dict, Any, List, Optional
import logging

logger = logging.getLogger(__name__)

class BaseProcessor(ABC):
    """Abstract base class for ML processors"""
    
    def __init__(self):
        self.name = self.__class__.__name__
        self.description = "Base ML Processor"
    
    @abstractmethod
    async def process(self, node_data: Dict[str, Any], context: Dict[str, Any], config: Dict[str, Any]) -> Dict[str, Any]:
        """
        Process a node in the ML pipeline
        
        Args:
            node_data: Node configuration data
            context: Execution context with data from previous nodes
            config: Global pipeline configuration
            
        Returns:
            Dict containing the processing results
        """
        pass
    
    @abstractmethod
    def get_inputs(self) -> List[str]:
        """Get list of required inputs for this processor"""
        pass
    
    @abstractmethod
    def get_outputs(self) -> List[str]:
        """Get list of outputs produced by this processor"""
        pass
    
    def validate_inputs(self, node_data: Dict[str, Any], context: Dict[str, Any]) -> bool:
        """
        Validate that required inputs are available
        
        Args:
            node_data: Node configuration data
            context: Execution context
            
        Returns:
            True if inputs are valid, False otherwise
        """
        required_inputs = self.get_inputs()
        
        for input_name in required_inputs:
            if input_name not in context and input_name not in node_data.get('data', {}):
                logger.error(f"Missing required input: {input_name}")
                return False
        
        return True
    
    def get_input_data(self, input_name: str, node_data: Dict[str, Any], context: Dict[str, Any]) -> Any:
        """
        Get input data from either node configuration or context
        
        Args:
            input_name: Name of the input
            node_data: Node configuration data
            context: Execution context
            
        Returns:
            Input data value
        """
        # First check node data
        if input_name in node_data.get('data', {}):
            return node_data['data'][input_name]
        
        # Then check context
        if input_name in context:
            return context[input_name]
        
        # Check for connected node outputs
        connected_nodes = node_data.get('connected_inputs', {})
        if input_name in connected_nodes:
            source_node_id = connected_nodes[input_name]
            if source_node_id in context:
                return context[source_node_id]
        
        return None
    
    async def pre_process(self, node_data: Dict[str, Any], context: Dict[str, Any]) -> None:
        """Pre-processing hook - override if needed"""
        pass
    
    async def post_process(self, result: Dict[str, Any], node_data: Dict[str, Any], context: Dict[str, Any]) -> Dict[str, Any]:
        """Post-processing hook - override if needed"""
        return result
    
    def log_progress(self, message: str, progress: Optional[int] = None):
        """Log processing progress"""
        if progress is not None:
            logger.info(f"[{self.name}] {message} ({progress}%)")
        else:
            logger.info(f"[{self.name}] {message}")

class ProcessorRegistry:
    """Registry for managing ML processors"""
    
    def __init__(self):
        self.processors: Dict[str, BaseProcessor] = {}
    
    def register(self, processor_type: str, processor: BaseProcessor):
        """Register a processor"""
        self.processors[processor_type] = processor
        logger.info(f"📦 Registered processor: {processor_type}")
    
    def get_processor(self, processor_type: str) -> Optional[BaseProcessor]:
        """Get a processor by type"""
        return self.processors.get(processor_type)
    
    def list_processors(self) -> List[str]:
        """List all registered processor types"""
        return list(self.processors.keys())

class ProcessorError(Exception):
    """Custom exception for processor errors"""
    
    def __init__(self, message: str, processor_name: str, node_id: Optional[str] = None):
        self.message = message
        self.processor_name = processor_name
        self.node_id = node_id
        super().__init__(f"[{processor_name}] {message}")

class ValidationError(ProcessorError):
    """Exception for input validation errors"""
    pass

class ProcessingError(ProcessorError):
    """Exception for processing errors"""
    pass
