import express from 'express';
import { body } from 'express-validator';
import { validate } from '../middleware/validator.js';
import { requireCompanyUser, requirePlatformAdmin } from '../middleware/authorize.js';
import { CompanyController } from '../controllers/companyController.js';

const router = express.Router();

const registerValidation = [
  body('name').trim().notEmpty().withMessage('Name is required'),
  body('cnpj').trim().notEmpty().withMessage('CNPJ is required'),
  body('email').isEmail().withMessage('Valid email is required'),
  body('legal_representative').trim().notEmpty().withMessage('Legal representative is required'),
  body('address').optional().isString(),
  body('phone').optional().isString(),
  validate,
];

/**
 * @swagger
 * /api/companies/register:
 *   post:
 *     summary: Registrar nova empresa
 *     description: Cadastra uma nova empresa na plataforma
 *     tags: [Companies]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - name
 *               - cnpj
 *               - email
 *               - legal_representative
 *             properties:
 *               name:
 *                 type: string
 *                 example: Empresa ABC Ltda
 *               cnpj:
 *                 type: string
 *                 example: "12.345.678/0001-99"
 *               email:
 *                 type: string
 *                 format: email
 *               legal_representative:
 *                 type: string
 *               address:
 *                 type: string
 *               phone:
 *                 type: string
 *     responses:
 *       201:
 *         description: Empresa registrada com sucesso
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Success'
 *       400:
 *         description: Dados inválidos
 */
// Rotas públicas
router.post('/register', registerValidation, CompanyController.registerCompany);

// Rota de debug para aprovar empresa sem autenticação (apenas em desenvolvimento)
if (process.env.NODE_ENV !== 'production') {
  router.put('/debug/:id/approve', CompanyController.debugApproveCompany);
}

/**
 * @swagger
 * /api/companies/profile:
 *   get:
 *     summary: Obter perfil da empresa
 *     description: Retorna dados da empresa do usuário autenticado
 *     tags: [Companies]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Perfil da empresa
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Company'
 *       401:
 *         description: Não autorizado
 *   put:
 *     summary: Atualizar perfil da empresa
 *     description: Atualiza dados da empresa do usuário autenticado
 *     tags: [Companies]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               address:
 *                 type: string
 *               phone:
 *                 type: string
 *     responses:
 *       200:
 *         description: Perfil atualizado
 *       401:
 *         description: Não autorizado
 */
// Rotas para company_users
router.get('/profile', requireCompanyUser, CompanyController.getCompanyProfile);
router.put('/profile', requireCompanyUser, CompanyController.updateCompanyProfile);

/**
 * @swagger
 * /api/companies/admin/{id}:
 *   get:
 *     summary: "[Admin] Detalhes de uma empresa"
 *     tags: [Companies]
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
 *         description: Detalhes da empresa
 *       404:
 *         description: Empresa não encontrada
 */
router.get('/admin/:id', requirePlatformAdmin, CompanyController.getCompanyDetails);

/**
 * @swagger
 * /api/companies/offers:
 *   get:
 *     summary: Listar ofertas da empresa
 *     description: Retorna todas as ofertas criadas pela empresa
 *     tags: [Companies]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Lista de ofertas
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Offer'
 */
router.get('/offers', requireCompanyUser, CompanyController.getCompanyOffers);

/**
 * @swagger
 * /api/companies/admin/companies:
 *   get:
 *     summary: "[Admin] Listar todas as empresas"
 *     description: Lista todas as empresas cadastradas (apenas admin)
 *     tags: [Companies]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Lista de empresas
 *       401:
 *         description: Não autorizado
 *       403:
 *         description: Acesso negado
 */
// Rotas para platform_admins
router.get('/admin/companies', requirePlatformAdmin, CompanyController.getAllCompanies);

/**
 * @swagger
 * /api/companies/admin/companies/{id}/status:
 *   put:
 *     summary: "[Admin] Atualizar status da empresa"
 *     description: Aprova ou rejeita uma empresa
 *     tags: [Companies]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               status:
 *                 type: string
 *                 enum: [approved, rejected]
 *     responses:
 *       200:
 *         description: Status atualizado
 *       404:
 *         description: Empresa não encontrada
 */
router.put('/admin/companies/:id/status', requirePlatformAdmin, CompanyController.updateCompanyStatus);

export default router;

