"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ApiError = void 0;
class ApiError extends Error {
    statusCode;
    details;
    constructor(statusCode, message, details) {
        super(message);
        this.name = 'ApiError';
        this.statusCode = statusCode;
        this.details = details;
    }
}
exports.ApiError = ApiError;
