#!/bin/bash
# backend/concurrency-test.sh - Test concurrent execution limits and resource management

set -e

API_BASE="http://localhost:4000/api"
MAX_CONCURRENT=3
TEST_PROJECTS=()

echo "🧪 Starting Concurrency & Resource Management Tests"
echo "==============================================="

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to create test project
create_test_project() {
    local project_id="concurrent-test-$(date +%s)-$1"
    local priority=${2:-1}
    
    echo -e "${BLUE}Creating test project: ${project_id}${NC}"
    
    # Generate execution plan
    curl -s -X POST "${API_BASE}/projects/generate" \
        -H "Content-Type: application/json" \
        -d "{
            \"projectId\": \"${project_id}\",
            \"workflowId\": \"test-workflow-$1\",
            \"nodes\": [
                {
                    \"id\": \"dataset-$1\",
                    \"type\": \"datasetNode\",
                    \"data\": {
                        \"file_path\": \"test_data.csv\",
                        \"preprocessing_config\": {\"target_column\": \"target\"}
                    },
                    \"position\": {\"x\": 100, \"y\": 100}
                },
                {
                    \"id\": \"split-$1\",
                    \"type\": \"splitNode\",
                    \"data\": {
                        \"test_size\": 0.2,
                        \"random_state\": 42,
                        \"split_type\": \"random\"
                    },
                    \"position\": {\"x\": 300, \"y\": 100}
                },
                {
                    \"id\": \"trainer-$1\",
                    \"type\": \"trainerNode\",
                    \"data\": {
                        \"algorithm\": \"random_forest\",
                        \"hyperparameters\": {
                            \"n_estimators\": 100,
                            \"max_depth\": 10,
                            \"random_state\": 42
                        }
                    },
                    \"position\": {\"x\": 500, \"y\": 100}
                }
            ],
            \"edges\": [
                {\"id\": \"e1-$1\", \"source\": \"dataset-$1\", \"target\": \"split-$1\"},
                {\"id\": \"e2-$1\", \"source\": \"split-$1\", \"target\": \"trainer-$1\"}
            ]
        }" > /dev/null
    
    if [ $? -eq 0 ]; then
        echo -e "${GREEN}✅ Generated execution plan for ${project_id}${NC}"
    else
        echo -e "${RED}❌ Failed to generate plan for ${project_id}${NC}"
        return 1
    fi
    
    # Execute project with priority
    curl -s -X POST "${API_BASE}/projects/${project_id}/execute" \
        -H "Content-Type: application/json" \
        -d "{\"priority\": ${priority}, \"timeout_minutes\": 5}" > /dev/null
    
    if [ $? -eq 0 ]; then
        echo -e "${GREEN}✅ Queued execution for ${project_id} (Priority: ${priority})${NC}"
        TEST_PROJECTS+=("$project_id")
    else
        echo -e "${RED}❌ Failed to queue execution for ${project_id}${NC}"
        return 1
    fi
}

# Function to check system status
check_system_status() {
    local response=$(curl -s "${API_BASE}/projects/system/status")
    local running=$(echo "$response" | grep -o '"running_executions":[0-9]*' | cut -d':' -f2)
    local queued=$(echo "$response" | grep -o '"queued_executions":[0-9]*' | cut -d':' -f2)
    local utilization=$(echo "$response" | grep -o '"capacity_utilization":[0-9.]*' | cut -d':' -f2)
    
    echo -e "${BLUE}📊 System Status:${NC}"
    echo "   Running: $running"
    echo "   Queued: $queued" 
    echo "   Capacity Utilization: ${utilization}%"
    echo ""
}

# Function to monitor execution status
monitor_executions() {
    echo -e "${YELLOW}📊 Monitoring concurrent executions...${NC}"
    
    while true; do
        local running_count=0
        local queued_count=0
        local completed_count=0
        local failed_count=0
        
        for project_id in "${TEST_PROJECTS[@]}"; do
            local status_response=$(curl -s "${API_BASE}/projects/${project_id}/status")
            local status=$(echo "$status_response" | grep -o '"status":"[^"]*"' | cut -d'"' -f4)
            
            case "$status" in
                "running") ((running_count++)) ;;
                "queued") ((queued_count++)) ;;
                "completed") ((completed_count++)) ;;
                "failed"|"timeout") ((failed_count++)) ;;
            esac
        done
        
        echo -e "${BLUE}Status Update:${NC} Running: $running_count, Queued: $queued_count, Completed: $completed_count, Failed: $failed_count"
        
        # Check if all executions are done
        if [ $((running_count + queued_count)) -eq 0 ]; then
            echo -e "${GREEN}✅ All executions completed${NC}"
            break
        fi
        
        # Check resource limits
        if [ $running_count -gt $MAX_CONCURRENT ]; then
            echo -e "${RED}❌ RESOURCE LIMIT VIOLATION: $running_count executions running (max: $MAX_CONCURRENT)${NC}"
        fi
        
        sleep 5
    done
    
    echo ""
    echo -e "${GREEN}📈 Final Results:${NC}"
    echo "   Completed: $completed_count"
    echo "   Failed: $failed_count"
    echo "   Total: ${#TEST_PROJECTS[@]}"
}

# Function to test concurrent execution limits
test_concurrent_limits() {
    echo -e "${YELLOW}🔄 Testing Concurrent Execution Limits${NC}"
    echo "Creating $((MAX_CONCURRENT + 2)) projects to test queue management..."
    echo ""
    
    # Create more projects than the concurrent limit
    for i in $(seq 1 $((MAX_CONCURRENT + 2))); do
        create_test_project $i $((3 - i % 3))  # Varying priorities
        sleep 1
    done
    
    echo ""
    check_system_status
    monitor_executions
}

# Function to test priority queue
test_priority_queue() {
    echo -e "${YELLOW}🎯 Testing Priority Queue${NC}"
    echo "Creating projects with different priorities..."
    echo ""
    
    # Create projects with different priorities
    create_test_project "low" 1
    sleep 1
    create_test_project "high" 3
    sleep 1
    create_test_project "medium" 2
    
    echo ""
    check_system_status
    
    # Monitor for 30 seconds to see priority handling
    echo -e "${BLUE}Monitoring priority execution for 30 seconds...${NC}"
    timeout 30s bash -c '
        while true; do
            response=$(curl -s "'"$API_BASE"'/projects/system/status")
            echo "$response" | jq -r ".system.queue[] | \"Project: \(.project_id), Priority: \(.priority)\""
            sleep 3
            echo "---"
        done
    ' || true
}

# Function to test resource constraints
test_resource_constraints() {
    echo -e "${YELLOW}🔧 Testing Resource Constraints${NC}"
    
    # Check if Docker containers have resource limits applied
    echo "Checking Docker resource constraints..."
    
    create_test_project "resource-test" 1
    sleep 5
    
    # Check running containers for resource limits
    local containers=$(docker ps --filter "name=flowcraft-" --format "table {{.Names}}\t{{.Status}}")
    if [ -n "$containers" ]; then
        echo -e "${GREEN}Found running FlowCraft containers:${NC}"
        echo "$containers"
        
        # Inspect resource limits
        for container in $(docker ps --filter "name=flowcraft-" --format "{{.Names}}"); do
            echo -e "${BLUE}Resource limits for $container:${NC}"
            docker inspect "$container" | jq -r '.[] | .HostConfig | {Memory, CpuShares, CpusetCpus}'
        done
    else
        echo -e "${YELLOW}No running containers found${NC}"
    fi
}

# Function to test timeout handling
test_timeout_handling() {
    echo -e "${YELLOW}⏰ Testing Timeout Handling${NC}"
    
    # Create a project with very short timeout
    local project_id="timeout-test-$(date +%s)"
    
    echo -e "${BLUE}Creating project with 1-minute timeout: ${project_id}${NC}"
    
    curl -s -X POST "${API_BASE}/projects/generate" \
        -H "Content-Type: application/json" \
        -d "{
            \"projectId\": \"${project_id}\",
            \"workflowId\": \"timeout-test\",
            \"nodes\": [
                {
                    \"id\": \"slow-dataset\",
                    \"type\": \"datasetNode\", 
                    \"data\": {
                        \"file_path\": \"large_dataset.csv\",
                        \"preprocessing_config\": {\"target_column\": \"target\"}
                    },
                    \"position\": {\"x\": 100, \"y\": 100}
                }
            ],
            \"edges\": []
        }" > /dev/null
    
    curl -s -X POST "${API_BASE}/projects/${project_id}/execute" \
        -H "Content-Type: application/json" \
        -d "{\"timeout_minutes\": 1}" > /dev/null
    
    echo "Waiting for timeout to trigger..."
    sleep 70  # Wait for timeout
    
    # Check if execution was marked as timeout
    local status_response=$(curl -s "${API_BASE}/projects/${project_id}/status")
    local status=$(echo "$status_response" | grep -o '"status":"[^"]*"' | cut -d'"' -f4)
    
    if [ "$status" = "timeout" ]; then
        echo -e "${GREEN}✅ Timeout handling works correctly${NC}"
    else
        echo -e "${RED}❌ Timeout handling failed (status: $status)${NC}"
    fi
}

# Function to test error handling and rollback
test_error_handling() {
    echo -e "${YELLOW}🚨 Testing Error Handling${NC}"
    
    # Create a project designed to fail
    local project_id="error-test-$(date +%s)"
    
    echo -e "${BLUE}Creating project designed to fail: ${project_id}${NC}"
    
    curl -s -X POST "${API_BASE}/projects/generate" \
        -H "Content-Type: application/json" \
        -d "{
            \"projectId\": \"${project_id}\",
            \"workflowId\": \"error-test\",
            \"nodes\": [
                {
                    \"id\": \"bad-dataset\",
                    \"type\": \"datasetNode\",
                    \"data\": {
                        \"file_path\": \"nonexistent_file.csv\",
                        \"preprocessing_config\": {\"target_column\": \"target\"}
                    },
                    \"position\": {\"x\": 100, \"y\": 100}
                }
            ],
            \"edges\": []
        }" > /dev/null
    
    curl -s -X POST "${API_BASE}/projects/${project_id}/execute" > /dev/null
    
    # Wait for execution to fail
    sleep 15
    
    # Check status and error details
    local status_response=$(curl -s "${API_BASE}/projects/${project_id}/status")
    local status=$(echo "$status_response" | grep -o '"status":"[^"]*"' | cut -d'"' -f4)
    local error=$(echo "$status_response" | grep -o '"error":"[^"]*"' | cut -d'"' -f4)
    
    echo -e "${BLUE}Error test result:${NC}"
    echo "   Status: $status"
    echo "   Error: $error"
    
    if [ "$status" = "failed" ] && [ -n "$error" ]; then
        echo -e "${GREEN}✅ Error handling works correctly${NC}"
        
        # Test retry functionality
        echo -e "${BLUE}Testing retry functionality...${NC}"
        curl -s -X POST "${API_BASE}/projects/${project_id}/retry" > /dev/null
        sleep 5
        
        local retry_response=$(curl -s "${API_BASE}/projects/${project_id}/status")
        local retry_status=$(echo "$retry_response" | grep -o '"status":"[^"]*"' | cut -d'"' -f4)
        echo "   Retry status: $retry_status"
        
    else
        echo -e "${RED}❌ Error handling failed${NC}"
    fi
}

# Function to cleanup test projects
cleanup_test_projects() {
    echo -e "${YELLOW}🧹 Cleaning up test projects...${NC}"
    
    for project_id in "${TEST_PROJECTS[@]}"; do
        echo "Cleaning up: $project_id"
        curl -s -X DELETE "${API_BASE}/projects/${project_id}" > /dev/null
    done
    
    # Also cleanup specific test projects
    for test_type in "timeout-test" "error-test" "resource-test"; do
        for project in $(curl -s "${API_BASE}/projects/system/status" | grep -o "${test_type}-[0-9]*" | head -5); do
            echo "Cleaning up: $project"
            curl -s -X DELETE "${API_BASE}/projects/${project}" > /dev/null
        done
    done
    
    echo -e "${GREEN}✅ Cleanup completed${NC}"
}

# Main test execution
main() {
    echo -e "${GREEN}🚀 FlowCraft Concurrency & Resource Management Test Suite${NC}"
    echo "========================================================"
    echo ""
    
    # Check if backend is running
    if ! curl -s "${API_BASE}/health" > /dev/null; then
        echo -e "${RED}❌ Backend not running at ${API_BASE}${NC}"
        echo "Please start the backend server first"
        exit 1
    fi
    
    echo -e "${GREEN}✅ Backend is running${NC}"
    echo ""
    
    # Run test suites
    test_concurrent_limits
    echo ""
    
    test_priority_queue
    echo ""
    
    test_resource_constraints
    echo ""
    
    test_timeout_handling  
    echo ""
    
    test_error_handling
    echo ""
    
    # Final system status
    echo -e "${BLUE}📊 Final System Status:${NC}"
    check_system_status
    
    # Cleanup
    cleanup_test_projects
    
    echo ""
    echo -e "${GREEN}🎉 Concurrency & Resource Management Tests Complete!${NC}"
    echo "================================================="
}

# Handle script interruption
trap cleanup_test_projects EXIT

# Run main function
main "$@"
