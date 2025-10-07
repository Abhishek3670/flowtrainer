const { ObjectId } = require('mongoose').Types;

/**
 * Create SystemConfig, SystemMetrics, and UserActivity collections
 */
module.exports = {
  async up(db) {
    // Create SystemConfig collection
    // Create system_configs collection without default values in schema validation
    await db.createCollection('system_configs');
    
    // Set default values in application code instead of schema
    await db.collection('system_configs').createIndex({ key: 1 }, { unique: true });
    await db.collection('system_configs').createIndex({ category: 1, isPublic: 1 });

    // Create SystemMetrics collection with TTL index
    await db.createCollection('system_metrics', {
      timeseries: {
        timeField: 'timestamp',
        metaField: 'metadata',
        granularity: 'minutes'
      }
    });

    // Create UserActivity collection without schema validation
    await db.createCollection('user_activities');
    
    // Create indexes for user_activities
    await db.collection('user_activities').createIndex({ userId: 1, timestamp: -1 });
    await db.collection('user_activities').createIndex({ action: 1, timestamp: -1 });
    await db.collection('user_activities').createIndex({ entityType: 1, entityId: 1 });
    await db.collection('user_activities').createIndex(
      { timestamp: -1 },
      { expireAfterSeconds: 7776000 } // 90 days TTL
    );

    // All indexes are now created above
  },

  async down(db) {
    // Drop all created collections
    await db.collection('system_configs').drop();
    await db.collection('system_metrics').drop();
    await db.collection('user_activities').drop();
    
    // Note: Indexes will be automatically dropped when collections are dropped
  }
};
