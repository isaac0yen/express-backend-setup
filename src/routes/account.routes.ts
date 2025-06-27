
import { Router } from 'express';
import accountController from '../controllers/account.controller';
import { authenticate } from '../middlewares/auth';

const accountRouter = Router();

/**
 * @route POST /login
 * @description Login user with email and password
 * @access Public
 * @body {string} email - User's email address
 * @body {string} password - User's password
 * @returns {Object} 200 - Login successful with auth token
 * @returns {Object} 400 - Bad request, validation errors
 * @returns {Object} 401 - Invalid credentials
 * @returns {Object} 500 - Server error
 */
accountRouter.post('/login', accountController.login);

/**
 * @route POST /forgot-password
 * @description Request password reset email
 * @access Public
 * @body {string} email - User's email address
 * @returns {Object} 200 - Password reset email sent
 * @returns {Object} 404 - User not found
 * @returns {Object} 500 - Server error
 */
accountRouter.post('/forgot-password', accountController.forgotPassword);

/**
 * @route POST /reset-password
 * @description Reset password with token
 * @access Public
 * @body {string} token - Password reset token
 * @body {string} password - New password
 * @returns {Object} 200 - Password reset successful
 * @returns {Object} 400 - Invalid or expired token
 * @returns {Object} 500 - Server error
 */
accountRouter.post('/reset-password', accountController.resetPassword);

/**
 * @route POST /change-password
 * @description Change password for authenticated user
 * @access Private
 * @body {string} currentPassword - Current password
 * @body {string} newPassword - New password
 * @returns {Object} 200 - Password changed successfully
 * @returns {Object} 400 - Invalid current password
 * @returns {Object} 500 - Server error
 */
accountRouter.post('/change-password', authenticate, accountController.changePassword);

/**
 * @route POST /logout
 * @description Logout current user
 * @access Private
 * @returns {Object} 200 - Logout successful
 * @returns {Object} 500 - Server error
 */
accountRouter.post('/logout', authenticate, accountController.logout);

export default accountRouter;
