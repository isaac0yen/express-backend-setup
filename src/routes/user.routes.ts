import { Router } from 'express';
import userController from '../controllers/user.controller';
import { authenticate } from '../middlewares/auth';

const userRouter = Router();

/**
 * @route POST /create
 * @description Create a new user with email, password, first_name, last_name, gender, role, country, profile_image, and date_of_birth
 * @access Public
 * @body {string} email - User's email address
 * @body {string} password - User's password (min 6 characters)
 * @body {string} first_name - User's first name
 * @body {string} last_name - User's last name
 * @body {enum} gender - User's gender (MALE, FEMALE, RATHER_NOT_SAY)
 * @body {enum} role - User's role (ROLE, FACILITATOR, STUDENT, ADMIN, SUPER_ADMIN)
 * @body {string} country - User's country
 * @body {string} profile_image - URL of user's profile image
 * @body {string} date_of_birth - User's date of birth
 * @returns {Object} 201 - User created successfully
 * @returns {Object} 400 - Bad request, validation errors
 * @returns {Object} 500 - Server error
 */
userRouter.post('/create', userController.createUser);

/**
 * @route GET /me
 * @description Get authenticated user's profile
 * @access Private
 * @returns {Object} 200 - User profile data
 * @returns {Object} 404 - User not found
 * @returns {Object} 500 - Server error
 */
userRouter.get('/me', authenticate, userController.getUser);

/**
 * @route GET /admin-get-all
 * @description Get all users in the system
 * @access Private
 * @returns {Array} 200 - Array of user objects
 * @returns {Object} 500 - Server error
 */
userRouter.get('/admin-get-all', authenticate, userController.getAllUsers);

/**
 * @route POST /update
 * @description Update authenticated user's profile
 * @access Private
 * @body {string} [email] - User's email address
 * @body {string} [password] - User's password (min 6 characters)
 * @body {string} [first_name] - User's first name
 * @body {string} [last_name] - User's last name
 * @body {enum} [gender] - User's gender (MALE, FEMALE, RATHER_NOT_SAY)
 * @body {enum} [role] - User's role (ROLE, FACILITATOR, STUDENT, ADMIN, SUPER_ADMIN)
 * @body {string} [country] - User's country
 * @body {string} [profile_image] - URL of user's profile image
 * @body {string} [date_of_birth] - User's date of birth
 * @returns {Object} 200 - User updated successfully
 * @returns {Object} 400 - Bad request, validation errors
 * @returns {Object} 404 - User not found
 * @returns {Object} 500 - Server error
 */
userRouter.post('/update', authenticate, userController.updateUser);

/**
 * @route POST /delete
 * @description Delete authenticated user's account
 * @access Private
 * @returns {Object} 200 - User deleted successfully
 * @returns {Object} 404 - User not found
 * @returns {Object} 500 - Server error
 */
userRouter.post('/delete', authenticate, userController.deleteUser);

export default userRouter;