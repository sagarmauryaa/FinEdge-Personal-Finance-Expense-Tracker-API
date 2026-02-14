/**
 * Request logger middleware.
 * Logs method, URL, status code, and response time for every request.
 */
const requestLogger = (req, res, next) => {
    const start = Date.now();
    const timestamp = new Date().toISOString();

    // Log when response finishes
    res.on('finish', () => {
        const duration = Date.now() - start;
        const log = `[${timestamp}] ${req.method} ${req.originalUrl} → ${res.statusCode} (${duration}ms)`;

        if (res.statusCode >= 400) {
            console.error(`❌ ${log}`);
        } else {
            console.log(`✅ ${log}`);
        }
    });

    next();
};

module.exports = requestLogger;
