const express = require('express');
const router = express.Router();
const { register, login, refreshToken, logout, logoutAll, getSessions, getProfile, updatePreferences } = require('../controllers/userController');
const { validateUser } = require('../middleware/validators');
const authenticate = require('../middleware/auth');

// Public routes
router.post('/', validateUser, register);
router.post('/login', login);
router.post('/refresh-token', refreshToken);

// Protected routes
router.post('/logout', authenticate, logout);
router.post('/logout-all', authenticate, logoutAll);
router.get('/sessions', authenticate, getSessions);
router.get('/profile', authenticate, getProfile);
router.patch('/preferences', authenticate, updatePreferences);

module.exports = router;
