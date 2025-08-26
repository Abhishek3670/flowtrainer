#!/usr/bin/env node

/**
 * Performance Improvement Validation Script
 * Tests the optimizations we've implemented to measure their impact
 */

const axios = require('axios');
const { performanceMonitor } = require('../dist/profiling/performance-monitor');

// Configuration
const API_BASE = 'http://localhost:4000/api';
const TEST_ITERATIONS = 10;
const CONCURRENT_REQUESTS = 5;

console.log('🧪 Testing Performance Improvements...');
console.log('=====================================\n');

// Performance monitoring
performanceMonitor.startMonitoring();

// Test results
const results = {
  baseline: {},
  optimized: {},
  improvements: {}
};

// Function to make concurrent requests
async function makeConcurrentRequests(endpoint, count = CONCURRENT_REQUESTS) {
  const promises = [];
  for (let i = 0; i < count; i++) {
    promises.push(
      axios.get(`${API_BASE}${endpoint}`)
        .then(response => ({ success: true, data: response.data }))
        .catch(error => ({ success: false, error: error.message }))
    );
  }
  
  const startTime = Date.now();
  const responses = await Promise.all(promises);
  const duration = Date.now() - startTime;
  
  return {
    responses,
    duration,
    successCount: responses.filter(r => r.success).length,
    errorCount: responses.filter(r => !r.success).length
  };
}

// Function to test endpoint performance
async function testEndpoint(endpoint, name, iterations = TEST_ITERATIONS) {
  console.log(`📊 Testing ${name} (${endpoint})...`);
  
  const durations = [];
  const memoryUsage = [];
  const successCount = 0;
  const errorCount = 0;
  
  for (let i = 0; i < iterations; i++) {
    const startTime = Date.now();
    const startMemory = process.memoryUsage().heapUsed;
    
    try {
      const result = await makeConcurrentRequests(endpoint);
      const duration = Date.now() - startTime;
      const endMemory = process.memoryUsage().heapUsed;
      
      durations.push(duration);
      memoryUsage.push(endMemory - startMemory);
      
      if (i % 5 === 0) {
        process.stdout.write('.');
      }
      
    } catch (error) {
      console.error(`\n❌ Error in iteration ${i}:`, error.message);
    }
  }
  
  console.log(''); // New line after dots
  
  const avgDuration = durations.reduce((a, b) => a + b, 0) / durations.length;
  const avgMemory = memoryUsage.reduce((a, b) => a + b, 0) / memoryUsage.length;
  const minDuration = Math.min(...durations);
  const maxDuration = Math.max(...durations);
  
  return {
    name,
    endpoint,
    iterations,
    avgDuration: Math.round(avgDuration),
    minDuration,
    maxDuration,
    avgMemory: Math.round(avgMemory / 1024 / 1024), // Convert to MB
    successRate: ((successCount / iterations) * 100).toFixed(2)
  };
}

// Function to run performance tests
async function runPerformanceTests() {
  console.log('🚀 Starting Performance Tests...\n');
  
  // Test 1: Health endpoint (baseline)
  const healthTest = await testEndpoint('/health', 'Health Check');
  results.baseline.health = healthTest;
  
  // Test 2: Performance endpoint
  const performanceTest = await testEndpoint('/performance', 'Performance Metrics');
  results.baseline.performance = performanceTest;
  
  // Test 3: Cache endpoint
  const cacheTest = await testEndpoint('/performance/cache', 'Cache Statistics');
  results.baseline.cache = cacheTest;
  
  // Test 4: Optimization endpoint
  const optimizationTest = await testEndpoint('/performance/optimization', 'Performance Optimization');
  results.baseline.optimization = optimizationTest;
  
  // Test 5: Cache hit scenario (make same request multiple times)
  console.log('🔄 Testing cache effectiveness...');
  const cacheHitTest = await testEndpoint('/performance/cache', 'Cache Hit Test', 20);
  results.optimized.cacheHit = cacheHitTest;
  
  // Test 6: Concurrent heavy load
  console.log('🔥 Testing concurrent heavy load...');
  const heavyLoadTest = await testEndpoint('/performance', 'Heavy Load Test', 15);
  results.optimized.heavyLoad = heavyLoadTest;
  
  return results;
}

// Function to analyze improvements
function analyzeImprovements(results) {
  console.log('\n📈 Performance Analysis');
  console.log('=======================\n');
  
  // Compare cache hit vs baseline
  if (results.baseline.cache && results.optimized.cacheHit) {
    const durationImprovement = ((results.baseline.cache.avgDuration - results.optimized.cacheHit.avgDuration) / results.baseline.cache.avgDuration * 100).toFixed(2);
    const memoryImprovement = ((results.baseline.cache.avgMemory - results.optimized.cacheHit.avgMemory) / results.baseline.cache.avgMemory * 100).toFixed(2);
    
    console.log(`💾 Cache Performance:`);
    console.log(`   Duration improvement: ${durationImprovement}%`);
    console.log(`   Memory improvement: ${memoryImprovement}%`);
    console.log(`   Baseline: ${results.baseline.cache.avgDuration}ms`);
    console.log(`   Cached: ${results.optimized.cacheHit.avgDuration}ms`);
    console.log('');
  }
  
  // Compare heavy load vs baseline
  if (results.baseline.performance && results.optimized.heavyLoad) {
    const loadHandling = ((results.optimized.heavyLoad.avgDuration - results.baseline.performance.avgDuration) / results.baseline.performance.avgDuration * 100).toFixed(2);
    
    console.log(`⚡ Load Handling:`);
    console.log(`   Load increase: ${loadHandling}%`);
    console.log(`   Baseline: ${results.baseline.performance.avgDuration}ms`);
    console.log(`   Heavy load: ${results.optimized.heavyLoad.avgDuration}ms`);
    console.log('');
  }
  
  // Overall performance metrics
  const performanceReport = performanceMonitor.getPerformanceReport();
  console.log(`📊 Overall Performance:`);
  console.log(`   System load: ${performanceReport.systemLoad}`);
  console.log(`   Current heap: ${performanceReport.current?.memory.heapUsed}MB`);
  console.log(`   CPU usage: ${performanceReport.current?.cpu.usage}%`);
  console.log(`   Event loop lag: ${performanceReport.current?.eventLoop.lag}ms`);
  console.log('');
  
  // Recommendations
  console.log(`💡 Recommendations:`);
  performanceReport.recommendations.forEach(rec => {
    console.log(`   • ${rec}`);
  });
}

// Function to generate test report
function generateTestReport(results) {
  const fs = require('fs');
  const reportPath = `performance-reports/improvement-test-${Date.now()}.json`;
  
  const report = {
    timestamp: new Date().toISOString(),
    testResults: results,
    performanceReport: performanceMonitor.getPerformanceReport(),
    summary: {
      totalTests: Object.keys(results.baseline).length + Object.keys(results.optimized).length,
      baselineTests: Object.keys(results.baseline),
      optimizedTests: Object.keys(results.optimized)
    }
  };
  
  fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));
  console.log(`📁 Test report saved to: ${reportPath}`);
}

// Main execution
async function main() {
  try {
    // Check if server is running
    try {
      await axios.get(`${API_BASE}/health`);
      console.log('✅ Server is running and accessible\n');
    } catch (error) {
      console.error('❌ Server is not accessible. Please start the server first.');
      process.exit(1);
    }
    
    // Run tests
    const testResults = await runPerformanceTests();
    
    // Analyze results
    analyzeImprovements(testResults);
    
    // Generate report
    generateTestReport(testResults);
    
    console.log('🎉 Performance improvement testing completed!');
    
  } catch (error) {
    console.error('❌ Testing failed:', error.message);
  } finally {
    // Stop monitoring
    performanceMonitor.stopMonitoring();
  }
}

// Handle graceful shutdown
process.on('SIGINT', () => {
  console.log('\n⏹️  Stopping performance tests...');
  performanceMonitor.stopMonitoring();
  process.exit(0);
});

// Start testing
main();
