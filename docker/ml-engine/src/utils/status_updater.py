"""
Status Updater utility for FlowCraft ML Engine
Handles communication with FlowCraft backend for status updates
"""

import asyncio
import aiohttp
import json
import logging
from typing import Dict, Any, Optional
from datetime import datetime
import os

logger = logging.getLogger(__name__)

class StatusUpdater:
    """Updates FlowCraft backend with execution status"""
    
    def __init__(self):
        self.backend_url = os.getenv("FLOWCRAFT_BACKEND_URL", "http://localhost:4000")
        self.api_key = os.getenv("FLOWCRAFT_API_KEY")  # For authentication if needed
        self.session: Optional[aiohttp.ClientSession] = None
        self.retry_attempts = 3
        self.timeout = 30
    
    async def __aenter__(self):
        """Async context manager entry"""
        await self._ensure_session()
        return self
    
    async def __aexit__(self, exc_type, exc_val, exc_tb):
        """Async context manager exit"""
        await self.close()
    
    async def _ensure_session(self):
        """Ensure HTTP session is available"""
        if self.session is None or self.session.closed:
            timeout = aiohttp.ClientTimeout(total=self.timeout)
            self.session = aiohttp.ClientSession(timeout=timeout)
    
    async def close(self):
        """Close HTTP session"""
        if self.session and not self.session.closed:
            await self.session.close()
            self.session = None
    
    async def update_execution_status(
        self,
        execution_id: str,
        status: str,
        progress: int = 0,
        message: str = "",
        current_node: Optional[str] = None,
        results: Optional[Dict[str, Any]] = None,
        error: Optional[str] = None
    ) -> bool:
        """
        Update overall execution status
        
        Args:
            execution_id: Unique execution identifier
            status: Status (queued, running, completed, failed, cancelled)
            progress: Progress percentage (0-100)
            message: Status message
            current_node: Currently processing node ID
            results: Execution results
            error: Error message if failed
            
        Returns:
            True if update successful, False otherwise
        """
        
        payload = {
            "execution_id": execution_id,
            "status": status,
            "progress": progress,
            "message": message,
            "updated_at": datetime.utcnow().isoformat()
        }
        
        if current_node:
            payload["current_node"] = current_node
        if results:
            payload["results"] = results
        if error:
            payload["error"] = error
        
        return await self._make_request(
            "PUT",
            f"/api/executions/{execution_id}/status",
            payload
        )
    
    async def update_node_status(
        self,
        workflow_id: str,
        node_id: str,
        status: str,
        data: Optional[Dict[str, Any]] = None,
        error: Optional[str] = None
    ) -> bool:
        """
        Update individual node status in workflow
        
        Args:
            workflow_id: Workflow identifier
            node_id: Node identifier
            status: Node status (processing, completed, error)
            data: Additional node data
            error: Error message if failed
            
        Returns:
            True if update successful, False otherwise
        """
        
        payload = {
            "node_id": node_id,
            "status": status,
            "updated_at": datetime.utcnow().isoformat()
        }
        
        if data:
            payload["data"] = data
        if error:
            payload["error"] = error
        
        return await self._make_request(
            "PUT",
            f"/api/workflows/{workflow_id}/nodes/{node_id}/status",
            payload
        )
    
    async def update_workflow_metrics(
        self,
        workflow_id: str,
        execution_id: str,
        metrics: Dict[str, Any]
    ) -> bool:
        """
        Update workflow execution metrics
        
        Args:
            workflow_id: Workflow identifier
            execution_id: Execution identifier
            metrics: Metrics data
            
        Returns:
            True if update successful, False otherwise
        """
        
        payload = {
            "execution_id": execution_id,
            "metrics": metrics,
            "updated_at": datetime.utcnow().isoformat()
        }
        
        return await self._make_request(
            "POST",
            f"/api/workflows/{workflow_id}/metrics",
            payload
        )
    
    async def send_progress_update(
        self,
        execution_id: str,
        node_id: str,
        progress: int,
        message: str = "",
        partial_results: Optional[Dict[str, Any]] = None
    ) -> bool:
        """
        Send progress update for a specific node
        
        Args:
            execution_id: Execution identifier
            node_id: Node identifier
            progress: Progress percentage (0-100)
            message: Progress message
            partial_results: Partial results data
            
        Returns:
            True if update successful, False otherwise
        """
        
        payload = {
            "execution_id": execution_id,
            "node_id": node_id,
            "progress": progress,
            "message": message,
            "timestamp": datetime.utcnow().isoformat()
        }
        
        if partial_results:
            payload["partial_results"] = partial_results
        
        return await self._make_request(
            "POST",
            f"/api/executions/{execution_id}/progress",
            payload
        )
    
    async def send_log_entry(
        self,
        execution_id: str,
        level: str,
        message: str,
        node_id: Optional[str] = None,
        metadata: Optional[Dict[str, Any]] = None
    ) -> bool:
        """
        Send log entry to backend
        
        Args:
            execution_id: Execution identifier
            level: Log level (INFO, WARNING, ERROR, etc.)
            message: Log message
            node_id: Optional node identifier
            metadata: Optional metadata
            
        Returns:
            True if send successful, False otherwise
        """
        
        payload = {
            "execution_id": execution_id,
            "level": level,
            "message": message,
            "timestamp": datetime.utcnow().isoformat()
        }
        
        if node_id:
            payload["node_id"] = node_id
        if metadata:
            payload["metadata"] = metadata
        
        return await self._make_request(
            "POST",
            f"/api/executions/{execution_id}/logs",
            payload
        )
    
    async def _make_request(
        self,
        method: str,
        endpoint: str,
        payload: Dict[str, Any]
    ) -> bool:
        """
        Make HTTP request to FlowCraft backend
        
        Args:
            method: HTTP method
            endpoint: API endpoint
            payload: Request payload
            
        Returns:
            True if successful, False otherwise
        """
        
        await self._ensure_session()
        url = f"{self.backend_url}{endpoint}"
        headers = {"Content-Type": "application/json"}
        
        if self.api_key:
            headers["Authorization"] = f"Bearer {self.api_key}"
        
        for attempt in range(self.retry_attempts):
            try:
                async with self.session.request(
                    method,
                    url,
                    json=payload,
                    headers=headers
                ) as response:
                    
                    if response.status < 400:
                        logger.debug(f"Status update sent: {method} {endpoint} -> {response.status}")
                        return True
                    else:
                        error_text = await response.text()
                        logger.warning(
                            f"Status update failed: {method} {endpoint} -> {response.status}: {error_text}"
                        )
                        
                        # Don't retry client errors (4xx)
                        if 400 <= response.status < 500:
                            return False
                
            except asyncio.TimeoutError:
                logger.warning(f"Status update timeout: {method} {endpoint} (attempt {attempt + 1})")
            except aiohttp.ClientError as e:
                logger.warning(f"Status update error: {method} {endpoint} -> {str(e)} (attempt {attempt + 1})")
            except Exception as e:
                logger.error(f"Unexpected error in status update: {method} {endpoint} -> {str(e)}")
                return False
            
            # Wait before retry
            if attempt < self.retry_attempts - 1:
                await asyncio.sleep(2 ** attempt)  # Exponential backoff
        
        logger.error(f"Status update failed after {self.retry_attempts} attempts: {method} {endpoint}")
        return False

# Logging handler that sends logs to FlowCraft backend
class FlowCraftLogHandler(logging.Handler):
    """Custom logging handler that sends logs to FlowCraft backend"""
    
    def __init__(self, status_updater: StatusUpdater, execution_id: str):
        super().__init__()
        self.status_updater = status_updater
        self.execution_id = execution_id
        self.node_id: Optional[str] = None
    
    def set_node_id(self, node_id: Optional[str]):
        """Set current node ID for context"""
        self.node_id = node_id
    
    def emit(self, record: logging.LogRecord):
        """Send log record to FlowCraft backend"""
        try:
            # Don't send all logs, only important ones
            if record.levelno < logging.INFO:
                return
            
            message = self.format(record)
            
            # Extract metadata from record
            metadata = {
                "logger": record.name,
                "module": record.module,
                "function": record.funcName,
                "line": record.lineno
            }
            
            # Add any extra fields
            for key, value in record.__dict__.items():
                if key not in ['name', 'msg', 'args', 'levelname', 'levelno', 
                              'pathname', 'filename', 'module', 'lineno', 'funcName', 
                              'created', 'msecs', 'relativeCreated', 'thread', 
                              'threadName', 'processName', 'process', 'stack_info', 
                              'exc_info', 'exc_text', 'message']:
                    metadata[key] = value
            
            # Send asynchronously (fire and forget)
            asyncio.create_task(
                self.status_updater.send_log_entry(
                    self.execution_id,
                    record.levelname,
                    message,
                    self.node_id,
                    metadata
                )
            )
            
        except Exception:
            # Don't let logging errors break the application
            self.handleError(record)

# Context manager for status updates
class ExecutionStatusContext:
    """Context manager for tracking execution status"""
    
    def __init__(self, status_updater: StatusUpdater, execution_id: str, workflow_id: str):
        self.status_updater = status_updater
        self.execution_id = execution_id
        self.workflow_id = workflow_id
        self.start_time = None
    
    async def __aenter__(self):
        self.start_time = datetime.utcnow()
        await self.status_updater.update_execution_status(
            self.execution_id,
            "running",
            0,
            "Execution started"
        )
        return self
    
    async def __aexit__(self, exc_type, exc_val, exc_tb):
        duration = (datetime.utcnow() - self.start_time).total_seconds()
        
        if exc_type is None:
            await self.status_updater.update_execution_status(
                self.execution_id,
                "completed",
                100,
                f"Execution completed in {duration:.2f}s"
            )
        else:
            await self.status_updater.update_execution_status(
                self.execution_id,
                "failed",
                message=f"Execution failed after {duration:.2f}s",
                error=str(exc_val)
            )
