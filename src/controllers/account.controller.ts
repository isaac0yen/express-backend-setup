import { Request, Response } from 'express'
import { generateToken } from "../modules/token"
import { db } from '../modules/database'
import bcrypt from 'bcrypt'
import Validate from '../modules/validate'
import { AuthenticatedRequest } from '../middlewares/auth'
import { SessionManager } from '../modules/sessionManager'

export default {
  login: async (req: Request, res: Response) => {
    try {
      const { email, password } = req.body

      if (!Validate.isEmail(email)) {
        return res.status(400).json({
          status: false,
          message: "Invalid email format"
        })
      }

      if (!Validate.isString(password) || password.length < 6) {
        return res.status(400).json({
          status: false,
          message: "Password must be at least 6 characters long"
        })
      }

      const user = await db.findOne('users', { email })

      if (!user) {
        return res.status(401).json({
          status: false,
          message: "Invalid email or password"
        })
      }

      if (user.status == 'INACTIVE') {
        return res.status(401).json({
          status: false,
          message: "Account is inactive, kindly go to your email and click on the verification link."
        })
      }

      const isValidPassword = await bcrypt.compare(password, user.password_hash)

      if (!isValidPassword) {
        return res.status(401).json({
          status: false,
          message: "Invalid email or password"
        })
      }

      // Generate session token and create session
      const sessionToken = SessionManager.generateSessionToken();
      const sessionInfo = SessionManager.getDeviceInfo(req);
      sessionInfo.userId = user.id;

      await SessionManager.createSession(user.id, sessionInfo, sessionToken);

      // Generate JWT token with session token (24 hours)
      const token = generateToken({
        id: user.id,
        email: user.email,
        role: user.role,
        status: user.status,
        sessionToken: sessionToken
      }, 24 * 60 * 60)

      return res.status(200).json({
        status: true,
        message: "Login successful",
        data: {
          token,
          user: {
            first_name: user.first_name
          }
        }
      })
    } catch (error) {
      console.error('Login error:', error)
      res.status(500).json({
        status: false,
        message: "Error during login"
      })
    }
  },

  logout: async (req: AuthenticatedRequest, res: Response) => {
    try {
      const sessionToken = (req.context as any)?.sessionToken;

      if (sessionToken) {
        await SessionManager.invalidateSession(sessionToken);
      }

      return res.status(200).json({
        status: true,
        message: "Logout successful"
      })
    } catch (error) {
      console.error('Logout error:', error)
      res.status(500).json({
        status: false,
        message: "Error during logout"
      })
    }
  },

  // Logout from all devices
  logoutAllDevices: async (req: AuthenticatedRequest, res: Response) => {
    try {
      const userId = req.context?.id;

      if (!userId) {
        return res.status(401).json({
          status: false,
          message: "User not authenticated"
        });
      }

      await SessionManager.invalidateAllUserSessions(userId);

      return res.status(200).json({
        status: true,
        message: "Logged out from all devices successfully"
      });
    } catch (error) {
      console.error('Logout all devices error:', error);
      res.status(500).json({
        status: false,
        message: "Error logging out from all devices"
      });
    }
  },

}