import dotenv from 'dotenv';
import path from 'path';

// Load environment variables from .env file
dotenv.config({ path: path.resolve(__dirname, '../../.env') });

// Define configuration interface
export interface IConfig {
  env: string;
  port: number;
  mongoUri: string;
  jwt: {
    secret: string;
    accessExpiration: number; // in minutes
    refreshExpiration: number; // in days
  };
  cors: {
    allowedOrigins: string[];
  };
  rateLimit: {
    windowMs: number;
    max: number;
  };
}

// Default configuration
const defaultConfig: IConfig = {
  env: process.env.NODE_ENV || 'development',
  port: parseInt(process.env.PORT || '4000', 10),
  mongoUri: process.env.MONGO_URI || 'mongodb://localhost:27017/flowtrainer',
  jwt: {
    secret: process.env.JWT_SECRET || 'your-secret-key-here',
    accessExpiration: parseInt(process.env.JWT_ACCESS_EXPIRATION_MINUTES || '15', 10),
    refreshExpiration: parseInt(process.env.JWT_REFRESH_EXPIRATION_DAYS || '7', 10),
  },
  cors: {
    allowedOrigins: process.env.ALLOWED_ORIGINS
      ? process.env.ALLOWED_ORIGINS.split(',').map(origin => origin.trim())
      : ['http://localhost:3000'],
  },
  rateLimit: {
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100, // limit each IP to 100 requests per windowMs
  },
};

// Validate required environment variables
const requiredEnvVars = ['JWT_SECRET'];

if (process.env.NODE_ENV === 'production') {
  requiredEnvVars.push('MONGO_URI');
}

const missingVars = requiredEnvVars.filter(varName => !process.env[varName]);

if (missingVars.length > 0) {
  throw new Error(`Missing required environment variables: ${missingVars.join(', ')}`);
}

const config: IConfig = {
  ...defaultConfig,
};

export default config;
