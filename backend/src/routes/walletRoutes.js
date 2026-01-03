import express from 'express';
import { body, param, query } from 'express-validator';
import { WalletController } from '../controllers/walletController.js';
import { authenticateToken } from '../middleware/auth.js';
import { requirePlatformAdmin } from '../middleware/authorize.js';
import { validate } from '../middleware/validator.js';

const router = express.Router();

// All routes require Platform Admin access
router.use(authenticateToken, requirePlatformAdmin);

/**
 * @swagger
 * tags:
 *   name: Wallets
 *   description: System Wallet Management and Multisig
 */

/**
 * @swagger
 * /api/wallets:
 *   get:
 *     summary: Get status and balances of system wallets
 *     tags: [Wallets]
 *     responses:
 *       200:
 *         description: List of wallets with balances
 */
router.get('/', WalletController.getWalletStatuses);

/**
 * @swagger
 * /api/wallets/transactions:
 *   get:
 *     summary: List transaction proposals
 *     tags: [Wallets]
 *     parameters:
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [pending, executed, rejected]
 *     responses:
 *       200:
 *         description: List of transactions
 *   post:
 *     summary: Create a new transaction proposal
 *     tags: [Wallets]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - sourceWallet
 *               - amount
 *               - destination
 *             properties:
 *               sourceWallet:
 *                 type: string
 *                 enum: [treasury, issuer, distributor]
 *               amount:
 *                 type: string
 *               destination:
 *                 type: string
 *               assetCode:
 *                 type: string
 *               description:
 *                 type: string
 *     responses:
 *       201:
 *         description: Proposal created
 */
router.get('/transactions',
    query('status').optional().isIn(['pending', 'executed', 'rejected']).withMessage('Invalid status filter'),
    validate,
    WalletController.getTransactionProposals
);

router.post('/transactions',
    body('sourceWallet').isIn(['treasury', 'issuer', 'distributor']).withMessage('Invalid source wallet'),
    body('amount').isNumeric().withMessage('Amount must be numeric'),
    body('destination').isString().isLength({ min: 56, max: 56 }).withMessage('Destination must be a valid Stellar address'),
    body('assetCode').optional().isString().isLength({ max: 12 }).withMessage('Asset code must be 12 characters or less'),
    body('description').optional().isString().isLength({ max: 500 }).withMessage('Description must be 500 characters or less'),
    validate,
    WalletController.createTransactionProposal
);

/**
 * @swagger
 * /api/wallets/transactions/{id}/submit:
 *   post:
 *     summary: Submit a signed transaction proposal
 *     tags: [Wallets]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: integer }
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [signedXDR]
 *             properties:
 *               signedXDR:
 *                 type: string
 *     responses:
 *       200:
 *         description: Transaction submitted or updated
 */
router.post('/transactions/:id/submit',
    param('id').isInt({ min: 1 }).withMessage('Transaction ID must be a positive integer'),
    body('signedXDR').isString().notEmpty().withMessage('signedXDR is required'),
    validate,
    WalletController.signAndSubmitProposal
);

export default router;
