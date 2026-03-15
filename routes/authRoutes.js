const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const { authenticate } = require('../middleware/auth');
const { registerRules, loginRules, handleValidation } = require('../middleware/validateAuth');
const { loginLimiter } = require('../middleware/rateLimit');

// Public routes
router.post('/register', registerRules, handleValidation, authController.register);
router.post('/login', loginLimiter, loginRules, handleValidation, authController.login);

// Protected routes
router.get('/me', authenticate, authController.getMe);
router.put('/profile', authenticate, authController.updateProfile);
router.post('/logout', authenticate, authController.logout);
router.post('/refresh', authenticate, authController.refreshToken);
router.get('/statistics', authenticate, authController.getUserStatistics);
router.get('/watch-history', authenticate, authController.getWatchHistory);
router.get('/is-admin', authenticate, authController.checkAdmin);

module.exports = router;

