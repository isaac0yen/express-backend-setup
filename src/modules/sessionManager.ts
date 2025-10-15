import { db } from './database';
import crypto from 'crypto';
import { Request } from 'express';

export interface SessionInfo {
  userId: number;
  deviceInfo: string;
  ipAddress: string;
  userAgent: string;
}

export class SessionManager {
  
  /**
   * Generate a unique session token
   */
  static generateSessionToken(): string {
    return crypto.randomBytes(32).toString('hex');
  }

  /**
   * Extract device info from request
   */
  static getDeviceInfo(req: Request): SessionInfo {
    const userAgent = req.headers['user-agent'] || 'Unknown';
    const ipAddress = req.ip || req.connection.remoteAddress || 'Unknown';
    
    // Create a simple device fingerprint
    const deviceInfo = this.createDeviceFingerprint(userAgent, ipAddress);
    
    return {
      userId: 0, // Will be set by caller
      deviceInfo,
      ipAddress,
      userAgent
    };
  }

  /**
   * Create a device fingerprint for identification
   */
  private static createDeviceFingerprint(userAgent: string, ipAddress: string): string {
    const hash = crypto.createHash('sha256');
    hash.update(userAgent + ipAddress);
    return hash.digest('hex').substring(0, 16);
  }

  /**
   * Create a new session and invalidate others
   */
  static async createSession(userId: number, sessionInfo: SessionInfo, sessionToken: string): Promise<void> {
    const expiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000); // 30 days

    // First, deactivate all existing sessions for this user
    await db.updateMany('user_sessions', 
      { is_active: false }, 
      { user_id: userId, is_active: true }
    );

    // Create new session
    await db.insertOne('user_sessions', {
      user_id: userId,
      session_token: sessionToken,
      device_info: sessionInfo.deviceInfo,
      ip_address: sessionInfo.ipAddress,
      user_agent: sessionInfo.userAgent,
      is_active: true,
      expires_at: expiresAt
    });
  }

  /**
   * Validate if a session is active and valid
   */
  static async validateSession(sessionToken: string): Promise<boolean> {
    const session = await db.findOne('user_sessions', {
      session_token: sessionToken,
      is_active: true
    });

    if (!session) {
      return false;
    }

    // Check if session has expired
    if (new Date() > new Date(session.expires_at)) {
      // Deactivate expired session
      await db.updateOne('user_sessions', 
        { is_active: false }, 
        { session_token: sessionToken }
      );
      return false;
    }

    return true;
  }

  /**
   * Invalidate a specific session
   */
  static async invalidateSession(sessionToken: string): Promise<void> {
    await db.updateOne('user_sessions', 
      { is_active: false }, 
      { session_token: sessionToken }
    );
  }

  /**
   * Invalidate all sessions for a user
   */
  static async invalidateAllUserSessions(userId: number): Promise<void> {
    await db.updateMany('user_sessions', 
      { is_active: false }, 
      { user_id: userId, is_active: true }
    );
  }

  /**
   * Get active sessions for a user
   */
  static async getUserActiveSessions(userId: number): Promise<any[]> {
    return await db.findMany('user_sessions', {
      user_id: userId,
      is_active: true
    });
  }
}