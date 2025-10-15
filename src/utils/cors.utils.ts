/**
 * CORS Utility Functions
 * Helper functions for managing CORS configuration
 */

import { corsConfig } from '../config/cors.config';

/**
 * Add a new approved URL to the CORS configuration
 * @param url - The URL to add to the approved list
 */
export const addApprovedUrl = (url: string): void => {
  if (!corsConfig.approvedUrls.includes(url)) {
    corsConfig.approvedUrls.push(url);
    console.log(`Added '${url}' to approved CORS origins`);
  } else {
    console.log(`URL '${url}' is already in the approved CORS origins list`);
  }
};

/**
 * Remove an approved URL from the CORS configuration
 * @param url - The URL to remove from the approved list
 */
export const removeApprovedUrl = (url: string): void => {
  const index = corsConfig.approvedUrls.indexOf(url);
  if (index > -1) {
    corsConfig.approvedUrls.splice(index, 1);
    console.log(`Removed '${url}' from approved CORS origins`);
  } else {
    console.log(`URL '${url}' not found in approved CORS origins list`);
  }
};

/**
 * Get all currently approved URLs
 * @returns Array of approved URLs
 */
export const getApprovedUrls = (): string[] => {
  return [...corsConfig.approvedUrls];
};

/**
 * Check if a URL is in the approved list
 * @param url - The URL to check
 * @returns True if the URL is approved, false otherwise
 */
export const isUrlApproved = (url: string): boolean => {
  return corsConfig.approvedUrls.includes(url);
};

/**
 * Log current CORS configuration
 */
export const logCorsConfig = (): void => {
  // CORS configuration loaded
};
