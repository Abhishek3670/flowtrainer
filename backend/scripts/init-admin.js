require('dotenv').config();
const { MongoClient, ObjectId } = require('mongodb');
const bcrypt = require('bcryptjs');
const logger = require('../src/utils/logger');

async function initAdmin() {
  let client;
  
  try {
    // Connect to MongoDB
    client = new MongoClient(process.env.MONGO_URI);
    await client.connect();
    
    const db = client.db();
    logger.info('Connected to MongoDB');

    // Check if admin user already exists
    const existingAdmin = await db.collection('users').findOne({ email: 'admin@flowtrainer.com' });
    
    if (existingAdmin) {
      logger.info('Admin user already exists');
      return;
    }

    // Create admin user
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash('admin123', salt);

    const adminUser = {
      _id: new ObjectId('000000000000000000000001'),
      name: 'System Administrator',
      email: 'admin@flowtrainer.com',
      password: hashedPassword,
      role: 'super-admin',
      permissions: [
        'manage_users',
        'manage_roles',
        'manage_system',
        'manage_database',
        'view_sensitive_data',
        'impersonate_users'
      ],
      isActive: true,
      emailVerified: true,
      loginAttempts: 0,
      createdAt: new Date(),
      updatedAt: new Date(),
      lastLogin: null,
      __v: 0
    };

    await db.collection('users').insertOne(adminUser);
    
    console.log('\n=== Admin User Created ===');
    console.log('Email: admin@flowtrainer.com');
    console.log('Password: admin123');
    console.log('\x1b[33m%s\x1b[0m', 'IMPORTANT: Change this password after first login!\n');
    
  } catch (error) {
    console.error('Error initializing admin user:', error);
    process.exit(1);
  } finally {
    if (client) {
      await client.close();
    }
  }
}

// Run the script
initAdmin()
  .then(() => process.exit(0))
  .catch(error => {
    console.error('Unhandled error:', error);
    process.exit(1);
  });
