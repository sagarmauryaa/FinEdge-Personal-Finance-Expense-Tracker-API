const jwt = require('jsonwebtoken');
const config = require('../config');
const sessionService = require('../services/sessionService');
const { UnauthorizedError } = require('../utils/errors');

/**
 * JWT Authentication middleware.
 * Verifies the Bearer access token and checks that the user has an active session in DB.
 */
const authenticate = async (req, res, next) => {
    try {
        const authHeader = req.headers.authorization;

        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            throw new UnauthorizedError('Access token is missing. Please provide a Bearer token.');
        }

        const token = authHeader.split(' ')[1];

        let decoded;
        try {
            decoded = jwt.verify(token, config.jwt.secret);
        } catch (error) {
            if (error.name === 'TokenExpiredError') {
                throw new UnauthorizedError('Access token has expired. Use your refresh token to get a new one.');
            }
            throw new UnauthorizedError('Invalid access token. Please login again.');
        }

        // Verify user has an active session in DB (not revoked)
        const hasActiveSession = await sessionService.validateSession(decoded.id);
        if (!hasActiveSession) {
            throw new UnauthorizedError('Session has been revoked. Please login again.');
        }

        req.user = {
            id: decoded.id,
            email: decoded.email,
        };

        next();
    } catch (error) {
        next(error);
    }
};

module.exports = authenticate;
