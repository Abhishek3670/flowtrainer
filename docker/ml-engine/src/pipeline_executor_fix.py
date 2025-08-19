# Add this to execute_from_file function, before calling run_pipeline:

        # Create execution status for CLI mode
        from datetime import datetime
        execution_status = ExecutionStatus(
            execution_id=request.execution_id,
            status="queued",
            progress=0,
            message="Pipeline queued for execution",
            started_at=datetime.utcnow(),
            updated_at=datetime.utcnow()
        )
        
        active_executions[request.execution_id] = execution_status

