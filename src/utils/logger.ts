import pino from 'pino';
import { env } from '../config/env';

const isPrettyTransportAvailable = (): boolean => {
  try {
    require.resolve('pino-pretty');
    return true;
  } catch {
    return false;
  }
};

const loggerOptions =
  env.nodeEnv === 'production' || !isPrettyTransportAvailable()
    ? { level: 'info' as const }
    : {
        level: 'debug' as const,
        transport: {
          target: 'pino-pretty',
          options: { colorize: true }
        }
      };

export const logger = pino(loggerOptions);
