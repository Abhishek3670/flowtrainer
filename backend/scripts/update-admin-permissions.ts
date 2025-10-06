import 'dotenv/config';
import { connect } from 'mongoose';
import { User } from '../src/models/User';
import config from '../src/config/config';

async function updateAdminPermissions() {
  try {
    // Connect to MongoDB
    await connect(config.mongoUri);
    console.log('Connected to MongoDB');

    // Find the admin user
    const adminUser = await User.findOne({ email: 'admin@example.com' });
    
    if (!adminUser) {
      console.log('Admin user not found');
      process.exit(1);
    }

    // Update the admin user's permissions to match the roles and permissions matrix
    adminUser.permissions = [
      // Inherited from 'user' role
      'read_own_profile',
      'update_own_profile',
      'read_own_workflows',
      
      // From 'admin' role
      'read_users',
      'manage_users',
      'read_system_metrics',
      'manage_system_config',
      'read_audit_logs',
      'manage_workflows'
    ];

    await adminUser.save();
    console.log('Admin user permissions updated successfully');
    console.log('Updated permissions:', adminUser.permissions);
    
    process.exit(0);
  } catch (error) {
    console.error('Error updating admin user permissions:', error);
    process.exit(1);
  }
}

updateAdminPermissions();