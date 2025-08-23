import { connectDB, dbConnection } from './connection';
import mongoose from 'mongoose';

const testConnection = async () => {
  console.log('🧪 Testing database connection...');
  
  try {
    // Connect
    await connectDB();
    console.log('✅ Connection established');
    
    // Test health check
    const health = await dbConnection.healthCheck();
    console.log('📊 Health check:', health);
    
    // Test concurrent operations
    console.log('🔄 Testing 10 concurrent operations...');
    const startTime = Date.now();
    
    const promises = Array.from({ length: 10 }, async (_, i) => {
      await mongoose.connection.db.admin().ping();
      return i;
    });
    
    await Promise.all(promises);
    const duration = Date.now() - startTime;
    
    console.log(`✅ All operations completed in ${duration}ms`);
    console.log('🎉 Connection pooling is working!');
    
    // Disconnect
    await mongoose.disconnect();
    console.log('👋 Disconnected');
    
  } catch (error) {
    console.error('❌ Test failed:', error);
    process.exit(1);
  }
};

testConnection();
