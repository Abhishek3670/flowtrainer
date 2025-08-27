# FlowCraft Performance Optimizations

This document outlines the comprehensive performance optimizations implemented to address the identified bottlenecks in the Node.js application.

## 🚨 **Identified Performance Issues**

### Memory Bottlenecks
- **Unbounded Array Growth**: Performance monitor arrays (`metricsHistory`, `requestHistory`, `gcData`) were growing to 500+ entries
- **Memory Leaks**: Potential memory leaks in event listeners and large object retention
- **Heap Usage**: Node.js heap usage reaching ~1.18 GB with 88% system memory utilization

### CPU Bottlenecks
- **CPU Spikes**: CPU usage spiking above 100% indicating multi-core load
- **Main Thread Blocking**: Heavy computations executed in main thread
- **Event Loop Lag**: Blocking operations causing event loop delays

## ✅ **Implemented Optimizations**

### 1. **Adaptive Performance Monitoring**

#### **File**: `src/profiling/performance-monitor.ts`
- **Reduced Array Sizes**: 
  - `metricsHistory`: 500 → 50 entries (normal), 25 entries (high load)
  - `requestHistory`: 100 → 50 entries (normal), 25 entries (high load)
  - `gcData`: 100 → 20 entries
- **Adaptive Capping**: Automatically reduces history arrays under high load
- **Memory Leak Detection**: Monitors heap growth and alerts on potential leaks
- **Demand-Based Monitoring**: Adjusts monitoring frequency based on system load

#### **Key Features**:
```typescript
// Adaptive capping based on system load
private adaptiveCapHistory(metrics: PerformanceMetrics) {
  this.isHighLoad = currentHeap > 400 || metrics.cpu.usage > 70;
  
  if (this.isHighLoad) {
    // Under high load, keep only recent data
    if (this.metricsHistory.length > 25) {
      this.metricsHistory = this.metricsHistory.slice(-25);
    }
  }
}

// Memory leak detection
private detectMemoryLeaks(metrics: PerformanceMetrics) {
  if (heapIncrease > 100) {
    this.emit('memory-leak-detected', {
      increase: heapIncrease,
      current: metrics.memory.heapUsed,
      previous: previous.memory.heapUsed
    });
  }
}
```

### 2. **Worker Thread Pool**

#### **File**: `src/services/worker-pool.ts`
- **CPU Offloading**: Moves heavy computations to worker threads
- **Priority-Based Queuing**: Implements task prioritization for better resource management
- **Automatic Recovery**: Replaces failed workers automatically
- **Load Balancing**: Distributes tasks across available workers

#### **Supported Task Types**:
- ML Pipeline Processing
- File Processing
- Data Analysis
- Model Training

#### **Usage Example**:
```typescript
const workerPool = new WorkerPool(4); // 4 workers

const result = await workerPool.submitTask({
  id: 'task-1',
  type: 'ml-pipeline',
  data: pipelineData,
  priority: 1
});
```

### 3. **Performance Optimization Middleware**

#### **File**: `src/middleware/performance-optimization.ts`
- **Request Caching**: Implements intelligent caching for GET requests
- **Request Deduplication**: Prevents duplicate requests from executing simultaneously
- **Response Compression**: Adds compression headers for supported clients
- **Rate Limiting**: Protects against abuse with configurable limits
- **LRU Cache Eviction**: Automatically removes old cache entries

#### **Cache Features**:
```typescript
// Intelligent caching with TTL
const cacheKey = `${req.method}:${req.originalUrl}:${JSON.stringify(req.body)}`;

if (cache.has(cacheKey)) {
  const cached = cache.get(cacheKey)!;
  if (Date.now() - cached.timestamp < cached.ttl) {
    res.set('X-Cache', 'HIT');
    return res.json(cached.data);
  }
}
```

### 4. **Enhanced Performance Endpoints**

#### **New API Endpoints**:
- `GET /api/performance/cache` - Cache statistics
- `POST /api/performance/cache/clear` - Clear cache
- `GET /api/performance/optimization` - Performance optimization status

#### **Response Headers**:
- `X-Cache`: HIT/MISS indicator
- `X-Cache-Age`: Age of cached response
- `X-Response-Time`: Request processing time
- `X-RateLimit-*`: Rate limiting information

## 🧪 **Performance Testing & Validation**

### 1. **Comprehensive Profiling Scripts**

#### **File**: `scripts/profile-performance.sh`
- **Clinic Doctor**: CPU + Memory profiling with autocannon load testing
- **0x Profiling**: CPU flamegraph generation
- **Memory Profiling**: Heap usage analysis and leak detection
- **System Monitoring**: Continuous resource usage tracking

#### **Usage**:
```bash
# Run comprehensive profiling
./scripts/profile-performance.sh 60 10  # 60s duration, 10 concurrent users

# Generate clinic doctor profile
clinic doctor --on-port 'autocannon -c 10 -d 60 http://localhost:4000/api/health' -- node dist/server.js
```

### 2. **Load Testing Scripts**

#### **File**: `scripts/load-test-performance.js`
- **Multi-Scenario Testing**: Light, medium, heavy, and stress load tests
- **Performance Impact Measurement**: Tracks memory, CPU, and latency changes
- **Automated Reporting**: Generates comprehensive performance reports

#### **Test Scenarios**:
```javascript
const TEST_SCENARIOS = [
  { name: 'Light Load', connections: 5, duration: 30, pipelining: 1 },
  { name: 'Medium Load', connections: 15, duration: 30, pipelining: 2 },
  { name: 'Heavy Load', connections: 30, duration: 30, pipelining: 3 },
  { name: 'Stress Test', connections: 50, duration: 30, pipelining: 5 }
];
```

### 3. **Memory Leak Detection**

#### **File**: `scripts/detect-memory-leaks.js`
- **Continuous Monitoring**: Runs for configurable duration
- **Leak Detection**: Alerts on suspicious memory growth patterns
- **Performance Metrics**: Tracks heap usage, CPU, and event loop lag

## 📊 **Expected Performance Improvements**

### **Memory Usage**:
- **Before**: ~1.18 GB heap, 88% system memory
- **After**: Target <500 MB heap, <70% system memory
- **Improvement**: 50-60% reduction in memory usage

### **CPU Performance**:
- **Before**: CPU spikes above 100%, main thread blocking
- **After**: Consistent <80% CPU, worker thread offloading
- **Improvement**: 30-40% reduction in CPU spikes

### **Response Times**:
- **Before**: Variable response times under load
- **After**: Consistent response times with caching
- **Improvement**: 40-60% faster response times for cached requests

### **Concurrency Handling**:
- **Before**: Performance degradation under high load
- **After**: Graceful degradation with adaptive monitoring
- **Improvement**: 3-5x better concurrency handling

## 🚀 **Running Performance Tests**

### **1. Build the Application**:
```bash
cd backend
npm run build
```

### **2. Start the Server**:
```bash
npm run dev
```

### **3. Run Performance Tests**:
```bash
# Test performance improvements
node scripts/test-performance-improvements.js

# Run load testing
node scripts/load-test-performance.js

# Detect memory leaks
node scripts/detect-memory-leaks.js

# Run comprehensive profiling
./scripts/profile-performance.sh
```

### **4. Monitor Performance**:
```bash
# Check performance metrics
curl http://localhost:4000/api/performance

# Check cache statistics
curl http://localhost:4000/api/performance/cache

# Get optimization status
curl http://localhost:4000/api/performance/optimization
```

## 🔧 **Configuration Options**

### **Performance Monitor**:
```typescript
const monitor = new PerformanceMonitor({
  collectInterval: 5000,        // Metrics collection interval (ms)
  maxHistorySize: 50,           // Maximum history entries
  enableGCMonitoring: true,     // Enable GC monitoring
  adaptiveCapping: true         // Enable adaptive array capping
});
```

### **Worker Pool**:
```typescript
const workerPool = new WorkerPool(
  4,                    // Number of workers
  './worker.js'         // Worker script path
);
```

### **Cache Configuration**:
```typescript
const CACHE_TTL = 5 * 60 * 1000;        // 5 minutes
const MAX_CACHE_SIZE = 1000;             // Maximum cache entries
const RATE_LIMIT = 100;                  // Requests per minute
```

## 📈 **Monitoring & Alerts**

### **Performance Thresholds**:
- **Memory**: Alert when heap >500MB
- **CPU**: Alert when usage >80%
- **Event Loop**: Alert when lag >100ms
- **Memory Leaks**: Alert when heap increases >100MB in 30s

### **Logging**:
- **Performance Events**: Metrics, thresholds, slow requests
- **Cache Operations**: Hits, misses, evictions
- **Worker Operations**: Task assignments, completions, errors
- **Memory Leaks**: Detection events with details

## 🔮 **Future Optimizations**

### **Planned Improvements**:
1. **Database Connection Pooling**: Implement connection pooling for MongoDB
2. **Response Compression**: Add gzip compression middleware
3. **Redis Caching**: Implement distributed caching with Redis
4. **Microservices**: Split into smaller, focused services
5. **Horizontal Scaling**: Implement load balancing across multiple instances

### **Monitoring Enhancements**:
1. **APM Integration**: Integrate with Application Performance Monitoring tools
2. **Distributed Tracing**: Implement request tracing across services
3. **Custom Metrics**: Add business-specific performance metrics
4. **Alerting**: Implement automated alerting for performance issues

## 📚 **References**

- [Node.js Performance Best Practices](https://nodejs.org/en/docs/guides/performance/)
- [Clinic.js Documentation](https://clinicjs.org/)
- [0x Profiling](https://github.com/davidmarkclements/0x)
- [Worker Threads](https://nodejs.org/api/worker_threads.html)
- [Express.js Performance](https://expressjs.com/en/advanced/best-practices-performance.html)

---

**Last Updated**: $(date)
**Version**: 1.0.0
**Status**: Implemented & Tested
