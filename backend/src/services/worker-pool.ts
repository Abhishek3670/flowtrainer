import { Worker, isMainThread, parentPort, workerData } from 'worker_threads';
import { EventEmitter } from 'events';

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
}

export class WorkerPool extends EventEmitter {
  private workers: Worker[] = [];
  private taskQueue: WorkerTask[] = [];
  private activeWorkers = 0;
  private maxWorkers: number;
  private workerScript: string;

  constructor(maxWorkers: number = 4, workerScript: string = './worker.js') {
    super();
    this.maxWorkers = maxWorkers;
    this.workerScript = workerScript;
    this.initializeWorkers();
  }

  private initializeWorkers() {
    for (let i = 0; i < this.maxWorkers; i++) {
      this.createWorker();
    }
  }

  private createWorker() {
    const worker = new Worker(this.workerScript, {
      workerData: { workerId: this.workers.length }
    });

    worker.on('message', (result: WorkerResult) => {
      this.handleWorkerResult(result);
    });

    worker.on('error', (error) => {
      console.error('Worker error:', error);
      this.emit('worker-error', error);
      this.replaceWorker(worker);
    });

    worker.on('exit', (code) => {
      if (code !== 0) {
        console.warn(`Worker stopped with exit code ${code}`);
        this.replaceWorker(worker);
      }
    });

    this.workers.push(worker);
    this.activeWorkers++;
  }

  private replaceWorker(failedWorker: Worker) {
    const index = this.workers.indexOf(failedWorker);
    if (index > -1) {
      this.workers.splice(index, 1);
      this.activeWorkers--;
      this.createWorker();
    }
  }

  public async submitTask(task: WorkerTask): Promise<WorkerResult> {
    return new Promise((resolve, reject) => {
      // Add priority-based queuing
      this.taskQueue.push(task);
      this.taskQueue.sort((a, b) => b.priority - a.priority);

      // Process queue
      this.processQueue();

      // Set timeout for task completion
      const timeout = setTimeout(() => {
        reject(new Error(`Task ${task.id} timed out`));
      }, 300000); // 5 minutes

      // Listen for task completion
      this.once(`task-complete-${task.id}`, (result: WorkerResult) => {
        clearTimeout(timeout);
        resolve(result);
      });
    });
  }

  private processQueue() {
    while (this.taskQueue.length > 0 && this.activeWorkers > 0) {
      const task = this.taskQueue.shift();
      if (task) {
        this.assignTaskToWorker(task);
      }
    }
  }

  private assignTaskToWorker(task: WorkerTask) {
    const availableWorker = this.workers.find(worker => 
      !worker.listenerCount('message')
    );

    if (availableWorker) {
      availableWorker.postMessage(task);
    }
  }

  private handleWorkerResult(result: WorkerResult) {
    this.emit(`task-complete-${result.id}`, result);
    this.emit('task-complete', result);
    
    // Process next task in queue
    this.processQueue();
  }

  public getStatus() {
    return {
      totalWorkers: this.workers.length,
      activeWorkers: this.activeWorkers,
      queuedTasks: this.taskQueue.length,
      workerIds: this.workers.map((_, index) => index)
    };
  }

  public shutdown() {
    console.log('🔄 Shutting down worker pool...');
    
    // Terminate all workers
    this.workers.forEach(worker => {
      worker.terminate();
    });
    
    this.workers = [];
    this.activeWorkers = 0;
    this.taskQueue = [];
    
    console.log('✅ Worker pool shutdown complete');
  }
}

// Worker thread implementation
if (!isMainThread) {
  const { workerId } = workerData;
  
  parentPort?.on('message', async (task: WorkerTask) => {
    const startTime = Date.now();
    
    try {
      console.log(`Worker ${workerId} processing task: ${task.id}`);
      
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
          throw new Error(`Unknown task type: ${task.type}`);
      }
      
      const duration = Date.now() - startTime;
      
      parentPort?.postMessage({
        id: task.id,
        success: true,
        data: result,
        duration
      });
      
    } catch (error) {
      const duration = Date.now() - startTime;
      
      parentPort?.postMessage({
        id: task.id,
        success: false,
        error: error instanceof Error ? error.message : String(error),
        duration
      });
    }
  });
}

// Mock implementations for worker tasks
async function processMLPipeline(data: any) {
  // Simulate ML pipeline processing
  await new Promise(resolve => setTimeout(resolve, 1000 + Math.random() * 2000));
  return { processed: true, result: 'pipeline-completed' };
}

async function processFile(data: any) {
  // Simulate file processing
  await new Promise(resolve => setTimeout(resolve, 500 + Math.random() * 1000));
  return { processed: true, filename: data.filename };
}

async function analyzeData(data: any) {
  // Simulate data analysis
  await new Promise(resolve => setTimeout(resolve, 2000 + Math.random() * 3000));
  return { analyzed: true, insights: ['insight1', 'insight2'] };
}

async function trainModel(data: any) {
  // Simulate model training
  await new Promise(resolve => setTimeout(resolve, 5000 + Math.random() * 10000));
  return { trained: true, accuracy: 0.85 };
}

export default WorkerPool;
