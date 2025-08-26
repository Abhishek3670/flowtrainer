/**
 * Worker Thread Script for FlowTrainer Performance Optimization
 * 
 * This file handles CPU-intensive tasks in a separate worker thread
 * to prevent blocking the main event loop.
 * 
 * Supported task types:
 * - ml-pipeline: Machine learning pipeline processing
 * - file-processing: Large file operations
 * - data-analysis: Data computation tasks
 * - model-training: ML model training operations
 */

const { parentPort, workerData, isMainThread } = require('worker_threads');

// Worker ID from worker data
const { workerId } = workerData || { workerId: 'unknown' };

console.log(`🔧 Worker ${workerId} initialized`);

// Listen for tasks from the main thread
if (parentPort) {
  parentPort.on('message', async (task) => {
    const startTime = Date.now();
    
    try {
      console.log(`⚡ Worker ${workerId} processing task: ${task.id} (type: ${task.type})`);
      
      let result;
      
      // Process different task types
      switch (task.type) {
        case 'ml-pipeline':
          result = await processMLPipeline(task.data);
          break;
        case 'file-processing':
          result = await processFile(task.data);
          break;
        case 'data-analysis':
          result = await analyzeData(task.data);
          break;
        case 'model-training':
          result = await trainModel(task.data);
          break;
        default:
          throw new Error(`Unknown task type: ${task.type}`);
      }
      
      const duration = Date.now() - startTime;
      console.log(`✅ Worker ${workerId} completed task ${task.id} in ${duration}ms`);
      
      // Send result back to main thread
      parentPort.postMessage({
        id: task.id,
        success: true,
        data: result,
        duration,
        workerId
      });
      
    } catch (error) {
      const duration = Date.now() - startTime;
      console.error(`❌ Worker ${workerId} failed task ${task.id}:`, error.message);
      
      // Send error back to main thread
      parentPort.postMessage({
        id: task.id,
        success: false,
        error: error.message,
        duration,
        workerId
      });
    }
  });

  parentPort.on('error', (error) => {
    console.error(`🚨 Worker ${workerId} error:`, error);
  });

  // Handle worker termination
  process.on('SIGTERM', () => {
    console.log(`🔄 Worker ${workerId} received SIGTERM, shutting down...`);
    process.exit(0);
  });

  process.on('SIGINT', () => {
    console.log(`🔄 Worker ${workerId} received SIGINT, shutting down...`);
    process.exit(0);
  });
}

// ===== TASK IMPLEMENTATION FUNCTIONS =====

/**
 * Process ML Pipeline tasks
 * Simulates machine learning pipeline processing
 */
async function processMLPipeline(data) {
  console.log(`🤖 Processing ML pipeline with data:`, data?.workflow || 'unknown');
  
  // Simulate ML processing time
  const processingTime = 1000 + Math.random() * 2000; // 1-3 seconds
  await sleep(processingTime);
  
  return {
    taskType: 'ml-pipeline',
    processed: true,
    result: 'pipeline-completed',
    nodesProcessed: data?.nodes?.length || 0,
    workflow: data?.workflow || 'unknown',
    metrics: {
      processingTime: Math.round(processingTime),
      accuracy: 0.85 + Math.random() * 0.1, // 85-95% accuracy
      throughput: Math.round(Math.random() * 1000) + 500 // 500-1500 ops/sec
    }
  };
}

/**
 * Process file operations
 * Handles large file processing tasks
 */
async function processFile(data) {
  console.log(`📁 Processing file:`, data?.filename || 'unknown');
  
  // Simulate file processing time based on size
  const fileSize = data?.size || 1000000; // Default 1MB
  const processingTime = Math.max(500, Math.min(5000, fileSize / 1000)); // 0.5-5 seconds
  await sleep(processingTime);
  
  return {
    taskType: 'file-processing',
    processed: true,
    filename: data?.filename || 'unknown',
    originalSize: fileSize,
    processedSize: Math.round(fileSize * 0.8), // 20% compression
    format: data?.format || 'binary',
    metrics: {
      processingTime: Math.round(processingTime),
      compressionRatio: 0.8,
      throughput: Math.round(fileSize / (processingTime / 1000)) // bytes per second
    }
  };
}

/**
 * Analyze data
 * Performs data analysis and computation
 */
async function analyzeData(data) {
  console.log(`📊 Analyzing data:`, data?.type || 'unknown');
  
  // Simulate data analysis time based on data size
  const dataPoints = data?.dataPoints || 1000;
  const processingTime = Math.max(2000, Math.min(10000, dataPoints * 2)); // 2-10 seconds
  await sleep(processingTime);
  
  // Generate mock insights
  const insights = [
    'Data shows strong correlation in primary metrics',
    'Outliers detected in 3.2% of data points', 
    'Seasonal patterns identified in time series',
    'Performance improvement trend observed',
    'Data quality score: 92%'
  ];
  
  return {
    taskType: 'data-analysis',
    analyzed: true,
    dataPoints,
    insights: insights.slice(0, Math.ceil(Math.random() * insights.length)),
    statistics: {
      mean: Math.random() * 100,
      median: Math.random() * 100,
      standardDeviation: Math.random() * 20,
      correlation: Math.random() * 2 - 1, // -1 to 1
      confidenceInterval: 0.95
    },
    metrics: {
      processingTime: Math.round(processingTime),
      dataPointsPerSecond: Math.round(dataPoints / (processingTime / 1000)),
      memoryUsage: Math.round(dataPoints * 0.001) + 'MB'
    }
  };
}

/**
 * Train ML model
 * Simulates machine learning model training
 */
async function trainModel(data) {
  console.log(`🧠 Training model:`, data?.modelType || 'unknown');
  
  // Simulate model training time (longer process)
  const epochs = data?.epochs || 10;
  const processingTime = Math.max(5000, epochs * 500); // 0.5 sec per epoch minimum
  
  // Simulate training progress
  for (let epoch = 1; epoch <= epochs; epoch++) {
    await sleep(processingTime / epochs);
    if (epoch % Math.max(1, Math.floor(epochs / 5)) === 0) {
      console.log(`🧠 Training progress: ${epoch}/${epochs} epochs (${Math.round(epoch/epochs*100)}%)`);
    }
  }
  
  return {
    taskType: 'model-training',
    trained: true,
    modelType: data?.modelType || 'neural-network',
    epochs,
    trainingData: {
      samples: data?.samples || 10000,
      features: data?.features || 50,
      labels: data?.labels || 2
    },
    performance: {
      accuracy: 0.80 + Math.random() * 0.15, // 80-95% accuracy
      precision: 0.75 + Math.random() * 0.20, // 75-95% precision
      recall: 0.70 + Math.random() * 0.25, // 70-95% recall
      f1Score: 0.72 + Math.random() * 0.23 // 72-95% f1 score
    },
    metrics: {
      trainingTime: Math.round(processingTime),
      timePerEpoch: Math.round(processingTime / epochs),
      convergence: epoch => 0.95 - Math.exp(-epoch * 0.3), // Learning curve
      finalLoss: 0.05 + Math.random() * 0.1 // 5-15% loss
    }
  };
}

/**
 * Utility function to simulate async processing time
 */
function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

// Error handling for the worker
process.on('uncaughtException', (error) => {
  console.error(`💥 Worker ${workerId} uncaught exception:`, error);
  process.exit(1);
});

process.on('unhandledRejection', (reason, promise) => {
  console.error(`💥 Worker ${workerId} unhandled rejection at:`, promise, 'reason:', reason);
  process.exit(1);
});

console.log(`✅ Worker ${workerId} ready for tasks`);

module.exports = {
  processMLPipeline,
  processFile, 
  analyzeData,
  trainModel
};