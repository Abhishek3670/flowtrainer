const { createLogger, format, transports } = require('winston');
const { combine, timestamp, printf, colorize, json } = format;
const path = require('path');

// Define log format
const logFormat = printf(({ level, message, timestamp, ...metadata }) => {
  let msg = `${timestamp} [${level.toUpperCase()}] ${message}`;
  
  // Add metadata if it exists and is not an empty object
  if (metadata && Object.keys(metadata).length > 0) {
    msg += ' ' + JSON.stringify(metadata, null, 2);
  }
  
  return msg;
});

// Create logger instance
const logger = createLogger({
  level: process.env.LOG_LEVEL || 'info',
  format: combine(
    timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
    logFormat
  ),
  transports: [
    // Console transport for development
    new transports.Console({
      format: combine(
        colorize({ all: true }),
        logFormat
      )
    }),
    // File transport for production
    new transports.File({ 
      filename: path.join(__dirname, '../../logs/error.log'), 
      level: 'error' 
    }),
    new transports.File({ 
      filename: path.join(__dirname, '../../logs/combined.log') 
    })
  ],
  exitOnError: false
});

// Create a stream object to use with morgan
logger.stream = {
  write: function(message) {
    // Remove newline at the end of the message
    logger.info(message.trim());
  }
};

// Handle uncaught exceptions
if (process.env.NODE_ENV === 'production') {
  logger.exceptions.handle(
    new transports.File({ 
      filename: path.join(__dirname, '../../logs/exceptions.log') 
    })
  );

  process.on('unhandledRejection', (ex) => {
    throw ex;
  });
}

module.exports = logger;
