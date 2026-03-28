import { Router } from 'express';
import {
  register, 
  login, 
  googleLogin,
  getMe, 
  updateProfile, 
  changePassword, 
  forgotPassword, 
  resetPassword, 
  getMyActivity,
  getAddresses,
  addAddress,
  updateAddress,
  deleteAddress,
  setDefaultAddress,
  verify2FA,
  toggle2FA,
  logout
} from '../../controllers/user/auth.controller.js';
import { verifyToken } from '../../middlewares/auth.middleware.js';
import { authAccountThrottle } from '../../middlewares/rate-limit.middleware.js';

const router = Router();
const loginAccountThrottle = authAccountThrottle('auth-login-account', 8, 15 * 60 * 1000, (req) =>
  typeof req.body?.username === 'string' ? req.body.username.trim() : null
);
const registerAccountThrottle = authAccountThrottle('auth-register-account', 5, 60 * 60 * 1000, (req) =>
  typeof req.body?.email === 'string' ? req.body.email.trim() : null
);
const forgotPasswordThrottle = authAccountThrottle('auth-forgot-password-account', 5, 30 * 60 * 1000, (req) =>
  typeof req.body?.email === 'string' ? req.body.email.trim() : null
);
const verify2FAThrottle = authAccountThrottle('auth-2fa-account', 10, 10 * 60 * 1000, (req) => {
  if (typeof req.body?.userId === 'string') return req.body.userId.trim();
  if (typeof req.body?.email === 'string') return req.body.email.trim();
  return null;
});

/**
 * @swagger
 * tags:
 *   name: Auth
 *   description: Authentication & User management
 */

/**
 * @swagger
 * /auth/register:
 *   post:
 *     summary: Register new user
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               username:
 *                 type: string
 *               email:
 *                 type: string
 *               password:
 *                 type: string
 *     responses:
 *       201:
 *         description: User created
 */
router.post('/register', registerAccountThrottle, register);

/**
 * @swagger
 * /auth/login:
 *   post:
 *     summary: Login user
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               username:
 *                 type: string
 *               password:
 *                 type: string
 *     responses:
 *       200:
 *         description: Login successful
 */
router.post('/login', loginAccountThrottle, login);
router.post('/login/google', googleLogin);
router.post('/logout', logout);
router.post('/forgot-password', forgotPasswordThrottle, forgotPassword);
router.post('/reset-password', resetPassword);

/**
 * @swagger
 * /auth/me:
 *   get:
 *     summary: Get current user profile
 *     tags: [Auth]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: User profile
 */
router.get('/me', verifyToken, getMe);
router.put('/profile', verifyToken, updateProfile);
router.put('/change-password', verifyToken, changePassword);
router.get('/activity', verifyToken, getMyActivity);

// Address Routes
router.get('/addresses', verifyToken, getAddresses);
router.post('/addresses', verifyToken, addAddress);
router.put('/addresses/:id', verifyToken, updateAddress);
router.delete('/addresses/:id', verifyToken, deleteAddress);
router.put('/addresses/:id/default', verifyToken, setDefaultAddress);

// 2FA Routes
router.post('/2fa/verify', verify2FAThrottle, verify2FA);
router.put('/2fa/toggle', verifyToken, toggle2FA);

export default router;
