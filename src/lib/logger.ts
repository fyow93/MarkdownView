/**
 * Lightweight logger utility for conditional logging
 * Only logs in development mode to keep production builds clean
 */

const isDev = process.env.NODE_ENV === 'development';

interface LoggerInterface {
  debug: (...args: unknown[]) => void;
  info: (...args: unknown[]) => void;
  warn: (...args: unknown[]) => void;
  error: (...args: unknown[]) => void;
}

const noop = () => {};

export const logger: LoggerInterface = {
  debug: isDev ? (...args: unknown[]) => console.log('[DEBUG]', ...args) : noop,
  info: isDev ? (...args: unknown[]) => console.info('[INFO]', ...args) : noop,
  warn: isDev ? (...args: unknown[]) => console.warn('[WARN]', ...args) : noop,
  error: isDev ? (...args: unknown[]) => console.error('[ERROR]', ...args) : noop,
};

export default logger;
