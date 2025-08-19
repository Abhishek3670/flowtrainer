#!/bin/bash

# FlowCraft Docker Execution Test Script
# This script tests the complete Docker execution pipeline

set -e  # Exit on any error

echo "🚀 Starting FlowCraft Docker Execution Test"
echo "=========================================="

# Configuration
PROJECT_ID="test-project-$(date +%s)"
BASE_URL="http://localhost:4000"
WORKFLOW_FILE="test_workflow/execution_plan.json"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Check if backend is running
check_backend() {
    print_status "Checking if backend is running..."
    if curl -s "$BASE_URL/health" > /dev/null 2>&1; then
        print_success "Backend is running at $BASE_URL"
    else
        print_error "Backend is not running at $BASE_URL"
        print_status "Please start the backend server first:"
        echo "  cd backend && npm run dev"
        exit 1
    fi
}

# Check if Docker is running
check_docker() {
    print_status "Checking if Docker is running..."
    if docker info > /dev/null 2>&1; then
        print_success "Docker is running"
    else
        print_error "Docker is not running"
        print_status "Please start Docker first"
        exit 1
    fi
}

# Check if ML container exists
check_ml_container() {
    print_status "Checking if flowcraft-ml-engine container exists..."
    if docker images | grep -q "flowcraft-ml-engine"; then
        print_success "ML container exists"
    else
        print_warning "ML container not found. Building it now..."
        cd scripts && ./build-ml-container.sh && cd ..
    fi
}

# Execute workflow
execute_workflow() {
    print_status "Executing workflow for project: $PROJECT_ID"
    
    # Create project directories
    mkdir -p "workflows/$PROJECT_ID"
    mkdir -p "results/$PROJECT_ID"
    
    # Copy test data to workflows directory
    cp test_workflow/test_data.csv "workflows/$PROJECT_ID/"
    
    # Execute workflow
    print_status "Sending execution request..."
    curl -X POST "$BASE_URL/api/projects/$PROJECT_ID/execute" \
        -H "Content-Type: application/json" \
        -d @"$WORKFLOW_FILE" \
        --max-time 300 \
        --show-error \
        --silent > /dev/null
    
    if [ $? -eq 0 ]; then
        print_success "Workflow execution started"
    else
        print_error "Failed to start workflow execution"
        exit 1
    fi
}

# Wait for execution to complete
wait_for_completion() {
    print_status "Waiting for execution to complete..."
    
    local max_attempts=30
    local attempt=1
    
    while [ $attempt -le $max_attempts ]; do
        print_status "Checking status (attempt $attempt/$max_attempts)..."
        
        # Check project status
        local status=$(curl -s "$BASE_URL/api/projects/$PROJECT_ID/status" | jq -r '.status' 2>/dev/null || echo "unknown")
        
        if [ "$status" = "completed" ] || [ "$status" = "failed" ]; then
            print_success "Execution completed with status: $status"
            return 0
        fi
        
        if [ "$status" = "unknown" ]; then
            print_warning "Could not determine status, waiting..."
        else
            print_status "Current status: $status"
        fi
        
        sleep 10
        attempt=$((attempt + 1))
    done
    
    print_warning "Execution did not complete within expected time"
    return 1
}

# Check results
check_results() {
    print_status "Checking execution results..."
    
    local results=$(curl -s "$BASE_URL/api/projects/$PROJECT_ID/results")
    
    if [ $? -eq 0 ]; then
        print_success "Results retrieved successfully"
        echo "$results" | jq '.' 2>/dev/null || echo "$results"
        
        # Check if result files exist locally
        if [ -d "results/$PROJECT_ID" ]; then
            print_status "Local result files:"
            ls -la "results/$PROJECT_ID/"
        fi
    else
        print_error "Failed to retrieve results"
    fi
}

# Cleanup
cleanup() {
    print_status "Cleaning up test data..."
    rm -rf "workflows/$PROJECT_ID"
    rm -rf "results/$PROJECT_ID"
    print_success "Cleanup completed"
}

# Main execution
main() {
    echo
    print_status "Project ID: $PROJECT_ID"
    print_status "Workflow file: $WORKFLOW_FILE"
    print_status "Base URL: $BASE_URL"
    echo
    
    check_backend
    check_docker
    check_ml_container
    execute_workflow
    wait_for_completion
    check_results
    cleanup
    
    echo
    print_success "Docker execution test completed successfully! 🎉"
}

# Run main function
main "$@"
