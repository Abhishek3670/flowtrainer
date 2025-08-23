import { connectDB, disconnectDB, dbConnection } from './connection';
import mongoose from 'mongoose';

describe('Database Connection Pooling', () => {
  beforeAll(async () => {
    await connectDB();
  });

  afterAll(async () => {
    await disconnectDB();
  });

  test('should establish connection with pooling', async () => {
    const connection = dbConnection.getConnection();
    expect(connection).toBeTruthy();
    expect(connection?.readyState).toBe(1); // connected
  });

  test('should handle multiple concurrent connections', async () => {
    const promises = Array.from({ length: 15 }, () => 
      mongoose.connection.db.collection('test').findOne({})
    );
    
    const results = await Promise.allSettled(promises);
    const failed = results.filter(r => r.status === 'rejected');
    
    expect(failed.length).toBe(0);
    console.log(`✅ Handled ${promises.length} concurrent operations successfully`);
  });

  test('should provide health check information', async () => {
    const health = await dbConnection.healthCheck();
    
    expect(health.status).toBe('healthy');
    expect(health.details).toHaveProperty('readyState');
    expect(health.details).toHaveProperty('dbStats');
  });
});

// Manual stress test function
export const stressTestConnections = async () => {
  console.log('🧪 Starting connection stress test...');
  
  const concurrentOperations = 50;
  const operationsPerConnection = 10;
  
  const startTime = Date.now();
  
  try {
    const promises = Array.from({ length: concurrentOperations }, async (_, i) => {
      for (let j = 0; j < operationsPerConnection; j++) {
        await mongoose.connection.db.collection('workflows').findOne({});
      }
      return i;
    });
    
    await Promise.all(promises);
    
    const duration = Date.now() - startTime;
    const totalOps = concurrentOperations * operationsPerConnection;
    
    console.log(`✅ Stress test completed:`);
    console.log(`   Operations: ${totalOps}`);
    console.log(`   Duration: ${duration}ms`);
    console.log(`   Ops/sec: ${Math.round(totalOps / (duration / 1000))}`);
    
  } catch (error) {
    console.error('❌ Stress test failed:', error);
  }
};
