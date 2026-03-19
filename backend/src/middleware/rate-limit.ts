import rateLimit from 'express-rate-limit';
import { env } from '../config/env';

export const apiRateLimit = rateLimit({
  windowMs: env.rateLimitWindowMs,
  max: env.rateLimitMax,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    error: 'TooManyRequests',
    message: 'Rate limit exceeded. Try again later.'
  }
});
