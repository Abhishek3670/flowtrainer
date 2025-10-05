import mongoose from 'mongoose';
import { EventEmitter } from 'events';
import logger from '../utils/logger';

export class DatabaseConnection extends EventEmitter {
  private static instance: DatabaseConnection;
  private connection: mongoose.Connection | null = null;
  private isConnecting = false;

  private constructor() {
    super();
  }

  static getInstance(): DatabaseConnection {
    if (!DatabaseConnection.instance) {
      DatabaseConnection.instance = new DatabaseConnection();
    }
    return DatabaseConnection.instance;
  }

  async connect(): Promise<mongoose.Connection> {
    if (this.connection && this.connection.readyState === 1) {
      logger.info('Using existing MongoDB connection');
      return this.connection;
    }

    if (this.isConnecting) {
      logger.info('MongoDB connection in progress, waiting for completion');
      return new Promise((resolve, reject) => {
        this.once('connected', resolve);
        this.once('error', reject);
      });
    }

    this.isConnecting = true;
    logger.info('Initializing MongoDB connection');

    try {
      const options: mongoose.ConnectOptions = {
        // Connection pooling settings
        maxPoolSize: 10,          // Maximum number of connections
        minPoolSize: 2,           // Minimum number of connections
        maxIdleTimeMS: 30000,     // Close connections after 30s of inactivity
        serverSelectionTimeoutMS: 5000,   // How long to try selecting server
        socketTimeoutMS: 45000,   // How long a send or receive on socket can take
        
        // Reliability settings
        bufferCommands: false,
        
        // Retry settings
        retryWrites: true,
        retryReads: true,
        
        // Additional settings
        compressors: ['zlib'],    // Enable compression
        maxConnecting: 2,         // Maximum number of connections being established
      };

      const mongoUri = process.env.MONGO_URI || 'mongodb://localhost:27017/flowcraft';
      logger.info(`🔗 Connecting to MongoDB`, {
        uri: mongoUri.replace(/\/\/.*@/, '//<credentials>@'),
        options
      });

      await mongoose.connect(mongoUri, options);
      this.connection = mongoose.connection;

      // Set up event listeners
      this.setupEventListeners();
      
      this.isConnecting = false;
      this.emit('connected', this.connection);
      
      logger.info('✅ MongoDB connected successfully with connection pooling');
      logger.info(`📊 Pool settings: Min: ${options.minPoolSize}, Max: ${options.maxPoolSize}`);
      
      return this.connection;
    } catch (error: any) {
      this.isConnecting = false;
      logger.error('❌ MongoDB connection failed:', {
        error: error.message,
        stack: error.stack
      });
      this.emit('error', error);
      throw error;
    }
  }

  private setupEventListeners(): void {
    if (!this.connection) return;

    this.connection.on('connected', () => {
      logger.info('📡 MongoDB connected');
    });

    this.connection.on('disconnected', () => {
      logger.warn('📡 MongoDB disconnected. Attempting to reconnect...');
      this.connection = null;
      this.reconnect();
    });

    this.connection.on('error', (error) => {
      logger.error('❌ MongoDB connection error:', {
        error: error.message,
        stack: error.stack
      });
      this.emit('error', error);
    });

    this.connection.on('reconnected', () => {
      logger.info('🔄 MongoDB reconnected');
    });

    // Monitor connection pool
    this.connection.on('open', () => {
      logger.info('🏊 MongoDB connection pool opened');
    });
  }

  private async reconnect(): Promise<void> {
    if (this.isConnecting) return;
    
    logger.info('🔄 Attempting to reconnect to MongoDB...');
    setTimeout(() => {
      this.connect().catch(err => {
        logger.error('MongoDB reconnection failed:', {
          error: err.message
        });
      });
    }, 5000); // Wait 5 seconds before reconnecting
  }

  async disconnect(): Promise<void> {
    if (this.connection) {
      await mongoose.disconnect();
      this.connection = null;
      logger.info('🔌 MongoDB disconnected');
    }
  }

  getConnection(): mongoose.Connection | null {
    return this.connection;
  }

  getConnectionStatus(): string {
    if (!this.connection) return 'disconnected';
    
    const states = {
      0: 'disconnected',
      1: 'connected',
      2: 'connecting',
      3: 'disconnecting',
    };
    
    return states[this.connection.readyState as keyof typeof states] || 'unknown';
  }

  // Health check method
  async healthCheck(): Promise<{ status: string; details: any }> {
    try {
      if (!this.connection || this.connection.readyState !== 1) {
        return { status: 'unhealthy', details: 'Not connected' };
      }

      // Test the connection with a simple operation
      await this.connection.db.admin().ping();
      
      const dbStats = await this.connection.db.stats();
      
      return {
        status: 'healthy',
        details: {
          readyState: this.getConnectionStatus(),
          dbStats: {
            collections: dbStats.collections,
            dataSize: dbStats.dataSize,
            indexSize: dbStats.indexSize,
          },
        },
      };
    } catch (error) {
      return { 
        status: 'unhealthy', 
        details: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }
}

// Export a singleton instance
export const dbConnection = DatabaseConnection.getInstance();

// Helper function for easy use
export async function connectDB() {
  return dbConnection.connect();
}

export async function disconnectDB() {
  return dbConnection.disconnect();
}

export function getDBHealth() {
  return dbConnection.healthCheck();
}

/**
 * Get the MongoDB database instance
 * @returns {Promise<import('mongodb').Db>} MongoDB database instance
 */
export async function getDb() {
  const connection = await connectDB();
  return connection.db;
}