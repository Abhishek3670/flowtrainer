// backend/scripts/test-websocket-performance.js
const WebSocketClient = require('../src/services/websocket-client').default;
const axios = require('axios');

async function testWebSocketPerformance() {
  console.log('🧪 Testing WebSocket Performance...');
  
  const clients = [];
  const numClients = 20;
  const testDuration = 30000; // 30 seconds
  
  try {
    // Create multiple clients
    console.log(`📊 Creating ${numClients} WebSocket clients...`);
    for (let i = 0; i < numClients; i++) {
      const client = new WebSocketClient();
      await client.connect(`test-user-${i}`);
      clients.push(client);
    }
    
    console.log(`✅ All ${numClients} clients connected`);
    
    // Subscribe to performance monitoring
    clients.subscribeToPerformance((metrics) => {
      console.log(`📊 Real-time metrics: ${metrics.activeConnections} active, ${metrics.messagesPerSecond.toFixed(2)} msg/s`);
    });
    
    // Send messages from all clients
    const messageInterval = setInterval(() => {
      clients.forEach((client, index) => {
        client.socket?.emit('test-message', { 
          clientId: index, 
          timestamp: Date.now() 
        });
      });
    }, 1000);
    
    // Test for specified duration
    await new Promise(resolve => setTimeout(resolve, testDuration));
    
    // Get final metrics
    const response = await axios.get('http://localhost:4000/api/websocket/metrics');
    console.log('📊 Final WebSocket metrics:', response.data);
    
    // Cleanup
    clearInterval(messageInterval);
    clients.forEach(client => client.disconnect());
    
    console.log('✅ WebSocket performance test completed');
    
  } catch (error) {
    console.error('❌ WebSocket test failed:', error);
  }
}

if (require.main === module) {
  testWebSocketPerformance();
}

module.exports = testWebSocketPerformance;