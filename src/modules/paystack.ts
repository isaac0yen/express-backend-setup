import axios from 'axios';
import { logger } from './logger';

// Paystack API base URL
const PAYSTACK_API_URL = 'https://api.paystack.co';

// Paystack secret key from environment variables
const PAYSTACK_SECRET_KEY = process.env.PAYSTACK_SECRET_KEY || '';

// Headers for Paystack API calls
const headers = {
  Authorization: `Bearer ${PAYSTACK_SECRET_KEY}`,
  'Content-Type': 'application/json',
};

/**
 * Initiates a transaction with Paystack
 * @param email User's email for the transaction
 * @param amount Amount in Naira
 * @param callback_url URL to redirect after payment
 * @param metadata Additional data including courseId and userId
 * @returns Payment data with URL and reference or null if initiation fails
 */

export async function initiateTransaction(
  email: string,
  amount: number,
  callback_url: string,
  metadata: { courseId: number; userId: number }
): Promise<{ authorization_url: string; reference: string } | null> {
  try {
    const response = await axios.post(
      `${PAYSTACK_API_URL}/transaction/initialize`,
      {
        email,
        amount: amount * 100, // Convert to kobo
        callback_url,
        metadata,
      },
      { headers }
    );

    const { data } = response.data;
    return {
      authorization_url: data.authorization_url,
      reference: data.reference
    };
  } catch (error) {
    logger.error('Error initiating transaction:', error);
    return null;
  }
}

/**
 * Verifies a transaction with Paystack
 * @param reference Transaction reference to verify
 * @returns Transaction status and details if successful, null otherwise
 */
export async function verifyTransaction(reference: string): Promise<unknown | null> {
  try {
    const response = await axios.get(
      `${PAYSTACK_API_URL}/transaction/verify/${reference}`,
      { headers }
    );

    const { data } = response.data;
    return data; // Return the full data, let the caller handle status updates
  } catch (error) {
    logger.error('Error verifying transaction:', error);
    return null;
  }
}
