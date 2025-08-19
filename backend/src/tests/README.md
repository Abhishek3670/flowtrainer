# FlowCraft Testing Structure

## 📁 **Testing Organization**

### **1. Unit Tests** (`/backend/src/tests/`)
- **Purpose**: Test individual functions and methods in isolation
- **Scope**: Single classes, methods, utilities
- **Speed**: Fast execution
- **Tools**: Jest, TypeScript
- **Status**: ✅ PASSING

**Files:**
- `projectService.test.ts` - Tests for ProjectService methods
- `checkpoint.service.test.ts` - Tests for checkpoint functionality
- `workflow.service.test.ts` - Tests for workflow management

### **2. Integration Tests** (`/backend/src/tests/integration/`)
- **Purpose**: Test how multiple components work together
- **Scope**: Service interactions, API endpoints
- **Speed**: Medium execution
- **Tools**: Jest with mocks, Supertest
- **Status**: ✅ READY

**Files:**
- `projectService.integration.test.ts` - Docker execution integration
- `api.integration.test.ts` - API endpoint testing (to be created)

### **3. End-to-End Tests** (`/test_workflow/`)
- **Purpose**: Test complete workflows with real data
- **Scope**: Full system from workflow definition to execution
- **Speed**: Slow execution (Docker containers)
- **Tools**: Real API calls, Docker containers
- **Status**: 🚀 READY FOR TESTING

**Files:**
- `execution_plan.json` - Complete ML workflow
- `test_data.csv` - Sample dataset
- `config/execution_plan.json` - Simplified workflow

### **4. Manual Testing** (`/test_scripts/`)
- **Purpose**: Manual testing scripts and utilities
- **Scope**: API testing, Docker verification
- **Tools**: cURL, Python scripts, Bruno collections
- **Status**: 🎯 READY TO USE

**Files:**
- `test-docker-execution.sh` - Complete Docker execution test
- `bruno-collection.json` - Bruno API testing collection

## 🚀 **Moving to Real-World Testing**

Now that unit tests pass, let's test the complete Docker execution pipeline:

### **Test 1: Run Integration Tests**
```bash
cd backend
npm test -- --testPathPattern=integration
```

### **Test 2: Build Docker Container**
```bash
cd scripts
./build-ml-container.sh
```

### **Test 3: Execute Real Workflow (Option A - Script)**
```bash
# Make script executable and run
chmod +x test_scripts/test-docker-execution.sh
./test_scripts/test-docker-execution.sh
```

### **Test 3: Execute Real Workflow (Option B - Manual)**
```bash
# Use the test_workflow data
curl -X POST http://localhost:4000/api/projects/test-project/execute \
  -H "Content-Type: application/json" \
  -d @test_workflow/execution_plan.json

# Check results
curl http://localhost:4000/api/projects/test-project/results
```

### **Test 4: API Testing with Bruno**
1. Import `test_scripts/bruno-collection.json` into Bruno
2. Set environment variables
3. Test each endpoint individually

## 📊 **Testing Pyramid**

```
        /\
       /  \     E2E Tests (test_workflow)
      /____\    - Real workflows, Docker execution
     /      \   - Slow, comprehensive
    /        \  
   /          \  Integration Tests
  /____________\ - Service interactions
 /              \ - Medium speed
/________________\ Unit Tests
                 - Fast, isolated
                 - ✅ PASSING
```

## 🎯 **Next Steps for Real-World Testing**

### **Phase 1: Integration Testing** ✅
- [x] Create integration test structure
- [x] Write Docker execution tests
- [x] Mock file system operations

### **Phase 2: Docker Container** 🚀
- [ ] Build `flowcraft-ml-engine` container
- [ ] Verify container can execute workflows
- [ ] Test volume mounting and file I/O

### **Phase 3: End-to-End Testing** 🎯
- [ ] Execute real workflow with test data
- [ ] Verify results are saved locally
- [ ] Test complete data flow

### **Phase 4: API Validation** 🔍
- [ ] Test all API endpoints with Bruno
- [ ] Verify error handling
- [ ] Test with different workflow configurations

### **Phase 5: Frontend Integration** 🌐
- [ ] Test workflow execution from frontend
- [ ] Verify real-time updates
- [ ] Test complete user workflow

## 🧪 **Running Tests**

```bash
# Unit tests only
npm test

# Integration tests only
npm test -- --testPathPattern=integration

# All tests
npm test

# Manual Docker testing
./test_scripts/test-docker-execution.sh
```

## 📝 **Test Data**

The `test_workflow/` folder contains:
- **Real workflow definitions** that match your node types
- **Sample CSV data** for testing data processing
- **Multiple configurations** for different testing scenarios

This gives you a **production-like environment** to test your Docker execution system! 🎯
