const express = require('express');
const cors = require('cors');
const rateLimit = require('express-rate-limit');
const config = require('./src/config');
const routes = require('./src/routes');
const requestLogger = require('./src/middleware/logger');
const errorHandler = require('./src/middleware/errorHandler');
const { AppError } = require('./src/utils/errors');

const app = express();

// Global Middleware

// CORS
app.use(cors());

// Rate Limiter
const limiter = rateLimit({
    windowMs: config.rateLimit.windowMs,
    max: config.rateLimit.maxRequests,
    message: {
        success: false,
        status: 'fail',
        message: 'Too many requests. Please try again later.',
    },
    standardHeaders: true,
    legacyHeaders: false,
});
app.use(limiter);

// Body parsers
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Request logging
app.use(requestLogger);

// Routes

app.use('/', routes);

// 404 Handler

app.all('*', (req, res, next) => {
    next(new AppError(`Route ${req.method} ${req.originalUrl} not found`, 404));
});

// Global Error Handler

app.use(errorHandler);

// Server

if (require.main === module) {
    app.listen(config.port, () => {
        console.log(`\n🚀 FinEdge API Server running on port ${config.port}`);
        console.log(`📍 Environment: ${config.nodeEnv}`);
        console.log(`💚 Health check: http://localhost:${config.port}/health\n`);
    });
}

module.exports = app;