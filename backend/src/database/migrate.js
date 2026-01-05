import { execSync } from 'child_process';
import path from 'path';
import { fileURLToPath } from 'url';
import prisma from '../config/prisma.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function migrate() {
  try {
    console.log('Running database migrations...');

    // Get backend directory path
    const backendDir = path.resolve(__dirname, '../..');
    console.log('Current directory:', __dirname);
    console.log('Backend directory:', backendDir);

    // Run Prisma migrations from backend directory
    console.log('Running: npx prisma migrate deploy');
    execSync('npx prisma migrate deploy', {
      stdio: 'inherit',
      cwd: backendDir
    });

    // Generate Prisma client from backend directory
    console.log('Running: npx prisma generate');
    execSync('npx prisma generate', {
      stdio: 'inherit',
      cwd: backendDir
    });

    console.log('Database migration completed successfully!');
  } catch (error) {
    console.error('Migration failed:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

migrate();
