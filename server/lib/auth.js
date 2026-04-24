import 'dotenv/config'
import { betterAuth } from 'better-auth'
import { makePool } from './pgPool.js'
import { sendEmail } from './email.js'

const pool = makePool()

export const auth = betterAuth({
  secret:  process.env.BETTER_AUTH_SECRET,
  baseURL: process.env.BETTER_AUTH_URL ?? 'http://localhost:3001',

  database: pool,

  emailAndPassword: {
    enabled: true,
    sendResetPassword: async ({ user, url }) => {
      try {
        await sendEmail(
          user.email,
          'Reset your password',
          `<p>Click the link below to reset your password.</p><p><a href="${url}">Reset password</a></p>`
        )
      } catch (error) {
        console.error('Failed to send reset password email', error)
      }
    },
  },

  emailVerification: {
    sendOnSignUp: true,
    callbackURL: process.env.CLIENT_ORIGIN ?? 'http://localhost:5173',
    sendVerificationEmail: async ({ user, url }) => {
      try {
        await sendEmail(
          user.email,
          'Verify your email',
          `<p>Please confirm your email address by clicking the link below.</p><p><a href="${url}">Verify your email</a></p>`
        )
      } catch (error) {
        console.error('Failed to send verification email', error)
      }
    },
  },

  // ── Table + field mapping to our snake_case schema ────────────────────────
  user: {
    modelName: 'auth_user',
    fields: {
      emailVerified: 'email_verified',
      createdAt:     'created_at',
      updatedAt:     'updated_at',
    },
  },

  session: {
    modelName: 'auth_session',
    fields: {
      userId:     'user_id',
      expiresAt:  'expires_at',
      ipAddress:  'ip_address',
      userAgent:  'user_agent',
      createdAt:  'created_at',
      updatedAt:  'updated_at',
    },
  },

  account: {
    modelName: 'auth_account',
    fields: {
      userId:       'user_id',
      accountId:    'account_id',
      providerId:   'provider_id',
      accessToken:  'access_token',
      refreshToken: 'refresh_token',
      idToken:      'id_token',
      expiresAt:    'expires_at',
      createdAt:    'created_at',
      updatedAt:    'updated_at',
    },
  },

  verification: {
    modelName: 'auth_verification',
    fields: {
      expiresAt: 'expires_at',
      createdAt: 'created_at',
      updatedAt: 'updated_at',
    },
  },

  trustedOrigins: [
    process.env.CLIENT_ORIGIN ?? 'http://localhost:5173',
  ],
})
