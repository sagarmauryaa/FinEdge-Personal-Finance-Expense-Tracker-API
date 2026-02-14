const userStore = require('../models/User');
const sessionService = require('./sessionService');
const { generateId, now } = require('../utils/helpers');
const { ConflictError, NotFoundError, UnauthorizedError } = require('../utils/errors');
const crypto = require('crypto');

/**
 * Simple password hashing using crypto (for demonstration — use bcrypt in production).
 */
const hashPassword = (password) => {
    return crypto.createHash('sha256').update(password).digest('hex');
};

/**
 * Register a new user.
 */
const register = async (data) => {
    const existing = await userStore.findWhere((u) => u.email === data.email);
    if (existing.length > 0) {
        throw new ConflictError(`User with email '${data.email}' already exists`);
    }

    const user = {
        id: generateId(),
        name: data.name,
        email: data.email,
        password: hashPassword(data.password),
        preferences: data.preferences || {},
        createdAt: now(),
        updatedAt: now(),
    };

    await userStore.create(user);

    const { password, ...safeUser } = user;
    return safeUser;
};

/**
 * Login a user — creates a session with access and refresh tokens.
 */
const login = async ({ email, password }, meta = {}) => {
    const users = await userStore.findWhere((u) => u.email === email);
    if (users.length === 0) {
        throw new UnauthorizedError('Invalid email or password');
    }

    const user = users[0];
    if (user.password !== hashPassword(password)) {
        throw new UnauthorizedError('Invalid email or password');
    }

    // Create a secure session with tokens
    const tokens = await sessionService.createSession(user, meta);

    const { password: _, ...safeUser } = user;
    return {
        user: safeUser,
        accessToken: tokens.accessToken,
        refreshToken: tokens.refreshToken,
        session: tokens.session,
    };
};

/**
 * Refresh access token using a valid refresh token.
 */
const refreshToken = async (rawRefreshToken, meta = {}) => {
    return await sessionService.refreshSession(rawRefreshToken, meta);
};

/**
 * Logout — revoke the current session.
 */
const logout = async (sessionId, userId) => {
    return await sessionService.revokeSession(sessionId, userId);
};

/**
 * Logout from all devices — revoke all sessions.
 */
const logoutAll = async (userId) => {
    return await sessionService.revokeAllSessions(userId);
};

/**
 * Get all active sessions for the current user.
 */
const getSessions = async (userId) => {
    return await sessionService.getActiveSessions(userId);
};

/**
 * Get user profile by ID.
 */
const getProfile = async (userId) => {
    const user = await userStore.findById(userId);
    if (!user) throw new NotFoundError('User', userId);

    const { password, ...safeUser } = user;
    return safeUser;
};

/**
 * Update user preferences.
 */
const updatePreferences = async (userId, preferences) => {
    const user = await userStore.findById(userId);
    if (!user) throw new NotFoundError('User', userId);

    const updated = await userStore.update(userId, {
        preferences: { ...user.preferences, ...preferences },
    });

    const { password, ...safeUser } = updated;
    return safeUser;
};

module.exports = { register, login, refreshToken, logout, logoutAll, getSessions, getProfile, updatePreferences };
