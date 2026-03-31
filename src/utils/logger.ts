import pino from 'pino';
import { env } from '../config/env';

const loggerOptions =
  env.nodeEnv === 'production'
    ? { level: 'info' as const }
    : {
        level: 'debug' as const,
        transport: {
          target: 'pino-pretty',
          options: { colorize: true }
        }
      };

export const logger = pino(loggerOptions);
