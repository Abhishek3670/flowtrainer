const { ObjectId } = require('mongoose').Types;

/**
 * Add admin-related fields to User model
 */
module.exports = {
  async up(db) {
    // Add admin fields to users collection
    await db.collection('users').updateMany(
      {},
      {
        $set: {
          role: 'user',
          permissions: [],
          isActive: true,
          loginAttempts: 0,
          lastLogin: null,
          adminNotes: null,
          lockUntil: null,
          updatedAt: new Date()
        },
        $setOnInsert: {
          createdAt: new Date()
        }
      },
      { upsert: false, multi: true }
    );

    // Create indexes
    await db.collection('users').createIndex({ role: 1 });
    await db.collection('users').createIndex({ isActive: 1 });
    await db.collection('users').createIndex({ email: 1 }, { unique: true });
  },

  async down(db) {
    // Remove the added fields
    await db.collection('users').updateMany(
      {},
      {
        $unset: {
          role: "",
          permissions: "",
          isActive: "",
          loginAttempts: "",
          lastLogin: "",
          adminNotes: "",
          lockUntil: ""
        }
      },
      { multi: true }
    );

    // Drop indexes
    await db.collection('users').dropIndex('role_1');
    await db.collection('users').dropIndex('isActive_1');
    // Note: We don't drop the email index as it might have existed before
  }
};
