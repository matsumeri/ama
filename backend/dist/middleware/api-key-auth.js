"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.apiKeyAuth = apiKeyAuth;
const env_1 = require("../config/env");
function apiKeyAuth(req, res, next) {
    if (!env_1.env.apiKey) {
        next();
        return;
    }
    const requestApiKey = req.header('x-api-key');
    if (!requestApiKey || requestApiKey !== env_1.env.apiKey) {
        res.status(401).json({
            error: 'Unauthorized',
            message: 'Missing or invalid API key.'
        });
        return;
    }
    next();
}
