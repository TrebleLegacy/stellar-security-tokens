import { generateToken } from '../../src/middleware/auth.js';
import prisma from '../../src/config/prisma.js';
import bcrypt from 'bcrypt';

/**
 * Helper to generate a valid JWT token for an investor
 * @param {Object} investor - Prisma investor object
 * @returns {string} Bearer token
 */
export const getInvestorToken = (investor) => {
    return generateToken({
        userId: investor.id,
        email: investor.email,
        userType: 'investor',
        role: 'investor'
    });
};

/**
 * Helper to generate a valid JWT token for a platform admin
 * @param {Object} admin - Prisma admin object
 * @returns {string} Bearer token
 */
export const getAdminToken = (admin) => {
    return generateToken({
        userId: admin.id,
        email: admin.email,
        role: admin.role, // e.g. 'super_admin'
        userType: 'admin'
    });
};

/**
 * Create a test admin in the database
 * @returns {Promise<Object>} Created admin
 */
export const createTestAdmin = async () => {
    const email = `admin-${Date.now()}@example.com`;
    const passwordHash = await bcrypt.hash('password123', 10);

    return await prisma.platformAdmin.create({
        data: {
            name: 'Test Admin',
            email,
            passwordHash,
            role: 'super_admin',
            isActive: true,
        }
    });
};
