#!/usr/bin/env python3
import sys
import json
import traceback
from pathlib import Path
from processors import MLProcessor

def execute_workflow(workflow_file: str):
    """Execute ML workflow from JSON file"""
    try:
        # Load workflow
        with open(workflow_file, 'r') as f:
            workflow = json.load(f)
        
        project_id = workflow['project_id']
        nodes = workflow['nodes']
        edges = workflow['edges']
        execution_order = workflow['execution_order']
        
        # Create processor
        project_path = Path(workflow_file).parent
        processor = MLProcessor(str(project_path))
        
        processor.log_step(f"Starting workflow execution for project: {project_id}")
        processor.log_step(f"Execution order: {execution_order}")
        
        # Create node lookup
        node_lookup = {node['id']: node for node in nodes}
        
        # Track node outputs for connecting nodes
        node_outputs = {}
        
        # Execute nodes in order
        for node_id in execution_order:
            if node_id not in node_lookup:
                processor.log_step(f"Node {node_id} not found", "ERROR")
                continue
                
            node = node_lookup[node_id]
            node_type = node['data']['type']
            parameters = node['data'].get('parameters', {})
            
            processor.log_step(f"Executing node {node_id} ({node_type})")
            
            # Get inputs from previous nodes
            inputs = {}
            for edge in edges:
                if edge['target'] == node_id:
                    source_outputs = node_outputs.get(edge['source'], {})
                    # Map source outputs to target inputs
                    for output_name, output_key in source_outputs.items():
                        inputs[output_name] = output_key
            
            # Execute node based on type
            try:
                if node_type == 'dataset-sample':
                    result = processor.process_dataset_sample(node_id, parameters)
                elif node_type == 'dataset-upload':
                    result = processor.process_dataset_upload(node_id, parameters)
                elif node_type == 'data-split':
                    result = processor.process_data_split(node_id, parameters, inputs)
                elif node_type == 'data-preprocessing':
                    result = processor.process_data_preprocessing(node_id, parameters, inputs)
                elif node_type == 'linear-regression':
                    result = processor.process_linear_regression(node_id, parameters, inputs)
                elif node_type == 'random-forest':
                    result = processor.process_random_forest(node_id, parameters, inputs)
                elif node_type == 'model-evaluation':
                    result = processor.process_model_evaluation(node_id, parameters, inputs)
                else:
                    processor.log_step(f"Unknown node type: {node_type}", "WARNING")
                    result = {'success': False, 'error': f'Unknown node type: {node_type}'}
                
                if result['success']:
                    node_outputs[node_id] = result.get('outputs', {})
                    processor.log_step(f"Node {node_id} completed successfully")
                    
                    # Save result metadata
                    result_file = project_path / 'results' / f'{node_id}_result.json'
                    result_file.parent.mkdir(exist_ok=True)
                    with open(result_file, 'w') as f:
                        json.dump(result, f, indent=2, default=str)
                else:
                    processor.log_step(f"Node {node_id} failed: {result.get('error', 'Unknown error')}", "ERROR")
                    break
                    
            except Exception as e:
                processor.log_step(f"Error executing node {node_id}: {str(e)}", "ERROR")
                processor.log_step(traceback.format_exc(), "ERROR")
                break
        
        processor.log_step("Workflow execution completed")
        
    except Exception as e:
        print(f"Workflow execution failed: {str(e)}")
        traceback.print_exc()

if __name__ == "__main__":
    if len(sys.argv) != 2:
        print("Usage: python execute_workflow.py <workflow_file>")
        sys.exit(1)
    
    execute_workflow(sys.argv[1])
