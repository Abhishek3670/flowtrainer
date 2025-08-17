#!/usr/bin/env python3
import argparse
import json
import sys

def main():
    parser = argparse.ArgumentParser()
    parser.add_argument('--node-id', required=True)
    parser.add_argument('--type', required=True)
    parser.add_argument('--params', required=True)
    parser.add_argument('--project-id', required=True)
    
    args = parser.parse_args()
    
    # Simulate processing
    print(f"Processing node {args.node_id} of type {args.type}")
    print(f"Parameters: {args.params}")
    
    # Create mock result
    result = {
        "node_id": args.node_id,
        "status": "completed",
        "output": f"Result from {args.node_id}"
    }
    
    # Write result to mounted volume
    result_path = f"/app/results/{args.node_id}_result.json"
    with open(result_path, 'w') as f:
        json.dump(result, f, indent=2)
    
    print(f"Result written to {result_path}")
    sys.exit(0)

if __name__ == "__main__":
    main()
