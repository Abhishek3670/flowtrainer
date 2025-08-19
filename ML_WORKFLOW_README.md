# ML Workflow Execution System

This document describes the improved ML workflow execution system that integrates with the FlowTrainer project.

## Overview

The system consists of:
1. **ProjectService** - Backend service for orchestrating ML workflows
2. **WorkflowService** - Service for managing workflow state and results
3. **execute_workflow.py** - Python script for executing individual ML nodes
4. **Docker integration** - Containerized execution environment

## Architecture

```
┌─────────────────┐    ┌──────────────────┐    ┌─────────────────┐
│   Frontend      │    │   Backend        │    │   ML Engine     │
│   (React)       │◄──►│   (Node.js)      │◄──►│   (Docker)      │
└─────────────────┘    └──────────────────┘    └─────────────────┘
                              │
                              ▼
                       ┌──────────────────┐
                       │   Workflow       │
                       │   Service        │
                       └──────────────────┘
```

## Key Components

### 1. ProjectService (`backend/src/services/projectService.ts`)

**Features:**
- Executes ML workflows node by node
- Docker container orchestration
- Retry logic for failed nodes (max 2 retries)
- Real-time logging via EventEmitter
- Result persistence and workflow state updates

**Key Methods:**
```typescript
async executeMLWorkflow(projectId: string, emitter: EventEmitter)
```

### 2. WorkflowService (`backend/src/services/workflow.service.ts`)

**Features:**
- Workflow loading and persistence
- Node result updates with file locking
- Organized data storage structure
- Thread-safe operations

**Data Structure:**
```
backend/data/
├── {projectId}/
│   ├── workflow.json          # Main workflow definition
│   └── results/               # Node execution results
│       ├── {nodeId}_result.json
│       └── ...
```

### 3. ML Execution Script (`execute_workflow.py`)

**Features:**
- Support for multiple ML algorithms:
  - Linear Regression
  - Random Forest Classifier
  - Support Vector Machine (SVM)
- Automatic model training and evaluation
- Comprehensive metrics calculation
- Flexible data input/output handling

**Supported Model Types:**
- `linear-regression` - LinearRegression from sklearn
- `random-forest` - RandomForestClassifier from sklearn
- `svm` - SVC from sklearn

## Usage

### Local Testing

1. **Setup Virtual Environment:**
   ```bash
   python3 -m venv venv
   source venv/bin/activate
   pip install -r requirements.txt
   ```

2. **Test Data Structure:**
   ```
   test_data/
   └── {projectId}/
       ├── {nodeId}_train.json    # Training data
       ├── {nodeId}_test.json     # Test data
       └── results/               # Output directory
   ```

3. **Run ML Workflow:**
   ```bash
   python execute_workflow.py \
     --project-id test_project \
     --node-id test_node \
     --type random-forest \
     --params '{"n_estimators": 10}'
   ```

### Docker Execution

1. **Build ML Image:**
   ```bash
   ./build-ml-image.sh
   ```

2. **Data Structure in Container:**
   ```
   /app/data/
   └── {projectId}/
       ├── {nodeId}_train.json    # Training data
       ├── {nodeId}_test.json     # Test data
       └── results/               # Output directory
   ```

3. **Docker Run Command:**
   ```bash
   docker run --rm \
     -v $(pwd)/data:/app/data \
     flowtrainer-ml \
     --project-id {projectId} \
     --node-id {nodeId} \
     --type {modelType} \
     --params '{parameters}'
   ```

## Data Format

### Input Data Format

**Training Data (`{nodeId}_train.json`):**
```json
{
  "X": [[feature1, feature2, ...], ...],
  "y": [label1, label2, ...]
}
```

**Test Data (`{nodeId}_test.json`):**
```json
{
  "X": [[feature1, feature2, ...], ...],
  "y": [label1, label2, ...]
}
```

### Output Format

**Result (`{nodeId}_result.json`):**
```json
{
  "accuracy": 0.95,
  "precision": 0.94,
  "recall": 0.96,
  "confusion_matrix": [[[TP, FP], [FN, TN]]]
}
```

## Model Parameters

### Linear Regression
```json
{}
```

### Random Forest
```json
{
  "n_estimators": 100,
  "max_depth": 10,
  "random_state": 42
}
```

### SVM
```json
{
  "kernel": "rbf",
  "C": 1.0,
  "gamma": "scale"
}
```

## Error Handling

- **Retry Logic**: Failed nodes are retried up to 2 times
- **File Locking**: Prevents race conditions during workflow updates
- **Graceful Degradation**: Failed nodes don't stop entire workflow
- **Comprehensive Logging**: All operations are logged for debugging

## Performance Features

- **Concurrent Execution**: Multiple workflows can run simultaneously
- **Resource Management**: Docker containers with memory/CPU limits
- **Efficient Data Handling**: Streaming data processing
- **Result Caching**: Intermediate results are persisted

## Security Considerations

- **Container Isolation**: Each workflow runs in isolated Docker container
- **File Permissions**: Proper file access controls
- **Input Validation**: All parameters are validated before execution
- **Resource Limits**: Docker resource constraints prevent abuse

## Troubleshooting

### Common Issues

1. **Docker Image Not Found:**
   ```bash
   # Build the image
   ./build-ml-image.sh
   ```

2. **Missing Dependencies:**
   ```bash
   # Install Python dependencies
   pip install -r requirements.txt
   ```

3. **Data Path Issues:**
   - Ensure data directory structure matches expected format
   - Check file permissions
   - Verify Docker volume mounting

4. **Model Type Not Supported:**
   - Check supported model types in documentation
   - Ensure parameters match sklearn API requirements

### Debug Mode

Enable verbose logging by setting environment variable:
```bash
export DEBUG=1
```

## Future Enhancements

- [ ] Support for more ML algorithms
- [ ] GPU acceleration support
- [ ] Distributed training capabilities
- [ ] Model versioning and tracking
- [ ] Automated hyperparameter tuning
- [ ] Real-time model monitoring
- [ ] Integration with MLflow or similar tools

## Contributing

When adding new ML algorithms:

1. Add the algorithm to `execute_workflow.py`
2. Update the requirements.txt if needed
3. Add test cases
4. Update this documentation
5. Ensure Docker compatibility

## License

This project is part of the FlowTrainer system and follows the same licensing terms.
