const express = require('express');
const router = express.Router();

const authController = require('../controllers/authController');
const { protect } = require('../middleware/auth');
const { authLimiter, emailLimiter } = require('../middleware/rateLimiter');
const {
  validate,
  signupRules,
  loginRules,
  changePasswordRules,
  resetPasswordRules,
  forgotPasswordRules,
} = require('../middleware/validate');

// ── Public routes ────────────────────────────────────────
router.post('/signup',          authLimiter, signupRules,         validate, authController.signup);
router.post('/login',           authLimiter, loginRules,          validate, authController.login);
router.post('/logout',          authController.logout);

router.post('/forgot-password', emailLimiter, forgotPasswordRules, validate, authController.forgotPassword);
router.patch('/reset-password/:token', resetPasswordRules, validate, authController.resetPassword);
router.get('/verify-email/:token', authController.verifyEmail);

// ── Protected routes (require valid JWT cookie) ──────────
router.use(protect);

router.post('/resend-verification', emailLimiter, authController.resendVerification);

router.get('/me',               authController.getMe);
router.patch('/update-profile', authController.updateProfile);
router.patch('/change-password', changePasswordRules, validate, authController.changePassword);
router.delete('/delete-account', authController.deleteAccount);

module.exports = router;
