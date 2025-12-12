import express from 'express';
import { body } from 'express-validator';
import { validate } from '../middleware/validator.js';
import { generateToken } from '../middleware/auth.js';
import { Investor } from '../models/Investor.js';
import prisma from '../config/prisma.js';

const router = express.Router();

/**
 * @swagger
 * /api/auth/passkey-login:
 *   post:
 *     summary: Login com passkey
 *     description: Autenticação usando credencial passkey (WebAuthn). Retorna JWT token.
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *               - credentialId
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *                 example: investor@example.com
 *               credentialId:
 *                 type: string
 *                 description: ID da credencial passkey
 *     responses:
 *       200:
 *         description: Login realizado com sucesso
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   type: object
 *                   properties:
 *                     token:
 *                       type: string
 *                     investor:
 *                       $ref: '#/components/schemas/Investor'
 *       401:
 *         description: Credenciais inválidas
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
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



export default router;
