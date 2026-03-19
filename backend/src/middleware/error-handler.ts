import { NextFunction, Request, Response } from 'express';
import axios from 'axios';
import { ApiError } from '../errors/api-error';
import { recordMetaError } from '../observability/metrics';

interface MetaErrorPayload {
  message?: string;
  code?: number;
  error_subcode?: number;
  type?: string;
  fbtrace_id?: string;
}

function mapMetaError(errorPayload: MetaErrorPayload): { status: number; message: string } {
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

export function notFoundHandler(req: Request, res: Response): void {
  res.status(404).json({
    error: 'NotFound',
    message: `Route not found: ${req.method} ${req.originalUrl}`
  });
}

export function errorHandler(err: unknown, _req: Request, res: Response, _next: NextFunction): void {
  if (err instanceof ApiError) {
    res.status(err.statusCode).json({
      error: err.name,
      message: err.message,
      details: err.details
    });
    return;
  }

  if (axios.isAxiosError(err)) {
    const upstreamError = (err.response?.data as { error?: MetaErrorPayload } | undefined)?.error;
    const mapped = mapMetaError(upstreamError ?? {});
    recordMetaError(
      upstreamError?.code ?? null,
      err.response?.status ?? null,
      mapped.message
    );
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
