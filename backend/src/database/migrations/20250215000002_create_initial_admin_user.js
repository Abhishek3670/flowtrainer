const bcrypt = require('bcryptjs');
const { ObjectId } = require('mongodb');

/**
 * Create initial admin user if no users exist
 */
module.exports = {
  async up(db) {
    // Check if any users exist
    const userCount = await db.collection('users').countDocuments();
    
    if (userCount === 0) {
      // Hash the default admin password
      const salt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash('admin123', salt);
      
      // Create initial admin user
      await db.collection('users').insertOne({
        _id: new ObjectId('000000000000000000000001'),
        email: 'admin@flowtrainer.com',
        name: 'System Administrator',
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
      });
      
      console.log('Created initial admin user: admin@flowtrainer.com / admin123');
    }
  },

  async down(db) {
    // Remove the initial admin user if it exists
    await db.collection('users').deleteOne({ email: 'admin@flowtrainer.com' });
  }
};
