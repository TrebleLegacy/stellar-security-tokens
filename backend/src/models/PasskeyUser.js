import prisma from '../config/prisma.js';

/**
 * Modelo para gerenciar usuários de passkey usando Prisma
 */
export class PasskeyUser {
  /**
   * Cria um novo usuário passkey
   * @param {Object} userData - Dados do usuário
   * @param {string} userData.email - Email do usuário (único)
   * @param {string} userData.name - Nome do usuário
   * @param {string} userData.stellarPublicKey - Chave pública Stellar (56 caracteres)
   * @returns {Promise<Object>} Usuário criado
   */
  static async create(userData) {
    const { email, name, stellarPublicKey } = userData;

    // Validar formato da chave Stellar
    if (!/^G[A-Z0-9]{55}$/.test(stellarPublicKey)) {
      throw new Error('stellarPublicKey deve ter 56 caracteres e começar com G');
    }

    return await prisma.passkeyUser.create({
      data: {
        email,
        name,
        stellarPublicKey,
      },
      include: {
        credentials: true,
      },
    });
  }

  /**
   * Busca usuário por email
   * @param {string} email - Email do usuário
   * @returns {Promise<Object|null>} Usuário encontrado ou null
   */
  static async findByEmail(email) {
    return await prisma.passkeyUser.findUnique({
      where: { email },
      include: {
        credentials: true,
      },
    });
  }

  /**
   * Busca usuário por ID
   * @param {string} id - ID do usuário
   * @returns {Promise<Object|null>} Usuário encontrado ou null
   */
  static async findById(id) {
    return await prisma.passkeyUser.findUnique({
      where: { id },
      include: {
        credentials: true,
      },
    });
  }

  /**
   * Busca usuário por ID de credencial
   * @param {string} credentialId - ID da credencial
   * @returns {Promise<Object|null>} Usuário encontrado ou null
   */
  static async findByCredentialId(credentialId) {
    const credential = await prisma.passkeyCredential.findUnique({
      where: { credentialId },
      include: {
        passkeyUser: {
          include: {
            credentials: true,
          },
        },
      },
    });

    return credential?.passkeyUser || null;
  }

  /**
   * Atualiza o challenge atual do usuário
   * @param {string} userId - ID do usuário
   * @param {string|null} challenge - Challenge atual ou null para limpar
   * @returns {Promise<Object>} Usuário atualizado
   */
  static async updateChallenge(userId, challenge) {
    return await prisma.passkeyUser.update({
      where: { id: userId },
      data: { currentChallenge: challenge },
    });
  }

  /**
   * Adiciona uma credencial ao usuário
   * @param {string} userId - ID do usuário
   * @param {Object} credentialData - Dados da credencial
   * @param {string} credentialData.credentialId - ID da credencial
   * @param {Buffer} credentialData.credentialPublicKey - Chave pública da credencial
   * @param {number} credentialData.counter - Counter da credencial
   * @param {string} [credentialData.deviceName] - Nome do dispositivo
   * @returns {Promise<Object>} Credencial criada
   */
  static async addCredential(userId, credentialData) {
    const { credentialId, credentialPublicKey, counter, deviceName } = credentialData;

    return await prisma.passkeyCredential.create({
      data: {
        passkeyUserId: userId,
        credentialId,
        credentialPublicKey,
        counter,
        deviceName,
      },
    });
  }

  /**
   * Atualiza o counter de uma credencial
   * @param {string} credentialId - ID da credencial
   * @param {number} newCounter - Novo valor do counter
   * @returns {Promise<Object>} Credencial atualizada
   */
  static async updateCredentialCounter(credentialId, newCounter) {
    return await prisma.passkeyCredential.update({
      where: { credentialId },
      data: {
        counter: newCounter,
        lastUsedAt: new Date(),
      },
    });
  }

  /**
   * Lista todos os usuários passkey
   * @returns {Promise<Object[]>} Lista de usuários
   */
  static async findAll() {
    return await prisma.passkeyUser.findMany({
      include: {
        credentials: true,
      },
      orderBy: {
        createdAt: 'desc',
      },
    });
  }

  /**
   * Remove um usuário passkey
   * @param {string} userId - ID do usuário
   * @returns {Promise<Object>} Usuário removido
   */
  static async delete(userId) {
    return await prisma.passkeyUser.delete({
      where: { id: userId },
    });
  }
}
