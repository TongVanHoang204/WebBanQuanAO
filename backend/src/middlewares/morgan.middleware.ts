import morgan, { StreamOptions } from 'morgan';
import { logger } from '../config/logger.js';

// Redirect morgan logs to winston
const stream: StreamOptions = {
  write: (message) => logger.info(message.trim()),
};

// Skip morgan logs for success responses in production if preferred. 
// For now, let's log everything.
const skip = () => {
   const env = process.env.NODE_ENV || 'development';
   // return env !== 'development';
   return false;
};

// Build morgan middleware
const morganMiddleware = morgan(
  ':method :url :status :res[content-length] - :response-time ms',
  { stream, skip }
);

export default morganMiddleware;
