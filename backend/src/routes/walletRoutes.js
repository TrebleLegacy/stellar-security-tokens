import express from 'express';
import { WalletController } from '../controllers/walletController.js';
import { authenticateToken } from '../middleware/auth.js';
import { requirePlatformAdmin } from '../middleware/authorize.js';

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
router.get('/transactions', WalletController.getTransactionProposals);
router.post('/transactions', WalletController.createTransactionProposal);

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
router.post('/transactions/:id/submit', WalletController.signAndSubmitProposal);

export default router;
