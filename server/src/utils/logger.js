import winston from 'winston';
import { sanitize } from './sanitizer.js';

const { combine, timestamp, printf, colorize, errors } = winston.format;

const sanitizeFormat = winston.format((info) => {
  if (typeof info.message === 'string') {
    info.message = sanitize(info.message);
  }
  if (info.stack && typeof info.stack === 'string') {
    info.stack = sanitize(info.stack);
  }
  return info;
})();

const logFormat = printf(({ level, message, timestamp, stack }) => {
  return `${timestamp} [${level}]: ${stack || message}`;
});

export const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || 'info',
  format: combine(
    sanitizeFormat,
    errors({ stack: true }),
    timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
    logFormat
  ),
  transports: [
    new winston.transports.Console({
      format: combine(
        sanitizeFormat,
        colorize(),
        errors({ stack: true }),
        timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
        logFormat
      )
    }),
    new winston.transports.File({ 
      filename: 'logs/error.log', 
      level: 'error',
      maxsize: 5242880,
      maxFiles: 5
    }),
    new winston.transports.File({ 
      filename: 'logs/combined.log',
      maxsize: 5242880,
      maxFiles: 5
    })
  ]
});

if (process.env.NODE_ENV !== 'production') {
  logger.add(new winston.transports.Console({
    format: combine(sanitizeFormat, colorize(), timestamp({ format: 'HH:mm:ss' }), printf(({ level, message, timestamp }) => {
      return `${timestamp} ${level}: ${message}`;
    }))
  }));
}

export default logger;
