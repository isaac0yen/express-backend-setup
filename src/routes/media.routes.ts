import { Router } from 'express';
import { authenticate } from '../middlewares/auth';
import mediaController from '../controllers/media.controller';

const mediaRouter = Router();

/**
  * @route POST /profile-picture
  * @description Update user's profile picture
  * @access Private
  * @body {string} base64string - Base64 encoded image data
  * @body {string} fileName - Name of the file
  * @returns {Object} 200 - Profile picture updated successfully
  * @returns {Object} 400 - Bad request, validation errors
  * @returns {Object} 404 - User not found
  * @returns {Object} 500 - Server error
  */
mediaRouter.post('/profile-picture', authenticate, mediaController.updateProfilePicture);

export default mediaRouter;
