// src/api/middlewares/errorHandler.middleware.js
const ApiError = require('../../utils/ApiError');
const logger = require('../../utils/logger');

function errorHandler(err, req, res, next) {
  // Log error
  if (err.isOperational) {
    logger.warn(`${err.statusCode} ${err.message}`, { path: req.path });
  } else {
    logger.error('Unhandled error:', err);
  }

  // Handle Prisma errors
  if (err.code === 'P2002') {
    return res.status(409).json({
      success: false,
      error: 'A record with this data already exists',
      code: 'CONFLICT',
    });
  }

  if (err.code === 'P2025') {
    return res.status(404).json({
      success: false,
      error: 'Record not found',
      code: 'NOT_FOUND',
    });
  }

  // Handle Multer errors
  if (err.code === 'LIMIT_FILE_SIZE') {
    return res.status(400).json({
      success: false,
      error: 'File too large. Maximum size is 10MB',
      code: 'FILE_TOO_LARGE',
    });
  }

  // Handle operational errors
  if (err instanceof ApiError || err.isOperational) {
    return res.status(err.statusCode || 400).json({
      success: false,
      error: err.message,
      ...(err.details && { details: err.details }),
      code: err.code,
    });
  }

  // Unhandled errors — don't leak details in production
  const statusCode = err.status || err.statusCode || 500;
  const message =
    process.env.NODE_ENV === 'production'
      ? 'An unexpected error occurred'
      : err.message;

  return res.status(statusCode).json({
    success: false,
    error: message,
    code: 'INTERNAL_ERROR',
    ...(process.env.NODE_ENV !== 'production' && { stack: err.stack }),
  });
}

module.exports = errorHandler;
