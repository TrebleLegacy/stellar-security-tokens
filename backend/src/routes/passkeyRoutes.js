import express from 'express';
import { PasskeyController } from '../controllers/passkeyController.js';
import { authenticateToken } from '../middleware/auth.js';

const router = express.Router();

/**
 * Rotas de autenticação com Passkey (WebAuthn)
 */

// Registro de passkey
router.post('/register/start', PasskeyController.startRegistration);
router.post('/register/verify', PasskeyController.verifyRegistration);

// Autenticação com passkey
router.post('/login/start', PasskeyController.startAuthentication);
router.post('/login/verify', PasskeyController.verifyAuthentication);

// Informações do usuário autenticado (requer autenticação)
router.get('/me', authenticateToken, PasskeyController.getMe);

export default router;
