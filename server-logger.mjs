/**
 * Server-side logger for Socket.IO server
 * Provides consistent logging with timestamps and log levels
 */

const isDev = process.env.NODE_ENV !== 'production';

const formatTimestamp = () => {
  return new Date().toISOString();
};

export const serverLogger = {
  debug: (...args) => {
    if (isDev) {
      console.log(`[${formatTimestamp()}] [DEBUG]`, ...args);
    }
  },
  info: (...args) => {
    console.info(`[${formatTimestamp()}] [INFO]`, ...args);
  },
  warn: (...args) => {
    console.warn(`[${formatTimestamp()}] [WARN]`, ...args);
  },
  error: (...args) => {
    console.error(`[${formatTimestamp()}] [ERROR]`, ...args);
  },
};

export default serverLogger;
