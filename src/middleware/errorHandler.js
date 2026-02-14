const { AppError } = require('../utils/errors');
const config = require('../config');

/**
 * Global error-handling middleware.
 * Catches all errors and sends a consistent JSON response.
 */
const errorHandler = (err, req, res, next) => {
    // Default to 500 if no status code is set
    err.statusCode = err.statusCode || 500;
    err.status = err.status || 'error';

    if (config.nodeEnv === 'development') {
        res.status(err.statusCode).json({
            success: false,
            status: err.status,
            message: err.message,
            details: err.details || undefined,
            stack: err.stack,
            error: err,
        });
    } else {
        // Production: don't leak error details
        if (err.isOperational) {
            res.status(err.statusCode).json({
                success: false,
                status: err.status,
                message: err.message,
                details: err.details || undefined,
            });
        } else {
            console.error('UNEXPECTED ERROR:', err);
            res.status(500).json({
                success: false,
                status: 'error',
                message: 'Something went wrong!',
            });
        }
    }
};

module.exports = errorHandler;
