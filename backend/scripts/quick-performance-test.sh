#!/bin/bash
# Quick Performance Test Script
# Runs all performance tests to validate improvements

set -e

echo "🚀 FlowCraft Performance Test Suite"
echo "=================================="
echo ""

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

# Check if server is running
check_server() {
    echo -e "${BLUE}🔍 Checking if server is running...${NC}"
    if curl -s "http://localhost:4000/api/health" > /dev/null; then
        echo -e "${GREEN}✅ Server is running${NC}"
        return 0
    else
        echo -e "${YELLOW}⚠️  Server is not running. Starting server...${NC}"
        return 1
    fi
}

# Start server if not running
start_server() {
    echo -e "${BLUE}🚀 Starting server...${NC}"
    cd "$(dirname "$0")/.."
    npm run dev > server.log 2>&1 &
    SERVER_PID=$!
    
    # Wait for server to start
    echo -e "${YELLOW}⏳ Waiting for server to start...${NC}"
    for i in {1..30}; do
        if curl -s "http://localhost:4000/api/health" > /dev/null 2>&1; then
            echo -e "${GREEN}✅ Server started successfully${NC}"
            return 0
        fi
        sleep 1
        echo -n "."
    done
    
    echo -e "${YELLOW}⚠️  Server startup timeout. Continuing with tests...${NC}"
    return 1
}

# Run performance tests
run_tests() {
    echo -e "\n${BLUE}🧪 Running Performance Tests...${NC}"
    echo "====================================="
    
    cd "$(dirname "$0")/.."
    
    # Test 1: Basic performance validation
    echo -e "\n${YELLOW}1️⃣  Testing Performance Improvements...${NC}"
    if node scripts/test-performance-improvements.js; then
        echo -e "${GREEN}✅ Performance improvement test completed${NC}"
    else
        echo -e "${YELLOW}⚠️  Performance improvement test failed${NC}"
    fi
    
    # Test 2: Load testing
    echo -e "\n${YELLOW}2️⃣  Running Load Tests...${NC}"
    if node scripts/load-test-performance.js; then
        echo -e "${GREEN}✅ Load testing completed${NC}"
    else
        echo -e "${YELLOW}⚠️  Load testing failed${NC}"
    fi
    
    # Test 3: Memory leak detection
    echo -e "\n${YELLOW}3️⃣  Running Memory Leak Detection...${NC}"
    echo -e "${YELLOW}⏳ Running for 2 minutes...${NC}"
    timeout 120s node scripts/detect-memory-leaks.js || true
    echo -e "${GREEN}✅ Memory leak detection completed${NC}"
}

# Generate summary report
generate_summary() {
    echo -e "\n${BLUE}📊 Performance Test Summary${NC}"
    echo "================================"
    
    cd "$(dirname "$0")/.."
    
    # Check for generated reports
    if [ -d "performance-reports" ]; then
        echo -e "${GREEN}📁 Performance reports generated:${NC}"
        ls -la performance-reports/ | grep -E "\.(json|html|log)$" | head -10
        
        # Show latest report summary
        LATEST_REPORT=$(find performance-reports -name "*.json" -type f -printf '%T@ %p\n' | sort -n | tail -1 | cut -d' ' -f2-)
        if [ -n "$LATEST_REPORT" ]; then
            echo -e "\n${BLUE}📋 Latest Report Summary:${NC}"
            echo "Report: $LATEST_REPORT"
            echo "Size: $(du -h "$LATEST_REPORT" | cut -f1)"
        fi
    else
        echo -e "${YELLOW}⚠️  No performance reports found${NC}"
    fi
    
    # Show current performance status
    echo -e "\n${BLUE}📈 Current Performance Status:${NC}"
    if curl -s "http://localhost:4000/api/performance" > /dev/null 2>&1; then
        echo -e "${GREEN}✅ Performance endpoint accessible${NC}"
        
        # Get performance metrics
        PERF_DATA=$(curl -s "http://localhost:4000/api/performance")
        if [ -n "$PERF_DATA" ]; then
            echo "Heap Usage: $(echo "$PERF_DATA" | grep -o '"heapUsed":[0-9]*' | cut -d':' -f2)MB"
            echo "System Load: $(echo "$PERF_DATA" | grep -o '"systemLoad":"[^"]*"' | cut -d'"' -f4)"
        fi
    else
        echo -e "${YELLOW}⚠️  Performance endpoint not accessible${NC}"
    fi
}

# Cleanup function
cleanup() {
    if [ -n "$SERVER_PID" ]; then
        echo -e "\n${BLUE}🧹 Cleaning up...${NC}"
        kill $SERVER_PID 2>/dev/null || true
        wait $SERVER_PID 2>/dev/null || true
    fi
}

# Main execution
main() {
    # Set up cleanup on exit
    trap cleanup EXIT
    
    # Check if server is running
    if ! check_server; then
        start_server
    fi
    
    # Run tests
    run_tests
    
    # Generate summary
    generate_summary
    
    echo -e "\n${GREEN}🎉 Performance test suite completed!${NC}"
    echo -e "${BLUE}📁 Check the performance-reports/ directory for detailed results${NC}"
    echo -e "${BLUE}🌐 Open clinic-doctor.html files in your browser to view profiles${NC}"
}

# Run main function
main "$@"
