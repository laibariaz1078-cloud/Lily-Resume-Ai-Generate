import type { ErrorRequestHandler, RequestHandler } from 'express';
import mongoose from 'mongoose';
import { ApiError, type ApiFieldError } from '../utils/api-error';
import { env } from '../config/env';

function isDuplicateKeyError(error: unknown): error is { code: number; keyPattern?: Record<string, unknown> } {
  return typeof error === 'object' && error !== null && 'code' in error && error.code === 11000;
}

export const notFoundMiddleware: RequestHandler = (req, _res, next) => {
  next(new ApiError(404, `Route not found: ${req.method} ${req.path}`));
};

export const errorMiddleware: ErrorRequestHandler = (error, req, res, _next) => {
  let statusCode = 500;
  let message = 'An unexpected error occurred';
  let errors: ApiFieldError[] = [];

  if (error instanceof ApiError) {
    statusCode = error.statusCode;
    message = error.expose ? error.message : message;
    errors = error.expose ? error.errors : [];
  } else if (error instanceof mongoose.Error.ValidationError) {
    statusCode = 400;
    message = 'Request validation failed';
    errors = Object.values(error.errors).map((issue) => ({ field: issue.path, message: issue.message }));
  } else if (error instanceof mongoose.Error.CastError) {
    statusCode = 400;
    message = 'Invalid request value';
  } else if (isDuplicateKeyError(error)) {
    statusCode = 409;
    message = error.keyPattern?.email ? 'An account with this email already exists' : 'A record with this value already exists';
  } else if (error instanceof SyntaxError && 'body' in error) {
    statusCode = 400;
    message = 'Malformed JSON request body';
  } else if (typeof error === 'object' && error !== null && 'type' in error && error.type === 'entity.too.large') {
    statusCode = 413;
    message = 'Request body is too large';
  }

  if (statusCode >= 500 && env.NODE_ENV !== 'production') {
    console.error('API request failed', { method: req.method, path: req.path, error });
  }

  res.status(statusCode).json({ success: false, message, errors });
};
