import winston from 'winston';
import path from 'path';
import DailyRotateFile from 'winston-daily-rotate-file';

const { combine, timestamp, printf, colorize, errors } = winston.format;

// Define our logger interface
export interface ILogger {
  error: (message: string, meta?: any) => void;
  warn: (message: string, meta?: any) => void;
  info: (message: string, meta?: any) => void;
  http: (message: string, meta?: any) => void;
  debug: (message: string, meta?: any) => void;
  stream: {
    write: (message: string) => void;
  };
}

// Custom log format
const logFormat = printf(({ level, message, timestamp, stack }) => {
  const ts = timestamp as string;
  const msg = message as string;
  const stk = stack as string | undefined;
  return `${ts} ${level}: ${stk || msg}`;
});

// Create logs directory
const logDir = path.join(__dirname, '../../logs');

// Define log levels
const levels = {
  error: 0,
  warn: 1,
  info: 2,
  http: 3,
  debug: 4,
};

// Define colors for each level
const colors = {
  error: 'red',
  warn: 'yellow',
  info: 'green',
  http: 'magenta',
  debug: 'blue',
};

// Add colors to winston
winston.addColors(colors);

// Create the Winston logger
const winstonLogger = winston.createLogger({
  levels,
  level: process.env.NODE_ENV === 'production' ? 'info' : 'debug', // log only if info level or below in production
  format: combine(
    timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
    errors({ stack: true }), // Enable error stack traces
    logFormat
  ),
  transports: [
    // Console transport with colors
    new winston.transports.Console({
      format: combine(
        colorize({ all: true }),
        logFormat
      ),
    }),
    // Daily rotate file transport for errors
    new DailyRotateFile({
      level: 'error',
      filename: path.join(logDir, 'error-%DATE%.log'),
      datePattern: 'YYYY-MM-DD',
      zippedArchive: true,
      maxSize: '20m',
      maxFiles: '14d', // Keep logs for 14 days
    }),
    // Daily rotate file transport for all logs
    new DailyRotateFile({
      filename: path.join(logDir, 'combined-%DATE%.log'),
      datePattern: 'YYYY-MM-DD',
      zippedArchive: true,
      maxSize: '20m',
      maxFiles: '7d', // Keep logs for 7 days
    }),
  ],
  // Handle uncaught exceptions
  exceptionHandlers: [
    new winston.transports.File({ filename: path.join(logDir, 'exceptions.log') }),
  ],
  // Handle unhandled promise rejections
  rejectionHandlers: [
    new winston.transports.File({ filename: path.join(logDir, 'rejections.log') }),
  ],
  // Exit on error, set to false to continue logging after uncaught exceptions
  exitOnError: false,
});

// Stream for morgan HTTP request logging
const stream = {
  write: (message: string) => {
    winstonLogger.http(message.trim());
  },
};

// Create the logger with the correct type
export const logger: ILogger = {
  error: (message: string, meta?: any) => winstonLogger.error(message, meta),
  warn: (message: string, meta?: any) => winstonLogger.warn(message, meta),
  info: (message: string, meta?: any) => winstonLogger.info(message, meta),
  http: (message: string, meta?: any) => winstonLogger.http(message, meta),
  debug: (message: string, meta?: any) => winstonLogger.debug(message, meta),
  stream: stream,
};

export default logger;
