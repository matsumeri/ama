"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.apiRateLimit = void 0;
const express_rate_limit_1 = __importDefault(require("express-rate-limit"));
const env_1 = require("../config/env");
exports.apiRateLimit = (0, express_rate_limit_1.default)({
    windowMs: env_1.env.rateLimitWindowMs,
    max: env_1.env.rateLimitMax,
    standardHeaders: true,
    legacyHeaders: false,
    message: {
        error: 'TooManyRequests',
        message: 'Rate limit exceeded. Try again later.'
    }
});
