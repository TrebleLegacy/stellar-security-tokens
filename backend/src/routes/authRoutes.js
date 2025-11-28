import express from 'express';
import { body } from 'express-validator';
import { validate } from '../middleware/validator.js';
import { generateToken } from '../middleware/auth.js';
import { Investor } from '../models/Investor.js';
import prisma from '../config/prisma.js';

const router = express.Router();

/**
 * Passkey Login - Simple version for MVP
 * POST /api/auth/passkey-login
 * 
 * For production, this should verify WebAuthn signature.
 * For MVP, we verify credential ID + email combination.
 */
router.post('/passkey-login', [
  body('email').isEmail().withMessage('Valid email is required'),
  body('credentialId').notEmpty().withMessage('Credential ID is required'),
  validate,
], async (req, res, next) => {
  try {
    const { email, credentialId } = req.body;

    // Find investor by email
    const investor = await Investor.findByEmail(email);
    if (!investor) {
      return res.status(401).json({
        success: false,
        error: 'Invalid credentials',
      });
    }

    // Verify credential ID matches
    if (investor.passkeyCredentialId !== credentialId) {
      return res.status(401).json({
        success: false,
        error: 'Invalid passkey credentials',
      });
    }

    // Generate JWT token
    const token = generateToken({
      userId: investor.id,
      email: investor.email,
      userType: 'investor',
    });

    res.json({
      success: true,
      data: {
        token,
        investor: {
          id: investor.id,
          name: investor.name,
          email: investor.email,
          stellarContractId: investor.stellarContractId,
          kycStatus: investor.kycStatus,
        },
      },
    });
  } catch (error) {
    next(error);
  }
});

/**
 * Legacy login - DEPRECATED
 * Use /api/auth/passkey-login instead
 */
router.post('/login', async (req, res) => {
  return res.status(410).json({
    success: false,
    error: 'Password authentication is no longer supported.',
    migrateUrl: '/api/auth/passkey-login',
    message: 'Please use passkey authentication.',
  });
});

export default router;
