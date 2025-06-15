const fs = require('fs').promises;
const path = require('path');
const { createError } = require('./errorHandler');
const logger = require('../utils/logger');

/**
 * Validate CSV processing request
 */
const validateRequest = async (req, res, next) => {
  try {
    // Check if CSV file path is configured
    const csvPath = process.env.CSV_FILE_PATH;
    if (!csvPath) {
      throw createError('CSV file path not configured in environment variables', 400);
    }

    // Check if file exists
    const filePath = path.resolve(csvPath);
    try {
      await fs.access(filePath);
    } catch (error) {
      if (error.code === 'ENOENT') {
        throw createError(`CSV file not found at path: ${filePath}`, 404);
      }
      throw createError(`Cannot access CSV file: ${error.message}`, 403);
    }

    // Check file size
    const stats = await fs.stat(filePath);
    const maxSizeMB = parseInt(process.env.MAX_FILE_SIZE_MB) || 100;
    const maxSizeBytes = maxSizeMB * 1024 * 1024;
    
    if (stats.size > maxSizeBytes) {
      throw createError(
        `File size ${Math.round(stats.size / 1024 / 1024)}MB exceeds limit of ${maxSizeMB}MB`, 
        413
      );
    }

    // Validate file extension
    const ext = path.extname(filePath).toLowerCase();
    if (ext !== '.csv') {
      throw createError('Only CSV files are supported', 400);
    }

    logger.info(`CSV file validation passed: ${filePath}`);
    next();

  } catch (error) {
    next(error);
  }
};

/**
 * Validate pagination parameters
 */
const validatePagination = (req, res, next) => {
  const { page, limit } = req.query;

  if (page && (!Number.isInteger(Number(page)) || Number(page) < 1)) {
    return next(createError('Page must be a positive integer', 400));
  }

  if (limit && (!Number.isInteger(Number(limit)) || Number(limit) < 1 || Number(limit) > 1000)) {
    return next(createError('Limit must be a positive integer between 1 and 1000', 400));
  }

  next();
};

/**
 * Validate user ID parameter
 */
const validateUserId = (req, res, next) => {
  const { id } = req.params;

  if (!id || !Number.isInteger(Number(id)) || Number(id) < 1) {
    return next(createError('Invalid user ID', 400));
  }

  next();
};

/**
 * Validate JSON content type for POST/PUT requests
 */
const validateJsonContent = (req, res, next) => {
  if (['POST', 'PUT', 'PATCH'].includes(req.method)) {
    const contentType = req.get('Content-Type');
    
    if (contentType && !contentType.includes('application/json')) {
      return next(createError('Content-Type must be application/json', 400));
    }
  }

  next();
};

/**
 * Sanitize and validate request body
 */
const sanitizeRequest = (req, res, next) => {
  // Remove any potentially dangerous properties
  if (req.body) {
    delete req.body.__proto__;
    delete req.body.constructor;
    delete req.body.prototype;
  }

  // Limit request body size (already handled by express.json but double-check)
  const bodyStr = JSON.stringify(req.body || {});
  if (bodyStr.length > 10 * 1024 * 1024) { // 10MB
    return next(createError('Request body too large', 413));
  }

  next();
};

/**
 * Rate limiting for heavy operations
 */
const heavyOperationLimiter = (req, res, next) => {
  // This could be enhanced with Redis for distributed rate limiting
  const userIP = req.ip;
  const now = Date.now();
  
  // Simple in-memory rate limiting (in production, use Redis)
  if (!global.rateLimitStore) {
    global.rateLimitStore = new Map();
  }

  const userRequests = global.rateLimitStore.get(userIP) || [];
  const recentRequests = userRequests.filter(time => now - time < 60000); // Last minute

  if (recentRequests.length >= 5) { // Max 5 heavy operations per minute
    return next(createError('Too many heavy operations. Please wait before trying again.', 429));
  }

  recentRequests.push(now);
  global.rateLimitStore.set(userIP, recentRequests);

  next();
};

module.exports = {
  validateRequest,
  validatePagination,
  validateUserId,
  validateJsonContent,
  sanitizeRequest,
  heavyOperationLimiter
};