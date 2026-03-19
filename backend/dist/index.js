"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const cors_1 = __importDefault(require("cors"));
const express_1 = __importDefault(require("express"));
const env_1 = require("./config/env");
const meta_routes_1 = require("./routes/meta.routes");
const api_key_auth_1 = require("./middleware/api-key-auth");
const rate_limit_1 = require("./middleware/rate-limit");
const error_handler_1 = require("./middleware/error-handler");
const metrics_1 = require("./observability/metrics");
const app = (0, express_1.default)();
app.use((0, cors_1.default)());
app.use(express_1.default.json());
app.use('/api', rate_limit_1.apiRateLimit, api_key_auth_1.apiKeyAuth);
app.get('/health', (_req, res) => {
    res.json({ status: 'ok', service: 'ama-backend' });
});
app.use('/api/meta', meta_routes_1.metaRouter);
app.use(error_handler_1.notFoundHandler);
app.use(error_handler_1.errorHandler);
async function startServer() {
    await (0, metrics_1.initializeObservabilityStore)();
    app.listen(env_1.env.port, () => {
        console.log(`AMA backend running on http://localhost:${env_1.env.port}`);
        if (!env_1.env.apiKey) {
            console.warn('AMA_API_KEY is empty. API key auth is currently disabled.');
        }
    });
}
startServer().catch((error) => {
    console.error('Failed to start AMA backend', error);
    process.exit(1);
});
