import {
  generateRegistrationOptions,
  verifyRegistrationResponse,
  generateAuthenticationOptions,
  verifyAuthenticationResponse,
} from '@simplewebauthn/server';
import { PasskeyUser } from '../models/PasskeyUser.js';
import { StellarService } from './stellar.service.js';

/**
 * Serviço para gerenciar autenticação com Passkeys (WebAuthn)
 */
export class PasskeyService {
  static rpName = 'Stellar Security Tokens';
  static rpID = process.env.RP_ID || 'localhost';
  static origin = process.env.ORIGIN || 'http://localhost';

  /**
   * Gera opções para registro de passkey
   * @param {string} email - Email do usuário
   * @param {string} name - Nome do usuário
   * @returns {Promise<Object>} Opções de registro e ID do usuário
   */
  static async generateRegistrationOptions(email, name) {
    try {
      // Verificar se usuário já existe
      let user = await PasskeyUser.findByEmail(email);
      
      if (!user) {
        // Criar conta Stellar para o novo usuário
        console.log('Creating Stellar account for new user:', email);
        const stellarAccount = await StellarService.createInvestorAccount();
        
        // Criar usuário passkey
        user = await PasskeyUser.create({
          email,
          name,
          stellarPublicKey: stellarAccount.publicKey,
        });
        
        console.log('PasskeyUser created with Stellar account:', user.stellarPublicKey);
      }

      // Buscar credenciais existentes
      const existingCredentials = user.credentials || [];
      const excludeCredentials = existingCredentials.map(cred => ({
        id: Buffer.from(cred.credentialId, 'base64'),
        type: 'public-key',
        transports: ['internal', 'hybrid'],
      }));

      // Gerar opções de registro
      // Converter UUID string para Uint8Array (bytes)
      const userIdBytes = new TextEncoder().encode(user.id);
      
      const options = await generateRegistrationOptions({
        rpName: this.rpName,
        rpID: this.rpID,
        userID: userIdBytes,
        userName: email,
        userDisplayName: name,
        attestationType: 'none',
        excludeCredentials,
        authenticatorSelection: {
          residentKey: 'preferred',
          userVerification: 'discouraged',
          authenticatorAttachment: 'platform',
        },
      });

      // Salvar challenge temporário
      await PasskeyUser.updateChallenge(user.id, options.challenge);

      return { options, userId: user.id };
    } catch (error) {
      console.error('Error generating registration options:', error);
      throw error;
    }
  }

  /**
   * Verifica resposta de registro de passkey
   * @param {string} userId - ID do usuário
   * @param {Object} response - Resposta do cliente WebAuthn
   * @returns {Promise<Object>} Usuário verificado
   */
  static async verifyRegistration(userId, response) {
    try {
      const user = await PasskeyUser.findById(userId);
      if (!user || !user.currentChallenge) {
        throw new Error('Usuário não encontrado ou challenge inválido');
      }

      // Verificar resposta de registro
      const verification = await verifyRegistrationResponse({
        response,
        expectedChallenge: user.currentChallenge,
        expectedOrigin: this.origin,
        expectedRPID: this.rpID,
        requireUserVerification: false,
      });

      if (!verification.verified || !verification.registrationInfo) {
        throw new Error('Verificação de registro falhou');
      }

      const { credential } = verification.registrationInfo;
      
      // response.id já vem como base64 string do SimpleWebAuthn browser
      // Usar response.id diretamente, não credential.id
      const credentialIdBase64 = response.id;
      
      console.log('Saving credential with ID:', credentialIdBase64);
      
      // Adicionar credencial ao usuário
      await PasskeyUser.addCredential(userId, {
        credentialId: credentialIdBase64,
        credentialPublicKey: Buffer.from(credential.publicKey),
        counter: credential.counter,
        deviceName: this.getDeviceName(response),
      });

      // Limpar challenge
      await PasskeyUser.updateChallenge(userId, null);

      // Retornar usuário atualizado
      return await PasskeyUser.findById(userId);
    } catch (error) {
      console.error('Error verifying registration:', error);
      throw error;
    }
  }

  /**
   * Gera opções para autenticação com passkey
   * @returns {Promise<Object>} Opções de autenticação
   */
  static async generateAuthenticationOptions() {
    try {
      const options = await generateAuthenticationOptions({
        rpID: this.rpID,
        userVerification: 'preferred',
        timeout: 60000,
      });

      return options;
    } catch (error) {
      console.error('Error generating authentication options:', error);
      throw error;
    }
  }

  /**
   * Verifica resposta de autenticação com passkey
   * @param {Object} response - Resposta do cliente WebAuthn
   * @param {string} challenge - Challenge esperado
   * @returns {Promise<Object>} Usuário autenticado
   */
  static async verifyAuthentication(response, challenge) {
    try {
      // rawId já vem como string base64 do SimpleWebAuthn browser
      const credentialId = response.rawId;
      
      console.log('Looking for credential:', credentialId);
      
      // Buscar usuário pela credencial
      const user = await PasskeyUser.findByCredentialId(credentialId);
      if (!user) {
        console.log('User not found for credential:', credentialId);
        throw new Error('Usuário não encontrado para esta credencial');
      }
      
      console.log('User found:', user.email);

      // Buscar credencial específica
      const credential = user.credentials.find(
        cred => cred.credentialId === credentialId
      );

      if (!credential) {
        throw new Error('Credencial não encontrada');
      }

      // Verificar resposta de autenticação
      const verification = await verifyAuthenticationResponse({
        response,
        expectedChallenge: challenge,
        expectedOrigin: this.origin,
        expectedRPID: this.rpID,
        credential: {
          id: Buffer.from(credential.credentialId, 'base64'),
          publicKey: credential.credentialPublicKey,
          counter: Number(credential.counter),
        },
        requireUserVerification: false,
      });

      if (!verification.verified) {
        throw new Error('Autenticação falhou');
      }

      // Atualizar counter da credencial
      await PasskeyUser.updateCredentialCounter(
        credentialId,
        verification.authenticationInfo.newCounter
      );

      return user;
    } catch (error) {
      console.error('Error verifying authentication:', error);
      throw error;
    }
  }

  /**
   * Extrai nome do dispositivo da resposta WebAuthn
   * @param {Object} response - Resposta WebAuthn
   * @returns {string} Nome do dispositivo
   */
  static getDeviceName(response) {
    const userAgent = response.userAgent || 'Unknown Device';
    
    if (userAgent.includes('iPhone')) return 'iPhone';
    if (userAgent.includes('iPad')) return 'iPad';
    if (userAgent.includes('Mac')) return 'Mac';
    if (userAgent.includes('Windows')) return 'Windows PC';
    if (userAgent.includes('Android')) return 'Android';
    if (userAgent.includes('Linux')) return 'Linux';
    
    return 'Unknown Device';
  }
}
