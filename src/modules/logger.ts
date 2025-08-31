import fs from 'fs';
import path from 'path';
import { JwtPayload } from 'jsonwebtoken';
import { DateTime } from 'luxon';
import { LOGS_PATH } from '../config/config';

const ensureLogFileExists = (logPath: string) => {
  try {
    const logDir = path.dirname(logPath);

    // Create directory if it doesn't exist
    if (!fs.existsSync(logDir)) {
      fs.mkdirSync(logDir, { recursive: true });
    }

    // Create file if it doesn't exist
    if (!fs.existsSync(logPath)) {
      fs.writeFileSync(logPath, '');
    }
  } catch (error) {
    console.error(`Failed to ensure log file exists at ${logPath}:`, error);
  }
};

const formatMessage = (message: string, extra?: unknown, context?: { jwt: JwtPayload }) => {
  const timestamp = DateTime.now()
    .setZone('Africa/Lagos')
    .toFormat('yyyy-MM-dd HH:mm:ss ZZZZ');

  let formattedExtra = '';

  try {
    formattedExtra = extra ?
      (typeof extra === 'object' ? JSON.stringify(extra, null, 2) : String(extra))
      : '';
  } catch {
    formattedExtra = String(extra);
  }

  const contextInfo = context ? `\nContext: ${JSON.stringify(context, null, 2)}` : '';

  return `[${timestamp}] ${message}\n${formattedExtra}${contextInfo}\n`;
};

export const logger = {
  log: (message: string, extra?: unknown, context?: { jwt: JwtPayload }) => {
    const logMessage = formatMessage(message, extra, context);
    console.log(logMessage);

    try {
      ensureLogFileExists(LOGS_PATH);
      fs.appendFileSync(LOGS_PATH, logMessage);
    } catch (error) {
      console.error('Failed to write to log file:', error);
    }
  },

  error: (message: string, extra?: unknown, context?: { jwt: JwtPayload }) => {
    const logMessage = formatMessage(`ERROR: ${message}`, extra, context);
    console.error(logMessage);

    try {
      const errorLogPath = path.join(path.dirname(LOGS_PATH), 'error.log');
      ensureLogFileExists(errorLogPath);
      fs.appendFileSync(errorLogPath, logMessage);
    } catch (error) {
      console.error('Failed to write to error log file:', error);
    }
  },

  warn: (message: string, extra?: unknown, context?: { jwt: JwtPayload }) => {
    const logMessage = formatMessage(`WARNING: ${message}`, extra, context);
    console.warn(logMessage);

    try {
      ensureLogFileExists(LOGS_PATH);
      fs.appendFileSync(LOGS_PATH, logMessage);
    } catch (error) {
      console.error('Failed to write to log file:', error);
    }
  },

  info: (message: string, extra?: unknown, context?: { jwt: JwtPayload }) => {
    const logMessage = formatMessage(`INFO: ${message}`, extra, context);
    console.info(logMessage);

    try {
      ensureLogFileExists(LOGS_PATH);
      fs.appendFileSync(LOGS_PATH, logMessage);
    } catch (error) {
      console.error('Failed to write to log file:', error);
    }
  }
};
