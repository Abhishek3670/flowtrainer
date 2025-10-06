const axios = require('axios');

async function verifyServer() {
  console.log('🔍 Verifying server is running...\n');
  
  try {
    // Test the basic health endpoint
    const healthResponse = await axios.get('http://localhost:4000/health');
    console.log(`✅ Server health check: ${healthResponse.status}`);
    console.log(`📦 Health data: ${JSON.stringify(healthResponse.data)}\n`);
    
    // Test the admin health endpoint
    const adminHealthResponse = await axios.get('http://localhost:4000/api/admin/health');
    console.log(`✅ Admin API health check: ${adminHealthResponse.status}`);
    console.log(`📦 Admin health data: ${JSON.stringify(adminHealthResponse.data)}\n`);
    
    console.log('🎉 Server verification completed successfully!');
    console.log('You can now test the admin APIs with authentication.');
    
  } catch (error) {
    console.log(`❌ Server verification failed: ${error.message}`);
    console.log('\n🔧 Troubleshooting steps:');
    console.log('1. Make sure the backend server is running (npm run dev)');
    console.log('2. Check if the server is running on port 4000');
    console.log('3. Verify MongoDB is accessible');
    console.log('4. Check the server logs for any errors');
  }
}

verifyServer();