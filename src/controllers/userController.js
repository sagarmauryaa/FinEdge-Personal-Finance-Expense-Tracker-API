const userService = require('../services/userService');

/**
 * POST /users — Register a new user.
 */
const register = async (req, res, next) => {
    try {
        const user = await userService.register(req.body);
        const response = {
            success: true,
            message: 'User registered successfully',
            data: user,
        };
        res.status(201).json(response);
    } catch (error) {
        next(error);
    }
}

/**
 * POST /users/login — Login, create session, return access + refresh tokens.
 */
const login = async (req, res, next) => {
    try {
        const meta = {
            userAgent: req.headers['user-agent'] || 'unknown',
            ipAddress: req.ip || req.connection.remoteAddress || 'unknown',
        };

        const result = await userService.login(req.body, meta);

        const response = {
            success: true,
            message: 'Login successful',
            data: {
                user: result.user,
                accessToken: result.accessToken,
                refreshToken: result.refreshToken,
                session: result.session,
            },
        };
        res.status(200).json(response);
    } catch (error) {
        next(error);
    }
}

/**
 * POST /users/refresh-token — Refresh access token using refresh token.
 */
const refreshToken = async (req, res, next) => {
    try {
        const { refreshToken: token } = req.body;

        if (!token) {
            return res.status(400).json({
                success: false,
                message: 'Refresh token is required',
            });
        }

        const meta = {
            userAgent: req.headers['user-agent'] || 'unknown',
            ipAddress: req.ip || req.connection.remoteAddress || 'unknown',
        };

        const result = await userService.refreshToken(token, meta);

        const response = {
            success: true,
            message: 'Token refreshed successfully',
            data: {
                accessToken: result.accessToken,
                refreshToken: result.refreshToken,
                session: result.session,
            },
        };
        res.status(200).json(response);
    } catch (error) {
        next(error);
    }
}

/**
 * POST /users/logout — Logout from current session.
 */
const logout = async (req, res, next) => {
    try {
        const { sessionId } = req.body;

        if (!sessionId) {
            return res.status(400).json({
                success: false,
                message: 'Session ID is required',
            });
        }

        const result = await userService.logout(sessionId, req.user.id);

        const response = {
            success: true,
            message: result.message,
        };
        res.status(200).json(response);
    } catch (error) {
        next(error);
    }
}

/**
 * POST /users/logout-all — Logout from all devices.
 */
const logoutAll = async (req, res, next) => {
    try {
        const result = await userService.logoutAll(req.user.id);

        const response = {
            success: true,
            message: result.message,
        };
        res.status(200).json(response);
    } catch (error) {
        next(error);
    }
}

/**
 * GET /users/sessions — Get all active sessions.
 */
const getSessions = async (req, res, next) => {
    try {
        const sessions = await userService.getSessions(req.user.id);

        const response = {
            success: true,
            count: sessions.length,
            data: sessions,
        };
        res.status(200).json(response);
    } catch (error) {
        next(error);
    }
}

/**
 * GET /users/profile — Get current user profile.
 */
const getProfile = async (req, res, next) => {
    try {
        const user = await userService.getProfile(req.user.id);
        const response = {
            success: true,
            data: user,
        };
        res.status(200).json(response);
    } catch (error) {
        next(error);
    }
}

/**
 * PATCH /users/preferences — Update user preferences.
 */
const updatePreferences = async (req, res, next) => {
    try {
        const user = await userService.updatePreferences(req.user.id, req.body.preferences);
        const response = {
            success: true,
            message: 'Preferences updated successfully',
            data: user,
        };
        res.status(200).json(response);
    } catch (error) {
        next(error);
    }
}

module.exports = { register, login, refreshToken, logout, logoutAll, getSessions, getProfile, updatePreferences };