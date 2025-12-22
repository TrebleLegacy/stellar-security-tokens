import swaggerJsdoc from 'swagger-jsdoc';
import swaggerUi from 'swagger-ui-express';

const options = {
    definition: {
        openapi: '3.0.0',
        info: {
            title: 'Stellar Security Tokens API',
            version: '1.0.0',
            description: 'API REST para tokenização de security tokens no Stellar blockchain. Gerencia investidores, empresas, ofertas, tokens e pagamentos.',
            contact: {
                name: 'API Support',
            },
        },
        servers: [
            {
                url: process.env.API_URL || 'http://localhost:3000',
                description: 'API Server',
            },
        ],
        components: {
            securitySchemes: {
                bearerAuth: {
                    type: 'http',
                    scheme: 'bearer',
                    bearerFormat: 'JWT',
                    description: 'JWT token obtido via login',
                },
            },
            schemas: {
                Error: {
                    type: 'object',
                    properties: {
                        success: { type: 'boolean', example: false },
                        error: { type: 'string' },
                    },
                },
                Success: {
                    type: 'object',
                    properties: {
                        success: { type: 'boolean', example: true },
                        data: { type: 'object' },
                    },
                },
                Investor: {
                    type: 'object',
                    properties: {
                        id: { type: 'integer' },
                        name: { type: 'string' },
                        email: { type: 'string', format: 'email' },
                        document: { type: 'string' },
                        stellarContractId: { type: 'string' },
                        kycStatus: { type: 'string', enum: ['pending', 'approved', 'rejected'] },
                        emailVerified: { type: 'boolean' },
                        createdAt: { type: 'string', format: 'date-time' },
                    },
                },
                Company: {
                    type: 'object',
                    properties: {
                        id: { type: 'integer' },
                        name: { type: 'string' },
                        cnpj: { type: 'string' },
                        email: { type: 'string', format: 'email' },
                        legal_representative: { type: 'string' },
                        status: { type: 'string', enum: ['pending', 'approved', 'rejected'] },
                        createdAt: { type: 'string', format: 'date-time' },
                    },
                },
                Offer: {
                    type: 'object',
                    properties: {
                        id: { type: 'integer' },
                        asset_code: { type: 'string' },
                        offer_name: { type: 'string' },
                        description: { type: 'string' },
                        total_supply: { type: 'number' },
                        annual_interest_rate: { type: 'number' },
                        offer_type: { type: 'string', enum: ['collateral', 'sale'] },
                        status: { type: 'string', enum: ['pending', 'under_review', 'approved', 'rejected', 'active'] },
                        createdAt: { type: 'string', format: 'date-time' },
                    },
                },
                Token: {
                    type: 'object',
                    properties: {
                        id: { type: 'integer' },
                        assetCode: { type: 'string' },
                        totalSupply: { type: 'number' },
                        issuerPublicKey: { type: 'string' },
                        distributorPublicKey: { type: 'string' },
                        description: { type: 'string' },
                        createdAt: { type: 'string', format: 'date-time' },
                    },
                },
                Investment: {
                    type: 'object',
                    properties: {
                        id: { type: 'integer' },
                        investorId: { type: 'integer' },
                        offerId: { type: 'integer' },
                        usdcAmount: { type: 'number' },
                        tokenAmount: { type: 'number' },
                        status: { type: 'string', enum: ['pending', 'completed', 'failed'] },
                        createdAt: { type: 'string', format: 'date-time' },
                    },
                },
            },
        },
        tags: [
            { name: 'Health', description: 'Health check endpoint' },
            { name: 'Auth', description: 'Autenticação geral' },
            { name: 'WebAuthn', description: 'Autenticação via passkey (WebAuthn)' },
            { name: 'Investors', description: 'Gestão de investidores' },
            { name: 'Companies', description: 'Gestão de empresas' },
            { name: 'Company Users', description: 'Usuários de empresas' },
            { name: 'Offers', description: 'Ofertas de security tokens' },
            { name: 'Tokens', description: 'Emissão e gestão de tokens' },
            { name: 'Investments', description: 'Investimentos em ofertas' },
            { name: 'Payments', description: 'Processamento de pagamentos' },
            { name: 'Platform Admin', description: 'Administração da plataforma' },
        ],
    },
    apis: ['./src/routes/*.js', './src/app.js'],
};

const swaggerSpec = swaggerJsdoc(options);

export { swaggerUi, swaggerSpec };
