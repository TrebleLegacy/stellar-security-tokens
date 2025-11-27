import prisma from '../../src/config/prisma.js';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';

/**
 * Creates a test platform admin and returns the admin object with JWT token
 */
export const createTestAdmin = async () => {
    const passwordHash = await bcrypt.hash('adminpassword', 10);

    const admin = await prisma.platformAdmin.create({
        data: {
            name: 'Test Admin',
            email: `test-admin-${Date.now()}@example.com`,
            passwordHash,
            role: 'super_admin',
        },
    });

    // Generate JWT token for the admin
    const token = jwt.sign(
        { id: admin.id, role: 'admin', email: admin.email },
        process.env.JWT_SECRET || 'test_secret',
        { expiresIn: '24h' }
    );

    return {
        ...admin,
        token,
    };
};
