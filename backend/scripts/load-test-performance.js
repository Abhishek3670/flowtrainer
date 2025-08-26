#!/usr/bin/env node

/**
 * Performance Load Testing Script
 * Tests the application under various load conditions to validate performance improvements
 */

const autocannon = require('autocannon');
const { performanceMonitor } = require('../dist/profiling/performance-monitor');

// Configuration
const API_BASE = 'http://localhost:4000/api';
const TEST_SCENARIOS = [
  { name: 'Light Load', connections: 5, duration: 30, pipelining: 1 },
  { name: 'Medium Load', connections: 15, duration: 30, pipelining: 2 },
  { name: 'Heavy Load', connections: 30, duration: 30, pipelining: 3 },
  { name: 'Stress Test', connections: 50, duration: 30, pipelining: 5 }
];

// Performance monitoring
performanceMonitor.startMonitoring();

console.log('🚀 Starting Performance Load Testing...');
console.log('=====================================\n');

// Track results
const results = [];
let currentTest = 0;

// Function to run a single test scenario
async function runTest(scenario) {
  console.log(`📊 Running ${scenario.name}...`);
  console.log(`   Connections: ${scenario.connections}`);
  console.log(`   Duration: ${scenario.duration}s`);
  console.log(`   Pipelining: ${scenario.pipelining}`);
  
  // Get baseline metrics
  const baseline = performanceMonitor.getPerformanceReport();
  
  // Run autocannon test
  const result = await autocannon({
    url: `${API_BASE}/health`,
    connections: scenario.connections,
    duration: scenario.duration,
    pipelining: scenario.pipelining,
    headers: {
      'Content-Type': 'application/json'
    }
  });
  
  // Get final metrics
  const final = performanceMonitor.getPerformanceReport();
  
  // Calculate performance impact
  const performanceImpact = {
    memoryIncrease: final.current?.memory.heapUsed - baseline.current?.memory.heapUsed || 0,
    cpuIncrease: final.current?.cpu.usage - baseline.current?.cpu.usage || 0,
    eventLoopLag: final.current?.eventLoop.lag || 0
  };
  
  // Store results
  const testResult = {
    scenario: scenario.name,
    autocannon: result,
    performance: {
      baseline,
      final,
      impact: performanceImpact
    },
    timestamp: new Date()
  };
  
  results.push(testResult);
  
  // Log results
  console.log(`✅ ${scenario.name} completed:`);
  console.log(`   Requests/sec: ${result.requests.average.toFixed(2)}`);
  console.log(`   Latency (avg): ${result.latency.average.toFixed(2)}ms`);
  console.log(`   Memory increase: ${performanceImpact.memoryIncrease}MB`);
  console.log(`   CPU increase: ${performanceImpact.cpuIncrease.toFixed(2)}%`);
  console.log(`   Event loop lag: ${performanceImpact.eventLoopLag.toFixed(2)}ms`);
  console.log('');
  
  return testResult;
}

// Function to run all tests sequentially
async function runAllTests() {
  console.log('🔄 Starting test sequence...\n');
  
  for (const scenario of TEST_SCENARIOS) {
    try {
      await runTest(scenario);
      currentTest++;
      
      // Wait between tests to let system stabilize
      if (currentTest < TEST_SCENARIOS.length) {
        console.log('⏳ Waiting 10 seconds before next test...\n');
        await new Promise(resolve => setTimeout(resolve, 10000));
      }
      
    } catch (error) {
      console.error(`❌ Error in ${scenario.name}:`, error.message);
    }
  }
  
  // Generate final report
  generateReport();
}

// Function to generate performance report
function generateReport() {
  console.log('📋 Generating Performance Report...\n');
  
  // Calculate summary statistics
  const summary = {
    totalTests: results.length,
    averageThroughput: results.reduce((sum, r) => sum + r.autocannon.requests.average, 0) / results.length,
    averageLatency: results.reduce((sum, r) => sum + r.autocannon.latency.average, 0) / results.length,
    maxMemoryIncrease: Math.max(...results.map(r => r.performance.impact.memoryIncrease)),
    maxCPUIncrease: Math.max(...results.map(r => r.performance.impact.cpuIncrease)),
    maxEventLoopLag: Math.max(...results.map(r => r.performance.impact.eventLoopLag))
  };
  
  console.log('📊 PERFORMANCE TEST SUMMARY');
  console.log('==========================');
  console.log(`Total Tests: ${summary.totalTests}`);
  console.log(`Average Throughput: ${summary.averageThroughput.toFixed(2)} req/sec`);
  console.log(`Average Latency: ${summary.averageLatency.toFixed(2)}ms`);
  console.log(`Max Memory Increase: ${summary.maxMemoryIncrease}MB`);
  console.log(`Max CPU Increase: ${summary.maxCPUIncrease.toFixed(2)}%`);
  console.log(`Max Event Loop Lag: ${summary.maxEventLoopLag.toFixed(2)}ms`);
  console.log('');
  
  // Performance recommendations
  console.log('💡 PERFORMANCE RECOMMENDATIONS');
  console.log('==============================');
  
  if (summary.maxMemoryIncrease > 100) {
    console.log('⚠️  High memory usage detected - consider optimizing data structures');
  }
  
  if (summary.maxCPUIncrease > 50) {
    console.log('⚠️  High CPU usage detected - consider using worker threads');
  }
  
  if (summary.maxEventLoopLag > 100) {
    console.log('⚠️  High event loop lag detected - check for blocking operations');
  }
  
  if (summary.averageLatency > 1000) {
    console.log('⚠️  High latency detected - optimize database queries and caching');
  }
  
  // Save detailed results
  const fs = require('fs');
  const reportPath = `performance-reports/load-test-${Date.now()}.json`;
  
  fs.writeFileSync(reportPath, JSON.stringify({
    summary,
    results,
    recommendations: performanceMonitor.getPerformanceReport().recommendations
  }, null, 2));
  
  console.log(`📁 Detailed results saved to: ${reportPath}`);
  
  // Stop monitoring
  performanceMonitor.stopMonitoring();
}

// Handle graceful shutdown
process.on('SIGINT', () => {
  console.log('\n⏹️  Stopping load testing...');
  performanceMonitor.stopMonitoring();
  process.exit(0);
});

// Start testing
runAllTests().catch(error => {
  console.error('❌ Load testing failed:', error);
  performanceMonitor.stopMonitoring();
  process.exit(1);
});
