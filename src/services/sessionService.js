const crypto = require('crypto');
const jwt = require('jsonwebtoken');
const sessionStore = require('../models/Session');
const config = require('../config');
const { generateId, now } = require('../utils/helpers');
const { UnauthorizedError } = require('../utils/errors');
const userStore = require('../models/User');

/**
 * Generate a cryptographically secure refresh token string.
 */
const generateRefreshToken = () => {
    return crypto.randomBytes(40).toString('hex');
};

/**
 * Hash the refresh token before storing in DB (so raw token is never persisted).
 */
const hashToken = (token) => {
    return crypto.createHash('sha256').update(token).digest('hex');
};

/**
 * Generate a short-lived JWT access token.
 */
const generateAccessToken = (user) => {
    return jwt.sign(
        { id: user.id, email: user.email },
        config.jwt.secret,
        { expiresIn: config.jwt.expiresIn }
    );
};

/**
 * Parse a duration string like '7d', '15m', '1h' into milliseconds.
 */
const parseDuration = (duration) => {
    const match = duration.match(/^(\d+)([smhd])$/);
    if (!match) return 7 * 24 * 60 * 60 * 1000; // default 7 days

    const value = parseInt(match[1], 10);
    const unit = match[2];

    switch (unit) {
        case 's': return value * 1000;
        case 'm': return value * 60 * 1000;
        case 'h': return value * 60 * 60 * 1000;
        case 'd': return value * 24 * 60 * 60 * 1000;
        default: return 7 * 24 * 60 * 60 * 1000;
    }
};

/**
 * Create a new session for a user after successful login.
 * Stores hashed refresh token, user agent, and IP for security validation.
 */
const createSession = async (user, meta = {}) => {
    const rawRefreshToken = generateRefreshToken();
    const hashedRefreshToken = hashToken(rawRefreshToken);
    const accessToken = generateAccessToken(user);

    const refreshExpiresMs = parseDuration(config.jwt.refreshExpiresIn);

    const session = {
        id: generateId(),
        userId: user.id,
        refreshTokenHash: hashedRefreshToken,
        userAgent: meta.userAgent || 'unknown',
        ipAddress: meta.ipAddress || 'unknown',
        isRevoked: false,
        expiresAt: new Date(Date.now() + refreshExpiresMs).toISOString(),
        createdAt: now(),
        updatedAt: now(),
    };

    await sessionStore.create(session);

    return {
        accessToken,
        refreshToken: rawRefreshToken,
        session: {
            id: session.id,
            expiresAt: session.expiresAt,
        },
    };
};

/**
 * Refresh the access token using a valid refresh token.
 * Implements refresh token rotation — old token is invalidated, new one is issued.
 */
const refreshSession = async (rawRefreshToken, meta = {}) => {
    const hashedToken = hashToken(rawRefreshToken);

    const sessions = await sessionStore.findWhere(
        (s) => s.refreshTokenHash === hashedToken && !s.isRevoked
    );

    if (sessions.length === 0) {
        throw new UnauthorizedError('Invalid or expired refresh token. Please login again.');
    }

    const session = sessions[0];

    // Check if refresh token has expired
    if (new Date(session.expiresAt) < new Date()) {
        await sessionStore.update(session.id, { isRevoked: true });
        throw new UnauthorizedError('Refresh token has expired. Please login again.');
    }

    // Revoke the old refresh token (rotation)
    await sessionStore.update(session.id, { isRevoked: true });

    // Generate new tokens
    const newRawRefreshToken = generateRefreshToken();
    const newHashedRefreshToken = hashToken(newRawRefreshToken);

    const refreshExpiresMs = parseDuration(config.jwt.refreshExpiresIn);

    const user = await userStore.findById(session.userId);
    if (!user) {
        throw new UnauthorizedError('User not found. Session invalid.');
    }

    const accessToken = generateAccessToken(user);

    // Create a new session record
    const newSession = {
        id: generateId(),
        userId: session.userId,
        refreshTokenHash: newHashedRefreshToken,
        userAgent: meta.userAgent || session.userAgent,
        ipAddress: meta.ipAddress || session.ipAddress,
        isRevoked: false,
        expiresAt: new Date(Date.now() + refreshExpiresMs).toISOString(),
        createdAt: now(),
        updatedAt: now(),
    };

    await sessionStore.create(newSession);

    return {
        accessToken,
        refreshToken: newRawRefreshToken,
        session: {
            id: newSession.id,
            expiresAt: newSession.expiresAt,
        },
    };
};

/**
 * Revoke a specific session (logout).
 */
const revokeSession = async (sessionId, userId) => {
    const session = await sessionStore.findById(sessionId);
    if (!session || session.userId !== userId) {
        throw new UnauthorizedError('Session not found.');
    }

    await sessionStore.update(sessionId, { isRevoked: true });
    return { message: 'Session revoked successfully' };
};

/**
 * Revoke all sessions for a user (logout from all devices).
 */
const revokeAllSessions = async (userId) => {
    const sessions = await sessionStore.findWhere(
        (s) => s.userId === userId && !s.isRevoked
    );

    for (const session of sessions) {
        await sessionStore.update(session.id, { isRevoked: true });
    }

    return { message: `${sessions.length} session(s) revoked successfully` };
};

/**
 * Get all active sessions for a user.
 */
const getActiveSessions = async (userId) => {
    const sessions = await sessionStore.findWhere(
        (s) => s.userId === userId && !s.isRevoked && new Date(s.expiresAt) > new Date()
    );

    return sessions.map((s) => ({
        id: s.id,
        userAgent: s.userAgent,
        ipAddress: s.ipAddress,
        createdAt: s.createdAt,
        expiresAt: s.expiresAt,
    }));
};

/**
 * Validate that a session exists and is active for a given userId.
 * Used by the auth middleware to ensure the token's session hasn't been revoked.
 */
const validateSession = async (userId) => {
    const sessions = await sessionStore.findWhere(
        (s) => s.userId === userId && !s.isRevoked && new Date(s.expiresAt) > new Date()
    );

    return sessions.length > 0;
};

module.exports = {
    createSession,
    refreshSession,
    revokeSession,
    revokeAllSessions,
    getActiveSessions,
    validateSession,
};
