import express from 'express';
import { body, param } from 'express-validator';
import { validate } from '../middleware/validator.js';
import { WebAuthnController } from '../controllers/webauthnController.js';

const router = express.Router();

const startRegistrationValidation = [
  body('email').optional().isEmail().withMessage('Valid email is required if provided'),
  body('userId').optional().isInt({ min: 1 }).withMessage('Valid userId is required if provided'),
  param('userType').isIn(['investor', 'company_user', 'platform_admin']).withMessage('Invalid user type'),
  validate,
];

const completeRegistrationValidation = [
  body('credential').notEmpty().withMessage('Credential is required'),
  body('challenge').notEmpty().withMessage('Challenge is required'),
  body('deviceName').optional().isString().withMessage('Device name must be a string'),
  param('userType').isIn(['investor', 'company_user', 'platform_admin']).withMessage('Invalid user type'),
  validate,
];

const startAuthenticationValidation = [
  body('email').isEmail().withMessage('Valid email is required'),
  param('userType').isIn(['investor', 'company_user', 'platform_admin']).withMessage('Invalid user type'),
  validate,
];

const completeAuthenticationValidation = [
  body('credential').notEmpty().withMessage('Credential is required'),
  body('challenge').notEmpty().withMessage('Challenge is required'),
  param('userType').isIn(['investor', 'company_user', 'platform_admin']).withMessage('Invalid user type'),
  validate,
];

/**
 * @swagger
 * /api/webauthn/{userType}/register/start:
 *   post:
 *     summary: Iniciar registro de passkey
 *     description: Gera challenge para WebAuthn registration
 *     tags: [WebAuthn]
 *     parameters:
 *       - in: path
 *         name: userType
 *         required: true
 *         schema:
 *           type: string
 *           enum: [investor, company_user, platform_admin]
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *               userId:
 *                 type: integer
 *     responses:
 *       200:
 *         description: Challenge e opções de registro
 */
// Rotas de registro (criar passkey)
router.post(
  '/:userType/register/start',
  startRegistrationValidation,
  WebAuthnController.startRegistration
);

/**
 * @swagger
 * /api/webauthn/{userType}/register/complete:
 *   post:
 *     summary: Completar registro de passkey
 *     description: Verifica e armazena credential
 *     tags: [WebAuthn]
 *     parameters:
 *       - in: path
 *         name: userType
 *         required: true
 *         schema:
 *           type: string
 *           enum: [investor, company_user, platform_admin]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - credential
 *               - challenge
 *             properties:
 *               credential:
 *                 type: object
 *               challenge:
 *                 type: string
 *               deviceName:
 *                 type: string
 *     responses:
 *       200:
 *         description: Passkey registrada com sucesso
 *       400:
 *         description: Verificação falhou
 */
router.post(
  '/:userType/register/complete',
  completeRegistrationValidation,
  WebAuthnController.completeRegistration
);

/**
 * @swagger
 * /api/webauthn/{userType}/login/start:
 *   post:
 *     summary: Iniciar autenticação passkey
 *     description: Gera challenge para WebAuthn authentication
 *     tags: [WebAuthn]
 *     parameters:
 *       - in: path
 *         name: userType
 *         required: true
 *         schema:
 *           type: string
 *           enum: [investor, company_user, platform_admin]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *     responses:
 *       200:
 *         description: Challenge e opções de autenticação
 */
// Rotas de autenticação (login com passkey)
router.post(
  '/:userType/login/start',
  startAuthenticationValidation,
  WebAuthnController.startAuthentication
);

/**
 * @swagger
 * /api/webauthn/{userType}/login/complete:
 *   post:
 *     summary: Completar autenticação passkey
 *     description: Verifica signature e retorna JWT
 *     tags: [WebAuthn]
 *     parameters:
 *       - in: path
 *         name: userType
 *         required: true
 *         schema:
 *           type: string
 *           enum: [investor, company_user, platform_admin]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - credential
 *               - challenge
 *             properties:
 *               credential:
 *                 type: object
 *               challenge:
 *                 type: string
 *     responses:
 *       200:
 *         description: Autenticação bem-sucedida, retorna JWT
 *       401:
 *         description: Autenticação falhou
 */
router.post(
  '/:userType/login/complete',
  completeAuthenticationValidation,
  WebAuthnController.completeAuthentication
);

export default router;

