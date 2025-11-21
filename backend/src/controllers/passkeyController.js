import { PasskeyService } from '../services/passkey.service.js';
import { generateToken } from '../middleware/auth.js';

/**
 * Controller para autenticação com Passkeys (WebAuthn)
 */
export class PasskeyController {
  /**
   * Inicia o processo de registro de passkey
   * POST /api/passkey/register/start
   */
  static async startRegistration(req, res) {
    try {
      const { email, name } = req.body;

      if (!email || !name) {
        return res.status(400).json({
          success: false,
          error: 'Email e nome são obrigatórios',
        });
      }

      // Validar formato de email
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(email)) {
        return res.status(400).json({
          success: false,
          error: 'Email inválido',
        });
      }

      const { options, userId } = await PasskeyService.generateRegistrationOptions(
        email,
        name
      );

      // Salvar challenge e userId na sessão
      req.session.challenge = options.challenge;
      req.session.userId = userId;

      // Salvar sessão explicitamente
      await new Promise((resolve, reject) => {
        req.session.save((err) => {
          if (err) reject(err);
          else resolve();
        });
      });

      console.log('Session saved:', { userId, sessionId: req.sessionID });

      res.json({
        success: true,
        options,
        userId,
      });
    } catch (error) {
      console.error('Error in startRegistration:', error);
      res.status(500).json({
        success: false,
        error: error.message || 'Erro ao iniciar registro',
      });
    }
  }

  /**
   * Verifica o registro de passkey
   * POST /api/passkey/register/verify
   */
  static async verifyRegistration(req, res) {
    try {
      const { userId, response } = req.body;

      console.log('Verify registration request:', {
        userId,
        sessionUserId: req.session.userId,
        sessionId: req.sessionID,
        hasResponse: !!response,
      });

      if (!userId || !response) {
        return res.status(400).json({
          success: false,
          error: 'userId e response são obrigatórios',
        });
      }

      // Verificar se o userId da sessão corresponde
      if (req.session.userId !== userId) {
        console.log('Session mismatch:', {
          sessionUserId: req.session.userId,
          requestUserId: userId,
        });
        return res.status(400).json({
          success: false,
          error: 'Sessão inválida',
        });
      }

      const user = await PasskeyService.verifyRegistration(userId, response);

      // Limpar sessão
      delete req.session.challenge;
      delete req.session.userId;

      // Gerar JWT token
      const token = generateToken({
        id: user.id,
        userId: user.id,
        email: user.email,
        role: 'passkey_user',
        stellarPublicKey: user.stellarPublicKey,
      });

      res.json({
        success: true,
        user: {
          id: user.id,
          email: user.email,
          name: user.name,
          stellarPublicKey: user.stellarPublicKey,
          createdAt: user.createdAt,
        },
        token,
      });
    } catch (error) {
      console.error('Error in verifyRegistration:', error);
      res.status(500).json({
        success: false,
        error: error.message || 'Erro ao verificar registro',
      });
    }
  }

  /**
   * Inicia o processo de autenticação com passkey
   * POST /api/passkey/login/start
   */
  static async startAuthentication(req, res) {
    try {
      const options = await PasskeyService.generateAuthenticationOptions();

      // Salvar challenge na sessão
      req.session.challenge = options.challenge;

      res.json({
        success: true,
        options,
      });
    } catch (error) {
      console.error('Error in startAuthentication:', error);
      res.status(500).json({
        success: false,
        error: error.message || 'Erro ao iniciar autenticação',
      });
    }
  }

  /**
   * Verifica a autenticação com passkey
   * POST /api/passkey/login/verify
   */
  static async verifyAuthentication(req, res) {
    try {
      const { response } = req.body;

      if (!response) {
        return res.status(400).json({
          success: false,
          error: 'response é obrigatório',
        });
      }

      const challenge = req.session?.challenge;
      if (!challenge) {
        return res.status(400).json({
          success: false,
          error: 'Challenge não encontrado. Por favor, inicie o login novamente.',
        });
      }

      const user = await PasskeyService.verifyAuthentication(response, challenge);

      // Limpar challenge da sessão
      delete req.session.challenge;

      // Gerar JWT token
      const token = generateToken({
        id: user.id,
        userId: user.id,
        email: user.email,
        role: 'passkey_user',
        stellarPublicKey: user.stellarPublicKey,
      });

      res.json({
        success: true,
        user: {
          id: user.id,
          email: user.email,
          name: user.name,
          stellarPublicKey: user.stellarPublicKey,
          createdAt: user.createdAt,
        },
        token,
      });
    } catch (error) {
      console.error('Error in verifyAuthentication:', error);
      res.status(500).json({
        success: false,
        error: error.message || 'Erro ao verificar autenticação',
      });
    }
  }

  /**
   * Obtém informações do usuário autenticado
   * GET /api/passkey/me
   */
  static async getMe(req, res) {
    try {
      const userId = req.user?.userId || req.user?.id;

      if (!userId) {
        return res.status(401).json({
          success: false,
          error: 'Não autenticado',
        });
      }

      const user = await PasskeyService.findById(userId);

      if (!user) {
        return res.status(404).json({
          success: false,
          error: 'Usuário não encontrado',
        });
      }

      res.json({
        success: true,
        user: {
          id: user.id,
          email: user.email,
          name: user.name,
          stellarPublicKey: user.stellarPublicKey,
          createdAt: user.createdAt,
          credentialsCount: user.credentials?.length || 0,
        },
      });
    } catch (error) {
      console.error('Error in getMe:', error);
      res.status(500).json({
        success: false,
        error: error.message || 'Erro ao buscar informações do usuário',
      });
    }
  }
}
