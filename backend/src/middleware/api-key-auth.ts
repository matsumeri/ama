import { NextFunction, Request, Response } from 'express';
import { env } from '../config/env';

export function apiKeyAuth(req: Request, res: Response, next: NextFunction): void {
  if (!env.apiKey) {
    next();
    return;
  }

  const requestApiKey = req.header('x-api-key');

  if (!requestApiKey || requestApiKey !== env.apiKey) {
    res.status(401).json({
      error: 'Unauthorized',
      message: 'Missing or invalid API key.'
    });
    return;
  }

  next();
}
