import { Request, Response } from 'express'
import { generateToken } from "../modules/token"
import { db } from '../modules/database'
import bcrypt from 'bcrypt'
import Validate from '../modules/validate'
import mailer from '../modules/mailer'
import { strings } from '../modules/strings'
import fs from 'fs'
import path from 'path'
import { AuthenticatedRequest } from '../middlewares/auth'
import { LOGO_URL } from '../config/config'

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

      const isValidPassword = await bcrypt.compare(password, user.password_hash)

      if (!isValidPassword) {
        return res.status(401).json({
          status: false,
          message: "Invalid email or password"
        })
      }

      const token = generateToken({ id: user.id, email: user.email })

      return res.status(200).json({
        status: true,
        message: "Login successful",
        data: {
          token,
          user: {
            id: user.id,
            email: user.email,
            first_name: user.first_name,
            last_name: user.last_name,
            role: user.role
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

  forgotPassword: async (req: Request, res: Response) => {
    try {
      const { email } = req.body

      if (!Validate.isEmail(email)) {
        return res.status(400).json({
          status: false,
          message: "Invalid email format"
        })
      }

      const user = await db.findOne('users', { email })

      if (!user) {
        return res.status(404).json({
          status: false,
          message: "User not found"
        })
      }

      // Generate OTP code
      const otpCode = Math.random().toString().slice(2, 8).padStart(6, '0')
      const expiresAt = new Date(Date.now() + 3600000) // 1 hour from now

      // Store OTP in database
      await db.insertOne('otps', {
        user_id: user.id,
        otp_code: otpCode,
        purpose: 'PASSWORD_RESET',
        expires_at: expiresAt,
        is_used: false
      })

      // Send email with OTP
      const templatePath = path.join(__dirname, '../templates/reset-pass.html')
      let htmlContent = fs.readFileSync(templatePath, 'utf8')

      const replacements = {
        LOGO_URL: LOGO_URL,
        FIRST_NAME: user.first_name,
        LAST_NAME: user.last_name,
        CODE: otpCode,
        EXPIRY_TIME: '60',
        CURRENT_YEAR: new Date().getFullYear().toString()
      }

      htmlContent = strings.replacePlaceholders(htmlContent, replacements)

      mailer.sendMail(email, htmlContent, "Password Reset Code")

      return res.status(200).json({
        status: true,
        message: "Password reset code sent to your email"
      })
    } catch (error) {
      console.error('Forgot password error:', error)
      res.status(500).json({
        status: false,
        message: "Error processing request"
      })
    }
  },

  verifyResetCode: async (req: Request, res: Response) => {
    try {
      const { email, code } = req.body

      if (!Validate.isEmail(email)) {
        return res.status(400).json({
          status: false,
          message: "Invalid email format"
        })
      }

      if (!code || code.length !== 6) {
        return res.status(400).json({
          status: false,
          message: "Invalid verification code format"
        })
      }

      const user = await db.findOne('users', { email })

      if (!user) {
        return res.status(404).json({
          status: false,
          message: "User not found"
        })
      }

      const otp = await db.findOne('otps', {
        user_id: user.id,
        otp_code: code,
        purpose: 'PASSWORD_RESET',
        is_used: false
      })

      if (!otp || new Date() > new Date(otp.expires_at)) {
        return res.status(400).json({
          status: false,
          message: "Invalid or expired verification code"
        })
      }

      const resetToken = generateToken({ id: user.id, email: user.email }, 15 * 60 * 1000)

      return res.status(200).json({
        status: true,
        message: "Code verified successfully",
        data: {
          reset_token: resetToken
        }
      })
    } catch (error) {
      console.error('Verify reset code error:', error)
      res.status(500).json({
        status: false,
        message: "Error verifying code"
      })
    }
  },

  resetPassword: async (req: Request, res: Response) => {
    try {
      const { token, password, email, code } = req.body

      if (!token || !password) {
        return res.status(400).json({
          status: false,
          message: "Reset token and new password are required"
        })
      }

      if (!Validate.isString(password) || password.length < 6) {
        return res.status(400).json({
          status: false,
          message: "Password must be at least 6 characters long"
        })
      }

      // Verify reset token
      let tokenPayload
      try {
        const jwt = require('jsonwebtoken')
        tokenPayload = jwt.verify(token, process.env.JWT_SECRET || 'YOUR_DEFAULT_JWT_SECRET')
      } catch (error) {
        return res.status(400).json({
          status: false,
          message: "Invalid or expired reset token"
        })
      }

      const user = await db.findOne('users', { id: tokenPayload.id })

      if (!user) {
        return res.status(404).json({
          status: false,
          message: "User not found"
        })
      }

      // Mark OTP as used
      if (email && code) {
        await db.updateOne('otps', {
          is_used: true
        }, {
          user_id: user.id,
          otp_code: code,
          purpose: 'PASSWORD_RESET'
        })
      }

      // Hash new password
      const password_hash = await bcrypt.hash(password, 10)

      // Update user password
      await db.updateOne('users', {
        password_hash
      }, { id: user.id })

      return res.status(200).json({
        status: true,
        message: "Password reset successful"
      })
    } catch (error) {
      console.error('Reset password error:', error)
      res.status(500).json({
        status: false,
        message: "Error resetting password"
      })
    }
  },

  changePassword: async (req: AuthenticatedRequest, res: Response) => {
    try {
      const { currentPassword, newPassword } = req.body
      const userId = req.context?.id

      if (!userId) {
        return res.status(401).json({
          status: false,
          message: "User not authenticated"
        })
      }

      if (!Validate.isString(currentPassword)) {
        return res.status(400).json({
          status: false,
          message: "Current password is required"
        })
      }

      if (!Validate.isString(newPassword) || newPassword.length < 6) {
        return res.status(400).json({
          status: false,
          message: "New password must be at least 6 characters long"
        })
      }

      const user = await db.findOne('users', { id: userId })

      if (!user) {
        return res.status(404).json({
          status: false,
          message: "User not found"
        })
      }

      const isValidPassword = await bcrypt.compare(currentPassword, user.password_hash)

      if (!isValidPassword) {
        return res.status(400).json({
          status: false,
          message: "Invalid current password"
        })
      }

      const password_hash = await bcrypt.hash(newPassword, 10)

      await db.updateOne('users', { password_hash }, { id: userId })

      return res.status(200).json({
        status: true,
        message: "Password changed successfully"
      })
    } catch (error) {
      console.error('Change password error:', error)
      res.status(500).json({
        status: false,
        message: "Error changing password"
      })
    }
  },

  logout: async (req: AuthenticatedRequest, res: Response) => {
    try {
      // In a more robust implementation, you might want to:
      // 1. Add token to a blacklist
      // 2. Store active sessions in database and remove them
      // 3. Clear any session-related data

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
  }
}