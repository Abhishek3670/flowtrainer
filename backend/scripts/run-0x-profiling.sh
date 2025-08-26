#!/bin/bash
# 0x CPU Profiling Script for FlowCraft Backend
# Demonstrates different profiling methods and generates CPU flamegraphs

set -e

echo "🔥 0x CPU Profiling Suite for FlowCraft"
echo "======================================="
echo ""

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
RED='\033[0;31m'
NC='\033[0m'

# Configuration
PROFILE_DURATION=${1:-60}  # Default 60 seconds
CONCURRENT_USERS=${2:-10}  # Default 10 concurrent users
OUTPUT_DIR="0x-profile-$(date +%Y%m%d_%H%M%S)"

echo -e "${BLUE}📊 Profile Duration: ${PROFILE_DURATION}s${NC}"
echo -e "${BLUE}👥 Concurrent Users: ${CONCURRENT_USERS}${NC}"
echo -e "${BLUE}📁 Output Directory: ${OUTPUT_DIR}${NC}"
echo ""

# Function to check prerequisites
check_prerequisites() {
    echo -e "${BLUE}🔍 Checking prerequisites...${NC}"
    
    # Check if 0x is available
    if ! npx 0x --version > /dev/null 2>&1; then
        echo -e "${RED}❌ 0x is not available. Install with: npm install -g 0x${NC}"
        exit 1
    fi
    
    # Check if autocannon is available
    if ! command -v autocannon > /dev/null 2>&1; then
        echo -e "${RED}❌ Autocannon is not available. Install with: npm install -g autocannon${NC}"
        exit 1
    fi
    
    # Check if dist/server.js exists
    if [ ! -f "dist/server.js" ]; then
        echo -e "${RED}❌ dist/server.js not found. Run 'npm run build' first${NC}"
        exit 1
    fi
    
    echo -e "${GREEN}✅ All prerequisites met${NC}"
    echo ""
}

# Function to run basic 0x profiling
run_basic_profiling() {
    echo -e "${YELLOW}🚀 Method 1: Basic 0x Profiling (Manual Control)${NC}"
    echo "========================================================"
    echo ""
    echo -e "${BLUE}Instructions:${NC}"
    echo "1. This will start the profiling server"
    echo "2. Open another terminal and run: autocannon -c ${CONCURRENT_USERS} -d ${PROFILE_DURATION} http://localhost:4000/api/health"
    echo "3. Press Ctrl+C in this terminal to stop profiling"
    echo "4. View results in: ${OUTPUT_DIR}/flamegraph.html"
    echo ""
    
    read -p "Press Enter to start basic profiling..."
    
    echo -e "${GREEN}🔥 Starting 0x profiling...${NC}"
    echo -e "${YELLOW}⏳ Run load testing in another terminal, then press Ctrl+C to stop${NC}"
    echo ""
    
    npx 0x --output-dir "${OUTPUT_DIR}" -- node dist/server.js
}

# Function to run automated 0x profiling
run_automated_profiling() {
    echo -e "${YELLOW}🚀 Method 2: Automated 0x with Load Testing${NC}"
    echo "================================================"
    echo ""
    echo -e "${BLUE}This method automatically:${NC}"
    echo "• Starts the profiling server"
    echo "• Runs load testing for ${PROFILE_DURATION}s with ${CONCURRENT_USERS} users"
    echo "• Generates flamegraph automatically"
    echo "• Stops when complete"
    echo ""
    
    read -p "Press Enter to start automated profiling..."
    
    echo -e "${GREEN}🔥 Starting automated 0x profiling...${NC}"
    echo -e "${YELLOW}⏳ This will run for ${PROFILE_DURATION} seconds automatically${NC}"
    echo ""
    
    npx 0x --output-dir "${OUTPUT_DIR}" --on-port "autocannon -c ${CONCURRENT_USERS} -d ${PROFILE_DURATION} http://localhost:4000/api/health" -- node dist/server.js
}

# Function to run advanced 0x profiling
run_advanced_profiling() {
    echo -e "${YELLOW}🚀 Method 3: Advanced 0x with Custom Load Patterns${NC}"
    echo "====================================================="
    echo ""
    echo -e "${BLUE}This method tests multiple endpoints:${NC}"
    echo "• Health endpoint (baseline)"
    echo "• Performance endpoint (monitoring overhead)"
    echo "• Cache endpoint (caching behavior)"
    echo "• Multiple concurrent users with pipelining"
    echo ""
    
    read -p "Press Enter to start advanced profiling..."
    
    echo -e "${GREEN}🔥 Starting advanced 0x profiling...${NC}"
    echo ""
    
    # Create a custom load testing script
    cat > /tmp/advanced-load.js << 'EOF'
const autocannon = require('autocannon');

async function runAdvancedLoad() {
    console.log('🔥 Running advanced load testing...');
    
    // Test 1: Health endpoint
    console.log('📊 Testing health endpoint...');
    await autocannon({
        url: 'http://localhost:4000/api/health',
        connections: 5,
        duration: 20,
        pipelining: 1
    });
    
    // Test 2: Performance endpoint
    console.log('📊 Testing performance endpoint...');
    await autocannon({
        url: 'http://localhost:4000/api/performance',
        connections: 10,
        duration: 20,
        pipelining: 2
    });
    
    // Test 3: Cache endpoint
    console.log('📊 Testing cache endpoint...');
    await autocannon({
        url: 'http://localhost:4000/api/performance/cache',
        connections: 15,
        duration: 20,
        pipelining: 3
    });
    
    console.log('✅ Advanced load testing completed');
}

runAdvancedLoad().catch(console.error);
EOF
    
    npx 0x --output-dir "${OUTPUT_DIR}" --on-port "node /tmp/advanced-load.js" -- node dist/server.js
}

# Function to show profiling results
show_results() {
    echo ""
    echo -e "${GREEN}🎉 Profiling completed!${NC}"
    echo "================================"
    
    if [ -d "${OUTPUT_DIR}" ]; then
        echo -e "${BLUE}📁 Profile output directory: ${OUTPUT_DIR}${NC}"
        
        # List generated files
        echo -e "\n${BLUE}📋 Generated files:${NC}"
        ls -la "${OUTPUT_DIR}/"
        
        # Check for flamegraph
        if [ -f "${OUTPUT_DIR}/flamegraph.html" ]; then
            echo -e "\n${GREEN}🔥 Flamegraph generated: ${OUTPUT_DIR}/flamegraph.html${NC}"
            echo -e "${YELLOW}💡 Open this file in your browser to view the CPU flamegraph${NC}"
        fi
        
        # Check for other outputs
        if [ -f "${OUTPUT_DIR}/profile.txt" ]; then
            echo -e "\n${BLUE}📊 Text profile: ${OUTPUT_DIR}/profile.txt${NC}"
        fi
        
        if [ -f "${OUTPUT_DIR}/profile.json" ]; then
            echo -e "\n${BLUE}📊 JSON profile: ${OUTPUT_DIR}/profile.json${NC}"
        fi
        
    else
        echo -e "${RED}❌ Profile output directory not found${NC}"
    fi
    
    echo ""
    echo -e "${BLUE}📚 How to interpret results:${NC}"
    echo "• Flamegraph shows CPU usage over time"
    echo "• Wider bars = more CPU time spent"
    echo "• Stack traces show function call chains"
    echo "• Look for wide, flat areas (bottlenecks)"
    echo ""
}

# Function to clean up temporary files
cleanup() {
    if [ -f "/tmp/advanced-load.js" ]; then
        rm -f /tmp/advanced-load.js
    fi
}

# Main menu
show_menu() {
    echo -e "${BLUE}Choose profiling method:${NC}"
    echo "1. Basic 0x Profiling (Manual Control)"
    echo "2. Automated 0x with Load Testing (Recommended)"
    echo "3. Advanced 0x with Custom Load Patterns"
    echo "4. Exit"
    echo ""
}

# Main execution
main() {
    # Set up cleanup on exit
    trap cleanup EXIT
    
    # Check prerequisites
    check_prerequisites
    
    while true; do
        show_menu
        read -p "Enter your choice (1-4): " choice
        
        case $choice in
            1)
                run_basic_profiling
                show_results
                break
                ;;
            2)
                run_automated_profiling
                show_results
                break
                ;;
            3)
                run_advanced_profiling
                show_results
                break
                ;;
            4)
                echo -e "${GREEN}👋 Goodbye!${NC}"
                exit 0
                ;;
            *)
                echo -e "${RED}❌ Invalid choice. Please enter 1-4.${NC}"
                ;;
        esac
    done
}

# Run main function
main "$@"
