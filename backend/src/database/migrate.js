const mongoose = require('mongoose');
const path = require('path');
const fs = require('fs');
const { MongoClient } = require('mongodb');
const logger = require('../utils/logger');

// Get MongoDB URI from environment variables with fallback
const mongoUri = process.env.MONGO_URI || 'mongodb://localhost:27017/flowcraft';

class MigrationRunner {
  constructor() {
    this.migrationsPath = path.join(__dirname, 'migrations');
    this.migrationsCollection = 'migrations';
    this.client = null;
    this.db = null;
  }

  async connect() {
    // Connect using MongoDB native driver for migrations
    this.client = await MongoClient.connect(mongoUri, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    this.db = this.client.db();
    
    // Ensure migrations collection exists
    await this.db.collection(this.migrationsCollection).createIndex(
      { name: 1 },
      { unique: true }
    );
  }

  async disconnect() {
    if (this.client) {
      await this.client.close();
    }
  }

  async getCompletedMigrations() {
    const migrations = await this.db
      .collection(this.migrationsCollection)
      .find({})
      .sort({ name: 1 })
      .toArray();
    return new Set(migrations.map(m => m.name));
  }

  async getMigrationFiles() {
    return fs
      .readdirSync(this.migrationsPath)
      .filter(file => file.endsWith('.js'))
      .sort()
      .map(file => ({
        name: file,
        path: path.join(this.migrationsPath, file)
      }));
  }

  async runMigrations() {
    try {
      await this.connect();
      
      const completedMigrations = await this.getCompletedMigrations();
      const migrationFiles = await this.getMigrationFiles();
      
      let migrationsRun = 0;
      
      for (const { name, path: filePath } of migrationFiles) {
        if (completedMigrations.has(name)) {
          logger.info(`Skipping already executed migration: ${name}`);
          continue;
        }
        
        logger.info(`Running migration: ${name}`);
        
        // Load migration module
        const migration = require(filePath);
        
        // Run migration
        await migration.up(this.db);
        
        // Record migration
        await this.db.collection(this.migrationsCollection).insertOne({
          name,
          createdAt: new Date(),
        });
        
        logger.info(`Successfully ran migration: ${name}`);
        migrationsRun++;
      }
      
      if (migrationsRun === 0) {
        logger.info('No new migrations to run');
      } else {
        logger.info(`Successfully ran ${migrationsRun} migration(s)`);
      }
      
      return migrationsRun;
    } catch (error) {
      logger.error('Migration failed:', error);
      throw error;
    } finally {
      await this.disconnect();
    }
  }

  async rollbackMigration(name) {
    try {
      await this.connect();
      
      const migrationPath = path.join(this.migrationsPath, name);
      if (!fs.existsSync(migrationPath)) {
        throw new Error(`Migration file not found: ${name}`);
      }
      
      // Load migration module
      const migration = require(migrationPath);
      
      if (typeof migration.down !== 'function') {
        throw new Error(`Migration ${name} does not have a down function`);
      }
      
      logger.info(`Rolling back migration: ${name}`);
      
      // Run down migration
      await migration.down(this.db);
      
      // Remove migration record
      await this.db.collection(this.migrationsCollection).deleteOne({ name });
      
      logger.info(`Successfully rolled back migration: ${name}`);
      return true;
    } catch (error) {
      logger.error(`Failed to rollback migration ${name}:`, error);
      throw error;
    } finally {
      await this.disconnect();
    }
  }
}

// Handle command line arguments
async function main() {
  const command = process.argv[2];
  const migrationName = process.argv[3];
  
  const runner = new MigrationRunner();
  
  try {
    switch (command) {
      case 'up':
        await runner.runMigrations();
        break;
        
      case 'down':
        if (!migrationName) {
          throw new Error('Migration name is required for rollback');
        }
        await runner.rollbackMigration(migrationName);
        break;
        
      default:
        console.log('Usage:');
        console.log('  node migrate.js up         - Run all pending migrations');
        console.log('  node migrate.js down <name> - Rollback a specific migration');
        process.exit(1);
    }
    
    process.exit(0);
  } catch (error) {
    console.error('Error:', error.message);
    process.exit(1);
  }
}

// Run if called directly
if (require.main === module) {
  main().catch(console.error);
}

module.exports = MigrationRunner;
