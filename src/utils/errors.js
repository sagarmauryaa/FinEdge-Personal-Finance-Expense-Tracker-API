/**
 * Custom error classes for structured error handling across the API.
 */

class AppError extends Error {
    constructor(message, statusCode) {
        super(message);
        this.statusCode = statusCode;
        this.status = `${statusCode}`.startsWith('4') ? 'fail' : 'error';
        this.isOperational = true;
        Error.captureStackTrace(this, this.constructor);
    }
}

class NotFoundError extends AppError {
    constructor(resource = 'Resource', id = '') {
        const msg = id ? `${resource} with id '${id}' not found` : `${resource} not found`;
        super(msg, 404);
    }
}

class ValidationError extends AppError {
    constructor(message = 'Validation failed', details = []) {
        super(message, 400);
        this.details = details;
    }
}

class UnauthorizedError extends AppError {
    constructor(message = 'Unauthorized access') {
        super(message, 401);
    }
}

class ConflictError extends AppError {
    constructor(message = 'Resource already exists') {
        super(message, 409);
    }
}

class ForbiddenError extends AppError {
    constructor(message = 'Access forbidden') {
        super(message, 403);
    }
}

module.exports = {
    AppError,
    NotFoundError,
    ValidationError,
    UnauthorizedError,
    ConflictError,
    ForbiddenError,
};
