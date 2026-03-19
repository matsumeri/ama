import dotenv from 'dotenv';

dotenv.config();

export const env = {
  port: Number(process.env.PORT ?? 4000),
  nodeEnv: process.env.NODE_ENV ?? 'development',
  metaApiVersion: process.env.META_API_VERSION ?? 'v21.0',
  metaAccessToken: process.env.META_ACCESS_TOKEN ?? '',
  apiKey: process.env.AMA_API_KEY ?? '',
  rateLimitWindowMs: Number(process.env.RATE_LIMIT_WINDOW_MS ?? 60000),
  rateLimitMax: Number(process.env.RATE_LIMIT_MAX ?? 120),
  metaRetryAttempts: Number(process.env.META_RETRY_ATTEMPTS ?? 3),
  metaRetryBaseDelayMs: Number(process.env.META_RETRY_BASE_DELAY_MS ?? 350),
  observabilityStorePath:
    process.env.OBSERVABILITY_STORE_PATH ?? '/workspaces/ama/backend/data/observability-metrics.json'
};
