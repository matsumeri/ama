import cors from 'cors';
import express from 'express';
import { env } from './config/env';
import { metaRouter } from './routes/meta.routes';
import { apiKeyAuth } from './middleware/api-key-auth';
import { apiRateLimit } from './middleware/rate-limit';
import { errorHandler, notFoundHandler } from './middleware/error-handler';
import { initializeObservabilityStore } from './observability/metrics';

const app = express();

app.use(cors());
app.use(express.json());
app.use('/api', apiRateLimit, apiKeyAuth);

app.get('/health', (_req, res) => {
  res.json({ status: 'ok', service: 'ama-backend' });
});

app.use('/api/meta', metaRouter);

app.use(notFoundHandler);
app.use(errorHandler);

async function startServer(): Promise<void> {
  await initializeObservabilityStore();

  app.listen(env.port, () => {
    console.log(`AMA backend running on http://localhost:${env.port}`);
    if (!env.apiKey) {
      console.warn('AMA_API_KEY is empty. API key auth is currently disabled.');
    }
  });
}

startServer().catch((error) => {
  console.error('Failed to start AMA backend', error);
  process.exit(1);
});
