import prisma from '../backend/src/config/prisma.js';
import bcrypt from 'bcrypt';
import crypto from 'crypto';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load env from root
dotenv.config({ path: path.join(__dirname, '..', '.env') });

async function bootstrapAdmins() {
    const adminsToCreate = [
        {
            email: process.env.ADMIN_1_EMAIL,
            name: process.env.ADMIN_1_NAME || 'Admin One',
            role: 'super_admin'
        },
        {
            email: process.env.ADMIN_2_EMAIL,
            name: process.env.ADMIN_2_NAME || 'Admin Two',
            role: 'admin'
        }
    ];

    console.log('\n🚀 Starting Admin Bootstrapping...\n');

    for (const admin of adminsToCreate) {
        if (!admin.email) {
            console.warn(`⚠️  Skipping an admin entry: EMAIL missing in .env`);
            continue;
        }

        try {
            // Check if exists
            const existing = await prisma.platformAdmin.findUnique({
                where: { email: admin.email }
            });

            // Generate a one-time secure password
            const tempPassword = crypto.randomBytes(8).toString('hex');
            const passwordHash = await bcrypt.hash(tempPassword, 10);

            if (existing) {
                await prisma.platformAdmin.update({
                    where: { email: admin.email },
                    data: {
                        name: admin.name,
                        role: admin.role,
                        passwordHash,
                        isActive: true
                    }
                });
                console.log(`✅ UPDATED Admin: ${admin.email}`);
            } else {
                await prisma.platformAdmin.create({
                    data: {
                        email: admin.email,
                        name: admin.name,
                        role: admin.role,
                        passwordHash,
                        isActive: true
                    }
                });
                console.log(`✅ CREATED Admin: ${admin.email}`);
            }

            console.log(`🔑 TEMPORARY PASSWORD: ${tempPassword}`);
            console.log(`👉 Use this email and password for the FIRST login ONLY.`);
            console.log(`👉 After logging in, go to Settings to register a Passkey.\n`);

        } catch (error) {
            console.error(`❌ Error processing ${admin.email}:`, error.message);
        }
    }

    console.log('✨ Bootstrapping complete. Logout and use these credentials to set up Passkeys.');
    await prisma.$disconnect();
}

bootstrapAdmins();
