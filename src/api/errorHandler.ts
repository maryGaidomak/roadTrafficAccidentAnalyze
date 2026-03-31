import { NextFunction, Request, Response } from 'express';
import { ApiError } from '../utils/errors';
import { logger } from '../utils/logger';

export const errorHandler = (err: Error, _req: Request, res: Response, _next: NextFunction): void => {
  if (err instanceof ApiError) {
    res.status(err.statusCode).json({ error: err.message });
    return;
  }

  logger.error({ err }, 'Unhandled application error');
  res.status(500).json({ error: 'Internal server error' });
};
