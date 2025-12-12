import express from 'express';
import { body, param } from 'express-validator';
import { validate } from '../middleware/validator.js';
import { requireCompanyUser, requirePlatformAdmin } from '../middleware/authorize.js';
import { CompanyUserController } from '../controllers/companyUserController.js';

const router = express.Router();

const registerValidation = [
  body('company_id').isInt({ min: 1 }).withMessage('Valid company ID is required'),
  body('email').isEmail().withMessage('Valid email is required'),
  body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters'),
  body('name').trim().notEmpty().withMessage('Name is required'),
  body('role').optional().isIn(['user', 'admin']).withMessage('Invalid role'),
  validate,
];

const loginValidation = [
  body('email').isEmail().withMessage('Valid email is required'),
  body('password').notEmpty().withMessage('Password is required'),
  validate,
];

/**
 * @swagger
 * /api/company-users/register:
 *   post:
 *     summary: Registrar usuário de empresa (tradicional)
 *     tags: [Company Users]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - company_id
 *               - email
 *               - password
 *               - name
 *             properties:
 *               company_id:
 *                 type: integer
 *               email:
 *                 type: string
 *                 format: email
 *               password:
 *                 type: string
 *                 minLength: 6
 *               name:
 *                 type: string
 *               role:
 *                 type: string
 *                 enum: [user, admin]
 *     responses:
 *       201:
 *         description: Usuário criado
 *       400:
 *         description: Dados inválidos
 */
// Rotas públicas (com password)
router.post('/register', registerValidation, CompanyUserController.registerCompanyUser);

/**
 * @swagger
 * /api/company-users/login:
 *   post:
 *     summary: Login de usuário de empresa
 *     tags: [Company Users]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *               - password
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *               password:
 *                 type: string
 *     responses:
 *       200:
 *         description: Login realizado, retorna JWT
 *       401:
 *         description: Credenciais inválidas
 */
router.post('/login', loginValidation, CompanyUserController.loginCompanyUser);

/**
 * @swagger
 * /api/company-users:
 *   get:
 *     summary: Listar usuários da empresa
 *     tags: [Company Users]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Lista de usuários
 */
// Rotas para company_users autenticados
router.get('/', requireCompanyUser, CompanyUserController.getCompanyUsers);

/**
 * @swagger
 * /api/company-users/{id}:
 *   put:
 *     summary: Atualizar usuário de empresa
 *     tags: [Company Users]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Usuário atualizado
 */
router.put('/:id', requireCompanyUser, CompanyUserController.updateCompanyUser);

// ============================================================================
// PASSKEY WALLET REGISTRATION ROUTES
// ============================================================================

/**
 * @swagger
 * /api/company-users/register-passkey:
 *   post:
 *     summary: Registrar usuário com passkey
 *     description: Fluxo de registro sem senha
 *     tags: [Company Users]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - company_id
 *               - email
 *               - name
 *             properties:
 *               company_id:
 *                 type: integer
 *               email:
 *                 type: string
 *                 format: email
 *               name:
 *                 type: string
 *               role:
 *                 type: string
 *                 enum: [user, admin]
 *     responses:
 *       201:
 *         description: Email de verificação enviado
 */
// Step 1: Register with email verification (no password required)
router.post('/register-passkey', [
  body('company_id').isInt({ min: 1 }).withMessage('Valid company ID is required'),
  body('email').isEmail().withMessage('Valid email is required'),
  body('name').trim().notEmpty().withMessage('Name is required'),
  body('role').optional().isIn(['user', 'admin']).withMessage('Invalid role'),
  validate,
], CompanyUserController.registerWithPasskey);

/**
 * @swagger
 * /api/company-users/verify-email:
 *   post:
 *     summary: Verificar email
 *     tags: [Company Users]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - token
 *             properties:
 *               token:
 *                 type: string
 *     responses:
 *       200:
 *         description: Email verificado
 */
// Step 2: Verify email
router.post('/verify-email', [
  body('token').notEmpty().withMessage('Verification token is required'),
  validate,
], CompanyUserController.verifyEmail);

/**
 * @swagger
 * /api/company-users/resend-verification:
 *   post:
 *     summary: Reenviar email de verificação
 *     tags: [Company Users]
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
 *         description: Email reenviado
 */
// Resend verification email
router.post('/resend-verification', [
  body('email').isEmail().withMessage('Valid email is required'),
  validate,
], CompanyUserController.resendVerificationEmail);

/**
 * @swagger
 * /api/company-users/create-wallet:
 *   post:
 *     summary: Criar smart wallet
 *     tags: [Company Users]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - userId
 *               - credentialId
 *               - publicKey
 *             properties:
 *               userId:
 *                 type: integer
 *               credentialId:
 *                 type: string
 *               publicKey:
 *                 type: string
 *     responses:
 *       200:
 *         description: Wallet criada
 */
// Step 3: Create smart wallet after passkey registration
router.post('/create-wallet', [
  body('userId').isInt({ min: 1 }).withMessage('Valid user ID is required'),
  body('credentialId').notEmpty().withMessage('Credential ID is required'),
  body('publicKey').notEmpty().withMessage('Public key is required'),
  validate,
], CompanyUserController.createSmartWallet);

/**
 * @swagger
 * /api/company-users/{userId}/wallet-status:
 *   get:
 *     summary: Status da wallet do usuário
 *     tags: [Company Users]
 *     parameters:
 *       - in: path
 *         name: userId
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Status da wallet
 */
// Get wallet creation status
router.get('/:userId/wallet-status', CompanyUserController.getWalletStatus);

/**
 * @swagger
 * /api/company-users/passkey/config:
 *   get:
 *     summary: Configuração da passkey
 *     tags: [Company Users]
 *     responses:
 *       200:
 *         description: Configuração retornada
 */
// Get passkey kit configuration for frontend
router.get('/passkey/config', CompanyUserController.getPasskeyConfig);

export default router;

