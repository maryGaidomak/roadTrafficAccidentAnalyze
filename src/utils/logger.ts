import pino from 'pino';
import { env } from '../config/env';

const loggerOptions = {
  level: env.nodeEnv === 'production' ? ('info' as const) : ('debug' as const)
};

export const logger = pino(loggerOptions);
