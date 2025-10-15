
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
 * @route POST /logout
 * @description Logout current user
 * @access Private
 * @returns {Object} 200 - Logout successful
 * @returns {Object} 500 - Server error
 */
accountRouter.post('/logout', authenticate, accountController.logout);

/**
 * @route POST /logout-all
 * @description Logout from all devices
 * @access Private
 * @returns {Object} 200 - Logged out from all devices
 * @returns {Object} 401 - Unauthorized
 * @returns {Object} 500 - Server error
 */
accountRouter.post('/logout-all', authenticate, accountController.logoutAllDevices);


export default accountRouter;
