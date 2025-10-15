import nodemailer from 'nodemailer';
import Imap from 'imap';
import { simpleParser, ParsedMail } from 'mailparser';
import { Readable } from 'stream';
import dotenv from 'dotenv';
import { db } from './database';
import Validate from './validate';
import { logger } from './logger';

dotenv.config();

// Enhanced bounce detection patterns for various email providers
const BOUNCE_PATTERNS = [
  // Gmail bounce patterns (multiline support)
  /550[- ]5\.1\.1[\s\S]*?([a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,})/gi,
  /The email account that you tried to reach does not exist[\s\S]*?([a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,})/gi,

  // Final-Recipient format (common in bounce reports)
  /Final-Recipient:\s*rfc822;([a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,})/gi,

  // RCPT TO format
  /RCPT TO:<([a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,})>/gi,

  // Failed addresses format
  /The following address\(es\) failed:[\s\S]*?([a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,})/gi,

  // Other common patterns
  /Mailbox unavailable[\s\S]*?([a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,})/gi,
  /User unknown[\s\S]*?([a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,})/gi,
  /Invalid recipient[\s\S]*?([a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,})/gi,
  /No such user[\s\S]*?([a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,})/gi,

  // Generic email extraction from bounce messages
  /([a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,})[\s\S]*?does not exist/gi,
  /([a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,})[\s\S]*?550[- ]5\.1\.1/gi
] as const;

// SMTP permanent error indicators
const PERMANENT_ERRORS = [
  '550', '551', '553', '554',
  'user unknown', 'mailbox unavailable', 'invalid recipient',
  'does not exist', 'no such user', 'recipient rejected'
] as const;

interface MailResult {
  success: boolean;
  messageId?: string;
  error?: unknown;
  blocked?: boolean;
}

// Use ParsedMail from mailparser instead of custom interface

interface ImapMessage {
  on: (event: string, callback: (stream: Readable) => void) => void;
  once: (event: string, callback: (attrs: ImapAttributes) => void) => void;
}

interface ImapAttributes {
  uid: number;
}

interface ImapFetch {
  on: (event: string, callback: (msg: ImapMessage) => void) => void;
  once: (event: string, callback: (error: Error) => void) => void;
}

// Email transporter configuration
const transporter = nodemailer.createTransport({
  host: process.env.EMAIL_HOST,
  port: 587,
  secure: false,
  auth: {
    user: process.env.EMAIL,
    pass: process.env.EMAIL_PASSWORD
  }
});

/**
 * Check if email is in suppression list
 */
async function isEmailSuppressed(email: string): Promise<boolean> {
  try {
    const blocked = await db.findOne('blocked_emails', { email });
    return !!blocked;
  } catch (error) {
    logger.error('Failed to check suppression list', error);
    return false; // Fail open to allow sending
  }
}

/**
 * Add email to suppression list with reason and timestamp
 */
async function addToSuppressionList(
  email: string,
  reason: string,
  subject?: string
): Promise<void> {
  try {
    // Check if already exists to prevent duplicates
    const existing = await db.findOne('blocked_emails', { email });

    if (existing) {
      logger.info(`Email ${email} already in suppression list`);
      return;
    }

    await db.insertOne('blocked_emails', {
      email,
      subject: subject || null,
      created_at: new Date()
    });

    logger.info(`Added ${email} to suppression list: ${reason}`);
  } catch (error) {
    logger.error('Failed to add email to suppression list', error);
  }
}

/**
 * Check if SMTP error indicates permanent failure
 */
function isPermanentSmtpError(errorMessage: string): boolean {
  const lowerMessage = errorMessage.toLowerCase();
  return PERMANENT_ERRORS.some(pattern => lowerMessage.includes(pattern));
}

/**
 * Extract bounced email addresses from bounce message
 */
function extractBouncedEmails(bounceText: string): string[] {
  const bouncedEmails: string[] = [];

  for (const pattern of BOUNCE_PATTERNS) {
    const matches = bounceText.matchAll(pattern);

    for (const match of matches) {
      if (match[1] && Validate.isEmail(match[1])) {
        const email = match[1].toLowerCase();
        bouncedEmails.push(email);
      }
    }
  }

  const uniqueEmails = [...new Set(bouncedEmails)];

  if (uniqueEmails.length > 0) {
    logger.info('Extracted bounced emails', { emails: uniqueEmails });
  }

  return uniqueEmails;
}

/**
 * Process a single bounce email
 */
async function processBounceEmail(email: ParsedMail): Promise<void> {
  const bounceContent = email.text || (typeof email.html === 'string' ? email.html : '') || '';

  if (!bounceContent) {
    return;
  }

  const bouncedEmails = extractBouncedEmails(bounceContent);

  for (const bouncedEmail of bouncedEmails) {
    await addToSuppressionList(bouncedEmail, 'bounce_detected');
  }
}

/**
 * Connect to IMAP and process bounce emails
 */
async function processBounces(): Promise<void> {
  const bounceEmail = process.env.EMAIL;
  const bouncePassword = process.env.EMAIL_PASSWORD;

  if (!bounceEmail || !bouncePassword) {
    return;
  }

  return new Promise((resolve, reject) => {
    const imap = new Imap({
      user: bounceEmail,
      password: bouncePassword,
      host: process.env.EMAIL_HOST || 'localhost',
      port: 993,
      tls: true,
      tlsOptions: { rejectUnauthorized: false }
    });

    imap.once('ready', () => {
      imap.openBox('INBOX', false, (err: Error | null) => {
        if (err) {
          logger.error('Failed to open INBOX', err);
          reject(err);
          return;
        }

        // Search for unread emails
        imap.search(['UNSEEN'], (searchErr: Error | null, results: number[]) => {
          if (searchErr) {
            logger.error('Failed to search for unread emails', searchErr);
            reject(searchErr);
            return;
          }

          if (results.length === 0) {
            imap.end();
            resolve();
            return;
          }

          logger.info(`Processing ${results.length} bounce emails`);

          const fetch = imap.fetch(results, { bodies: '' }) as ImapFetch;
          let processedCount = 0;

          fetch.on('message', (msg: ImapMessage) => {
            msg.on('body', (stream: Readable) => {
              simpleParser(stream, async (parseErr: Error | null, parsed: ParsedMail) => {
                if (parseErr) {
                  logger.error('Failed to parse bounce email', parseErr);
                  return;
                }

                await processBounceEmail(parsed);
              });
            });

            msg.once('attributes', (attrs: ImapAttributes) => {
              // Mark email as read
              imap.addFlags(attrs.uid, '\\Seen', () => {
                processedCount++;

                if (processedCount === results.length) {
                  imap.end();
                  resolve();
                }
              });
            });
          });

          fetch.once('error', (fetchErr: Error) => {
            logger.error('IMAP fetch error', fetchErr);
            reject(fetchErr);
          });
        });
      });
    });

    imap.once('error', (imapErr: Error) => {
      logger.error('IMAP connection error', imapErr);
      reject(imapErr);
    });

    imap.connect();
  });
}

/**
 * Start periodic bounce processing
 */
function startBounceProcessor(): void {
  const intervalMs = 5 * 60 * 1000; // 5 minutes

  // Process bounces immediately on startup
  processBounces().catch(error => {
    logger.error('Initial bounce processing failed', error);
  });

  // Set up periodic processing
  setInterval(async () => {
    try {
      await processBounces();
    } catch (error) {
      logger.error('Bounce processing failed', error);
    }
  }, intervalMs);

  logger.info('Bounce processor started');
}

/**
 * Enhanced sendMail with suppression list and bounce handling
 */
async function sendMail(
  recipientEmail: string,
  htmlContent: string,
  subject: string
): Promise<MailResult> {
  try {
    // Check suppression list
    const isSuppressed = await isEmailSuppressed(recipientEmail);

    if (isSuppressed) {
      logger.info(`Email suppressed: ${recipientEmail}`);
      return {
        success: false,
        error: 'Email in suppression list',
        blocked: true
      };
    }

    // Prepare mail options
    const mailOptions = {
      from: process.env.DISPLAY_EMAIL,
      to: recipientEmail,
      html: htmlContent,
      subject: subject,
      returnPath: process.env.EMAIL
    };

    // Send email
    const info = await transporter.sendMail(mailOptions);

    logger.info('Email sent successfully', {
      to: recipientEmail,
      subject,
      messageId: info.messageId
    });

    return { success: true, messageId: info.messageId };

  } catch (error) {
    logger.error('Email send failed', error);

    // Add to suppression list for permanent SMTP errors
    if (error instanceof Error && isPermanentSmtpError(error.message)) {
      await addToSuppressionList(recipientEmail, 'smtp_permanent_error', subject);
    }

    return { success: false, error };
  }
}

/**
 * Remove email from suppression list
 */
async function removeFromSuppressionList(email: string): Promise<boolean> {
  try {
    const deleted = await db.deleteOne('blocked_emails', { email });
    if (deleted > 0) {
      logger.info(`Removed ${email} from suppression list`);
      return true;
    }
    return false;
  } catch (error) {
    logger.error('Failed to remove from suppression list', error);
    return false;
  }
}

/**
 * Get suppression list for admin purposes
 */
async function getSuppressionList(): Promise<unknown[]> {
  try {
    return await db.findMany('blocked_emails', {});
  } catch (error) {
    logger.error('Failed to get suppression list', error);
    return [];
  }
}

// Initialize bounce processor if credentials are available
if (process.env.EMAIL && process.env.EMAIL_PASSWORD) {
  startBounceProcessor();
}

/**
 * Test bounce extraction with sample bounce message (for debugging)
 */
function testBounceExtraction(bounceMessage: string): string[] {
  logger.info('Testing bounce extraction with provided message');
  return extractBouncedEmails(bounceMessage);
}

// Export mailer object with enhanced functionality
const mailer = {
  sendMail,
  isEmailSuppressed,
  addToSuppressionList,
  removeFromSuppressionList,
  getSuppressionList,
  processBounces,
  testBounceExtraction
};

export default mailer;