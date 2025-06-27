import fs from 'fs';
import { JwtPayload } from 'jsonwebtoken';
import { LOGS_PATH } from '../config/config';

const formatMessage = (message: string, extra?: any, context?: { jwt: JwtPayload }) => {
  const timestamp = new Date().toISOString();
  let formattedExtra = '';

  try {
    formattedExtra = extra ?
      (typeof extra === 'object' ? JSON.stringify(extra, null, 2) : String(extra))
      : '';
  } catch (error) {
    formattedExtra = String(extra);
  }

  const contextInfo = context ? `\nContext: ${JSON.stringify(context, null, 2)}` : '';

  return `[${timestamp}] ${message}\n${formattedExtra}${contextInfo}\n`;
}

export const logger = {
  log: (message: string, extra?: any, context?: { jwt: JwtPayload }) => {
    const logMessage = formatMessage(message, extra, context);
    console.log(logMessage);

    fs.appendFileSync(LOGS_PATH, logMessage);
  },

  error: (message: string, extra?: any, context?: { jwt: JwtPayload }) => {
    const logMessage = formatMessage(`ERROR: ${message}`, extra, context);
    console.error(logMessage);

    fs.appendFileSync('error.log', logMessage);
  },

  warn: (message: string, extra?: any, context?: { jwt: JwtPayload }) => {
    const logMessage = formatMessage(`WARNING: ${message}`, extra, context);
    console.warn(logMessage);

    fs.appendFileSync(LOGS_PATH, logMessage);
  },

  info: (message: string, extra?: any, context?: { jwt: JwtPayload }) => {
    const logMessage = formatMessage(`INFO: ${message}`, extra, context);
    console.info(logMessage);

    fs.appendFileSync(LOGS_PATH, logMessage);
  }
};
