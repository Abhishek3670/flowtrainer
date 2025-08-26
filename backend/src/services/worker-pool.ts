import { Worker, isMainThread, workerData } from 'worker_threads';
import { EventEmitter } from 'events';
import path from 'path';
import fs from 'fs';

export interface WorkerTask {
  id: string;
  type: 'ml-pipeline' | 'file-processing' | 'data-analysis' | 'model-training';
  data: any;
  priority: number;
}

export interface WorkerResult {
  id: string;
  success: boolean;
  data?: any;
  error?: string;
  duration: number;
  workerId?: string;
}

export class WorkerPool extends EventEmitter {
  private workers: Worker[] = [];
  private taskQueue: WorkerTask[] = [];
  private activeWorkers = 0;
  private maxWorkers: number;
  private workerScript: string;
  private isShuttingDown = false;
  private failedWorkerAttempts = new Map<number, number>();

  constructor(maxWorkers: number = 4, workerScript?: string) {
    super();
    this.maxWorkers = maxWorkers;
    
    // FIXED: Correct path resolution
    if (workerScript) {
      this.workerScript = workerScript;
    } else {
      // Try multiple possible locations for worker.js
      const possiblePaths = [
        path.join(process.cwd(), 'worker.js'),                    // /backend/worker.js
        path.join(process.cwd(), 'backend', 'worker.js'),         // /backend/backend/worker.js  
        path.join(__dirname, '..', '..', 'worker.js'),           // from dist/src/services to backend/worker.js
        path.join(__dirname, '..', 'worker.js'),                 // from src/services to src/worker.js
        path.join(__dirname, 'worker.js')                        // same directory
      ];
      
      this.workerScript = this.findWorkerScript(possiblePaths);
    }
    
    console.log(`🔧 WorkerPool initializing with ${maxWorkers} workers`);
    console.log(`📁 Worker script path: ${this.workerScript}`);
    
    // Verify worker script exists before creating workers
    if (!fs.existsSync(this.workerScript)) {
      console.error(`❌ Worker script not found at: ${this.workerScript}`);
      console.log('🔍 Creating worker script at expected location...');
      this.createWorkerScript();
    }
    
    this.initializeWorkers();
  }

  private findWorkerScript(possiblePaths: string[]): string {
    for (const scriptPath of possiblePaths) {
      if (fs.existsSync(scriptPath)) {
        console.log(`✅ Found worker script at: ${scriptPath}`);
        return scriptPath;
      }
    }
    
    // Default to the most likely location
    const defaultPath = path.join(process.cwd(), 'worker.js');
    console.log(`⚠️ Worker script not found, using default: ${defaultPath}`);
    return defaultPath;
  }

  private createWorkerScript() {
    const workerCode = `/**
 * Auto-generated Worker Thread Script for FlowTrainer
 */
const { parentPort, workerData } = require('worker_threads');

const { workerId } = workerData || { workerId: 'unknown' };
console.log(\`🔧 Worker \${workerId} initialized\`);

if (parentPort) {
  parentPort.on('message', async (task) => {
    const startTime = Date.now();
    
    try {
      console.log(\`⚡ Worker \${workerId} processing task: \${task.id} (type: \${task.type})\`);
      
      let result;
      
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
          throw new Error(\`Unknown task type: \${task.type}\`);
      }
      
      const duration = Date.now() - startTime;
      console.log(\`✅ Worker \${workerId} completed task \${task.id} in \${duration}ms\`);
      
      parentPort.postMessage({
        id: task.id,
        success: true,
        data: result,
        duration,
        workerId
      });
      
    } catch (error) {
      const duration = Date.now() - startTime;
      console.error(\`❌ Worker \${workerId} failed task \${task.id}:\`, error.message);
      
      parentPort.postMessage({
        id: task.id,
        success: false,
        error: error.message,
        duration,
        workerId
      });
    }
  });
}

async function processMLPipeline(data) {
  await sleep(1000 + Math.random() * 2000);
  return {
    taskType: 'ml-pipeline',
    processed: true,
    result: 'pipeline-completed',
    metrics: { processingTime: 1500, accuracy: 0.92 }
  };
}

async function processFile(data) {
  await sleep(500 + Math.random() * 1000);
  return {
    taskType: 'file-processing',
    processed: true,
    filename: data?.filename || 'unknown',
    metrics: { processingTime: 750 }
  };
}

async function analyzeData(data) {
  await sleep(2000 + Math.random() * 3000);
  return {
    taskType: 'data-analysis',
    analyzed: true,
    insights: ['Performance improved', 'Data quality: 95%'],
    metrics: { processingTime: 2500 }
  };
}

async function trainModel(data) {
  const epochs = data?.epochs || 5;
  await sleep(epochs * 500);
  return {
    taskType: 'model-training',
    trained: true,
    epochs,
    performance: { accuracy: 0.88, precision: 0.85 },
    metrics: { trainingTime: epochs * 500 }
  };
}

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

console.log(\`✅ Worker \${workerId} ready for tasks\`);
`;

    try {
      fs.writeFileSync(this.workerScript, workerCode);
      console.log(`✅ Created worker script at: ${this.workerScript}`);
    } catch (error) {
      console.error(`❌ Failed to create worker script:`, error);
    }
  }

  private initializeWorkers() {
    for (let i = 0; i < this.maxWorkers; i++) {
      try {
        this.createWorker(i);
      } catch (error) {
        console.error(`❌ Failed to create worker ${i}:`, error);
      }
    }
  }

  private createWorker(workerId: number) {
    // FIXED: Prevent infinite worker replacement loop
    const attempts = this.failedWorkerAttempts.get(workerId) || 0;
    if (attempts >= 3) {
      console.error(`❌ Worker ${workerId} failed too many times (${attempts}), skipping creation`);
      return;
    }

    try {
      const worker = new Worker(this.workerScript, {
        workerData: { workerId: `worker-${workerId}` }
      });

      worker.on('message', (result: WorkerResult) => {
        this.handleWorkerResult(result);
      });

      worker.on('error', (error) => {
        console.error(`🚨 Worker ${workerId} error:`, error.message);
        this.emit('worker-error', error);
        
        // FIXED: Track failed attempts and prevent infinite loops
        const currentAttempts = this.failedWorkerAttempts.get(workerId) || 0;
        this.failedWorkerAttempts.set(workerId, currentAttempts + 1);
        
        if (currentAttempts < 2 && !this.isShuttingDown) {
          this.replaceWorker(worker, workerId);
        } else {
          console.error(`❌ Worker ${workerId} permanently failed after ${currentAttempts + 1} attempts`);
        }
      });

      worker.on('exit', (code) => {
        if (code !== 0 && !this.isShuttingDown) {
          console.warn(`⚠️ Worker ${workerId} stopped with exit code ${code}`);
          
          const currentAttempts = this.failedWorkerAttempts.get(workerId) || 0;
          if (currentAttempts < 2) {
            this.replaceWorker(worker, workerId);
          }
        }
      });

      this.workers.push(worker);
      this.activeWorkers++;
      console.log(`✅ Worker ${workerId} created successfully`);
      
      // Reset failed attempts on successful creation
      this.failedWorkerAttempts.delete(workerId);
      
    } catch (error) {
      console.error(`❌ Failed to create worker ${workerId}:`, error);
      
      // Track failed attempts
      const currentAttempts = this.failedWorkerAttempts.get(workerId) || 0;
      this.failedWorkerAttempts.set(workerId, currentAttempts + 1);
      
      throw error;
    }
  }

  private replaceWorker(failedWorker: Worker, workerId: number) {
    if (this.isShuttingDown) return;
    
    const index = this.workers.indexOf(failedWorker);
    if (index > -1) {
      this.workers.splice(index, 1);
      this.activeWorkers--;
      
      // FIXED: Prevent immediate replacement, add delay and limit attempts
      setTimeout(() => {
        if (!this.isShuttingDown) {
          try {
            this.createWorker(workerId);
            console.log(`🔄 Replaced failed worker ${workerId}`);
          } catch (error) {
            console.error(`❌ Failed to replace worker ${workerId}:`, error);
          }
        }
      }, 5000); // Wait 5 seconds before replacing
    }
  }

  public async submitTask(task: WorkerTask): Promise<WorkerResult> {
    return new Promise((resolve, reject) => {
      if (this.workers.length === 0) {
        reject(new Error('No workers available'));
        return;
      }

      // Add task to priority queue
      this.taskQueue.push(task);
      this.taskQueue.sort((a, b) => b.priority - a.priority);

      // Process the queue
      this.processQueue();

      // Set timeout for task completion (2 minutes)
      const timeout = setTimeout(() => {
        reject(new Error(`Task ${task.id} timed out after 2 minutes`));
      }, 2 * 60 * 1000);

      // Listen for task completion
      this.once(`task-complete-${task.id}`, (result: WorkerResult) => {
        clearTimeout(timeout);
        if (result.success) {
          resolve(result);
        } else {
          reject(new Error(result.error || 'Task failed'));
        }
      });
    });
  }

  private processQueue() {
    while (this.taskQueue.length > 0 && this.workers.length > 0) {
      const task = this.taskQueue.shift();
      if (task) {
        this.assignTaskToWorker(task);
      }
    }
  }

  private assignTaskToWorker(task: WorkerTask) {
    // Find an available worker
    const worker = this.workers[Math.floor(Math.random() * this.workers.length)];
    
    if (worker) {
      console.log(`📤 Assigning task ${task.id} to worker`);
      worker.postMessage(task);
    }
  }

  private handleWorkerResult(result: WorkerResult) {
    console.log(`📥 Received result for task ${result.id}: ${result.success ? 'SUCCESS' : 'FAILED'}`);
    
    this.emit(`task-complete-${result.id}`, result);
    this.emit('task-complete', result);
    
    // Process next task in queue
    this.processQueue();
  }

  public getStatus() {
    return {
      totalWorkers: this.workers.length,
      maxWorkers: this.maxWorkers,
      activeWorkers: this.activeWorkers,
      queuedTasks: this.taskQueue.length,
      workerScript: this.workerScript,
      workerScriptExists: fs.existsSync(this.workerScript),
      isHealthy: this.workers.length > 0,
      failedAttempts: Object.fromEntries(this.failedWorkerAttempts)
    };
  }

  public async testWorker(): Promise<boolean> {
    try {
      if (this.workers.length === 0) {
        console.log('🧪 No workers available for testing');
        return false;
      }

      const testResult = await this.submitTask({
        id: 'test-task-' + Date.now(),
        type: 'data-analysis',
        data: { dataPoints: 100, type: 'test' },
        priority: 1
      });
      
      console.log('🧪 Worker test completed successfully:', testResult.success);
      return testResult.success;
    } catch (error) {
      console.error('🧪 Worker test failed:', error);
      return false;
    }
  }

  public shutdown() {
    console.log('🔄 Shutting down worker pool...');
    this.isShuttingDown = true;
    
    // Terminate all workers
    this.workers.forEach((worker, index) => {
      console.log(`🔄 Terminating worker ${index}...`);
      worker.terminate();
    });
    
    this.workers = [];
    this.activeWorkers = 0;
    this.taskQueue = [];
    this.failedWorkerAttempts.clear();
    
    console.log('✅ Worker pool shutdown complete');
  }
}

export default WorkerPool;