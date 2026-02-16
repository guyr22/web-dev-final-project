import { Router } from 'express';
import authController from '../controllers/auth.controller';

const router = Router();

/**
 * @route POST /auth/register
 * @desc Register a new user
 * @access Public
 */
router.post('/register', authController.register.bind(authController));

/**
 * @route POST /auth/login
 * @desc Login user and return JWT tokens
 * @access Public
 */
router.post('/login', authController.login.bind(authController));

/**
 * @route POST /auth/refresh
 * @desc Refresh access token using refresh token
 * @access Public
 */
router.post('/refresh', authController.refresh.bind(authController));

/**
 * @route POST /auth/logout
 * @desc Logout user and invalidate refresh token
 * @access Public
 */
router.post('/logout', authController.logout.bind(authController));

export default router;
