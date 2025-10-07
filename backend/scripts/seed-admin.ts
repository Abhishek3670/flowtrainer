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
      console.log('Admin user already exists, updating password and permissions...');
      // Update the password
      existingAdmin.password = 'Admin@123';
      // Update permissions to match the role-based permissions
      existingAdmin.permissions = [
        'read_users',
        'manage_users',
        'read_system_metrics',
        'manage_system_config',
        'read_audit_logs',
        'manage_workflows'
      ];
      await existingAdmin.save();
      console.log('Admin user updated successfully');
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
        'read_users',
        'manage_users',
        'read_system_metrics',
        'manage_system_config',
        'read_audit_logs',
        'manage_workflows'
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