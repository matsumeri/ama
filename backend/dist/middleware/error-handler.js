"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.notFoundHandler = notFoundHandler;
exports.errorHandler = errorHandler;
const axios_1 = __importDefault(require("axios"));
const api_error_1 = require("../errors/api-error");
const metrics_1 = require("../observability/metrics");
function mapMetaError(errorPayload) {
    const code = errorPayload.code;
    if (code === 190) {
        return {
            status: 401,
            message: 'Meta access token expired or invalid. Refresh token and retry.'
        };
    }
    if (code === 10 || code === 200) {
        return {
            status: 403,
            message: 'Insufficient permissions for this operation in Meta Business.'
        };
    }
    if (code === 4 || code === 17 || code === 613) {
        return {
            status: 429,
            message: 'Meta rate limit reached. Retry with lower request volume.'
        };
    }
    if (code === 100 || code === 2500) {
        return {
            status: 400,
            message: 'Invalid request for Meta API. Validate required fields and IDs.'
        };
    }
    return {
        status: 502,
        message: errorPayload.message ?? 'Unexpected Meta API error.'
    };
}
function notFoundHandler(req, res) {
    res.status(404).json({
        error: 'NotFound',
        message: `Route not found: ${req.method} ${req.originalUrl}`
    });
}
function errorHandler(err, _req, res, _next) {
    if (err instanceof api_error_1.ApiError) {
        res.status(err.statusCode).json({
            error: err.name,
            message: err.message,
            details: err.details
        });
        return;
    }
    if (axios_1.default.isAxiosError(err)) {
        const upstreamError = err.response?.data?.error;
        const mapped = mapMetaError(upstreamError ?? {});
        (0, metrics_1.recordMetaError)(upstreamError?.code ?? null, err.response?.status ?? null, mapped.message);
        res.status(mapped.status).json({
            error: 'MetaApiError',
            message: mapped.message,
            details: {
                upstreamStatus: err.response?.status ?? null,
                upstreamError: upstreamError ?? null
            }
        });
        return;
    }
    const message = err instanceof Error ? err.message : 'Unexpected server error';
    res.status(500).json({
        error: 'InternalServerError',
        message
    });
}
