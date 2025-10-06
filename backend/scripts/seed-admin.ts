import 'dotenv/config';
import { connect } from 'mongoose';
import bcrypt from 'bcrypt';
import { User } from '../src/models/User';
import config from '../src/config/config';

async function seedAdmin() {
  try {
    // Connect to MongoDB
    await connect(config.mongoUri);
    console.log('Connected to MongoDB');

    // Check if admin already exists
    const existingAdmin = await User.findOne({ email: 'admin@example.com' });
    
    if (existingAdmin) {
      console.log('Admin user already exists, updating password...');
      // Update the password
      existingAdmin.password = 'Admin@123';
      await existingAdmin.save();
      console.log('Admin password updated successfully');
      console.log('Email: admin@example.com');
      console.log('Password: Admin@123');
      process.exit(0);
    }

    // Create admin user
    const admin = new User({
      email: 'admin@example.com',
      password: 'Admin@123', // In a real app, this should be set via environment variable
      firstName: 'Admin',
      lastName: 'User',
      role: 'admin',
      permissions: [
        'users:read',
        'users:create',
        'users:update',
        'users:delete',
        'workflows:read',
        'workflows:create',
        'workflows:update',
        'workflows:delete',
      ],
      isActive: true,
    });

    await admin.save();
    console.log('Admin user created successfully');
    console.log('Email: admin@example.com');
    console.log('Password: Admin@123');
    console.log('IMPORTANT: Change this password after first login!');
    
    process.exit(0);
  } catch (error) {
    console.error('Error seeding admin user:', error);
    process.exit(1);
  }
}

seedAdmin();